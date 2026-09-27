import { createStudentAccount, normalizeUsername } from "@/lib/auth-repository";
import { errorResponse, readJsonObject, unavailableResponse } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { enforceRequestLimit } from "@/lib/rate-limit";
import { startSession } from "@/lib/session";
import { parseStudentSignup } from "@/lib/student-signup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.STUDENT_PASSWORD_AUTH_ENABLED !== "true") {
    return errorResponse("O cadastro de estudantes está temporariamente indisponível.", 410);
  }

  try {
    const ipLimit = await enforceRequestLimit(request, "auth-signup-ip", 10, 600);
    if (ipLimit) return ipLimit;

    const body = await readJsonObject(request);
    if (!body) return errorResponse("Envie um JSON válido.", 400);
    const signup = parseStudentSignup(body);
    if (!signup) return errorResponse("Informe usuário, turma e uma senha de 8 a 256 caracteres.", 400);

    const usernameLimit = await enforceRequestLimit(
      request,
      "auth-signup-username",
      4,
      600,
      normalizeUsername(signup.name),
    );
    if (usernameLimit) return usernameLimit;

    const passwordHash = await hashPassword(signup.password);
    const user = await createStudentAccount({ ...signup, passwordHash });
    await startSession(user);
    return Response.json({ user }, { headers: { "Cache-Control": "no-store, max-age=0", Vary: "Cookie" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return errorResponse("Este nome de usuário já está em uso. Escolha outro.", 409);
    }
    return unavailableResponse("student-signup", error);
  }
}
