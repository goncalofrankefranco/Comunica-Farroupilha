export type LegacyLinkCredentials = { username: string; password: string };

export function parseLegacyLinkCredentials(value: unknown): LegacyLinkCredentials | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const body = value as Record<string, unknown>;
  if (typeof body.username !== "string" || typeof body.password !== "string") return null;

  const username = body.username.trim();
  if (!username || username.length > 160 || !body.password || body.password.length > 256) return null;
  return { username, password: body.password };
}
