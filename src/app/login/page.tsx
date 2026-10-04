import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import AuthCard from "@/components/auth-card";
import { SubmitButton } from "@/components/buttons";
import { Field, Flash, btn, first, inputCls, type SP } from "@/components/ui";
import { getUser, homeFor } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

const demo = [
  { role: "Admin", email: "admin@gym.com", password: "admin123" },
  { role: "Trainer", email: "rahul@gym.com", password: "trainer123" },
  { role: "Member", email: "ashish@gym.com", password: "member123" },
];

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  await ensureSeed();
  const user = await getUser();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your GYMIFY account."
      footer={
        <>
          New member?{" "}
          <Link href="/register" className="font-semibold text-link">
            Create an account
          </Link>
        </>
      }
    >
      <Flash ok={sp.ok} error={sp.error} />
      <form action={loginAction} className="space-y-4">
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputCls} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required autoComplete="current-password" className={inputCls} placeholder="••••••••" />
        </Field>
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs font-semibold text-link">
            Forgot password?
          </Link>
        </div>
        <SubmitButton className={`${btn("primary")} w-full`} pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      <div className="mt-6 rounded-xl bg-canvas p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/50">Demo accounts</p>
        <ul className="space-y-1.5 text-xs">
          {demo.map((d) => (
            <li key={d.role} className="flex justify-between gap-2">
              <span className="font-semibold">{d.role}</span>
              <span className="text-ink/70">
                {d.email} / {d.password}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AuthCard>
  );
}
