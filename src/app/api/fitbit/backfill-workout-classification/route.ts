import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyWorkout } from "@/lib/classifyWorkout";

export const runtime = "nodejs";

const BATCH_SIZE = 200;

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === cronSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  const [scheme, token] = authHeader.split(" ");
  return scheme.toLowerCase() === "bearer" && token === cronSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let updated = 0;

    while (true) {
      const workouts = await prisma.fitbitWorkout.findMany({
        where: {
          OR: [{ category: null }, { isTraining: null }],
        },
        select: {
          id: true,
          activityName: true,
        },
        take: BATCH_SIZE,
        orderBy: { createdAt: "asc" },
      });

      if (workouts.length === 0) {
        break;
      }

      const results = await prisma.$transaction(
        workouts.map((workout) => {
          const classification = classifyWorkout(workout.activityName);
          return prisma.fitbitWorkout.update({
            where: { id: workout.id },
            data: {
              category: classification.category,
              isTraining: classification.isTraining,
            },
          });
        }),
      );

      updated += results.length;

      if (workouts.length < BATCH_SIZE) {
        break;
      }
    }

    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    console.error("Workout classification backfill failed", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
