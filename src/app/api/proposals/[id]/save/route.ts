import { getPlatformStore, setSaved, toggleSaved } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para acompanhar uma proposta." }, { status: 401 });
  const { id } = await context.params;
  if (!getPlatformStore().proposals.some((proposal) => proposal.id === id)) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
  let desiredSaved: boolean | undefined;
  try {
    const body = await request.json() as { saved?: unknown };
    if (typeof body.saved === "boolean") desiredSaved = body.saved;
  } catch {}
  const result = desiredSaved === undefined ? toggleSaved(id, user.id) : setSaved(id, user.id, desiredSaved);
  return Response.json({ data: result }, { status: 200 });
}
