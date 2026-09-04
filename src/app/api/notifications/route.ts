import { getPlatformStore } from "@/lib/platform-store";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSessionUser())) return Response.json({ error: "Faça login para ver suas notificações." }, { status: 401 });
  return Response.json({ data: getPlatformStore().notifications });
}

export async function PATCH() {
  if (!(await getSessionUser())) return Response.json({ error: "Faça login para atualizar suas notificações." }, { status: 401 });
  const store = getPlatformStore();
  store.notifications = store.notifications.map((notification) => ({ ...notification, read: true }));
  return Response.json({ data: store.notifications });
}
