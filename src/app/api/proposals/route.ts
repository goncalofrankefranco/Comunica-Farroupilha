import { dataResponse, errorResponse, parseTimestampCursor, readJsonObject, requiredString, unavailableResponse } from "@/lib/http";
import { createProposal, getPlatformSnapshot } from "@/lib/platform-repository";
import { enforceRequestLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limited = await enforceRequestLimit(request, "proposals-read", 3000, 60);
    if (limited) return limited;
    const url = new URL(request.url);
    const cursor = parseTimestampCursor(url.searchParams.get("cursor"));
    if (cursor === null) return errorResponse("Cursor de propostas inválido.", 400);
    const theme = url.searchParams.get("theme");
    const status = url.searchParams.get("status");
    const origin = url.searchParams.get("origin");
    const user = await getSessionUser();
    const snapshot = await getPlatformSnapshot(user?.id, cursor);
    const proposals = snapshot.proposals
      .filter((proposal) => (!theme || proposal.theme === theme) && (!status || proposal.status === status) && (!origin || proposal.origin === origin))
      .map((proposal) => ({ ...proposal, supporters: snapshot.supportersByProposal[proposal.id] ?? [] }));
    return dataResponse(proposals, { headers: snapshot.nextProposalCursor ? { "X-Next-Cursor": snapshot.nextProposalCursor } : undefined });
  } catch (error) {
    return unavailableResponse("list-proposals", error);
  }
}

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRequestLimit(request, "proposal-create-ip", 2000, 3600);
    if (ipLimit) return ipLimit;
    const user = await getSessionUser();
    if (!user) return errorResponse("Faça login para publicar uma proposta.", 401);
    const userLimit = await enforceRequestLimit(request, "proposal-create", 5, 3600, user.id);
    if (userLimit) return userLimit;
    const body = await readJsonObject(request);
    if (!body) return errorResponse("Envie um JSON válido.", 400);
    const title = requiredString(body.title, { min: 5, max: 160 });
    const text = requiredString(body.body, { min: 20, max: 4000 });
    const theme = requiredString(body.theme, { max: 80 });
    if (!title || !text || !theme) return errorResponse("Título, texto e tema são obrigatórios e devem respeitar os limites.", 400);

    const proposal = await createProposal({
      title, body: text, theme,
      author: user.role === "gef" ? "Grêmio Estudantil Farroupilha" : user.name,
      authorId: user.id,
      anonymous: false,
      origin: user.role === "gef" ? "gef" : "student",
    });
    return dataResponse(proposal, { status: 201 });
  } catch (error) {
    return unavailableResponse("create-proposal", error);
  }
}
