import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { membershipPlans, memberships, trainers } from "@/db/schema";
import { Avatar, Card, Empty, ExpiryBadge, PageHeader, StatusBadge } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { daysLeft, fmtDate } from "@/lib/dates";
import { durationLabel, formatINR } from "@/lib/format";

export default async function MemberMembership() {
  const { member } = await requireMember();
  const [[plan], [trainer], history] = await Promise.all([
    member.planId ? db.select().from(membershipPlans).where(eq(membershipPlans.id, member.planId)).limit(1) : Promise.resolve([]),
    member.trainerId ? db.select().from(trainers).where(eq(trainers.id, member.trainerId)).limit(1) : Promise.resolve([]),
    db.select().from(memberships).where(eq(memberships.memberId, member.id)).orderBy(desc(memberships.startDate)),
  ]);

  return (
    <>
      <PageHeader title="Membership" subtitle="Your plan, expiry and trainer." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Current plan" className="lg:col-span-2">
          {!plan ? <Empty>You don&apos;t have a membership yet. Please visit the front desk.</Empty> : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold">{plan.name}</p>
                  <p className="text-sm text-ink/60">{durationLabel(plan.durationMonths)} · {formatINR(plan.price)}</p>
                </div>
                <StatusBadge status={member.status} />
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-ink/50">Start</dt><dd className="mt-0.5">{fmtDate(member.membershipStart)}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-ink/50">Expiry</dt><dd className="mt-0.5">{fmtDate(member.membershipExpiry)}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-ink/50">Remaining</dt><dd className="mt-0.5"><ExpiryBadge days={daysLeft(member.membershipExpiry)} /></dd></div>
              </dl>
              <ul className="mt-5 grid gap-1.5 text-sm sm:grid-cols-2">
                {plan.benefits.split("\n").filter(Boolean).map((b) => (
                  <li key={b} className="flex gap-2"><span className="text-link">✓</span>{b}</li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card title="Your trainer">
          {trainer ? (
            <div className="flex items-center gap-3">
              <Avatar name={trainer.name} size="lg" />
              <div>
                <p className="text-lg font-bold">{trainer.name}</p>
                <p className="text-sm text-ink/60">{trainer.specialization}</p>
                <p className="text-xs text-ink/50">{trainer.experienceYears} yrs · {trainer.phone}</p>
              </div>
            </div>
          ) : <Empty>No trainer assigned yet.</Empty>}
        </Card>
        <Card title="Membership history" pad={false} className="lg:col-span-3">
          {history.length === 0 ? <Empty>No history yet.</Empty> : (
            <ul className="divide-y divide-ink/5 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <span className="font-semibold">{h.planName}</span>
                  <span className="text-ink/60">{fmtDate(h.startDate)} → {fmtDate(h.endDate)}</span>
                  <span>{formatINR(h.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
