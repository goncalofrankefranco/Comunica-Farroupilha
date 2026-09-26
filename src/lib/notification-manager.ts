import type { QueryResultRow } from "@neondatabase/serverless";
import type { TransactionQuery } from "./db.ts";
import type { NotificationRecord, NotificationType, UserRole } from "./platform-types.ts";

export type NotificationInput = {
  dedupeKey: string;
  title: string;
  body: string;
  type: NotificationType;
  activityId?: string;
  proposalId?: string;
  recipientUserId?: string;
  recipientRole?: UserRole;
};

export type NotificationRow = QueryResultRow & {
  id: string;
  title: string;
  body: string;
  notification_type?: NotificationType;
  activity_id: string | null;
  proposal_id?: string | null;
  created_at: Date | string;
  read: boolean;
  dedupe_key: string | null;
  occurrence_count: number | string;
};

function timestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function displayTimestamp(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export async function createNotification(tx: TransactionQuery, input: NotificationInput) {
  await tx(
    `INSERT INTO notifications
       (id, title, body, notification_type, activity_id, proposal_id, recipient_user_id, recipient_role, dedupe_key, occurrence_count)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 1)
     ON CONFLICT (dedupe_key) DO UPDATE SET
       title = EXCLUDED.title,
       body = EXCLUDED.body,
       notification_type = EXCLUDED.notification_type,
       activity_id = EXCLUDED.activity_id,
       proposal_id = EXCLUDED.proposal_id,
       recipient_user_id = EXCLUDED.recipient_user_id,
       recipient_role = EXCLUDED.recipient_role,
       occurrence_count = notifications.occurrence_count + 1,
       created_at = now()`,
    [input.title, input.body, input.type, input.activityId ?? null, input.proposalId ?? null, input.recipientUserId ?? null, input.recipientRole ?? null, input.dedupeKey],
  );
}

export function collapseNotifications(rows: NotificationRow[]) {
  const groups = new Map<string, NotificationRecord>();
  for (const row of rows) {
    const key = row.dedupe_key ?? `${row.title}\u0000${row.body}`;
    const current = groups.get(key);
    const occurrences = Number(row.occurrence_count ?? 1);
    if (!current) {
      groups.set(key, {
        id: row.id,
        title: row.title,
        body: row.body,
        createdAt: displayTimestamp(row.created_at),
        read: row.read,
        type: row.notification_type ?? "system",
        occurrences,
        ...(row.activity_id ? { activityId: row.activity_id } : {}),
        ...(row.proposal_id ? { proposalId: row.proposal_id } : {}),
      });
      continue;
    }
    current.occurrences = (current.occurrences ?? 1) + occurrences;
    current.read = current.read && row.read;
    if (timestamp(row.created_at) > timestamp(current.createdAt)) current.createdAt = displayTimestamp(row.created_at);
  }
  return Array.from(groups.values());
}

export function notificationKey(resource: string, id: string, event: string) {
  return `${resource}:${id}:${event}`;
}
