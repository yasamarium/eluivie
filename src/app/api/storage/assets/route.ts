import { NextResponse } from 'next/server';
import { listAllStorageAssets } from '@/lib/db';

export async function GET() {
  try {
    const assets = await listAllStorageAssets();
    return NextResponse.json({ assets });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to list assets' },
      { status: 500 }
    );
  }
}
