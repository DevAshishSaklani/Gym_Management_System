"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { int } from "@/lib/form";

export async function markReadAction(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  const id = int(fd, "id");
  if (id) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  }
  redirect(`/${user.role}/notifications`);
}

export async function markAllReadAction() {
  const user = await getUser();
  if (!user) redirect("/login");
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  redirect(`/${user.role}/notifications`);
}
