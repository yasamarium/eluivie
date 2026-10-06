import { NextResponse } from 'next/server';
import { getUserByUsername, saveUser, logActivity } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { username } = await params;
    if (currentUser.username.toLowerCase() !== username.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized to edit this profile' }, { status: 403 });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates = await req.json();
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    if (updates.website !== undefined) user.website = updates.website;
    if (updates.location !== undefined) user.location = updates.location;

    await saveUser(user);

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { username: targetUsername } = await params;
    const target = await getUserByUsername(targetUsername);

    if (!target) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const targetKey = target.username.toLowerCase();
    const currentKey = currentUser.username.toLowerCase();

    if (targetKey === currentKey) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const isFollowing = (currentUser.following || []).includes(targetKey);

    if (isFollowing) {
      currentUser.following = (currentUser.following || []).filter((u) => u !== targetKey);
      target.followers = (target.followers || []).filter((u) => u !== currentKey);
    } else {
      currentUser.following = [...(currentUser.following || []), targetKey];
      target.followers = [...(target.followers || []), currentKey];
    }

    await saveUser(currentUser);
    await saveUser(target);

    await logActivity({
      type: isFollowing ? 'unstar' : 'star',
      actor: currentUser.username,
      actorAvatar: currentUser.avatarUrl,
      target: target.username,
      details: isFollowing ? `Unfollowed @${target.username}` : `Started following @${target.username}`,
    });

    return NextResponse.json({
      following: !isFollowing,
      followersCount: target.followers.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Follow action failed' },
      { status: 500 }
    );
  }
}
