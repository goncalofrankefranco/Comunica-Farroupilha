import { toggleCommentLike } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para curtir um comentário." }, { status: 401 });

  const { id } = await context.params;
  const result = toggleCommentLike(id, user.id);
  if (!result) return Response.json({ error: "Comentário não encontrado." }, { status: 404 });

  return Response.json({ data: result });
}
