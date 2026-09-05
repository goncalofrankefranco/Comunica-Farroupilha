import { findAccount, createAccount, publicUser } from "@/lib/platform-store";
import { startSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    name?: unknown;
    password?: unknown;
    clientAccount?: { name?: unknown; turma?: unknown; password?: unknown };
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Envie um JSON válido." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  let account = findAccount(name, password);

  // In ephemeral serverless environments (e.g., Vercel), instances don't share disk.
  // If the account was created on another instance and exists in client storage with matching password,
  // re-register it in this container's store.
  if (!account && body.clientAccount && typeof body.clientAccount === "object") {
    const ca = body.clientAccount;
    if (
      typeof ca.name === "string" &&
      ca.name.trim().toLowerCase() === name.toLowerCase() &&
      ca.password === password &&
      typeof ca.turma === "string"
    ) {
      try {
        account = createAccount(ca.name.trim(), ca.turma.trim() || "Turma não informada", password);
      } catch {
        account = findAccount(name, password);
      }
    }
  }

  if (!account) return Response.json({ error: "Nome de usuário ou senha incorretos." }, { status: 401 });
  await startSession(account);
  return Response.json({ user: publicUser(account) });
}
