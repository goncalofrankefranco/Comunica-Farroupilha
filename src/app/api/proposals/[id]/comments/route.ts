import { addComment, getPlatformStore } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return Response.json({ data: getPlatformStore().comments.filter((comment) => comment.proposalId === id) });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para comentar." }, { status: 401 });
  const { id } = await context.params;
  let body: { body?: unknown; anonymous?: unknown; parentId?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Envie um JSON válido." }, { status: 400 }); }
  if (typeof body.body !== "string" || body.body.trim().length < 3) return Response.json({ error: "O comentário precisa ter pelo menos 3 caracteres." }, { status: 400 });
  const comment = addComment(id, { author: user.name, authorId: user.id, role: user.role, anonymous: body.anonymous === true, body: body.body.trim(), ...(typeof body.parentId === "string" ? { parentId: body.parentId } : {}) });
  if (!comment) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
  return Response.json({ data: comment }, { status: 201 });
}
