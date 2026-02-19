import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type StoredFitbitAuth = {
  userId: string;
  fitbitUserId: string;
  scope: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredWorkout = {
  userId: string;
  fitbitLogId: string;
  startTime: string;
  durationMs: number;
  activityName: string;
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

export async function touchAuth() {
  const auth = await prisma.fitbitAuth.findUnique({
    where: { userId: "me" },
  });

  if (!auth) {
    return null;
  }

  const updated = await prisma.fitbitAuth.update({
    where: { userId: "me" },
    data: {
      accessToken: auth.accessToken,
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
      calories: input.calories,
      steps: input.steps,
      distance: input.distance,
      rawJson: json,
      createdAt: new Date(input.createdAt),
    },
  });
}

export async function getWorkoutCount(userId: string) {
  return prisma.fitbitWorkout.count({
    where: { userId },
  });
}

export async function getLatestWorkoutCreatedAt(userId: string) {
  const latest = await prisma.fitbitWorkout.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  return latest?.createdAt ?? null;
}
