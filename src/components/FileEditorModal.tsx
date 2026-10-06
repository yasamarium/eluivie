'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileCode, Check } from 'lucide-react';

interface FileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  initialPath?: string;
  initialContent?: string;
  sha?: string;
  onSuccess: () => void;
}

export function FileEditorModal({
  isOpen,
  onClose,
  owner,
  repo,
  initialPath = '',
  initialContent = '',
  sha,
  onSuccess,
}: FileEditorModalProps) {
  const [filePath, setFilePath] = useState(initialPath);
  const [content, setContent] = useState(initialContent);
  const [message, setMessage] = useState(
    initialPath ? `Update ${initialPath}` : 'Create new file via Eluivie'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/contents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath.trim(),
          content,
          message: message.trim() || `Update ${filePath}`,
          sha: sha || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to commit file');
      }

      onSuccess();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-4xl h-[85vh] rounded-3xl ios-glass-card p-6 text-white shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center">
                  <FileCode className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {sha ? 'Edit File' : 'Create New File'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Committing directly to {owner}/{repo}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="my-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Path and Message row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                  File Path
                </label>
                <input
                  type="text"
                  value={filePath}
                  disabled={!!sha}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="src/index.ts or README.md"
                  className="w-full ios-input px-3 py-1.5 text-xs font-mono disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                  Commit Message
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your changes..."
                  className="w-full ios-input px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col rounded-2xl bg-black/60 border border-white/[0.08] overflow-hidden my-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="// Enter your code or markdown here..."
                className="w-full flex-1 p-4 bg-transparent text-neutral-200 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !filePath.trim()}
                className="px-5 py-2 ios-btn-primary flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Commit changes</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
