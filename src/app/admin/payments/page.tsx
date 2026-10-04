import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { deletePaymentAction, recordPaymentAction, updatePaymentStatusAction } from "@/app/actions/payments";
import { db } from "@/db";
import { members, membershipPlans, payments } from "@/db/schema";
import { ConfirmButton, SubmitButton } from "@/components/buttons";
import {
  Card,
  Empty,
  Field,
  Flash,
  PageHeader,
  Pill,
  StatCard,
  StatusBadge,
  TableWrap,
  btn,
  first,
  inputCls,
  type SP,
} from "@/components/ui";
import { fmtDate, todayStr } from "@/lib/dates";
import { formatINR, memberCode, methodLabel, paymentCode } from "@/lib/format";

export default async function PaymentsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const status = first(sp.status);
  const valid = ["paid", "pending", "failed", "refunded"].includes(status);
  const monthStart = `${todayStr().slice(0, 7)}-01`;

  const [rows, memberList, plans, [sum]] = await Promise.all([
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        date: payments.paymentDate,
        method: payments.method,
        txn: payments.transactionId,
        status: payments.status,
        memberId: members.id,
        memberName: members.name,
        plan: membershipPlans.name,
      })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .leftJoin(membershipPlans, eq(payments.planId, membershipPlans.id))
      .where(valid ? and(eq(payments.status, status as "paid")) : undefined)
      .orderBy(desc(payments.paymentDate), desc(payments.id))
      .limit(200),
    db.select({ id: members.id, name: members.name }).from(members).orderBy(members.name),
    db.select().from(membershipPlans).where(eq(membershipPlans.status, "active")).orderBy(membershipPlans.durationMonths),
    db
      .select({
        month: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'paid' and ${payments.paymentDate} >= ${monthStart}), 0)::int`,
        pending: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'pending'), 0)::int`,
        pendingCount: sql<number>`(count(*) filter (where ${payments.status} = 'pending'))::int`,
      })
      .from(payments),
  ]);

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Record and track all member payments."
        action={<a href="/api/export/payments" className={btn("ghost")}>⬇ Export CSV</a>}
      />
      <Flash ok={sp.ok} error={sp.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Collected this month" value={formatINR(sum.month)} icon="💰" accent />
        <StatCard label="Pending" value={formatINR(sum.pending)} hint={`${sum.pendingCount} pending payment(s)`} icon="⏳" />
      </div>

      <details className="mb-6 rounded-2xl border border-ink/10 bg-surface shadow-card">
        <summary className="px-5 py-4 text-sm font-semibold">＋ Record payment</summary>
        <form action={recordPaymentAction} className="grid gap-4 border-t border-ink/10 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Member *">
            <select name="memberId" required className={inputCls} defaultValue="">
              <option value="" disabled>Select member</option>
              {memberList.map((m) => <option key={m.id} value={m.id}>{m.name} ({memberCode(m.id)})</option>)}
            </select>
          </Field>
          <Field label="Membership plan">
            <select name="planId" className={inputCls} defaultValue="">
              <option value="">— none —</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — ₹{p.price}</option>)}
            </select>
          </Field>
          <Field label="Amount (₹) — blank uses plan price"><input name="amount" type="number" min={1} className={inputCls} /></Field>
          <Field label="Payment date"><input name="paymentDate" type="date" defaultValue={todayStr()} className={inputCls} /></Field>
          <Field label="Method">
            <select name="method" className={inputCls} defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" className={inputCls} defaultValue="paid">
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </Field>
          <Field label="Transaction ID"><input name="transactionId" className={inputCls} /></Field>
          <label className="flex items-end gap-2 pb-2 text-sm lg:col-span-2">
            <input type="checkbox" name="activate" className="h-4 w-4 accent-[var(--color-accent)]" />
            Also activate/renew membership with the selected plan (paid only)
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <SubmitButton className={btn("primary")}>Save payment</SubmitButton>
          </div>
        </form>
      </details>

      <div className="mb-4 flex flex-wrap gap-2">
        <Pill href="/admin/payments" active={!valid}>All</Pill>
        {["paid", "pending", "failed", "refunded"].map((s) => (
          <Pill key={s} href={`/admin/payments?status=${s}`} active={status === s}>
            <span className="capitalize">{s}</span>
          </Pill>
        ))}
      </div>

      <Card pad={false}>
        {rows.length === 0 ? <Empty>No payments found.</Empty> : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>ID</th><th>Member</th><th>Plan</th><th>Date</th><th>Method</th><th>Txn</th><th>Amount</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{paymentCode(p.id)}</td>
                    <td><Link href={`/admin/members/${p.memberId}`} className="font-semibold hover:text-link">{p.memberName}</Link></td>
                    <td>{p.plan ?? "—"}</td>
                    <td className="whitespace-nowrap">{fmtDate(p.date)}</td>
                    <td>{methodLabel(p.method)}</td>
                    <td className="text-xs text-ink/60">{p.txn || "—"}</td>
                    <td className="font-semibold">{formatINR(p.amount)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <form action={updatePaymentStatusAction} className="flex gap-1">
                          <input type="hidden" name="id" value={p.id} />
                          <select name="status" defaultValue={p.status} className="rounded-lg border border-ink/15 bg-surface px-2 py-1 text-xs">
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                          <button className={btn("ghost", "sm")}>Set</button>
                        </form>
                        <form action={deletePaymentAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmButton className={btn("danger", "sm")} message="Delete this payment record?">✕</ConfirmButton>
                        </form>
                      </div>
                    </td>
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
