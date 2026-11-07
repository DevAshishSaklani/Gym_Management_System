"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Icon from "@/components/icon";
import ThemeToggle from "@/components/theme-toggle";

export type NavItem = { href: string; label: string; icon: string };

type Props = {
  items: NavItem[];
  user: { name: string; role: string };
  unread: number;
  notificationsHref: string;
  logout: () => Promise<void>;
  children: ReactNode;
};

const wordmark = "text-[15px] font-extrabold tracking-[0.28em]";

export default function AppShell({ items, user, unread, notificationsHref, logout, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = items[0].href;

  const isActive = (href: string) =>
    href === root ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const linkCls = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      active ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
    }`;

  const navLink = (it: NavItem) => {
    const active = isActive(it.href);
    return (
      <Link key={it.href} href={it.href} className={linkCls(active)}>
        {active && <span className="absolute inset-y-2 -left-4 w-[3px] rounded-r-full bg-accent" />}
        <Icon name={it.icon} className={`h-[18px] w-[18px] ${active ? "text-accent" : "text-white/45 group-hover:text-white/80"}`} />
        {it.label}
      </Link>
    );
  };

  const bell = (
    <Link
      href={notificationsHref}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-surface text-ink/70 shadow-card transition hover:text-ink"
      aria-label="Notifications"
    >
      <Icon name="🔔" className="h-[18px] w-[18px]" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-5 text-accent-fg ring-2 ring-canvas">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );

  const logoutForm = (
    <form action={logout}>
      <button
        type="submit"
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
      >
        <Icon name="logout" className="h-[18px] w-[18px] text-white/45" /> Logout
      </button>
    </form>
  );

  const userBlock = (
    <div className="mb-2 flex items-center gap-3 px-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-xs font-bold text-accent-fg">
        {user.name
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="text-xs capitalize text-white/45">{user.role}</p>
      </div>
    </div>
  );

  const bottom = items.slice(0, 4);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-sidebar bg-[radial-gradient(400px_220px_at_0%_0%,rgb(212_164_55/0.10),transparent_70%)] p-4 text-white lg:flex">
        <Link href={root} className="mb-8 block px-3 pt-3">
          <span className={wordmark}>GYMIFY</span>
          <span className="mt-1 block h-px w-8 bg-accent" />
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto pl-0 pr-0">{items.map(navLink)}</nav>
        <div className="mt-4 border-t border-white/10 pt-4">
          {userBlock}
          {logoutForm}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink/10 bg-canvas/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <span className={`${wordmark} lg:hidden`}>GYMIFY</span>
          <p className="hidden text-sm text-ink/55 lg:block">
            Signed in as <span className="font-semibold text-ink">{user.name}</span>
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {bell}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-ink/10 bg-surface text-ink/70 shadow-card lg:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-sidebar/95 px-2 py-1.5 text-white backdrop-blur-xl lg:hidden">
        {bottom.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium ${
              isActive(it.href) ? "text-accent" : "text-white/60"
            }`}
          >
            <Icon name={it.icon} className="h-5 w-5" />
            <span className="max-w-full truncate">{it.label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex cursor-pointer flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium text-white/60"
        >
          <Icon name="more" className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-sidebar p-4 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-3 pt-2">
              <span className={wordmark}>GYMIFY</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer text-white/60 hover:text-white"
                aria-label="Close menu"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto" onClick={() => setOpen(false)}>
              {items.map(navLink)}
            </nav>
            <div className="mt-4 border-t border-white/10 pt-4">
              {userBlock}
              {logoutForm}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
