import Link from "next/link";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { Card, Empty, PageHeader, StatCard, StatusBadge, TableWrap, btn, first, type SP } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { addDays, daysBetween, fmtDate, fmtTime, monthLong, shiftMonthKey, todayStr } from "@/lib/dates";

export default async function MemberAttendance({ searchParams }: { searchParams: SP }) {
  const { member } = await requireMember();
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

  const rows = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.memberId, member.id), gte(attendance.date, from), lte(attendance.date, to)))
    .orderBy(desc(attendance.date));
  const present = new Set(rows.map((r) => r.date));
  const startDow = new Date(`${from}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const cells: (string | null)[] = [
    ...Array.from({ length: startDow }, () => null),
    ...Array.from({ length: monthDays }, (_, i) => addDays(from, i)),
  ];

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle={monthLong(key)}
        action={
          <>
            <Link href={`/member/attendance?month=${shiftMonthKey(key, -1)}`} className={btn("ghost", "sm")}>← Prev</Link>
            {key < currentKey && <Link href={`/member/attendance?month=${nextKey}`} className={btn("ghost", "sm")}>Next →</Link>}
          </>
        }
      />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Days attended" value={rows.length} accent />
        <StatCard label="Out of" value={elapsed} hint="days" />
        <StatCard label="Rate" value={`${Math.round((rows.length / elapsed) * 100)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Calendar">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="py-1 font-semibold text-ink/40">{d}</div>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <div key={`e${i}`} />
              ) : (
                <div
                  key={d}
                  className={`flex aspect-square items-center justify-center rounded-lg text-sm font-medium ${
                    present.has(d) ? "bg-accent text-accent-fg" : d > today ? "text-ink/25" : "bg-ink/5 text-ink/60"
                  } ${d === today ? "ring-2 ring-ink" : ""}`}
                >
                  {Number(d.slice(8))}
                </div>
              ),
            )}
          </div>
        </Card>
        <Card title="History" pad={false}>
          {rows.length === 0 ? <Empty>No attendance this month.</Empty> : (
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td>{fmtTime(r.checkIn)}</td>
                      <td>{fmtTime(r.checkOut)}</td>
                      <td><StatusBadge status={r.status} /></td>
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
