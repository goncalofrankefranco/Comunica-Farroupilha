import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("only verified Google identities can create or use student accounts", () => {
  const signup = read("src/app/api/auth/signup/route.ts");
  const login = read("src/app/api/auth/login/route.ts");
  const shell = read("src/components/gefshell.tsx");

  assert.match(signup, /status:\s*410/);
  assert.doesNotMatch(signup, /hashPassword|createAccount|startSession/);
  assert.match(login, /credentials\?\.user\.role\s*!==\s*["']gef["']/);
  assert.doesNotMatch(shell, /onSignup|Criar conta|Criar minha conta/);
});

test("admin seeding cannot promote a pre-existing student account", () => {
  const auth = read("src/lib/auth-repository.ts");
  const seed = read("scripts/seed-admin.ts");

  assert.match(seed, /upsertGefAccount/);
  assert.match(auth, /ON CONFLICT \(username_normalized\)[\s\S]*?WHERE users\.role = 'gef'/);
  assert.doesNotMatch(auth, /role = EXCLUDED\.role/);
});

test("platform responses do not expose other students' support identities", () => {
  const repository = read("src/lib/platform-repository.ts");
  const detail = read("src/app/api/proposals/[id]/route.ts");

  assert.match(repository, /ps\.user_id\s*=\s*\$\d+/);
  assert.match(repository, /viewerRows\[0\]\?\.role\s*===\s*["']gef["']/);
  assert.match(detail, /viewer\?\.role\s*===\s*["']gef["']/);
  assert.match(detail, /viewer\?\.id/);
});

test("disabled Chapas data is excluded from the shared platform snapshot", () => {
  const repository = read("src/lib/platform-repository.ts");
  assert.match(repository, /ELECTIONS_ENABLED\s*\?\s*query<ChapaQuestionRow>/);
});

test("auth error messages use an own-key allowlist", async () => {
  assert.equal(existsSync("src/lib/auth-errors.ts"), true);
  const { getAuthErrorMessage } = await import("../src/lib/auth-errors.ts");

  assert.equal(getAuthErrorMessage("google-domain"), "Use uma conta escolar verificada @farroups.com.br.");
  assert.equal(getAuthErrorMessage("__proto__"), "");
  assert.equal(getAuthErrorMessage("constructor"), "");
});

test("comments cannot cross proposal threads or commit after cancellation", () => {
  const repository = read("src/lib/platform-repository.ts");
  const route = read("src/app/api/proposals/[id]/comments/route.ts");
  const shell = read("src/components/gefshell.tsx");

  assert.match(repository, /SELECT[\s\S]*?FROM proposals WHERE id = \$1 FOR UPDATE/);
  assert.match(repository, /SELECT id FROM comments WHERE id = \$1 AND proposal_id = \$2/);
  assert.match(route, /COMMENT_PARENT_MISMATCH/);
  assert.match(route, /PROPOSAL_CANCELLED/);
  assert.match(shell, /reply\.proposalId === proposalId/);
  assert.match(repository, /UPDATE comments AS child SET parent_id = \$2[\s\S]*child\.proposal_id = parent\.proposal_id/);
});

test("activity creation and proposal cancellation serialize on the proposal row", () => {
  const repository = read("src/lib/platform-repository.ts");
  const createActivity = repository.slice(repository.indexOf("export async function createActivity"), repository.indexOf("export async function updateActivityStatus"));

  assert.match(createActivity, /SELECT status FROM proposals WHERE id = \$1 FOR UPDATE/);
  assert.match(createActivity, /WHERE id = \$1 AND status IN \('analysis', 'development'\)/);
});

test("public/auth write routes have a shared abuse budget", () => {
  const rateLimit = read("src/lib/rate-limit.ts");
  assert.match(rateLimit, /request_rate_limits/);
  assert.match(read("src/app/api/auth/login/route.ts"), /enforceRequestLimit/);
  assert.match(read("src/app/api/platform/route.ts"), /enforceRequestLimit/);
  assert.match(read("src/app/api/proposals/route.ts"), /enforceRequestLimit/);
  const comments = read("src/app/api/proposals/[id]/comments/route.ts");
  assert.match(comments, /enforceRequestLimit/);
  assert.match(comments, /comment-create-user/);
});

test("platform reads are cursor-paginated and proposal-associated data is bounded", () => {
  const repository = read("src/lib/platform-repository.ts");
  const route = read("src/app/api/platform/route.ts");

  assert.match(route, /searchParams\.get\(["']cursor["']\)/);
  assert.match(repository, /PROPOSAL_PAGE_SIZE \+ 1/);
  assert.match(repository, /SNAPSHOT_COMMENTS_PER_PROPOSAL = 20/);
  assert.match(repository, /LIMIT 101/);
  assert.match(repository, /commentCursorsByProposal/);
  assert.match(repository, /nextProposalCursor/);
  assert.match(read("src/components/gefshell.tsx"), /Carregar comentários anteriores/);
});
