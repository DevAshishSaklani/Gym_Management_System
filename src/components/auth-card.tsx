import type { ReactNode } from "react";
import Icon from "@/components/icon";
import ThemeToggle from "@/components/theme-toggle";

const features = [
  { icon: "👥", title: "Members & memberships", text: "Plans, renewals and expiry tracking." },
  { icon: "💳", title: "Payments", text: "Record, review and export every transaction." },
  { icon: "✅", title: "Attendance & workouts", text: "Check-ins, trainers and personal plans." },
];

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-14 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_420px_at_20%_0%,rgb(212_164_55/0.18),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative">
          <span className="text-lg font-extrabold tracking-[0.3em]">GYMIFY</span>
          <span className="mt-2 block h-px w-10 bg-accent" />
        </div>
        <div className="relative">
          <h2 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
            Run your gym.
            <br />
            <span className="bg-gradient-to-r from-accent to-[#f3d98b] bg-clip-text text-transparent">Not spreadsheets.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
            One workspace for admins, trainers and members — built to keep your floor running smoothly.
          </p>
          <ul className="mt-10 space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-sm text-white/50">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/35">© GYMIFY Gym Management System</p>
      </div>

      <div className="relative flex items-center justify-center px-5 py-12">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="text-base font-extrabold tracking-[0.3em]">GYMIFY</span>
            <span className="mt-1.5 block h-px w-8 bg-accent" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mb-7 mt-1.5 text-sm text-ink/55">{subtitle}</p>
          <div className="rounded-3xl border border-ink/10 bg-surface p-7 shadow-card">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-ink/55">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
