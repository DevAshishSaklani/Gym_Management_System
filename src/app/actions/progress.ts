"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { getMemberProfile, requireRole } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { flash, int, n, s } from "@/lib/form";

export async function addProgressAction(fd: FormData) {
  const user = await requireRole("member");
  const m = await getMemberProfile(user.id);
  const back = "/member/progress";
  if (!m) flash(back, "error", "Profile not found.");
  const weightKg = n(fd, "weightKg");
  const chestCm = n(fd, "chestCm");
  const waistCm = n(fd, "waistCm");
  const armsCm = n(fd, "armsCm");
  const pr = s(fd, "personalRecord");
  if ([weightKg, chestCm, waistCm, armsCm].every((v) => v === null) && !pr) {
    flash(back, "error", "Enter at least one measurement or a personal record.");
  }
  for (const v of [weightKg, chestCm, waistCm, armsCm]) {
    if (v !== null && (v <= 0 || v > 500)) flash(back, "error", "Measurements look invalid.");
  }
  await db.insert(progress).values({
    memberId: m.id,
    date: s(fd, "date") || todayStr(),
    weightKg,
    chestCm,
    waistCm,
    armsCm,
    personalRecord: pr,
    notes: s(fd, "notes"),
  });
  flash(back, "ok", "Progress logged.");
}

export async function deleteProgressAction(fd: FormData) {
  const user = await requireRole("member");
  const m = await getMemberProfile(user.id);
  const id = int(fd, "id");
  if (!m || !id) flash("/member/progress", "error", "Invalid request.");
  await db.delete(progress).where(and(eq(progress.id, id), eq(progress.memberId, m.id)));
  flash("/member/progress", "ok", "Entry deleted.");
}
