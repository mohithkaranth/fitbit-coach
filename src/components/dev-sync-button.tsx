"use client";

import { useState } from "react";

export function DevSyncButton() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function runSyncNow() {
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/fitbit/manual-sync", {
        method: "POST",
      });

      const data = (await response.json()) as { syncedWorkouts?: number; error?: string };

      if (!response.ok) {
        setStatus(data.error || "Sync failed");
      } else {
        setStatus(`Synced ${data.syncedWorkouts ?? 0} workouts`);
      }
    } catch {
      setStatus("Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={runSyncNow}
        disabled={loading}
        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Syncing..." : "Run Sync Now"}
      </button>
      {status ? <p className="mt-2 text-sm text-amber-900">{status}</p> : null}
    </div>
  );
}
