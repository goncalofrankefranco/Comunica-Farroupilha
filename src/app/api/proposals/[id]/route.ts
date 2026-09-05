import { getProposal, getProposalSupporters, updateProposalStatus, updateProposalGefResponse, type ProposalRecord, type ProposalStatus } from "@/lib/platform-store";
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
  if (!user) return Response.json({ error: "Faça login para gerenciar a proposta." }, { status: 401 });
  if (user.role !== "gef") return Response.json({ error: "Somente o GEF pode gerenciar a proposta." }, { status: 403 });
  const { id } = await context.params;
  let body: { status?: unknown; gefResponse?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Envie um JSON válido." }, { status: 400 }); }

  const allowed: ProposalStatus[] = ["received", "analysis", "development", "scheduled", "completed", "archived"];

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !allowed.includes(body.status as ProposalStatus)) {
      return Response.json({ error: "Situação inválida." }, { status: 400 });
    }
  }

  const gefResponse = typeof body.gefResponse === "string" ? body.gefResponse : undefined;

  if (body.status === undefined && gefResponse === undefined) {
    return Response.json({ error: "Informe ao menos a situação ou a resposta do GEF." }, { status: 400 });
  }

  let proposal: ProposalRecord | null | undefined = getProposal(id);
  if (!proposal) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });

  if (body.status !== undefined) {
    proposal = updateProposalStatus(id, body.status as ProposalStatus, gefResponse);
  } else if (gefResponse !== undefined) {
    proposal = updateProposalGefResponse(id, gefResponse);
  }

  if (!proposal) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });

  return Response.json({ data: proposal });
}
