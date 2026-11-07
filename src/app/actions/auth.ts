"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { members, passwordResets, sessions, users } from "@/db/schema";
import { createSession, destroySession, getUser, hashPassword, homeFor, verifyPassword } from "@/lib/auth";
import { notifyAdmins } from "@/lib/data";
import { todayStr } from "@/lib/dates";
import { flash, s } from "@/lib/form";

export async function loginAction(fd: FormData) {
  const email = s(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) flash("/login", "error", "Enter your email and password.");
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || !verifyPassword(password, u.passwordHash)) {
    flash("/login", "error", "Invalid email or password.");
  }
  await createSession(u.id);
  redirect(homeFor(u.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function registerAction(fd: FormData) {
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const phone = s(fd, "phone");
  const password = String(fd.get("password") ?? "");
  if (name.length < 2) flash("/register", "error", "Please enter your full name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) flash("/register", "error", "Please enter a valid email address.");
  if (password.length < 6) flash("/register", "error", "Password must be at least 6 characters.");
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) flash("/register", "error", "An account with this email already exists.");

  const [u] = await db
    .insert(users)
    .values({ name, email, passwordHash: hashPassword(password), role: "member" })
    .returning();
  await db.insert(members).values({
    userId: u.id,
    name,
    email,
    phone,
    joinDate: todayStr(),
    status: "pending",
  });
  await notifyAdmins("New member registered", `${name} signed up and is awaiting activation.`, "member");
  await createSession(u.id);
  redirect("/member");
}

export async function forgotPasswordAction(fd: FormData) {
  const email = s(fd, "email").toLowerCase();
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u) flash("/forgot-password", "error", "No account found with that email.");
  const token = randomBytes(24).toString("hex");
  await db.insert(passwordResets).values({
    token,
    userId: u.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  redirect(`/forgot-password?link=${encodeURIComponent(`/reset-password?token=${token}`)}`);
}

export async function resetPasswordAction(fd: FormData) {
  const token = s(fd, "token");
  const password = String(fd.get("password") ?? "");
  const back = `/reset-password?token=${token}`;
  if (password.length < 6) flash(back, "error", "Password must be at least 6 characters.");
  const [r] = await db
    .select()
    .from(passwordResets)
    .where(
      and(eq(passwordResets.token, token), eq(passwordResets.used, false), gt(passwordResets.expiresAt, new Date())),
    )
    .limit(1);
  if (!r) flash("/forgot-password", "error", "That reset link is invalid or has expired.");
  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, r.userId));
  await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.token, token));
  await db.delete(sessions).where(eq(sessions.userId, r.userId));
  flash("/login", "ok", "Password updated. You can sign in now.");
}

export async function changePasswordAction(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  const back = user.role === "admin" ? "/admin" : `/${user.role}/profile`;
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 6) flash(back, "error", "New password must be at least 6 characters.");
  const [u] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!u || !verifyPassword(current, u.passwordHash)) flash(back, "error", "Current password is incorrect.");
  await db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, user.id));
  flash(back, "ok", "Password changed.");
}
