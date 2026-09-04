import { CHAPA_AREAS, getPlatformStore } from "@/lib/platform-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const area = new URL(request.url).searchParams.get("area");
  const validArea = area && CHAPA_AREAS.includes(area as (typeof CHAPA_AREAS)[number]) ? area : null;
  const chapas = getPlatformStore().chapas.map((chapa) => ({ ...chapa, proposals: validArea ? chapa.proposals.filter((proposal) => proposal.area === validArea) : chapa.proposals }));
  return Response.json({ data: chapas, meta: { neutral: true, message: "Apresentação informativa, sem pontuação ou ordem de preferência." } });
}
