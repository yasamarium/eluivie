import { NextResponse } from 'next/server';
import { fetchRepoContents, commitFileChanges, deleteRepoFile } from '@/lib/githubGit';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const { owner, name } = await params;
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || '';
    const ref = searchParams.get('ref') || undefined;

    const contents = await fetchRepoContents(owner, name, path, ref);

    if (!contents) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    return NextResponse.json({ contents });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch contents' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { owner, name } = await params;
    const { path, content, message, sha, branch } = await req.json();

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: 'Path and content are required' },
        { status: 400 }
      );
    }

    const commitMsg = message || `Update ${path} via Eluivie`;
    const result = await commitFileChanges(
      owner,
      name,
      path,
      content,
      commitMsg,
      sha,
      branch || 'main'
    );

    await logActivity({
      type: 'commit',
      actor: user.username,
      actorAvatar: user.avatarUrl,
      repoOwner: owner,
      repoName: name,
      details: commitMsg,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to commit changes' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { owner, name } = await params;
    const { path, sha, message, branch } = await req.json();

    if (!path || !sha) {
      return NextResponse.json(
        { error: 'Path and SHA are required to delete a file' },
        { status: 400 }
      );
    }

    const commitMsg = message || `Delete ${path} via Eluivie`;
    const ok = await deleteRepoFile(owner, name, path, sha, commitMsg, branch || 'main');

    if (ok) {
      await logActivity({
        type: 'commit',
        actor: user.username,
        actorAvatar: user.avatarUrl,
        repoOwner: owner,
        repoName: name,
        details: commitMsg,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}
