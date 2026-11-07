import AttendanceView from "@/components/attendance-view";
import { Flash, PageHeader, first, type SP } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { todayStr } from "@/lib/dates";

export default async function TrainerAttendance({ searchParams }: { searchParams: SP }) {
  const { trainer } = await requireTrainer();
  const sp = await searchParams;
  const raw = first(sp.date);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayStr();
  return (
    <>
      <PageHeader title="Attendance" subtitle="Attendance for your assigned members." />
      <Flash ok={sp.ok} error={sp.error} />
      <AttendanceView base="/trainer/attendance" trainerId={trainer.id} date={date} isAdmin={false} />
    </>
  );
}
