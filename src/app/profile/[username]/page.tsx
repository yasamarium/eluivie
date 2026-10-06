'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Star,
  CheckCircle2,
  Calendar,
  Globe,
  MapPin,
  Edit,
  UserCheck,
  UserPlus,
  Activity as ActivityIcon,
  Sparkles,
  X,
  Save,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ContributionGraph } from '@/components/ContributionGraph';
import { ActivityFeed } from '@/components/ActivityFeed';
import { AuthScreen } from '@/components/AuthScreen';

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [tab, setTab] = useState<'repos' | 'starred' | 'activity'>('repos');
  const [loading, setLoading] = useState(true);

  // Edit Profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, profRes, reposRes, actRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/users/${username}`),
          fetch('/api/repos'),
          fetch('/api/activity'),
        ]);

        const meData = await meRes.json();
        if (meData.authenticated) setCurrentUser(meData.user);

        const profData = await profRes.json();
        if (profData.user) {
          setProfileUser(profData.user);
          setName(profData.user.name || '');
          setBio(profData.user.bio || '');
          setAvatarUrl(profData.user.avatarUrl || '');
          setWebsite(profData.user.website || '');
        }

        const rData = await reposRes.json();
        if (rData.repos) {
          // If viewing yasamarium or any user, match owner
          setUserRepos(rData.repos);
        }

        const aData = await actRes.json();
        if (aData.feed) {
          setUserActivities(aData.feed.filter((a: any) => a.actor.toLowerCase() === username.toLowerCase()));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  const isSelf = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();
  const isFollowing =
    currentUser &&
    (profileUser?.followers || []).includes(currentUser.username.toLowerCase());

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert('Sign in to follow users');
      return;
    }
    try {
      const res = await fetch(`/api/users/${username}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setProfileUser((prev: any) => ({
          ...prev,
          followers: data.following
            ? [...(prev.followers || []), currentUser.username.toLowerCase()]
            : (prev.followers || []).filter((u: string) => u !== currentUser.username.toLowerCase()),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, avatarUrl, website }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setProfileUser(data.user);
        setEditOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth Wall
  if (!currentUser) {
    return (
      <AuthScreen
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-black text-neutral-100">
        <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />
        <div className="max-w-md mx-auto px-4 pt-36 text-center">
          <h2 className="text-xl font-bold">User Not Found</h2>
          <p className="text-xs text-neutral-400 mt-2">The user @{username} does not exist.</p>
          <Link href="/" className="mt-4 inline-block ios-btn-primary px-5 py-2 text-xs">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const starredRepos = userRepos.filter((r) =>
    (profileUser.starredRepos || []).includes(`${r.owner}/${r.name}`)
  );

  return (
    <div className="min-h-screen bg-black text-neutral-100 pb-24 selection:bg-blue-600/30 selection:text-white">
      <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />

      <main className="max-w-4xl mx-auto px-4 pt-28">
        {/* Instagram Header Card */}
        <div className="p-6 md:p-8 rounded-3xl ios-glass-card border border-white/[0.08] mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
            {/* Instagram Profile Story Ring Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 shadow-xl shadow-rose-500/10">
                <div className="w-full h-full rounded-full bg-black p-[2px]">
                  <img
                    src={profileUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`}
                    alt={profileUser.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Profile Info & Instagram Stats Row */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      {profileUser.name || profileUser.username}
                    </h1>
                    {profileUser.isVerified && (
                      <span title="Verified Creator">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">@{profileUser.username}</div>
                </div>

                {/* Follow or Edit Profile Button */}
                <div>
                  {isSelf ? (
                    <button
                      onClick={() => setEditOpen(true)}
                      className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white border border-white/[0.08] flex items-center gap-1.5 transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isFollowing
                          ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                          : 'ios-btn-primary'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Instagram Stats Row */}
              <div className="flex items-center justify-center md:justify-start gap-8 my-5 pt-4 border-t border-white/[0.06]">
                <div className="text-center md:text-left">
                  <span className="font-bold text-base text-white">{userRepos.length}</span>
                  <span className="block text-[11px] text-neutral-400">repos</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-bold text-base text-white">
                    {profileUser.followers?.length || 0}
                  </span>
                  <span className="block text-[11px] text-neutral-400">followers</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-bold text-base text-white">
                    {profileUser.following?.length || 0}
                  </span>
                  <span className="block text-[11px] text-neutral-400">following</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-bold text-base text-white">
                    {profileUser.starredRepos?.length || 0}
                  </span>
                  <span className="block text-[11px] text-neutral-400">starred</span>
                </div>
              </div>

              {/* Bio & Links */}
              <p className="text-xs text-neutral-300 leading-relaxed max-w-lg">
                {profileUser.bio || 'Architect and developer on Eluivie.'}
              </p>

              <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-[11px] text-neutral-400 flex-wrap">
                {profileUser.website && (
                  <a
                    href={profileUser.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Globe className="w-3 h-3 text-blue-400" />
                    <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-neutral-500" />
                  <span>Joined {new Date(profileUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Matrix Heatmap */}
        <div className="mb-8">
          <ContributionGraph username={profileUser.username} />
        </div>

        {/* Segmented Profile Tabs */}
        <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-white/[0.08] mb-6 max-w-xs mx-auto">
          {[
            { id: 'repos', label: 'Repos' },
            { id: 'starred', label: 'Starred' },
            { id: 'activity', label: 'Activity' },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
                  active ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Profile Content */}
        {tab === 'repos' && (
          <div className="space-y-3">
            {userRepos.map((repo) => (
              <div
                key={repo.name}
                className="p-5 rounded-3xl ios-glass-card border border-white/[0.07] hover:border-white/[0.18] transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Link
                      href={`/repo/${repo.owner}/${repo.name}`}
                      className="text-sm font-bold text-white hover:text-blue-400 transition-colors"
                    >
                      {repo.name}
                    </Link>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                      {repo.customDescription || repo.description || 'No description.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{repo.starsCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'starred' && (
          <div className="space-y-3">
            {starredRepos.length === 0 ? (
              <div className="p-12 text-center rounded-3xl ios-glass-card text-xs text-neutral-500">
                No starred repositories yet.
              </div>
            ) : (
              starredRepos.map((repo) => (
                <div
                  key={repo.name}
                  className="p-5 rounded-3xl ios-glass-card border border-white/[0.07]"
                >
                  <Link
                    href={`/repo/${repo.owner}/${repo.name}`}
                    className="text-sm font-bold text-white hover:text-blue-400"
                  >
                    {repo.owner}/{repo.name}
                  </Link>
                  <p className="text-xs text-neutral-400 mt-1">{repo.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'activity' && (
          <ActivityFeed items={userActivities} emptyMessage="No recent activity for this user." />
        )}
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl ios-glass-card p-6 text-white shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                <h3 className="text-base font-bold">Edit Profile</h3>
                <button
                  onClick={() => setEditOpen(false)}
                  className="p-1.5 rounded-full bg-white/[0.06] text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full ios-input px-3.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full ios-input px-3.5 py-2 text-xs h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full ios-input px-3.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full ios-input px-3.5 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="px-4 py-2 rounded-full bg-white/[0.06] text-xs text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="ios-btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
