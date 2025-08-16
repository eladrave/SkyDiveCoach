import { storage } from "./storage";

export async function seedDatabase() {
  try {
    console.log("Starting database seed...");

    // Create test users
    const mentorUser = await storage.createUser({
      role: "mentor",
      name: "Alex Rodriguez",
      email: "mentor@test.com",
      phone: "+1-555-0101",
      uspaLicense: "D-12345",
      jumps: 2500,
      password: "password123"
    });

    const menteeUser = await storage.createUser({
      role: "mentee",
      name: "Sarah Johnson",
      email: "mentee@test.com",
      phone: "+1-555-0102",
      uspaLicense: "A-67890",
      jumps: 25,
      password: "password123"
    });

    const adminUser = await storage.createUser({
      role: "admin",
      name: "Mike Admin",
      email: "admin@test.com",
      phone: "+1-555-0103",
      uspaLicense: "D-54321",
      jumps: 5000,
      password: "password123"
    });

    // Create mentor profile
    await storage.createMentor({
      id: mentorUser.id,
      ratings: "AFF-I, Tandem, Coach",
      coachNumber: "C-12345",
      disciplines: ["AFF", "Tandem", "Coaching"],
      maxConcurrentMentees: 3,
      seniorityScore: 85,
      dzEndorsement: true,
    });

    // Create mentee profile
    await storage.createMentee({
      id: menteeUser.id,
      goals: "Complete AFF program and get A-license",
      comfortLevel: "medium",
      canopySize: 280,
      lastCurrencyDate: "2024-12-15",
    });

    // Create admin as mentor as well for testing
    await storage.createMentor({
      id: adminUser.id,
      ratings: "AFF-I, Tandem, Coach, Instructor Examiner",
      coachNumber: "IE-98765",
      disciplines: ["AFF", "Tandem", "Coaching", "Camera"],
      maxConcurrentMentees: 5,
      seniorityScore: 100,
      dzEndorsement: true,
    });

    console.log("Database seeded successfully!");
    console.log("Test accounts created:");
    console.log("- Mentor: mentor@test.com / password123");
    console.log("- Mentee: mentee@test.com / password123");
    console.log("- Admin: admin@test.com / password123");

    // Create sample data
    const { createSampleData } = await import("./sample-data");
    await createSampleData();

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log("Seed complete");
    process.exit(0);
  }).catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}