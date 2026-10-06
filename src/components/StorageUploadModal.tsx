'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, HardDrive, File, Check, Copy } from 'lucide-react';

interface StorageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asset: any) => void;
}

export function StorageUploadModal({ isOpen, onClose, onSuccess }: StorageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState('media-vault');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tag', tag);

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadedAsset(data.asset);
      onSuccess(data.asset);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = () => {
    if (uploadedAsset?.downloadUrl) {
      navigator.clipboard.writeText(uploadedAsset.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            className="relative w-full max-w-md rounded-3xl ios-glass-card p-6 text-white shadow-2xl z-10"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.08] flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h3 className="text-base font-bold">Upload to Storage Vault</h3>
                <p className="text-[11px] text-neutral-400">Stores directly via Eluivie Vault Engine</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            {!uploadedAsset ? (
              <form onSubmit={handleUpload} className="space-y-4">
                {/* Drag and Drop Zone */}
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/[0.15] hover:border-white/30 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                    <p className="text-xs text-neutral-300 font-medium">
                      {file ? file.name : 'Click to select media or binary'}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      {file ? `${(file.size / 1024).toFixed(1)} KB` : 'PNG, JPG, MP4, ZIP, DMG, etc.'}
                    </p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                    Release Tag
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="media-vault"
                    className="w-full ios-input px-3.5 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full py-2.5 ios-btn-primary flex items-center justify-center gap-2 text-xs font-semibold disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Asset</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-emerald-300">File uploaded successfully!</h4>
                  <p className="text-xs text-neutral-400 mt-1">{uploadedAsset.name}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Direct Download URL</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={uploadedAsset.downloadUrl}
                      className="flex-1 bg-transparent text-neutral-300 text-[11px] truncate focus:outline-none"
                    />
                    <button
                      onClick={copyUrl}
                      className="p-1.5 rounded-lg bg-white/[0.1] hover:bg-white/[0.2] text-neutral-200"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUploadedAsset(null);
                    setFile(null);
                  }}
                  className="w-full py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium"
                >
                  Upload Another File
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
