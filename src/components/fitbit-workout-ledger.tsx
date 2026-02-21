"use client";

import { useMemo, useState } from "react";

type WorkoutLedgerItem = {
  id: string;
  startTime: string;
  activityName: string;
  category: "strength" | "cardio" | "walk" | "other";
  durationMs: number;
  calories: number | null;
};

type SortBy = "date" | "calories";
type SortDirection = "asc" | "desc";
type TypeFilter = "all" | "cardio" | "strength" | "other";

function toDisplayType(category: WorkoutLedgerItem["category"]) {
  if (category === "cardio") return "Cardio";
  if (category === "strength") return "Strength";
  return "Other";
}

function toFilterType(category: WorkoutLedgerItem["category"]): Exclude<TypeFilter, "all"> {
  if (category === "cardio") return "cardio";
  if (category === "strength") return "strength";
  return "other";
}

function toCategoryLabel(category: WorkoutLedgerItem["category"]) {
  if (category === "walk") return "Walk";
  if (category === "strength") return "Strength";
  if (category === "cardio") return "Cardio";
  return "Other";
}

export function FitbitWorkoutLedger({ workouts }: { workouts: WorkoutLedgerItem[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-SG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Singapore",
      }),
    [],
  );

  const filteredAndSorted = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = workouts.filter((workout) => {
      if (
        normalizedSearch.length > 0 &&
        !workout.activityName.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (typeFilter !== "all" && toFilterType(workout.category) !== typeFilter) {
        return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const aTime = new Date(a.startTime).getTime();
        const bTime = new Date(b.startTime).getTime();
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      const aCalories = a.calories ?? -1;
      const bCalories = b.calories ?? -1;
      return sortDirection === "asc" ? aCalories - bCalories : bCalories - aCalories;
    });

    return sorted;
  }, [search, sortBy, sortDirection, typeFilter, workouts]);

  const summary = useMemo(() => {
    let cardio = 0;
    let strength = 0;
    let other = 0;

    for (const workout of workouts) {
      if (workout.category === "cardio") {
        cardio += 1;
      } else if (workout.category === "strength") {
        strength += 1;
      } else {
        other += 1;
      }
    }

    return {
      total: workouts.length,
      cardio,
      strength,
      other,
    };
  }, [workouts]);

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">
        Total {summary.total} • Cardio {summary.cardio} • Strength {summary.strength} • Other{" "}
        {summary.other}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Search</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Workout name"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Type</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          >
            <option value="all">All</option>
            <option value="cardio">Cardio</option>
            <option value="strength">Strength</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          >
            <option value="date">Date</option>
            <option value="calories">Calories</option>
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Direction</span>
          <select
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as SortDirection)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-sky-100">
        <table className="min-w-full divide-y divide-sky-100 text-sm">
          <thead className="bg-sky-50/60 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Date/Time</th>
              <th className="px-4 py-3 font-semibold">Workout Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Duration (mins)</th>
              <th className="px-4 py-3 font-semibold">Calories</th>
              <th className="px-4 py-3 font-semibold">Cardio Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={7}>
                  No workouts found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((workout) => (
                <tr key={workout.id}>
                  <td className="px-4 py-3">{formatter.format(new Date(workout.startTime))}</td>
                  <td className="px-4 py-3 text-slate-900">{workout.activityName}</td>
                  <td className="px-4 py-3">{toDisplayType(workout.category)}</td>
                  <td className="px-4 py-3">{toCategoryLabel(workout.category)}</td>
                  <td className="px-4 py-3">{Math.round(workout.durationMs / 60000)}</td>
                  <td className="px-4 py-3">{workout.calories ?? "-"}</td>
                  <td className="px-4 py-3">Not available</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
