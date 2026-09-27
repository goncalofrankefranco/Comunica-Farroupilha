import { dataResponse, errorResponse, parseTimestampCursor, unavailableResponse } from "@/lib/http";
import { getPlatformSnapshot } from "@/lib/platform-repository";
import { enforceRequestLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limited = await enforceRequestLimit(request, "platform-read", 3000, 60);
    if (limited) return limited;
    const cursor = parseTimestampCursor(new URL(request.url).searchParams.get("cursor"));
    if (cursor === null) return errorResponse("Cursor de propostas inválido.", 400);
    const user = await getSessionUser();
    return dataResponse(await getPlatformSnapshot(user?.id, cursor));
  } catch (error) {
    return unavailableResponse("platform-snapshot", error);
  }
}
