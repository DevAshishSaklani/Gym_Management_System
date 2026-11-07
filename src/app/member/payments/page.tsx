import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { membershipPlans, payments } from "@/db/schema";
import { Card, Empty, PageHeader, StatCard, StatusBadge, TableWrap } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";
import { formatINR, methodLabel, paymentCode } from "@/lib/format";

export default async function MemberPayments() {
  const { member } = await requireMember();
  const rows = await db
    .select({ p: payments, plan: membershipPlans.name })
    .from(payments)
    .leftJoin(membershipPlans, eq(payments.planId, membershipPlans.id))
    .where(eq(payments.memberId, member.id))
    .orderBy(desc(payments.paymentDate), desc(payments.id));
  const paid = rows.filter((r) => r.p.status === "paid").reduce((a, r) => a + r.p.amount, 0);
  const pending = rows.filter((r) => r.p.status === "pending").reduce((a, r) => a + r.p.amount, 0);

  return (
    <>
      <PageHeader title="Payments" subtitle="Your payment history." />
      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Total paid" value={formatINR(paid)} accent />
        <StatCard label="Pending" value={formatINR(pending)} />
      </div>
      <Card pad={false}>
        {rows.length === 0 ? <Empty>No payments yet.</Empty> : (
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>ID</th><th>Date</th><th>Plan</th><th>Method</th><th>Txn</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map(({ p, plan }) => (
                  <tr key={p.id}>
                    <td>{paymentCode(p.id)}</td>
                    <td className="whitespace-nowrap">{fmtDate(p.paymentDate)}</td>
                    <td>{plan ?? "—"}</td>
                    <td>{methodLabel(p.method)}</td>
                    <td className="text-xs text-ink/60">{p.transactionId || "—"}</td>
                    <td className="font-semibold">{formatINR(p.amount)}</td>
                    <td><StatusBadge status={p.status} /></td>
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
