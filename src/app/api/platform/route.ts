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
      activityFeedbacks: store.activityFeedbacks,
      chapaQuestions: store.chapaQuestions,
    },
    meta: {
      mode: "demo",
      persistence: "persistent-file",
      message: "Plataforma integrada com persistência estruturada e backend REST.",
    },
  });
}
