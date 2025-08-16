import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";
import { loginSchema, signupSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Express.Request {
  user?: User;
}

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const token = req.cookies?.token;

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
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

      const request = await storage.createAttendanceRequest({
        menteeId: menteeData.id,
        sessionBlockId: req.body.session_block_id,
        status: "pending",
      });
      res.json(request);
    } catch (error) {
      console.error("Create attendance error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assignment routes
  app.get("/api/assignments", authenticateToken, async (req, res) => {
    try {
      const userId = req.query.user_id as string || req.user!.id;
      let assignments;

      if (req.user!.role === "mentor") {
        assignments = await storage.getAssignmentsByMentorId(userId);
      } else if (req.user!.role === "mentee") {
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
  app.get("/api/dashboard/mentor", authenticateToken, requireRole(["mentor"]), async (req: AuthRequest, res) => {
    try {
      const mentorId = req.user!.id;
      
      const dashboardData = {
        pendingAssignments: [],
        upcomingSessions: [],
        stats: {
          activeMentees: 0,
          completedSessions: 0,
          avgRating: 4.8,
          totalHours: 0
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
      
      const dashboardData = {
        upcomingSessions: [],
        progression: {
          completedSteps: 0,
          totalSteps: 0,
          progress: 0
        },
        awards: []
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

  const httpServer = createServer(app);
  return httpServer;
}
