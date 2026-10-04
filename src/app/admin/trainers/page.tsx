import Link from "next/link";
import { assignTrainerAction } from "@/app/actions/members";
import { createTrainerAction, deleteTrainerAction, toggleTrainerAction, updateTrainerAction } from "@/app/actions/trainers";
import { db } from "@/db";
import { members, trainers } from "@/db/schema";
import { ConfirmButton, SubmitButton } from "@/components/buttons";
import { Avatar, Card, Field, Flash, PageHeader, StatusBadge, btn, inputCls, type SP } from "@/components/ui";
import { fmtDate, todayStr } from "@/lib/dates";
import { trainerCode } from "@/lib/format";

const SPECS = ["Weight Training", "Strength Training", "Fat Loss", "Muscle Building", "CrossFit", "Yoga", "Cardio"];

export default async function TrainersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [trainerList, memberList] = await Promise.all([
    db.select().from(trainers).orderBy(trainers.name),
    db
      .select({ id: members.id, name: members.name, trainerId: members.trainerId, status: members.status })
      .from(members)
      .orderBy(members.name),
  ]);
  const unassigned = memberList.filter((m) => !m.trainerId);

  return (
    <>
      <PageHeader title="Trainers" subtitle="Manage trainers and their assigned members." />
      <Flash ok={sp.ok} error={sp.error} />

      <details className="mb-6 rounded-2xl border border-ink/10 bg-surface shadow-card">
        <summary className="px-5 py-4 text-sm font-semibold">＋ Add trainer</summary>
        <form action={createTrainerAction} className="grid gap-4 border-t border-ink/10 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name *"><input name="name" required className={inputCls} /></Field>
          <Field label="Email *"><input name="email" type="email" required className={inputCls} /></Field>
          <Field label="Phone"><input name="phone" className={inputCls} /></Field>
          <Field label="Specialization">
            <input name="specialization" list="specs" className={inputCls} placeholder="e.g. CrossFit" />
          </Field>
          <Field label="Experience (years)"><input name="experienceYears" type="number" min={0} defaultValue={0} className={inputCls} /></Field>
          <Field label="Joining date"><input name="joinDate" type="date" defaultValue={todayStr()} className={inputCls} /></Field>
          <Field label="Login password (default: trainer123)"><input name="password" minLength={6} className={inputCls} placeholder="trainer123" /></Field>
          <div className="sm:col-span-2 lg:col-span-3"><SubmitButton className={btn("primary")}>Add trainer</SubmitButton></div>
        </form>
      </details>
      <datalist id="specs">{SPECS.map((s) => <option key={s} value={s} />)}</datalist>

      <div className="grid gap-6 lg:grid-cols-2">
        {trainerList.map((t) => {
          const assigned = memberList.filter((m) => m.trainerId === t.id);
          return (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} size="lg" />
                  <div>
                    <h3 className="text-lg font-bold">{t.name}</h3>
                    <p className="text-sm text-ink/60">{t.specialization || "General"} · {t.experienceYears} yrs</p>
                    <p className="text-xs text-ink/50">{trainerCode(t.id)} · joined {fmtDate(t.joinDate)}</p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <p className="mt-3 text-xs text-ink/60">{t.email} · {t.phone || "no phone"}</p>

              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="mb-2 text-sm font-semibold">Assigned members ({assigned.length})</p>
                {assigned.length === 0 ? (
                  <p className="text-sm text-ink/50">No members assigned yet.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {assigned.map((m) => (
                      <li key={m.id} className="flex items-center gap-1 rounded-full bg-canvas py-1 pl-3 pr-1 text-xs font-medium">
                        <Link href={`/admin/members/${m.id}`} className="hover:text-link">{m.name}</Link>
                        <form action={assignTrainerAction}>
                          <input type="hidden" name="memberId" value={m.id} />
                          <input type="hidden" name="trainerId" value="" />
                          <input type="hidden" name="back" value="/admin/trainers" />
                          <button className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-ink/50 hover:bg-ink/10" title="Unassign">×</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
                {unassigned.length > 0 && (
                  <form action={assignTrainerAction} className="mt-3 flex gap-2">
                    <input type="hidden" name="trainerId" value={t.id} />
                    <input type="hidden" name="back" value="/admin/trainers" />
                    <select name="memberId" required defaultValue="" className={inputCls}>
                      <option value="" disabled>Assign a member…</option>
                      {unassigned.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <SubmitButton className={btn("dark", "sm")}>Assign</SubmitButton>
                  </form>
                )}
              </div>

              <details className="mt-4 border-t border-ink/10 pt-3">
                <summary className="text-sm font-semibold text-link">Edit trainer</summary>
                <form action={updateTrainerAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={t.id} />
                  <Field label="Name"><input name="name" defaultValue={t.name} required className={inputCls} /></Field>
                  <Field label="Phone"><input name="phone" defaultValue={t.phone} className={inputCls} /></Field>
                  <Field label="Specialization"><input name="specialization" list="specs" defaultValue={t.specialization} className={inputCls} /></Field>
                  <Field label="Experience (yrs)"><input name="experienceYears" type="number" min={0} defaultValue={t.experienceYears} className={inputCls} /></Field>
                  <div className="sm:col-span-2"><SubmitButton className={btn("dark", "sm")}>Save</SubmitButton></div>
                </form>
              </details>
              <div className="mt-3 flex gap-2">
                <form action={toggleTrainerAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton className={btn("ghost", "sm")}>{t.status === "active" ? "Deactivate" : "Activate"}</SubmitButton>
                </form>
                <form action={deleteTrainerAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <ConfirmButton className={btn("danger", "sm")} message={`Remove ${t.name}? Their login will be deleted and members unassigned.`}>Remove</ConfirmButton>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
