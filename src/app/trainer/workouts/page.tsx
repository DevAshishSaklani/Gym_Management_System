import { WorkoutListView } from "@/components/workout-views";
import { Flash, PageHeader, type SP } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";

export default async function TrainerWorkouts({ searchParams }: { searchParams: SP }) {
  const { trainer } = await requireTrainer();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Workout Plans" subtitle="Create plans and assign them to your members." />
      <Flash ok={sp.ok} error={sp.error} />
      <WorkoutListView base="/trainer/workouts" trainerId={trainer.id} />
    </>
  );
}
