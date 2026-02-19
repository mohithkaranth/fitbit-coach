import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string } | null;

  if (!body?.id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.reminder.updateMany({
    where: {
      id: body.id,
      subjectKey: "owner",
    },
    data: {
      status: "dismissed",
    },
  });

  return NextResponse.json({ ok: true });
}
