import { NextResponse } from 'next/server';
import { getIssues, saveIssue, logActivity } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string; number: string }> }
) {
  try {
    const { owner, name, number } = await params;
    const num = parseInt(number, 10);
    const issues = await getIssues(owner, name);
    const issue = issues.find((i) => i.number === num);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch issue' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string; number: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { owner, name, number } = await params;
    const num = parseInt(number, 10);
    const issues = await getIssues(owner, name);
    const issue = issues.find((i) => i.number === num);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const { action, commentBody, newState } = await req.json();

    if (action === 'comment' && commentBody) {
      const newComment = {
        id: `cmt_${Date.now()}`,
        author: user.username,
        authorAvatar: user.avatarUrl,
        body: commentBody,
        createdAt: new Date().toISOString(),
      };
      issue.comments.push(newComment);
      issue.updatedAt = new Date().toISOString();

      await saveIssue(issue);
      await logActivity({
        type: 'comment',
        actor: user.username,
        actorAvatar: user.avatarUrl,
        repoOwner: owner,
        repoName: name,
        details: `Commented on #${issue.number}`,
      });

      return NextResponse.json({ success: true, issue });
    }

    if (action === 'toggle_state') {
      const state = newState || (issue.state === 'open' ? 'closed' : 'open');
      issue.state = state;
      issue.updatedAt = new Date().toISOString();

      await saveIssue(issue);
      await logActivity({
        type: state === 'closed' ? 'issue_closed' : 'issue_opened',
        actor: user.username,
        actorAvatar: user.avatarUrl,
        repoOwner: owner,
        repoName: name,
        details: `${state === 'closed' ? 'Closed' : 'Reopened'} issue #${issue.number}`,
      });

      return NextResponse.json({ success: true, issue });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update issue' },
      { status: 500 }
    );
  }
}
