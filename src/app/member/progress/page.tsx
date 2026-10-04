import { addProgressAction, deleteProgressAction } from "@/app/actions/progress";
import { ConfirmButton, SubmitButton } from "@/components/buttons";
import ProgressPanel from "@/components/progress-panel";
import { Card, Field, Flash, PageHeader, btn, inputCls, type SP } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { todayStr } from "@/lib/dates";

export default async function MemberProgress({ searchParams }: { searchParams: SP }) {
  const { member } = await requireMember();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Progress" subtitle="Log your weight, measurements and personal records." />
      <Flash ok={sp.ok} error={sp.error} />
      <Card title="Log an entry" className="mb-6">
        <form action={addProgressAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date"><input type="date" name="date" defaultValue={todayStr()} max={todayStr()} className={inputCls} /></Field>
          <Field label="Weight (kg)"><input type="number" step="0.1" min="1" name="weightKg" className={inputCls} /></Field>
          <Field label="Chest (cm)"><input type="number" step="0.1" min="1" name="chestCm" className={inputCls} /></Field>
          <Field label="Waist (cm)"><input type="number" step="0.1" min="1" name="waistCm" className={inputCls} /></Field>
          <Field label="Arms (cm)"><input type="number" step="0.1" min="1" name="armsCm" className={inputCls} /></Field>
          <Field label="Personal record" className="sm:col-span-2"><input name="personalRecord" placeholder="e.g. Deadlift 100 kg x 3" className={inputCls} /></Field>
          <div className="flex items-end"><SubmitButton className={`${btn("primary")} w-full`}>Save entry</SubmitButton></div>
        </form>
      </Card>
      <ProgressPanel
        memberId={member.id}
        renderDelete={(id) => (
          <form action={deleteProgressAction}>
            <input type="hidden" name="id" value={id} />
            <ConfirmButton className={btn("danger", "sm")} message="Delete this entry?">✕</ConfirmButton>
          </form>
        )}
      />
    </>
  );
}
