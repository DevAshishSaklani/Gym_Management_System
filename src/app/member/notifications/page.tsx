import NotificationsView from "@/components/notifications-view";
import { requireRole } from "@/lib/auth";

export default async function Page() {
  const user = await requireRole("member");
  return <NotificationsView userId={user.id} />;
}
