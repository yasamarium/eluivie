import { NextResponse } from 'next/server';
import { fetchUserRepos, createGitHubRepo } from '@/lib/githubGit';
import { getRepoMeta, saveRepoMeta, logActivity } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase();

    const allRepos = await fetchUserRepos();
    const repos = allRepos.filter((r) => !r.name.startsWith('eluivie-db-'));

    // Enhance with database stars/metadata where available
    const enriched = await Promise.all(
      repos.map(async (r) => {
        try {
          const meta = await getRepoMeta(r.owner, r.name);
          return {
            ...r,
            starsCount: (r.starsCount || 0) + (meta?.stars?.length || 0),
            customDescription: meta?.description || r.description,
            topics: meta?.topics || [],
            starredBy: meta?.stars || [],
          };
        } catch {
          return r;
        }
      })
    );

    let filtered = enriched;
    if (search) {
      filtered = enriched.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.description?.toLowerCase().includes(search) ||
          r.language?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ repos: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to list repositories' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { name, description, isPrivate, autoInit, topics } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }

    const cleanName = name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

    // 1. Create on GitHub
    const ghRepo = await createGitHubRepo({
      name: cleanName,
      description: description || '',
      isPrivate: !!isPrivate,
      autoInit: autoInit !== false,
    });

    // 2. Save metadata in Eluivie database repo
    const meta = {
      id: String(ghRepo.id),
      name: ghRepo.name,
      owner: ghRepo.owner.login,
      description: description || '',
      isPrivate: !!isPrivate,
      stars: [],
      forks: 0,
      topics: Array.isArray(topics) ? topics : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      primaryLanguage: 'TypeScript',
      defaultBranch: ghRepo.default_branch || 'main',
    };
    await saveRepoMeta(meta);

    // 3. Log to activity feed
    await logActivity({
      type: 'repo_created',
      actor: user.username,
      actorAvatar: user.avatarUrl,
      repoOwner: meta.owner,
      repoName: meta.name,
      details: `Created new repository ${meta.owner}/${meta.name}`,
    });

    return NextResponse.json({ success: true, repo: ghRepo });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create repository' },
      { status: 500 }
    );
  }
}
