import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import AuthCard from "@/components/auth-card";
import { SubmitButton } from "@/components/buttons";
import { Field, Flash, btn, inputCls, type SP } from "@/components/ui";
import { getUser, homeFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: SP }) {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  return (
    <AuthCard
      title="Join the gym"
      subtitle="Create your member account. The gym will activate your membership."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-link">
            Sign in
          </Link>
        </>
      }
    >
      <Flash error={sp.error} />
      <form action={registerAction} className="space-y-4">
        <Field label="Full name">
          <input name="name" required className={inputCls} placeholder="Ashish Kumar" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required className={inputCls} placeholder="you@example.com" />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" className={inputCls} placeholder="9876543210" />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required minLength={6} className={inputCls} placeholder="At least 6 characters" />
        </Field>
        <SubmitButton className={`${btn("primary")} w-full`} pendingText="Creating account…">
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
