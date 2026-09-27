import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { query } from "./db.ts";

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwarded && isIP(forwarded) ? forwarded : "unknown";
}

// ponytail: fixed windows permit a boundary burst; use a token bucket only if traffic shows that matters.
export async function enforceRequestLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
  userId?: string,
) {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("INVALID_RATE_LIMIT_POLICY");
  }
  const address = clientAddress(request);
  if (process.env.NODE_ENV !== "production" && address === "unknown" && !userId) return null;
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.DATABASE_URL;
  if (!secret) throw new Error("RATE_LIMIT_SECRET is not configured.");
  const partition = userId ? `user:${userId}` : `ip:${address}`;
  const bucketHash = createHmac("sha256", secret).update(`${scope}\0${partition}`).digest("hex");
  const rows = await query<{ request_count: number; retry_after: number }>(
    `WITH cleanup AS (
       DELETE FROM request_rate_limits
       WHERE bucket_hash IN (
         SELECT bucket_hash FROM request_rate_limits
         WHERE bucket_hash <> $1 AND expires_at <= now()
         ORDER BY expires_at
         LIMIT 20
       )
       RETURNING bucket_hash
     )
     INSERT INTO request_rate_limits (bucket_hash, window_started_at, request_count, expires_at)
     SELECT $1, now(), 1, now() + make_interval(secs => $3::int)
     FROM (SELECT count(*) FROM cleanup) AS cleaned
     ON CONFLICT (bucket_hash) DO UPDATE SET
       request_count = CASE
         WHEN request_rate_limits.expires_at <= now() THEN 1
         ELSE LEAST(request_rate_limits.request_count + 1, $2::int + 1)
       END,
       window_started_at = CASE
         WHEN request_rate_limits.expires_at <= now() THEN now()
         ELSE request_rate_limits.window_started_at
       END,
       expires_at = CASE
         WHEN request_rate_limits.expires_at <= now() THEN now() + make_interval(secs => $3::int)
         ELSE request_rate_limits.expires_at
       END
     RETURNING request_count, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (expires_at - now()))))::int AS retry_after`,
    [bucketHash, limit, windowSeconds],
  );

  if (rows[0].request_count <= limit) return null;
  return Response.json(
    { error: "Muitas tentativas. Aguarde antes de tentar novamente." },
    { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(rows[0].retry_after) } },
  );
}
