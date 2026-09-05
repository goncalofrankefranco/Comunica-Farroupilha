import {
  answerChapaQuestion,
  createChapaQuestion,
  getChapaQuestions,
  CHAPA_AREAS,
} from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chapaId = url.searchParams.get("chapaId") ?? undefined;
  const area = url.searchParams.get("area") ?? undefined;
  const questions = getChapaQuestions(chapaId, area);
  return Response.json({ data: questions });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para enviar uma dúvida." }, { status: 401 });

  let body: {
    chapaId?: unknown;
    proposalArea?: unknown;
    proposalTitle?: unknown;
    question?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Envie um JSON válido." }, { status: 400 });
  }

  if (
    typeof body.chapaId !== "string" ||
    typeof body.proposalArea !== "string" ||
    typeof body.question !== "string" ||
    body.question.trim().length < 5
  ) {
    return Response.json(
      { error: "Identificador da chapa, área e pergunta (mínimo 5 caracteres) são obrigatórios." },
      { status: 400 }
    );
  }

  if (!CHAPA_AREAS.includes(body.proposalArea as (typeof CHAPA_AREAS)[number])) {
    return Response.json({ error: "Área de proposta inválida." }, { status: 400 });
  }

  const record = createChapaQuestion({
    chapaId: body.chapaId,
    proposalArea: body.proposalArea,
    proposalTitle: typeof body.proposalTitle === "string" ? body.proposalTitle.trim() : undefined,
    question: body.question.trim(),
    author: user.name,
    authorId: user.id,
    turma: user.turma,
  });

  return Response.json({ data: record }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para responder dúvidas." }, { status: 401 });
  if (user.role !== "gef") return Response.json({ error: "Somente o GEF pode responder dúvidas das chapas." }, { status: 403 });

  let body: {
    questionId?: unknown;
    answer?: unknown;
    answeredBy?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Envie um JSON válido." }, { status: 400 });
  }

  if (
    typeof body.questionId !== "string" ||
    typeof body.answer !== "string" ||
    body.answer.trim().length < 2
  ) {
    return Response.json({ error: "ID da dúvida e resposta são obrigatórios." }, { status: 400 });
  }

  const answeredBy = typeof body.answeredBy === "string" && body.answeredBy.trim() ? body.answeredBy.trim() : "GEF";
  const updated = answerChapaQuestion(body.questionId, body.answer.trim(), answeredBy);
  if (!updated) return Response.json({ error: "Dúvida não encontrada." }, { status: 404 });

  return Response.json({ data: updated });
}
