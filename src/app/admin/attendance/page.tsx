import AttendanceView from "@/components/attendance-view";
import { Flash, PageHeader, first, type SP } from "@/components/ui";
import { todayStr } from "@/lib/dates";

export default async function AdminAttendance({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const raw = first(sp.date);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayStr();
  return (
    <>
      <PageHeader title="Attendance" subtitle="Record check-ins and monitor gym activity." />
      <Flash ok={sp.ok} error={sp.error} />
      <AttendanceView base="/admin/attendance" trainerId={null} date={date} isAdmin />
    </>
  );
}
