import { createProposal, getPlatformStore } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const theme = url.searchParams.get("theme");
  const status = url.searchParams.get("status");
  const origin = url.searchParams.get("origin");
  const proposals = getPlatformStore().proposals.filter(
    (proposal) =>
      (!theme || proposal.theme === theme) &&
      (!status || proposal.status === status) &&
      (!origin || proposal.origin === origin)
  );
  const store = getPlatformStore();
  return Response.json({
    data: proposals.map((proposal) => ({
      ...proposal,
      supporters: store.supportersByProposal[proposal.id] ?? [],
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para publicar uma proposta." }, { status: 401 });

  let body: { title?: unknown; body?: unknown; theme?: unknown; anonymous?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Envie um JSON válido." }, { status: 400 });
  }

  if (
    typeof body.title !== "string" ||
    body.title.trim().length < 5 ||
    typeof body.body !== "string" ||
    body.body.trim().length < 20 ||
    typeof body.theme !== "string"
  ) {
    return Response.json({ error: "Título, texto e tema são obrigatórios." }, { status: 400 });
  }

  const isAnonymous = user.role === "gef" ? false : body.anonymous === true;
  const proposal = createProposal({
    title: body.title.trim(),
    body: body.body.trim(),
    theme: body.theme,
    author: user.role === "gef" ? "Grêmio Estudantil Farroupilha" : user.name,
    authorId: user.id,
    anonymous: isAnonymous,
    origin: user.role === "gef" ? "gef" : "student",
  });

  return Response.json({ data: proposal }, { status: 201 });
}
