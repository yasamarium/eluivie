import { NextResponse } from 'next/server';
import { fetchRepoDetails, fetchRepoBranches, fetchRepoContents } from '@/lib/githubGit';
import { getRepoMeta } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const { owner, name } = await params;
    const details = await fetchRepoDetails(owner, name);

    if (!details) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const branches = await fetchRepoBranches(owner, name);
    const meta = await getRepoMeta(owner, name);

    // Try fetching README
    let readme: string | null = null;
    const readmeFile = await fetchRepoContents(owner, name, 'README.md');
    if (readmeFile && readmeFile.type === 'file') {
      readme = readmeFile.content || null;
    }

    return NextResponse.json({
      repo: {
        id: details.id,
        name: details.name,
        fullName: details.full_name,
        owner: details.owner.login,
        ownerAvatar: details.owner.avatar_url,
        description: meta?.description || details.description,
        isPrivate: details.private,
        defaultBranch: details.default_branch || 'main',
        branches,
        starsCount: (details.stargazers_count || 0) + (meta?.stars?.length || 0),
        forksCount: details.forks_count || 0,
        openIssuesCount: details.open_issues_count || 0,
        updatedAt: details.updated_at,
        pushedAt: details.pushed_at,
        htmlUrl: details.html_url,
        cloneUrl: details.clone_url,
        sshUrl: details.ssh_url,
        topics: meta?.topics || details.topics || [],
        readme,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch repository' },
      { status: 500 }
    );
  }
}
