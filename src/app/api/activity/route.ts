import { NextResponse } from 'next/server';
import { getGlobalFeed } from '@/lib/db';

export async function GET() {
  try {
    const feed = await getGlobalFeed();
    return NextResponse.json({ feed });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
