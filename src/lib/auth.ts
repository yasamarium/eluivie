import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import {
  getUserByUsername,
  saveUser,
  createSessionRecord,
  getSessionRecord,
  deleteSessionRecord,
  UserRecord,
  logActivity,
} from './db';

const SESSION_COOKIE_NAME = 'eluivie_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(username: string): Promise<string> {
  const token = generateToken();
  const session = {
    token,
    username: username.toLowerCase().trim(),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  await createSessionRecord(session);
  return token;
}

export async function getCurrentUser(): Promise<UserRecord | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await getSessionRecord(token);
    if (!session) return null;

    return await getUserByUsername(session.username);
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await deleteSessionRecord(token);
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

/**
 * Ensures the default owner superadmin account exists in the database repo
 */
export async function ensureOwnerAccount(): Promise<UserRecord> {
  const owner = 'yasamarium';
  let user = await getUserByUsername(owner);

  if (!user) {
    const hashedPassword = await hashPassword('eluivie2026');
    user = {
      id: 'usr_yasamarium',
      username: owner,
      email: 'yasamarium@eluivie.local',
      passwordHash: hashedPassword,
      name: 'Yasamarium',
      bio: 'Architect & Creator of Eluivie • Minimalist iOS-Themed Git Ecosystem',
      avatarUrl: 'https://avatars.githubusercontent.com/u/104193851?v=4',
      website: 'https://github.com/yasamarium',
      location: 'Earth',
      createdAt: new Date().toISOString(),
      followers: [],
      following: [],
      starredRepos: ['eluivie'],
      isVerified: true,
    };
    await saveUser(user);
    await logActivity({
      type: 'user_registered',
      actor: owner,
      details: 'Superadmin account initialized',
    });
  }

  return user;
}
