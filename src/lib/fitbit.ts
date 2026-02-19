import { randomBytes } from "crypto";

const FITBIT_API_BASE = "https://api.fitbit.com";

export const FITBIT_USER_ID = "me";

type FitbitTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  user_id: string;
};

type FitbitActivitiesResponse = {
  activities: Array<Record<string, unknown>>;
  pagination?: {
    offset: number;
    limit: number;
    next?: string;
    previous?: string;
  };
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getFitbitConfig() {
  return {
    clientId: requiredEnv("FITBIT_CLIENT_ID"),
    clientSecret: requiredEnv("FITBIT_CLIENT_SECRET"),
    redirectUri: requiredEnv("FITBIT_REDIRECT_URI"),
    scopes: (process.env.FITBIT_SCOPES || "activity profile").trim(),
  };
}

export function buildFitbitAuthorizeUrl(state: string) {
  const { clientId, redirectUri, scopes } = getFitbitConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
}

export function generateOAuthState() {
  return randomBytes(24).toString("hex");
}

function getBasicAuthHeader() {
  const { clientId, clientSecret } = getFitbitConfig();
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return `Basic ${encoded}`;
}

export async function exchangeCodeForToken(code: string) {
  const { redirectUri } = getFitbitConfig();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${FITBIT_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Fitbit token exchange failed with ${response.status}`);
  }

  return (await response.json()) as FitbitTokenResponse;
}

export async function refreshFitbitToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(`${FITBIT_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Fitbit token refresh failed with ${response.status}`);
  }

  return (await response.json()) as FitbitTokenResponse;
}

export async function listFitbitActivitiesPage(args: {
  accessToken: string;
  afterDate: string;
  offset: number;
  limit?: number;
}) {
  const { accessToken, afterDate, offset, limit = 100 } = args;
  const url = new URL(`${FITBIT_API_BASE}/1/user/-/activities/list.json`);
  url.searchParams.set("afterDate", afterDate);
  url.searchParams.set("sort", "asc");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return {
    status: response.status,
    body: response.ok ? ((await response.json()) as FitbitActivitiesResponse) : null,
  };
}

export function computeExpiryDate(expiresInSeconds: number) {
  return new Date(Date.now() + expiresInSeconds * 1000);
}
