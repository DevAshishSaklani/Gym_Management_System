import { markAllReadAction, markReadAction } from "@/app/actions/notifications";
import { SubmitButton } from "@/components/buttons";
import { Card, Empty, PageHeader, btn } from "@/components/ui";
import Icon from "@/components/icon";
import { listNotifications } from "@/lib/data";

const icons: Record<string, string> = {
  payment: "💳",
  expiring: "⏰",
  expired: "⚠️",
  workout: "🏋️",
  assignment: "🤝",
  member: "👤",
  membership: "🎫",
  info: "🔔",
};

export default async function NotificationsView({ userId }: { userId: number }) {
  const items = await listNotifications(userId);
  const unread = items.filter((i) => !i.read).length;
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're all caught up"}
        action={
          unread > 0 ? (
            <form action={markAllReadAction}>
              <SubmitButton className={btn("ghost")}>Mark all as read</SubmitButton>
            </form>
          ) : undefined
        }
      />
      <Card pad={false}>
        {items.length === 0 ? (
          <Empty>No notifications yet.</Empty>
        ) : (
          <ul className="divide-y divide-ink/5">
            {items.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 px-5 py-4 ${n.read ? "" : "bg-accent/5"}`}>
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-link"><Icon name={icons[n.type] ?? "🔔"} className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {n.title}
                    {!n.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />}
                  </p>
                  <p className="text-sm text-ink/70">{n.message}</p>
                  <p className="mt-1 text-xs text-ink/40">
                    {n.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                {!n.read && (
                  <form action={markReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className={btn("ghost", "sm")}>Mark read</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
