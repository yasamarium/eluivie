import { NextResponse } from 'next/server';
import { getUserByUsername, logActivity } from '@/lib/db';
import { verifyPassword, createSession, ensureOwnerAccount } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim();
    await ensureOwnerAccount();

    const user = await getUserByUsername(cleanUsername);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sessionToken = await createSession(user.username);

    await logActivity({
      type: 'user_registered',
      actor: user.username,
      details: 'Logged into Eluivie session',
    });

    const { passwordHash, ...safeUser } = user;
    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token: sessionToken,
    });

    // Set secure cookie
    response.cookies.set('eluivie_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Login failed' },
      { status: 500 }
    );
  }
}
