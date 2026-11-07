import Link from "next/link";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { checkInAction, checkOutAction, deleteAttendanceAction } from "@/app/actions/attendance";
import { db } from "@/db";
import { attendance, members } from "@/db/schema";
import { BarChart } from "@/components/charts";
import { ConfirmButton, SubmitButton } from "@/components/buttons";
import { Avatar, Card, Empty, Field, StatCard, StatusBadge, TableWrap, btn, inputCls } from "@/components/ui";
import { addDays, fmtDate, fmtShort, fmtTime, nowTimeStr, todayStr } from "@/lib/dates";
import { memberCode } from "@/lib/format";

/** Shared attendance console for admin (all members) and trainer (assigned members). */
export default async function AttendanceView({
  base,
  trainerId,
  date,
  isAdmin,
}: {
  base: string;
  trainerId: number | null;
  date: string;
  isAdmin: boolean;
}) {
  const today = todayStr();
  const scopeMembers = await db
    .select({ id: members.id, name: members.name, status: members.status })
    .from(members)
    .where(trainerId ? eq(members.trainerId, trainerId) : undefined)
    .orderBy(members.name);
  const ids = scopeMembers.map((m) => m.id);
  const inScope = ids.length ? inArray(attendance.memberId, ids) : sql`false`;

  const [dayRows, weekRows, [monthCount], top] = await Promise.all([
    db
      .select({
        id: attendance.id,
        memberId: members.id,
        name: members.name,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        status: attendance.status,
      })
      .from(attendance)
      .innerJoin(members, eq(attendance.memberId, members.id))
      .where(and(eq(attendance.date, date), inScope))
      .orderBy(desc(attendance.checkIn)),
    db
      .select({ d: attendance.date, c: sql<number>`count(*)::int` })
      .from(attendance)
      .where(and(gte(attendance.date, addDays(today, -6)), lte(attendance.date, today), inScope))
      .groupBy(attendance.date),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(attendance)
      .where(and(gte(attendance.date, `${today.slice(0, 7)}-01`), lte(attendance.date, today), inScope)),
    db
      .select({ id: members.id, name: members.name, c: sql<number>`count(*)::int` })
      .from(attendance)
      .innerJoin(members, eq(attendance.memberId, members.id))
      .where(and(gte(attendance.date, addDays(today, -29)), inScope))
      .groupBy(members.id, members.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
  ]);

  const weekMap = new Map(weekRows.map((r) => [r.d, r.c]));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, -(6 - i));
    return { label: fmtShort(d), value: weekMap.get(d) ?? 0 };
  });
  const weekTotal = week.reduce((a, b) => a + b.value, 0);
  const checkedIn = new Set(dayRows.map((r) => r.memberId));
  const eligible = scopeMembers.filter((m) => m.status === "active" && !checkedIn.has(m.id));

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={date === today ? "Today" : fmtDate(date)} value={dayRows.length} hint="check-ins" icon="✅" accent />
        <StatCard label="Last 7 days" value={weekTotal} hint={`${(weekTotal / 7).toFixed(1)} avg / day`} icon="📅" />
        <StatCard label="This month" value={monthCount?.c ?? 0} hint="total check-ins" icon="🗓️" />
        <StatCard label="Currently in gym" value={dayRows.filter((r) => !r.checkOut).length} hint="not checked out" icon="🏋️" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Mark attendance" className="lg:col-span-1">
          <form action={checkInAction} className="space-y-3">
            <input type="hidden" name="back" value={`${base}?date=${date}`} />
            <Field label="Member">
              <select name="memberId" required className={inputCls} defaultValue="">
                <option value="" disabled>Select member</option>
                {eligible.map((m) => <option key={m.id} value={m.id}>{m.name} ({memberCode(m.id)})</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date"><input type="date" name="date" defaultValue={date} max={today} className={inputCls} /></Field>
              <Field label="Check-in time"><input type="time" name="time" defaultValue={nowTimeStr()} className={inputCls} /></Field>
            </div>
            <SubmitButton className={`${btn("primary")} w-full`}>Check in</SubmitButton>
            <p className="text-xs text-ink/50">Only members with an active membership can be checked in.</p>
          </form>
          <form method="get" className="mt-5 flex items-end gap-2 border-t border-ink/10 pt-4">
            <Field label="View date" className="flex-1"><input type="date" name="date" defaultValue={date} max={today} className={inputCls} /></Field>
            <button className={btn("dark")}>Go</button>
          </form>
        </Card>

        <Card title="Last 7 days" className="lg:col-span-2">
          <BarChart data={week} height={120} />
        </Card>

        <Card title={`Check-ins — ${fmtDate(date)}`} pad={false} className="lg:col-span-2">
          {dayRows.length === 0 ? <Empty>No attendance recorded for this date.</Empty> : (
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Member</th><th>Check-in</th><th>Check-out</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {dayRows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="flex items-center gap-2">
                          <Avatar name={r.name} size="sm" />
                          <Link href={isAdmin ? `/admin/members/${r.memberId}` : `/trainer/members/${r.memberId}`} className="font-semibold hover:text-link">{r.name}</Link>
                        </span>
                      </td>
                      <td>{fmtTime(r.checkIn)}</td>
                      <td>{r.checkOut ? fmtTime(r.checkOut) : <span className="text-ink/40">In gym</span>}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          {!r.checkOut && (
                            <form action={checkOutAction}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="back" value={`${base}?date=${date}`} />
                              <SubmitButton className={btn("dark", "sm")}>Check out</SubmitButton>
                            </form>
                          )}
                          {isAdmin && (
                            <form action={deleteAttendanceAction}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="back" value={`${base}?date=${date}`} />
                              <ConfirmButton className={btn("danger", "sm")} message="Remove this attendance record?">✕</ConfirmButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>

        <Card title="Most active (30 days)" pad={false}>
          {top.length === 0 ? <Empty>No data yet.</Empty> : (
            <ol className="divide-y divide-ink/5 text-sm">
              {top.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3">
                  <span className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-link">{i + 1}</span>
                    <span className="font-semibold">{t.name}</span>
                  </span>
                  <span className="text-ink/60">{t.c} days</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
