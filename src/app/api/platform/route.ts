import { getPlatformStore } from "@/lib/platform-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getPlatformStore();
  return Response.json({
    data: {
      proposals: store.proposals,
      comments: store.comments,
      activities: store.activities,
      notifications: store.notifications,
      supportersByProposal: store.supportersByProposal,
      chapas: store.chapas,
    },
    meta: { mode: "demo", persistence: "memory", message: "Conecte um banco gerenciado antes do uso em produção." },
  });
}
