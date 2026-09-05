# Comunica Farroupilha - Plataforma 100% Funcional e Backend Completo

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Corrigir bugs de sincronização, IDs e estado, expandir o backend com autenticação completa (sessão ativa, /api/auth/me), avaliações de atividades, dúvidas de chapas, justificativas do GEF e persistência estruturada, tornando a plataforma 100% funcional de ponta a ponta e publicada em branch preview.

**Architecture:** Next.js App Router com TypeScript, Route Handlers dinâmicos para a API REST, armazenamento unificado e persistente em `src/lib/platform-store.ts` com sessões HTTP-only seguras em `src/lib/session.ts`, e UI integrada no `GEFShell` com sincronização bidirecional, feedback pós-atividade e canal de dúvidas para as chapas.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, CSS moderno responsivo, Node.js crypto/fs.

---

### Task 1: Expansão do Modelo de Dados, Store e Persistência

**Files:**
- Modify: `src/lib/platform-store.ts`
- Modify: `src/lib/session.ts`

**Step 1:** Expandir tipos e estruturas de dados no `platform-store.ts`:
- Adicionar `origin: "student" | "gef"` e `gefResponse?: string`, `gefResponseAt?: string` em `ProposalRecord`.
- Adicionar tipo `ActivityFeedbackRecord` com campos: `id`, `activityId`, `userId`, `userName`, `turma`, `participated: boolean`, `reasonNotParticipated?: string`, `rating?: "great" | "ok" | "poor"`, `comment?: string`, `createdAt`.
- Adicionar tipo `ChapaQuestionRecord` com campos: `id`, `chapaId`, `proposalArea`, `question`, `author`, `authorId`, `turma`, `answer?: string`, `answeredAt?: string`, `createdAt`.
- Adicionar persistência em arquivo JSON local (`data/platform-store.json` ou `/tmp/comunica-store.json`) que carrega automaticamente ao inicializar e grava atomicamente a cada mutação, garantindo que reinicializações e novas requisições não percam dados.
- Adicionar funções de consulta e mutação: `submitActivityFeedback`, `getActivityFeedbacks`, `createChapaQuestion`, `answerChapaQuestion`, `getChapaQuestions`.

**Step 2:** Atualizar `src/lib/session.ts`:
- Adicionar suporte a persistência de sessões para que a sessão não seja perdida em reinícios do servidor ou requisições simultâneas.

**Step 3:** Executar `pnpm run typecheck` para garantir integridade de tipos.

---

### Task 2: Novos e Aprimorados Endpoints de Backend

**Files:**
- Create: `src/app/api/auth/me/route.ts`
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `src/app/api/auth/signup/route.ts`
- Modify: `src/app/api/proposals/route.ts`
- Modify: `src/app/api/proposals/[id]/route.ts`
- Create: `src/app/api/activities/[id]/route.ts`
- Create: `src/app/api/activities/[id]/feedback/route.ts`
- Create: `src/app/api/chapas/questions/route.ts`
- Modify: `src/app/api/platform/route.ts`

**Step 1:** Criar `GET /api/auth/me`:
- Retorna o usuário logado com base no cookie `comunica_session`.
- Se não autenticado, retorna `{ user: null }` (HTTP 200) permitindo que o frontend descubra o estado sem erro de rede.

**Step 2:** Atualizar `PATCH /api/proposals/[id]`:
- Permitir que o GEF altere o status para todas as etapas válidas: `"received" | "analysis" | "development" | "scheduled" | "completed" | "archived"`.
- Permitir que o GEF envie justificativa/resposta oficial (`gefResponse`), salvando `gefResponse` e gerando notificação automática para os apoiadores e autor.

**Step 3:** Criar rotas para Atividades:
- `PATCH /api/activities/[id]`: GEF pode alterar status da atividade para `"upcoming" | "done" | "cancelled"`.
- `GET/POST /api/activities/[id]/feedback`: Estudantes podem enviar avaliação pós-recreio (se participou, nota, motivo se não participou, comentário).

**Step 4:** Criar rotas para Chapas:
- `GET/POST /api/chapas/questions`: Listar dúvidas dos estudantes e permitir que estudantes enviem dúvidas sobre propostas específicas das chapas.
- `PATCH /api/chapas/questions`: Permitir que o GEF ou administrador responda à dúvida.

**Step 5:** Atualizar `/api/platform`:
- Incluir `activityFeedbacks` e `chapaQuestions` no snapshot da plataforma.

---

### Task 3: Correção de Bugs de Sincronização e Integração no Frontend

**Files:**
- Modify: `src/components/gefshell.tsx`

**Step 1:** Sincronização real com o backend:
- Na montagem do componente, chamar `/api/auth/me` para restaurar sessão ativa caso o cookie exista.
- Chamar `/api/platform` para carregar o estado real do backend (propostas, comentários, atividades, notificações, chapas, apoios, feedbacks).
- Corrigir `createProposal`: aguardar resposta do servidor e utilizar o ID retornado pelo servidor (`data.id`), evitando o bug do ID `p-timestamp` desincronizado.
- Corrigir `createActivity`: aguardar resposta do servidor e utilizar o ID do servidor.
- Corrigir `addComment`: enviar ao servidor e atualizar estado com o comentário retornado pelo servidor.
- Corrigir `toggleSupport` e `toggleSaved`: sincronizar fielmente com a resposta da API.

**Step 2:** Ações do GEF completas:
- No detalhe da proposta, permitir que o GEF insira resposta oficial / justificativa com um clique.
- Permitir transição para "Concluída" e "Arquivada", completando o ciclo dos 4 passos descritos no documento ("Escutar -> Compreender -> Decidir e Devolver -> Realizar e Aprender").

---

### Task 4: Avaliação de Atividades Pós-Recreio na Interface

**Files:**
- Modify: `src/components/gefshell.tsx`

**Step 1:** Na aba de Agenda:
- Exibir status da atividade ("Confirmada / Em breve", "Realizada", "Cancelada").
- Adicionar botão "Avaliar atividade" para atividades realizadas (ou após a data/horário):
  - Modal/formulário de avaliação:
    - Participou do intervalo? (Sim / Não)
    - Se não participou: motivo (estava estudando, não sabia, preferiu descansar, não teve interesse, outro).
    - Avaliação: Adorei / Foi bom / Regular / Pode melhorar.
    - Comentário opcional.
- Se o usuário for GEF:
  - Exibir resumo das avaliações recebidas (taxa de participação, satisfação, motivos de quem não participou e comentários).
  - Opção para marcar atividade como "Realizada" ou "Cancelada".

---

### Task 5: Canal de Dúvidas sobre Propostas das Chapas

**Files:**
- Modify: `src/components/gefshell.tsx`

**Step 1:** Na visualização de Chapas (`ChapasView`):
- Adicionar em cada proposta da chapa a seção/botão "Tirar dúvida" e visualização das perguntas respondidas.
- Estudante pode formular pergunta respeitosa e clara sobre aquela proposta.
- Visualização neutra e equivalente, sem viés, conforme especificado no documento do projeto.

---

### Task 6: Testes Automatizados e Verificação Rigorosa

**Files:**
- Create: `tests/api.test.mjs`
- Modify: `package.json`

**Step 1:** Criar suite de testes automatizados com Node.js test runner cobrindo:
- Autenticação e sessão (login, signup, /api/auth/me, logout).
- Propostas (criação com autor identificado e anônimo, filtros, apoios, comentários em thread, atualização de status e resposta do GEF).
- Atividades (criação vinculada à proposta, status, submissão de feedback pós-recreio).
- Chapas (listagem informativa neutra, envio de dúvidas e respostas).
- Healthcheck e integridade da plataforma.

**Step 2:** Executar typecheck (`tsc --noEmit`), lint (`eslint .`), build (`next build`) e a suite de testes.

---

### Task 7: Push para o GitHub e Verificação

**Files:**
- Git remote: `pessoal` -> `git@github.com-pessoal:luccagoulartsaldanha/Comunica-Farroupilha.git`
- Branch: `feature/plataforma-completa`

**Step 1:** Commit estruturado de todas as mudanças.
**Step 2:** Push da branch para `pessoal`.
**Step 3:** Documentar o status, link de pull request e verificação no `docs/delivery.md` e `docs/plans/task.md`.
