import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canCancelProposal,
  filterNotifications,
  getNotificationDestination,
  isAllowedGoogleIdentity,
  isValidDateKey,
  localDateKey,
} from "../src/lib/participation-domain.ts";

test("local date keys use the calendar date without UTC shifting", () => {
  assert.equal(localDateKey(new Date(2026, 8, 26, 0, 15)), "2026-09-26");
});

test("calendar date validation rejects impossible and malformed dates", () => {
  assert.equal(isValidDateKey("2024-02-29"), true);
  assert.equal(isValidDateKey("2026-02-29"), false);
  assert.equal(isValidDateKey("2026-9-08"), false);
});

test("only the student author can cancel a proposal before it is scheduled", () => {
  const proposal = { authorId: "student-1", origin: "student" as const, status: "received" as const };
  assert.equal(canCancelProposal(proposal, "student-1", "student"), true);
  assert.equal(canCancelProposal(proposal, "student-2", "student"), false);
  assert.equal(canCancelProposal(proposal, "student-1", "gef"), false);
  assert.equal(canCancelProposal({ ...proposal, status: "scheduled" }, "student-1", "student"), false);
});

test("notification destinations open the linked activity or proposal", () => {
  assert.deepEqual(getNotificationDestination({ type: "activity", activityId: "activity-1", proposalId: "proposal-1" }), {
    view: "agenda",
    activityId: "activity-1",
  });
  assert.deepEqual(getNotificationDestination({ type: "comment", proposalId: "proposal-1" }), {
    view: "proposals",
    proposalId: "proposal-1",
  });
  assert.equal(getNotificationDestination({ type: "system" }), undefined);
});

test("notification filters apply category and unread selection together", () => {
  const notifications = [
    { id: "1", type: "proposal" as const, read: false },
    { id: "2", type: "comment" as const, read: false },
    { id: "3", type: "comment" as const, read: true },
  ];
  assert.deepEqual(filterNotifications(notifications, "comment", true).map((item) => item.id), ["2"]);
  assert.deepEqual(filterNotifications(notifications, "all", false).map((item) => item.id), ["1", "2", "3"]);
});

test("Google identity requires a verified email and exact hosted domain", () => {
  const claims = { email: "aluna@farroups.com.br", email_verified: true, hd: "farroups.com.br", sub: "google-sub" };
  assert.equal(isAllowedGoogleIdentity(claims), true);
  assert.equal(isAllowedGoogleIdentity({ ...claims, hd: "farroupilha.com.br" }), false);
  assert.equal(isAllowedGoogleIdentity({ ...claims, email: "aluna@farroups.com.br.evil" }), false);
  assert.equal(isAllowedGoogleIdentity({ ...claims, email: "aluna@@farroups.com.br" }), false);
  assert.equal(isAllowedGoogleIdentity({ ...claims, email_verified: false }), false);
  assert.equal(isAllowedGoogleIdentity({ ...claims, sub: "" }), false);
});
