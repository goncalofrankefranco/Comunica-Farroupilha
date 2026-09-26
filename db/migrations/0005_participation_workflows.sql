ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
  CHECK (status IN ('received', 'analysis', 'development', 'scheduled', 'completed', 'archived', 'cancelled'));

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS notification_type TEXT NOT NULL DEFAULT 'system'
    CHECK (notification_type IN ('proposal', 'comment', 'activity', 'system')),
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recipient_role TEXT CHECK (recipient_role IN ('student', 'gef'));

UPDATE notifications n
SET notification_type = CASE
  WHEN n.activity_id IS NOT NULL THEN 'activity'
  WHEN n.dedupe_key LIKE 'comment:%' THEN 'comment'
  WHEN n.dedupe_key LIKE 'proposal:%' THEN 'proposal'
  ELSE 'system'
END;

UPDATE notifications n
SET proposal_id = a.proposal_id
FROM activities a
WHERE n.activity_id = a.id;

UPDATE notifications n
SET proposal_id = p.id
FROM proposals p
WHERE n.dedupe_key LIKE 'proposal:' || p.id::text || ':%';

UPDATE notifications n
SET proposal_id = c.proposal_id
FROM comments c
WHERE n.dedupe_key LIKE 'comment:' || c.id::text || ':%';

UPDATE notifications SET recipient_role = 'student' WHERE notification_type = 'activity';
UPDATE notifications SET recipient_role = 'gef'
WHERE notification_type = 'proposal' AND dedupe_key LIKE 'proposal:%:created';

UPDATE notifications n
SET recipient_user_id = p.author_id
FROM proposals p
WHERE n.notification_type = 'proposal'
  AND n.recipient_role IS NULL
  AND n.proposal_id = p.id
  AND p.author_id IS NOT NULL;

UPDATE notifications n
SET recipient_role = 'gef'
FROM comments c
WHERE n.notification_type = 'comment'
  AND n.dedupe_key = 'comment:' || c.id::text || ':created'
  AND c.author_role = 'student';

UPDATE notifications n
SET recipient_user_id = p.author_id
FROM comments c
JOIN proposals p ON p.id = c.proposal_id
WHERE n.notification_type = 'comment'
  AND n.dedupe_key = 'comment:' || c.id::text || ':created'
  AND c.author_role = 'gef'
  AND p.author_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_recipient_user_idx
  ON notifications(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_recipient_role_idx
  ON notifications(recipient_role, created_at DESC);
