import { storage } from "../storage";
import type { Mentee, Exercise } from "@shared/schema";

class SuggestionService {
  async suggestExercisesForMentees(mentees: Mentee[]): Promise<Exercise[]> {
    if (mentees.length === 0) {
      return [];
    }

    const allProgressionSteps = await storage.getProgressionSteps();
    if (allProgressionSteps.length === 0) {
      return [];
    }

    let totalCompletedSteps = 0;
    for (const mentee of mentees) {
      const completions = await storage.getStepCompletionsByMenteeId(mentee.id);
      totalCompletedSteps += completions.length;
    }

    const averageCompletedSteps = totalCompletedSteps / mentees.length;

    // Find the category of the next step to be completed
    const nextStepIndex = Math.floor(averageCompletedSteps);
    if (nextStepIndex >= allProgressionSteps.length) {
      return []; // All steps completed
    }

    const nextStepCategory = allProgressionSteps[nextStepIndex].category;

    // For now, just return all exercises in that category
    const allExercises = await storage.getAllExercises();
    return allExercises.filter(exercise => exercise.category === nextStepCategory);
  }
}

export const suggestionService = new SuggestionService();
