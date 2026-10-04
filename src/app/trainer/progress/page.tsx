import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { members, progress } from "@/db/schema";
import ProgressPanel from "@/components/progress-panel";
import { Avatar, Card, Empty, PageHeader, TableWrap, first, type SP } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";

export default async function TrainerProgress({ searchParams }: { searchParams: SP }) {
  const { trainer } = await requireTrainer();
  const sp = await searchParams;
  const mine = await db.select().from(members).where(eq(members.trainerId, trainer.id)).orderBy(members.name);
  const ids = mine.map((m) => m.id);
  const entries = ids.length
    ? await db.select().from(progress).where(inArray(progress.memberId, ids)).orderBy(progress.date)
    : [];
  const selected = mine.find((m) => String(m.id) === first(sp.member)) ?? mine[0];

  const summary = mine.map((m) => {
    const ws = entries.filter((e) => e.memberId === m.id && e.weightKg !== null);
    const firstW = ws[0]?.weightKg ?? null;
    const lastW = ws[ws.length - 1]?.weightKg ?? null;
    return { m, firstW, lastW, last: ws[ws.length - 1]?.date ?? null, delta: firstW !== null && lastW !== null ? lastW - firstW : null };
  });

  return (
    <>
      <PageHeader title="Member Progress" subtitle="Track weight and measurements for your members." />
      {mine.length === 0 ? (
        <Card><Empty>No members assigned yet.</Empty></Card>
      ) : (
        <>
          <Card pad={false} className="mb-6">
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Member</th><th>First</th><th>Latest</th><th>Change</th><th>Last entry</th></tr></thead>
                <tbody>
                  {summary.map(({ m, firstW, lastW, last, delta }) => (
                    <tr key={m.id} className={selected?.id === m.id ? "bg-accent/5" : ""}>
                      <td>
                        <Link href={`/trainer/progress?member=${m.id}`} className="flex items-center gap-2 font-semibold hover:text-link">
                          <Avatar name={m.name} size="sm" /> {m.name}
                        </Link>
                      </td>
                      <td>{firstW !== null ? `${firstW} kg` : "—"}</td>
                      <td>{lastW !== null ? `${lastW} kg` : "—"}</td>
                      <td className={delta === null ? "" : delta <= 0 ? "font-semibold text-emerald-700 dark:text-emerald-300" : "font-semibold text-amber-700 dark:text-amber-300"}>
                        {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
                      </td>
                      <td>{fmtDate(last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
          {selected && (
            <>
              <h2 className="mb-3 text-lg font-bold">{selected.name}</h2>
              <ProgressPanel memberId={selected.id} />
            </>
          )}
        </>
      )}
    </>
  );
}
