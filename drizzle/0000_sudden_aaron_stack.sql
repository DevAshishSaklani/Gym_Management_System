CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"date" date NOT NULL,
	"check_in" timestamp with time zone NOT NULL,
	"check_out" timestamp with time zone,
	"status" text DEFAULT 'present' NOT NULL,
	CONSTRAINT "attendance_member_date" UNIQUE("member_id","date")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"dob" date,
	"gender" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"emergency_contact" text DEFAULT '' NOT NULL,
	"join_date" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"trainer_id" integer,
	"plan_id" integer,
	"membership_start" date,
	"membership_expiry" date
);
--> statement-breakpoint
CREATE TABLE "membership_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"duration_months" integer NOT NULL,
	"price" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"benefits" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"plan_id" integer,
	"plan_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"plan_id" integer,
	"amount" integer NOT NULL,
	"payment_date" date NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"transaction_id" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"date" date NOT NULL,
	"weight_kg" real,
	"chest_cm" real,
	"waist_cm" real,
	"arms_cm" real,
	"personal_record" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"specialization" text DEFAULT '' NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"join_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"day" text DEFAULT 'Day 1' NOT NULL,
	"exercise" text NOT NULL,
	"muscle_group" text DEFAULT '' NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"reps" text DEFAULT '10' NOT NULL,
	"weight" text DEFAULT '' NOT NULL,
	"rest_seconds" integer DEFAULT 60 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"goal" text DEFAULT '' NOT NULL,
	"trainer_id" integer,
	"member_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_plan_id_workout_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;