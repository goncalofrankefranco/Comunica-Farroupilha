import { toggleSupport } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para apoiar uma proposta." }, { status: 401 });
  const { id } = await context.params;
  const result = toggleSupport(id, user.id);
  if (!result) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
  return Response.json({ data: result });
}
