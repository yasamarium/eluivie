'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Star,
  Lock,
  Globe,
  File,
  Folder,
  ChevronRight,
  Copy,
  Check,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  MessageSquare,
  GitCommit,
  HardDrive,
  Download,
  Terminal,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { FileEditorModal } from '@/components/FileEditorModal';
import { StorageUploadModal } from '@/components/StorageUploadModal';

export default function RepoDetailPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = use(params);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [repo, setRepo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'code' | 'issues' | 'commits' | 'releases'>('code');

  // Code Tab state
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState<any>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [fileSha, setFileSha] = useState<string | undefined>(undefined);
  const [contentsLoading, setContentsLoading] = useState(false);

  // Issues Tab state
  const [issues, setIssues] = useState<any[]>([]);
  const [issuesFilter, setIssuesFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [newIssueModalOpen, setNewIssueModalOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [activeIssue, setActiveIssue] = useState<any>(null);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Commits Tab state
  const [commits, setCommits] = useState<any[]>([]);

  // Modals & Popovers
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitialPath, setEditorInitialPath] = useState('');
  const [editorInitialContent, setEditorInitialContent] = useState('');
  const [editorSha, setEditorSha] = useState<string | undefined>(undefined);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Initial Load
  useEffect(() => {
    async function loadRepo() {
      try {
        const [userRes, repoRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/repos/${owner}/${name}`),
        ]);

        const u = await userRes.json();
        if (u.authenticated) setCurrentUser(u.user);

        const r = await repoRes.json();
        if (r.repo) setRepo(r.repo);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRepo();
  }, [owner, name]);

  // Load Folder / File Contents
  const loadContents = async (path: string = '') => {
    setContentsLoading(true);
    try {
      const res = await fetch(`/api/repos/${owner}/${name}/contents?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.contents) {
        if (data.contents.type === 'dir') {
          setContents(data.contents.items);
          setFileContent(null);
          setFileSha(undefined);
        } else if (data.contents.type === 'file') {
          setFileContent(data.contents);
          setFileSha(data.contents.sha);
          setContents(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContentsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'code') {
      loadContents(currentPath);
    } else if (tab === 'issues') {
      fetch(`/api/repos/${owner}/${name}/issues`)
        .then((r) => r.json())
        .then((d) => setIssues(d.issues || []));
    } else if (tab === 'commits') {
      fetch(`/api/repos/${owner}/${name}/commits`)
        .then((r) => r.json())
        .then((d) => setCommits(d.commits || []));
    }
  }, [tab, currentPath, owner, name]);

  // Star Toggle
  const handleStar = async () => {
    if (!currentUser) {
      alert('Sign in to star');
      return;
    }
    try {
      const res = await fetch(`/api/repos/${owner}/${name}/star`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRepo((prev: any) => ({
          ...prev,
          starsCount: data.starsCount,
          isStarred: data.starred,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Issue
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) return;

    setCreatingIssue(true);
    try {
      const res = await fetch(`/api/repos/${owner}/${name}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: issueTitle, body: issueBody }),
      });
      const data = await res.json();
      if (res.ok && data.issue) {
        setIssues([data.issue, ...issues]);
        setIssueTitle('');
        setIssueBody('');
        setNewIssueModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingIssue(false);
    }
  };

  // Add Comment to active issue
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeIssue) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(
        `/api/repos/${owner}/${name}/issues/${activeIssue.number}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'comment', commentBody: commentInput }),
        }
      );
      const data = await res.json();
      if (res.ok && data.issue) {
        setActiveIssue(data.issue);
        setIssues(issues.map((i) => (i.number === data.issue.number ? data.issue : i)));
        setCommentInput('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Toggle issue open/closed
  const handleToggleIssueState = async () => {
    if (!activeIssue) return;
    try {
      const res = await fetch(
        `/api/repos/${owner}/${name}/issues/${activeIssue.number}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle_state' }),
        }
      );
      const data = await res.json();
      if (res.ok && data.issue) {
        setActiveIssue(data.issue);
        setIssues(issues.map((i) => (i.number === data.issue.number ? data.issue : i)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete current viewed file
  const handleDeleteFile = async () => {
    if (!fileSha || !fileContent) return;
    if (!confirm(`Are you sure you want to delete ${fileContent.name}?`)) return;

    try {
      const res = await fetch(`/api/repos/${owner}/${name}/contents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: fileContent.path,
          sha: fileSha,
          message: `Delete ${fileContent.name} via Eluivie`,
        }),
      });
      if (res.ok) {
        // Go back up one directory
        const parts = currentPath.split('/');
        parts.pop();
        const parentPath = parts.join('/');
        setCurrentPath(parentPath);
        loadContents(parentPath);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="min-h-screen bg-black text-neutral-100">
        <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />
        <div className="max-w-4xl mx-auto px-4 pt-36 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Repository Not Found</h2>
          <p className="text-xs text-neutral-400 mt-2">
            The requested repository {owner}/{name} does not exist or is private.
          </p>
          <Link href="/" className="mt-6 inline-block ios-btn-primary px-6 py-2.5 text-xs">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Path Breadcrumbs calculation
  const pathParts = currentPath ? currentPath.split('/') : [];

  return (
    <div className="min-h-screen bg-black text-neutral-100 pb-24 selection:bg-blue-600/30 selection:text-white">
      <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />

      <main className="max-w-6xl mx-auto px-4 pt-28">
        {/* Repo Header */}
        <div className="p-6 md:p-8 rounded-3xl ios-glass-card border border-white/[0.08] mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <img
                src={repo.ownerAvatar || `https://avatars.githubusercontent.com/u/104193851?v=4`}
                alt={repo.owner}
                className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/20"
              />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    href={`/profile/${repo.owner}`}
                    className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
                  >
                    {repo.owner}
                  </Link>
                  <span className="text-neutral-600">/</span>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {repo.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
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

                <p className="text-xs text-neutral-400 mt-2 max-w-2xl">
                  {repo.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Action Buttons: Star, Clone, New File */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleStar}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold transition-all active:scale-95"
              >
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>Star</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[10px]">
                  {repo.starsCount || 0}
                </span>
              </button>

              {/* Clone Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCloneOpen(!cloneOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all active:scale-95"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Code / Clone</span>
                </button>

                {cloneOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-3xl ios-glass-card p-4 border border-white/[0.12] shadow-2xl z-50">
                    <div className="text-xs font-semibold text-neutral-200 mb-2">Clone repository</div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-white/[0.08] text-xs">
                      <input
                        type="text"
                        readOnly
                        value={repo.cloneUrl || `https://github.com/${owner}/${name}.git`}
                        className="flex-1 bg-transparent text-neutral-300 font-mono text-[11px] truncate focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            repo.cloneUrl || `https://github.com/${owner}/${name}.git`
                          );
                          setCopiedClone(true);
                          setTimeout(() => setCopiedClone(false), 2000);
                        }}
                        className="p-1 rounded-lg bg-white/[0.1] hover:bg-white/[0.2] text-white"
                      >
                        {copiedClone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 hover:text-white pt-2 border-t border-white/[0.06]"
                    >
                      <span>Open on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* iOS Segmented Navigation Tabs */}
          <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-white/[0.08] mt-6 max-w-md">
            {[
              { id: 'code', label: 'Code', icon: GitBranch },
              { id: 'issues', label: 'Issues', icon: AlertCircle, count: repo.openIssuesCount },
              { id: 'commits', label: 'Commits', icon: GitCommit },
              { id: 'releases', label: 'Releases & Media', icon: HardDrive },
            ].map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id as any);
                    setActiveIssue(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                    active ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: CODE & FILE EXPLORER */}
        {tab === 'code' && (
          <div className="space-y-6">
            {/* Explorer Toolbar */}
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl ios-glass border border-white/[0.06]">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 overflow-x-auto">
                <button
                  onClick={() => {
                    setCurrentPath('');
                    loadContents('');
                  }}
                  className="font-bold text-white hover:text-blue-400 transition-colors"
                >
                  {name}
                </button>
                {pathParts.map((part, index) => {
                  const partPath = pathParts.slice(0, index + 1).join('/');
                  const isLast = index === pathParts.length - 1;
                  return (
                    <React.Fragment key={partPath}>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      <button
                        onClick={() => {
                          setCurrentPath(partPath);
                          loadContents(partPath);
                        }}
                        className={`transition-colors whitespace-nowrap ${
                          isLast ? 'text-white font-semibold' : 'hover:text-white'
                        }`}
                      >
                        {part}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Action buttons: New File or Edit/Delete if file open */}
              <div className="flex items-center gap-2 shrink-0">
                {fileContent ? (
                  <>
                    <button
                      onClick={() => {
                        setEditorInitialPath(fileContent.path);
                        setEditorInitialContent(fileContent.content || '');
                        setEditorSha(fileSha);
                        setEditorOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDeleteFile}
                      className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const prefix = currentPath ? `${currentPath}/` : '';
                      setEditorInitialPath(`${prefix}`);
                      setEditorInitialContent('');
                      setEditorSha(undefined);
                      setEditorOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>New File</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content Display: Directory List or File Code View */}
            {contentsLoading ? (
              <div className="p-12 text-center rounded-3xl ios-glass-card">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : contents ? (
              <div className="rounded-3xl ios-glass-card border border-white/[0.07] overflow-hidden">
                <div className="divide-y divide-white/[0.04]">
                  {/* Parent Directory item */}
                  {currentPath && (
                    <div
                      onClick={() => {
                        const parts = currentPath.split('/');
                        parts.pop();
                        const parent = parts.join('/');
                        setCurrentPath(parent);
                        loadContents(parent);
                      }}
                      className="flex items-center gap-3 px-5 py-3 text-xs text-neutral-400 hover:text-white hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <Folder className="w-4 h-4 text-blue-400" />
                      <span>..</span>
                    </div>
                  )}

                  {/* Directory items */}
                  {contents.map((item: any) => {
                    const isDir = item.type === 'dir';
                    return (
                      <div
                        key={item.path}
                        onClick={() => {
                          setCurrentPath(item.path);
                          loadContents(item.path);
                        }}
                        className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          {isDir ? (
                            <Folder className="w-4 h-4 text-blue-400" />
                          ) : (
                            <File className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                          )}
                          <span className="text-xs font-medium text-neutral-200 group-hover:text-white">
                            {item.name}
                          </span>
                        </div>
                        {item.size !== undefined && (
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {item.size ? `${(item.size / 1024).toFixed(1)} KB` : ''}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : fileContent ? (
              /* Single File Code Viewer */
              <div className="rounded-3xl ios-glass-card border border-white/[0.08] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">{fileContent.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      ({fileContent.size ? (fileContent.size / 1024).toFixed(1) : 0} KB)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(fileContent.content || '');
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs text-neutral-300"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Code syntax container */}
                <div className="p-5 overflow-x-auto bg-black/60 font-mono text-xs leading-relaxed text-neutral-200">
                  <pre>
                    <code>{fileContent.content || '// Empty file'}</code>
                  </pre>
                </div>
              </div>
            ) : null}

            {/* README Preview if on root */}
            {!currentPath && repo.readme && (
              <div className="rounded-3xl ios-glass-card border border-white/[0.08] p-6 md:p-8">
                <div className="flex items-center gap-2 pb-4 mb-6 border-b border-white/[0.06] text-xs font-bold uppercase tracking-wider text-neutral-400">
                  <File className="w-4 h-4 text-blue-400" />
                  <span>README.md</span>
                </div>
                <MarkdownRenderer content={repo.readme} />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ISSUES TRACKER */}
        {tab === 'issues' && (
          <div className="space-y-6">
            {!activeIssue ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  {/* Segmented filter */}
                  <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-white/[0.08]">
                    {(['open', 'closed', 'all'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setIssuesFilter(f)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
                          issuesFilter === f
                            ? 'bg-white text-black shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setNewIssueModalOpen(true)}
                    className="ios-btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>New Issue</span>
                  </button>
                </div>

                {/* Issues list */}
                {issues.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl ios-glass-card border border-white/[0.06]">
                    <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-neutral-300">No issues found</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Everything looks clear or no issues have been opened yet.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-3xl ios-glass-card border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
                    {issues
                      .filter((i) => (issuesFilter === 'all' ? true : i.state === issuesFilter))
                      .map((issue) => (
                        <div
                          key={issue.id}
                          onClick={() => setActiveIssue(issue)}
                          className="flex items-start justify-between gap-4 p-5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle
                              className={`w-4 h-4 mt-0.5 ${
                                issue.state === 'open' ? 'text-emerald-400' : 'text-purple-400'
                              }`}
                            />
                            <div>
                              <h4 className="text-sm font-bold text-white hover:text-blue-400 transition-colors">
                                {issue.title}
                              </h4>
                              <p className="text-[11px] text-neutral-400 mt-1">
                                #{issue.number} opened by @{issue.author} • {new Date(issue.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {issue.comments?.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-neutral-400">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{issue.comments.length}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              /* Active Issue Detail View */
              <div className="space-y-6">
                <button
                  onClick={() => setActiveIssue(null)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to all issues</span>
                </button>

                <div className="p-6 rounded-3xl ios-glass-card border border-white/[0.08]">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {activeIssue.title}{' '}
                        <span className="text-neutral-500 font-normal">#{activeIssue.number}</span>
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            activeIssue.state === 'open'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {activeIssue.state === 'open' ? 'Open' : 'Closed'}
                        </span>
                        <span className="text-xs text-neutral-400">
                          opened by @{activeIssue.author}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleIssueState}
                      className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold transition-all"
                    >
                      {activeIssue.state === 'open' ? 'Close Issue' : 'Reopen Issue'}
                    </button>
                  </div>

                  {/* Issue body */}
                  <div className="py-4 text-xs text-neutral-200 leading-relaxed">
                    <MarkdownRenderer content={activeIssue.body || 'No description provided.'} />
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-2">
                    Discussion ({activeIssue.comments?.length || 0})
                  </h3>
                  {(activeIssue.comments || []).map((cmt: any) => (
                    <div
                      key={cmt.id}
                      className="p-4 rounded-2xl ios-glass border border-white/[0.06] flex items-start gap-3"
                    >
                      <img
                        src={cmt.authorAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${cmt.author}`}
                        alt={cmt.author}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-white">@{cmt.author}</span>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(cmt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">{cmt.body}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add comment input */}
                  {currentUser ? (
                    <form onSubmit={handleAddComment} className="pt-2">
                      <div className="rounded-2xl ios-glass-card border border-white/[0.08] p-3">
                        <textarea
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full bg-transparent text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none resize-none h-20"
                        />
                        <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                          <button
                            type="submit"
                            disabled={submittingComment || !commentInput.trim()}
                            className="ios-btn-primary px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
                          >
                            {submittingComment ? 'Posting...' : 'Comment'}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/[0.03] text-center text-xs text-neutral-400">
                      Please sign in to participate in the conversation.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMITS */}
        {tab === 'commits' && (
          <div className="rounded-3xl ios-glass-card border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
            {commits.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 text-xs">Loading commits...</div>
            ) : (
              commits.map((c) => (
                <div key={c.sha} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={c.author?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.author?.name}`}
                      alt={c.author?.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20 mt-0.5"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{c.message}</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {c.author?.name} committed on {new Date(c.author?.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08] font-mono text-[11px] text-neutral-400">
                    {c.shortSha}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: RELEASES & MEDIA ASSETS */}
        {tab === 'releases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Releases & Media Engine</h3>
                <p className="text-xs text-neutral-400">
                  Store large binaries, distributions and media assets powered by GitHub Releases
                </p>
              </div>

              <button
                onClick={() => setUploadOpen(true)}
                className="ios-btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Media Asset</span>
              </button>
            </div>

            <div className="p-8 rounded-3xl ios-glass-card border border-white/[0.08] text-center space-y-3">
              <HardDrive className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <h4 className="text-base font-bold text-white">Release Storage Connected</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Assets uploaded for this repository will be synchronized and linked to the <code className="text-pink-300">eluivie-db-storage</code> release engine.
              </p>
              <Link
                href="/storage"
                className="inline-block mt-2 ios-btn-secondary px-5 py-2 text-xs font-medium"
              >
                Browse Global Media Vault
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* New File / Edit File In-Browser Modal */}
      <FileEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        owner={owner}
        repo={name}
        initialPath={editorInitialPath}
        initialContent={editorInitialContent}
        sha={editorSha}
        onSuccess={() => {
          loadContents(currentPath);
        }}
      />

      {/* Storage Upload Modal */}
      <StorageUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          // reload
        }}
      />

      {/* New Issue Modal */}
      <AnimatePresence>
        {newIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNewIssueModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl ios-glass-card p-6 text-white shadow-2xl z-10"
            >
              <h3 className="text-base font-bold mb-4">Open a New Issue</h3>
              <form onSubmit={handleCreateIssue} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="Describe the issue or feature"
                    className="w-full ios-input px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                    Description (Markdown supported)
                  </label>
                  <textarea
                    value={issueBody}
                    onChange={(e) => setIssueBody(e.target.value)}
                    placeholder="Leave a comment or details..."
                    className="w-full ios-input px-3.5 py-2 text-xs h-28 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewIssueModalOpen(false)}
                    className="px-4 py-2 rounded-full bg-white/[0.06] text-xs text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingIssue || !issueTitle.trim()}
                    className="ios-btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {creatingIssue ? 'Opening...' : 'Submit Issue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
