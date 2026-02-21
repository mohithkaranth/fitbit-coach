import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTrainingReminder } from "@/lib/ai/generateTrainingReminder";

export const runtime = "nodejs";

const SUBJECT_KEY = "owner";
const KIND = "training_gap";

function isAuthorized(request: Request) {
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron === "1") {
    return true;
  }

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

function getGapDays(now: Date, at: Date | null) {
  if (!at) return Number.POSITIVE_INFINITY;

  return (now.getTime() - at.getTime()) / (1000 * 60 * 60 * 24);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayKey = getSingaporeDayKey(now);

  const [lastStrengthLikeWorkout, lastCardioWorkout, latestQualifyingWorkout] = await Promise.all([
    prisma.fitbitWorkout.findFirst({
      where: {
        category: {
          in: ["strength", "bootcamp"],
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
    prisma.fitbitWorkout.findFirst({
      where: {
        category: "cardio",
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
    prisma.fitbitWorkout.findFirst({
      where: {
        category: {
          in: ["strength", "bootcamp", "cardio"],
        },
      },
      orderBy: {
        startTime: "desc",
      },
      select: {
        startTime: true,
      },
    }),
  ]);

  const strengthGapDays = getGapDays(now, lastStrengthLikeWorkout?.startTime ?? null);
  const cardioGapDays = getGapDays(now, lastCardioWorkout?.startTime ?? null);

  const shouldTriggerStrength = !lastStrengthLikeWorkout || strengthGapDays >= 3;
  const shouldTriggerCardio = !lastCardioWorkout || cardioGapDays >= 2;

  let resolvedReminderCount = 0;

  if (latestQualifyingWorkout) {
    const resolved = await prisma.reminder.updateMany({
      where: {
        subjectKey: SUBJECT_KEY,
        kind: KIND,
        status: "pending",
        createdAt: {
          lte: latestQualifyingWorkout.startTime,
        },
      },
      data: {
        status: "resolved",
      },
    });

    resolvedReminderCount = resolved.count;
  }

  if (!shouldTriggerStrength && !shouldTriggerCardio) {
    console.info("[training-check] Skipping reminder: latest strength/cardio is recent enough", {
      lastStrengthAt: lastStrengthLikeWorkout?.startTime.toISOString() ?? null,
      lastCardioAt: lastCardioWorkout?.startTime.toISOString() ?? null,
      strengthGapDays,
      cardioGapDays,
      createdReminder: false,
      resolvedReminderCount,
    });

    return NextResponse.json({
      ok: true,
      created: false,
      reason: "strength_and_cardio_recent_enough",
      dayKey,
      lastStrengthAt: lastStrengthLikeWorkout?.startTime.toISOString() ?? null,
      lastCardioAt: lastCardioWorkout?.startTime.toISOString() ?? null,
      strengthGapDays,
      cardioGapDays,
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
      lastStrengthAt: lastStrengthLikeWorkout?.startTime.toISOString() ?? null,
      lastCardioAt: lastCardioWorkout?.startTime.toISOString() ?? null,
      strengthGapDays,
      cardioGapDays,
      createdReminder: false,
      resolvedReminderCount,
    });

    return NextResponse.json({
      ok: true,
      created: false,
      reason: "already_created_for_day",
      reminderId: existing.id,
      dayKey,
      lastStrengthAt: lastStrengthLikeWorkout?.startTime.toISOString() ?? null,
      lastCardioAt: lastCardioWorkout?.startTime.toISOString() ?? null,
      strengthGapDays,
      cardioGapDays,
    });
  }

  const reminder = await prisma.reminder.create({
    data: {
      subjectKey: SUBJECT_KEY,
      kind: KIND,
      status: "pending",
      reason: "strength_or_cardio_gap",
      dayKey,
    },
  });

  const mostRecentWorkout =
    !lastCardioWorkout ||
    (lastStrengthLikeWorkout &&
      lastStrengthLikeWorkout.startTime.getTime() >= lastCardioWorkout.startTime.getTime())
      ? lastStrengthLikeWorkout
      : lastCardioWorkout;

  const message = await generateTrainingReminder({
    lastWorkout: mostRecentWorkout
      ? {
          name: mostRecentWorkout.activityName,
          Category: mostRecentWorkout.category ?? "other",
          startTime: mostRecentWorkout.startTime,
        }
      : null,
    hoursSinceLast: mostRecentWorkout
      ? (now.getTime() - mostRecentWorkout.startTime.getTime()) / (1000 * 60 * 60)
      : Number.POSITIVE_INFINITY,
  });

  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { message },
  });

  console.info("[training-check] Created reminder: strength/cardio gap threshold reached", {
    reminderId: reminder.id,
    lastStrengthAt: lastStrengthLikeWorkout?.startTime.toISOString() ?? null,
    lastCardioAt: lastCardioWorkout?.startTime.toISOString() ?? null,
    strengthGapDays,
    cardioGapDays,
    createdReminder: true,
    resolvedReminderCount,
  });

  return NextResponse.json({
    ok: true,
    created: true,
    reminderId: reminder.id,
    dayKey,
    lastStrengthAt: lastStrengthLikeWorkout?.startTime.toISOString() ?? null,
    lastCardioAt: lastCardioWorkout?.startTime.toISOString() ?? null,
    strengthGapDays,
    cardioGapDays,
  });
}
