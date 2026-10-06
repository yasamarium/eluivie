'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, Mail, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload =
      mode === 'login'
        ? { username, password }
        : { username, password, name, email, bio };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setUsername('yasamarium');
    setPassword('eluivie2026');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'yasamarium', password: 'eluivie2026' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md rounded-3xl ios-glass-card p-7 text-white shadow-2xl overflow-hidden z-10"
          >
            {/* Top close button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Instagram / iOS Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 mb-3 shadow-lg shadow-blue-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">eluivie</h2>
              <p className="text-xs text-neutral-400 mt-1">iOS Minimalist Git Ecosystem</p>
            </div>

            {/* iOS Segmented Control */}
            <div className="flex bg-neutral-900/80 p-1 rounded-2xl border border-white/[0.08] mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yasamarium"
                    className="w-full ios-input pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full ios-input px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full ios-input pl-10 pr-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                      Bio
                    </label>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Software architect & creator"
                      className="w-full ios-input px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ios-input pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 ios-btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Superadmin Access */}
            <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
              <button
                type="button"
                onClick={handleQuickAdmin}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-neutral-300 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>1-Click Owner Login (@yasamarium)</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
