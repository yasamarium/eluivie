'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  User,
  Mail,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Shield,
  Layers,
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload =
      mode === 'login'
        ? { username: username.trim(), password }
        : {
            username: username.trim(),
            password,
            name: name.trim(),
            email: email.trim(),
            bio: bio.trim(),
          };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication request failed');
      }

      setSuccessMsg(
        mode === 'login'
          ? `Welcome back, @${data.user.username}!`
          : `Account created successfully! Welcome, @${data.user.username}!`
      );

      // Save user in local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('eluivie_user', JSON.stringify(data.user));
      }

      // Small delay for smooth visual feedback then transition
      setTimeout(() => {
        onAuthSuccess(data.user);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black overflow-y-auto">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-purple-600/15 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md my-auto rounded-3xl ios-glass-card p-7 md:p-8 text-white shadow-2xl border border-white/[0.09] z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 mb-3 shadow-lg shadow-blue-500/25">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">eluivie</h1>
          <p className="text-xs text-neutral-400 mt-1">
            iOS Themed Git Cloud Platform
          </p>
        </div>

        {/* iOS Segmented Pill Controls */}
        <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-white/[0.08] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              mode === 'login'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              mode === 'signup'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error notification banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2.5 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2.5 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
              {mode === 'login' ? 'Username or Email' : 'Choose Username'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'Enter username or email' : 'e.g. dev_alex'}
                className="w-full ios-input pl-10 pr-4 py-2.5 text-sm"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            {mode === 'signup' && (
              <p className="text-[10px] text-neutral-500 mt-1 px-1">
                Letters, numbers, underscores and hyphens allowed.
              </p>
            )}
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
                  placeholder="Your Full Name (e.g. Alex Dev)"
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@domain.com"
                    className="w-full ios-input pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                  Bio <span className="text-neutral-500 lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Software developer & creator"
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

        {/* Feature Highlights Footer */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-center text-neutral-400">
          <div className="flex flex-col items-center">
            <GitBranch className="w-3.5 h-3.5 text-blue-400 mb-1" />
            <span className="text-[10px]">Cloud Git</span>
          </div>
          <div className="flex flex-col items-center">
            <Shield className="w-3.5 h-3.5 text-emerald-400 mb-1" />
            <span className="text-[10px]">Encrypted</span>
          </div>
          <div className="flex flex-col items-center">
            <Layers className="w-3.5 h-3.5 text-pink-400 mb-1" />
            <span className="text-[10px]">Releases DB</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
