import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  computeExpiryDate,
  exchangeCodeForToken,
  FITBIT_USER_ID,
} from "@/lib/fitbit";
import { runDailyAutoSyncIfNeeded } from "@/lib/fitbitSync";
import { upsertAuth } from "@/lib/store";

const STATE_COOKIE = "fitbit_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.json(
      { error: "Invalid OAuth state or missing code" },
      { status: 400 },
    );
  }

  cookieStore.delete(STATE_COOKIE);

  const tokenData = await exchangeCodeForToken(code);

  await upsertAuth({
    userId: FITBIT_USER_ID,
    fitbitUserId: tokenData.user_id,
    scope: tokenData.scope,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: computeExpiryDate(tokenData.expires_in),
  });

  await runDailyAutoSyncIfNeeded();

  return NextResponse.redirect(new URL("/fitbit", request.url));
}
