import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import AuthCard from "@/components/auth-card";
import { SubmitButton } from "@/components/buttons";
import { Field, Flash, btn, first, inputCls, type SP } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const link = first(sp.link);
  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email to get a password reset link."
      footer={
        <Link href="/login" className="font-semibold text-link">
          Back to sign in
        </Link>
      }
    >
      <Flash error={sp.error} />
      {link ? (
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Reset link generated</p>
          <p className="text-ink/60">
            Email delivery isn&apos;t configured in this demo, so the link is shown here. It is valid for one hour.
          </p>
          <Link href={link} className={`${btn("primary")} w-full`}>
            Reset my password
          </Link>
        </div>
      ) : (
        <form action={forgotPasswordAction} className="space-y-4">
          <Field label="Email">
            <input name="email" type="email" required className={inputCls} placeholder="you@example.com" />
          </Field>
          <SubmitButton className={`${btn("primary")} w-full`} pendingText="Generating…">
            Send reset link
          </SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
