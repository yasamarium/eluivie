/**
 * Eluivie GitHub Serverless Database Engine
 * Uses GitHub Repositories as a real-time, distributed, versioned NoSQL database.
 * Supports document store, activity feeds, release storage and binary uploads.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = process.env.GITHUB_OWNER || 'yasamarium';

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

function getCacheKey(repo: string, path: string): string {
  return `${repo}:${path}`;
}

export async function fetchFromGitHub(repo: string, path: string, options: { bypassCache?: boolean } = {}) {
  const cacheKey = getCacheKey(repo, path);
  if (!options.bypassCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached;
    }
  }

  const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'eluivie-db-engine',
      Accept: 'application/vnd.github+json',
    },
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
  path: string,
  data: any,
  commitMessage: string,
  sha?: string
) {
  const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`;
  let currentSha = sha;

  if (!currentSha) {
    // Attempt to get existing sha
    const existing = await fetchFromGitHub(repo, path, { bypassCache: true });
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
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'eluivie-db-engine',
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to commit file to ${repo}/${path}: ${res.status} - ${err}`);
  }

  const resJson = await res.json();
  // Update cache
  const cacheKey = getCacheKey(repo, path);
  memoryCache.set(cacheKey, {
    data: data,
    sha: resJson.content?.sha,
    timestamp: Date.now(),
  });

  return resJson;
}

export async function deleteFromGitHub(repo: string, path: string, commitMessage: string) {
  const existing = await fetchFromGitHub(repo, path, { bypassCache: true });
  if (!existing?.sha) {
    return false;
  }

  const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'eluivie-db-engine',
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: commitMessage,
      sha: existing.sha,
    }),
  });

  const cacheKey = getCacheKey(repo, path);
  memoryCache.delete(cacheKey);

  return res.ok;
}

export async function listDirectory(repo: string, path: string = '') {
  const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'eluivie-db-engine',
      Accept: 'application/vnd.github+json',
    },
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
    // Expired
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
  stars: string[]; // usernames
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
  const path = `issues/${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const items = await listDirectory(REPOS.ISSUES, path);
  const issues: IssueRecord[] = [];
  for (const item of items) {
    if (item.name.endsWith('.json')) {
      const res = await fetchFromGitHub(REPOS.ISSUES, `${path}/${item.name}`);
      if (res && res.data) {
        issues.push(res.data as IssueRecord);
      }
    }
  }
  // Sort descending by number
  return issues.sort((a, b) => b.number - a.number);
}

export async function saveIssue(issue: IssueRecord): Promise<void> {
  const path = `issues/${issue.repoOwner.toLowerCase()}/${issue.repoName.toLowerCase()}/${issue.number}.json`;
  await saveToGitHub(
    REPOS.ISSUES,
    path,
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
  // Check if release exists
  const listRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPOS.STORAGE}/releases`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'eluivie-storage',
      Accept: 'application/vnd.github+json',
    },
  });

  if (listRes.ok) {
    const releases = await listRes.json();
    const found = releases.find((r: any) => r.tag_name === tag);
    if (found) return found;
  }

  // Create new release
  const createRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPOS.STORAGE}/releases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'eluivie-storage',
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
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
  const release = await getOrCreateRelease(tag);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  const uploadUrl = `https://uploads.github.com/repos/${OWNER}/${REPOS.STORAGE}/releases/${release.id}/assets?name=${encodeURIComponent(cleanFileName)}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'eluivie-storage',
      'Content-Type': contentType,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    // If asset already exists, fall back to direct contents API or timestamped name
    const timestampName = `${Date.now()}_${cleanFileName}`;
    const fallbackUrl = `https://uploads.github.com/repos/${OWNER}/${REPOS.STORAGE}/releases/${release.id}/assets?name=${encodeURIComponent(timestampName)}`;
    const retryRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'eluivie-storage',
        'Content-Type': contentType,
      },
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
  const url = `https://api.github.com/repos/${OWNER}/${REPOS.STORAGE}/releases`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'eluivie-storage',
      Accept: 'application/vnd.github+json',
    },
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
