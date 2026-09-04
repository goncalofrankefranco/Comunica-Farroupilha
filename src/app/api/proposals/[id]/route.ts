import { getProposal, getProposalSupporters, updateProposalStatus, type ProposalStatus } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const proposal = getProposal(id);
  if (!proposal) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
  return Response.json({ data: { ...proposal, supporters: getProposalSupporters(id) } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para alterar a situação." }, { status: 401 });
  if (user.role !== "gef") return Response.json({ error: "Somente o GEF pode alterar a situação." }, { status: 403 });
  const { id } = await context.params;
  let body: { status?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Envie um JSON válido." }, { status: 400 }); }
  const allowed: ProposalStatus[] = ["received", "analysis", "development", "scheduled", "completed", "archived"];
  if (typeof body.status !== "string" || !allowed.includes(body.status as ProposalStatus)) return Response.json({ error: "Situação inválida." }, { status: 400 });
  const proposal = updateProposalStatus(id, body.status as ProposalStatus);
  if (!proposal) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
  return Response.json({ data: proposal });
}
