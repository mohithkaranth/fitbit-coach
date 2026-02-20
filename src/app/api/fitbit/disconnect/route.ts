import { NextResponse } from "next/server";
import { FITBIT_USER_ID } from "@/lib/fitbit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await prisma.fitbitAuth.deleteMany({
    where: { userId: FITBIT_USER_ID },
  });

  return NextResponse.redirect(new URL("/fitbit", request.url), 303);
}
