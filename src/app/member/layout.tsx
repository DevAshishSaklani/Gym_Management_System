import type { ReactNode } from "react";
import RoleLayout from "@/components/role-layout";

export const dynamic = "force-dynamic";

const items = [
  { href: "/member", label: "Dashboard", icon: "🏠" },
  { href: "/member/workout", label: "Workout", icon: "🏋️" },
  { href: "/member/attendance", label: "Attendance", icon: "✅" },
  { href: "/member/payments", label: "Payments", icon: "💳" },
  { href: "/member/membership", label: "Membership", icon: "🎫" },
  { href: "/member/progress", label: "Progress", icon: "📈" },
  { href: "/member/notifications", label: "Notifications", icon: "🔔" },
  { href: "/member/profile", label: "My Profile", icon: "👤" },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout role="member" items={items}>
      {children}
    </RoleLayout>
  );
}
