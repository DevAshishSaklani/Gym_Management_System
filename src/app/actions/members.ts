"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, payments, trainers, users, type PaymentMethod } from "@/db/schema";
import { getMemberProfile, hashPassword, requireRole } from "@/lib/auth";
import { assignMembership, notifyAdmins, notifyUser } from "@/lib/data";
import { todayStr } from "@/lib/dates";
import { flash, int, s } from "@/lib/form";
import { formatINR } from "@/lib/format";

const METHODS = ["cash", "upi", "card", "bank_transfer"];
const method = (v: string): PaymentMethod => (METHODS.includes(v) ? (v as PaymentMethod) : "cash");

export async function createMemberAction(fd: FormData) {
  await requireRole("admin");
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password") || "welcome123";
  if (name.length < 2) flash("/admin/members", "error", "Member name is required.");
  if (!/^\S+@\S+\.\S+$/.test(email)) flash("/admin/members", "error", "A valid email is required.");
  const dup = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (dup.length) flash("/admin/members", "error", "A user with this email already exists.");

  const [u] = await db
    .insert(users)
    .values({ name, email, passwordHash: hashPassword(password), role: "member" })
    .returning();
  const trainerId = int(fd, "trainerId");
  const [m] = await db
    .insert(members)
    .values({
      userId: u.id,
      name,
      email,
      phone: s(fd, "phone"),
      dob: s(fd, "dob") || null,
      gender: s(fd, "gender"),
      address: s(fd, "address"),
      emergencyContact: s(fd, "emergencyContact"),
      joinDate: todayStr(),
      status: "pending",
      trainerId,
    })
    .returning();

  const planId = int(fd, "planId");
  if (planId) {
    const res = await assignMembership(m.id, planId, s(fd, "startDate") || todayStr());
    if (res && fd.get("recordPayment")) {
      await db.insert(payments).values({
        memberId: m.id,
        planId,
        amount: res.plan.price,
        paymentDate: todayStr(),
        method: method(s(fd, "method")),
        transactionId: s(fd, "transactionId"),
        status: "paid",
      });
      await notifyUser(
        u.id,
        "Payment confirmed",
        `We received ${formatINR(res.plan.price)} for the ${res.plan.name} plan.`,
        "payment",
      );
    }
  }
  if (trainerId) {
    const [t] = await db.select().from(trainers).where(eq(trainers.id, trainerId)).limit(1);
    if (t) {
      await notifyUser(u.id, "Trainer assigned", `${t.name} is now your trainer.`, "assignment");
      await notifyUser(t.userId, "New member assigned", `${name} has been assigned to you.`, "assignment");
    }
  }
  await notifyAdmins("New member added", `${name} was added to the gym.`, "member");
  flash(
    `/admin/members/${m.id}`,
    "ok",
    `Member added. Login: ${email} / ${password}`,
  );
}

export async function updateMemberAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  if (!id) flash("/admin/members", "error", "Missing member.");
  const back = `/admin/members/${id}`;
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  if (name.length < 2) flash(back, "error", "Name is required.");
  if (!/^\S+@\S+\.\S+$/.test(email)) flash(back, "error", "A valid email is required.");
  const [m] = await db.select().from(members).where(eq(members.id, id)).limit(1);
  if (!m) flash("/admin/members", "error", "Member not found.");
  if (email !== m.email) {
    const dup = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (dup.length && dup[0].id !== m.userId) flash(back, "error", "That email is already in use.");
  }
  await db
    .update(members)
    .set({
      name,
      email,
      phone: s(fd, "phone"),
      dob: s(fd, "dob") || null,
      gender: s(fd, "gender"),
      address: s(fd, "address"),
      emergencyContact: s(fd, "emergencyContact"),
    })
    .where(eq(members.id, id));
  if (m.userId) await db.update(users).set({ name, email }).where(eq(users.id, m.userId));
  flash(back, "ok", "Member updated.");
}

export async function deleteMemberAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  if (!id) flash("/admin/members", "error", "Missing member.");
  const [m] = await db.select().from(members).where(eq(members.id, id)).limit(1);
  if (!m) flash("/admin/members", "error", "Member not found.");
  await db.delete(members).where(eq(members.id, id));
  if (m.userId) await db.delete(users).where(eq(users.id, m.userId));
  flash("/admin/members", "ok", `${m.name} was deleted.`);
}

export async function assignMembershipAction(fd: FormData) {
  await requireRole("admin");
  const memberId = int(fd, "memberId");
  const planId = int(fd, "planId");
  const back = `/admin/members/${memberId}`;
  if (!memberId || !planId) flash(back, "error", "Select a plan.");
  const res = await assignMembership(memberId, planId, s(fd, "startDate") || todayStr());
  if (!res) flash(back, "error", "Plan not found.");
  if (fd.get("recordPayment")) {
    await db.insert(payments).values({
      memberId,
      planId,
      amount: res.plan.price,
      paymentDate: todayStr(),
      method: method(s(fd, "method")),
      transactionId: s(fd, "transactionId"),
      status: "paid",
    });
    const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
    await notifyUser(m?.userId, "Payment confirmed", `We received ${formatINR(res.plan.price)} for ${res.plan.name}.`, "payment");
    await notifyAdmins("Payment received", `${m?.name} paid ${formatINR(res.plan.price)} (${res.plan.name}).`, "payment");
  }
  flash(back, "ok", `${res.plan.name} membership assigned until ${res.endDate}.`);
}

export async function assignTrainerAction(fd: FormData) {
  await requireRole("admin");
  const memberId = int(fd, "memberId");
  const trainerId = int(fd, "trainerId");
  const back = s(fd, "back") || `/admin/members/${memberId}`;
  if (!memberId) flash(back, "error", "Missing member.");
  await db.update(members).set({ trainerId }).where(eq(members.id, memberId));
  if (trainerId) {
    const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
    const [t] = await db.select().from(trainers).where(eq(trainers.id, trainerId)).limit(1);
    if (m && t) {
      await notifyUser(m.userId, "Trainer assigned", `${t.name} is now your trainer.`, "assignment");
      await notifyUser(t.userId, "New member assigned", `${m.name} has been assigned to you.`, "assignment");
    }
  }
  flash(back, "ok", trainerId ? "Trainer assigned." : "Trainer removed.");
}

export async function setMemberStatusAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  const target = s(fd, "status");
  const back = `/admin/members/${id}`;
  if (!id) flash("/admin/members", "error", "Missing member.");
  const [m] = await db.select().from(members).where(eq(members.id, id)).limit(1);
  if (!m) flash("/admin/members", "error", "Member not found.");
  let status: "active" | "expired" | "suspended" | "pending";
  if (target === "suspended") status = "suspended";
  else if (!m.membershipExpiry) status = "pending";
  else status = m.membershipExpiry < todayStr() ? "expired" : "active";
  await db.update(members).set({ status }).where(eq(members.id, id));
  await notifyUser(
    m.userId,
    status === "suspended" ? "Membership suspended" : "Membership reactivated",
    status === "suspended" ? "Your membership has been suspended. Contact the front desk." : "Your membership is active again.",
    "membership",
  );
  flash(back, "ok", `Status set to ${status}.`);
}

export async function updateOwnProfileAction(fd: FormData) {
  const user = await requireRole("member");
  const m = await getMemberProfile(user.id);
  if (!m) flash("/member/profile", "error", "Profile not found.");
  await db
    .update(members)
    .set({
      phone: s(fd, "phone"),
      address: s(fd, "address"),
      emergencyContact: s(fd, "emergencyContact"),
      dob: s(fd, "dob") || null,
      gender: s(fd, "gender"),
    })
    .where(eq(members.id, m.id));
  flash("/member/profile", "ok", "Profile updated.");
}
