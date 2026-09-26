import "server-only";

import { OAuth2Client } from "google-auth-library";

export function getGoogleOAuthSettings() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, redirectUri, client: new OAuth2Client(clientId, clientSecret, redirectUri) };
}
