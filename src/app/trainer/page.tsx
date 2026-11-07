import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, members, workoutPlans } from "@/db/schema";
import { Avatar, Card, Empty, ExpiryBadge, StatCard, StatusBadge, btn } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { addDays, daysBetween, fmtDate, fmtTime, todayStr } from "@/lib/dates";

export default async function TrainerDashboard() {
  const { trainer } = await requireTrainer();
  const today = todayStr();
  const mine = await db.select().from(members).where(eq(members.trainerId, trainer.id)).orderBy(members.name);
  const ids = mine.map((m) => m.id);

  const [todayRows, plans] = ids.length
    ? await Promise.all([
        db
          .select({ id: attendance.id, memberId: attendance.memberId, checkIn: attendance.checkIn, checkOut: attendance.checkOut })
          .from(attendance)
          .where(and(eq(attendance.date, today), inArray(attendance.memberId, ids)))
          .orderBy(desc(attendance.checkIn)),
        db
          .select({ memberId: workoutPlans.memberId, c: sql<number>`count(*)::int` })
          .from(workoutPlans)
          .where(and(eq(workoutPlans.trainerId, trainer.id), eq(workoutPlans.status, "active")))
          .groupBy(workoutPlans.memberId),
      ])
    : [[], []];

  const planned = new Set(plans.map((p) => p.memberId));
  const activePlans = plans.reduce((a, b) => a + b.c, 0);
  const needsPlan = mine.filter((m) => m.status === "active" && !planned.has(m.id));
  const expiring = mine.filter(
    (m) => m.status === "active" && m.membershipExpiry && m.membershipExpiry >= today && m.membershipExpiry <= addDays(today, 14),
  );
  const nameOf = new Map(mine.map((m) => [m.id, m.name]));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome, {trainer.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-ink/60">{trainer.specialization || "Trainer"} · {trainer.experienceYears} years experience</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned members" value={mine.length} icon="👥" />
        <StatCard label="In gym today" value={todayRows.length} icon="✅" accent />
        <StatCard label="Active plans" value={activePlans} icon="📋" />
        <StatCard label="Need a plan" value={needsPlan.length} hint="Active members w/o plan" icon="⚠️" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Today's floor" pad={false} action={<Link href="/trainer/attendance" className="text-xs font-semibold text-link">Attendance</Link>}>
          {todayRows.length === 0 ? <Empty>None of your members have checked in yet.</Empty> : (
            <ul className="divide-y divide-ink/5 text-sm">
              {todayRows.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/trainer/members/${r.memberId}`} className="flex items-center gap-3 font-semibold hover:text-link">
                    <Avatar name={nameOf.get(r.memberId) ?? "?"} size="sm" />
                    {nameOf.get(r.memberId)}
                  </Link>
                  <span className="text-xs text-ink/60">{fmtTime(r.checkIn)} → {r.checkOut ? fmtTime(r.checkOut) : "in gym"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Members needing a workout plan" pad={false} action={<Link href="/trainer/workouts" className={btn("primary", "sm")}>Create plan</Link>}>
          {needsPlan.length === 0 ? <Empty>Everyone has an active plan</Empty> : (
            <ul className="divide-y divide-ink/5 text-sm">
              {needsPlan.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/trainer/members/${m.id}`} className="font-semibold hover:text-link">{m.name}</Link>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Memberships expiring (14 days)" pad={false} className="lg:col-span-2">
          {expiring.length === 0 ? <Empty>No upcoming expiries.</Empty> : (
            <ul className="divide-y divide-ink/5 text-sm">
              {expiring.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <span><span className="font-semibold">{m.name}</span> <span className="text-xs text-ink/50">· {fmtDate(m.membershipExpiry)}</span></span>
                  <ExpiryBadge days={m.membershipExpiry ? daysBetween(today, m.membershipExpiry) : null} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
