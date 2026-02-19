export type WorkoutCategory = "strength" | "cardio" | "walk" | "other";

const WALK_KEYWORDS = ["walk"];
const STRENGTH_KEYWORDS = ["bootcamp", "core", "strength", "weights", "weight", "resistance", "circuit"];
const CARDIO_KEYWORDS = ["run", "bike", "spinning", "elliptical", "row", "swim", "hiit", "cardio"];

function containsKeyword(activityName: string, keywords: string[]) {
  return keywords.some((keyword) => activityName.includes(keyword));
}

export function classifyWorkout(activityName: string): { category: WorkoutCategory; isTraining: boolean } {
  const normalizedName = activityName.toLowerCase();

  if (containsKeyword(normalizedName, WALK_KEYWORDS)) {
    return { category: "walk", isTraining: false };
  }

  if (containsKeyword(normalizedName, STRENGTH_KEYWORDS)) {
    return { category: "strength", isTraining: true };
  }

  if (containsKeyword(normalizedName, CARDIO_KEYWORDS)) {
    return { category: "cardio", isTraining: true };
  }

  return { category: "other", isTraining: false };
}
