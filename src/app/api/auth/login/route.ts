import { NextResponse } from 'next/server';
import { getUserByIdentifier, logActivity } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.username || body.email || body.identifier || '').trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Please enter your username/email and password' },
        { status: 400 }
      );
    }

    const user = await getUserByIdentifier(identifier);
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this username or email' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    const sessionToken = await createSession(user.username);

    await logActivity({
      type: 'user_registered',
      actor: user.username,
      details: 'Logged into session',
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
