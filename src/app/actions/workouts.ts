"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { members, workoutExercises, workoutPlans } from "@/db/schema";
import { getTrainerProfile, requireRole } from "@/lib/auth";
import { notifyUser } from "@/lib/data";
import { todayStr } from "@/lib/dates";
import { flash, int, s } from "@/lib/form";

async function context() {
  const user = await requireRole("admin", "trainer");
  const trainer = user.role === "trainer" ? await getTrainerProfile(user.id) : null;
  return { user, trainer, base: `/${user.role}/workouts` };
}

async function loadOwnedPlan(planId: number, trainerId: number | null, role: string, base: string) {
  const [plan] = await db.select().from(workoutPlans).where(eq(workoutPlans.id, planId)).limit(1);
  if (!plan) flash(base, "error", "Workout plan not found.");
  if (role === "trainer" && plan.trainerId !== trainerId) flash(base, "error", "You can only edit your own plans.");
  return plan;
}

export async function createWorkoutPlanAction(fd: FormData) {
  const { user, trainer, base } = await context();
  const name = s(fd, "name");
  const memberId = int(fd, "memberId");
  if (!name) flash(base, "error", "Plan name is required.");
  if (!memberId) flash(base, "error", "Select a member.");
  const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  if (!m) flash(base, "error", "Member not found.");
  let trainerId: number | null;
  if (user.role === "trainer") {
    if (!trainer || m.trainerId !== trainer.id) flash(base, "error", "That member is not assigned to you.");
    trainerId = trainer.id;
  } else {
    trainerId = int(fd, "trainerId") ?? m.trainerId;
  }
  const [plan] = await db
    .insert(workoutPlans)
    .values({
      name,
      goal: s(fd, "goal"),
      trainerId,
      memberId,
      startDate: s(fd, "startDate") || todayStr(),
      endDate: s(fd, "endDate") || null,
      notes: s(fd, "notes"),
    })
    .returning();
  await notifyUser(m.userId, "New workout plan", `A new workout plan "${name}" was assigned to you.`, "workout");
  flash(`${base}/${plan.id}`, "ok", "Plan created. Now add exercises.");
}

export async function addExerciseAction(fd: FormData) {
  const { trainer, user, base } = await context();
  const planId = int(fd, "planId");
  if (!planId) flash(base, "error", "Missing plan.");
  const back = `${base}/${planId}`;
  await loadOwnedPlan(planId, trainer?.id ?? null, user.role, base);
  const exercise = s(fd, "exercise");
  if (!exercise) flash(back, "error", "Exercise name is required.");
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${workoutExercises.sortOrder}), -1) + 1` })
    .from(workoutExercises)
    .where(eq(workoutExercises.planId, planId));
  await db.insert(workoutExercises).values({
    planId,
    day: s(fd, "day") || "Day 1",
    exercise,
    muscleGroup: s(fd, "muscleGroup"),
    sets: Math.max(1, int(fd, "sets") ?? 3),
    reps: s(fd, "reps") || "10",
    weight: s(fd, "weight"),
    restSeconds: Math.max(0, int(fd, "restSeconds") ?? 60),
    notes: s(fd, "notes"),
    sortOrder: next,
  });
  flash(back, "ok", `${exercise} added.`);
}

export async function deleteExerciseAction(fd: FormData) {
  const { trainer, user, base } = await context();
  const id = int(fd, "id");
  const planId = int(fd, "planId");
  if (!id || !planId) flash(base, "error", "Missing exercise.");
  await loadOwnedPlan(planId, trainer?.id ?? null, user.role, base);
  await db.delete(workoutExercises).where(eq(workoutExercises.id, id));
  flash(`${base}/${planId}`, "ok", "Exercise removed.");
}

export async function setWorkoutStatusAction(fd: FormData) {
  const { trainer, user, base } = await context();
  const planId = int(fd, "planId");
  if (!planId) flash(base, "error", "Missing plan.");
  const plan = await loadOwnedPlan(planId, trainer?.id ?? null, user.role, base);
  const status = plan.status === "active" ? "completed" : "active";
  await db.update(workoutPlans).set({ status }).where(eq(workoutPlans.id, planId));
  flash(`${base}/${planId}`, "ok", `Plan marked ${status}.`);
}

export async function deleteWorkoutPlanAction(fd: FormData) {
  const { trainer, user, base } = await context();
  const planId = int(fd, "planId");
  if (!planId) flash(base, "error", "Missing plan.");
  await loadOwnedPlan(planId, trainer?.id ?? null, user.role, base);
  await db.delete(workoutPlans).where(eq(workoutPlans.id, planId));
  flash(base, "ok", "Workout plan deleted.");
}
