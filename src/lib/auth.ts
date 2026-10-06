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


