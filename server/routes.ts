import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { suggestionService } from "./services/suggestionService";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";
import { loginSchema, signupSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Express.Request {
  user?: User;
}

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const { confirmPassword, ...userData } = validatedData;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user
      const user = await storage.createUser(userData);

      // Create role-specific profile
      if (user.role === "mentor") {
        await storage.createMentor({
          id: user.id,
          ratings: "",
          coachNumber: "",
          disciplines: [],
          maxConcurrentMentees: 2,
          seniorityScore: 0,
          dzEndorsement: false,
        });
      } else if (user.role === "mentee") {
        await storage.createMentee({
          id: user.id,
          goals: "",
          comfortLevel: "medium",
          canopySize: null,
          lastCurrencyDate: null,
        });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // Set to false for development
        sameSite: "lax", // Changed from strict to lax for better compatibility
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/", // Ensure cookie is available for all paths
      });

      res.json({ user: { ...user, passwordHash: undefined } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // Set to false for development
        sameSite: "lax", // Changed from strict to lax for better compatibility
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/", // Ensure cookie is available for all paths
      });

      res.json({ user: { ...user, passwordHash: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid credentials" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res) => {
    const { passwordHash, ...user } = req.user!;
    res.json({ user });
  });

  // User routes
  app.get("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Availability routes
  app.post("/api/availability", authenticateToken, async (req, res) => {
    try {
      const availability = await storage.createAvailability({
        ...req.body,
        userId: req.user!.id,
        role: req.user!.role,
      });
      res.json(availability);
    } catch (error) {
      console.error("Create availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/availability", authenticateToken, async (req, res) => {
    try {
      const userId = req.query.user_id as string || req.user!.id;
      const availability = await storage.getAvailabilityByUserId(userId);
      res.json(availability);
    } catch (error) {
      console.error("Get availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/availability/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteAvailability(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Availability not found" });
      }
      res.json({ message: "Availability deleted successfully" });
    } catch (error) {
      console.error("Delete availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Session routes
  app.get("/api/sessions", authenticateToken, async (req, res) => {
    try {
      const date = req.query.date as string;
      const startDate = date || new Date().toISOString().split('T')[0];
      const endDate = date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const sessions = await storage.getSessionBlocksByDateRange(startDate, endDate);
      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/sessions/day/:date", authenticateToken, async (req, res) => {
    try {
      const sessionBlocks = await storage.getSessionBlocksByDate(req.params.date);
      const sessionBlocksWithDetails = await Promise.all(sessionBlocks.map(async (block) => {
        const assignments = await storage.getAssignmentsWithDetails(block.id);
        const mentor = await storage.getMentorById(block.mentorId);
        return {
          ...block,
          assignments,
          mentor,
        };
      }));
      res.json(sessionBlocksWithDetails);
    } catch (error) {
      console.error("Get sessions by day error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sessions/materialize", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const { from, to, template } = req.body;
      const sessions = [];
      
      // Simple implementation - create session blocks based on template
      const startDate = new Date(from);
      const endDate = new Date(to);
      
      while (startDate <= endDate) {
        const dateString = startDate.toISOString().split('T')[0];
        const dayOfWeek = startDate.getDay();
        
        // Create sessions for specific days (Tue, Thu, Sat, Sun)
        if ([0, 2, 4, 6].includes(dayOfWeek)) {
          const timeBlocks = [
            { start: "08:00", end: "09:30" },
            { start: "10:00", end: "11:30" },
            { start: "12:00", end: "13:30" },
            { start: "14:00", end: "15:30" },
          ];

          for (const block of timeBlocks) {
            const session = await storage.createSessionBlock({
              date: dateString,
              startTime: block.start,
              endTime: block.end,
              loadIntervalMin: template.interval_min || 90,
              blockCapacityHint: 8,
            });
            sessions.push(session);
          }
        }
        
        startDate.setDate(startDate.getDate() + 1);
      }
      
      res.json({ sessions, count: sessions.length });
    } catch (error) {
      console.error("Materialize sessions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Attendance routes
  app.post("/api/attendance", authenticateToken, requireRole(["mentee"]), async (req, res) => {
    try {
      const menteeData = await storage.getMenteeById(req.user!.id);
      if (!menteeData) {
        return res.status(400).json({ message: "Mentee profile not found" });
      }

      // Get the session block to find the mentor
      const sessionBlock = await storage.getSessionBlockById(req.body.session_block_id);
      if (!sessionBlock) {
        return res.status(404).json({ message: "Session block not found" });
      }

      // Create attendance request
      const request = await storage.createAttendanceRequest({
        menteeId: menteeData.id,
        sessionBlockId: req.body.session_block_id,
        status: "pending",
      });

      // Also create an assignment for the mentor to see
      // Get the session block to find the mentor
      try {
        const sessionBlock = await storage.getSessionBlockById(req.body.session_block_id);
        if (sessionBlock && sessionBlock.mentorId) {
          await storage.createAssignment({
            sessionBlockId: req.body.session_block_id,
            menteeId: menteeData.id,
            mentorId: sessionBlock.mentorId,
            status: "pending",
          });
        }
      } catch (assignmentError) {
        console.error("Assignment creation error:", assignmentError);
        // Continue even if assignment creation fails
      }

      res.json(request);
    } catch (error) {
      console.error("Create attendance error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Session block routes
  app.post("/api/session-blocks", authenticateToken, requireRole(["mentor", "admin"]), async (req: AuthRequest, res) => {
    try {
      // Set the mentorId to the current user for mentors
      const sessionBlockData = {
        ...req.body,
        mentorId: req.user!.role === 'mentor' ? req.user!.id : req.body.mentorId,
      };
      const sessionBlock = await storage.createSessionBlock(sessionBlockData);
      res.json(sessionBlock);
    } catch (error) {
      console.error("Create session block error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/session-blocks/:id", authenticateToken, requireRole(["mentor", "admin"]), async (req: AuthRequest, res) => {
    try {
      const sessionBlock = await storage.getSessionBlockById(req.params.id);
      if (!sessionBlock) {
        return res.status(404).json({ message: "Session block not found" });
      }
      if (req.user!.role === 'mentor' && sessionBlock.mentorId !== req.user!.id) {
        return res.status(403).json({ message: "You can only update your own session blocks" });
      }
      const updatedSessionBlock = await storage.updateSessionBlock(req.params.id, req.body);
      res.json(updatedSessionBlock);
    } catch (error) {
      console.error("Update session block error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/session-blocks/:id", authenticateToken, requireRole(["mentor", "admin"]), async (req: AuthRequest, res) => {
    try {
      // Check if the session block belongs to the mentor
      const sessionBlock = await storage.getSessionBlockById(req.params.id);
      if (!sessionBlock) {
        return res.status(404).json({ message: "Session block not found" });
      }
      
      if (req.user!.role === 'mentor' && sessionBlock.mentorId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own session blocks" });
      }
      
      // Delete any related assignments and attendance requests first
      await storage.deleteSessionBlockRelatedData(req.params.id);
      await storage.deleteSessionBlock(req.params.id);
      
      res.json({ message: "Session block deleted successfully" });
    } catch (error) {
      console.error("Delete session block error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/session-blocks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const startDate = req.query.startDate as string || new Date().toISOString().split('T')[0];
      const endDate = req.query.endDate as string || startDate;
      
      let sessionBlocks;
      
      // If user is a mentor, show only their session blocks with assignments
      if (req.user!.role === 'mentor') {
        sessionBlocks = await storage.getSessionBlocksByMentorAndDate(req.user!.id, startDate, endDate);
        const sessionBlocksWithAssignments = await Promise.all(sessionBlocks.map(async (block) => {
          const assignments = await storage.getAssignmentsWithDetails(block.id);
          const mentees = assignments.map(a => a.mentee);
          const suggestedExercises = await suggestionService.suggestExercisesForMentees(mentees);
          return {
            ...block,
            mentorName: req.user!.email || "You",
            mentorId: req.user!.id,
            assignments,
            suggestedExercises,
          };
        }));
        res.json(sessionBlocksWithAssignments);
      } else {
        // For mentees/admins, show all session blocks with mentor info
        sessionBlocks = await storage.getSessionBlocksByDateRange(startDate, endDate);
        
        try {
          const mentorsWithUsers = await storage.getMentorsWithUsers();
          const sessionBlocksWithMentors = sessionBlocks.map((block) => {
            // Find the mentor for this specific block
            const mentor = mentorsWithUsers.find(m => m.id === block.mentorId);
            return {
              ...block,
              mentorName: mentor?.user?.email || "Unknown Mentor",
              mentorId: block.mentorId,
            };
          });
          res.json(sessionBlocksWithMentors);
        } catch (mentorError) {
          console.error("Mentor fetch error:", mentorError);
          res.json(sessionBlocks);
        }
      }
    } catch (error) {
      console.error("Get session blocks error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/assignments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      let assignments;
      
      if (req.user!.role === 'mentor') {
        assignments = await storage.getAssignmentsByMentorId(userId);
      } else if (req.user!.role === 'mentee') {
        assignments = await storage.getAssignmentsByMenteeId(userId);
      } else {
        assignments = await storage.getAssignmentsWithDetails();
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("Get assignments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/assignments/:id/status", authenticateToken, requireRole(["mentor", "admin"]), async (req: AuthRequest, res) => {
    try {
      const assignment = await storage.updateAssignmentStatus(req.params.id, req.body.status);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Update assignment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  app.post("/api/assignments/:id/confirm", authenticateToken, requireRole(["mentor"]), async (req, res) => {
    try {
      const assignment = await storage.updateAssignmentStatus(req.params.id, "confirmed");
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Confirm assignment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/assignments/:id/decline", authenticateToken, requireRole(["mentor"]), async (req, res) => {
    try {
      const assignment = await storage.updateAssignmentStatus(req.params.id, "declined");
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Decline assignment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Progression routes
  app.get("/api/progression/steps", authenticateToken, async (req, res) => {
    try {
      const category = req.query.category as string;
      const steps = await storage.getProgressionSteps();
      
      const filteredSteps = category 
        ? steps.filter(step => step.category === category)
        : steps;
      
      res.json(filteredSteps);
    } catch (error) {
      console.error("Get progression steps error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/progression/:step_id/complete", authenticateToken, requireRole(["mentor"]), async (req, res) => {
    try {
      const completion = await storage.createStepCompletion({
        menteeId: req.body.mentee_id,
        stepId: req.params.step_id,
        mentorId: req.user!.id,
        evidenceUrl: req.body.evidence_url,
        notes: req.body.notes,
      });
      res.json(completion);
    } catch (error) {
      console.error("Create step completion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Jump log routes
  app.post("/api/jumps", authenticateToken, async (req, res) => {
    try {
      const jumpLog = await storage.createJumpLog({
        ...req.body,
        menteeId: req.body.mentee_id || req.user!.id,
      });
      res.json(jumpLog);
    } catch (error) {
      console.error("Create jump log error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/mentor/:id", authenticateToken, requireRole(["mentor"]), async (req: AuthRequest, res) => {
    try {
      const mentorId = req.params.id;
      
      // Verify the mentor is requesting their own dashboard
      if (req.user!.id !== mentorId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get pending assignments with session and mentee details
      const assignments = await storage.getAssignmentsWithDetailsByMentorId(mentorId);
      const pendingAssignments = assignments.filter(a => a.assignment.status === 'pending');
      
      // Get upcoming sessions (confirmed assignments)
      const upcomingSessions = assignments.filter(a => a.assignment.status === 'confirmed');
      
      const dashboardData = {
        pendingAssignments,
        upcomingSessions,
        stats: {
          activeMentees: pendingAssignments.length,
          completedSessions: assignments.filter(a => a.assignment.status === 'confirmed').length,
          avgRating: 4.8,
          totalHours: assignments.length * 2
        }
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Mentor dashboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/mentee", authenticateToken, requireRole(["mentee"]), async (req: AuthRequest, res) => {
    try {
      const menteeId = req.user!.id;
      
      // Get mentee's assignments
      const assignments = await storage.getAssignmentsByMenteeId(menteeId);
      const upcomingSessions = assignments.filter(a => a.status === 'confirmed');
      
      // Get progression steps
      const allSteps = await storage.getProgressionSteps();
      const completedSteps = await storage.getStepCompletionsByMenteeId(menteeId);
      
      const dashboardData = {
        upcomingSessions,
        progression: {
          completedSteps: completedSteps.length,
          totalSteps: allSteps.length,
          progress: allSteps.length > 0 ? Math.round((completedSteps.length / allSteps.length) * 100) : 0
        },
        awards: [] // Placeholder for now
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Mentee dashboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/admin", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const dashboardData = {
        weeklyBlocks: [],
        recentAssignments: [],
        metrics: {
          totalMentors: 0,
          totalMentees: 0,
          activeAssignments: 0,
          completionRate: 85
        },
        userCounts: {
          mentors: 0,
          mentees: 0,
          admins: 0
        }
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Progression routes
  app.get("/api/progression-steps", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const steps = await storage.getProgressionSteps();
      res.json(steps);
    } catch (error) {
      console.error("Get progression steps error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/step-completions/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const completions = await storage.getStepCompletionsByUserId(req.params.userId);
      res.json(completions);
    } catch (error) {
      console.error("Get step completions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/step-completions", authenticateToken, requireRole(["mentor", "admin"]), async (req: AuthRequest, res) => {
    try {
      const mentorData = await storage.getMentorById(req.user!.id);
      if (!mentorData) {
        return res.status(400).json({ message: "Mentor profile not found" });
      }

      const completion = await storage.createStepCompletion({
        ...req.body,
        mentorId: mentorData.id,
      });
      res.json(completion);
    } catch (error) {
      console.error("Create step completion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/badges", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/awards/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const awards = await storage.getAwardsByUserId(req.params.userId);
      res.json(awards);
    } catch (error) {
      console.error("Get awards error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management routes
  app.get("/api/users", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/mentors", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const mentors = await storage.getAllMentors();
      res.json(mentors);
    } catch (error) {
      console.error("Get mentors error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/mentees", authenticateToken, requireRole(["admin", "mentor"]), async (req: AuthRequest, res) => {
    try {
      const mentees = await storage.getAllMentees();
      res.json(mentees);
    } catch (error) {
      console.error("Get mentees error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Availability routes - Add these missing routes
  app.post("/api/availability", authenticateToken, requireRole(["mentor"]), async (req: AuthRequest, res) => {
    try {
      const mentorData = await storage.getMentorById(req.user!.id);
      if (!mentorData) {
        return res.status(400).json({ message: "Mentor profile not found" });
      }

      const availability = await storage.createAvailability({
        ...req.body,
        mentorId: mentorData.id,
      });
      res.json(availability);
    } catch (error) {
      console.error("Create availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/availability/:id", authenticateToken, requireRole(["mentor"]), async (req: AuthRequest, res) => {
    try {
      const availability = await storage.updateAvailability(req.params.id, req.body);
      res.json(availability);
    } catch (error) {
      console.error("Update availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/availability/:id", authenticateToken, requireRole(["mentor"]), async (req: AuthRequest, res) => {
    try {
      await storage.deleteAvailability(req.params.id);
      res.json({ message: "Availability deleted successfully" });
    } catch (error) {
      console.error("Delete availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assignment update routes - Add these missing routes 
  app.put("/api/assignments/:id", authenticateToken, requireRole(["mentor", "admin"]), async (req: AuthRequest, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Update assignment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/assignments/:id/status", authenticateToken, requireRole(["mentor", "admin"]), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      const assignment = await storage.updateAssignment(req.params.id, { status });
      res.json(assignment);
    } catch (error) {
      console.error("Update assignment status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/roster", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const date = req.query.date as string;
      const assignments = await storage.getAssignmentsWithDetails();
      res.json({ assignments, date });
    } catch (error) {
      console.error("Get roster error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/calendar/availability", authenticateToken, async (req, res) => {
    try {
      const year = parseInt(req.query.year as string, 10);
      const month = parseInt(req.query.month as string, 10);

      if (isNaN(year) || isNaN(month)) {
        return res.status(400).json({ message: "Invalid year or month" });
      }

      const sessionBlocks = await storage.getSessionBlocksByMonth(year, month);
      const availabilityByDay: Record<string, { totalSlots: number; filledSlots: number }> = {};

      for (const block of sessionBlocks) {
        const assignments = await storage.getAssignmentsWithDetails(block.id);
        const day = new Date(block.date!).getDate();
        if (!availabilityByDay[day]) {
          availabilityByDay[day] = { totalSlots: 0, filledSlots: 0 };
        }
        availabilityByDay[day].totalSlots += block.slots || 0;
        availabilityByDay[day].filledSlots += assignments.filter(a => a.assignment.status === 'confirmed').length;
      }

      res.json(availabilityByDay);
    } catch (error) {
      console.error("Get calendar availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
