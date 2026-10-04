"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { membershipPlans } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { flash, int, s } from "@/lib/form";

function parse(fd: FormData) {
  return {
    name: s(fd, "name"),
    durationMonths: int(fd, "durationMonths") ?? 0,
    price: int(fd, "price") ?? -1,
    description: s(fd, "description"),
    benefits: String(fd.get("benefits") ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n"),
  };
}

export async function createPlanAction(fd: FormData) {
  await requireRole("admin");
  const p = parse(fd);
  if (!p.name) flash("/admin/plans", "error", "Plan name is required.");
  if (p.durationMonths < 1) flash("/admin/plans", "error", "Duration must be at least 1 month.");
  if (p.price < 0) flash("/admin/plans", "error", "Enter a valid price.");
  await db.insert(membershipPlans).values(p);
  flash("/admin/plans", "ok", `Plan "${p.name}" created.`);
}

export async function updatePlanAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  const p = parse(fd);
  if (!id) flash("/admin/plans", "error", "Missing plan.");
  if (!p.name || p.durationMonths < 1 || p.price < 0) flash("/admin/plans", "error", "Check the plan details.");
  await db.update(membershipPlans).set(p).where(eq(membershipPlans.id, id));
  flash("/admin/plans", "ok", "Plan updated.");
}

export async function togglePlanAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  if (!id) flash("/admin/plans", "error", "Missing plan.");
  const [p] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, id)).limit(1);
  if (!p) flash("/admin/plans", "error", "Plan not found.");
  await db
    .update(membershipPlans)
    .set({ status: p.status === "active" ? "inactive" : "active" })
    .where(eq(membershipPlans.id, id));
  flash("/admin/plans", "ok", `Plan ${p.status === "active" ? "deactivated" : "activated"}.`);
}

export async function deletePlanAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  if (!id) flash("/admin/plans", "error", "Missing plan.");
  await db.delete(membershipPlans).where(eq(membershipPlans.id, id));
  flash("/admin/plans", "ok", "Plan deleted.");
}
