import { resetPasswordAction } from "@/app/actions/auth";
import AuthCard from "@/components/auth-card";
import { SubmitButton } from "@/components/buttons";
import { Field, Flash, btn, first, inputCls, type SP } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const token = first(sp.token);
  return (
    <AuthCard title="Set a new password" subtitle="Choose a new password for your account.">
      <Flash error={sp.error} />
      <form action={resetPasswordAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <Field label="New password">
          <input name="password" type="password" required minLength={6} className={inputCls} placeholder="At least 6 characters" />
        </Field>
        <SubmitButton className={`${btn("primary")} w-full`}>Update password</SubmitButton>
      </form>
    </AuthCard>
  );
}
