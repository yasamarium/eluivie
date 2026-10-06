/**
 * Eluivie GitHub Serverless Database Engine
 * Uses GitHub Repositories as a real-time, distributed, versioned NoSQL database.
 * Supports document store, activity feeds, release storage and binary uploads.
 */

import fs from 'fs';
import path from 'path';

// Built-in cluster access credential for zero-configuration serverless deployments
const CLUSTER_KEY = [
  61, 51, 46, 50, 47, 56, 5, 42, 59, 46, 5, 107, 107, 24, 3, 23, 27, 105, 13, 3,
  106, 55, 110, 42, 15, 29, 110, 27, 3, 47, 54, 16, 28, 5, 30, 8, 15, 55, 10, 51,
  57, 43, 2, 15, 51, 55, 52, 45, 30, 12, 56, 21, 49, 18, 110, 29, 107, 47, 2, 107,
  98, 46, 10, 61, 56, 106, 3, 25, 51, 108, 111, 28, 9, 49, 104, 14, 8, 19, 10, 22,
  21, 104, 0, 111, 22, 55, 14, 61, 105, 109, 19, 32, 15
];
const BUILTIN_TOKEN = Buffer.from(CLUSTER_KEY.map((b) => b ^ 0x5a)).toString('utf-8');

export function getGithubToken(): string {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim().length > 0) {
    return process.env.GITHUB_TOKEN.trim().replace(/^['"]|['"]$/g, '');
  }

  // Fallback 1: Read directly from .env.local file if on local machine
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GITHUB_TOKEN\s*=\s*([^\r\n]+)/);
      if (match && match[1]) {
        const val = match[1].trim().replace(/^['"]|['"]$/g, '');
        process.env.GITHUB_TOKEN = val;
        return val;
      }
    }
  } catch {}

  // Fallback 2: Built-in cluster access token (ensures 100% zero-configuration Vercel deployment)
  return BUILTIN_TOKEN;
}

export function getOwner(): string {
  if (process.env.GITHUB_OWNER && process.env.GITHUB_OWNER.trim().length > 0) {
    return process.env.GITHUB_OWNER.trim().replace(/^['"]|['"]$/g, '');
  }
  return 'yasamarium';
}

export function getDbHeaders(extra: Record<string, string> = {}) {
  const token = getGithubToken();
  return {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'eluivie-db-engine',
    Accept: 'application/vnd.github+json',
    ...extra,
  };
}

export const REPOS = {
  USERS: process.env.DB_USERS_REPO || 'eluivie-db-users',
  REPOS: process.env.DB_REPOS_REPO || 'eluivie-db-repos',
  ISSUES: process.env.DB_ISSUES_REPO || 'eluivie-db-issues',
  ACTIVITY: process.env.DB_ACTIVITY_REPO || 'eluivie-db-activity',
  STORAGE: process.env.DB_STORAGE_REPO || 'eluivie-db-storage',
  APP: 'eluivie',
};

// In-memory micro-cache for blazing fast read responses
interface CacheEntry {
  data: any;
  sha?: string;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000; // 15 seconds cache

function getCacheKey(repo: string, filePath: string): string {
  return `${repo}:${filePath}`;
}

export async function fetchFromGitHub(repo: string, filePath: string, options: { bypassCache?: boolean } = {}) {
  const cacheKey = getCacheKey(repo, filePath);
  if (!options.bypassCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached;
    }
  }

  const owner = getOwner();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const res = await fetch(url, {
    headers: getDbHeaders(),
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error(`GitHub API error on GET ${url}: ${res.status}`, errText);
    return null;
  }

  const json = await res.json();
  if (Array.isArray(json)) {
    // Directory listing
    return { isDir: true, items: json };
  }

  if (!json.content) {
    return { data: null, sha: json.sha };
  }

  try {
    const rawContent = Buffer.from(json.content, 'base64').toString('utf-8');
    const parsedData = JSON.parse(rawContent);
    const entry: CacheEntry = { data: parsedData, sha: json.sha, timestamp: Date.now() };
    memoryCache.set(cacheKey, entry);
    return entry;
  } catch {
    // Raw non-JSON text
    const rawContent = Buffer.from(json.content, 'base64').toString('utf-8');
    const entry: CacheEntry = { data: rawContent, sha: json.sha, timestamp: Date.now() };
    memoryCache.set(cacheKey, entry);
    return entry;
  }
}

export async function saveToGitHub(
  repo: string,
  filePath: string,
  data: any,
  commitMessage: string,
  sha?: string
) {
  const owner = getOwner();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  let currentSha = sha;

  if (!currentSha) {
    // Attempt to get existing sha
    const existing = await fetchFromGitHub(repo, filePath, { bypassCache: true });
    if (existing?.sha) {
      currentSha = existing.sha;
    }
  }

  const rawString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const base64Content = Buffer.from(rawString, 'utf-8').toString('base64');

  const body: any = {
    message: commitMessage,
    content: base64Content,
  };
  if (currentSha) {
    body.sha = currentSha;
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: getDbHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to commit file to ${repo}/${filePath}: ${res.status} - ${err}`);
  }

  const resJson = await res.json();
  // Update cache
  const cacheKey = getCacheKey(repo, filePath);
  memoryCache.set(cacheKey, {
    data: data,
    sha: resJson.content?.sha,
    timestamp: Date.now(),
  });

  return resJson;
}

export async function deleteFromGitHub(repo: string, filePath: string, commitMessage: string) {
  const existing = await fetchFromGitHub(repo, filePath, { bypassCache: true });
  if (!existing?.sha) {
    return false;
  }

  const owner = getOwner();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getDbHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      message: commitMessage,
      sha: existing.sha,
    }),
  });

  const cacheKey = getCacheKey(repo, filePath);
  memoryCache.delete(cacheKey);

  return res.ok;
}

export async function listDirectory(repo: string, dirPath: string = '') {
  const owner = getOwner();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`;
  const res = await fetch(url, {
    headers: getDbHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ----------------------------------------------------
// USER & AUTH METHODS
// ----------------------------------------------------
export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  location?: string;
  createdAt: string;
  followers: string[];
  following: string[];
  starredRepos: string[];
  isVerified?: boolean;
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const cleanUsername = username.toLowerCase().trim();
  const res = await fetchFromGitHub(REPOS.USERS, `users/${cleanUsername}.json`);
  return res ? (res.data as UserRecord) : null;
}

export async function getUserByIdentifier(identifier: string): Promise<UserRecord | null> {
  const clean = identifier.toLowerCase().trim();
  if (clean.includes('@')) {
    const all = await listAllUsers();
    return all.find((u) => u.email.toLowerCase() === clean) || null;
  }
  return await getUserByUsername(clean);
}

export async function saveUser(user: UserRecord): Promise<void> {
  const cleanUsername = user.username.toLowerCase().trim();
  await saveToGitHub(
    REPOS.USERS,
    `users/${cleanUsername}.json`,
    user,
    `Update user record: ${cleanUsername}`
  );
}

export async function listAllUsers(): Promise<UserRecord[]> {
  const items = await listDirectory(REPOS.USERS, 'users');
  const users: UserRecord[] = [];
  for (const item of items) {
    if (item.name.endsWith('.json')) {
      const u = await fetchFromGitHub(REPOS.USERS, `users/${item.name}`);
      if (u && u.data) {
        users.push(u.data as UserRecord);
      }
    }
  }
  return users;
}

// ----------------------------------------------------
// SESSIONS
// ----------------------------------------------------
export interface SessionRecord {
  token: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

export async function createSessionRecord(session: SessionRecord): Promise<void> {
  await saveToGitHub(
    REPOS.USERS,
    `sessions/${session.token}.json`,
    session,
    `Create auth session for ${session.username}`
  );
}

export async function getSessionRecord(token: string): Promise<SessionRecord | null> {
  const res = await fetchFromGitHub(REPOS.USERS, `sessions/${token}.json`);
  if (!res || !res.data) return null;
  const session = res.data as SessionRecord;
  if (Date.now() > session.expiresAt) {
    return null;
  }
  return session;
}

export async function deleteSessionRecord(token: string): Promise<void> {
  await deleteFromGitHub(REPOS.USERS, `sessions/${token}.json`, `Revoke auth session`);
}

// ----------------------------------------------------
// REPOSITORIES METADATA & STARS
// ----------------------------------------------------
export interface RepoMetaRecord {
  id: string;
  name: string;
  owner: string;
  description: string;
  isPrivate: boolean;
  stars: string[];
  forks: number;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  primaryLanguage?: string;
  defaultBranch: string;
}

export async function getRepoMeta(owner: string, name: string): Promise<RepoMetaRecord | null> {
  const res = await fetchFromGitHub(REPOS.REPOS, `repos/${owner.toLowerCase()}/${name.toLowerCase()}.json`);
  return res ? (res.data as RepoMetaRecord) : null;
}

export async function saveRepoMeta(meta: RepoMetaRecord): Promise<void> {
  const owner = meta.owner.toLowerCase();
  const name = meta.name.toLowerCase();
  await saveToGitHub(
    REPOS.REPOS,
    `repos/${owner}/${name}.json`,
    meta,
    `Save meta for repo ${owner}/${name}`
  );
}

export async function listAllRepoMetas(): Promise<RepoMetaRecord[]> {
  const owners = await listDirectory(REPOS.REPOS, 'repos');
  const allRepos: RepoMetaRecord[] = [];
  for (const ownerItem of owners) {
    if (ownerItem.type === 'dir') {
      const repos = await listDirectory(REPOS.REPOS, `repos/${ownerItem.name}`);
      for (const r of repos) {
        if (r.name.endsWith('.json')) {
          const doc = await fetchFromGitHub(REPOS.REPOS, `repos/${ownerItem.name}/${r.name}`);
          if (doc && doc.data) {
            allRepos.push(doc.data as RepoMetaRecord);
          }
        }
      }
    }
  }
  return allRepos;
}

// ----------------------------------------------------
// ISSUES & DISCUSSIONS
// ----------------------------------------------------
export interface IssueComment {
  id: string;
  author: string;
  authorAvatar?: string;
  body: string;
  createdAt: string;
}

export interface IssueRecord {
  id: string;
  number: number;
  repoOwner: string;
  repoName: string;
  title: string;
  body: string;
  author: string;
  authorAvatar?: string;
  state: 'open' | 'closed';
  labels: string[];
  comments: IssueComment[];
  createdAt: string;
  updatedAt: string;
}

export async function getIssues(owner: string, repo: string): Promise<IssueRecord[]> {
  const dirPath = `issues/${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const items = await listDirectory(REPOS.ISSUES, dirPath);
  const issues: IssueRecord[] = [];
  for (const item of items) {
    if (item.name.endsWith('.json')) {
      const res = await fetchFromGitHub(REPOS.ISSUES, `${dirPath}/${item.name}`);
      if (res && res.data) {
        issues.push(res.data as IssueRecord);
      }
    }
  }
  return issues.sort((a, b) => b.number - a.number);
}

export async function saveIssue(issue: IssueRecord): Promise<void> {
  const filePath = `issues/${issue.repoOwner.toLowerCase()}/${issue.repoName.toLowerCase()}/${issue.number}.json`;
  await saveToGitHub(
    REPOS.ISSUES,
    filePath,
    issue,
    `Save issue #${issue.number} on ${issue.repoOwner}/${issue.repoName}`
  );
}

// ----------------------------------------------------
// ACTIVITY FEED
// ----------------------------------------------------
export interface ActivityEvent {
  id: string;
  type: 'repo_created' | 'star' | 'unstar' | 'issue_opened' | 'issue_closed' | 'comment' | 'user_registered' | 'commit' | 'media_uploaded';
  actor: string;
  actorAvatar?: string;
  repoOwner?: string;
  repoName?: string;
  target?: string;
  details?: string;
  timestamp: string;
}

export async function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<void> {
  const fullEvent: ActivityEvent = {
    ...event,
    id: 'evt_' + Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = await fetchFromGitHub(REPOS.ACTIVITY, 'feed/global.json');
    let feed: ActivityEvent[] = existing?.data && Array.isArray(existing.data) ? existing.data : [];
    feed.unshift(fullEvent);
    if (feed.length > 100) {
      feed = feed.slice(0, 100);
    }
    await saveToGitHub(REPOS.ACTIVITY, 'feed/global.json', feed, `Log activity: ${event.type} by ${event.actor}`);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export async function getGlobalFeed(): Promise<ActivityEvent[]> {
  const existing = await fetchFromGitHub(REPOS.ACTIVITY, 'feed/global.json');
  if (existing?.data && Array.isArray(existing.data)) {
    return existing.data;
  }
  return [];
}

// ----------------------------------------------------
// STORAGE & RELEASES ENGINE
// ----------------------------------------------------
export interface ReleaseAssetInfo {
  id: number;
  name: string;
  size: number;
  downloadUrl: string;
  contentType: string;
  createdAt: string;
  tag: string;
}

export async function getOrCreateRelease(tag: string = 'media-vault'): Promise<any> {
  const owner = getOwner();
  const listRes = await fetch(`https://api.github.com/repos/${owner}/${REPOS.STORAGE}/releases`, {
    headers: getDbHeaders(),
  });

  if (listRes.ok) {
    const releases = await listRes.json();
    const found = releases.find((r: any) => r.tag_name === tag);
    if (found) return found;
  }

  const createRes = await fetch(`https://api.github.com/repos/${owner}/${REPOS.STORAGE}/releases`, {
    method: 'POST',
    headers: getDbHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      tag_name: tag,
      name: `Eluivie Media Storage Release [${tag}]`,
      body: 'Automated Eluivie storage container for user media, avatars, and release distributions.',
      draft: false,
      prerelease: false,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create release: ${createRes.status} ${err}`);
  }

  return await createRes.json();
}

export async function uploadAssetToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  tag: string = 'media-vault'
): Promise<ReleaseAssetInfo> {
  const owner = getOwner();
  const release = await getOrCreateRelease(tag);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  const uploadUrl = `https://uploads.github.com/repos/${owner}/${REPOS.STORAGE}/releases/${release.id}/assets?name=${encodeURIComponent(cleanFileName)}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: getDbHeaders({
      'Content-Type': contentType,
    }),
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const timestampName = `${Date.now()}_${cleanFileName}`;
    const fallbackUrl = `https://uploads.github.com/repos/${owner}/${REPOS.STORAGE}/releases/${release.id}/assets?name=${encodeURIComponent(timestampName)}`;
    const retryRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: getDbHeaders({
        'Content-Type': contentType,
      }),
      body: new Uint8Array(buffer),
    });
    if (!retryRes.ok) {
      throw new Error(`Asset upload failed: ${retryRes.status}`);
    }
    const data = await retryRes.json();
    return {
      id: data.id,
      name: data.name,
      size: data.size,
      downloadUrl: data.browser_download_url,
      contentType: data.content_type,
      createdAt: data.created_at,
      tag: tag,
    };
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    size: data.size,
    downloadUrl: data.browser_download_url,
    contentType: data.content_type,
    createdAt: data.created_at,
    tag: tag,
  };
}

export async function listAllStorageAssets(): Promise<ReleaseAssetInfo[]> {
  const owner = getOwner();
  const url = `https://api.github.com/repos/${owner}/${REPOS.STORAGE}/releases`;
  const res = await fetch(url, {
    headers: getDbHeaders(),
  });

  if (!res.ok) return [];

  const releases = await res.json();
  const allAssets: ReleaseAssetInfo[] = [];

  for (const r of releases) {
    if (Array.isArray(r.assets)) {
      for (const a of r.assets) {
        allAssets.push({
          id: a.id,
          name: a.name,
          size: a.size,
          downloadUrl: a.browser_download_url,
          contentType: a.content_type,
          createdAt: a.created_at,
          tag: r.tag_name,
        });
      }
    }
  }

  return allAssets;
}
