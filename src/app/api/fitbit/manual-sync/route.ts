import { NextResponse } from "next/server";
import { FITBIT_USER_ID } from "@/lib/fitbit";
import { runFitbitSync } from "@/lib/fitbitSync";
import { getAuth, getSyncRunCountInRange } from "@/lib/store";
import { getNextStartOfSingaporeDay, getStartOfSingaporeDay } from "@/lib/time";

export const runtime = "nodejs";

const DAILY_SYNC_LIMIT = 5;

export async function POST() {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "Fitbit is not connected" }, { status: 400 });
  }

  try {
    const now = new Date();
    const startOfTodaySgt = getStartOfSingaporeDay(now);
    const startOfTomorrowSgt = getNextStartOfSingaporeDay(now);

    const syncCountToday = await getSyncRunCountInRange({
      userId: FITBIT_USER_ID,
      from: startOfTodaySgt,
      to: startOfTomorrowSgt,
    });

    if (syncCountToday >= DAILY_SYNC_LIMIT) {
      return NextResponse.json(
        { error: "Daily sync limit reached (5/day)" },
        { status: 429 },
      );
    }

    const result = await runFitbitSync();
    return NextResponse.json({
      ok: true,
      syncedWorkouts: result.synced,
      syncedAt: result.ranAt.toISOString(),
      syncCountToday: syncCountToday + 1,
    });
  } catch (error) {
    console.error("Fitbit manual sync failed", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
