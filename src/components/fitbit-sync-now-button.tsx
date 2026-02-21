"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SyncState = "idle" | "loading" | "success";

export function FitbitSyncNowButton() {
  const router = useRouter();
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [error, setError] = useState<string>("");

  async function runSyncNow() {
    setSyncState("loading");
    setError("");

    try {
      const response = await fetch("/api/fitbit/sync", {
        method: "POST",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSyncState("idle");
        setError(data.error ?? "Sync failed");
        return;
      }

      setSyncState("success");
      router.refresh();
    } catch {
      setSyncState("idle");
      setError("Sync failed");
    }
  }

  const label =
    syncState === "loading"
      ? "Syncing..."
      : syncState === "success"
        ? "Synced"
        : "Sync now";

  return (
    <div>
      <button
        type="button"
        onClick={runSyncNow}
        disabled={syncState === "loading"}
        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {label}
      </button>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
