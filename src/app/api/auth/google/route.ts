import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasLegacyGoogleLinkAttempt } from "@/lib/auth-repository";
import { getGoogleOAuthSettings } from "@/lib/google-auth";
import { hashSessionToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";

const LEGACY_LINK_COOKIE = "comunica_legacy_link";
const LINK_MODE_COOKIE = "comunica_google_link_mode";

export async function GET(request: Request) {
  const linkMode = new URL(request.url).searchParams.get("mode") === "link";
  const cookieStore = await cookies();
  const rawLinkToken = cookieStore.get(LEGACY_LINK_COOKIE)?.value;
  if (linkMode) {
    if (!rawLinkToken) return NextResponse.redirect(new URL("/app?authError=legacy-link-expired", request.url));
    try {
      if (!(await hasLegacyGoogleLinkAttempt(hashSessionToken(rawLinkToken)))) {
        return NextResponse.redirect(new URL("/app?authError=legacy-link-expired", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/app?authError=legacy-link-unavailable", request.url));
    }
  }

  const settings = getGoogleOAuthSettings();
  if (!settings) return NextResponse.redirect(new URL("/app?authError=google-unavailable", request.url));

  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const authorizationUrl = settings.client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    nonce,
    hd: "farroups.com.br",
    prompt: "select_account",
  });
  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  response.cookies.set("comunica_google_state", state, cookieOptions);
  response.cookies.set("comunica_google_nonce", nonce, cookieOptions);
  response.cookies.set(LINK_MODE_COOKIE, linkMode ? "1" : "", {
    ...cookieOptions,
    path: "/api/auth/google",
    maxAge: linkMode ? 600 : 0,
  });
  if (!linkMode) {
    response.cookies.set(LEGACY_LINK_COOKIE, "", {
      ...cookieOptions,
      path: "/api/auth/google",
      maxAge: 0,
    });
  }
  return response;
}
