import Link from "next/link";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, members, membershipPlans, progress, workoutPlans } from "@/db/schema";
import { Avatar, Card, Empty, ExpiryBadge, PageHeader, StatusBadge, TableWrap } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { addDays, daysLeft, todayStr } from "@/lib/dates";
import { memberCode } from "@/lib/format";

export default async function TrainerMembers() {
  const { trainer } = await requireTrainer();
  const rows = await db
    .select({ m: members, plan: membershipPlans.name })
    .from(members)
    .leftJoin(membershipPlans, eq(members.planId, membershipPlans.id))
    .where(eq(members.trainerId, trainer.id))
    .orderBy(members.name);
  const ids = rows.map((r) => r.m.id);
  const [att, plans, weights] = ids.length
    ? await Promise.all([
        db
          .select({ id: attendance.memberId, c: sql<number>`count(*)::int` })
          .from(attendance)
          .where(and(inArray(attendance.memberId, ids), gte(attendance.date, addDays(todayStr(), -29))))
          .groupBy(attendance.memberId),
        db
          .select({ id: workoutPlans.memberId, c: sql<number>`count(*)::int` })
          .from(workoutPlans)
          .where(and(inArray(workoutPlans.memberId, ids), eq(workoutPlans.status, "active")))
          .groupBy(workoutPlans.memberId),
        db
          .select({ id: progress.memberId, w: progress.weightKg, d: progress.date })
          .from(progress)
          .where(inArray(progress.memberId, ids))
          .orderBy(progress.date),
      ])
    : [[], [], []];
  const attMap = new Map(att.map((a) => [a.id, a.c]));
  const planMap = new Map(plans.map((a) => [a.id, a.c]));
  const weightMap = new Map<number, number>();
  for (const w of weights) if (w.w !== null) weightMap.set(w.id, w.w);

  return (
    <>
      <PageHeader title="My Members" subtitle={`${rows.length} assigned member(s)`} />
      <Card pad={false}>
        {rows.length === 0 ? <Empty>No members assigned to you yet.</Empty> : (
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>Member</th><th>Plan</th><th>Expiry</th><th>Attendance (30d)</th><th>Workout plans</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map(({ m, plan }) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/trainer/members/${m.id}`} className="flex items-center gap-3">
                        <Avatar name={m.name} size="sm" />
                        <span>
                          <span className="block font-semibold hover:text-link">{m.name}</span>
                          <span className="block text-xs text-ink/50">{memberCode(m.id)}</span>
                        </span>
                      </Link>
                    </td>
                    <td>{plan ?? "—"}</td>
                    <td>{m.status === "active" ? <ExpiryBadge days={daysLeft(m.membershipExpiry)} /> : "—"}</td>
                    <td>{attMap.get(m.id) ?? 0} days</td>
                    <td>{planMap.get(m.id) ?? 0}</td>
                    <td>{weightMap.has(m.id) ? `${weightMap.get(m.id)} kg` : "—"}</td>
                    <td><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
