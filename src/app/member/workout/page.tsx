import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trainers, workoutExercises, workoutPlans } from "@/db/schema";
import { ExerciseTables } from "@/components/workout-views";
import { Card, Empty, PageHeader, StatusBadge } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";

export default async function MemberWorkout() {
  const { member } = await requireMember();
  const plans = await db
    .select({ plan: workoutPlans, trainer: trainers.name })
    .from(workoutPlans)
    .leftJoin(trainers, eq(workoutPlans.trainerId, trainers.id))
    .where(eq(workoutPlans.memberId, member.id))
    .orderBy(desc(workoutPlans.id));

  const withEx = await Promise.all(
    plans.map(async (p) => ({
      ...p,
      exercises: await db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.planId, p.plan.id))
        .orderBy(workoutExercises.sortOrder),
    })),
  );

  return (
    <>
      <PageHeader title="Workout Plan" subtitle="Assigned by your trainer." />
      {withEx.length === 0 ? (
        <Card><Empty>No workout plans assigned yet.</Empty></Card>
      ) : (
        <div className="space-y-10">
          {withEx.map(({ plan, trainer, exercises }) => (
            <section key={plan.id}>
              <div className="mb-3">
                <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">{plan.name} <StatusBadge status={plan.status} /></h2>
                <p className="text-sm text-ink/60">
                  {plan.goal || "General fitness"} · Trainer {trainer ?? "—"} · {fmtDate(plan.startDate)} → {fmtDate(plan.endDate)}
                </p>
                {plan.notes && <p className="mt-1 text-sm">{plan.notes}</p>}
              </div>
              <ExerciseTables exercises={exercises} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
