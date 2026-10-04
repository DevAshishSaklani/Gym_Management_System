"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance, members } from "@/db/schema";
import { getTrainerProfile, requireRole } from "@/lib/auth";
import { istTimestamp, nowTimeStr, todayStr } from "@/lib/dates";
import { flash, int, s, safePath } from "@/lib/form";

async function guard(memberId: number) {
  const user = await requireRole("admin", "trainer");
  const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  if (!m) return { user, member: null as null };
  if (user.role === "trainer") {
    const t = await getTrainerProfile(user.id);
    if (!t || m.trainerId !== t.id) return { user, member: null as null };
  }
  return { user, member: m };
}

export async function checkInAction(fd: FormData) {
  const memberId = int(fd, "memberId");
  const back = safePath(s(fd, "back"), "/admin/attendance");
  if (!memberId) flash(back, "error", "Select a member.");
  const { member } = await guard(memberId);
  if (!member) flash(back, "error", "Member not found or not assigned to you.");
  if (member.status !== "active") flash(back, "error", `${member.name}'s membership is ${member.status}. Check-in not allowed.`);
  const date = s(fd, "date") || todayStr();
  const time = s(fd, "time") || nowTimeStr();
  try {
    await db.insert(attendance).values({
      memberId,
      date,
      checkIn: istTimestamp(date, time),
      status: "present",
    });
  } catch {
    flash(back, "error", `${member.name} is already checked in for ${date}.`);
  }
  flash(back, "ok", `${member.name} checked in at ${time}.`);
}

export async function checkOutAction(fd: FormData) {
  const id = int(fd, "id");
  const back = safePath(s(fd, "back"), "/admin/attendance");
  if (!id) flash(back, "error", "Missing record.");
  const [a] = await db.select().from(attendance).where(eq(attendance.id, id)).limit(1);
  if (!a) flash(back, "error", "Record not found.");
  const { member } = await guard(a.memberId);
  if (!member) flash(back, "error", "Not allowed.");
  const out = istTimestamp(a.date, s(fd, "time") || nowTimeStr());
  const when = out.getTime() <= a.checkIn.getTime() ? new Date() : out;
  await db.update(attendance).set({ checkOut: when }).where(eq(attendance.id, id));
  flash(back, "ok", `${member.name} checked out.`);
}

export async function deleteAttendanceAction(fd: FormData) {
  const id = int(fd, "id");
  const back = safePath(s(fd, "back"), "/admin/attendance");
  await requireRole("admin");
  if (!id) flash(back, "error", "Missing record.");
  await db.delete(attendance).where(eq(attendance.id, id));
  flash(back, "ok", "Attendance record removed.");
}
