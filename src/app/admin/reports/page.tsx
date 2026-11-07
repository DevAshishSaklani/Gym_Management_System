import Link from "next/link";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, members, membershipPlans, payments } from "@/db/schema";
import { BarChart, HBars } from "@/components/charts";
import { Card, Empty, PageHeader, StatCard, TableWrap, btn, first, type SP } from "@/components/ui";
import { addDays, daysBetween, monthLong, shiftMonthKey, todayStr } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { attendanceByDay, revenueBetween, revenueByMonth } from "@/lib/stats";

export default async function ReportsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const today = todayStr();
  const currentKey = today.slice(0, 7);
  const raw = first(sp.month);
  const key = /^\d{4}-\d{2}$/.test(raw) && raw <= currentKey ? raw : currentKey;
  const from = `${key}-01`;
  const nextKey = shiftMonthKey(key, 1);
  const to = addDays(`${nextKey}-01`, -1);
  const monthDays = daysBetween(from, to) + 1;
  const elapsed = key === currentKey ? daysBetween(from, today) + 1 : monthDays;
  const rangeEnd = key === currentKey ? today : to;

  const [[mstats], monthRev, yearRev, dayRev, revenue12, byPlan, attMap, topMembers, dailyRevRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`(count(*) filter (where ${members.status} = 'active'))::int`,
        expired: sql<number>`(count(*) filter (where ${members.status} = 'expired'))::int`,
        suspended: sql<number>`(count(*) filter (where ${members.status} = 'suspended'))::int`,
        newInMonth: sql<number>`(count(*) filter (where ${members.joinDate} between ${from} and ${to}))::int`,
      })
      .from(members),
    revenueBetween(from, to),
    revenueBetween(`${key.slice(0, 4)}-01-01`, `${key.slice(0, 4)}-12-31`),
    revenueBetween(rangeEnd, rangeEnd),
    revenueByMonth(12),
    db
      .select({ name: sql<string>`coalesce(${membershipPlans.name}, 'Other')`, total: sql<number>`sum(${payments.amount})::int` })
      .from(payments)
      .leftJoin(membershipPlans, eq(payments.planId, membershipPlans.id))
      .where(and(eq(payments.status, "paid"), gte(payments.paymentDate, from), lte(payments.paymentDate, to)))
      .groupBy(membershipPlans.name),
    attendanceByDay(from, to),
    db
      .select({ id: members.id, name: members.name, c: sql<number>`count(*)::int` })
      .from(attendance)
      .innerJoin(members, eq(attendance.memberId, members.id))
      .where(and(gte(attendance.date, from), lte(attendance.date, to)))
      .groupBy(members.id, members.name)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db
      .select({ d: payments.paymentDate, total: sql<number>`sum(${payments.amount})::int` })
      .from(payments)
      .where(and(eq(payments.status, "paid"), gte(payments.paymentDate, from), lte(payments.paymentDate, to)))
      .groupBy(payments.paymentDate),
  ]);

  const totalCheckins = [...attMap.values()].reduce((a, b) => a + b, 0);
  const avgDaily = elapsed > 0 ? totalCheckins / elapsed : 0;
  const dailyRev = new Map(dailyRevRows.map((r) => [r.d, r.total]));
  const dayLabels = Array.from({ length: monthDays }, (_, i) => {
    const d = addDays(from, i);
    return { d, label: String(i + 1) };
  });

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle={monthLong(key)}
        action={
          <>
            <Link href={`/admin/reports?month=${shiftMonthKey(key, -1)}`} className={btn("ghost", "sm")}>← Prev</Link>
            {key < currentKey && (
              <Link href={`/admin/reports?month=${nextKey}`} className={btn("ghost", "sm")}>Next →</Link>
            )}
            <a href="/api/export/members" className={btn("dark", "sm")}>⬇ Members CSV</a>
            <a href="/api/export/payments" className={btn("dark", "sm")}>⬇ Payments CSV</a>
          </>
        }
      />

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/50">Members</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total members" value={mstats.total} />
        <StatCard label="New in month" value={mstats.newInMonth} />
        <StatCard label="Active" value={mstats.active} />
        <StatCard label="Expired" value={mstats.expired} />
        <StatCard label="Suspended" value={mstats.suspended} />
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/50">Revenue</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label={`Revenue — ${monthLong(key)}`} value={formatINR(monthRev)} accent />
        <StatCard label={key === currentKey ? "Today's revenue" : "Last day revenue"} value={formatINR(dayRev)} />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label={`Yearly — ${key.slice(0, 4)}`} value={formatINR(yearRev)} />
        </div>
      </div>
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card title="Monthly revenue (12 months)" className="lg:col-span-2">
          <BarChart data={revenue12} format={(v) => `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`} />
        </Card>
        <Card title="Revenue by plan">
          {byPlan.length === 0 ? <Empty>No paid revenue this month.</Empty> : (
            <HBars data={byPlan.map((p) => ({ label: p.name, value: p.total }))} format={formatINR} />
          )}
        </Card>
        <Card title="Daily revenue" className="lg:col-span-3">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <BarChart
                height={110}
                data={dayLabels.map((x) => ({ label: x.label, value: dailyRev.get(x.d) ?? 0 }))}
                format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
            </div>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/50">Attendance</h2>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Total check-ins" value={totalCheckins} />
        <StatCard label="Average daily attendance" value={avgDaily.toFixed(1)} hint={`over ${elapsed} day(s)`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Daily attendance" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <BarChart height={110} data={dayLabels.map((x) => ({ label: x.label, value: attMap.get(x.d) ?? 0 }))} />
            </div>
          </div>
        </Card>
        <Card title="Member attendance %" pad={false}>
          {topMembers.length === 0 ? <Empty>No attendance this month.</Empty> : (
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Member</th><th>Days</th><th>%</th></tr></thead>
                <tbody>
                  {topMembers.map((m) => (
                    <tr key={m.id}>
                      <td><Link href={`/admin/members/${m.id}`} className="font-semibold hover:text-link">{m.name}</Link></td>
                      <td>{m.c}</td>
                      <td>{Math.round((m.c / elapsed) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  );
}
