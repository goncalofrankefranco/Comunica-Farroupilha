import {
  getActivityFeedbacks,
  getPlatformStore,
  submitActivityFeedback,
  type ActivityFeedbackRating,
} from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const activity = getPlatformStore().activities.find((item) => item.id === id);
  if (!activity) return Response.json({ error: "Atividade não encontrada." }, { status: 404 });
  const feedbacks = getActivityFeedbacks(id);
  return Response.json({ data: feedbacks });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para avaliar uma atividade." }, { status: 401 });

  const { id } = await context.params;
  const activity = getPlatformStore().activities.find((item) => item.id === id);
  if (!activity) return Response.json({ error: "Atividade não encontrada." }, { status: 404 });

  let body: {
    participated?: unknown;
    reasonNotParticipated?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Envie um JSON válido." }, { status: 400 });
  }

  if (typeof body.participated !== "boolean") {
    return Response.json({ error: "Informe se você participou da atividade (true ou false)." }, { status: 400 });
  }

  const validRatings: ActivityFeedbackRating[] = ["great", "good", "ok", "poor"];
  let rating: ActivityFeedbackRating | undefined = undefined;
  if (body.rating && typeof body.rating === "string" && validRatings.includes(body.rating as ActivityFeedbackRating)) {
    rating = body.rating as ActivityFeedbackRating;
  }

  const reasonNotParticipated = typeof body.reasonNotParticipated === "string" ? body.reasonNotParticipated.trim() : undefined;
  const comment = typeof body.comment === "string" ? body.comment.trim() : undefined;

  const record = submitActivityFeedback(id, {
    userId: user.id,
    userName: user.name,
    turma: user.turma,
    participated: body.participated,
    reasonNotParticipated,
    rating,
    comment,
  });

  return Response.json({ data: record }, { status: 201 });
}
