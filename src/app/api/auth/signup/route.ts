import { createAccount, findAccount, publicUser } from "@/lib/platform-store";
import { startSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { name?: unknown; turma?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Envie um JSON válido." }, { status: 400 }); }
  if (typeof body.name !== "string" || typeof body.turma !== "string" || typeof body.password !== "string") return Response.json({ error: "Nome, turma e senha são obrigatórios." }, { status: 400 });
  const name = body.name.trim();
  const turma = body.turma.trim();
  const password = body.password;

  const existing = findAccount(name, password);
  if (existing) {
    await startSession(existing);
    return Response.json({ user: publicUser(existing) }, { status: 200 });
  }

  try {
    const account = createAccount(name, turma, password);
    await startSession(account);
    return Response.json({ user: publicUser(account) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível criar a conta." }, { status: 400 });
  }
}
