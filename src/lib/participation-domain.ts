export type NotificationType = "proposal" | "comment" | "activity" | "system";
export type NotificationFilter = "all" | NotificationType;

export function localDateKey(date: Date) {
  if (Number.isNaN(date.getTime())) throw new RangeError("A data precisa ser válida.");
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isValidDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function canCancelProposal(
  proposal: { authorId: string; origin?: "student" | "gef"; status: string },
  userId: string,
  role: "student" | "gef",
) {
  return role === "student" && proposal.origin === "student" && proposal.authorId === userId &&
    ["received", "analysis", "development"].includes(proposal.status);
}

export function getNotificationDestination(notification: {
  type: NotificationType;
  activityId?: string;
  proposalId?: string;
}) {
  if (notification.type === "activity" && notification.activityId) {
    return { view: "agenda" as const, activityId: notification.activityId };
  }
  if (notification.proposalId) return { view: "proposals" as const, proposalId: notification.proposalId };
  return undefined;
}

export function filterNotifications<T extends { type: NotificationType; read: boolean }>(
  notifications: readonly T[],
  filter: NotificationFilter,
  unreadOnly: boolean,
) {
  return notifications.filter((notification) =>
    (filter === "all" || notification.type === filter) && (!unreadOnly || !notification.read));
}

export function isAllowedGoogleIdentity(claims: {
  email?: unknown;
  email_verified?: unknown;
  hd?: unknown;
  sub?: unknown;
}, expectedDomain = "farroups.com.br") {
  const email = typeof claims.email === "string" ? claims.email.trim() : "";
  const domain = expectedDomain.toLowerCase();
  const separator = email.indexOf("@");
  return claims.email_verified === true &&
    typeof claims.sub === "string" && claims.sub.trim().length > 0 &&
    typeof claims.hd === "string" && claims.hd.toLowerCase() === domain &&
    email.length <= 254 && separator > 0 && separator === email.lastIndexOf("@") && email.slice(separator + 1).toLowerCase() === domain;
}
