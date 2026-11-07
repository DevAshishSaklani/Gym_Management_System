import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  addExerciseAction,
  createWorkoutPlanAction,
  deleteExerciseAction,
  deleteWorkoutPlanAction,
  setWorkoutStatusAction,
} from "@/app/actions/workouts";
import { db } from "@/db";
import { members, trainers, workoutExercises, workoutPlans } from "@/db/schema";
import { ConfirmButton, SubmitButton } from "@/components/buttons";
import { Card, Empty, Field, StatusBadge, TableWrap, btn, inputCls } from "@/components/ui";
import { fmtDate, todayStr } from "@/lib/dates";

export async function WorkoutListView({ base, trainerId }: { base: string; trainerId: number | null }) {
  const isAdmin = trainerId === null;
  const [plans, memberList, trainerList] = await Promise.all([
    db
      .select({
        id: workoutPlans.id,
        name: workoutPlans.name,
        goal: workoutPlans.goal,
        status: workoutPlans.status,
        start: workoutPlans.startDate,
        end: workoutPlans.endDate,
        memberName: members.name,
        trainerName: trainers.name,
      })
      .from(workoutPlans)
      .innerJoin(members, eq(workoutPlans.memberId, members.id))
      .leftJoin(trainers, eq(workoutPlans.trainerId, trainers.id))
      .where(trainerId ? eq(workoutPlans.trainerId, trainerId) : undefined)
      .orderBy(desc(workoutPlans.id)),
    db
      .select({ id: members.id, name: members.name, trainerId: members.trainerId })
      .from(members)
      .where(trainerId ? eq(members.trainerId, trainerId) : undefined)
      .orderBy(members.name),
    isAdmin ? db.select().from(trainers).orderBy(trainers.name) : Promise.resolve([]),
  ]);

  return (
    <>
      <details className="mb-6 rounded-2xl border border-ink/10 bg-surface shadow-card">
        <summary className="px-5 py-4 text-sm font-semibold">＋ Create workout plan</summary>
        <form action={createWorkoutPlanAction} className="grid gap-4 border-t border-ink/10 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Plan name *"><input name="name" required placeholder="e.g. Chest & Triceps" className={inputCls} /></Field>
          <Field label="Goal"><input name="goal" placeholder="Muscle building, fat loss…" className={inputCls} /></Field>
          <Field label="Member *">
            <select name="memberId" required defaultValue="" className={inputCls}>
              <option value="" disabled>Select member</option>
              {memberList.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          {isAdmin && (
            <Field label="Trainer (defaults to member's trainer)">
              <select name="trainerId" defaultValue="" className={inputCls}>
                <option value="">Auto</option>
                {trainerList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Start date"><input type="date" name="startDate" defaultValue={todayStr()} className={inputCls} /></Field>
          <Field label="End date"><input type="date" name="endDate" className={inputCls} /></Field>
          <Field label="Notes" className="sm:col-span-2 lg:col-span-3"><input name="notes" className={inputCls} /></Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <SubmitButton className={btn("primary")}>Create & add exercises</SubmitButton>
          </div>
        </form>
      </details>

      <Card pad={false}>
        {plans.length === 0 ? <Empty>No workout plans yet.</Empty> : (
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>Plan</th><th>Member</th>{isAdmin && <th>Trainer</th>}<th>Goal</th><th>Duration</th><th>Status</th></tr></thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`${base}/${p.id}`} className="font-semibold hover:text-link">{p.name}</Link></td>
                    <td>{p.memberName}</td>
                    {isAdmin && <td>{p.trainerName ?? "—"}</td>}
                    <td>{p.goal || "—"}</td>
                    <td className="whitespace-nowrap text-xs">{fmtDate(p.start)} → {fmtDate(p.end)}</td>
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

export function ExerciseTables({
  exercises,
  onDelete,
}: {
  exercises: (typeof workoutExercises.$inferSelect)[];
  onDelete?: (ex: typeof workoutExercises.$inferSelect) => React.ReactNode;
}) {
  const days = [...new Set(exercises.map((e) => e.day))];
  if (days.length === 0) return <Empty>No exercises added yet.</Empty>;
  return (
    <div className="space-y-5">
      {days.map((day) => (
        <Card key={day} title={day} pad={false}>
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>Exercise</th><th>Muscle</th><th>Sets</th><th>Reps</th><th>Weight</th><th>Rest</th><th>Notes</th>{onDelete && <th></th>}</tr>
              </thead>
              <tbody>
                {exercises.filter((e) => e.day === day).map((e) => (
                  <tr key={e.id}>
                    <td className="font-semibold">{e.exercise}</td>
                    <td>{e.muscleGroup || "—"}</td>
                    <td>{e.sets}</td>
                    <td>{e.reps}</td>
                    <td>{e.weight || "—"}</td>
                    <td>{e.restSeconds}s</td>
                    <td className="text-xs text-ink/60">{e.notes || "—"}</td>
                    {onDelete && <td>{onDelete(e)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      ))}
    </div>
  );
}

export async function WorkoutDetailView({
  base,
  planId,
  trainerId,
}: {
  base: string;
  planId: number;
  trainerId: number | null;
}) {
  const [row] = await db
    .select({
      plan: workoutPlans,
      memberName: members.name,
      memberId: members.id,
      trainerName: trainers.name,
    })
    .from(workoutPlans)
    .innerJoin(members, eq(workoutPlans.memberId, members.id))
    .leftJoin(trainers, eq(workoutPlans.trainerId, trainers.id))
    .where(eq(workoutPlans.id, planId))
    .limit(1);
  if (!row) return null;
  if (trainerId !== null && row.plan.trainerId !== trainerId) return null;
  const { plan } = row;
  const exercises = await db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.planId, planId))
    .orderBy(workoutExercises.sortOrder);
  const days = [...new Set(exercises.map((e) => e.day))];

  return (
    <>
      <Link href={base} className="mb-4 inline-block text-sm font-semibold text-link">← All workout plans</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{plan.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
            For <strong className="text-ink">{row.memberName}</strong> · Trainer {row.trainerName ?? "—"} · {plan.goal || "No goal set"}
            <StatusBadge status={plan.status} />
          </p>
          <p className="text-xs text-ink/50">{fmtDate(plan.startDate)} → {fmtDate(plan.endDate)}</p>
          {plan.notes && <p className="mt-2 text-sm">{plan.notes}</p>}
        </div>
        <div className="flex gap-2">
          <form action={setWorkoutStatusAction}>
            <input type="hidden" name="planId" value={plan.id} />
            <SubmitButton className={btn("ghost")}>{plan.status === "active" ? "Mark completed" : "Reactivate"}</SubmitButton>
          </form>
          <form action={deleteWorkoutPlanAction}>
            <input type="hidden" name="planId" value={plan.id} />
            <ConfirmButton className={btn("danger")} message="Delete this workout plan?">Delete</ConfirmButton>
          </form>
        </div>
      </div>

      <details open={exercises.length === 0} className="mb-6 rounded-2xl border border-ink/10 bg-surface shadow-card">
        <summary className="px-5 py-4 text-sm font-semibold">＋ Add exercise</summary>
        <form action={addExerciseAction} className="grid gap-4 border-t border-ink/10 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="planId" value={plan.id} />
          <Field label="Day / session">
            <input name="day" list="days" defaultValue={days[days.length - 1] ?? "Day 1"} className={inputCls} />
            <datalist id="days">{days.map((d) => <option key={d} value={d} />)}</datalist>
          </Field>
          <Field label="Exercise *"><input name="exercise" required placeholder="Bench Press" className={inputCls} /></Field>
          <Field label="Muscle group"><input name="muscleGroup" placeholder="Chest" className={inputCls} /></Field>
          <Field label="Sets"><input name="sets" type="number" min={1} defaultValue={3} className={inputCls} /></Field>
          <Field label="Reps"><input name="reps" defaultValue="10" placeholder="10 / Failure" className={inputCls} /></Field>
          <Field label="Weight"><input name="weight" placeholder="40 kg" className={inputCls} /></Field>
          <Field label="Rest (sec)"><input name="restSeconds" type="number" min={0} defaultValue={60} className={inputCls} /></Field>
          <Field label="Notes"><input name="notes" className={inputCls} /></Field>
          <div className="sm:col-span-2 lg:col-span-4"><SubmitButton className={btn("primary")}>Add exercise</SubmitButton></div>
        </form>
      </details>

      <ExerciseTables
        exercises={exercises}
        onDelete={(e) => (
          <form action={deleteExerciseAction}>
            <input type="hidden" name="id" value={e.id} />
            <input type="hidden" name="planId" value={plan.id} />
            <ConfirmButton className={btn("danger", "sm")} message={`Remove ${e.exercise}?`}>✕</ConfirmButton>
          </form>
        )}
      />
    </>
  );
}
