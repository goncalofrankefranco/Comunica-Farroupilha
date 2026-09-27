import { NextResponse } from "next/server";
import {
  createLegacyGoogleLinkAttempt,
  findAccountCredentials,
  normalizeUsername,
} from "@/lib/auth-repository";
import { parseLegacyLinkCredentials } from "@/lib/legacy-account-linking";
import { errorResponse, readJsonObject, unavailableResponse } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { enforceRequestLimit } from "@/lib/rate-limit";
import { createSessionToken, hashSessionToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";

const LEGACY_LINK_COOKIE = "comunica_legacy_link";
const LEGACY_LINK_TTL_SECONDS = 10 * 60;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin !== new URL(request.url).origin) {
      return errorResponse("Recarregue a página e tente novamente.", 403);
    }

    const ipLimit = await enforceRequestLimit(request, "auth-legacy-link", 20, 600);
    if (ipLimit) return ipLimit;

    const body = await readJsonObject(request);
    if (!body) return errorResponse("Envie um JSON válido.", 400);
    const credentials = parseLegacyLinkCredentials(body);
    if (!credentials) return errorResponse("Informe seu usuário e senha antigos.", 400);

    const accountLimit = await enforceRequestLimit(
      request,
      `auth-legacy-link:${normalizeUsername(credentials.username)}`,
      8,
      600,
    );
    if (accountLimit) return accountLimit;

    const account = await findAccountCredentials(credentials.username);
    const passwordMatches = account?.passwordHash
      ? await verifyPassword(credentials.password, account.passwordHash)
      : false;
    if (!account || account.user.role !== "student" || !passwordMatches) {
      return errorResponse("Não foi possível validar essa conta antiga.", 401);
    }

    const rawToken = createSessionToken();
    await createLegacyGoogleLinkAttempt(
      account.user.id,
      hashSessionToken(rawToken),
      new Date(Date.now() + LEGACY_LINK_TTL_SECONDS * 1000),
    );

    const response = NextResponse.json(
      { data: { continueTo: "/api/auth/google?mode=link" } },
      { headers: { "Cache-Control": "no-store, max-age=0", Vary: "Cookie" } },
    );
    response.cookies.set(LEGACY_LINK_COOKIE, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: LEGACY_LINK_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "LEGACY_LINK_NOT_ALLOWED") {
      return errorResponse("Essa conta já foi vinculada ou não está disponível para recuperação.", 409);
    }
    return unavailableResponse("link-legacy-account", error);
  }
}
