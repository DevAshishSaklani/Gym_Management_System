import { desc, eq } from "drizzle-orm";
import type { ReactNode } from "react";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { LineChart } from "@/components/charts";
import { Card, Empty, TableWrap } from "@/components/ui";
import { fmtDate, fmtShort } from "@/lib/dates";

export default async function ProgressPanel({
  memberId,
  renderDelete,
}: {
  memberId: number;
  renderDelete?: (id: number) => ReactNode;
}) {
  const rows = await db.select().from(progress).where(eq(progress.memberId, memberId)).orderBy(desc(progress.date), desc(progress.id));
  const weights = rows
    .filter((r) => r.weightKg !== null)
    .slice(0, 8)
    .reverse()
    .map((r) => ({ label: fmtShort(r.date), value: Math.round((r.weightKg as number) * 10) / 10 }));
  const prs = rows.filter((r) => r.personalRecord).slice(0, 5);
  const f = (v: number | null) => (v === null ? "—" : String(v));

  return (
    <div className="space-y-6">
      <Card title="Weight progress (kg)">
        {weights.length === 0 ? <Empty>No weight entries yet.</Empty> : <LineChart data={weights} />}
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Measurement log" pad={false} className="lg:col-span-2">
          {rows.length === 0 ? <Empty>No entries yet.</Empty> : (
            <TableWrap>
              <table className="tbl">
                <thead>
                  <tr><th>Date</th><th>Weight</th><th>Chest</th><th>Waist</th><th>Arms</th>{renderDelete && <th></th>}</tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="font-semibold">{f(r.weightKg)}{r.weightKg !== null && " kg"}</td>
                      <td>{f(r.chestCm)}</td>
                      <td>{f(r.waistCm)}</td>
                      <td>{f(r.armsCm)}</td>
                      {renderDelete && <td>{renderDelete(r.id)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
        <Card title="Personal records" pad={false}>
          {prs.length === 0 ? <Empty>No personal records logged.</Empty> : (
            <ul className="divide-y divide-ink/5 text-sm">
              {prs.map((p) => (
                <li key={p.id} className="px-5 py-3">
                  <p className="font-semibold">PR · {p.personalRecord}</p>
                  <p className="text-xs text-ink/50">{fmtDate(p.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
