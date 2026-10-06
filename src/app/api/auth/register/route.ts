import { NextResponse } from 'next/server';
import { getUserByUsername, saveUser, logActivity, listAllUsers } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawUsername = (body.username || '').trim();
    const rawPassword = body.password || '';
    const rawEmail = (body.email || '').trim().toLowerCase();
    const rawName = (body.name || '').trim();
    const rawBio = (body.bio || '').trim();
    const avatarUrl = body.avatarUrl;

    if (!rawUsername) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (!rawPassword || rawPassword.length < 3) {
      return NextResponse.json(
        { error: 'Password must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Clean username: lowercase, trim, convert spaces to hyphens
    const cleanUsername = rawUsername
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');

    if (cleanUsername.length < 2) {
      return NextResponse.json(
        { error: 'Username must contain at least 2 alphanumeric characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await getUserByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json(
        { error: `The username "@${cleanUsername}" is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    // Check if email already exists if email provided
    if (rawEmail) {
      const allUsers = await listAllUsers();
      const emailExists = allUsers.some(
        (u) => u.email && u.email.toLowerCase() === rawEmail
      );
      if (emailExists) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(rawPassword);
    const defaultAvatar =
      avatarUrl ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`;

    const newUser = {
      id: `usr_${cleanUsername}_${Date.now()}`,
      username: cleanUsername,
      email: rawEmail || `${cleanUsername}@eluivie.local`,
      passwordHash,
      name: rawName || cleanUsername,
      bio: rawBio || 'Building on Eluivie.',
      avatarUrl: defaultAvatar,
      createdAt: new Date().toISOString(),
      followers: [],
      following: [],
      starredRepos: [],
      isVerified: false,
    };

    // Save to GitHub database repository (eluivie-db-users)
    await saveUser(newUser);

    // Create session in GitHub database
    const sessionToken = await createSession(cleanUsername);

    // Log new user registration in activity feed
    await logActivity({
      type: 'user_registered',
      actor: cleanUsername,
      actorAvatar: defaultAvatar,
      details: 'Created an account on Eluivie',
    });

    const { passwordHash: _, ...safeUser } = newUser;
    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token: sessionToken,
    });

    // Set persistent session cookie
    response.cookies.set('eluivie_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { error: err.message || 'Registration failed. Please check connection and try again.' },
      { status: 500 }
    );
  }
}
