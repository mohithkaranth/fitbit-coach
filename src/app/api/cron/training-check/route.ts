import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTrainingReminder } from "@/lib/ai/generateTrainingReminder";

export const runtime = "nodejs";

const SUBJECT_KEY = "owner";
const KIND = "training_gap";

function isAuthorized(request: Request) {
  // Allow Vercel Cron
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron === "1") {
    return true;
  }

  // Allow manual/dev triggers
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const [scheme, token] = authHeader.split(" ");
  return scheme.toLowerCase() === "bearer" && token === cronSecret;
}

function getSingaporeDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayKey = getSingaporeDayKey(now);
  const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [lastWorkout, anyWorkoutInWindowCount, strengthWorkoutInWindowCount] =
    await Promise.all([
      prisma.fitbitWorkout.findFirst({
        where: {
          category: {
            in: ["strength", "cardio"],
          },
        },
        orderBy: {
          startTime: "desc",
        },
        select: {
          activityName: true,
          category: true,
          startTime: true,
        },
      }),
      prisma.fitbitWorkout.count({
        where: {
          startTime: {
            gte: windowStart,
          },
          OR: [
            { isTraining: true },
            {
              category: {
                in: ["cardio", "strength"],
              },
            },
          ],
        },
      }),
      prisma.fitbitWorkout.count({
        where: {
          startTime: {
            gte: windowStart,
          },
          category: "strength",
        },
      }),
    ]);

  const anyWorkoutInWindow = anyWorkoutInWindowCount > 0;
  const strengthWorkoutInWindow = strengthWorkoutInWindowCount > 0;

  const hoursSinceLast = lastWorkout
    ? (now.getTime() - lastWorkout.startTime.getTime()) / (1000 * 60 * 60)
    : Number.POSITIVE_INFINITY;

  if (anyWorkoutInWindow) {
    console.info("[training-check] Skipping reminder: workout found in 48h window", {
      anyWorkoutInWindow,
      strengthWorkoutInWindow,
    });

    return NextResponse.json({
      ok: true,
      created: false,
      reason: "recent_training_exists",
      dayKey,
      anyWorkoutInWindow,
      strengthWorkoutInWindow,
      hoursSinceLast,
    });
  }

  const existing = await prisma.reminder.findUnique({
    where: {
      subjectKey_kind_dayKey: {
        subjectKey: SUBJECT_KEY,
        kind: KIND,
        dayKey,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    console.info("[training-check] Skipping reminder: already created for day", {
      dayKey,
      reminderId: existing.id,
    });

    return NextResponse.json({
      ok: true,
      created: false,
      reason: "already_created_for_day",
      reminderId: existing.id,
      dayKey,
      anyWorkoutInWindow,
      strengthWorkoutInWindow,
    });
  }

  const reminder = await prisma.reminder.create({
    data: {
      subjectKey: SUBJECT_KEY,
      kind: KIND,
      status: "pending",
      reason: "no_strength_or_cardio_48h",
      dayKey,
    },
  });

  const message = await generateTrainingReminder({
    lastWorkout: lastWorkout
      ? {
          name: lastWorkout.activityName,
          Category: lastWorkout.category ?? "other",
          startTime: lastWorkout.startTime,
        }
      : null,
    hoursSinceLast,
  });

  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { message },
  });

  console.info("[training-check] Created reminder: no workout in 48h window", {
    reminderId: reminder.id,
    anyWorkoutInWindow,
    strengthWorkoutInWindow,
  });

  return NextResponse.json({
    ok: true,
    created: true,
    reminderId: reminder.id,
    dayKey,
    anyWorkoutInWindow,
    strengthWorkoutInWindow,
  });
}
