"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
};

export function ReminderDismissButton({ id }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <button
      type="button"
      disabled={isSubmitting}
      onClick={async () => {
        setIsSubmitting(true);
        try {
          await fetch("/api/reminders/dismiss", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          router.refresh();
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
    >
      {isSubmitting ? "Dismissing..." : "Dismiss"}
    </button>
  );
}
