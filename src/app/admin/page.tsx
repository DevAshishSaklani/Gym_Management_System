import Link from "next/link";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, members, membershipPlans, payments } from "@/db/schema";
import { BarChart, HBars } from "@/components/charts";
import { Avatar, Card, Empty, ExpiryBadge, StatCard, StatusBadge, btn } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { addDays, daysBetween, fmtDate, fmtTime, todayStr } from "@/lib/dates";
import { formatINR, memberCode, methodLabel } from "@/lib/format";
import { revenueByMonth, revenueBetween } from "@/lib/stats";

export default async function AdminDashboard() {
  const user = await requireRole("admin");
  const today = todayStr();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`(count(*) filter (where ${members.status} = 'active'))::int`,
      expired: sql<number>`(count(*) filter (where ${members.status} = 'expired'))::int`,
      newThisMonth: sql<number>`(count(*) filter (where ${members.joinDate} >= ${monthStart}))::int`,
    })
    .from(members);

  const [todayAtt] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(attendance)
    .where(eq(attendance.date, today));

  const monthRevenue = await revenueBetween(monthStart, today);
  const revenue = await revenueByMonth(6);

  const expiring = await db
    .select({
      id: members.id,
      name: members.name,
      expiry: members.membershipExpiry,
      plan: membershipPlans.name,
    })
    .from(members)
    .leftJoin(membershipPlans, eq(members.planId, membershipPlans.id))
    .where(and(eq(members.status, "active"), gte(members.membershipExpiry, today), lte(members.membershipExpiry, addDays(today, 14))))
    .orderBy(members.membershipExpiry)
    .limit(6);

  const todaysList = await db
    .select({
      id: attendance.id,
      memberId: members.id,
      name: members.name,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
    })
    .from(attendance)
    .innerJoin(members, eq(attendance.memberId, members.id))
    .where(eq(attendance.date, today))
    .orderBy(desc(attendance.checkIn))
    .limit(6);

  const recentPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      date: payments.paymentDate,
      method: payments.method,
      status: payments.status,
      memberId: members.id,
      name: members.name,
    })
    .from(payments)
    .innerJoin(members, eq(payments.memberId, members.id))
    .orderBy(desc(payments.paymentDate), desc(payments.id))
    .limit(6);

  const recentMembers = await db
    .select()
    .from(members)
    .orderBy(desc(members.joinDate), desc(members.id))
    .limit(5);

  const dist = await db
    .select({ name: membershipPlans.name, c: sql<number>`count(*)::int` })
    .from(members)
    .innerJoin(membershipPlans, eq(members.planId, membershipPlans.id))
    .where(eq(members.status, "active"))
    .groupBy(membershipPlans.name);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Good day, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-ink/60">Here&apos;s what&apos;s happening at your gym today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Members" value={totals.total} hint={`+${totals.newThisMonth} this month`} icon="👥" />
        <StatCard label="Active Members" value={totals.active} icon="💪" />
        <StatCard label="Expired" value={totals.expired} hint="Need renewal" icon="⏰" />
        <StatCard label="Today's Attendance" value={todayAtt?.c ?? 0} icon="✅" />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label="Monthly Revenue" value={formatINR(monthRevenue)} icon="💰" accent />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Revenue — last 6 months" className="lg:col-span-2">
          <BarChart data={revenue} format={(v) => `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`} />
        </Card>
        <Card title="Membership distribution">
          {dist.length === 0 ? (
            <Empty>No active memberships yet.</Empty>
          ) : (
            <HBars data={dist.map((d) => ({ label: d.name, value: d.c }))} format={(v) => `${v} members`} />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card
          title="Memberships expiring soon"
          pad={false}
          action={<Link href="/admin/members?status=active" className="text-xs font-semibold text-link">View all</Link>}
        >
          {expiring.length === 0 ? (
            <Empty>Nothing expiring in the next 14 days</Empty>
          ) : (
            <ul className="divide-y divide-ink/5">
              {expiring.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <Link href={`/admin/members/${m.id}`} className="flex min-w-0 items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{m.name}</span>
                      <span className="block text-xs text-ink/50">
                        {m.plan} · expires {fmtDate(m.expiry)}
                      </span>
                    </span>
                  </Link>
                  <ExpiryBadge days={m.expiry ? daysBetween(today, m.expiry) : null} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Today's attendance"
          pad={false}
          action={<Link href="/admin/attendance" className="text-xs font-semibold text-link">Manage</Link>}
        >
          {todaysList.length === 0 ? (
            <Empty>No check-ins yet today.</Empty>
          ) : (
            <ul className="divide-y divide-ink/5">
              {todaysList.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="flex items-center gap-3">
                    <Avatar name={a.name} size="sm" />
                    <span className="font-semibold">{a.name}</span>
                  </span>
                  <span className="text-xs text-ink/60">
                    {fmtTime(a.checkIn)} → {a.checkOut ? fmtTime(a.checkOut) : "in gym"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent payments"
          pad={false}
          action={<Link href="/admin/payments" className="text-xs font-semibold text-link">View all</Link>}
        >
          {recentPayments.length === 0 ? (
            <Empty>No payments yet.</Empty>
          ) : (
            <ul className="divide-y divide-ink/5">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block text-xs text-ink/50">
                      {fmtDate(p.date)} · {methodLabel(p.method)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{formatINR(p.amount)}</span>
                    <StatusBadge status={p.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent registrations"
          pad={false}
          action={<Link href="/admin/members" className={btn("ghost", "sm")}>All members</Link>}
        >
          <ul className="divide-y divide-ink/5">
            {recentMembers.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <Link href={`/admin/members/${m.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar name={m.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{m.name}</span>
                    <span className="block text-xs text-ink/50">
                      {memberCode(m.id)} · joined {fmtDate(m.joinDate)}
                    </span>
                  </span>
                </Link>
                <StatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
