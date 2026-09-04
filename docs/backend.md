# Backend do Comunica Farroupilha

## O que já está implementado

O App Router expõe Route Handlers em `src/app/api` para o fluxo demonstrável:

- `GET /api/health` — verifica se o serviço responde.
- `POST /api/auth/login`, `POST /api/auth/signup` e `POST /api/auth/logout` — sessão por cookie HttpOnly para a demo.
- `GET/POST /api/proposals` — feed e criação de propostas por estudantes.
- `GET/PATCH /api/proposals/:id` — leitura (inclui apoiadores) e atualização de situação pelo GEF.
- `GET/POST /api/proposals/:id/comments` — comentários e respostas.
- `POST /api/proposals/:id/support` — alterna o apoio da pessoa autenticada.
- `POST /api/proposals/:id/save` — alterna o acompanhamento da proposta pela pessoa autenticada.
- `GET/POST /api/activities` — agenda e publicação de atividades pelo GEF.
- `GET/PATCH /api/notifications` — leitura e marcação de notificações.
- `GET /api/chapas?area=...` — catálogo informativo das propostas da Chapa 1 e da Chapa 2 por área, sem ordem de preferência.
- `GET /api/platform` — snapshot usado para inspeção da demo.

As validações de permissão já estão no servidor: estudante publica proposta e comenta; somente o GEF altera situação e cria atividade. Apoios são registrados por pessoa, comentários geram notificações e uma atividade publicada gera um aviso para a comunidade. O piloto está desenhado para todo o Ensino Fundamental e Médio. A interface continua com fallback local para a apresentação, e sincroniza as ações com esses endpoints quando o serviço está disponível.

## Limite consciente da demo

O armazenamento atual é em memória (`src/lib/platform-store.ts`) e a sessão também é temporária. Isso torna a demonstração simples e executável sem credenciais, mas não é persistência de produção: reinícios de processo podem apagar os dados e múltiplas instâncias não compartilham o mesmo estado.

Antes do uso real, substituir o store por um banco gerenciado (por exemplo, Postgres), armazenar senhas com hash forte, validar o domínio escolar, configurar expiração e rotação de sessão, adicionar rate limiting e registrar auditoria de ações do GEF. A conexão com Google Workspace deve ser feita por OAuth/OIDC depois que o colégio fornecer as configurações e consentimentos necessários; quando autorizada, ela poderá criar ou vincular automaticamente o perfil escolar.

Nenhuma chave, senha real ou credencial escolar fica no repositório. As credenciais `administrador` / `admteste123` são apenas da demo solicitada.
