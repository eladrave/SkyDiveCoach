import { storage } from "./storage";

export async function createSampleData() {
  try {
    console.log("Creating sample data...");

    // Create some progression steps
    const affSteps = [
      {
        code: "AFF-1",
        title: "First Solo Jump",
        description: "Complete your first solo jump with two instructors",
        category: "2way" as const,
        required: true,
        minJumpsGate: 1,
      },
      {
        code: "AFF-2", 
        title: "Canopy Control",
        description: "Demonstrate basic canopy control skills",
        category: "canopy" as const,
        required: true,
        minJumpsGate: 5,
      },
      {
        code: "AFF-3",
        title: "Stability Practice",
        description: "Maintain stable body position for 10 seconds",
        category: "2way" as const,
        required: true,
        minJumpsGate: 10,
      },
    ];

    for (const step of affSteps) {
      await storage.createProgressionStep(step);
    }

    // Create some badges
    const badges = [
      {
        code: "FIRST_JUMP",
        name: "First Jump",
        description: "Completed your first solo skydive",
        criteriaJson: { minJumps: 1 },
      },
      {
        code: "CANOPY_MASTER",
        name: "Canopy Master", 
        description: "Demonstrated excellent canopy control",
        criteriaJson: { canopyProficiency: "advanced" },
      },
    ];

    for (const badge of badges) {
      await storage.createBadge(badge);
    }

    // Create a session block for testing
    const sessionBlock = await storage.createSessionBlock({
      date: "2024-12-20",
      startTime: "09:00:00",
      endTime: "17:00:00",
      dzId: null,
      loadIntervalMin: 90,
      blockCapacityHint: 8,
    });

    // Get mentor and mentee from seed data
    const mentor = await storage.getUserByEmail("mentor@test.com");
    const mentee = await storage.getUserByEmail("mentee@test.com");

    if (mentor && mentee) {
      // Create an assignment
      await storage.createAssignment({
        sessionBlockId: sessionBlock.id,
        mentorId: mentor.id,
        menteeId: mentee.id,
        status: "pending",
      });

      // Create an attendance request
      await storage.createAttendanceRequest({
        menteeId: mentee.id,
        sessionBlockId: sessionBlock.id,
        status: "pending",
      });
    }

    console.log("Sample data created successfully!");
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}

// Run if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleData().then(() => {
    console.log("Sample data creation complete");
    process.exit(0);
  }).catch((error) => {
    console.error("Sample data creation failed:", error);
    process.exit(1);
  });
}