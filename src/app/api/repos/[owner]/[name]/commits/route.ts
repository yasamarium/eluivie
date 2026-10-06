import { NextResponse } from 'next/server';
import { fetchRepoCommits } from '@/lib/githubGit';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const { owner, name } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const commits = await fetchRepoCommits(owner, name, limit);
    return NextResponse.json({ commits });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch commits' },
      { status: 500 }
    );
  }
}
