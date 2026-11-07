import NotificationsView from "@/components/notifications-view";
import { requireRole } from "@/lib/auth";

export default async function Page() {
  const user = await requireRole("admin");
  return <NotificationsView userId={user.id} />;
}
