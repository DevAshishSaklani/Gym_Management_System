import Link from "next/link";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, membershipPlans, payments, progress, trainers, workoutExercises, workoutPlans } from "@/db/schema";
import { Badge, Card, Empty, StatusBadge } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { daysBetween, daysLeft, fmtDate, todayStr } from "@/lib/dates";
import { formatINR } from "@/lib/format";

export default async function MemberDashboard() {
  const { member } = await requireMember();
  const today = todayStr();
  const monthStart = `${today.slice(0, 7)}-01`;
  const elapsed = daysBetween(monthStart, today) + 1;

  const [[plan], [trainer], [att], [lastPay], [lastProg], [wplan]] = await Promise.all([
    member.planId ? db.select().from(membershipPlans).where(eq(membershipPlans.id, member.planId)).limit(1) : Promise.resolve([]),
    member.trainerId ? db.select().from(trainers).where(eq(trainers.id, member.trainerId)).limit(1) : Promise.resolve([]),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(attendance)
      .where(and(eq(attendance.memberId, member.id), gte(attendance.date, monthStart), lte(attendance.date, today))),
    db
      .select()
      .from(payments)
      .where(and(eq(payments.memberId, member.id), eq(payments.status, "paid")))
      .orderBy(desc(payments.paymentDate), desc(payments.id))
      .limit(1),
    db
      .select()
      .from(progress)
      .where(eq(progress.memberId, member.id))
      .orderBy(desc(progress.date), desc(progress.id))
      .limit(1),
    db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.memberId, member.id), eq(workoutPlans.status, "active")))
      .orderBy(desc(workoutPlans.id))
      .limit(1),
  ]);

  const exercises = wplan
    ? await db.select().from(workoutExercises).where(eq(workoutExercises.planId, wplan.id)).orderBy(workoutExercises.sortOrder)
    : [];
  const days = [...new Set(exercises.map((e) => e.day))];
  const todayDay = days.length ? days[Math.max(0, daysBetween(wplan!.startDate, today)) % days.length] : null;
  const todayExercises = exercises.filter((e) => e.day === todayDay).slice(0, 5);
  const left = daysLeft(member.membershipExpiry);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome, {member.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-ink/60">Here&apos;s your fitness snapshot.</p>
      </div>

      {member.status === "pending" && (
        <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Your account is awaiting membership activation. Please contact the front desk to choose a plan and complete payment.
        </div>
      )}
      {member.status === "suspended" && (
        <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Your membership is suspended. Please contact the front desk.
        </div>
      )}
      {member.status === "expired" && (
        <div className="mb-5 rounded-xl border border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          Your membership expired on {fmtDate(member.membershipExpiry)}. Please renew at the front desk.
        </div>
      )}
      {member.status === "active" && left !== null && left <= 7 && (
        <div className="mb-5 rounded-xl border border-orange-200 dark:border-orange-400/25 bg-orange-50 dark:bg-orange-500/10 px-4 py-3 text-sm text-orange-800 dark:text-orange-300">
          Your membership expires in {left} day{left === 1 ? "" : "s"} ({fmtDate(member.membershipExpiry)}). Renew soon!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-sidebar bg-[radial-gradient(300px_160px_at_100%_0%,rgb(212_164_55/0.18),transparent_70%)] p-5 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Membership</p>
          <p className="mt-2 text-2xl font-bold">{plan?.name ?? "No plan"}</p>
          {member.membershipExpiry ? (
            <p className="mt-1 text-sm text-white/70">
              {left !== null && left >= 0 ? <><span className="text-2xl font-bold text-accent">{left}</span> days remaining</> : "Expired"}
              <span className="block text-xs">Until {fmtDate(member.membershipExpiry)}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-white/70">Not started</p>
          )}
          <div className="mt-3"><StatusBadge status={member.status} /></div>
        </div>

        <Card title="Attendance">
          <p className="text-3xl font-bold">{att?.c ?? 0} <span className="text-lg font-medium text-ink/50">/ {elapsed} days</span></p>
          <p className="mt-1 text-sm text-ink/60">This month</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, ((att?.c ?? 0) / elapsed) * 100)}%` }} />
          </div>
          <Link href="/member/attendance" className="mt-3 inline-block text-xs font-semibold text-link">View history →</Link>
        </Card>

        <Card title="Trainer">
          {trainer ? (
            <>
              <p className="text-xl font-bold">{trainer.name}</p>
              <p className="text-sm text-ink/60">{trainer.specialization}</p>
              <p className="mt-2 text-xs text-ink/50">{trainer.phone}</p>
            </>
          ) : <p className="text-sm text-ink/50">No trainer assigned yet.</p>}
        </Card>

        <Card title="Today's workout" className="sm:col-span-2" action={<Link href="/member/workout" className="text-xs font-semibold text-link">Full plan →</Link>}>
          {!wplan || !todayDay ? (
            <p className="text-sm text-ink/50">No active workout plan yet. Your trainer will assign one soon.</p>
          ) : (
            <>
              <p className="text-lg font-bold">{todayDay} <span className="text-sm font-normal text-ink/50">· {wplan.name}</span></p>
              <ul className="mt-3 divide-y divide-ink/5 text-sm">
                {todayExercises.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <span className="font-medium">{e.exercise}</span>
                    <Badge tone="gray">{e.sets} × {e.reps}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <div className="grid gap-4">
          <Card title="Recent payment">
            {lastPay ? (
              <>
                <p className="text-2xl font-bold">{formatINR(lastPay.amount)}</p>
                <p className="text-xs text-ink/50">{fmtDate(lastPay.paymentDate)}</p>
              </>
            ) : <p className="text-sm text-ink/50">No payments yet.</p>}
          </Card>
          <Card title="Progress">
            {lastProg?.weightKg ? (
              <>
                <p className="text-2xl font-bold">{lastProg.weightKg} kg</p>
                <p className="text-xs text-ink/50">Logged {fmtDate(lastProg.date)}</p>
              </>
            ) : <Empty>Log your first entry</Empty>}
            <Link href="/member/progress" className="mt-2 inline-block text-xs font-semibold text-link">Update progress →</Link>
          </Card>
        </div>
      </div>
    </>
  );
}
