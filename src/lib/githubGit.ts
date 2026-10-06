/**
 * Eluivie GitHub Git Engine
 * Connects directly to GitHub REST API to perform live repository actions:
 * File browsing, code viewing, commits, branch management, repo creation.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = process.env.GITHUB_OWNER || 'yasamarium';

const headers = {
  get Authorization() {
    return `Bearer ${process.env.GITHUB_TOKEN || ''}`;
  },
  'User-Agent': 'eluivie-app',
  Accept: 'application/vnd.github+json',
};

export interface GitRepoSummary {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  isPrivate: boolean;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  updatedAt: string;
  pushedAt: string;
  language: string | null;
  htmlUrl: string;
  cloneUrl: string;
}

export async function fetchUserRepos(username: string = OWNER): Promise<GitRepoSummary[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Failed to fetch repos for ${username}: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      description: r.description,
      isPrivate: r.private,
      defaultBranch: r.default_branch || 'main',
      starsCount: r.stargazers_count,
      forksCount: r.forks_count,
      openIssuesCount: r.open_issues_count,
      updatedAt: r.updated_at,
      pushedAt: r.pushed_at,
      language: r.language,
      htmlUrl: r.html_url,
      cloneUrl: r.clone_url,
    }));
  } catch (err) {
    console.error('fetchUserRepos error:', err);
    return [];
  }
}

export async function fetchRepoDetails(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchRepoContents(owner: string, repo: string, path: string = '', ref?: string) {
  let url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  if (ref) {
    url += `?ref=${encodeURIComponent(ref)}`;
  }

  const res = await fetch(url, {
    headers,
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const json = await res.json();

  if (Array.isArray(json)) {
    return {
      type: 'dir',
      items: json.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type, // 'file' | 'dir'
        size: item.size,
        sha: item.sha,
        downloadUrl: item.download_url,
      })),
    };
  }

  // Single file
  const isBase64 = json.encoding === 'base64';
  const content = isBase64 && json.content
    ? Buffer.from(json.content, 'base64').toString('utf-8')
    : json.content || '';

  return {
    type: 'file',
    name: json.name,
    path: json.path,
    size: json.size,
    sha: json.sha,
    content: content,
    downloadUrl: json.download_url,
    htmlUrl: json.html_url,
  };
}

export async function commitFileChanges(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
  branch: string = 'main'
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const base64 = Buffer.from(content, 'utf-8').toString('base64');

  const body: any = {
    message,
    content: base64,
    branch,
  };

  if (sha) {
    body.sha = sha;
  } else {
    // Check if file exists
    const current = await fetchRepoContents(owner, repo, path, branch);
    if (current && current.type === 'file' && current.sha) {
      body.sha = current.sha;
    }
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Git commit failed: ${res.status} ${err}`);
  }

  return await res.json();
}

export async function deleteRepoFile(
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string,
  branch: string = 'main'
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sha,
      branch,
    }),
  });

  return res.ok;
}

export async function fetchRepoCommits(owner: string, repo: string, limit: number = 30) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`, {
    headers,
    cache: 'no-store',
  });

  if (!res.ok) return [];
  const commits = await res.json();
  return commits.map((c: any) => ({
    sha: c.sha,
    shortSha: c.sha.substring(0, 7),
    message: c.commit.message,
    author: {
      name: c.commit.author.name,
      email: c.commit.author.email,
      date: c.commit.author.date,
      avatarUrl: c.author?.avatar_url,
    },
    htmlUrl: c.html_url,
  }));
}

export async function fetchRepoBranches(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
    headers,
    cache: 'no-store',
  });

  if (!res.ok) return ['main'];
  const branches = await res.json();
  return branches.map((b: any) => b.name);
}

export async function createGitHubRepo(data: {
  name: string;
  description?: string;
  isPrivate?: boolean;
  autoInit?: boolean;
}) {
  const res = await fetch(`https://api.github.com/user/repos`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description || '',
      private: !!data.isPrivate,
      auto_init: data.autoInit !== false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create repository: ${res.status} ${err}`);
  }

  return await res.json();
}
