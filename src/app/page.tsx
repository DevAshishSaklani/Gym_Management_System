import { redirect } from "next/navigation";
import { getUser, homeFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getUser();
  redirect(user ? homeFor(user.role) : "/login");
}
