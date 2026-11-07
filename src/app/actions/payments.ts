"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, membershipPlans, payments, type PaymentMethod, type PaymentStatus } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { assignMembership, notifyAdmins, notifyUser } from "@/lib/data";
import { todayStr } from "@/lib/dates";
import { flash, int, s } from "@/lib/form";
import { formatINR } from "@/lib/format";

const METHODS = ["cash", "upi", "card", "bank_transfer"];
const STATUSES = ["paid", "pending", "failed", "refunded"];

export async function recordPaymentAction(fd: FormData) {
  await requireRole("admin");
  const memberId = int(fd, "memberId");
  const planId = int(fd, "planId");
  if (!memberId) flash("/admin/payments", "error", "Select a member.");
  const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  if (!m) flash("/admin/payments", "error", "Member not found.");
  let amount = int(fd, "amount");
  if ((amount === null || amount <= 0) && planId) {
    const [p] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, planId)).limit(1);
    amount = p?.price ?? null;
  }
  if (amount === null || amount <= 0) flash("/admin/payments", "error", "Enter a valid amount.");
  const methodRaw = s(fd, "method");
  const statusRaw = s(fd, "status");
  const status = (STATUSES.includes(statusRaw) ? statusRaw : "paid") as PaymentStatus;
  const date = s(fd, "paymentDate") || todayStr();
  await db.insert(payments).values({
    memberId,
    planId,
    amount,
    paymentDate: date,
    method: (METHODS.includes(methodRaw) ? methodRaw : "cash") as PaymentMethod,
    transactionId: s(fd, "transactionId"),
    status,
  });
  if (status === "paid") {
    await notifyUser(m.userId, "Payment confirmed", `We received your payment of ${formatINR(amount)}.`, "payment");
    await notifyAdmins("Payment received", `${m.name} paid ${formatINR(amount)}.`, "payment");
    if (planId && fd.get("activate")) await assignMembership(memberId, planId, date);
  } else if (status === "pending") {
    await notifyAdmins("Payment pending", `${m.name} has a pending payment of ${formatINR(amount)}.`, "payment");
  }
  flash("/admin/payments", "ok", "Payment recorded.");
}

export async function updatePaymentStatusAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  const statusRaw = s(fd, "status");
  if (!id || !STATUSES.includes(statusRaw)) flash("/admin/payments", "error", "Invalid request.");
  await db.update(payments).set({ status: statusRaw as PaymentStatus }).where(eq(payments.id, id));
  flash("/admin/payments", "ok", `Payment marked ${statusRaw}.`);
}

export async function deletePaymentAction(fd: FormData) {
  await requireRole("admin");
  const id = int(fd, "id");
  if (!id) flash("/admin/payments", "error", "Missing payment.");
  await db.delete(payments).where(eq(payments.id, id));
  flash("/admin/payments", "ok", "Payment deleted.");
}
