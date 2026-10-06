# eluivie ✦

> **A Minimalist, iOS-Dark Themed Git Cloud Platform & Serverless Database Ecosystem.**
> Powered entirely by distributed GitHub repositories and GitHub fine-grained token architecture. Ready to deploy directly to Vercel.

---

## ✦ Overview

**Eluivie** is a custom, self-hosted GitHub alternative engineered with an ultra-sleek **iOS Pure Black (OLED)** aesthetic, minimal typography, and spring-physics animations.

Instead of requiring external Postgres, MySQL, or Mongo services, Eluivie utilizes a distributed **5-Repository GitHub Database Engine** where document storage, activity streaming, and binary media releases are stored directly on GitHub via the REST and Releases APIs for 100% free, versioned, zero-maintenance storage.

---

## ✦ Core Features

### 1. Repository Management
- **Full Git Explorer**: Interactive file tree navigation with breadcrumb paths.
- **Syntax-Highlighted Code Viewer**: Clean code browser with line numbers, raw view, and 1-click clipboard copy.
- **In-Browser File Editor**: Create or edit files directly inside the browser and commit them with custom commit messages back to GitHub.
- **File Deletion**: Remove files with automated commit logging.
- **README Renderer**: Native GitHub-flavored markdown preview for every repository.
- **Commits History**: Visual timeline of recent commits, authors, hashes, and dates.
- **Clone Dropdown**: Instant HTTPS and SSH clone URLs with 1-click copy.
- **Live Starring**: Real-time star counter with optimistic updates and database synchronization.

### 2. Issues & Discussions Tracker
- Filter issues by `Open`, `Closed`, and `All`.
- Open new issues with markdown support.
- Threaded discussions with comments.
- Status toggle button (`Close Issue` / `Reopen Issue`).

### 3. Media & Storage Vault (Powered by GitHub Releases)
- **Zero-Cost Binary Blob Engine**: Uses GitHub Releases on `eluivie-db-storage` to store images, videos, zip archives, and application assets.
- **Direct CDN Download URLs**: Generates permanent download links hosted on GitHub's global CDN.
- **Media Gallery & Lightbox**: Visual preview for uploaded photos and asset size inspection.

### 4. Instagram / iOS Profile & Authentication
- **Segmented Auth**: Instagram-like floating card for Login & Registration.
- **Session Manager**: Cookie-based persistent session with hashed password security (`bcrypt`).
- **Pre-Configured Superadmin**: Root account initialized for `@yasamarium`.
- **Instagram-Themed Profile**:
  - Story-ring gradient avatar.
  - Verified creator badge.
  - Instagram statistics row: `Repos`, `Stars`, `Followers`, `Following`.
  - Live Follow / Unfollow system.
  - Profile customization (display name, bio, avatar URL, links).
  - **Contribution Heatmap Matrix**: 32-week emerald commit activity matrix.

### 5. Live Activity Feed
- Real-time global event stream tracking commits, new repositories, stars, and user registrations in `eluivie-db-activity`.

---

## ✦ Architecture: GitHub as a Database

| Component | Target Repository | Purpose |
|---|---|---|
| **Platform** | `yasamarium/eluivie` | Main Next.js web application |
| **Users DB** | `yasamarium/eluivie-db-users` | User credentials, sessions, profiles, followers |
| **Repos DB** | `yasamarium/eluivie-db-repos` | Extended metadata, topics, custom star records |
| **Issues DB** | `yasamarium/eluivie-db-issues` | Issues, discussion comments, issue statuses |
| **Activity DB**| `yasamarium/eluivie-db-activity` | Global and user-specific event feed |
| **Storage Engine** | `yasamarium/eluivie-db-storage` | Binary uploads, images & release distribution assets |

---

## ✦ Tech Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **UI & Animation**: Tailwind CSS v4, Framer Motion, Lucide React
- **Syntax & Markdown**: React Markdown, Remark GFM
- **Authentication**: Bcrypt.js, HTTP-Only Cookies
- **Deployment**: Vercel-ready serverless functions

---

## ✦ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/yasamarium/eluivie.git
cd eluivie
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file:
```env
GITHUB_TOKEN=your_github_pat_token
GITHUB_OWNER=yasamarium
DB_USERS_REPO=eluivie-db-users
DB_REPOS_REPO=eluivie-db-repos
DB_ISSUES_REPO=eluivie-db-issues
DB_ACTIVITY_REPO=eluivie-db-activity
DB_STORAGE_REPO=eluivie-db-storage
JWT_SECRET=your_jwt_secret_key
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Deploy to Vercel
1. Import repository `yasamarium/eluivie` into Vercel.
2. Add the environment variables from `.env.local`.
3. Deploy!

---

## ✦ Author

Crafted for **@yasamarium** • Creator of Eluivie.
