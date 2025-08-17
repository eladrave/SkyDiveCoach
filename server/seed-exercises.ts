import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seedExercises() {
  console.log("Seeding exercises...");

  const exercises = [
    { title: "2-way: Center Point Turns", description: "Practice turning around a center point with a partner.", category: "2way" },
    { title: "2-way: Side-body to Side-body", description: "Practice moving from a side-body to a side-body formation.", category: "2way" },
    { title: "3-way: Star Formation", description: "Practice forming a star formation with two partners.", category: "3way" },
    { title: "3-way: Compressed Accordion", description: "Practice the compressed accordion maneuver.", category: "3way" },
    { title: "4-way: Diamond Formation", description: "Practice forming a diamond formation.", category: "4way" },
    { title: "Canopy: Accuracy Landing", description: "Practice landing accurately in a designated area.", category: "canopy" },
    { title: "Safety: Emergency Procedures Review", description: "Review and practice emergency procedures.", category: "safety" },
  ];

  for (const exercise of exercises) {
    await db.insert(schema.exercises).values(exercise).onConflictDoNothing();
  }

  console.log("Exercises seeded successfully.");
  process.exit(0);
}

seedExercises().catch((err) => {
  console.error("Failed to seed exercises:", err);
  process.exit(1);
});
