import type { ReactNode } from "react";
import { initials } from "@/lib/format";
import Icon from "@/components/icon";

/* ---------- class helpers (shared design tokens) ---------- */

export const inputCls =
  "w-full rounded-xl border border-ink/15 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-accent focus:ring-4 focus:ring-accent/15";

const btnBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export function btn(variant: "primary" | "dark" | "ghost" | "danger" = "primary", size: "md" | "sm" = "md") {
  const v = {
    primary: "bg-accent text-accent-fg hover:brightness-95",
    dark: "bg-ink text-canvas hover:bg-ink/90",
    ghost: "border border-ink/15 bg-surface text-ink hover:bg-ink/5",
    danger: "border border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20",
  }[variant];
  const sz = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  return `${btnBase} ${sz} ${v}`;
}

/* ---------- layout primitives ---------- */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
  pad = true,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={`rounded-2xl border border-ink/10 bg-surface shadow-card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 px-5 pt-4">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      <div className={pad ? "p-5" : "pt-3"}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-card ${
        accent
          ? "border-transparent bg-gradient-to-br from-accent to-accent-deep text-accent-fg"
          : "border-ink/10 bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${accent ? "text-accent-fg/70" : "text-ink/50"}`}>
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              accent ? "bg-black/10 text-accent-fg" : "bg-accent/12 text-link"
            }`}
          >
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
      {hint && <p className={`mt-1 text-xs ${accent ? "text-accent-fg/70" : "text-ink/50"}`}>{hint}</p>}
    </div>
  );
}

type Tone = "green" | "red" | "amber" | "blue" | "gray" | "orange";
const tones: Record<Tone, string> = {
  green: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-400/25",
  red: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 ring-red-200 dark:ring-red-400/25",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-400/25",
  blue: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-200 dark:ring-sky-400/25",
  gray: "bg-ink/5 text-ink/70 ring-ink/10",
  orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-200 dark:ring-orange-400/25",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    active: "green",
    paid: "green",
    present: "green",
    completed: "blue",
    expired: "red",
    failed: "red",
    absent: "red",
    suspended: "amber",
    pending: "amber",
    inactive: "gray",
    refunded: "blue",
  };
  return <Badge tone={map[status] ?? "gray"}>{status.replace("_", " ")}</Badge>;
}

export function ExpiryBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-ink/40">—</span>;
  if (days < 0) return <Badge tone="red">Expired {Math.abs(days)}d ago</Badge>;
  if (days <= 7) return <Badge tone="orange">{days === 0 ? "Expires today" : `${days}d left`}</Badge>;
  return <Badge tone="green">{days}d left</Badge>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" }[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep font-semibold text-accent-fg ${sz}`}
    >
      {initials(name)}
    </span>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-ink/70">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-ink/50">{children}</p>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Flash({ ok, error }: { ok?: string | string[]; error?: string | string[] }) {
  const okMsg = Array.isArray(ok) ? ok[0] : ok;
  const errMsg = Array.isArray(error) ? error[0] : error;
  if (!okMsg && !errMsg) return null;
  return (
    <div
      role="status"
      className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${
        errMsg
          ? "border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"
          : "border-emerald-200 dark:border-emerald-400/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      }`}
    >
      {errMsg ?? okMsg}
    </div>
  );
}

export type SP = Promise<Record<string, string | string[] | undefined>>;

export function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function Pill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active ? "bg-ink text-canvas" : "bg-surface text-ink/70 ring-1 ring-ink/15 hover:bg-ink/5"
      }`}
    >
      {children}
    </a>
  );
}
