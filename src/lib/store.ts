import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { WorkoutCategory } from "@/lib/classifyWorkout";

export type StoredFitbitAuth = {
  userId: string;
  fitbitUserId: string;
  scope: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredWorkout = {
  userId: string;
  fitbitLogId: string;
  startTime: string;
  durationMs: number;
  activityName: string;
  category: WorkoutCategory;
  isTraining: boolean;
  calories: number | null;
  steps: number | null;
  distance: number | null;
  rawJson: Record<string, unknown>;
  createdAt: string;
};

function mapAuth(auth: {
  userId: string;
  fitbitUserId: string;
  scope: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): StoredFitbitAuth {
  return {
    userId: auth.userId,
    fitbitUserId: auth.fitbitUserId,
    scope: auth.scope,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt: auth.expiresAt.toISOString(),
    lastSyncedAt: auth.lastSyncedAt?.toISOString() ?? null,
    createdAt: auth.createdAt.toISOString(),
    updatedAt: auth.updatedAt.toISOString(),
  };
}

export async function getAuth() {
  const auth = await prisma.fitbitAuth.findUnique({
    where: { userId: "me" },
  });

  return auth ? mapAuth(auth) : null;
}

export async function upsertAuth(input: {
  userId: string;
  fitbitUserId: string;
  scope: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}) {
  const auth = await prisma.fitbitAuth.upsert({
    where: { userId: input.userId },
    update: {
      fitbitUserId: input.fitbitUserId,
      scope: input.scope,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: input.expiresAt,
    },
    create: {
      userId: input.userId,
      fitbitUserId: input.fitbitUserId,
      scope: input.scope,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: input.expiresAt,
    },
  });

  return mapAuth(auth);
}

export async function markAuthSynced(at: Date) {
  const auth = await prisma.fitbitAuth.findUnique({
    where: { userId: "me" },
  });

  if (!auth) {
    return null;
  }

  const updated = await prisma.fitbitAuth.update({
    where: { userId: "me" },
    data: {
      lastSyncedAt: at,
    },
  });

  return mapAuth(updated);
}

export async function upsertWorkout(input: StoredWorkout) {
  const json = input.rawJson as Prisma.InputJsonValue;

  await prisma.fitbitWorkout.upsert({
    where: { fitbitLogId: input.fitbitLogId },
    update: {
      userId: input.userId,
      startTime: new Date(input.startTime),
      durationMs: input.durationMs,
      activityName: input.activityName,
      category: input.category,
      isTraining: input.isTraining,
      calories: input.calories,
      steps: input.steps,
      distance: input.distance,
      rawJson: json,
    },
    create: {
      userId: input.userId,
      fitbitLogId: input.fitbitLogId,
      startTime: new Date(input.startTime),
      durationMs: input.durationMs,
      activityName: input.activityName,
      category: input.category,
      isTraining: input.isTraining,
      calories: input.calories,
      steps: input.steps,
      distance: input.distance,
      rawJson: json,
      createdAt: new Date(input.createdAt),
    },
  });
}

export async function createSyncRun(input: { userId: string; ranAt: Date }) {
  return prisma.syncRun.create({
    data: {
      userId: input.userId,
      ranAt: input.ranAt,
    },
  });
}

export async function getSyncRunCountInRange(input: {
  userId: string;
  from: Date;
  to: Date;
}) {
  return prisma.syncRun.count({
    where: {
      userId: input.userId,
      ranAt: {
        gte: input.from,
        lt: input.to,
      },
    },
  });
}

export async function getWorkoutCount(userId: string) {
  return prisma.fitbitWorkout.count({
    where: { userId },
  });
}

export async function getWorkoutCategoryCounts(userId: string): Promise<
  Record<WorkoutCategory, number>
> {
  const grouped = await prisma.fitbitWorkout.groupBy({
    by: ["category"],
    where: { userId },
    _count: { _all: true },
  });

  const counts: Record<WorkoutCategory, number> = {
    strength: 0,
    cardio: 0,
    walk: 0,
    other: 0,
  };

  for (const item of grouped) {
    if (
      item.category === "strength" ||
      item.category === "cardio" ||
      item.category === "walk" ||
      item.category === "other"
    ) {
      counts[item.category] = item._count._all;
    }
  }

  return counts;
}

export async function getLatestWorkoutCreatedAt(userId: string) {
  const latest = await prisma.fitbitWorkout.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  return latest?.createdAt ?? null;
}
