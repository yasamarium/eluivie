'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitBranch, Lock, Globe, Plus, Sparkles, Check } from 'lucide-react';

interface NewRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (repo: any) => void;
}

export function NewRepoModal({ isOpen, onClose, onSuccess }: NewRepoModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['typescript', 'ios']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          isPrivate,
          autoInit,
          topics: tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create repository');
      }

      onSuccess(data.repo);
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-lg rounded-3xl ios-glass-card p-7 text-white shadow-2xl overflow-hidden z-10"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Create a new repository</h2>
                <p className="text-xs text-neutral-400">Host, version control and sync with Eluivie database</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="super-app"
                  className="w-full ios-input px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                  Description <span className="text-neutral-500 lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A high performance iOS web application"
                  className="w-full ios-input px-3.5 py-2.5 text-sm"
                />
              </div>

              {/* Public vs Private iOS Segmented Pill */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5 px-1">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${
                      !isPrivate
                        ? 'bg-white/[0.1] border-white/30 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold">Public</div>
                      <div className="text-[10px] text-neutral-400">Anyone on the internet can see</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${
                      isPrivate
                        ? 'bg-white/[0.1] border-white/30 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold">Private</div>
                      <div className="text-[10px] text-neutral-400">Only you can view and commit</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Topics / Tags */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                  Topics / Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="react, tailwind..."
                    className="flex-1 ios-input px-3.5 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      onClick={() => removeTag(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.06] hover:bg-red-500/20 text-neutral-300 hover:text-red-300 border border-white/[0.08] text-[11px] cursor-pointer transition-colors"
                    >
                      #{t}
                      <X className="w-2.5 h-2.5" />
                    </span>
                  ))}
                </div>
              </div>

              {/* Auto init with README */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoInit}
                  onChange={(e) => setAutoInit(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-blue-500 focus:ring-0 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-neutral-200">Initialize repository with a README</span>
                  <p className="text-[11px] text-neutral-400">This allows you to immediately clone the repository.</p>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 ios-btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Repository</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
