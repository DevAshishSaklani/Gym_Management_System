import { eq, sql } from "drizzle-orm";
import { createPlanAction, deletePlanAction, togglePlanAction, updatePlanAction } from "@/app/actions/plans";
import { db } from "@/db";
import { members, membershipPlans } from "@/db/schema";
import { ConfirmButton, SubmitButton } from "@/components/buttons";
import { Card, Field, Flash, PageHeader, StatusBadge, btn, inputCls, type SP } from "@/components/ui";
import { durationLabel, formatINR } from "@/lib/format";

export default async function PlansPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [plans, counts] = await Promise.all([
    db.select().from(membershipPlans).orderBy(membershipPlans.durationMonths, membershipPlans.id),
    db
      .select({ planId: members.planId, c: sql<number>`count(*)::int` })
      .from(members)
      .where(eq(members.status, "active"))
      .groupBy(members.planId),
  ]);
  const countMap = new Map(counts.map((c) => [c.planId, c.c]));

  const fields = (p?: (typeof plans)[number]) => (
    <>
      <Field label="Plan name"><input name="name" required defaultValue={p?.name} className={inputCls} /></Field>
      <Field label="Duration (months)"><input name="durationMonths" type="number" min={1} required defaultValue={p?.durationMonths} className={inputCls} /></Field>
      <Field label="Price (₹)"><input name="price" type="number" min={0} required defaultValue={p?.price} className={inputCls} /></Field>
      <Field label="Description"><input name="description" defaultValue={p?.description} className={inputCls} /></Field>
      <Field label="Benefits (one per line)" className="sm:col-span-2">
        <textarea name="benefits" rows={4} defaultValue={p?.benefits} className={inputCls} />
      </Field>
    </>
  );

  return (
    <>
      <PageHeader title="Membership Plans" subtitle="Create and manage the plans members can buy." />
      <Flash ok={sp.ok} error={sp.error} />

      <details className="mb-6 rounded-2xl border border-ink/10 bg-surface shadow-card">
        <summary className="px-5 py-4 text-sm font-semibold">＋ Create custom plan</summary>
        <form action={createPlanAction} className="grid gap-4 border-t border-ink/10 p-5 sm:grid-cols-2">
          {fields()}
          <div className="sm:col-span-2"><SubmitButton className={btn("primary")}>Create plan</SubmitButton></div>
        </form>
      </details>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className={p.status === "inactive" ? "opacity-70" : ""}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="text-sm text-ink/60">{durationLabel(p.durationMonths)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-3 text-3xl font-bold text-link">{formatINR(p.price)}</p>
            <p className="mt-1 text-sm text-ink/60">{p.description}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {p.benefits.split("\n").filter(Boolean).map((b) => (
                <li key={b} className="flex gap-2"><span className="text-link">✓</span>{b}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink/50">{countMap.get(p.id) ?? 0} active members</p>

            <details className="mt-4 border-t border-ink/10 pt-3">
              <summary className="text-sm font-semibold text-link">Edit plan</summary>
              <form action={updatePlanAction} className="mt-3 grid gap-3">
                <input type="hidden" name="id" value={p.id} />
                {fields(p)}
                <SubmitButton className={btn("dark", "sm")}>Save</SubmitButton>
              </form>
            </details>
            <div className="mt-3 flex gap-2">
              <form action={togglePlanAction}>
                <input type="hidden" name="id" value={p.id} />
                <SubmitButton className={btn("ghost", "sm")}>{p.status === "active" ? "Deactivate" : "Activate"}</SubmitButton>
              </form>
              <form action={deletePlanAction}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton className={btn("danger", "sm")} message={`Delete the ${p.name} plan? Existing member history is kept.`}>Delete</ConfirmButton>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
