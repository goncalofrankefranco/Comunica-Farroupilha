import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getGoogleOAuthSettings } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
  return response;
}
