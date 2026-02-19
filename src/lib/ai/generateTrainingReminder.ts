type LastWorkout = {
  name?: string | null;
  Category: string;
  startTime: Date;
} | null;

const MAX_LENGTH = 240;

function fallbackMessage(lastWorkout: LastWorkout, hoursSinceLast: number) {
  const mentionTwoDays = hoursSinceLast >= 48 ? "It has been about 2 days since your last session. " : "";

  if (!lastWorkout) {
    return `${mentionTwoDays}Let’s restart momentum with a 10-minute bootcamp baseline today—just enough to get moving.`.slice(
      0,
      MAX_LENGTH,
    );
  }

  if (lastWorkout.Category === "strength") {
    return `${mentionTwoDays}Nice strength effort last time—try 12 minutes of easy cardio or mobility today to keep your streak alive.`.slice(
      0,
      MAX_LENGTH,
    );
  }

  if (lastWorkout.Category === "cardio") {
    return `${mentionTwoDays}Great cardio work recently—fit in a short bootcamp or strength set today to stay balanced.`.slice(
      0,
      MAX_LENGTH,
    );
  }

  return `${mentionTwoDays}A quick 10-minute bootcamp baseline today is a smart way to rebuild consistency.`.slice(
    0,
    MAX_LENGTH,
  );
}

export async function generateTrainingReminder(input: {
  lastWorkout: LastWorkout;
  hoursSinceLast: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return fallbackMessage(input.lastWorkout, input.hoursSinceLast);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "You are a supportive fitness coach. Write exactly one short reminder message under 240 chars with one actionable suggestion.",
          },
          {
            role: "user",
            content: JSON.stringify({
              rules: [
                "Do not invent numbers or history.",
                "If last workout Category was strength, suggest light cardio or mobility.",
                "If cardio, suggest short bootcamp or strength.",
                "If none, suggest a 10-minute bootcamp baseline.",
                "Mention '2 days' only when hoursSinceLast >= 48.",
                "Return plain text only.",
              ],
              lastWorkout: input.lastWorkout,
              hoursSinceLast: input.hoursSinceLast,
            }),
          },
        ],
        max_output_tokens: 120,
      }),
    });

    if (!response.ok) {
      return fallbackMessage(input.lastWorkout, input.hoursSinceLast);
    }

    const json = (await response.json()) as { output_text?: string };
    const message = (json.output_text ?? "").trim().replace(/\s+/g, " ");

    if (!message) {
      return fallbackMessage(input.lastWorkout, input.hoursSinceLast);
    }

    return message.slice(0, MAX_LENGTH);
  } catch {
    return fallbackMessage(input.lastWorkout, input.hoursSinceLast);
  }
}
