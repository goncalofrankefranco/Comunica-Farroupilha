import { findAccount, publicUser } from "@/lib/platform-store";
import { startSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { name?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Envie um JSON válido." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name : "";
  const password = typeof body.password === "string" ? body.password : "";
  const account = findAccount(name, password);
  if (!account) return Response.json({ error: "Nome de usuário ou senha incorretos." }, { status: 401 });
  await startSession(account);
  return Response.json({ user: publicUser(account) });
}
