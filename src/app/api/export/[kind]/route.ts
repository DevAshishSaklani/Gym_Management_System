import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { members, membershipPlans, payments, trainers } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { memberCode, paymentCode } from "@/lib/format";

export const dynamic = "force-dynamic";

function csv(rows: (string | number | null)[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const v = String(c ?? "");
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(","),
    )
    .join("\n");
}

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const user = await getUser();
  if (!user || user.role !== "admin") return new Response("Forbidden", { status: 403 });
  const { kind } = await params;
  const url = new URL(req.url);

  if (kind === "members") {
    const q = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status");
    const conds = [];
    if (q) {
      const like = `%${q}%`;
      conds.push(or(ilike(members.name, like), ilike(members.email, like), ilike(members.phone, like)));
    }
    if (status && ["active", "expired", "suspended", "pending"].includes(status)) {
      conds.push(eq(members.status, status as "active"));
    }
    const rows = await db
      .select({ m: members, plan: membershipPlans.name, trainer: trainers.name })
      .from(members)
      .leftJoin(membershipPlans, eq(members.planId, membershipPlans.id))
      .leftJoin(trainers, eq(members.trainerId, trainers.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(members.id);
    const body = csv([
      ["Member ID", "Name", "Email", "Phone", "Gender", "DOB", "Join Date", "Plan", "Start", "Expiry", "Trainer", "Status"],
      ...rows.map(({ m, plan, trainer }) => [
        memberCode(m.id), m.name, m.email, m.phone, m.gender, m.dob, m.joinDate, plan, m.membershipStart, m.membershipExpiry, trainer, m.status,
      ]),
    ]);
    return new Response(body, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="members.csv"' },
    });
  }

  if (kind === "payments") {
    const rows = await db
      .select({ p: payments, member: members.name, plan: membershipPlans.name })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .leftJoin(membershipPlans, eq(payments.planId, membershipPlans.id))
      .orderBy(desc(payments.paymentDate), desc(payments.id));
    const body = csv([
      ["Payment ID", "Member", "Plan", "Amount", "Date", "Method", "Transaction ID", "Status"],
      ...rows.map(({ p, member, plan }) => [
        paymentCode(p.id), member, plan, p.amount, p.paymentDate, p.method, p.transactionId, p.status,
      ]),
    ]);
    return new Response(body, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="payments.csv"' },
    });
  }

  return new Response("Not found", { status: 404 });
}
