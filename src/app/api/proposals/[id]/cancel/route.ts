import { dataResponse, errorResponse, isUuid, unavailableResponse } from "@/lib/http";
import { cancelProposal, getProposal } from "@/lib/platform-repository";
import { canCancelProposal } from "@/lib/participation-domain";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Faça login para cancelar uma proposta.", 401);
    const { id } = await context.params;
    if (!isUuid(id)) return errorResponse("Proposta não encontrada.", 404);
    const proposal = await getProposal(id, true);
    if (!proposal) return errorResponse("Proposta não encontrada.", 404);
    if (user.role !== "student" || proposal.origin !== "student" || proposal.authorId !== user.id) {
      return errorResponse("Somente o autor pode cancelar uma proposta antes do agendamento.", 403);
    }
    if (!canCancelProposal(proposal, user.id, user.role)) return errorResponse("A proposta já foi agendada ou encerrada.", 409);
    const cancelled = await cancelProposal(id, user.id);
    if (!cancelled) return errorResponse("A proposta avançou e não pode mais ser cancelada por aqui.", 409);
    return dataResponse(cancelled);
  } catch (error) {
    return unavailableResponse("cancel-proposal", error);
  }
}
