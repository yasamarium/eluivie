'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  GitBranch,
  Star,
  Search,
  Lock,
  Globe,
  Database,
  HardDrive,
  Activity as ActivityIcon,
  Sparkles,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ActivityFeed } from '@/components/ActivityFeed';
import { NewRepoModal } from '@/components/NewRepoModal';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3776ab',
  HTML: '#e34f26',
  CSS: '#1572b6',
  Go: '#00add8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  Java: '#b07219',
};

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [loading, setLoading] = useState(true);
  const [newRepoOpen, setNewRepoOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, reposRes, actRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/repos'),
          fetch('/api/activity'),
        ]);

        const userData = await userRes.json();
        if (userData.authenticated) {
          setCurrentUser(userData.user);
        }

        const reposData = await reposRes.json();
        if (reposData.repos) {
          setRepos(reposData.repos);
        }

        const actData = await actRes.json();
        if (actData.feed) {
          setActivities(actData.feed);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStarToggle = async (e: React.MouseEvent, owner: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert('Please sign in to star repositories');
      return;
    }

    try {
      const res = await fetch(`/api/repos/${owner}/${name}/star`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRepos((prev) =>
          prev.map((r) => {
            if (r.owner === owner && r.name === name) {
              return {
                ...r,
                starsCount: data.starsCount,
                starredBy: data.starred
                  ? [...(r.starredBy || []), currentUser.username]
                  : (r.starredBy || []).filter((u: string) => u !== currentUser.username),
              };
            }
            return r;
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.language?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'public') return !r.isPrivate;
    if (filter === 'private') return r.isPrivate;
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-neutral-100 pb-24 selection:bg-blue-600/30 selection:text-white">
      <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />

      <main className="max-w-6xl mx-auto px-4 pt-28">
        {/* Top Hero & Ecosystem Metrics */}
        <div className="mb-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-neutral-300 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GitHub Serverless DB Engine Active</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                eluivie
              </h1>
              <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-xl">
                Minimalist iOS-themed Git cloud ecosystem powered by fine-grained GitHub database repositories.
              </p>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-2.5">
              <button
                onClick={() => setNewRepoOpen(true)}
                className="ios-btn-primary px-5 py-2.5 text-xs flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Repository</span>
              </button>
              <Link
                href="/storage"
                className="ios-btn-secondary px-4 py-2.5 text-xs flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5 text-pink-400" />
                <span>Media Vault</span>
              </Link>
            </div>
          </div>

          {/* iOS Dashboard Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="p-4 rounded-3xl ios-glass-card border border-white/[0.07]">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Repositories</span>
                <GitBranch className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{repos.length}</div>
              <div className="text-[10px] text-neutral-500 mt-1">Live synchronized</div>
            </div>

            <div className="p-4 rounded-3xl ios-glass-card border border-white/[0.07]">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">DB Repositories</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">5 Active</div>
              <div className="text-[10px] text-neutral-500 mt-1">Users • Repos • Issues • Feed • Storage</div>
            </div>

            <div className="p-4 rounded-3xl ios-glass-card border border-white/[0.07]">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Ecosystem Owner</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-white truncate">@yasamarium</div>
              <div className="text-[10px] text-neutral-500 mt-1">Root administrator</div>
            </div>

            <div className="p-4 rounded-3xl ios-glass-card border border-white/[0.07]">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Cloud Engine</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">Releases</div>
              <div className="text-[10px] text-neutral-500 mt-1">Zero-cost blob media engine</div>
            </div>
          </div>
        </div>

        {/* Main Content: Repositories & Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Repositories column (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filter bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a repository by name or language..."
                  className="w-full ios-input pl-10 pr-4 py-2.5 text-xs"
                />
              </div>

              {/* Segmented Filter */}
              <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-white/[0.08] shrink-0 w-full sm:w-auto">
                {(['all', 'public', 'private'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
                      filter === f
                        ? 'bg-white text-black shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Repositories List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-28 rounded-3xl bg-neutral-900/40 animate-pulse border border-white/[0.04]"
                  />
                ))}
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="p-12 text-center rounded-3xl ios-glass-card border border-white/[0.06]">
                <GitBranch className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-neutral-300">No repositories found</h3>
                <p className="text-xs text-neutral-500 mt-1">Try adjusting your search or create a new one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRepos.map((repo, idx) => {
                  const isStarred =
                    currentUser &&
                    (repo.starredBy || []).includes(currentUser.username.toLowerCase());

                  return (
                    <motion.div
                      key={repo.id || repo.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      className="group p-5 rounded-3xl ios-glass-card border border-white/[0.07] hover:border-white/[0.18] transition-all hover:translate-y-[-1px]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/repo/${repo.owner}/${repo.name}`}
                              className="text-base font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5"
                            >
                              <span>{repo.name}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                repo.isPrivate
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                  : 'bg-white/[0.05] text-neutral-400 border-white/[0.08]'
                              }`}
                            >
                              {repo.isPrivate ? (
                                <>
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Private</span>
                                </>
                              ) : (
                                <>
                                  <Globe className="w-2.5 h-2.5" />
                                  <span>Public</span>
                                </>
                              )}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2">
                            {repo.customDescription || repo.description || 'No description provided.'}
                          </p>

                          {/* Repo Metadata Row */}
                          <div className="flex items-center gap-4 mt-3 text-[11px] text-neutral-400 flex-wrap">
                            {repo.language && (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      LANGUAGE_COLORS[repo.language] || '#999999',
                                  }}
                                />
                                <span>{repo.language}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-neutral-500" />
                              <span>{repo.starsCount || 0}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3 text-neutral-500" />
                              <span>{repo.defaultBranch || 'main'}</span>
                            </div>

                            <span className="text-neutral-500">
                              Updated {new Date(repo.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Star Button */}
                        <button
                          onClick={(e) => handleStarToggle(e, repo.owner, repo.name)}
                          className={`p-2 rounded-2xl border transition-all active:scale-90 ${
                            isStarred
                              ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-neutral-400 hover:text-white'
                          }`}
                          title={isStarred ? 'Unstar' : 'Star'}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isStarred ? 'fill-yellow-400' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Feed sidebar (1/3) */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-200 tracking-tight flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-blue-400" />
                <span>Live Feed</span>
              </h2>
              <Link
                href="/activity"
                className="text-[11px] text-neutral-400 hover:text-white transition-colors"
              >
                View all
              </Link>
            </div>

            <ActivityFeed items={activities.slice(0, 10)} />

            {/* Cloud Storage Database Card */}
            <div className="p-5 rounded-3xl ios-glass-card border border-white/[0.08] text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] mx-auto flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xs font-bold text-white">Dedicated Storage Cluster</h3>
              <p className="text-[11px] text-neutral-400">
                Media, avatars and binary distribution artifacts are stored permanently inside <code className="text-pink-300">eluivie-db-storage</code> releases.
              </p>
              <Link
                href="/storage"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white transition-all"
              >
                <HardDrive className="w-3.5 h-3.5 text-pink-400" />
                <span>Open Media Vault</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <NewRepoModal
        isOpen={newRepoOpen}
        onClose={() => setNewRepoOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
