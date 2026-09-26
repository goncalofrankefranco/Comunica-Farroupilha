import { dataResponse, errorResponse, readJsonObject, requiredString, unavailableResponse } from "@/lib/http";
import { createActivity, getActivities, getProposal } from "@/lib/platform-repository";
import { getSessionUser } from "@/lib/session";
import { isValidDateKey } from "@/lib/participation-domain";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return dataResponse(await getActivities()); }
  catch (error) { return unavailableResponse("list-activities", error); }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Faça login para criar uma atividade.", 401);
    if (user.role !== "gef") return errorResponse("Somente o GEF pode criar atividades.", 403);
    const body = await readJsonObject(request);
    if (!body) return errorResponse("Envie um JSON válido.", 400);
    const proposalId = requiredString(body.proposalId, { max: 64 });
    const title = requiredString(body.title, { max: 160 });
    const date = typeof body.date === "string" && isValidDateKey(body.date) ? body.date : null;
    const time = requiredString(body.time, { max: 80 });
    const place = requiredString(body.place, { max: 160 });
    const audience = requiredString(body.audience, { max: 160 });
    if (!proposalId || !title || !date || !time || !place || !audience) return errorResponse("Proposta, título, data, horário, local e público são obrigatórios.", 400);
    const proposal = await getProposal(proposalId);
    if (!proposal) return errorResponse("Proposta não encontrada.", 404);
    if (proposal.status !== "analysis" && proposal.status !== "development") return errorResponse("A proposta precisa estar em análise ou desenvolvimento para entrar na agenda.", 409);
    const activity = await createActivity({ proposalId, title, date, time, place, audience });
    if (!activity) return errorResponse("A proposta mudou e não pode mais entrar na agenda.", 409);
    return dataResponse(activity, { status: 201 });
  } catch (error) {
    return unavailableResponse("create-activity", error);
  }
}
