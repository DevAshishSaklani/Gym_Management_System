import { notFound } from "next/navigation";
import { WorkoutDetailView } from "@/components/workout-views";
import { Flash, type SP } from "@/components/ui";

export default async function AdminWorkoutDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SP;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const planId = Number(id);
  if (!Number.isInteger(planId)) notFound();
  const view = await WorkoutDetailView({ base: "/admin/workouts", planId, trainerId: null });
  if (!view) notFound();
  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      {view}
    </>
  );
}
