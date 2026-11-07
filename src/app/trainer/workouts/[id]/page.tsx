import { notFound } from "next/navigation";
import { WorkoutDetailView } from "@/components/workout-views";
import { Flash, type SP } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";

export default async function TrainerWorkoutDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SP;
}) {
  const { trainer } = await requireTrainer();
  const planId = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(planId)) notFound();
  const view = await WorkoutDetailView({ base: "/trainer/workouts", planId, trainerId: trainer.id });
  if (!view) notFound();
  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      {view}
    </>
  );
}
