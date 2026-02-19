import Link from "next/link";

export default function Home() {
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
      </main>
    </div>
  );
}
