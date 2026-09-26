import { dataResponse, errorResponse, isUuid, readJsonObject, unavailableResponse } from "@/lib/http";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/platform-repository";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Faça login para ver suas notificações.", 401);
    return dataResponse(await getNotifications(user.id));
  } catch (error) { return unavailableResponse("list-notifications", error); }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Faça login para atualizar suas notificações.", 401);
    const body = await readJsonObject(request);
    if (!body) return errorResponse("Envie um JSON válido.", 400);
    if (body.id !== undefined) {
      if (typeof body.id !== "string" || !isUuid(body.id)) return errorResponse("Informe uma notificação válida.", 400);
      if (!(await markNotificationRead(user.id, body.id))) return errorResponse("Notificação não encontrada.", 404);
    } else if (body.all === true) {
      await markAllNotificationsRead(user.id);
    } else {
      return errorResponse("Informe uma notificação ou solicite marcar todas como lidas.", 400);
    }
    return dataResponse(await getNotifications(user.id));
  } catch (error) { return unavailableResponse("read-notifications", error); }
}
