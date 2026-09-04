import { getPlatformStore, toggleSaved } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para acompanhar uma proposta." }, { status: 401 });
  const { id } = await context.params;
  if (!getPlatformStore().proposals.some((proposal) => proposal.id === id)) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
  const result = toggleSaved(id, user.id);
  return Response.json({ data: result }, { status: 200 });
}
