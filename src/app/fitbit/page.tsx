export const dynamic = "force-dynamic";

import Link from "next/link";
import { DevSyncButton } from "@/components/dev-sync-button";
import { FITBIT_USER_ID } from "@/lib/fitbit";
import { prisma } from "@/lib/prisma";
import {
  getAuth,
  getLatestWorkoutCreatedAt,
  getWorkoutCategoryCounts,
  getWorkoutCount,
} from "@/lib/store";

export default async function FitbitPage() {
  const [auth, workoutCount, workoutCategoryCounts, latestWorkout, syncState] =
    await Promise.all([
      getAuth(),
      getWorkoutCount(FITBIT_USER_ID),
      getWorkoutCategoryCounts(FITBIT_USER_ID),
      getLatestWorkoutCreatedAt(FITBIT_USER_ID),
      prisma.fitbitSyncState.findUnique({
        where: { userId: FITBIT_USER_ID },
      }),
    ]);

  const connected = Boolean(auth);

  // ✅ Correct source of truth: actual sync completion time
  const lastSync = syncState?.lastSyncedAt ?? null;

  // (Optional: keep this around if you later want to show "Last Workout")
  // const lastWorkout = latestWorkout ?? null;

  const showDevSyncButton =
    process.env.NODE_ENV === "development" && Boolean(process.env.CRON_SECRET);

  const formatter = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            Fitbit Integration
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Fitbit Sync Dashboard
          </h1>
          <p className="text-slate-600">
            Connect Fitbit, sync workouts into your coach database, and keep
            activity data fresh.
          </p>
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-sky-700 transition hover:text-sky-800"
          >
            ← Back to Home
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Connection</p>
            <p
              className={`mt-2 text-lg font-semibold ${
                connected ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {connected ? "Connected" : "Not connected"}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Workouts</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {workoutCount}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Last Sync</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {lastSync ? formatter.format(lastSync) : "Never"}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Workout categories
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              Strength workouts:{" "}
              <span className="font-semibold text-slate-900">
                {workoutCategoryCounts.strength}
              </span>
            </p>
            <p>
              Cardio workouts:{" "}
              <span className="font-semibold text-slate-900">
                {workoutCategoryCounts.cardio}
              </span>
            </p>
            <p>
              Walks (ignored):{" "}
              <span className="font-semibold text-slate-900">
                {workoutCategoryCounts.walk}
              </span>
            </p>
            <p>
              Other:{" "}
              <span className="font-semibold text-slate-900">
                {workoutCategoryCounts.other}
              </span>
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
          <p className="mt-1 text-sm text-slate-600">
            {connected
              ? "Auto-sync runs daily at 7:00am. We refresh only when data is stale."
              : "Authorize Fitbit to connect your account and enable daily sync."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {connected ? (
              <form action="/api/fitbit/disconnect" method="post">
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
                >
                  Disconnect Fitbit
                </button>
              </form>
            ) : (
              <Link
                href="/api/fitbit/auth"
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
              >
                Connect Fitbit
              </Link>
            )}
          </div>
          {showDevSyncButton ? (
            <DevSyncButton cronSecret={process.env.CRON_SECRET!} />
          ) : null}
        </section>
      </div>
    </div>
  );
}
