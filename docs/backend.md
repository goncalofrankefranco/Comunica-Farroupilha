# Backend do Comunica Farroupilha

## Persistência

O backend usa Neon Postgres como fonte única e compartilhada entre as instâncias serverless da Vercel. Não há store global, arquivos em `/tmp` ou fallback de dados de domínio no `localStorage`.

As tabelas e restrições ficam em `db/migrations/0001_initial.sql` e migrations seguintes. Contagens de apoios, comentários e avaliações são derivadas das relações. As chaves únicas de apoio, acompanhamento, curtida e avaliação tornam requisições repetidas idempotentes. `0002_interaction_revisions.sql` registra a revisão mais recente por ação para rejeitar requisições atrasadas.

`0007_request_rate_limits.sql` guarda janelas de limite compartilhadas entre instâncias. As chaves são HMAC, não armazenam IP ou nome de usuário em texto; registros expirados são removidos gradualmente durante o uso.

Variáveis obrigatórias, sempre fora do Git:

- `DATABASE_URL`: conexão usada pela aplicação;
- `DATABASE_URL_UNPOOLED`: conexão preferida pelo migrador;
- `RATE_LIMIT_SECRET`: segredo recomendado para HMAC das chaves de limite; por compatibilidade, o código ainda aceita `DATABASE_URL` como fallback;
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `ADMIN_CLASS`: seed controlado da conta GEF.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI`: obrigatórios para autenticação dos estudantes.

Testes de integração que alteram o banco exigem `TEST_DATABASE_URL` apontando para um banco isolado. O runner e `pnpm db:migrate:test` recusam uma URL equivalente a `DATABASE_URL` ou `DATABASE_URL_UNPOOLED`, mesmo com `ALLOW_REMOTE_TEST_DATABASE=true`. `db:migrate:test` usa somente `TEST_DATABASE_URL` e nunca recorre às URLs da aplicação. Um banco remoto de teste só é aceito com `ALLOW_REMOTE_TEST_DATABASE=true`; nunca use produção para testes.

## Autenticação

Contas são persistidas no banco. A senha é armazenada somente como hash `scrypt` versionado, com salt aleatório. A sessão usa um token aleatório de 32 bytes no cookie `HttpOnly`; o banco recebe somente o SHA-256 desse token e sua expiração.

O cookie usa `SameSite=Lax`, caminho `/`, duração de sete dias e `Secure` em produção. Logout revoga a sessão no banco. Nenhum endpoint público devolve hashes, tokens ou a lista de contas.

O login Google usa `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI`. O callback verifica assinatura, público, expiração e nonce do ID token; só aceita email verificado com `hd` e domínio do email exatamente `farroups.com.br`. Contas novas recebem papel de estudante. Uma conta GEF existente só pode usar Google depois que a equipe vincular seu email verificado ao registro no banco. Para preservar o histórico de uma conta antiga de estudante, a tela de entrada permite confirmar uma vez o usuário e a senha antigos e, em seguida, exige a verificação Google escolar. O token de vínculo é aleatório, fica somente em cookie `HttpOnly` e como hash no banco, expira em 10 minutos e só pode ser usado uma vez. Após o vínculo, a senha antiga é apagada e o mesmo registro de usuário continua dono das propostas e interações. Cadastro e login por senha de estudantes continuam desativados; a senha só serve para iniciar esse vínculo e para a conta operacional do GEF.

## Endpoints

- `GET /api/health`: confirma processo e conexão com o banco; falha com 503 quando o Neon está indisponível.
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`; `POST /api/auth/signup` retorna 410.
- `POST /api/auth/link-legacy`: inicia a recuperação de histórico com as credenciais antigas; não cria sessão antes da verificação Google.
- `GET /api/auth/google` e `GET /api/auth/google/callback`.
- `POST /api/proposals/:id/cancel`: apenas o autor pode cancelar antes do agendamento.
- `GET/POST /api/proposals`.
- `GET/PATCH /api/proposals/:id`.
- `GET/POST /api/proposals/:id/comments`.
- `POST /api/proposals/:id/support`: exige `{ "supported": boolean }`.
- `POST /api/proposals/:id/save`: exige `{ "saved": boolean }`.
- `POST /api/comments/:id/like`: exige `{ "liked": boolean }`.
- `GET/POST /api/activities` e `GET/PATCH /api/activities/:id`.
- `GET/POST /api/activities/:id/feedback`.
- `GET/PATCH /api/notifications`.
- `GET /api/chapas` e `GET/POST/PATCH /api/chapas/questions`: retornam 410 até uma eleição ser configurada; a flag está em `src/lib/feature-flags.ts`.
- `GET /api/platform`: snapshot público e específico da sessão, com até 50 propostas por página e cursor opaco em `nextProposalCursor`.
- `GET /api/proposals?cursor=...`: página de propostas; `X-Next-Cursor` aponta para a próxima página sem alterar o formato `{ data: [...] }`.
- `GET /api/proposals/:id/comments?cursor=...`: comentários em páginas de até 100, com `nextCursor` e os IDs curtidos pelo usuário atual.
- `POST /api/admin/legacy-import`: importação GEF idempotente de dados antigos do navegador.

Respostas de domínio usam `{ data }`; falhas usam `{ error }` com status 400, 401, 403, 404, 409, 410, 429 ou 503. Dados dinâmicos usam `Cache-Control: no-store, max-age=0` e respostas específicas da sessão variam por cookie. O snapshot carrega 50 propostas e os 20 comentários mais recentes por proposta; seus cursores e o endpoint de comentários recuperam o histórico sob demanda.

## Concorrência e cliente

Apoio, acompanhamento e curtida recebem a intenção final, não um comando de alternância. O cliente aplica feedback otimista imediatamente, numera cada interação e ignora respostas antigas. A resposta canônica do banco consolida o estado; a falha da revisão atual faz rollback e exibe uma mensagem.

Na inicialização, sessão e snapshot são carregados em conjunto. Uma resposta 503 gera uma tela de erro com nova tentativa; somente um snapshot bem-sucedido e realmente vazio exibe “nenhuma proposta”.

## Timestamps e notificações

O banco armazena todos os instantes em `timestamptz`. A API converte-os para rótulos relativos em um único ponto (`Agora`, `Há N min`, `Há N h` ou data local). O card usa a mesma criação no cabeçalho e na linha de autoria; atualizações não aparecem como se fossem a criação.

`notification-manager.ts` atribui uma chave estável por evento, usa upsert para retries e compacta registros legados com o mesmo título e corpo. O agrupamento mantém o horário mais recente, soma `occurrences` e permanece não lido se qualquer ocorrência ainda estiver não lida.

Propostas e comentários novos notificam a equipe GEF; respostas e mudanças de status notificam o autor da proposta; atividades notificam estudantes. Notificações legadas sem destinatário continuam visíveis para as contas existentes. A preferência de categoria e o filtro de não lidas ficam no armazenamento local do navegador.

## Migração do legado

Quando um navegador ainda contém `comunica-farroupilha-demo` ou `gremio-comunica-demo`, a visão do GEF mostra uma prévia. A importação só ocorre após clique explícito.

O cliente e o servidor aplicam limites e descartam contas, senhas, sessões e mapas por usuário. O servidor usa uma chave SHA-256 e IDs determinísticos dentro de uma transação, de modo que o mesmo payload não cria duplicatas. A cópia antiga só é apagada após sucesso e confirmação do operador.

## Operação

```sh
pnpm db:migrate
pnpm db:migrate:test # requer TEST_DATABASE_URL configurada para um banco isolado
pnpm db:seed-admin
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

As migrações desta entrega são aditivas. Antes de mudanças destrutivas futuras, criar backup no Neon e uma migration reversível. O rate limiting distribuído cobre login, leituras públicas e gravações de conteúdo. O WAF da Vercel é administrado fora do repositório; as regras de observação precisam ser publicadas no painel/CLI e os eventos revisados antes de trocar qualquer regra para bloqueio.

O seed GEF atualiza somente um usuário que já tenha papel `gef`. Se `ADMIN_USERNAME` colidir com uma conta de estudante, escolha outro nome; o seed não promove nem reaproveita a sessão dessa conta.

Antes de publicar esta versão, executar `pnpm db:migrate` contra o banco configurado, incluindo `0005_participation_workflows.sql`, `0006_google_auth.sql`, `0007_request_rate_limits.sql` e `0008_legacy_google_account_linking.sql`. Registrar a URL exata do callback Google como URI autorizada no console OAuth. Os valores OAuth devem estar configurados nos ambientes Production e Preview da Vercel.
