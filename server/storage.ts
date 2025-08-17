import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import type {
  User,
  Mentor,
  Mentee,
  Availability,
  SessionBlock,
  Assignment,
  AttendanceRequest,
  ProgressionStep,
  StepCompletion,
  Badge,
  Award,
  JumpLog,
  InsertUser,
  InsertMentor,
  InsertMentee,
  InsertAvailability,
  InsertSessionBlock,
  InsertAssignment,
  InsertAttendanceRequest,
  InsertProgressionStep,
  InsertStepCompletion,
  InsertJumpLog,
} from "@shared/schema";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export interface IStorage {
  // User management
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;

  // Mentor operations
  getMentorById(id: string): Promise<(Mentor & { user: User }) | undefined>;
  createMentor(mentor: InsertMentor): Promise<Mentor>;
  getMentorsWithUsers(): Promise<(Mentor & { user: User })[]>;

  // Mentee operations
  getMenteeById(id: string): Promise<(Mentee & { user: User }) | undefined>;
  createMentee(mentee: InsertMentee): Promise<Mentee>;
  getMenteesWithUsers(): Promise<(Mentee & { user: User })[]>;

  // Availability operations
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  getAvailabilityByUserId(userId: string): Promise<Availability[]>;
  deleteAvailability(id: string): Promise<boolean>;

  // Session operations
  createSessionBlock(sessionBlock: InsertSessionBlock): Promise<SessionBlock>;
  getSessionBlocksByDateRange(startDate: string, endDate: string): Promise<SessionBlock[]>;
  getSessionBlocksByMentorAndDate(mentorId: string, startDate: string, endDate: string): Promise<SessionBlock[]>;
  getSessionBlockById(id: string): Promise<SessionBlock | undefined>;
  deleteSessionBlock(id: string): Promise<boolean>;
  deleteSessionBlockRelatedData(sessionBlockId: string): Promise<void>;

  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignmentsByMentorId(mentorId: string): Promise<Assignment[]>;
  getAssignmentsByMenteeId(menteeId: string): Promise<Assignment[]>;
  updateAssignmentStatus(id: string, status: "pending" | "confirmed" | "declined" | "cancelled"): Promise<Assignment | undefined>;
  getAssignmentsWithDetails(sessionBlockId?: string): Promise<any[]>;
  getAssignmentsWithDetailsByMentorId(mentorId: string): Promise<any[]>;

  // Attendance operations
  createAttendanceRequest(request: InsertAttendanceRequest): Promise<AttendanceRequest>;
  getAttendanceRequestsByMenteeId(menteeId: string): Promise<AttendanceRequest[]>;
  getAttendanceRequestsBySessionBlock(sessionBlockId: string): Promise<AttendanceRequest[]>;

  // Progression operations
  getProgressionSteps(): Promise<ProgressionStep[]>;
  createProgressionStep(step: InsertProgressionStep): Promise<ProgressionStep>;
  getStepCompletionsByMenteeId(menteeId: string): Promise<StepCompletion[]>;
  createStepCompletion(completion: InsertStepCompletion): Promise<StepCompletion>;

  // Badge operations
  getBadges(): Promise<Badge[]>;
  createBadge(badge: Omit<Badge, 'id'>): Promise<Badge>;
  getAwardsByMenteeId(menteeId: string): Promise<Award[]>;

  // Jump log operations
  createJumpLog(jumpLog: InsertJumpLog): Promise<JumpLog>;
  getJumpLogsByMenteeId(menteeId: string): Promise<JumpLog[]>;

  // Dashboard data
  getMentorDashboardData(mentorId: string): Promise<any>;
  getMenteeDashboardData(menteeId: string): Promise<any>;
  getAdminDashboardData(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const { password, ...userInsert } = userData;
    
    const result = await db.insert(schema.users).values({
      ...userInsert,
      passwordHash,
    }).returning();
    
    return result[0];
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.passwordHash) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  async getMentorById(id: string): Promise<(Mentor & { user: User }) | undefined> {
    const result = await db
      .select()
      .from(schema.mentors)
      .leftJoin(schema.users, eq(schema.mentors.id, schema.users.id))
      .where(eq(schema.mentors.id, id))
      .limit(1);
    
    if (result.length === 0 || !result[0].users) return undefined;
    
    return {
      ...result[0].mentors,
      user: result[0].users,
    };
  }

  async createMentor(mentor: InsertMentor): Promise<Mentor> {
    const result = await db.insert(schema.mentors).values(mentor).returning();
    return result[0];
  }

  async getMentorsWithUsers(): Promise<(Mentor & { user: User })[]> {
    const result = await db
      .select()
      .from(schema.mentors)
      .leftJoin(schema.users, eq(schema.mentors.id, schema.users.id));
    
    return result.map(row => ({
      ...row.mentors,
      user: row.users!,
    }));
  }

  async getMenteeById(id: string): Promise<(Mentee & { user: User }) | undefined> {
    const result = await db
      .select()
      .from(schema.mentees)
      .leftJoin(schema.users, eq(schema.mentees.id, schema.users.id))
      .where(eq(schema.mentees.id, id))
      .limit(1);
    
    if (result.length === 0 || !result[0].users) return undefined;
    
    return {
      ...result[0].mentees,
      user: result[0].users,
    };
  }

  async createMentee(mentee: InsertMentee): Promise<Mentee> {
    const result = await db.insert(schema.mentees).values(mentee).returning();
    return result[0];
  }

  async getMenteesWithUsers(): Promise<(Mentee & { user: User })[]> {
    const result = await db
      .select()
      .from(schema.mentees)
      .leftJoin(schema.users, eq(schema.mentees.id, schema.users.id));
    
    return result.map(row => ({
      ...row.mentees,
      user: row.users!,
    }));
  }

  async createAvailability(availability: InsertAvailability): Promise<Availability> {
    const result = await db.insert(schema.availability).values(availability).returning();
    return result[0];
  }

  async getAvailabilityByUserId(userId: string): Promise<Availability[]> {
    return await db.select().from(schema.availability).where(eq(schema.availability.userId, userId));
  }

  async deleteAvailability(id: string): Promise<boolean> {
    const result = await db.delete(schema.availability).where(eq(schema.availability.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createSessionBlock(sessionBlock: InsertSessionBlock): Promise<SessionBlock> {
    const result = await db.insert(schema.sessionBlocks).values(sessionBlock).returning();
    return result[0];
  }

  async getSessionBlocksByDateRange(startDate: string, endDate: string): Promise<SessionBlock[]> {
    return await db
      .select()
      .from(schema.sessionBlocks)
      .where(
        and(
          gte(schema.sessionBlocks.date, startDate),
          lte(schema.sessionBlocks.date, endDate)
        )
      )
      .orderBy(schema.sessionBlocks.date, schema.sessionBlocks.startTime);
  }

  async getSessionBlocksByMentorAndDate(mentorId: string, startDate: string, endDate: string): Promise<SessionBlock[]> {
    return await db
      .select()
      .from(schema.sessionBlocks)
      .where(
        and(
          eq(schema.sessionBlocks.mentorId, mentorId),
          gte(schema.sessionBlocks.date, startDate),
          lte(schema.sessionBlocks.date, endDate)
        )
      )
      .orderBy(schema.sessionBlocks.date, schema.sessionBlocks.startTime);
  }

  async getSessionBlockById(id: string): Promise<SessionBlock | undefined> {
    const result = await db.select().from(schema.sessionBlocks).where(eq(schema.sessionBlocks.id, id)).limit(1);
    return result[0];
  }

  async deleteSessionBlock(id: string): Promise<boolean> {
    const result = await db.delete(schema.sessionBlocks).where(eq(schema.sessionBlocks.id, id));
    return true;
  }

  async deleteSessionBlockRelatedData(sessionBlockId: string): Promise<void> {
    // Delete related assignments
    await db.delete(schema.assignments).where(eq(schema.assignments.sessionBlockId, sessionBlockId));
    // Delete related attendance requests
    await db.delete(schema.attendanceRequests).where(eq(schema.attendanceRequests.sessionBlockId, sessionBlockId));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const result = await db.insert(schema.assignments).values(assignment).returning();
    return result[0];
  }

  async getAssignmentsByMentorId(mentorId: string): Promise<Assignment[]> {
    return await db
      .select()
      .from(schema.assignments)
      .where(eq(schema.assignments.mentorId, mentorId))
      .orderBy(desc(schema.assignments.createdAt));
  }

  async getAssignmentsByMenteeId(menteeId: string): Promise<Assignment[]> {
    return await db
      .select()
      .from(schema.assignments)
      .where(eq(schema.assignments.menteeId, menteeId))
      .orderBy(desc(schema.assignments.createdAt));
  }

  async updateAssignmentStatus(id: string, status: "pending" | "confirmed" | "declined" | "cancelled"): Promise<Assignment | undefined> {
    const result = await db
      .update(schema.assignments)
      .set({ status })
      .where(eq(schema.assignments.id, id))
      .returning();
    return result[0];
  }

  async getAssignmentsWithDetails(sessionBlockId?: string): Promise<any[]> {
    let baseQuery = db
      .select({
        assignment: schema.assignments,
        mentor: schema.users,
        mentee: {
          id: schema.users.id,
          email: schema.users.email,
        },
        sessionBlock: schema.sessionBlocks,
      })
      .from(schema.assignments)
      .innerJoin(schema.users, eq(schema.assignments.menteeId, schema.users.id))
      .leftJoin(schema.sessionBlocks, eq(schema.assignments.sessionBlockId, schema.sessionBlocks.id));

    if (sessionBlockId) {
      return await baseQuery.where(eq(schema.assignments.sessionBlockId, sessionBlockId));
    }

    return await baseQuery;
  }

  async getAssignmentsWithDetailsByMentorId(mentorId: string): Promise<any[]> {
    return await db
      .select({
        assignment: schema.assignments,
        mentee: {
          id: schema.users.id,
          email: schema.users.email,
        },
        sessionBlock: schema.sessionBlocks,
      })
      .from(schema.assignments)
      .innerJoin(schema.users, eq(schema.assignments.menteeId, schema.users.id))
      .leftJoin(schema.sessionBlocks, eq(schema.assignments.sessionBlockId, schema.sessionBlocks.id))
      .where(eq(schema.assignments.mentorId, mentorId))
      .orderBy(desc(schema.assignments.createdAt));
  }

  async createAttendanceRequest(request: InsertAttendanceRequest): Promise<AttendanceRequest> {
    const result = await db.insert(schema.attendanceRequests).values(request).returning();
    return result[0];
  }

  async getAttendanceRequestsByMenteeId(menteeId: string): Promise<AttendanceRequest[]> {
    return await db
      .select()
      .from(schema.attendanceRequests)
      .where(eq(schema.attendanceRequests.menteeId, menteeId))
      .orderBy(desc(schema.attendanceRequests.createdAt));
  }

  async getAttendanceRequestsBySessionBlock(sessionBlockId: string): Promise<AttendanceRequest[]> {
    return await db
      .select()
      .from(schema.attendanceRequests)
      .where(eq(schema.attendanceRequests.sessionBlockId, sessionBlockId));
  }

  async getProgressionSteps(): Promise<ProgressionStep[]> {
    return await db.select().from(schema.progressionSteps);
  }

  async createProgressionStep(step: InsertProgressionStep): Promise<ProgressionStep> {
    const result = await db.insert(schema.progressionSteps).values(step).returning();
    return result[0];
  }

  async getStepCompletionsByMenteeId(menteeId: string): Promise<StepCompletion[]> {
    return await db
      .select()
      .from(schema.stepCompletions)
      .where(eq(schema.stepCompletions.menteeId, menteeId));
  }

  async createStepCompletion(completion: InsertStepCompletion): Promise<StepCompletion> {
    const result = await db.insert(schema.stepCompletions).values(completion).returning();
    return result[0];
  }

  async getBadges(): Promise<Badge[]> {
    return await db.select().from(schema.badges);
  }

  async createBadge(badge: Omit<Badge, 'id'>): Promise<Badge> {
    const result = await db.insert(schema.badges).values(badge).returning();
    return result[0];
  }

  async getAwardsByMenteeId(menteeId: string): Promise<Award[]> {
    return await db
      .select()
      .from(schema.awards)
      .where(eq(schema.awards.menteeId, menteeId));
  }

  async createJumpLog(jumpLog: InsertJumpLog): Promise<JumpLog> {
    const result = await db.insert(schema.jumpLogs).values(jumpLog).returning();
    return result[0];
  }

  async getJumpLogsByMenteeId(menteeId: string): Promise<JumpLog[]> {
    return await db
      .select()
      .from(schema.jumpLogs)
      .where(eq(schema.jumpLogs.menteeId, menteeId))
      .orderBy(desc(schema.jumpLogs.date));
  }

  async getMentorDashboardData(mentorId: string): Promise<any> {
    // Get pending assignments for this mentor
    const pendingAssignments = await db
      .select({
        assignment: schema.assignments,
        mentee: schema.users,
        sessionBlock: schema.sessionBlocks,
      })
      .from(schema.assignments)
      .leftJoin(schema.users, eq(schema.assignments.menteeId, schema.users.id))
      .leftJoin(schema.sessionBlocks, eq(schema.assignments.sessionBlockId, schema.sessionBlocks.id))
      .where(
        and(
          eq(schema.assignments.mentorId, mentorId),
          eq(schema.assignments.status, "pending")
        )
      );

    // Get upcoming confirmed sessions
    const upcomingSessions = await db
      .select({
        assignment: schema.assignments,
        sessionBlock: schema.sessionBlocks,
      })
      .from(schema.assignments)
      .leftJoin(schema.sessionBlocks, eq(schema.assignments.sessionBlockId, schema.sessionBlocks.id))
      .where(
        and(
          eq(schema.assignments.mentorId, mentorId),
          eq(schema.assignments.status, "confirmed"),
          gte(schema.sessionBlocks.date, new Date().toISOString().split('T')[0])
        )
      )
      .orderBy(schema.sessionBlocks.date, schema.sessionBlocks.startTime);

    // Get monthly stats (simplified)
    const monthlyJumps = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.jumpLogs)
      .where(eq(schema.jumpLogs.mentorId, mentorId));

    return {
      pendingAssignments,
      upcomingSessions,
      stats: {
        monthlyJumps: monthlyJumps[0]?.count || 0,
        studentsTrained: 12, // Simplified
        signoffs: 23, // Simplified
        rating: 4.9, // Simplified
      },
    };
  }

  async getMenteeDashboardData(menteeId: string): Promise<any> {
    // Get upcoming sessions
    const upcomingSessions = await db
      .select({
        assignment: schema.assignments,
        mentor: schema.users,
        sessionBlock: schema.sessionBlocks,
      })
      .from(schema.assignments)
      .leftJoin(schema.users, eq(schema.assignments.mentorId, schema.users.id))
      .leftJoin(schema.sessionBlocks, eq(schema.assignments.sessionBlockId, schema.sessionBlocks.id))
      .where(
        and(
          eq(schema.assignments.menteeId, menteeId),
          eq(schema.assignments.status, "confirmed"),
          gte(schema.sessionBlocks.date, new Date().toISOString().split('T')[0])
        )
      )
      .orderBy(schema.sessionBlocks.date, schema.sessionBlocks.startTime);

    // Get progression data
    const completions = await this.getStepCompletionsByMenteeId(menteeId);
    const totalSteps = await db.select({ count: sql<number>`count(*)` }).from(schema.progressionSteps);
    
    // Get earned badges
    const awards = await this.getAwardsByMenteeId(menteeId);
    
    // Get jump count
    const jumpLogs = await this.getJumpLogsByMenteeId(menteeId);

    return {
      upcomingSessions,
      progression: {
        completions,
        totalSteps: totalSteps[0]?.count || 0,
        totalJumps: jumpLogs.length,
        lastJump: jumpLogs[0]?.date || null,
      },
      awards,
    };
  }

  async getAdminDashboardData(): Promise<any> {
    // Get active user counts
    const userCounts = await db
      .select({
        role: schema.users.role,
        count: sql<number>`count(*)`,
      })
      .from(schema.users)
      .where(eq(schema.users.isActive, true))
      .groupBy(schema.users.role);

    // Get recent assignments
    const recentAssignments = await this.getAssignmentsWithDetails();

    // Get session blocks for current week
    const currentWeek = new Date();
    const weekStart = new Date(currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay()));
    const weekEnd = new Date(currentWeek.setDate(currentWeek.getDate() + 6));

    const weeklyBlocks = await this.getSessionBlocksByDateRange(
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    );

    return {
      userCounts,
      recentAssignments: recentAssignments.slice(0, 10),
      weeklyBlocks,
      metrics: {
        activeUsers: userCounts.reduce((sum, role) => sum + role.count, 0),
        weeklyJumps: 127, // Simplified
        pendingRequests: 8, // Simplified
      },
    };
  }

  // Additional methods for progression and user management
  async getProgressionSteps(): Promise<ProgressionStep[]> {
    return await db.select().from(schema.progressionSteps).orderBy(schema.progressionSteps.category, schema.progressionSteps.title);
  }

  async getStepCompletionsByUserId(userId: string): Promise<StepCompletion[]> {
    const menteeData = await this.getMenteeById(userId);
    if (!menteeData) return [];
    return await db.select().from(schema.stepCompletions).where(eq(schema.stepCompletions.menteeId, menteeData.id));
  }

  async createStepCompletion(completion: Omit<StepCompletion, 'id' | 'completedAt'>): Promise<StepCompletion> {
    const result = await db.insert(schema.stepCompletions).values(completion).returning();
    return result[0];
  }

  async getBadges(): Promise<Badge[]> {
    return await db.select().from(schema.badges);
  }

  async getAwardsByUserId(userId: string): Promise<any[]> {
    const menteeData = await this.getMenteeById(userId);
    if (!menteeData) return [];
    
    return await db
      .select({
        id: schema.awards.id,
        badgeId: schema.awards.badgeId,
        awardedAt: schema.awards.awardedAt,
        badge: {
          id: schema.badges.id,
          code: schema.badges.code,
          name: schema.badges.name,
          description: schema.badges.description,
        }
      })
      .from(schema.awards)
      .leftJoin(schema.badges, eq(schema.awards.badgeId, schema.badges.id))
      .where(eq(schema.awards.menteeId, menteeData.id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(schema.users.createdAt);
  }

  async getAllMentors(): Promise<any[]> {
    return await db
      .select({
        id: schema.mentors.id,
        email: schema.users.email,
        ratings: schema.mentors.ratings,
        coachNumber: schema.mentors.coachNumber,
        disciplines: schema.mentors.disciplines,
        maxConcurrentMentees: schema.mentors.maxConcurrentMentees,
        currentMentees: schema.mentors.currentMentees,
        dzEndorsement: schema.mentors.dzEndorsement
      })
      .from(schema.mentors)
      .leftJoin(schema.users, eq(schema.mentors.id, schema.users.id));
  }

  async getAllMentees(): Promise<any[]> {
    // Simple query to get all mentees with their user information
    const menteesList = await db.select().from(schema.mentees);
    const menteeWithUsers = [];
    
    for (const mentee of menteesList) {
      const user = await db.select().from(schema.users).where(eq(schema.users.id, mentee.id)).limit(1);
      menteeWithUsers.push({
        id: mentee.id,
        email: user[0]?.email || '',
        comfortLevel: mentee.comfortLevel,
        goals: mentee.goals,
        canopySize: mentee.canopySize,
        lastCurrencyDate: mentee.lastCurrencyDate
      });
    }
    
    return menteeWithUsers;
  }

  // Availability update method  
  async updateAvailability(id: string, updates: Partial<Availability>): Promise<Availability> {
    const result = await db.update(schema.availability).set(updates).where(eq(schema.availability.id, id)).returning();
    return result[0];
  }

  // Assignment update method
  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const result = await db.update(schema.assignments).set(updates).where(eq(schema.assignments.id, id)).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
