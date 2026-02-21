import { NextResponse } from "next/server";
import {
  computeExpiryDate,
  FITBIT_USER_ID,
  listFitbitActivitiesPage,
  refreshFitbitToken,
} from "@/lib/fitbit";
import { classifyWorkout } from "@/lib/classifyWorkout";
import { getAuth, touchAuth, upsertAuth, upsertWorkout } from "@/lib/store";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  // Allow Vercel Cron (it always sends this header)
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  // Otherwise require secret for manual hits
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
  return scheme?.toLowerCase() === "bearer" && token === cronSecret;
}

// Vercel cron requests include this header.
function isVercelCron(request: Request) {
  return request.headers.get("x-vercel-cron") === "1";
}

async function ensureValidAccessToken() {
  const auth = await getAuth();

  if (!auth) {
    throw new Error("Fitbit is not connected");
  }

  if (new Date(auth.expiresAt).getTime() > Date.now() + 30_000) {
    return auth;
  }

  const refreshed = await refreshFitbitToken(auth.refreshToken);

  return upsertAuth({
    userId: FITBIT_USER_ID,
    fitbitUserId: refreshed.user_id,
    scope: refreshed.scope,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: computeExpiryDate(refreshed.expires_in),
  });
}

function parseActivityDate(activity: Record<string, unknown>) {
  const originalStart = activity.originalStartTime;
  if (typeof originalStart === "string") {
    return new Date(originalStart);
  }

  const startTime = activity.startTime;
  if (typeof startTime === "string") {
    return new Date(startTime);
  }

  return new Date();
}

function parseDistance(activity: Record<string, unknown>) {
  const distanceValue = activity.distance;
  if (typeof distanceValue === "number") {
    return distanceValue;
  }

  if (Array.isArray(distanceValue) && distanceValue.length > 0) {
    const first = distanceValue[0] as { distance?: unknown };
    if (typeof first.distance === "number") {
      return first.distance;
    }
  }

  return null;
}

async function syncActivities(accessToken: string) {
  const afterDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
    .toISOString()
    .slice(0, 10);

  let synced = 0;
  let offset = 0;

  while (true) {
    const page = await listFitbitActivitiesPage({
      accessToken,
      afterDate,
      offset,
      limit: 100,
    });

    if (page.status === 401) {
      return { unauthorized: true as const, synced };
    }

    if (!page.body) {
      throw new Error(
        `Failed to fetch Fitbit activities with status ${page.status}`
      );
    }

    const activities = page.body.activities || [];

    for (const activity of activities) {
      const logId = activity.logId;
      if (typeof logId !== "number" && typeof logId !== "string") {
        continue;
      }

      const duration = activity.duration;
      const activityName = activity.activityName;

      const parsedActivityName =
        typeof activityName === "string" ? activityName : "Workout";
      const classification = classifyWorkout(parsedActivityName);

      await upsertWorkout({
        userId: FITBIT_USER_ID,
        fitbitLogId: String(logId),
        startTime: parseActivityDate(activity).toISOString(),
        durationMs: typeof duration === "number" ? duration : 0,
        activityName: parsedActivityName,
        category: classification.category,
        isTraining: classification.isTraining,
        calories: typeof activity.calories === "number" ? activity.calories : null,
        steps: typeof activity.steps === "number" ? activity.steps : null,
        distance: parseDistance(activity),
        rawJson: activity,
        createdAt: new Date().toISOString(),
      });

      synced += 1;
    }

    if (activities.length < 100) {
      break;
    }

    offset += activities.length;
  }

  return { unauthorized: false as const, synced };
}

async function handleSync(request: Request) {
  const cron = isVercelCron(request);

  console.log("[fitbit/sync] HIT", {
    isCron: cron,
    utc: new Date().toISOString(),
  });

  // IMPORTANT:
  // - Cron will call via GET (and will include x-vercel-cron: 1)
  // - We still require your CRON_SECRET (either x-cron-secret OR Bearer token) to prevent public abuse
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let auth = await ensureValidAccessToken();
    let result = await syncActivities(auth.accessToken);

    if (result.unauthorized) {
      const refreshed = await refreshFitbitToken(auth.refreshToken);
      auth = await upsertAuth({
        userId: FITBIT_USER_ID,
        fitbitUserId: refreshed.user_id,
        scope: refreshed.scope,
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: computeExpiryDate(refreshed.expires_in),
      });

      result = await syncActivities(auth.accessToken);
      if (result.unauthorized) {
        return NextResponse.json(
          { error: "Fitbit unauthorized after retry" },
          { status: 502 }
        );
      }
    }

    await touchAuth();

    console.log(`Fitbit sync complete. Workouts synced: ${result.synced}`);

    return NextResponse.json({ ok: true, syncedWorkouts: result.synced });
  } catch (error) {
    console.error("Fitbit sync failed", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}