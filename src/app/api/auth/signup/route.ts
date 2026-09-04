import { createAccount, publicUser } from "@/lib/platform-store";
import { startSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { name?: unknown; turma?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Envie um JSON válido." }, { status: 400 }); }
  if (typeof body.name !== "string" || typeof body.turma !== "string" || typeof body.password !== "string") return Response.json({ error: "Nome, turma e senha são obrigatórios." }, { status: 400 });
  try {
    const account = createAccount(body.name, body.turma, body.password);
    await startSession(account);
    return Response.json({ user: publicUser(account) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível criar a conta." }, { status: 400 });
  }
}
