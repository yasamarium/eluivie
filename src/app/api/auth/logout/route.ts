import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST() {
  try {
    await logoutUser();
    const response = NextResponse.json({ success: true });
    response.cookies.delete('eluivie_session');
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
