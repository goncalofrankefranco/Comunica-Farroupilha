import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertGoogleAccount } from "@/lib/auth-repository";
import { getGoogleOAuthSettings } from "@/lib/google-auth";
import { isAllowedGoogleIdentity } from "@/lib/participation-domain";
import { startSession } from "@/lib/session";

export const dynamic = "force-dynamic";
const STATE_COOKIE = "comunica_google_state";
const NONCE_COOKIE = "comunica_google_nonce";

function matchesState(expected: string | undefined, actual: string | null) {
  if (!expected || !actual) return false;
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes);
}

function finish(request: Request, authError?: string) {
  const location = new URL(authError ? `/app?authError=${authError}` : "/app", request.url);
  const response = NextResponse.redirect(location);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(STATE_COOKIE, "", cookieOptions);
  response.cookies.set(NONCE_COOKIE, "", cookieOptions);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const expectedNonce = cookieStore.get(NONCE_COOKIE)?.value;
  if (!matchesState(expectedState, state) || !expectedNonce) return finish(request, "google-expired");
  if (url.searchParams.has("error") || !code) return finish(request, "google-failed");

  const settings = getGoogleOAuthSettings();
  if (!settings) return finish(request, "google-unavailable");

  try {
    const { tokens } = await settings.client.getToken(code);
    if (!tokens.id_token) return finish(request, "google-failed");
    const ticket = await settings.client.verifyIdToken({ idToken: tokens.id_token, audience: settings.clientId });
    const claims = ticket.getPayload();
    if (!claims || claims.nonce !== expectedNonce) return finish(request, "google-expired");
    if (!isAllowedGoogleIdentity(claims)) return finish(request, "google-domain");
    if (!claims.email || !claims.sub) return finish(request, "google-failed");

    const user = await upsertGoogleAccount({ email: claims.email, name: claims.name ?? "", sub: claims.sub });
    await startSession(user);
    return finish(request);
  } catch {
    return finish(request, "google-failed");
  }
}
