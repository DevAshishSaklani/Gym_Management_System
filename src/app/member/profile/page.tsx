import { updateOwnProfileAction } from "@/app/actions/members";
import { SubmitButton } from "@/components/buttons";
import PasswordCard from "@/components/password-card";
import { Avatar, Card, Field, Flash, PageHeader, StatusBadge, btn, inputCls, type SP } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";
import { memberCode } from "@/lib/format";

export default async function MemberProfile({ searchParams }: { searchParams: SP }) {
  const { member: m } = await requireMember();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="My Profile" />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={m.name} size="lg" />
            <div>
              <h2 className="text-xl font-bold">{m.name}</h2>
              <p className="text-sm text-ink/60">{memberCode(m.id)} · {m.email} · Joined {fmtDate(m.joinDate)}</p>
              <div className="mt-1"><StatusBadge status={m.status} /></div>
            </div>
          </div>
          <form action={updateOwnProfileAction} className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone"><input name="phone" defaultValue={m.phone} className={inputCls} /></Field>
            <Field label="Emergency contact"><input name="emergencyContact" defaultValue={m.emergencyContact} className={inputCls} /></Field>
            <Field label="Date of birth"><input type="date" name="dob" defaultValue={m.dob ?? ""} className={inputCls} /></Field>
            <Field label="Gender">
              <select name="gender" defaultValue={m.gender} className={inputCls}>
                <option value="">—</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Address" className="sm:col-span-2"><input name="address" defaultValue={m.address} className={inputCls} /></Field>
            <div className="sm:col-span-2"><SubmitButton className={btn("dark")}>Save profile</SubmitButton></div>
          </form>
        </Card>
        <PasswordCard />
      </div>
    </>
  );
}
