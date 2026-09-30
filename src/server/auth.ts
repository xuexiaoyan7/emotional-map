import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const SESSION_COOKIE = "emotional_map_session";
const secret = () => {
  const value = process.env.SESSION_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be configured in production.");
  return "development-only-change-me";
};
const signature = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function slugify(value: string) {
  const slug = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "memory-map";
}
export async function makeAvailablePublicSlug(displayName: string, excludingUserId?: string) {
  const base = slugify(displayName).slice(0, 48); let suffix = 1; let candidate = base;
  while (await db.user.findFirst({ where: { publicSlug: candidate, ...(excludingUserId ? { id: { not: excludingUserId } } : {}) }, select: { id: true } })) { suffix += 1; candidate = `${base.slice(0, 48 - String(suffix).length - 1)}-${suffix}`; }
  return candidate;
}

async function establishSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, `${userId}.${signature(userId)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function signInEmailUser(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await db.user.upsert({ where: { email: normalizedEmail }, update: {}, create: { email: normalizedEmail } });
  await establishSession(user.id);
  return user;
}

// Retained only to preserve existing local development sessions while email OTP replaces the login UI.
export async function signInDevelopmentUser(phone: string) {
  const user = await db.user.upsert({ where: { phone }, update: {}, create: { phone, displayName: `Memory keeper ${phone.slice(-4)}`, handle: `memory-${phone.replace(/\D/g, "").slice(-4)}`, publicSlug: `memory-${phone.replace(/\D/g, "").slice(-4)}` } });
  await establishSession(user.id);
  return user;
}

export async function completeCurrentUserProfile(userId: string, displayName: string) {
  const publicSlug = await makeAvailablePublicSlug(displayName, userId);
  return db.user.update({ where: { id: userId }, data: { displayName, publicSlug } });
}

export async function ensurePublicIdentity<T extends { id: string; displayName: string | null; publicSlug: string | null }>(user: T) {
  if (!user.displayName || user.publicSlug) return user;
  return completeCurrentUserProfile(user.id, user.displayName);
}

export async function getCurrentUser() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [id, received] = raw.split(".");
  if (!id || !received) return null;
  const expected = signature(id);
  if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return null;
  return db.user.findUnique({ where: { id } });
}

export async function signOut() { (await cookies()).delete(SESSION_COOKIE); }
