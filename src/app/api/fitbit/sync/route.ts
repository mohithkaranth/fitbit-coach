// src/app/api/fitbit/sync/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/api/fitbit/manual-sync";
  return NextResponse.redirect(url);
}