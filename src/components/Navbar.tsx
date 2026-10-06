'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GitBranch,
  Activity,
  HardDrive,
  Plus,
  User as UserIcon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { NewRepoModal } from './NewRepoModal';

interface NavbarProps {
  currentUser: any;
  onUserChange?: (user: any) => void;
}

export function Navbar({ currentUser, onUserChange }: NavbarProps) {
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [newRepoOpen, setNewRepoOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (onUserChange) onUserChange(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { label: 'Repos', href: '/', icon: GitBranch },
    { label: 'Activity', href: '/activity', icon: Activity },
    { label: 'Storage', href: '/storage', icon: HardDrive },
  ];

  return (
    <>
      <header className="fixed top-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="pointer-events-auto flex items-center justify-between gap-3 md:gap-6 px-4 py-2.5 rounded-full ios-glass shadow-2xl border border-white/[0.09] max-w-4xl w-full"
        >
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors">
              eluivie
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.05]">
            {navLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    active ? 'text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white/[0.12] rounded-full border border-white/[0.1]"
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Action Buttons & Profile */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={() => setNewRepoOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 active:scale-95 transition-all"
                title="Create Repository"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">New Repo</span>
              </button>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://avatars.githubusercontent.com/u/104193851?v=4'}
                    alt={currentUser.username}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <span className="text-xs text-neutral-300 font-medium hidden sm:inline">
                    @{currentUser.username}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl ios-glass-card p-1.5 border border-white/[0.1] shadow-2xl z-50">
                    <Link
                      href={`/profile/${currentUser.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-white/[0.08] text-neutral-200"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                      <span>View Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-xs font-medium text-white transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </motion.nav>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(user) => {
          if (onUserChange) onUserChange(user);
        }}
      />

      {/* New Repo Modal */}
      <NewRepoModal
        isOpen={newRepoOpen}
        onClose={() => setNewRepoOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
