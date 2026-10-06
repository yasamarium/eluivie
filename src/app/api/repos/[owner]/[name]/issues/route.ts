import { NextResponse } from 'next/server';
import { getIssues, saveIssue, IssueRecord, logActivity } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const { owner, name } = await params;
    const issues = await getIssues(owner, name);
    return NextResponse.json({ issues });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch issues' },
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
    const { title, body, labels } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Issue title is required' }, { status: 400 });
    }

    const existing = await getIssues(owner, name);
    const nextNumber = existing.length > 0 ? Math.max(...existing.map((i) => i.number)) + 1 : 1;

    const issue: IssueRecord = {
      id: `issue_${owner}_${name}_${nextNumber}`,
      number: nextNumber,
      repoOwner: owner,
      repoName: name,
      title,
      body: body || '',
      author: user.username,
      authorAvatar: user.avatarUrl,
      state: 'open',
      labels: Array.isArray(labels) ? labels : ['enhancement'],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveIssue(issue);

    await logActivity({
      type: 'issue_opened',
      actor: user.username,
      actorAvatar: user.avatarUrl,
      repoOwner: owner,
      repoName: name,
      details: `Opened issue #${nextNumber}: ${title}`,
    });

    return NextResponse.json({ success: true, issue });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create issue' },
      { status: 500 }
    );
  }
}
