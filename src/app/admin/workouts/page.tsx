import { WorkoutListView } from "@/components/workout-views";
import { Flash, PageHeader, type SP } from "@/components/ui";

export default async function AdminWorkouts({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Workout Plans" subtitle="All workout plans across the gym." />
      <Flash ok={sp.ok} error={sp.error} />
      <WorkoutListView base="/admin/workouts" trainerId={null} />
    </>
  );
}
