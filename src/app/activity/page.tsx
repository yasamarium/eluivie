'use client';

import React, { useEffect, useState } from 'react';
import { Activity as ActivityIcon, Filter } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ActivityFeed } from '@/components/ActivityFeed';

export default function ActivityPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [uRes, aRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/activity'),
        ]);
        const u = await uRes.json();
        if (u.authenticated) setCurrentUser(u.user);

        const a = await aRes.json();
        if (a.feed) setActivities(a.feed);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = activities.filter((act) => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'commits') return act.type === 'commit';
    if (typeFilter === 'stars') return act.type === 'star' || act.type === 'unstar';
    if (typeFilter === 'repos') return act.type === 'repo_created';
    if (typeFilter === 'issues') return act.type.startsWith('issue');
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-neutral-100 pb-24 selection:bg-blue-600/30 selection:text-white">
      <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />

      <main className="max-w-4xl mx-auto px-4 pt-28">
        <div className="p-6 md:p-8 rounded-3xl ios-glass-card border border-white/[0.08] mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ActivityIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Ecosystem Activity</h1>
              <p className="text-xs text-neutral-400 mt-1">
                Real-time event stream synced to <code className="text-pink-300">eluivie-db-activity</code>
              </p>
            </div>
          </div>

          {/* Segmented Filter */}
          <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-white/[0.08] mt-6 max-w-md overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'commits', label: 'Commits' },
              { id: 'stars', label: 'Stars' },
              { id: 'repos', label: 'Repos' },
              { id: 'issues', label: 'Issues' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl capitalize transition-all whitespace-nowrap ${
                  typeFilter === f.id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 rounded-2xl bg-neutral-900/40 animate-pulse border border-white/[0.04]" />
            ))}
          </div>
        ) : (
          <ActivityFeed items={filtered} />
        )}
      </main>
    </div>
  );
}
