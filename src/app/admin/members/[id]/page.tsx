import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  assignMembershipAction,
  assignTrainerAction,
  deleteMemberAction,
  setMemberStatusAction,
  updateMemberAction,
} from "@/app/actions/members";
import { db } from "@/db";
import {
  attendance,
  members,
  membershipPlans,
  memberships,
  payments,
  progress,
  trainers,
  workoutPlans,
} from "@/db/schema";
import { ConfirmButton, SubmitButton } from "@/components/buttons";
import {
  Avatar,
  Card,
  Empty,
  ExpiryBadge,
  Field,
  Flash,
  StatusBadge,
  TableWrap,
  btn,
  inputCls,
  type SP,
} from "@/components/ui";
import { addDays, daysLeft, fmtDate, fmtTime, todayStr } from "@/lib/dates";
import { formatINR, memberCode, methodLabel, paymentCode } from "@/lib/format";

export default async function MemberDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SP;
}) {
  const { id: idStr } = await params;
  const sp = await searchParams;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();
  const [m] = await db.select().from(members).where(eq(members.id, id)).limit(1);
  if (!m) notFound();

  const today = todayStr();
  const [plans, trainerList, history, pays, att, [attCount], wplans, prog] = await Promise.all([
    db.select().from(membershipPlans).orderBy(membershipPlans.durationMonths),
    db.select().from(trainers).orderBy(trainers.name),
    db.select().from(memberships).where(eq(memberships.memberId, id)).orderBy(desc(memberships.startDate)),
    db.select().from(payments).where(eq(payments.memberId, id)).orderBy(desc(payments.paymentDate), desc(payments.id)).limit(10),
    db.select().from(attendance).where(eq(attendance.memberId, id)).orderBy(desc(attendance.date)).limit(8),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(attendance)
      .where(and(eq(attendance.memberId, id), gte(attendance.date, addDays(today, -29)))),
    db.select().from(workoutPlans).where(eq(workoutPlans.memberId, id)).orderBy(desc(workoutPlans.id)),
    db.select().from(progress).where(eq(progress.memberId, id)).orderBy(desc(progress.date)).limit(1),
  ]);
  const plan = plans.find((p) => p.id === m.planId);
  const trainer = trainerList.find((t) => t.id === m.trainerId);

  return (
    <>
      <Link href="/admin/members" className="mb-4 inline-block text-sm font-semibold text-link">← All members</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={m.name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{m.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
              {memberCode(m.id)} · Joined {fmtDate(m.joinDate)} <StatusBadge status={m.status} />
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {m.status === "suspended" ? (
            <form action={setMemberStatusAction}>
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="status" value="active" />
              <SubmitButton className={btn("dark")}>Reactivate</SubmitButton>
            </form>
          ) : (
            <form action={setMemberStatusAction}>
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="status" value="suspended" />
              <ConfirmButton className={btn("ghost")} message="Suspend this member?">Suspend</ConfirmButton>
            </form>
          )}
          <form action={deleteMemberAction}>
            <input type="hidden" name="id" value={m.id} />
            <ConfirmButton className={btn("danger")} message={`Delete ${m.name} and all their records? This cannot be undone.`}>
              Delete
            </ConfirmButton>
          </form>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Membership" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Plan</dt><dd className="font-semibold">{plan?.name ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Start</dt><dd>{fmtDate(m.membershipStart)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Expiry</dt><dd>{fmtDate(m.membershipExpiry)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Remaining</dt><dd><ExpiryBadge days={daysLeft(m.membershipExpiry)} /></dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Attendance (30d)</dt><dd className="font-semibold">{attCount.c} days</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Latest weight</dt><dd>{prog[0]?.weightKg ? `${prog[0].weightKg} kg` : "—"}</dd></div>
          </dl>

          <form action={assignMembershipAction} className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <p className="text-sm font-semibold">Assign / renew membership</p>
            <input type="hidden" name="memberId" value={m.id} />
            <select name="planId" required className={inputCls} defaultValue={m.planId ?? ""}>
              <option value="" disabled>Select plan</option>
              {plans.filter((p) => p.status === "active").map((p) => (
                <option key={p.id} value={p.id}>{p.name} — ₹{p.price} / {p.durationMonths} mo</option>
              ))}
            </select>
            <Field label="Start date"><input type="date" name="startDate" defaultValue={today} className={inputCls} /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="recordPayment" defaultChecked className="h-4 w-4 accent-[var(--color-accent)]" />
              Record payment
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select name="method" className={inputCls} defaultValue="cash">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
              <input name="transactionId" placeholder="Txn ID" className={inputCls} />
            </div>
            <SubmitButton className={`${btn("primary")} w-full`}>Assign membership</SubmitButton>
          </form>
        </Card>

        <Card title="Profile" className="lg:col-span-2">
          <form action={updateMemberAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={m.id} />
            <Field label="Full name"><input name="name" defaultValue={m.name} required className={inputCls} /></Field>
            <Field label="Email"><input name="email" type="email" defaultValue={m.email} required className={inputCls} /></Field>
            <Field label="Phone"><input name="phone" defaultValue={m.phone} className={inputCls} /></Field>
            <Field label="Date of birth"><input name="dob" type="date" defaultValue={m.dob ?? ""} className={inputCls} /></Field>
            <Field label="Gender">
              <select name="gender" defaultValue={m.gender} className={inputCls}>
                <option value="">—</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Emergency contact"><input name="emergencyContact" defaultValue={m.emergencyContact} className={inputCls} /></Field>
            <Field label="Address" className="sm:col-span-2"><input name="address" defaultValue={m.address} className={inputCls} /></Field>
            <div className="sm:col-span-2">
              <SubmitButton className={btn("dark")}>Save changes</SubmitButton>
            </div>
          </form>

          <form action={assignTrainerAction} className="mt-6 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4">
            <input type="hidden" name="memberId" value={m.id} />
            <Field label={`Assigned trainer${trainer ? ` — ${trainer.name}` : ""}`} className="min-w-56 flex-1">
              <select name="trainerId" defaultValue={m.trainerId ?? ""} className={inputCls}>
                <option value="">Unassigned</option>
                {trainerList.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>)}
              </select>
            </Field>
            <SubmitButton className={btn("ghost")}>Update trainer</SubmitButton>
          </form>
        </Card>

        <Card title="Payment history" pad={false} className="lg:col-span-2">
          {pays.length === 0 ? <Empty>No payments recorded.</Empty> : (
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>ID</th><th>Date</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {pays.map((p) => (
                    <tr key={p.id}>
                      <td>{paymentCode(p.id)}</td>
                      <td>{fmtDate(p.paymentDate)}</td>
                      <td>{methodLabel(p.method)}</td>
                      <td className="font-semibold">{formatINR(p.amount)}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>

        <Card title="Membership history" pad={false}>
          {history.length === 0 ? <Empty>No memberships yet.</Empty> : (
            <ul className="divide-y divide-ink/5 text-sm">
              {history.map((h) => (
                <li key={h.id} className="px-5 py-3">
                  <p className="font-semibold">{h.planName} <span className="font-normal text-ink/50">· {formatINR(h.price)}</span></p>
                  <p className="text-xs text-ink/50">{fmtDate(h.startDate)} → {fmtDate(h.endDate)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent attendance" pad={false} className="lg:col-span-2">
          {att.length === 0 ? <Empty>No attendance yet.</Empty> : (
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead>
                <tbody>
                  {att.map((a) => (
                    <tr key={a.id}>
                      <td>{fmtDate(a.date)}</td>
                      <td>{fmtTime(a.checkIn)}</td>
                      <td>{fmtTime(a.checkOut)}</td>
                      <td><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>

        <Card title="Workout plans" pad={false}>
          {wplans.length === 0 ? <Empty>No workout plans.</Empty> : (
            <ul className="divide-y divide-ink/5 text-sm">
              {wplans.map((w) => (
                <li key={w.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/admin/workouts/${w.id}`} className="font-semibold hover:text-link">{w.name}</Link>
                  <StatusBadge status={w.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
