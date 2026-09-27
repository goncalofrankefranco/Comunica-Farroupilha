import { dataResponse, errorResponse, isUuid, parseTimestampCursor, readJsonObject, requiredString, unavailableResponse } from "@/lib/http";
import { addComment, getComments, getProposal } from "@/lib/platform-repository";
import { enforceRequestLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const limited = await enforceRequestLimit(request, "comments-read", 2000, 60);
    if (limited) return limited;
    const cursor = parseTimestampCursor(new URL(request.url).searchParams.get("cursor"));
    if (cursor === null) return errorResponse("Cursor de comentários inválido.", 400);
    const { id } = await context.params;
    const viewer = await getSessionUser();
    if (!(await getProposal(id, viewer?.role === "gef"))) return errorResponse("Proposta não encontrada.", 404);
    return dataResponse(await getComments(id, viewer?.role === "gef", cursor, viewer?.id));
  } catch (error) {
    return unavailableResponse("list-comments", error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const ipLimit = await enforceRequestLimit(request, "comment-create-ip", 10000, 3600);
    if (ipLimit) return ipLimit;
    const user = await getSessionUser();
    if (!user) return errorResponse("Faça login para comentar.", 401);
    const body = await readJsonObject(request);
    if (!body) return errorResponse("Envie um JSON válido.", 400);
    const text = requiredString(body.body, { min: 3, max: 2000 });
    const parentId = body.parentId === undefined ? undefined : requiredString(body.parentId, { max: 64 });
    if (!text || (body.parentId !== undefined && (!parentId || !isUuid(parentId)))) return errorResponse("O comentário precisa ter entre 3 e 2000 caracteres e uma resposta válida.", 400);
    const { id } = await context.params;
    const userTotalLimit = await enforceRequestLimit(request, "comment-create-user", 100, 3600, user.id);
    if (userTotalLimit) return userTotalLimit;
    const userLimit = await enforceRequestLimit(request, `comment-create:${id}`, 20, 3600, user.id);
    if (userLimit) return userLimit;
    const proposal = await getProposal(id);
    if (!proposal) return errorResponse("Proposta não encontrada.", 404);
    if (proposal.status === "cancelled") return errorResponse("Esta proposta foi cancelada e não aceita novos comentários.", 409);
    const comment = await addComment(id, {
      author: user.name, authorId: user.id, role: user.role,
      anonymous: false,
      body: text, ...(parentId ? { parentId } : {}),
    });
    return dataResponse(comment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "COMMENT_PARENT_MISMATCH") {
      return errorResponse("A resposta precisa pertencer à mesma proposta.", 400);
    }
    if (error instanceof Error && error.message === "PROPOSAL_CANCELLED") {
      return errorResponse("Esta proposta foi cancelada e não aceita novos comentários.", 409);
    }
    return unavailableResponse("create-comment", error);
  }
}
