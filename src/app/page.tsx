import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReminderDismissButton } from "@/components/reminder-dismiss-button";

export default async function Home() {
  const pendingReminder = await prisma.reminder.findFirst({
    where: {
      subjectKey: "owner",
      kind: "training_gap",
      status: "pending",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-violet-50 px-6 py-20">
      <main className="mx-auto max-w-2xl rounded-3xl border border-cyan-100 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">fitbit-coach</h1>
        <p className="mt-3 text-slate-600">
          Connect Fitbit to sync workout activity and power your coaching insights.
        </p>
        <Link
          href="/fitbit"
          className="mt-6 inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
        >
          Open Fitbit Dashboard
        </Link>
        {pendingReminder ? (
          <section className="mt-6 rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Training gap reminder</h2>
            <p className="mt-2 text-slate-600">
              {pendingReminder.message ?? "You have not done strength or cardio in the last 48 hours."}
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/reminders"
                className="inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
              >
                View reminders
              </Link>
              <ReminderDismissButton id={pendingReminder.id} />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
