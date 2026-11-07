"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trainers, users } from "@/db/schema";
import { hashPassword, requireRole } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { flash, int, s } from "@/lib/form";

export async function createTrainerAction(fd: FormData) {
  await requireRole("admin");
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password") || "trainer123";
  if (name.length < 2) flash("/admin/trainers", "error", "Trainer name is required.");
  if (!/^\S+@\S+\.\S+$/.test(email)) flash("/admin/trainers", "error", "A valid email is required.");
  const dup = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (dup.length) flash("/admin/trainers", "error", "A user with this email already exists.");
  const [u] = await db
    .insert(users)
    .values({ name, email, passwordHash: hashPassword(password), role: "trainer" })
    .returning();
  await db.insert(trainers).values({
    userId: u.id,
    name,
    email,
    phone: s(fd, "phone"),
    specialization: s(fd, "specialization"),
    experienceYears: int(fd, "experienceYears") ?? 0,
    joinDate: s(fd, "joinDate") || todayStr(),
  });
  flash("/admin/trainers", "ok", `Trainer added. Login: ${email} / ${password}`);
}

export async function updateTrainerAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  if (!id) flash("/admin/trainers", "error", "Missing trainer.");
  const name = s(fd, "name");
  if (name.length < 2) flash("/admin/trainers", "error", "Trainer name is required.");
  const [t] = await db.select().from(trainers).where(eq(trainers.id, id)).limit(1);
  if (!t) flash("/admin/trainers", "error", "Trainer not found.");
  await db
    .update(trainers)
    .set({
      name,
      phone: s(fd, "phone"),
      specialization: s(fd, "specialization"),
      experienceYears: int(fd, "experienceYears") ?? 0,
    })
    .where(eq(trainers.id, id));
  if (t.userId) await db.update(users).set({ name }).where(eq(users.id, t.userId));
  flash("/admin/trainers", "ok", "Trainer updated.");
}

export async function toggleTrainerAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  if (!id) flash("/admin/trainers", "error", "Missing trainer.");
  const [t] = await db.select().from(trainers).where(eq(trainers.id, id)).limit(1);
  if (!t) flash("/admin/trainers", "error", "Trainer not found.");
  await db
    .update(trainers)
    .set({ status: t.status === "active" ? "inactive" : "active" })
    .where(eq(trainers.id, id));
  flash("/admin/trainers", "ok", `Trainer ${t.status === "active" ? "deactivated" : "activated"}.`);
}

export async function deleteTrainerAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  if (!id) flash("/admin/trainers", "error", "Missing trainer.");
  const [t] = await db.select().from(trainers).where(eq(trainers.id, id)).limit(1);
  if (!t) flash("/admin/trainers", "error", "Trainer not found.");
  await db.delete(trainers).where(eq(trainers.id, id));
  if (t.userId) await db.delete(users).where(eq(users.id, t.userId));
  flash("/admin/trainers", "ok", `${t.name} was removed. Their members are now unassigned.`);
}
