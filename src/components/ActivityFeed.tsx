'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  GitBranch,
  Star,
  GitCommit,
  AlertCircle,
  Upload,
  UserPlus,
  MessageSquare,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: string;
  actor: string;
  actorAvatar?: string;
  repoOwner?: string;
  repoName?: string;
  target?: string;
  details?: string;
  timestamp: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  emptyMessage?: string;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getEventIcon(type: string) {
  switch (type) {
    case 'repo_created':
      return <GitBranch className="w-3.5 h-3.5 text-cyan-400" />;
    case 'star':
      return <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />;
    case 'commit':
      return <GitCommit className="w-3.5 h-3.5 text-emerald-400" />;
    case 'issue_opened':
    case 'issue_closed':
      return <AlertCircle className="w-3.5 h-3.5 text-purple-400" />;
    case 'comment':
      return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
    case 'media_uploaded':
      return <Upload className="w-3.5 h-3.5 text-pink-400" />;
    case 'user_registered':
      return <UserPlus className="w-3.5 h-3.5 text-indigo-400" />;
    default:
      return <GitBranch className="w-3.5 h-3.5 text-neutral-400" />;
  }
}

export function ActivityFeed({ items, emptyMessage = 'No recent activity recorded yet.' }: ActivityFeedProps) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl ios-glass-card text-neutral-400 text-xs">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <motion.div
          key={item.id || idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03, duration: 0.2 }}
          className="flex items-start gap-3.5 p-3.5 rounded-2xl ios-glass hover:bg-white/[0.05] border border-white/[0.06] transition-all"
        >
          {/* Avatar with indicator */}
          <div className="relative shrink-0 mt-0.5">
            <img
              src={item.actorAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.actor}`}
              alt={item.actor}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black/90 border border-white/10 flex items-center justify-center">
              {getEventIcon(item.type)}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <Link
                  href={`/profile/${item.actor}`}
                  className="font-semibold text-neutral-200 hover:text-white transition-colors"
                >
                  @{item.actor}
                </Link>
                <span className="text-neutral-400 ml-1.5">{item.details || item.type}</span>
              </div>
              <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                {timeAgo(item.timestamp)}
              </span>
            </div>

            {item.repoOwner && item.repoName && (
              <div className="mt-1">
                <Link
                  href={`/repo/${item.repoOwner}/${item.repoName}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-blue-400 border border-white/[0.05] transition-colors"
                >
                  <GitBranch className="w-2.5 h-2.5" />
                  <span>{item.repoOwner}/{item.repoName}</span>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
