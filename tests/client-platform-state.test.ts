import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

test("platform loading rejects an unavailable snapshot instead of returning an empty feed", async () => {
  assert.equal(existsSync("src/lib/client-platform-state.ts"), true, "client state module must exist");
  const { loadPlatform } = await import("../src/lib/client-platform-state.ts");
  const fetcher = async (input: string | URL | Request) => {
    const url = String(input);
    return url.endsWith("/api/auth/me")
      ? Response.json({ user: null })
      : Response.json({ error: "indisponível" }, { status: 503 });
  };

  await assert.rejects(() => loadPlatform(new AbortController().signal, fetcher), /indisponível/i);
});

test("platform cursors are sent only as an encoded pagination query", async () => {
  const { loadPlatform } = await import("../src/lib/client-platform-state.ts");
  const cursor = "2026-09-26T12:34:56.000Z~123e4567-e89b-42d3-a456-426614174000";
  let platformUrl = "";
  const fetcher = async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/api/auth/me")) return Response.json({ user: { id: "student" } });
    platformUrl = url;
    return Response.json({ data: { proposals: [], comments: [], activities: [], notifications: [], nextProposalCursor: null } });
  };

  await loadPlatform(new AbortController().signal, fetcher, cursor);
  assert.equal(platformUrl, `/api/platform?cursor=${encodeURIComponent(cursor)}`);
});

test("only the newest optimistic interaction response can change state", async () => {
  const stateModule = await import("../src/lib/client-platform-state.ts");
  const revisions = new Map<string, number>();
  const first = stateModule.beginInteraction(revisions, "support:proposal-1", 100);
  const second = stateModule.beginInteraction(revisions, "support:proposal-1", 100);

  assert.equal(first, 100);
  assert.equal(second, 101);
  assert.equal(stateModule.isLatestInteraction(revisions, "support:proposal-1", first), false);
  assert.equal(stateModule.isLatestInteraction(revisions, "support:proposal-1", second), true);
});

test("optimistic support, save, and like reducers keep user state internally consistent", async () => {
  const { applySupportState, applySavedState, applyCommentLikeState } = await import("../src/lib/client-platform-state.ts");
  const user = { id: "user-1", name: "Ana", turma: "2º EM", role: "student" as const };
  const initial = {
    proposals: [{ id: "proposal-1", supports: 0 }],
    comments: [{ id: "comment-1", likes: 0 }],
    supporters: {},
    supportedByUser: {},
    savedByUser: {},
    likedCommentsByUser: {},
  };

  const supported = applySupportState(initial, user, "proposal-1", true, 1);
  assert.deepEqual(supported.supportedByUser[user.id], ["proposal-1"]);
  assert.equal(supported.proposals[0].supports, 1);
  assert.equal(supported.supporters["proposal-1"][0].id, user.id);

  const saved = applySavedState(supported, user.id, "proposal-1", true);
  assert.deepEqual(saved.savedByUser[user.id], ["proposal-1"]);

  const liked = applyCommentLikeState(saved, user.id, "comment-1", true, 1);
  assert.deepEqual(liked.likedCommentsByUser[user.id], ["comment-1"]);
  assert.equal(liked.comments[0].likes, 1);
});

test("local persistence serializes UI preferences only", async () => {
  const { serializeUiPreferences } = await import("../src/lib/client-platform-state.ts");
  const serialized = serializeUiPreferences({
    view: "saved",
    query: "xadrez",
    themeFilter: "Esportes",
    statusFilter: "analysis",
    sort: "supports",
    proposals: [{ id: "secret-domain-data" }],
    accounts: [{ password: "não-pode-vazar" }],
    user: { id: "private-user" },
  });
  const parsed = JSON.parse(serialized);

  assert.deepEqual(Object.keys(parsed).sort(), ["query", "sort", "statusFilter", "themeFilter", "view"]);
  assert.equal(serialized.includes("secret-domain-data"), false);
  assert.equal(serialized.includes("não-pode-vazar"), false);
  assert.equal(serialized.includes("private-user"), false);
});

test("older proposal pages merge without duplicating rows or losing personal interactions", async () => {
  const { mergePlatformPage } = await import("../src/lib/client-platform-state.ts");
  const page = (proposals: Array<{ id: string; supports: number }>, cursor: string | null, comments: Array<{ id: string }>, commentCursorsByProposal: Record<string, string | null>) => ({
    proposals,
    comments,
    activities: [],
    notifications: [],
    commentCursorsByProposal,
    supportedByUser: { student: ["recent"] },
    savedByUser: { student: ["saved-recent"] },
    likedCommentsByUser: { student: ["liked-recent"] },
    supportersByProposal: {},
    chapas: [],
    activityFeedbacks: {},
    chapaQuestions: [],
    nextProposalCursor: cursor,
  });
  const merged = mergePlatformPage(
    page([{ id: "recent", supports: 1 }], "cursor-1", [{ id: "new-comment" }], { recent: "comments-1" }),
    page([{ id: "older", supports: 2 }], "cursor-2", [{ id: "old-comment" }], { older: "comments-2" }),
    "student",
  );

  assert.deepEqual(merged.proposals.map(({ id }) => id), ["recent", "older"]);
  assert.deepEqual(merged.supportedByUser.student, ["recent"]);
  assert.deepEqual(merged.savedByUser.student, ["saved-recent"]);
  assert.deepEqual(merged.likedCommentsByUser.student, ["liked-recent"]);
  assert.deepEqual(merged.comments.map(({ id }) => id), ["old-comment", "new-comment"]);
  assert.deepEqual(merged.commentCursorsByProposal, { recent: "comments-1", older: "comments-2" });
  assert.equal(merged.nextProposalCursor, "cursor-2");
});
