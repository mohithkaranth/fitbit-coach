import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildFitbitAuthorizeUrl, generateOAuthState } from "@/lib/fitbit";

const STATE_COOKIE = "fitbit_oauth_state";

export async function GET() {
  const state = generateOAuthState();
  const authorizeUrl = buildFitbitAuthorizeUrl(state);

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  return NextResponse.redirect(authorizeUrl);
}
