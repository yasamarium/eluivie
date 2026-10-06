'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  Upload,
  Download,
  Copy,
  Check,
  File,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { StorageUploadModal } from '@/components/StorageUploadModal';
import { AuthScreen } from '@/components/AuthScreen';

export default function StoragePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadAssets = async () => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('eluivie_user');
        if (cached) {
          try {
            setCurrentUser(JSON.parse(cached));
          } catch {}
        }
      }

      const [uRes, aRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/storage/assets'),
      ]);
      const u = await uRes.json();
      if (u.authenticated) {
        setCurrentUser(u.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('eluivie_user', JSON.stringify(u.user));
        }
      } else {
        setCurrentUser(null);
      }

      const a = await aRes.json();
      if (a.assets) setAssets(a.assets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const copyUrl = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-neutral-100 pb-24 selection:bg-blue-600/30 selection:text-white">
      <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />

      <main className="max-w-6xl mx-auto px-4 pt-28">
        {/* Header */}
        <div className="p-6 md:p-8 rounded-3xl ios-glass-card border border-white/[0.08] mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  Media & Asset Vault
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Decentralized High-Performance Object Storage & Media Vault Engine
                </p>
              </div>
            </div>

            <button
              onClick={() => setUploadOpen(true)}
              className="ios-btn-primary px-5 py-2.5 text-xs flex items-center gap-2 self-start md:self-auto"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Upload New Asset</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search uploaded assets..."
            className="w-full ios-input pl-10 pr-4 py-2.5 text-xs"
          />
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 rounded-3xl bg-neutral-900/40 animate-pulse border border-white/[0.04]" />
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-16 text-center rounded-3xl ios-glass-card border border-white/[0.06] space-y-3">
            <HardDrive className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-300">No assets in storage</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Upload images, binary files, builds, or distribution archives to store them permanently in Eluivie Vault.
            </p>
            <button
              onClick={() => setUploadOpen(true)}
              className="ios-btn-primary px-4 py-2 text-xs"
            >
              Upload First Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset, idx) => {
              const isImage =
                asset.contentType?.startsWith('image/') ||
                /\.(png|jpe?g|gif|webp|svg)$/i.test(asset.name);

              return (
                <motion.div
                  key={asset.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-5 rounded-3xl ios-glass-card border border-white/[0.07] flex flex-col justify-between group hover:border-white/[0.18] transition-all"
                >
                  <div>
                    {/* Media Thumbnail or Icon */}
                    <div className="w-full h-32 rounded-2xl bg-black/60 border border-white/[0.06] mb-3 overflow-hidden flex items-center justify-center">
                      {isImage ? (
                        <img
                          src={asset.downloadUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-neutral-500">
                          <File className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-mono">{asset.contentType}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white truncate" title={asset.name}>
                      {asset.name}
                    </h4>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
                      <span>{(asset.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-neutral-300">
                        {asset.tag}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                    <button
                      onClick={() => copyUrl(asset.id, asset.downloadUrl)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs text-neutral-200 transition-colors"
                    >
                      {copiedId === asset.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={asset.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-colors"
                      title="Direct Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <StorageUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          loadAssets();
        }}
      />
    </div>
  );
}
