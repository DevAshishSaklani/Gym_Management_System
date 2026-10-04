import type { ReactNode } from "react";
import RoleLayout from "@/components/role-layout";

export const dynamic = "force-dynamic";

const items = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/attendance", label: "Attendance", icon: "✅" },
  { href: "/admin/plans", label: "Membership Plans", icon: "🎫" },
  { href: "/admin/trainers", label: "Trainers", icon: "🧑‍🏫" },
  { href: "/admin/workouts", label: "Workout Plans", icon: "📋" },
  { href: "/admin/reports", label: "Reports", icon: "📊" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout role="admin" items={items}>
      {children}
    </RoleLayout>
  );
}
