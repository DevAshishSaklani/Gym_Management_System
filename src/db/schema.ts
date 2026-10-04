import {
  boolean,
  date,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export type Role = "admin" | "trainer" | "member";
export type MemberStatus = "active" | "expired" | "suspended" | "pending";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<Role>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const passwordResets = pgTable("password_resets", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
});

export const trainers = pgTable("trainers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  specialization: text("specialization").notNull().default(""),
  experienceYears: integer("experience_years").notNull().default(0),
  joinDate: date("join_date", { mode: "string" }).notNull(),
  status: text("status").$type<"active" | "inactive">().notNull().default("active"),
});

export const membershipPlans = pgTable("membership_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  durationMonths: integer("duration_months").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull().default(""),
  benefits: text("benefits").notNull().default(""),
  status: text("status").$type<"active" | "inactive">().notNull().default("active"),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  dob: date("dob", { mode: "string" }),
  gender: text("gender").notNull().default(""),
  address: text("address").notNull().default(""),
  emergencyContact: text("emergency_contact").notNull().default(""),
  joinDate: date("join_date", { mode: "string" }).notNull(),
  status: text("status").$type<MemberStatus>().notNull().default("pending"),
  trainerId: integer("trainer_id").references(() => trainers.id, { onDelete: "set null" }),
  planId: integer("plan_id").references(() => membershipPlans.id, { onDelete: "set null" }),
  membershipStart: date("membership_start", { mode: "string" }),
  membershipExpiry: date("membership_expiry", { mode: "string" }),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  planId: integer("plan_id").references(() => membershipPlans.id, { onDelete: "set null" }),
  planName: text("plan_name").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  price: integer("price").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  planId: integer("plan_id").references(() => membershipPlans.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
  method: text("method").$type<PaymentMethod>().notNull().default("cash"),
  transactionId: text("transaction_id").notNull().default(""),
  status: text("status").$type<PaymentStatus>().notNull().default("paid"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
    checkOut: timestamp("check_out", { withTimezone: true }),
    status: text("status").$type<"present" | "absent">().notNull().default("present"),
  },
  (t) => [unique("attendance_member_date").on(t.memberId, t.date)],
);

export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  goal: text("goal").notNull().default(""),
  trainerId: integer("trainer_id").references(() => trainers.id, { onDelete: "set null" }),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  status: text("status").$type<"active" | "completed">().notNull().default("active"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id")
    .notNull()
    .references(() => workoutPlans.id, { onDelete: "cascade" }),
  day: text("day").notNull().default("Day 1"),
  exercise: text("exercise").notNull(),
  muscleGroup: text("muscle_group").notNull().default(""),
  sets: integer("sets").notNull().default(3),
  reps: text("reps").notNull().default("10"),
  weight: text("weight").notNull().default(""),
  restSeconds: integer("rest_seconds").notNull().default(60),
  notes: text("notes").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  weightKg: real("weight_kg"),
  chestCm: real("chest_cm"),
  waistCm: real("waist_cm"),
  armsCm: real("arms_cm"),
  personalRecord: text("personal_record").notNull().default(""),
  notes: text("notes").notNull().default(""),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull().default(""),
  type: text("type").notNull().default("info"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
