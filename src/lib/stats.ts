import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, payments } from "@/db/schema";
import { monthLabel, shiftMonthKey, todayStr } from "@/lib/dates";

export async function revenueByMonth(months: number) {
  const currentKey = todayStr().slice(0, 7);
  const startKey = shiftMonthKey(currentKey, -(months - 1));
  const rows = await db
    .select({
      m: sql<string>`to_char(${payments.paymentDate}, 'YYYY-MM')`,
      total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
    })
    .from(payments)
    .where(and(eq(payments.status, "paid"), gte(payments.paymentDate, `${startKey}-01`)))
    .groupBy(sql`to_char(${payments.paymentDate}, 'YYYY-MM')`);
  const map = new Map(rows.map((r) => [r.m, r.total]));
  return Array.from({ length: months }, (_, i) => {
    const key = shiftMonthKey(startKey, i);
    return { key, label: monthLabel(key), value: map.get(key) ?? 0 };
  });
}

export async function revenueBetween(from: string, to: string) {
  const [r] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int` })
    .from(payments)
    .where(and(eq(payments.status, "paid"), gte(payments.paymentDate, from), lte(payments.paymentDate, to)));
  return r?.total ?? 0;
}

export async function attendanceByDay(from: string, to: string) {
  const rows = await db
    .select({ d: attendance.date, c: sql<number>`count(*)::int` })
    .from(attendance)
    .where(and(gte(attendance.date, from), lte(attendance.date, to)))
    .groupBy(attendance.date);
  return new Map(rows.map((r) => [r.d, r.c]));
}
