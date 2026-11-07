import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import AppShell, { type NavItem } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { syncExpiry, unreadCount } from "@/lib/data";
import type { Role } from "@/db/schema";

export default async function RoleLayout({
  role,
  items,
  children,
}: {
  role: Role;
  items: NavItem[];
  children: ReactNode;
}) {
  const user = await requireRole(role);
  await syncExpiry();
  const unread = await unreadCount(user.id);
  return (
    <AppShell
      items={items}
      user={{ name: user.name, role: user.role }}
      unread={unread}
      notificationsHref={`/${role}/notifications`}
      logout={logoutAction}
    >
      {children}
    </AppShell>
  );
}
