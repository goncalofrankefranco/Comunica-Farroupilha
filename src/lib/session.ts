import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getPlatformStore, type PlatformUser } from "@/lib/platform-store";

const SESSION_COOKIE = "comunica_session";
const SESSION_TTL = 60 * 60 * 24 * 7;
const globalForSessions = globalThis as typeof globalThis & { __comunicaSessions?: Map<string, string> };
if (!globalForSessions.__comunicaSessions) globalForSessions.__comunicaSessions = new Map();

const sessions = globalForSessions.__comunicaSessions as Map<string, string>;

export async function startSession(user: PlatformUser) {
  const token = randomUUID();
  sessions.set(token, user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL });
  return token;
}

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = token ? sessions.get(token) : undefined;
  return userId ? getPlatformStore().accounts.find((account) => account.id === userId) : undefined;
}

export async function endSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) sessions.delete(token);
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}
