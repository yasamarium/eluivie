import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRepoMeta, saveRepoMeta, saveUser, logActivity } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to star' }, { status: 401 });
    }

    const { owner, name } = await params;
    const repoKey = `${owner}/${name}`;

    let meta = await getRepoMeta(owner, name);
    if (!meta) {
      meta = {
        id: `repo_${owner}_${name}`,
        name,
        owner,
        description: '',
        isPrivate: false,
        stars: [],
        forks: 0,
        topics: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        defaultBranch: 'main',
      };
    }

    const username = user.username.toLowerCase();
    const alreadyStarred = meta.stars.includes(username);

    if (alreadyStarred) {
      meta.stars = meta.stars.filter((u) => u !== username);
      user.starredRepos = (user.starredRepos || []).filter((r) => r !== repoKey);
    } else {
      meta.stars.push(username);
      user.starredRepos = [...(user.starredRepos || []), repoKey];
    }

    await saveRepoMeta(meta);
    await saveUser(user);

    await logActivity({
      type: alreadyStarred ? 'unstar' : 'star',
      actor: user.username,
      actorAvatar: user.avatarUrl,
      repoOwner: owner,
      repoName: name,
      details: alreadyStarred ? `Unstarred ${repoKey}` : `Starred ${repoKey}`,
    });

    return NextResponse.json({
      starred: !alreadyStarred,
      starsCount: meta.stars.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to toggle star' },
      { status: 500 }
    );
  }
}
