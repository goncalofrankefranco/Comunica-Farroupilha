import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { getPlatformStore, type PlatformUser } from "@/lib/platform-store";

const SESSION_COOKIE = "comunica_session";
const SESSION_TTL = 60 * 60 * 24 * 7;

function getSessionsFilePath(): string | null {
  try {
    if (process.env.VERCEL) {
      return path.join("/tmp", "comunica-sessions.json");
    }
    const dir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, "sessions.json");
  } catch {
    return null;
  }
}

function loadSessionsFromDisk(): Map<string, string> {
  const filePath = getSessionsFilePath();
  const map = new Map<string, string>();
  if (!filePath) return map;
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, string>;
      for (const [token, userId] of Object.entries(data)) {
        map.set(token, userId);
      }
    }
  } catch {
    // Non-blocking fallback
  }
  return map;
}

function saveSessionsToDisk(map: Map<string, string>) {
  const filePath = getSessionsFilePath();
  if (!filePath) return;
  try {
    const obj: Record<string, string> = {};
    for (const [token, userId] of map.entries()) {
      obj[token] = userId;
    }
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf-8");
  } catch {
    // Non-blocking fallback
  }
}

const globalForSessions = globalThis as typeof globalThis & { __comunicaSessions?: Map<string, string> };
if (!globalForSessions.__comunicaSessions) {
  globalForSessions.__comunicaSessions = loadSessionsFromDisk();
}

const sessions = globalForSessions.__comunicaSessions as Map<string, string>;

export async function startSession(user: PlatformUser) {
  const tokenPayload = Buffer.from(JSON.stringify({ id: user.id, name: user.name, turma: user.turma, role: user.role })).toString("base64url");
  const token = `${randomUUID()}.${tokenPayload}`;
  sessions.set(token, user.id);
  saveSessionsToDisk(sessions);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL,
  });
  return token;
}

export async function getSessionUser(): Promise<PlatformUser | undefined> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return undefined;
  let userId = sessions.get(token);
  if (!userId) {
    const reloaded = loadSessionsFromDisk();
    userId = reloaded.get(token);
    if (userId) sessions.set(token, userId);
  }
  const store = getPlatformStore();
  if (userId) {
    const found = store.accounts.find((account) => account.id === userId);
    if (found) return found;
  }

  // Fallback: extract user metadata from self-contained token
  const parts = token.split(".");
  if (parts.length >= 2 && parts[1]) {
    try {
      const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as PlatformUser;
      if (decoded && decoded.id && decoded.name) {
        const existing = store.accounts.find((account) => account.id === decoded.id || account.name.toLowerCase() === decoded.name.toLowerCase());
        if (!existing) {
          store.accounts.push({
            id: decoded.id,
            name: decoded.name,
            turma: decoded.turma || "Turma não informada",
            role: decoded.role || "student",
            password: "",
          });
        }
        return decoded;
      }
    } catch {}
  }

  return undefined;
}

export async function endSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    sessions.delete(token);
    saveSessionsToDisk(sessions);
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
