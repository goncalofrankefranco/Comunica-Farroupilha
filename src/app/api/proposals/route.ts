import { createProposal, getPlatformStore } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const theme = url.searchParams.get("theme");
  const status = url.searchParams.get("status");
  const proposals = getPlatformStore().proposals.filter((proposal) => (!theme || proposal.theme === theme) && (!status || proposal.status === status));
  const store = getPlatformStore();
  return Response.json({ data: proposals.map((proposal) => ({ ...proposal, supporters: store.supportersByProposal[proposal.id] ?? [] })) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para publicar uma proposta." }, { status: 401 });
  if (user.role !== "student") return Response.json({ error: "A publicação de propostas é exclusiva para estudantes." }, { status: 403 });
  let body: { title?: unknown; body?: unknown; theme?: unknown; anonymous?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Envie um JSON válido." }, { status: 400 }); }
  if (typeof body.title !== "string" || body.title.trim().length < 5 || typeof body.body !== "string" || body.body.trim().length < 20 || typeof body.theme !== "string") return Response.json({ error: "Título, texto e tema são obrigatórios." }, { status: 400 });
  const proposal = createProposal({ title: body.title.trim(), body: body.body.trim(), theme: body.theme, author: user.name, authorId: user.id, anonymous: body.anonymous === true });
  return Response.json({ data: proposal }, { status: 201 });
}
