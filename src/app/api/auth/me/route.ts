import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ authenticated: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch current user' },
      { status: 500 }
    );
  }
}
