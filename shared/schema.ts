import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, time, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["mentor", "mentee", "admin"]);
export const statusEnum = pgEnum("status", ["pending", "confirmed", "declined", "cancelled"]);
export const comfortLevelEnum = pgEnum("comfort_level", ["low", "medium", "high"]);
export const categoryEnum = pgEnum("category", ["2way", "3way", "canopy"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  uspaLicense: text("uspa_license"),
  jumps: integer("jumps").default(0),
  isActive: boolean("is_active").default(true),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Mentors table
export const mentors = pgTable("mentors", {
  id: uuid("id").primaryKey().references(() => users.id),
  ratings: text("ratings"),
  coachNumber: text("coach_number"),
  disciplines: jsonb("disciplines").$type<string[]>().default([]),
  maxConcurrentMentees: integer("max_concurrent_mentees").default(2),
  seniorityScore: integer("seniority_score").default(0),
  dzEndorsement: boolean("dz_endorsement").default(false),
});

// Mentees table
export const mentees = pgTable("mentees", {
  id: uuid("id").primaryKey().references(() => users.id),
  goals: text("goals"),
  comfortLevel: comfortLevelEnum("comfort_level").default("medium"),
  canopySize: integer("canopy_size"),
  lastCurrencyDate: date("last_currency_date"),
});

// Availability table
export const availability = pgTable("availability", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: roleEnum("role").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isRecurring: boolean("is_recurring").default(true),
  capacityOverride: integer("capacity_override"),
});

// Session blocks table
export const sessionBlocks = pgTable("session_blocks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  dzId: uuid("dz_id"),
  loadIntervalMin: integer("load_interval_min").default(90),
  blockCapacityHint: integer("block_capacity_hint").default(8),
});

// Attendance requests table
export const attendanceRequests = pgTable("attendance_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  menteeId: uuid("mentee_id").references(() => mentees.id).notNull(),
  sessionBlockId: uuid("session_block_id").references(() => sessionBlocks.id).notNull(),
  status: statusEnum("status").default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Preferences table
export const preferences = pgTable("preferences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  menteeId: uuid("mentee_id").references(() => mentees.id).notNull(),
  preferredMentors: jsonb("preferred_mentors").$type<string[]>().default([]),
  avoidMentors: jsonb("avoid_mentors").$type<string[]>().default([]),
  notes: text("notes"),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionBlockId: uuid("session_block_id").references(() => sessionBlocks.id).notNull(),
  mentorId: uuid("mentor_id").references(() => mentors.id).notNull(),
  menteeId: uuid("mentee_id").references(() => mentees.id).notNull(),
  status: statusEnum("status").default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Progression steps table
export const progressionSteps = pgTable("progression_steps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: categoryEnum("category").notNull(),
  required: boolean("required").default(true),
  minJumpsGate: integer("min_jumps_gate").default(0),
  references: jsonb("references"),
});

// Step completions table
export const stepCompletions = pgTable("step_completions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  menteeId: uuid("mentee_id").references(() => mentees.id).notNull(),
  stepId: uuid("step_id").references(() => progressionSteps.id).notNull(),
  mentorId: uuid("mentor_id").references(() => mentors.id).notNull(),
  completedAt: timestamp("completed_at").default(sql`CURRENT_TIMESTAMP`),
  evidenceUrl: text("evidence_url"),
  notes: text("notes"),
});

// Badges table
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  criteriaJson: jsonb("criteria_json"),
});

// Awards table
export const awards = pgTable("awards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  menteeId: uuid("mentee_id").references(() => mentees.id).notNull(),
  badgeId: uuid("badge_id").references(() => badges.id).notNull(),
  awardedAt: timestamp("awarded_at").default(sql`CURRENT_TIMESTAMP`),
});

// Jump logs table
export const jumpLogs = pgTable("jump_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  menteeId: uuid("mentee_id").references(() => mentees.id).notNull(),
  date: date("date").notNull(),
  jumpNumber: integer("jump_number").notNull(),
  aircraft: text("aircraft"),
  exitAlt: integer("exit_alt"),
  freefallTime: integer("freefall_time"),
  deploymentAlt: integer("deployment_alt"),
  patternNotes: text("pattern_notes"),
  drillRef: text("drill_ref"),
  mentorId: uuid("mentor_id").references(() => mentors.id),
});

// Audit events table
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: uuid("actor_id").references(() => users.id),
  type: text("type").notNull(),
  payloadJson: jsonb("payload_json"),
  at: timestamp("at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMentorSchema = createInsertSchema(mentors).omit({
  id: true,
});

export const insertMenteeSchema = createInsertSchema(mentees).omit({
  id: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
});

export const insertSessionBlockSchema = createInsertSchema(sessionBlocks).omit({
  id: true,
});

export const insertAttendanceRequestSchema = createInsertSchema(attendanceRequests).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const insertProgressionStepSchema = createInsertSchema(progressionSteps).omit({
  id: true,
});

export const insertStepCompletionSchema = createInsertSchema(stepCompletions).omit({
  id: true,
  completedAt: true,
});

export const insertJumpLogSchema = createInsertSchema(jumpLogs).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type Mentor = typeof mentors.$inferSelect;
export type Mentee = typeof mentees.$inferSelect;
export type Availability = typeof availability.$inferSelect;
export type SessionBlock = typeof sessionBlocks.$inferSelect;
export type AttendanceRequest = typeof attendanceRequests.$inferSelect;
export type Preference = typeof preferences.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type ProgressionStep = typeof progressionSteps.$inferSelect;
export type StepCompletion = typeof stepCompletions.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type Award = typeof awards.$inferSelect;
export type JumpLog = typeof jumpLogs.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMentor = z.infer<typeof insertMentorSchema>;
export type InsertMentee = z.infer<typeof insertMenteeSchema>;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type InsertSessionBlock = z.infer<typeof insertSessionBlockSchema>;
export type InsertAttendanceRequest = z.infer<typeof insertAttendanceRequestSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertProgressionStep = z.infer<typeof insertProgressionStepSchema>;
export type InsertStepCompletion = z.infer<typeof insertStepCompletionSchema>;
export type InsertJumpLog = z.infer<typeof insertJumpLogSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = insertUserSchema.extend({
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
