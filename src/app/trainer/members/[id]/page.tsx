import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance, members, membershipPlans, workoutPlans } from "@/db/schema";
import ProgressPanel from "@/components/progress-panel";
import { Avatar, Card, Empty, ExpiryBadge, StatusBadge, TableWrap } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { daysLeft, fmtDate, fmtTime } from "@/lib/dates";
import { memberCode } from "@/lib/format";

export default async function TrainerMemberDetail({ params }: { params: Promise<{ id: string }> }) {
  const { trainer } = await requireTrainer();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [row] = await db
    .select({ m: members, plan: membershipPlans.name })
    .from(members)
    .leftJoin(membershipPlans, eq(members.planId, membershipPlans.id))
    .where(and(eq(members.id, id), eq(members.trainerId, trainer.id)))
    .limit(1);
  if (!row) notFound();
  const { m, plan } = row;
  const [wplans, att] = await Promise.all([
    db.select().from(workoutPlans).where(eq(workoutPlans.memberId, id)).orderBy(desc(workoutPlans.id)),
    db.select().from(attendance).where(eq(attendance.memberId, id)).orderBy(desc(attendance.date)).limit(8),
  ]);

  return (
    <>
      <Link href="/trainer/members" className="mb-4 inline-block text-sm font-semibold text-link">← My members</Link>
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={m.name} size="lg" />
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{m.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
            {memberCode(m.id)} · {m.gender || "—"} · {m.phone || "no phone"} <StatusBadge status={m.status} />
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Membership">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Plan</dt><dd className="font-semibold">{plan ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Expiry</dt><dd>{fmtDate(m.membershipExpiry)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Remaining</dt><dd><ExpiryBadge days={daysLeft(m.membershipExpiry)} /></dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Emergency</dt><dd>{m.emergencyContact || "—"}</dd></div>
          </dl>
        </Card>
        <Card title="Workout plans" pad={false} className="lg:col-span-2">
          {wplans.length === 0 ? <Empty>No workout plans yet. Create one from the Workout Plans page.</Empty> : (
            <ul className="divide-y divide-ink/5 text-sm">
              {wplans.map((w) => (
                <li key={w.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/trainer/workouts/${w.id}`} className="font-semibold hover:text-link">{w.name} <span className="font-normal text-ink/50">· {w.goal}</span></Link>
                  <StatusBadge status={w.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent attendance" pad={false} className="lg:col-span-3">
          {att.length === 0 ? <Empty>No attendance yet.</Empty> : (
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th></tr></thead>
                <tbody>
                  {att.map((a) => (
                    <tr key={a.id}><td>{fmtDate(a.date)}</td><td>{fmtTime(a.checkIn)}</td><td>{fmtTime(a.checkOut)}</td></tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Progress</h2>
      <ProgressPanel memberId={id} />
    </>
  );
}
