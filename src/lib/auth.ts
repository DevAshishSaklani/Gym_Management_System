import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { members, sessions, trainers, users, type Role } from "@/db/schema";

const COOKIE = "gym_session";
const SESSION_DAYS = 14;

export type SessionUser = { id: number; name: string; email: string; role: Role };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  jar.delete(COOKIE);
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
});

export function homeFor(role: Role): string {
  return `/${role}`;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

export async function getMemberProfile(userId: number) {
  const rows = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getTrainerProfile(userId: number) {
  const rows = await db.select().from(trainers).where(eq(trainers.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function requireMember() {
  const user = await requireRole("member");
  const member = await getMemberProfile(user.id);
  if (!member) redirect("/login");
  return { user, member };
}

export async function requireTrainer() {
  const user = await requireRole("trainer");
  const trainer = await getTrainerProfile(user.id);
  if (!trainer) redirect("/login");
  return { user, trainer };
}
