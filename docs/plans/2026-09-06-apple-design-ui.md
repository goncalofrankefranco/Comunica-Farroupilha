# Apple Design UI Refresh Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Repaginar a interface da plataforma Comunica Farroupilha com base na skill Apple Design, tornando-a clean, moderna e agradável através de materiais translúcidos (*frosted glass*), microinterações táteis imediatas, cantos suaves, sombras multicamadas e badges em pill, mantendo 100% da arquitetura e das funcionalidades existentes.

**Architecture:** Modificar os tokens globais e regras de componentes em `src/app/globals.css` e ajustar classes/estruturas em `src/components/gefshell.tsx` para introduzir o design system Apple. A branch dedicada `feature/apple-design-ui` preserva o isolamento para avaliação antes do merge.

**Tech Stack:** Next.js 16, React 19, CSS Moderno com Backdrop Filter, CSS Custom Properties, Turbopack, Node Test Runner.

---

### Task 1: Tokens Globais, Materiais e Microinterações Táteis no CSS

**Files:**
- Modify: `src/app/globals.css:1-252`

**Step 1: Implementar variáveis de design system Apple e feedback tátil**
- Atualizar `--app-pale` para tom neutro suave (`#f8fafc`).
- Atualizar `--app-border` para borda semitransparente suave (`rgba(0, 0, 0, 0.07)`).
- Adicionar sombras multicamadas Apple (`--shadow-card`, `--shadow-elevated`, `--shadow-modal`).
- Adicionar regra de feedback físico imediato em botões, abas e cartões clicáveis: `:active { transform: scale(0.98); }`.
- Adicionar suporte a *frosted glass* (`backdrop-filter: blur(20px) saturate(180%)`) na Topbar e nos Modais.
- Redefinir badges de status como *pills* modernos (`border-radius: 9999px`) com fundos pastéis e texto nítido.
- Suavizar inputs, textareas e selects com cantos de `10px` e anéis de foco suaves.

**Step 2: Verificar sintaxe CSS e regras de estilo**
- Run: `npx --yes pnpm run lint`
- Expected: 0 errors

**Step 3: Commit**
```bash
git add src/app/globals.css
git commit -m "style(ui): apply Apple design system tokens, frosted glass, and tactile micro-interactions"
```

---

### Task 2: Refinamento de Componentes e Layout no GEFShell

**Files:**
- Modify: `src/components/gefshell.tsx`

**Step 1: Ajustar marcações e classes para a nova estética**
- Atualizar o visual da Topbar para integrar o efeito translúcido sticky com blur.
- Limpar a área decorativa do Banner de Boas-vindas para um visual minimalista e arejado com o logo institucional do GEF.
- Garantir que os cards de propostas, cards de atividades e cartões das chapas utilizem as novas classes e espaçamentos.
- Assegurar que os modais de feedback pós-recreio e resumo estatístico apresentem visual flutuante com cantos suaves (`border-radius: 20px`).

**Step 2: Verificar ausência de erros no TypeScript e compilação**
- Run: `npx --yes pnpm run typecheck`
- Expected: 0 errors

**Step 3: Commit**
```bash
git add src/components/gefshell.tsx
git commit -m "refactor(ui): polish shell components with Apple design aesthetics and clean layouts"
```

---

### Task 3: Verificação Automatizada Completa

**Files:**
- Test: `tests/platform-store.test.ts`

**Step 1: Executar suite completa de validação**
- Run: `npx --yes pnpm run typecheck && npx --yes pnpm run lint && npx --yes pnpm run build && npx --yes pnpm test`
- Expected: All passes, 0 errors, 0 warnings, 5/5 tests passing.

**Step 2: Atualizar tracker de progresso**
- Atualizar `docs/plans/task.md`.

---

### Task 4: Push para Avaliação na Branch Dedicada

**Step 1: Enviar para o repositório remoto na branch `feature/apple-design-ui`**
- Run: `git push -u pessoal feature/apple-design-ui`
- Expected: Push realizado com sucesso no remoto `pessoal`, gerando a URL de preview na Vercel para o usuário dar o seu veredito.
