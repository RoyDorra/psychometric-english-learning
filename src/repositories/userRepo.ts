import * as Crypto from "expo-crypto";
import { Session, User } from "../domain/types";
import { STORAGE_KEYS } from "../storage/keys";
import { getJson, remove, setJson } from "../storage/storage";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

export async function getUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const users = await getUsers();
  return users.find((u) => normalizeEmail(u.email) === normalized) ?? null;
}

export async function registerUser(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const existing = await getUserByEmail(normalized);
  if (existing) {
    throw new Error("משתמש כבר קיים");
  }
  const passwordHash = await hashPassword(password);
  const user: User = {
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
  const session = await createSession(normalized);
  return { user, session };
}

export async function loginUser(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const user = await getUserByEmail(normalized);
  if (!user) {
    throw new Error("משתמש לא נמצא");
  }
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    throw new Error("סיסמה שגויה");
  }
  const session = await createSession(normalized);
  return { user, session };
}

async function createSession(email: string) {
  const session: Session = {
    email,
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
