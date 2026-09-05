# Experiência de Participação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o `/app` em uma demo de participação clara, acessível e acionável, preservando a landing, a marca original e o código da área “Chapas” sem ativá-la nesta entrega.

**Architecture:** Manter o App Router e o store em memória da demo, mas separar regras puras de domínio dos componentes client-side. A interface continuará sendo composta por `GEFShell`, com módulos focados para autenticação, propostas e visão do GEF; Route Handlers cuidarão de sessão, OAuth, notificações e mutações. O estado local será otimista apenas quando houver rollback e feedback visível, e a sessão HttpOnly será a fonte de autenticação.

**Tech Stack:** Next.js 16.3.4 App Router, React 19, TypeScript, CSS existente com Archivo/Manrope, `node:crypto`, `node:test` com `--experimental-strip-types`, `google-auth-library` para validação OAuth no servidor, CUA/Browser para QA visual e de interação.

**Spec:** `docs/superpowers/specs/2026-09-05-participation-experience-design.md`

## Global Constraints

- Usar Node.js `>=22` e `pnpm@11.19.0`; não atualizar versões sem necessidade.
- Aplicar TDD: escrever cada teste de comportamento antes do código de produção, executar a falha esperada e só então implementar o mínimo.
- Preservar `src/app/page.tsx`, a landing pública, sua cópia e as marcas, salvo correção visual comprovada.
- Manter o store e as sessões em memória nesta etapa; declarar essa limitação em documentação.
- Não inventar métricas, eventos, endossos, eleições online ou estatísticas de participação.
- O domínio Google permitido é exatamente `farroups.com.br`; autorizar por `hd`, não apenas pelo sufixo do email.
- Não armazenar senhas, hashes, tokens OAuth ou segredos em `localStorage` ou respostas públicas.
- Usar `google-auth-library` apenas no servidor; não expor client secret nem ID token ao cliente após o callback.
- Manter `ChapasView`, `seedChapas` e `/api/chapas` no código. Definir `CHAPAS_ENABLED = false`, ocultar Chapas de toda navegação/renderização e redirecionar qualquer estado antigo para Propostas.
- Não adicionar banco, CMS, notificações push, chat privado ou votação eleitoral.
- Não usar botões interativos aninhados; controles terão `aria-pressed`, `aria-expanded`, nomes acessíveis e foco visível.
- Respeitar `prefers-reduced-motion`, evitar overflow horizontal e verificar desktop e mobile.
- Nenhum push, deploy ou alteração no projeto Vercel será feito automaticamente.

## File Map

### Criar

- `src/lib/participation-domain.ts`: tipos e funções puras para destinos de notificação, fila/resumo do GEF, origem da proposta e política de identidade Google.
- `src/lib/password.ts`: hash e verificação de senhas usando `node:crypto`.
- `src/lib/google-auth.ts`: configuração e helpers server-only para OAuth/OIDC do Google.
- `src/lib/client-api.ts`: helper client-side para respostas HTTP/JSON e mensagens de erro.
- `src/components/app-icon.tsx`: sistema de ícones local, incluindo estados outline/filled.
- `src/components/auth-view.tsx`: tela de entrada, criação de conta e Google institucional.
- `src/components/proposal-components.tsx`: cards, detalhe, comentários, apoiadores, composição e preview de proposta.
- `src/components/gef-dashboard.tsx`: fila de trabalho, resumo e panorama por tema.
- `src/app/api/auth/session/route.ts`: sessão pública atual.
- `src/app/api/auth/google/route.ts`: início do OAuth.
- `src/app/api/auth/google/callback/route.ts`: callback e validação do OAuth.
- `tests/participation-domain.test.ts`: testes unitários de regras puras.
- `tests/auth.test.ts`: testes de hash e identidade autorizada.
- `.env.example`: nomes das variáveis de OAuth sem valores reais.

### Modificar

- `package.json`: script `test` e dependência server-side `google-auth-library`.
- `pnpm-lock.yaml`: lockfile atualizado pelo `pnpm add`.
- `src/lib/platform-store.ts`: tipos de conta/notificação, hashes, contas Google e destinos nos seeds.
- `src/lib/session.ts`: tipos públicos e helpers necessários à sessão OAuth/local.
- `src/app/api/auth/login/route.ts`: verificar `passwordHash` no servidor.
- `src/app/api/auth/signup/route.ts`: criar conta com hash e sem expor segredo.
- `src/app/api/notifications/route.ts`: marcar uma notificação ou todas, com validação.
- `src/components/gefshell.tsx`: composição, hidratação por sessão, mutações com rollback, destinos, feature gate Chapas, agenda e navegação mobile.
- `src/app/globals.css`: estados de ação, fila GEF, painel, menu Mais, mobile e acessibilidade.
- `README.md`: fluxo OAuth, limitações da demo e comando de testes.
- `docs/backend.md`: contratos novos, segurança da sessão e configuração Google.

## Task 1: Domain Rules And Test Harness

**Files:**
- Create: `src/lib/participation-domain.ts`
- Create: `tests/participation-domain.test.ts`
- Modify: `package.json`

**Interfaces:**

```ts
export type NotificationDestination =
  | { view: "agenda"; activityId: string; proposalId?: string }
  | { view: "proposals"; proposalId: string }
  | { view: "notifications" };

export function getNotificationDestination(notification: {
  type: "activity" | "proposal" | "comment" | "system";
  activityId?: string;
  proposalId?: string;
}): NotificationDestination;

export type GefQueueItem = {
  proposalId: string;
  action: "Responder" | "Analisar" | "Mover para desenvolvimento" | "Abrir atividade" | "Ver atividade" | "Ver histórico";
  needsResponse: boolean;
};

export function getGefQueue(
  proposals: readonly ProposalRecord[],
  comments: readonly CommentRecord[],
): GefQueueItem[];

export function getGefSummary(
  proposals: readonly ProposalRecord[],
  comments: readonly CommentRecord[],
  activities: readonly ActivityRecord[],
  today: string,
): { awaitingResponse: number; toAnalyze: number; inBuild: number; nextActivityId?: string };

export function getProposalOrigin(proposal: Pick<ProposalRecord, "authorId" | "anonymous">): "Sugestão de estudante" | "Ideia do GEF";

export function toggleId(ids: readonly string[], id: string): string[];

export function isAllowedGoogleIdentity(claims: {
  email?: string;
  email_verified?: boolean;
  hd?: string;
  sub?: string;
  nonce?: string;
}, expectedDomain?: string): boolean;
```

- [ ] **Step 1: Write the failing tests.** Add literal fixtures for one activity notification, one proposal notification, one system notification, unanswered/answered proposals in each status, student and GEF authors, active and cancelled activities, password-like ids, and Google claims with missing/wrong `hd`, unverified email and missing `sub`.

```ts
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getGefQueue,
  getNotificationDestination,
  getProposalOrigin,
  isAllowedGoogleIdentity,
  toggleId,
} from "../src/lib/participation-domain.ts";

describe("participation domain", () => {
  test("activity notifications select agenda and their activity", () => {
    assert.deepEqual(getNotificationDestination({ type: "activity", activityId: "a1", proposalId: "p4" }), {
      view: "agenda",
      activityId: "a1",
      proposalId: "p4",
    });
  });

  test("proposal notifications select the proposal", () => {
    assert.deepEqual(getNotificationDestination({ type: "comment", proposalId: "p1" }), { view: "proposals", proposalId: "p1" });
  });

  test("system notifications stay in the notification center", () => {
    assert.deepEqual(getNotificationDestination({ type: "system" }), { view: "notifications" });
  });

  test("an unanswered proposal gets response priority in the GEF queue", () => {
    const proposal = { id: "p1", title: "Playlist", body: "Uma ideia", author: "Ana", authorId: "ana", anonymous: false, theme: "Música e cultura", status: "analysis", supports: 2, comments: 0, createdAt: "Agora", updatedAt: "Agora" } as const;
    assert.deepEqual(getGefQueue([proposal], []), [{ proposalId: "p1", action: "Responder", needsResponse: true }]);
  });

  test("Google access requires a verified farroups hosted domain and subject", () => {
    assert.equal(isAllowedGoogleIdentity({ email: "aluna@gmail.com", email_verified: true, hd: "gmail.com", sub: "1" }), false);
    assert.equal(isAllowedGoogleIdentity({ email: "aluna@farroups.com.br", email_verified: false, hd: "farroups.com.br", sub: "1" }), false);
    assert.equal(isAllowedGoogleIdentity({ email: "aluna@farroups.com.br", email_verified: true, hd: "farroups.com.br", sub: "1" }), true);
  });

  test("toggleId adds and removes exactly one id", () => {
    assert.deepEqual(toggleId([], "p1"), ["p1"]);
    assert.deepEqual(toggleId(["p1", "p2"], "p1"), ["p2"]);
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails for missing production exports.**

Run: `node --experimental-strip-types --test tests/participation-domain.test.ts`

Expected: FAIL because `src/lib/participation-domain.ts` does not exist yet; do not fix the failure by weakening the assertions.

- [ ] **Step 3: Add the smallest pure implementations.** Use type-only imports from `platform-store.ts`, compare `hd` case-insensitively to `farroups.com.br`, require `email_verified === true` and a non-empty `sub`, give notification target fields precedence to activity then proposal, and derive GEF action priority from missing GEF response before status.

- [ ] **Step 4: Add the test script and run the focused test.** Set `"test": "node --experimental-strip-types --test tests/participation-domain.test.ts tests/auth.test.ts"` only after the second test file exists; initially run the first file directly and confirm all domain assertions pass.

- [ ] **Step 5: Run the existing static checks.**

Run: `pnpm lint`

Run: `pnpm typecheck`

Expected: exit code 0; no landing files change.

- [ ] **Step 6: Commit the domain slice.**

```bash
git add package.json src/lib/participation-domain.ts tests/participation-domain.test.ts
git commit -m "test: define participation domain rules"
```

## Task 2: Secure Local Session And Google Institutional Login

**Files:**
- Create: `src/lib/password.ts`
- Create: `src/lib/google-auth.ts`
- Create: `src/app/api/auth/session/route.ts`
- Create: `src/app/api/auth/google/route.ts`
- Create: `src/app/api/auth/google/callback/route.ts`
- Create: `.env.example`
- Create: `tests/auth.test.ts`
- Modify: `package.json`, `pnpm-lock.yaml`, `src/lib/platform-store.ts`, `src/lib/session.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/signup/route.ts`, `src/components/gefshell.tsx`, `README.md`, `docs/backend.md`

**Interfaces:**

```ts
export function hashPassword(password: string): string;
export function verifyPassword(password: string, storedHash: string): boolean;

export function getGoogleOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};
```

- [ ] **Step 1: Write failing auth tests before changing account storage.** Cover correct/wrong password, a hash that is not equal to the plaintext, Google `hd`/verification/sub policy, and public user serialization without `passwordHash`, `googleSub` or OAuth token.

```ts
import assert from "node:assert/strict";
import test from "node:test";

test("password hashes verify without storing plaintext", () => {
  const stored = hashPassword("demo1234");
  assert.notEqual(stored, "demo1234");
  assert.equal(verifyPassword("demo1234", stored), true);
  assert.equal(verifyPassword("wrong-password", stored), false);
});
```

- [ ] **Step 2: Run the auth test and confirm the expected missing-export failure.**

Run: `node --experimental-strip-types --test tests/auth.test.ts`

Expected: FAIL because `src/lib/password.ts` and the new account contract do not exist.

- [ ] **Step 3: Add `google-auth-library` using the project package manager.**

Run: `pnpm add google-auth-library`

Keep the dependency server-only by importing it only from route/lib files that never enter a client component.

- [ ] **Step 4: Implement `src/lib/password.ts` with `node:crypto`.** Use a random salt, `scryptSync`, encoded salt/hash storage, `timingSafeEqual`, password length validation at account creation, and a clear false result for malformed stored hashes.

- [ ] **Step 5: Change internal account records and seed creation.** Replace plaintext `password` with `passwordHash`, add `provider: "password" | "google"`, optional `googleSub` and `email`, hash the two demo passwords when creating the store, and keep `publicUser()` restricted to public fields.

- [ ] **Step 6: Change login/signup Route Handlers to authenticate on the server.** Keep current JSON error statuses, call `verifyPassword()`/`hashPassword()`, create HttpOnly sessions, and never accept a client-supplied user object as authentication.

- [ ] **Step 7: Add `GET /api/auth/session`.** Return `Response.json({ user: publicUser(user) })` for a valid session and `Response.json({ user: null })` otherwise; do not leak account internals.

- [ ] **Step 8: Implement Google OAuth start and callback.** Use environment variables, a fixed safe return path `/app`, a short-lived HttpOnly cookie carrying state/nonce/PKCE verifier, authorization code flow, and `OAuth2Client.verifyIdToken`. Validate state, nonce, issuer, audience, expiry, `email_verified`, exact `hd`, and non-empty `sub`; use `sub` as the account key and redirect only with sanitized `auth=success` or error codes.

- [ ] **Step 9: Update client auth hydration.** Remove client-side password comparison and account persistence. Login/signup await Route Handler JSON, use returned public user, and on mount fetch `/api/auth/session` so an OAuth callback becomes an authenticated app state. Remove legacy persisted `user`/`accounts` from the restored state while preserving non-secret demo content.

- [ ] **Step 10: Add the Google button and configuration note to `AuthView`.** The button links to `/api/auth/google`; missing configuration renders a clear non-secret error returned by the callback. The copy must say institutional Google account and `@farroups.com.br`, without claiming live availability when environment variables are absent.

- [ ] **Step 11: Run the focused tests and static checks.**

Run: `node --experimental-strip-types --test tests/auth.test.ts`

Run: `pnpm test`

Run: `pnpm lint`

Run: `pnpm typecheck`

Expected: all tests pass and no password appears in serialized client state.

- [ ] **Step 12: Commit the auth slice.**

```bash
git add package.json pnpm-lock.yaml .env.example src/lib/password.ts src/lib/google-auth.ts src/lib/platform-store.ts src/lib/session.ts src/app/api/auth src/components/gefshell.tsx tests/auth.test.ts README.md docs/backend.md
git commit -m "feat: secure demo auth and prepare Google login"
```

## Task 3: Targeted Notifications And Destination Navigation

**Files:**
- Modify: `src/lib/platform-store.ts`, `src/app/api/notifications/route.ts`, `src/components/gefshell.tsx`, `src/lib/participation-domain.ts`, `tests/participation-domain.test.ts`

**Interfaces:**

```ts
type NotificationRecord = {
  id: string;
  type: "activity" | "proposal" | "comment" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  proposalId?: string;
  activityId?: string;
};

// PATCH /api/notifications
// body omitted or {} -> mark all
// body { id: string, read: boolean } -> update one
```

- [ ] **Step 1: Extend the notification fixtures and test expected destinations.** Add `type` and `proposalId` to n2/n3, proposal ids to new proposal/comment notifications, and the existing activity id to activity notifications. Add a unit case for a missing target remaining in the center.

- [ ] **Step 2: Run the focused domain test before the store/API change.**

Run: `node --experimental-strip-types --test tests/participation-domain.test.ts`

Expected: the new fixture assertion fails because the current records do not have complete target metadata.

- [ ] **Step 3: Update `NotificationRecord` and every notification producer.** Set notification type and related proposal/activity ids in `createProposal`, `addComment`, `createActivity`, and seeds. Keep anonymous author privacy in body text.

- [ ] **Step 4: Implement individual PATCH handling.** Parse an optional JSON body, validate `id` and boolean `read`, return 400 for malformed input and 404 for unknown ids, preserve the existing no-body mark-all behavior, and require a session.

- [ ] **Step 5: Replace the client-only notification click handler.** Optimistically mark only the clicked item read, call `PATCH` with its id, use `getNotificationDestination()`, set `view`, `selectedId`, `agendaProposalId` and `agendaActivityId` as appropriate, and show an error notice if persistence fails without undoing the navigation context.

- [ ] **Step 6: Add activity selection state and destination cues.** Notification rows expose an arrow and accessible label describing the destination; activity rows open the activity detail and related proposal, while proposal/comment/status rows open the selected proposal conversation.

- [ ] **Step 7: Run focused tests and static checks.**

Run: `pnpm test`

Run: `pnpm lint`

Run: `pnpm typecheck`

- [ ] **Step 8: Commit the notification slice.**

```bash
git add src/lib/platform-store.ts src/app/api/notifications/route.ts src/lib/participation-domain.ts src/components/gefshell.tsx tests/participation-domain.test.ts
git commit -m "feat: make notifications actionable"
```

## Task 4: Correct Proposal Actions And Feedback States

**Files:**
- Create: `src/components/app-icon.tsx`
- Create: `src/components/proposal-components.tsx`
- Create: `src/lib/client-api.ts`
- Modify: `src/components/gefshell.tsx`, `src/app/globals.css`, `src/lib/participation-domain.ts`, `tests/participation-domain.test.ts`

**Interfaces:**

```tsx
type ProposalCardProps = {
  proposal: Proposal;
  selected: boolean;
  supported: boolean;
  saved: boolean;
  isGef: boolean;
  onSelect: () => void;
  onSupport: () => void;
  onSave: () => void;
  onStatus: (status: ProposalStatus) => void;
};
```

- [ ] **Step 1: Add failing behavior tests for origin and toggle semantics.** Assert that GEF-authored records render “Ideia do GEF”, student records render “Sugestão de estudante”, toggling an id is immutable, and a saved/support action has distinct active and inactive output.

- [ ] **Step 2: Run the focused test and confirm the missing behavior.**

Run: `node --experimental-strip-types --test tests/participation-domain.test.ts`

Expected: FAIL on the new origin/state cases before the helper and component changes.

- [ ] **Step 3: Extract the icon system and add filled variants.** Move `ICON_PATHS`/`Icon` to `app-icon.tsx`, add a `filled` prop that uses `fill="currentColor"` only for closed state icons such as bookmark/thumbs, and preserve existing stroke geometry for the landing-independent app.

- [ ] **Step 4: Refactor `ProposalCard` markup to remove nested buttons.** Use an outer `<article>`, a dedicated content `<button>` for selection/expansion, and sibling `<button>` controls for support/save. The save button is icon-only with `aria-pressed`, `title`, and labels “Salvar proposta”/“Remover proposta salva”; active bookmark is filled orange and never renders “Acompanhando”.

- [ ] **Step 5: Make support a real button.** Add `aria-pressed`, active filled thumb icon, “Apoiar/Apoiado” text, and updated count. Keep stop-propagation only on the sibling action controls so selecting the card remains predictable.

- [ ] **Step 6: Add `requestJson()` and rollback-aware mutations.** Await response status and JSON, update local state optimistically, show a short `role="status"` notice on success, restore the previous array/count on failure, and show `role="alert"` for errors. Apply this to save, support, status change, comment, proposal creation and activity creation.

- [ ] **Step 7: Add source labels and preserve proposal detail behavior.** Display origin, lifecycle status, conversation, GEF response, supporters and next action in the selected detail/preview. Keep anonymous authors anonymous in all labels and notifications.

- [ ] **Step 8: Update CSS for stable action geometry.** Keep the bookmark width fixed, hide only its visual text rather than its accessible name, prevent long labels from expanding cards, ensure mobile action rows wrap deliberately, and keep all controls at touch-friendly dimensions.

- [ ] **Step 9: Run tests, lint and typecheck.**

Run: `pnpm test`

Run: `pnpm lint`

Run: `pnpm typecheck`

- [ ] **Step 10: Commit the proposal interaction slice.**

```bash
git add src/components/app-icon.tsx src/components/proposal-components.tsx src/components/gefshell.tsx src/app/globals.css src/lib/participation-domain.ts tests/participation-domain.test.ts
git commit -m "fix: make proposal actions accessible and reliable"
```

## Task 5: Action-Oriented GEF Dashboard

**Files:**
- Create: `src/components/gef-dashboard.tsx`
- Modify: `src/components/gefshell.tsx`, `src/app/globals.css`, `tests/participation-domain.test.ts`

**Interfaces:**

```tsx
type GefDashboardProps = {
  proposals: Proposal[];
  comments: ProposalComment[];
  activities: Activity[];
  supporters: Record<string, Supporter[]>;
  user: User;
  selectedId: string | null;
  onSelect: (proposalId: string) => void;
  onStatus: (proposalId: string, status: ProposalStatus) => void;
  onComment: (body: string, anonymous: boolean, parentId?: string, proposalId?: string) => void;
  onCreateActivity: (activity: Activity) => void;
};
```

- [ ] **Step 1: Extend the failing queue tests.** Use literal current demo fixtures to assert missing GEF replies are first, `received` items produce “Analisar”, `development` items produce “Abrir atividade”, scheduled items produce “Ver atividade”, and completed/archived items produce “Ver histórico”. Assert summary counts use the passed `today` string and exclude cancelled activities.

- [ ] **Step 2: Run the domain tests and verify the missing queue rules fail.**

Run: `node --experimental-strip-types --test tests/participation-domain.test.ts`

Expected: FAIL until queue ordering/action rules cover all branches.

- [ ] **Step 3: Implement the dashboard using domain output.** Render derived summary blocks “Aguardam resposta”, “Para analisar”, “Em construção” and “Próxima atividade”; do not hardcode counts.

- [ ] **Step 4: Build the “Fila de trabalho”.** Add filters “Todas”, “Precisa de resposta”, “Em análise” and “Em construção”. Each row shows origin, title, theme, status, supports, comments, last update and the derived next action. Selecting a row opens the existing proposal preview/context panel.

- [ ] **Step 5: Replace the visible manual node map with “Panorama por tema”.** Render accessible horizontal bars/list items with counts and status distribution; clicking a theme filters the queue. Remove `GraphMap` from the rendered path; no map-specific code is needed for the new view.

- [ ] **Step 6: Keep GEF actions explicit.** Reuse the status mutation and activity composer, show a GEF response composer in the selected context, and preserve status/permission checks on the server.

- [ ] **Step 7: Add responsive structure.** Desktop uses the queue as the dominant open list and the panorama below/alongside it; mobile stacks summaries, filters, queue rows and selected context without creating a dense table.

- [ ] **Step 8: Run tests, lint and typecheck.**

Run: `pnpm test`

Run: `pnpm lint`

Run: `pnpm typecheck`

- [ ] **Step 9: Commit the GEF slice.**

```bash
git add src/components/gef-dashboard.tsx src/components/gefshell.tsx src/app/globals.css tests/participation-domain.test.ts
git commit -m "feat: turn GEF view into an action queue"
```

## Task 6: Navigation, Agenda And Chapas Feature Gate

**Files:**
- Modify: `src/components/gefshell.tsx`, `src/components/app-icon.tsx`, `src/app/globals.css`, `src/lib/participation-domain.ts`, `tests/participation-domain.test.ts`
- Preserve without deleting: `ChapasView`, `seedChapas`, `src/app/api/chapas/route.ts`

- [ ] **Step 1: Add a focused regression check for the feature gate.** The browser assertion will require that the authenticated UI has no visible `Chapas` nav item, no `Chapas` mobile entry and no `ChapasView` content while the source still contains the existing component and API. The source-preservation check is read-only inspection, not a production feature assertion.

- [ ] **Step 2: Run the existing test suite before UI changes.**

Run: `pnpm test`

Expected: pass, establishing that the gate is isolated from domain rules.

- [ ] **Step 3: Add `const CHAPAS_ENABLED = false` with a concise `ponytail:` comment.** Keep `View` including `"chapas"` so dormant code remains type-compatible; make `changeView("chapas")` fall back to `"proposals"`, guard desktop/mobile navigation and guard the render branch.

- [ ] **Step 4: Limit mobile bottom navigation to five destinations.** Keep Propostas, Acompanhando, Agenda and Notificações visible; add “Mais” only when at least one secondary destination is available. With the gate off, students have no Chapas entry; GEF users see Visão do GEF in Mais.

- [ ] **Step 5: Finish notification destination state.** Add `agendaActivityId`, show selected activity detail, and make “Ver proposta” return to the related proposal without losing the activity context.

- [ ] **Step 6: Fix calendar today handling.** Compare calendar dates to the browser’s current local date instead of the hardcoded `2026-09-08`, keep the demo activity on its seeded date, and visually distinguish event days from today.

- [ ] **Step 7: Run tests, lint and typecheck.**

Run: `pnpm test`

Run: `pnpm lint`

Run: `pnpm typecheck`

- [ ] **Step 8: Commit navigation and agenda changes.**

```bash
git add src/components/gefshell.tsx src/components/app-icon.tsx src/app/globals.css src/lib/participation-domain.ts tests/participation-domain.test.ts
git commit -m "feat: streamline app navigation and pause chapas"
```

## Task 7: Visual, Responsive And Accessibility Polish

**Files:**
- Modify: `src/app/globals.css`, `src/components/gefshell.tsx`, `src/components/auth-view.tsx`, `src/components/proposal-components.tsx`, `src/components/gef-dashboard.tsx`

- [ ] **Step 1: Compare the first app viewport to the approved feed concept.** Check logo treatment, top bar, heading scale, search/filters, card anatomy, bookmark active state and support active state. Record any mismatch before editing CSS.

- [ ] **Step 2: Apply the approved visual tokens.** Retain `#0758b1`, `#17365d`, `#f45a1a`, white and pale blue-gray surfaces, Archivo/Manrope, restrained radii and low elevation. Do not warm the background or add decorative gradients/orbs.

- [ ] **Step 3: Style the GEF queue against the approved GEF concept.** Keep the queue dominant, use stable row heights, accessible status indicators plus text, a selected context panel, and a restrained topic panorama. Remove styles that only supported the old map when no longer used.

- [ ] **Step 4: Audit controls.** Every icon-only control gets an accessible name and tooltip/title; every selection uses `aria-selected` or `aria-pressed`; every form input has a label; error and success messages have the correct live-region role; focus rings remain visible against blue and white.

- [ ] **Step 5: Audit responsive behavior.** At 1440px and 390px widths verify no horizontal scroll, no clipped action labels, no overflowing notification text, no nested card appearance, no bottom-nav overlap, and no unintended layout shift during hydration.

- [ ] **Step 6: Run static checks and the production build.**

Run: `pnpm test`

Run: `pnpm lint`

Run: `pnpm typecheck`

Run: `pnpm build`

- [ ] **Step 7: Commit visual/accessibility polish.**

```bash
git add src/app/globals.css src/components/gefshell.tsx src/components/auth-view.tsx src/components/proposal-components.tsx src/components/gef-dashboard.tsx
git commit -m "style: polish participation app across viewports"
```

## Task 8: Browser Verification, Documentation And Handoff

**Files:**
- Modify: `README.md`, `docs/backend.md`
- Do not commit: screenshots, traces, browser state, temporary scripts or reports.

- [ ] **Step 1: Start a local dev server on an unused port.**

Run: `pnpm dev --port 3001`

Keep the process running only for verification and stop it before handoff.

- [ ] **Step 2: Use the Browser/CUA path first.** The flow under test is: `/app` loads -> local login succeeds -> save/support change real state -> notification click opens agenda/proposal -> GEF filters and selects a queue item -> mobile navigation remains usable. Use the Browser session already available; use Playwright CLI only if Browser/CUA cannot capture a mobile viewport, and record the exact fallback reason.

- [ ] **Step 3: Run the required page checks.** Verify page title/URL, meaningful DOM content, no framework overlay, no relevant console errors, visible key controls, and a screenshot of the first viewport.

- [ ] **Step 4: Exercise the student flow.**

1. Log in with the seeded demo account through the UI.
2. Save a proposal and assert the bookmark has `aria-pressed="true"`, filled visual state and no visible “Acompanhando” label in the card.
3. Open Acompanhando and assert the proposal appears; remove it and assert it disappears.
4. Support the proposal and assert `Apoiado`, `aria-pressed="true"`, updated count and supporter row; toggle again and assert rollback to inactive.
5. Open Notificações; click the activity notification and assert Agenda plus the selected activity; return and click a proposal notification and assert Propostas plus the selected proposal.
6. Mark one notification read and assert only that item changes; use “Marcar todas” and assert the counter reaches zero.

- [ ] **Step 5: Exercise the GEF flow.** Log out, log in with the seeded GEF demo account, assert there is no Chapas navigation entry, open Visão do GEF, filter “Precisa de resposta”, select a proposal, post a GEF response, advance one status and create an activity. Assert the queue, context and agenda update without runtime errors.

- [ ] **Step 6: Capture responsive evidence.** Capture desktop and mobile screenshots outside the repo. Inspect the accepted GEF concept and edited feed/notifications concept with `view_image`, inspect the latest implementation screenshots with `view_image`, and write a five-point fidelity ledger covering copy, layout, typography, palette, icon states, responsive behavior and container model.

- [ ] **Step 7: Update documentation.** Document `pnpm test`, Google environment variables, exact `hd` policy, local demo limitations, the inactive Chapas gate and the fact that deployment remains manual.

- [ ] **Step 8: Run the full completion checks.**

Run: `pnpm test`

Run: `pnpm lint`

Run: `pnpm typecheck`

Run: `pnpm build`

Run: `git diff --check`

Expected: all commands exit 0, no untracked QA artifacts remain, and the worktree contains only intentional source/documentation changes.

- [ ] **Step 9: Commit documentation and final verified state.**

```bash
git add README.md docs/backend.md
git commit -m "docs: record participation app verification"
```

## Plan Self-Review

- Spec coverage: notification destinations, save/support states, authentication, GEF queue/panorama, agenda date fix, mobile navigation, accessibility, responsive QA and documented limitations each have a task.
- Chapas suspension: explicitly gated in Task 6, with source/API preservation and no deletion.
- Security coverage: server-side password hashing, HttpOnly sessions, OAuth state/nonce/PKCE, token claim checks and no secret persistence are in Task 2.
- Test coverage: pure rules and auth are test-first; browser verification covers consumer-visible workflows that do not require a new test runner.
- Lacunas: nenhuma etapa depende de texto provisório ou decisão escondida para ser executada.
- Type consistency: the domain types are defined in Task 1 and reused by Tasks 3–6; account/session changes are defined in Task 2 before client hydration changes consume them.
