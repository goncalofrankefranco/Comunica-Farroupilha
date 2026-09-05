import { getPlatformStore, updateActivityStatus } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const activity = getPlatformStore().activities.find((item) => item.id === id);
  if (!activity) return Response.json({ error: "Atividade não encontrada." }, { status: 404 });
  return Response.json({ data: activity });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para gerenciar atividades." }, { status: 401 });
  if (user.role !== "gef") return Response.json({ error: "Somente o GEF pode alterar o status de atividades." }, { status: 403 });

  const { id } = await context.params;
  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Envie um JSON válido." }, { status: 400 });
  }

  const allowed = ["upcoming", "done", "cancelled"];
  if (typeof body.status !== "string" || !allowed.includes(body.status)) {
    return Response.json({ error: "Status inválido. Use 'upcoming', 'done' ou 'cancelled'." }, { status: 400 });
  }

  const activity = updateActivityStatus(id, body.status as "upcoming" | "done" | "cancelled");
  if (!activity) return Response.json({ error: "Atividade não encontrada." }, { status: 404 });

  return Response.json({ data: activity });
}
