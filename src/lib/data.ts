import { and, desc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { members, membershipPlans, memberships, notifications, users } from "@/db/schema";
import { addDays, addMonths, todayStr } from "@/lib/dates";
import { formatINR } from "@/lib/format";

export async function notifyUser(
  userId: number | null | undefined,
  title: string,
  message: string,
  type = "info",
) {
  if (!userId) return;
  await db.insert(notifications).values({ userId, title, message, type });
}

export async function notifyAdmins(title: string, message: string, type = "info") {
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  if (admins.length === 0) return;
  await db
    .insert(notifications)
    .values(admins.map((a) => ({ userId: a.id, title, message, type })));
}

let lastSync = 0;

/** Marks lapsed memberships as expired and raises expiry reminders. Throttled to once a minute. */
export async function syncExpiry(force = false) {
  if (!force && Date.now() - lastSync < 60_000) return;
  lastSync = Date.now();
  const today = todayStr();

  const expired = await db
    .update(members)
    .set({ status: "expired" })
    .where(and(eq(members.status, "active"), lt(members.membershipExpiry, today)))
    .returning({ id: members.id, userId: members.userId, name: members.name });

  for (const m of expired) {
    await notifyUser(
      m.userId,
      "Membership expired",
      "Your membership has expired. Please renew to continue training.",
      "expired",
    );
    await notifyAdmins("Membership expired", `${m.name}'s membership has expired.`, "expired");
  }

  const soon = await db
    .select({ id: members.id, userId: members.userId, expiry: members.membershipExpiry })
    .from(members)
    .where(
      and(
        eq(members.status, "active"),
        gte(members.membershipExpiry, today),
        lte(members.membershipExpiry, addDays(today, 7)),
      ),
    );
  const recent = new Date(Date.now() - 3 * 86400000);
  for (const m of soon) {
    if (!m.userId) continue;
    const existing = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, m.userId),
          eq(notifications.type, "expiring"),
          gte(notifications.createdAt, recent),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      await notifyUser(
        m.userId,
        "Membership expiring soon",
        `Your membership expires on ${m.expiry}. Renew now to avoid interruption.`,
        "expiring",
      );
    }
  }
}

/** Assigns (or renews) a membership plan and updates the member's denormalised fields. */
export async function assignMembership(memberId: number, planId: number, startDate: string) {
  const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, planId)).limit(1);
  if (!plan) return null;
  const endDate = addMonths(startDate, plan.durationMonths);
  await db.insert(memberships).values({
    memberId,
    planId,
    planName: plan.name,
    startDate,
    endDate,
    price: plan.price,
  });
  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  const status = member?.status === "suspended" ? "suspended" : endDate < todayStr() ? "expired" : "active";
  await db
    .update(members)
    .set({ planId, membershipStart: startDate, membershipExpiry: endDate, status })
    .where(eq(members.id, memberId));
  if (member) {
    await notifyUser(
      member.userId,
      "Membership assigned",
      `${plan.name} plan (${formatINR(plan.price)}) is active until ${endDate}.`,
      "membership",
    );
  }
  return { plan, startDate, endDate };
}

export async function unreadCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return row?.c ?? 0;
}

export async function listNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}

export async function membersByIds(ids: number[]) {
  if (ids.length === 0) return [];
  return db.select().from(members).where(inArray(members.id, ids));
}
