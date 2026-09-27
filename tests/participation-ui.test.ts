import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const shell = readFileSync("src/components/gefshell.tsx", "utf8");
const styles = readFileSync("src/app/globals.css", "utf8");

test("new proposals use named authorship and avatars are removed", () => {
  assert.doesNotMatch(shell, /Publicar anonimamente|Comentar anonimamente|function Avatar\(|<Avatar\b/);
  assert.match(readFileSync("src/app/api/proposals/route.ts", "utf8"), /anonymous:\s*false/);
  assert.match(readFileSync("src/app/api/proposals/[id]/comments/route.ts", "utf8"), /anonymous:\s*false/);
  assert.match(styles, /\.saved-empty \.primary-button\{align-self:center;width:auto/);
  assert.match(styles, /\.proposal-card \.save-button,\.context-proposal-meta \.save-button\{display:inline-flex\}/);
});

test("proposal creation navigates to and scrolls the new proposal into view", () => {
  assert.match(shell, /pendingProposalScrollId/);
  assert.match(shell, /scrollIntoView\(/);
  assert.match(shell, /id=\{`proposal-\$\{proposal\.id\}`\}/);
  assert.match(shell, /setQuery\(""\)/);
});

test("notifications can open proposals outside the first paginated snapshot page", () => {
  assert.match(shell, /fetch\(`\/api\/proposals\/\$\{id\}`/);
  assert.match(shell, /fetch\(`\/api\/proposals\/\$\{id\}\/comments`/);
  assert.match(shell, /setPendingProposalScrollId\(id\)/);
});

test("opening the proposal composer scrolls the form into view", () => {
  assert.match(shell, /id="proposal-composer"/);
  assert.match(shell, /document\.getElementById\("proposal-composer"\).*scrollIntoView/s);
  assert.match(shell, /function openComposer\(/);
});

test("proposal authors can cancel eligible proposals through an authenticated route", () => {
  const routePath = "src/app/api/proposals/[id]/cancel/route.ts";
  assert.equal(existsSync(routePath), true);
  const route = readFileSync(routePath, "utf8");
  assert.match(route, /getSessionUser/);
  assert.match(route, /cancelProposal\(/);
  assert.match(route, /canCancelProposal\(/);
  assert.match(shell, /Cancelar proposta/);
});

test("cancelled proposals retain history and close the comment composer", () => {
  assert.match(shell, /comments-closed/);
  assert.match(shell, /proposal\.status === "cancelled"/);
});

test("notifications have categories, filters, and actionable destinations", () => {
  assert.match(shell, /filterNotifications\(/);
  assert.match(shell, /getNotificationDestination\(/);
  assert.match(shell, /openNotification\(/);
  assert.match(shell, /fetch\(`\/api\/activities\/\$\{destination\.activityId\}`/);
  assert.match(shell, /notification\.type/);
  assert.match(readFileSync("src/lib/platform-types.ts", "utf8"), /type NotificationType/);
  assert.match(readFileSync("db/migrations/0005_participation_workflows.sql", "utf8"), /recipient_role TEXT/);
  assert.match(styles, /\.notification-icon\.comment/);
});

test("agenda uses the local current date and validates activity dates", () => {
  assert.doesNotMatch(shell, /2026-09-08|useState\("2026-09"\)|useState\("2026-09-15"\)/);
  assert.match(shell, /localDateKey\(new Date\(\)\)/);
  assert.match(shell, /isValidDateKey\(/);
  assert.match(shell, /className="calendar-today"/);
  assert.match(shell, /Aguardando atualização/);
  assert.match(shell, /activity-no-proposals/);
  assert.match(shell, /type="date"[^>]*min=/);
});

test("GEF overview prioritizes actionable work and real topic counts", () => {
  assert.match(shell, /className="gef-task-list"/);
  assert.match(shell, /className="gef-theme-bars"/);
  assert.match(shell, /Iniciar análise|Iniciar desenvolvimento|Agendar atividade/);
  assert.match(shell, /\/brand\/gef\.png/);
});

test("Google login verifies the allowed institutional identity on the server", () => {
  const startPath = "src/app/api/auth/google/route.ts";
  const callbackPath = "src/app/api/auth/google/callback/route.ts";
  assert.equal(existsSync(startPath), true);
  assert.equal(existsSync(callbackPath), true);
  const callback = readFileSync(callbackPath, "utf8");
  assert.match(callback, /verifyIdToken/);
  assert.match(callback, /isAllowedGoogleIdentity\(/);
  assert.match(callback, /nonce/);
  assert.match(shell, /Continuar com Google/);
});

test("student password fallback is gated and new accounts still require Google", () => {
  const signup = readFileSync("src/app/api/auth/signup/route.ts", "utf8");
  const login = readFileSync("src/app/api/auth/login/route.ts", "utf8");
  assert.match(signup, /status:\s*410/);
  assert.match(login, /canUsePasswordLogin/);
  assert.match(login, /STUDENT_PASSWORD_AUTH_ENABLED === "true"/);
  assert.doesNotMatch(shell, /Criar conta|Criar minha conta|onSignup/);
  assert.match(shell, /Novos cadastros continuam dependendo da conta escolar verificada/);
});
