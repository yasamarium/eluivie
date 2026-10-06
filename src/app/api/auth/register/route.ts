import { NextResponse } from 'next/server';
import { getUserByUsername, saveUser, logActivity } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password, email, name, bio, avatarUrl } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 alphanumeric characters' },
        { status: 400 }
      );
    }

    const existing = await getUserByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`;

    const newUser = {
      id: `usr_${cleanUsername}_${Date.now()}`,
      username: cleanUsername,
      email: email || `${cleanUsername}@eluivie.local`,
      passwordHash,
      name: name || cleanUsername,
      bio: bio || 'Building on Eluivie.',
      avatarUrl: defaultAvatar,
      createdAt: new Date().toISOString(),
      followers: [],
      following: [],
      starredRepos: [],
    };

    await saveUser(newUser);

    const sessionToken = await createSession(cleanUsername);

    await logActivity({
      type: 'user_registered',
      actor: cleanUsername,
      details: 'Created an account on Eluivie',
    });

    const { passwordHash: _, ...safeUser } = newUser;
    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token: sessionToken,
    });

    response.cookies.set('eluivie_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
