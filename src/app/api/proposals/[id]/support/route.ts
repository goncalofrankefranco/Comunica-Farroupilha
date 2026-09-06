import { setSupport, toggleSupport } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Faça login para apoiar uma proposta." }, { status: 401 });
  const { id } = await context.params;
  let desiredSupported: boolean | undefined;
  try {
    const body = await request.json() as { supported?: unknown };
    if (typeof body.supported === "boolean") desiredSupported = body.supported;
  } catch {}
  const result = desiredSupported === undefined ? toggleSupport(id, user.id) : setSupport(id, user.id, desiredSupported);
  if (!result) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
  return Response.json({ data: result });
}
