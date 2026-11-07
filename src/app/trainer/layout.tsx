import type { ReactNode } from "react";
import RoleLayout from "@/components/role-layout";

export const dynamic = "force-dynamic";

const items = [
  { href: "/trainer", label: "Dashboard", icon: "🏠" },
  { href: "/trainer/members", label: "My Members", icon: "👥" },
  { href: "/trainer/workouts", label: "Workout Plans", icon: "📋" },
  { href: "/trainer/progress", label: "Progress", icon: "📈" },
  { href: "/trainer/attendance", label: "Attendance", icon: "✅" },
  { href: "/trainer/notifications", label: "Notifications", icon: "🔔" },
  { href: "/trainer/profile", label: "Profile", icon: "👤" },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout role="trainer" items={items}>
      {children}
    </RoleLayout>
  );
}
