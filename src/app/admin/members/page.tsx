import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { createMemberAction } from "@/app/actions/members";
import { db } from "@/db";
import { members, membershipPlans, trainers } from "@/db/schema";
import { SubmitButton } from "@/components/buttons";
import {
  Avatar,
  Card,
  Empty,
  ExpiryBadge,
  Field,
  Flash,
  PageHeader,
  StatusBadge,
  TableWrap,
  btn,
  first,
  inputCls,
  type SP,
} from "@/components/ui";
import { daysLeft, fmtDate, todayStr } from "@/lib/dates";
import { memberCode } from "@/lib/format";

export default async function MembersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const status = first(sp.status);
  const planId = Number(first(sp.plan)) || null;
  const trainerId = Number(first(sp.trainer)) || null;

  const conds = [];
  if (q) {
    const like = `%${q}%`;
    const idMatch = q.match(/^(?:gym-?)?0*(\d+)$/i);
    conds.push(
      or(
        ilike(members.name, like),
        ilike(members.email, like),
        ilike(members.phone, like),
        idMatch ? eq(members.id, Number(idMatch[1])) : undefined,
      ),
    );
  }
  if (["active", "expired", "suspended", "pending"].includes(status)) {
    conds.push(eq(members.status, status as "active"));
  }
  if (planId) conds.push(eq(members.planId, planId));
  if (trainerId) conds.push(eq(members.trainerId, trainerId));

  const [rows, plans, trainerList] = await Promise.all([
    db
      .select({
        id: members.id,
        name: members.name,
        email: members.email,
        phone: members.phone,
        status: members.status,
        expiry: members.membershipExpiry,
        plan: membershipPlans.name,
        trainer: trainers.name,
      })
      .from(members)
      .leftJoin(membershipPlans, eq(members.planId, membershipPlans.id))
      .leftJoin(trainers, eq(members.trainerId, trainers.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(members.id)),
    db.select().from(membershipPlans).orderBy(membershipPlans.durationMonths),
    db.select().from(trainers).orderBy(trainers.name),
  ]);

  const exportQs = new URLSearchParams();
  if (q) exportQs.set("q", q);
  if (status) exportQs.set("status", status);

  return (
    <>
      <PageHeader
        title="Members"
        subtitle={`${rows.length} member${rows.length === 1 ? "" : "s"} found`}
        action={
          <a href={`/api/export/members?${exportQs.toString()}`} className={btn("ghost")}>
            ⬇ Export CSV
          </a>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />

      <details className="group mb-6 rounded-2xl border border-ink/10 bg-surface shadow-card">
        <summary className="flex items-center justify-between px-5 py-4 text-sm font-semibold">
          <span>＋ Add new member</span>
          <span className="text-xs text-ink/50 group-open:hidden">Click to expand</span>
        </summary>
        <form action={createMemberAction} className="grid gap-4 border-t border-ink/10 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name *"><input name="name" required className={inputCls} /></Field>
          <Field label="Email *"><input name="email" type="email" required className={inputCls} /></Field>
          <Field label="Phone"><input name="phone" className={inputCls} /></Field>
          <Field label="Date of birth"><input name="dob" type="date" className={inputCls} /></Field>
          <Field label="Gender">
            <select name="gender" className={inputCls} defaultValue="">
              <option value="">—</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Emergency contact"><input name="emergencyContact" className={inputCls} /></Field>
          <Field label="Address" className="sm:col-span-2 lg:col-span-3"><input name="address" className={inputCls} /></Field>
          <Field label="Membership plan">
            <select name="planId" className={inputCls} defaultValue="">
              <option value="">No plan yet (pending)</option>
              {plans.filter((p) => p.status === "active").map((p) => (
                <option key={p.id} value={p.id}>{p.name} — ₹{p.price} / {p.durationMonths} mo</option>
              ))}
            </select>
          </Field>
          <Field label="Start date"><input name="startDate" type="date" defaultValue={todayStr()} className={inputCls} /></Field>
          <Field label="Trainer">
            <select name="trainerId" className={inputCls} defaultValue="">
              <option value="">Unassigned</option>
              {trainerList.filter((t) => t.status === "active").map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
              ))}
            </select>
          </Field>
          <Field label="Login password (default: welcome123)"><input name="password" minLength={6} className={inputCls} placeholder="welcome123" /></Field>
          <div className="flex items-end gap-3 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="recordPayment" defaultChecked className="h-4 w-4 accent-[var(--color-accent)]" />
              Record payment now
            </label>
            <select name="method" className={`${inputCls} max-w-40`} defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
            <input name="transactionId" placeholder="Txn ID (optional)" className={`${inputCls} max-w-48`} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <SubmitButton className={btn("primary")} pendingText="Adding…">Add member</SubmitButton>
          </div>
        </form>
      </details>

      <form className="mb-4 grid gap-3 rounded-2xl border border-ink/10 bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-5" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, ID, phone, email"
          className={`${inputCls} lg:col-span-2`}
        />
        <select name="status" defaultValue={status} className={inputCls}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
        <select name="plan" defaultValue={planId ?? ""} className={inputCls}>
          <option value="">All plans</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="trainer" defaultValue={trainerId ?? ""} className={inputCls}>
          <option value="">All trainers</option>
          {trainerList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className={btn("dark", "sm")}>Apply filters</button>
          <Link href="/admin/members" className={btn("ghost", "sm")}>Reset</Link>
        </div>
      </form>

      <Card pad={false}>
        {rows.length === 0 ? (
          <Empty>No members match your search.</Empty>
        ) : (
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Expiry</th>
                  <th>Trainer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/admin/members/${m.id}`} className="flex items-center gap-3">
                        <Avatar name={m.name} size="sm" />
                        <span>
                          <span className="block font-semibold hover:text-link">{m.name}</span>
                          <span className="block text-xs text-ink/50">{memberCode(m.id)}</span>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span className="block">{m.phone || "—"}</span>
                      <span className="block text-xs text-ink/50">{m.email}</span>
                    </td>
                    <td>{m.plan ?? "—"}</td>
                    <td>
                      <span className="mr-2 whitespace-nowrap">{fmtDate(m.expiry)}</span>
                      {m.status === "active" && <ExpiryBadge days={daysLeft(m.expiry)} />}
                    </td>
                    <td>{m.trainer ?? <span className="text-ink/40">Unassigned</span>}</td>
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
