CREATE TABLE IF NOT EXISTS request_rate_limits (
  bucket_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS request_rate_limits_expires_at_idx ON request_rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS proposal_supports_created_at_idx ON proposal_supports(proposal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS proposal_supports_user_created_idx ON proposal_supports(user_id, created_at, proposal_id);
CREATE INDEX IF NOT EXISTS proposal_saves_user_created_idx ON proposal_saves(user_id, created_at, proposal_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_comment_idx ON comment_likes(user_id, comment_id);
CREATE INDEX IF NOT EXISTS activity_feedbacks_activity_created_idx ON activity_feedbacks(activity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_feedbacks_user_created_idx ON activity_feedbacks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_feedbacks_created_idx ON activity_feedbacks(created_at DESC);
