import PasswordCard from "@/components/password-card";
import { Avatar, Card, Flash, PageHeader, StatusBadge, type SP } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";
import { trainerCode } from "@/lib/format";

export default async function TrainerProfile({ searchParams }: { searchParams: SP }) {
  const { trainer, user } = await requireTrainer();
  const sp = await searchParams;
  const rows: [string, string][] = [
    ["Trainer ID", trainerCode(trainer.id)],
    ["Email", user.email],
    ["Phone", trainer.phone || "—"],
    ["Specialization", trainer.specialization || "—"],
    ["Experience", `${trainer.experienceYears} years`],
    ["Joined", fmtDate(trainer.joinDate)],
  ];
  return (
    <>
      <PageHeader title="Profile" />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={trainer.name} size="lg" />
            <div>
              <h2 className="text-xl font-bold">{trainer.name}</h2>
              <StatusBadge status={trainer.status} />
            </div>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k}><dt className="text-xs font-semibold uppercase tracking-wider text-ink/50">{k}</dt><dd className="mt-0.5">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <PasswordCard />
      </div>
    </>
  );
}
