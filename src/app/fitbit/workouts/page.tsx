export const dynamic = "force-dynamic";

import Link from "next/link";
import { FitbitWorkoutLedger } from "@/components/fitbit-workout-ledger";
import { FITBIT_USER_ID } from "@/lib/fitbit";
import { getUtcStartOfDayDaysAgo } from "@/lib/date";
import { getWorkoutCountSince, getWorkoutsSince } from "@/lib/store";

export default async function FitbitWorkoutsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const resolvedSearchParams = searchParams ?? {};
  const range = resolvedSearchParams.range;
  const rangeValue = Array.isArray(range) ? range[0] : range;

  const days = rangeValue === "30d" ? 30 : 30;
  const from30 = getUtcStartOfDayDaysAgo(days);
  const [workoutCount30, workouts] = await Promise.all([
    getWorkoutCountSince(FITBIT_USER_ID, from30),
    getWorkoutsSince(FITBIT_USER_ID, from30),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 px-6 py-12">
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            Fitbit Integration
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Workout Ledger (30 days)</h1>
          <p className="text-slate-600">Detailed workout history for the last 30 days (UTC start-of-day).</p>
          <p className="text-sm font-medium text-slate-700">
            Workouts (last 30 days): <span className="font-semibold text-slate-900">{workoutCount30}</span>
          </p>
          <Link
            href="/fitbit"
            className="inline-flex text-sm font-medium text-sky-700 transition hover:text-sky-800"
          >
            ← Back to Fitbit Dashboard
          </Link>
        </header>

        <FitbitWorkoutLedger
          workouts={workouts.map((workout) => ({
            id: workout.id,
            startTime: workout.startTime.toISOString(),
            activityName: workout.activityName,
            category: workout.category,
            durationMs: workout.durationMs,
            calories: workout.calories,
          }))}
        />
      </main>
    </div>
  );
}
