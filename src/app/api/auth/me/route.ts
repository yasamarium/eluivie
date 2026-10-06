import { NextResponse } from 'next/server';
import { getCurrentUser, ensureOwnerAccount } from '@/lib/auth';

export async function GET() {
  try {
    // Ensure owner account exists
    await ensureOwnerAccount();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Don't send back password hash
    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ authenticated: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch current user' },
      { status: 500 }
    );
  }
}
