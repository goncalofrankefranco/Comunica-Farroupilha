import { createActivity, getPlatformStore } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ data: getPlatformStore().activities });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para criar uma atividade." }, { status: 401 });
  if (user.role !== "gef") return Response.json({ error: "Somente o GEF pode criar atividades." }, { status: 403 });
  let body: { proposalId?: unknown; title?: unknown; date?: unknown; time?: unknown; place?: unknown; audience?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Envie um JSON válido." }, { status: 400 }); }
  if (![body.proposalId, body.title, body.date, body.time, body.place, body.audience].every((value) => typeof value === "string" && value.trim())) return Response.json({ error: "Proposta, título, data, horário, local e público são obrigatórios." }, { status: 400 });
  const activity = createActivity({ proposalId: body.proposalId as string, title: body.title as string, date: body.date as string, time: body.time as string, place: body.place as string, audience: body.audience as string });
  if (!activity) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
  return Response.json({ data: activity }, { status: 201 });
}
