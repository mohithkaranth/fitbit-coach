import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReminderDismissButton } from "@/components/reminder-dismiss-button";

export default async function RemindersPage() {
  const reminders = await prisma.reminder.findMany({
    where: {
      subjectKey: "owner",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-violet-50 px-6 py-20">
      <main className="mx-auto max-w-2xl rounded-3xl border border-cyan-100 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Reminders</h1>
        <p className="mt-3 text-slate-600">Your training reminder history.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Back to Home
        </Link>

        <div className="mt-6 space-y-4">
          {reminders.length === 0 ? (
            <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
              <p className="text-slate-600">No reminders yet.</p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <article
                key={reminder.id}
                className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-slate-500">
                  {new Intl.DateTimeFormat("en-SG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Singapore",
                  }).format(reminder.createdAt)}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  Status: {reminder.status}
                </p>
                <p className="mt-2 text-slate-600">
                  {reminder.message ?? "No message available for this reminder."}
                </p>
                {reminder.status === "pending" ? (
                  <div className="mt-4">
                    <ReminderDismissButton id={reminder.id} />
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
