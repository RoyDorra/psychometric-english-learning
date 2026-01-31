import * as Crypto from "expo-crypto";
import { Session, User } from "../domain/types";
import { STORAGE_KEYS } from "../storage/keys";
import { getJson, remove, setJson } from "../storage/storage";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function createUserId() {
  const bytes = await Crypto.getRandomBytesAsync(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

async function hashPassword(password: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
}

export async function getUsers(): Promise<User[]> {
  return getJson<User[]>(STORAGE_KEYS.USERS, []);
}

async function saveUsers(users: User[]) {
  await setJson(STORAGE_KEYS.USERS, users);
}

export async function getUserById(userId: string) {
  const users = await getUsers();
  return users.find((u) => u.id === userId) ?? null;
}

export async function registerUser(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const users = await getUsers();
  const existing = users.find((u) => normalizeEmail(u.email) === normalized) ?? null;
  if (existing) {
    throw new Error("משתמש כבר קיים");
  }
  const passwordHash = await hashPassword(password);
  const user: User = {
    id: await createUserId(),
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUsers(users);
  const session = await createSession(user);
  return { user, session };
}

export async function loginUser(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const users = await getUsers();
  const user = users.find((u) => normalizeEmail(u.email) === normalized) ?? null;
  if (!user) {
    throw new Error("משתמש לא נמצא");
  }
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    throw new Error("סיסמה שגויה");
  }
  const session = await createSession(user);
  return { user, session };
}

async function createSession(user: Pick<User, "id">) {
  const session: Session = {
    user: {
      id: user.id,
    },
    token: `token-${Date.now()}`,
  };
  await setJson(STORAGE_KEYS.SESSION, session);
  return session;
}

export async function getSession(): Promise<Session | null> {
  return getJson<Session | null>(STORAGE_KEYS.SESSION, null);
}

export async function logoutUser() {
  await remove(STORAGE_KEYS.SESSION);
}
