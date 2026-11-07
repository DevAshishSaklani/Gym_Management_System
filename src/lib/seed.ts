import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  attendance,
  members,
  membershipPlans,
  memberships,
  notifications,
  payments,
  progress,
  trainers,
  users,
  workoutExercises,
  workoutPlans,
  type MemberStatus,
  type PaymentMethod,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { addDays, addMonths, istTimestamp, todayStr } from "@/lib/dates";

let seeding: Promise<void> | null = null;

/** Seeds demo data the first time the app runs against an empty database. */
export function ensureSeed(): Promise<void> {
  if (!seeding) {
    seeding = run().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

async function run() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  if (c > 0) return;

  const rand = rng(42);
  const today = todayStr();
  const adminHash = hashPassword("admin123");
  const trainerHash = hashPassword("trainer123");
  const memberHash = hashPassword("member123");

  // Admin
  await db.insert(users).values({
    name: "Gym Owner",
    email: "admin@gym.com",
    passwordHash: adminHash,
    role: "admin",
  });

  // Plans
  const planRows = await db
    .insert(membershipPlans)
    .values([
      {
        name: "Basic",
        durationMonths: 1,
        price: 1000,
        description: "Perfect to get started.",
        benefits: "Gym floor access\nLocker room\nFree fitness assessment",
      },
      {
        name: "Standard",
        durationMonths: 3,
        price: 2500,
        description: "Our most flexible quarterly plan.",
        benefits: "Gym floor access\nLocker room\nGroup classes\nFree fitness assessment",
      },
      {
        name: "Premium",
        durationMonths: 6,
        price: 4500,
        description: "Best value for serious training.",
        benefits: "Gym floor access\nGroup classes\nTrainer consultation\nDiet guidance\nSteam room",
      },
      {
        name: "Annual",
        durationMonths: 12,
        price: 7500,
        description: "A full year of commitment, a full year of savings.",
        benefits: "All Premium benefits\nPersonal training (2 sessions/month)\nFree merchandise\nGuest passes",
      },
    ])
    .returning();

  // Trainers
  const trainerSeed = [
    { name: "Rahul Sharma", email: "rahul@gym.com", phone: "9876500001", specialization: "Weight Training", exp: 6 },
    { name: "Neha Verma", email: "neha@gym.com", phone: "9876500002", specialization: "Yoga & Cardio", exp: 4 },
    { name: "Vikram Singh", email: "vikram@gym.com", phone: "9876500003", specialization: "CrossFit", exp: 8 },
  ];
  const trainerUsers = await db
    .insert(users)
    .values(
      trainerSeed.map((t) => ({
        name: t.name,
        email: t.email,
        passwordHash: trainerHash,
        role: "trainer" as const,
      })),
    )
    .returning();
  const trainerRows = await db
    .insert(trainers)
    .values(
      trainerSeed.map((t, i) => ({
        userId: trainerUsers[i].id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        specialization: t.specialization,
        experienceYears: t.exp,
        joinDate: addMonths(today, -(12 + i * 6)),
      })),
    )
    .returning();

  // Members
  type MSeed = {
    name: string;
    plan: number | null;
    startAgo: number;
    trainer: number;
    status?: MemberStatus;
    gender: string;
  };
  const ashishStart = addDays(addMonths(today, -6), 23);
  const seeds: MSeed[] = [
    { name: "Ashish Kumar", plan: 2, startAgo: -1, trainer: 0, gender: "Male" },
    { name: "Aman Gupta", plan: 1, startAgo: 20, trainer: 0, gender: "Male" },
    { name: "Rohan Mehta", plan: 0, startAgo: 25, trainer: 0, gender: "Male" },
    { name: "Priya Nair", plan: 3, startAgo: 100, trainer: 1, gender: "Female" },
    { name: "Sneha Reddy", plan: 2, startAgo: 60, trainer: 1, gender: "Female" },
    { name: "Karan Malhotra", plan: 0, startAgo: 45, trainer: 2, gender: "Male" },
    { name: "Divya Joshi", plan: 1, startAgo: 120, trainer: 1, gender: "Female" },
    { name: "Arjun Patel", plan: 1, startAgo: 80, trainer: 2, gender: "Male" },
    { name: "Meera Iyer", plan: 3, startAgo: 200, trainer: 1, gender: "Female" },
    { name: "Siddharth Rao", plan: 2, startAgo: 30, trainer: 2, gender: "Male" },
    { name: "Pooja Desai", plan: 0, startAgo: 10, trainer: 0, gender: "Female" },
    { name: "Rahul Verma", plan: 1, startAgo: 5, trainer: 2, gender: "Male" },
    { name: "Ananya Das", plan: 0, startAgo: 40, trainer: 0, gender: "Female" },
    { name: "Vivek Chauhan", plan: 2, startAgo: 90, trainer: 2, status: "suspended", gender: "Male" },
    { name: "Isha Kapoor", plan: null, startAgo: 3, trainer: 1, status: "pending", gender: "Female" },
    { name: "Nikhil Bansal", plan: null, startAgo: 1, trainer: 0, status: "pending", gender: "Male" },
    { name: "Tanvi Shah", plan: 3, startAgo: 15, trainer: 0, gender: "Female" },
    { name: "Harsh Vyas", plan: 1, startAgo: 50, trainer: 1, gender: "Male" },
  ];

  const memberUsers = await db
    .insert(users)
    .values(
      seeds.map((m, i) => ({
        name: m.name,
        email: i === 0 ? "ashish@gym.com" : `${m.name.split(" ")[0].toLowerCase()}@example.com`,
        passwordHash: memberHash,
        role: "member" as const,
      })),
    )
    .returning();

  const memberValues = seeds.map((m, i) => {
    const plan = m.plan === null ? null : planRows[m.plan];
    const start = i === 0 ? ashishStart : addDays(today, -m.startAgo);
    const expiry = plan ? addMonths(start, plan.durationMonths) : null;
    const status: MemberStatus = m.status ?? (expiry && expiry < today ? "expired" : "active");
    return {
      userId: memberUsers[i].id,
      name: m.name,
      email: memberUsers[i].email,
      phone: `98${String(10000000 + Math.floor(rand() * 89999999))}`,
      dob: `${1988 + Math.floor(rand() * 15)}-${pad(1 + Math.floor(rand() * 12))}-${pad(1 + Math.floor(rand() * 28))}`,
      gender: m.gender,
      address: `${10 + i}, MG Road, Pune`,
      emergencyContact: `97${String(10000000 + Math.floor(rand() * 89999999))}`,
      joinDate: i === 0 ? addDays(today, -180) : start,
      status,
      trainerId: trainerRows[m.trainer].id,
      planId: plan?.id ?? null,
      membershipStart: plan ? start : null,
      membershipExpiry: expiry,
    };
  });
  const memberRows = await db.insert(members).values(memberValues).returning();

  // Memberships + first payments
  const methods: PaymentMethod[] = ["upi", "cash", "card", "bank_transfer"];
  const membershipValues: (typeof memberships.$inferInsert)[] = [];
  const paymentValues: (typeof payments.$inferInsert)[] = [];
  for (let i = 0; i < memberRows.length; i++) {
    const m = memberRows[i];
    if (!m.planId || !m.membershipStart || !m.membershipExpiry) continue;
    const plan = planRows.find((p) => p.id === m.planId)!;
    membershipValues.push({
      memberId: m.id,
      planId: plan.id,
      planName: plan.name,
      startDate: m.membershipStart,
      endDate: m.membershipExpiry,
      price: plan.price,
    });
    paymentValues.push({
      memberId: m.id,
      planId: plan.id,
      amount: plan.price,
      paymentDate: m.membershipStart,
      method: methods[i % 4],
      transactionId: i % 4 === 1 ? "" : `TXN${700000 + i * 137}`,
      status: "paid" as const,
    });
  }
  await db.insert(memberships).values(membershipValues);

  // Historical revenue (earlier renewals) so reports have meaningful data
  for (let mo = 1; mo <= 6; mo++) {
    const count = 5 + Math.floor(rand() * 4);
    for (let k = 0; k < count; k++) {
      const m = memberRows[Math.floor(rand() * memberRows.length)];
      const plan = planRows[Math.floor(rand() * planRows.length)];
      const day = addDays(addMonths(today, -mo), -Math.floor(rand() * 20));
      paymentValues.push({
        memberId: m.id,
        planId: plan.id,
        amount: plan.price,
        paymentDate: day,
        method: methods[Math.floor(rand() * 4)],
        transactionId: `TXN${500000 + mo * 1000 + k}`,
        status: "paid" as const,
      });
    }
  }
  paymentValues.push(
    {
      memberId: memberRows[14].id,
      planId: planRows[0].id,
      amount: 1000,
      paymentDate: today,
      method: "upi",
      transactionId: "TXN900001",
      status: "pending",
    },
    {
      memberId: memberRows[15].id,
      planId: planRows[1].id,
      amount: 2500,
      paymentDate: addDays(today, -2),
      method: "card",
      transactionId: "TXN900002",
      status: "failed",
    },
    {
      memberId: memberRows[12].id,
      planId: planRows[0].id,
      amount: 1000,
      paymentDate: addDays(today, -12),
      method: "cash",
      transactionId: "",
      status: "refunded",
    },
  );
  await db.insert(payments).values(paymentValues);

  // Attendance for the last 30 days
  const attValues: (typeof attendance.$inferInsert)[] = [];
  for (let i = 0; i < memberRows.length; i++) {
    const m = memberRows[i];
    if (!m.membershipStart || !m.membershipExpiry || m.status === "pending") continue;
    const prob = i === 0 ? 0.82 : 0.35 + rand() * 0.45;
    for (let d = 30; d >= 0; d--) {
      const date = addDays(today, -d);
      if (date < m.membershipStart || date > m.membershipExpiry) continue;
      if (m.status === "suspended" && d < 20) continue;
      if (rand() > prob) continue;
      const morning = rand() > 0.4;
      const hour = morning ? 6 + Math.floor(rand() * 3) : 17 + Math.floor(rand() * 3);
      const minute = Math.floor(rand() * 60);
      const checkIn = istTimestamp(date, `${pad(hour)}:${pad(minute)}`);
      const checkOut = new Date(checkIn.getTime() + (55 + Math.floor(rand() * 50)) * 60000);
      attValues.push({
        memberId: m.id,
        date,
        checkIn,
        checkOut: d === 0 && checkOut.getTime() > Date.now() ? null : checkOut,
        status: "present" as const,
      });
    }
  }
  await db.insert(attendance).values(attValues);

  // Workout plans
  const ex = (
    day: string,
    list: [string, string, number, string, string, number][],
  ) => list.map((e, idx) => ({ day, exercise: e[0], muscleGroup: e[1], sets: e[2], reps: e[3], weight: e[4], restSeconds: e[5], sortOrder: idx }));

  const planDefs: {
    member: number;
    trainer: number;
    name: string;
    goal: string;
    exercises: ReturnType<typeof ex>;
  }[] = [
    {
      member: 0,
      trainer: 0,
      name: "Push / Pull / Legs Split",
      goal: "Muscle Building",
      exercises: [
        ...ex("Chest Day", [
          ["Bench Press", "Chest", 4, "10", "60 kg", 90],
          ["Incline Dumbbell Press", "Chest", 3, "12", "22 kg", 75],
          ["Cable Fly", "Chest", 3, "15", "15 kg", 60],
          ["Push-ups", "Chest", 3, "Failure", "Bodyweight", 60],
        ]),
        ...ex("Back Day", [
          ["Deadlift", "Back", 4, "8", "90 kg", 120],
          ["Lat Pulldown", "Back", 3, "12", "50 kg", 75],
          ["Seated Cable Row", "Back", 3, "12", "45 kg", 75],
        ]),
        ...ex("Leg Day", [
          ["Back Squat", "Legs", 4, "10", "70 kg", 120],
          ["Leg Press", "Legs", 3, "12", "120 kg", 90],
          ["Walking Lunges", "Legs", 3, "20 steps", "12 kg", 60],
        ]),
      ],
    },
    {
      member: 1,
      trainer: 0,
      name: "Strength Foundation",
      goal: "Strength",
      exercises: [
        ...ex("Day 1 — Upper", [
          ["Overhead Press", "Shoulders", 4, "8", "35 kg", 90],
          ["Barbell Row", "Back", 4, "8", "50 kg", 90],
        ]),
        ...ex("Day 2 — Lower", [
          ["Front Squat", "Legs", 4, "6", "50 kg", 120],
          ["Romanian Deadlift", "Hamstrings", 3, "10", "60 kg", 90],
        ]),
      ],
    },
    {
      member: 3,
      trainer: 1,
      name: "Flexibility & Fat Loss",
      goal: "Fat Loss",
      exercises: [
        ...ex("Morning Flow", [
          ["Sun Salutation", "Full Body", 5, "1 round", "", 30],
          ["Warrior Sequence", "Legs", 3, "45 sec hold", "", 30],
        ]),
        ...ex("Cardio Day", [
          ["Treadmill Intervals", "Cardio", 8, "1 min fast / 1 min slow", "", 30],
          ["Rowing Machine", "Full Body", 3, "500 m", "", 60],
        ]),
      ],
    },
    {
      member: 9,
      trainer: 2,
      name: "CrossFit Conditioning",
      goal: "Conditioning",
      exercises: [
        ...ex("WOD A", [
          ["Burpees", "Full Body", 5, "15", "Bodyweight", 45],
          ["Kettlebell Swings", "Posterior Chain", 5, "20", "16 kg", 45],
          ["Box Jumps", "Legs", 4, "12", "24 in", 45],
        ]),
      ],
    },
  ];
  for (const def of planDefs) {
    const [plan] = await db
      .insert(workoutPlans)
      .values({
        name: def.name,
        goal: def.goal,
        trainerId: trainerRows[def.trainer].id,
        memberId: memberRows[def.member].id,
        startDate: addDays(today, -14),
        endDate: addDays(today, 46),
      })
      .returning();
    await db.insert(workoutExercises).values(def.exercises.map((e) => ({ ...e, planId: plan.id })));
  }

  // Progress
  const progressValues: (typeof progress.$inferInsert)[] = [];
  const ashishWeights = [68, 67.6, 67.4, 67.0, 66.8, 66.4, 66.1];
  ashishWeights.forEach((w, idx) =>
    progressValues.push({
      memberId: memberRows[0].id,
      date: addDays(today, -(ashishWeights.length - 1 - idx) * 7),
      weightKg: w,
      chestCm: 98 + idx * 0.3,
      waistCm: 82 - idx * 0.4,
      armsCm: 34 + idx * 0.2,
      personalRecord: idx === 6 ? "Bench Press 70 kg x 5" : "",
      notes: "",
    }),
  );
  [3, 4, 1].forEach((mi, k) => {
    for (let w = 0; w < 4; w++) {
      progressValues.push({
        memberId: memberRows[mi].id,
        date: addDays(today, -(3 - w) * 7 - k),
        weightKg: 74 - k * 4 - w * 0.5,
        chestCm: null,
        waistCm: 78 - w * 0.5,
        armsCm: null,
        personalRecord: "",
        notes: "",
      });
    }
  });
  await db.insert(progress).values(progressValues);

  // Notifications
  const adminUser = (await db.select().from(users).where(sql`${users.role} = 'admin'`))[0];
  await db.insert(notifications).values([
    { userId: adminUser.id, title: "New member registered", message: "Isha Kapoor signed up and is awaiting activation.", type: "member" },
    { userId: adminUser.id, title: "Payment pending", message: "Isha Kapoor has a pending payment of ₹1,000.", type: "payment" },
    { userId: adminUser.id, title: "Membership expiring", message: "Rohan Mehta's Basic plan expires soon.", type: "expiring" },
    { userId: memberUsers[0].id, title: "Welcome to GYMIFY 👋", message: "Your account is ready. Check your workout plan and track your progress.", type: "info" },
    { userId: memberUsers[0].id, title: "Payment confirmed", message: "We received your payment of ₹4,500 for the Premium plan.", type: "payment" },
    { userId: memberUsers[0].id, title: "New workout plan", message: "Rahul Sharma assigned you 'Push / Pull / Legs Split'.", type: "workout" },
    { userId: trainerUsers[0].id, title: "Members assigned", message: "You have members assigned to you. Create their workout plans.", type: "assignment" },
  ]);
}
