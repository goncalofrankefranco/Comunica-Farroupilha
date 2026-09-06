import assert from "node:assert/strict";
import { test } from "node:test";

test("comment likes toggle independently for each user", async () => {
  const storeModule = await import("../src/lib/platform-store.ts");
  const toggleCommentLike = (storeModule as typeof storeModule & { toggleCommentLike?: (commentId: string, userId: string) => { liked: boolean; likes: number } | null }).toggleCommentLike;

  assert.equal(typeof toggleCommentLike, "function", "The platform store should expose comment like toggling.");
  if (!toggleCommentLike) return;

  const comment = storeModule.getPlatformStore().comments[0];
  const initialLikes = comment.likes ?? 0;
  const liked = toggleCommentLike(comment.id, "comment-like-test-user");
  assert.deepEqual(liked, { liked: true, likes: initialLikes + 1 });

  const unliked = toggleCommentLike(comment.id, "comment-like-test-user");
  assert.deepEqual(unliked, { liked: false, likes: initialLikes });
});
