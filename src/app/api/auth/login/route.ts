import { findAccountCredentials, normalizeUsername } from "@/lib/auth-repository";
import { unavailableResponse } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { canUsePasswordLogin } from "@/lib/password-login-policy";
import { enforceRequestLimit } from "@/lib/rate-limit";
import { startSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRequestLimit(request, "auth-login", 20, 600);
    if (ipLimit) return ipLimit;

    let body: { name?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Envie um JSON válido." }, { status: 400 });
    }
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!name || !password || name.length > 160 || password.length > 256) {
      return Response.json({ error: "Nome de usuário ou senha incorretos." }, { status: 401 });
    }

    const accountLimit = await enforceRequestLimit(request, `auth-login:${normalizeUsername(name)}`, 8, 600);
    if (accountLimit) return accountLimit;

    const credentials = await findAccountCredentials(name);
    const studentPasswordFallbackEnabled = process.env.STUDENT_PASSWORD_AUTH_ENABLED === "true";
    if (!credentials || !canUsePasswordLogin(credentials.user.role, studentPasswordFallbackEnabled) || !credentials.passwordHash || !(await verifyPassword(password, credentials.passwordHash))) {
      return Response.json({ error: "Nome de usuário ou senha incorretos." }, { status: 401 });
    }
    await startSession(credentials.user);
    return Response.json({ user: credentials.user });
  } catch (error) {
    return unavailableResponse("login", error);
  }
}
