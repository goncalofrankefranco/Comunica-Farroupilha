# Comunica Farroupilha: Experiência de Participação

**Status:** design aprovado pelo usuário em 5 de setembro de 2026.

## Objetivo

Evoluir a demo do Comunica Farroupilha para que o ciclo de participação seja claro e acionável: estudantes conseguem descobrir, apoiar, salvar e acompanhar propostas; notificações levam ao conteúdo correto; e o GEF trabalha a partir de uma fila de decisões, respostas e atividades. A landing page pública permanece visualmente reconhecível e não será redesenhada por completo sem uma melhoria comprovável.

## Contexto e limites

- O público é formado por estudantes de todo o Ensino Fundamental e Médio; o GEF opera a plataforma.
- A experiência deve refletir o ciclo do produto: escutar, compreender, decidir e devolver, realizar e aprender.
- A origem de uma ideia precisa ficar explícita: sugestão de estudante ou ideia do GEF.
- Não serão inventados números de participação, endossos institucionais, eventos reais, eleições online ou funcionalidades de votação eleitoral.
- O store continua em memória nesta etapa. A interface deve declarar esse limite quando relevante; não será apresentada como persistência de produção.
- O Google OAuth ficará pronto para configuração, mas o login real depende de credenciais e redirect URI fornecidos pelo administrador da conta Google Cloud/Vercel.
- O domínio autorizado é exatamente `farroups.com.br`, conforme pedido do usuário.

## Evidências usadas

- O site publicado foi observado em `https://comunica-farroupilha.vercel.app/` e `https://comunica-farroupilha.vercel.app/app`.
- O clique de uma notificação existente apenas marcou o item como lido e deixou a URL e a tela inalteradas.
- O feed usa controles de salvar e apoiar dentro de um botão de card, incluindo um `span role="button"`; isso cria uma estrutura inválida para interação aninhada.
- A visão do GEF usa posições manuais para nós de temas, mas não ordena trabalho, resposta pendente ou próxima ação.
- O login atual é local e exibe somente uma nota sobre Google; não há provedor OAuth.
- O documento de produto enfatiza privacidade, participação de quem não quer se expor, feedback posterior a atividades e preservação do histórico entre gestões.
- A landing existente preserva a marca laranja do megafone, azul escolar, tipografia Archivo/Manrope e composição editorial forte; essa linguagem será mantida.

## Direção visual aprovada

Usar a linguagem já existente no app: azul `#0758b1`, navy `#17365d`, laranja `#f45a1a`, branco e fundo azul-cinza muito claro, com bordas frias, raios discretos de até 8px e sombra mínima apenas para estados selecionados. A tipografia mantém Archivo para títulos e Manrope para leitura e controles.

O conceito do GEF usa uma fila de trabalho aberta como superfície principal e um panorama de temas com barras acessíveis como apoio. O conceito de estudante usa cards de proposta compactos, estados de salvar/apoiar visíveis e notificações com seta de destino. O texto “Colégio Farroupilha” foi removido da faixa inferior do segundo conceito conforme solicitado; a marca do GEF e a identidade do produto permanecem.

Referências visuais da sessão:

- GEF: `C:\Users\gesto\.codex\generated_images\01a06f78-bc5b-78e2-8095-4c2a3006c039\exec-dc97b0f0-36fb-4127-9ca5-6dced79ffd6b.png`
- Feed/notificações aprovado: `C:\Users\gesto\.codex\generated_images\01a06f78-bc5b-78e2-8095-4c2a3006c039\exec-3814b674-047a-4e9d-a2f2-68f76c6e5950.png`

## Experiência do estudante

### Feed de propostas

- Mostrar a origem da proposta com rótulo curto e honesto.
- Manter busca, tema, situação e ordenação, com controles legíveis no desktop e rolagem horizontal controlada no mobile.
- Separar o botão que expande a proposta dos botões de ação.
- O botão de salvar será apenas o marcador quando estiver no card; terá `aria-pressed`, `title` e rótulos acessíveis “Salvar proposta” e “Remover proposta salva”. Quando ativo, o ícone terá preenchimento laranja e não exibirá “Acompanhando”.
- O apoio será um `<button>` real com `aria-pressed`, contagem atualizada, estado “Apoiar/Apoiado” e ícone preenchido no estado ativo.
- Ações otimistas mostrarão confirmação curta e reversível; falhas da API restaurarão o estado anterior e comunicarão o erro em uma região `role="status"` ou `role="alert"`.
- A proposta expandida exibirá situação, etapas do ciclo, conversa, resposta do GEF, apoiadores e próxima ação.

### Notificações

Cada notificação possuirá tipo e destino explícitos:

- atividade: abrir Agenda e selecionar a atividade e a proposta de origem;
- resposta, comentário ou situação: abrir Propostas e selecionar a proposta;
- sistema: permanecer na central, com destino ausente apenas quando não houver conteúdo relacionado.

O clique marcará somente o item como lido, persistirá essa alteração no endpoint e navegará para o destino. “Marcar todas como lidas” continuará disponível, mas não substituirá a leitura individual. O contador deve refletir a lista atual sem reduzir por efeito colateral de uma navegação.

### Agenda

- Remover a data “hoje” hardcoded; o destaque de hoje deve vir do relógio do navegador.
- Atividades terão detalhe selecionável, proposta de origem, data, horário, local e público.
- A agenda continuará mensal nesta etapa, com seleção de uma atividade abrindo contexto da proposta.
- O modelo preservará estados `upcoming`, `done` e `cancelled` para permitir avaliação pós-atividade em uma etapa seguinte sem inventar feedback antes da hora.

### Navegação mobile

Limitar a barra inferior a cinco destinos. Propostas, Acompanhando, Agenda e Notificações ficam visíveis; Chapas e, para o GEF, Visão do GEF ficam em uma entrada “Mais” com menu acessível. Isso evita seis rótulos comprimidos em telas estreitas.

## Visão do GEF

O mapa de nós deixa de ser a ferramenta principal. A tela passa a responder “o que precisa da minha atenção agora?”.

### Resumo derivado

Os indicadores serão calculados a partir dos dados disponíveis, sem números inventados:

- aguardam resposta: propostas sem comentário do GEF que ainda estão abertas;
- para analisar: propostas em `received`;
- em construção: propostas em `development` ou `scheduled`;
- próxima atividade: atividade futura mais próxima.

### Fila de trabalho

A fila exibirá filtros “Todas”, “Precisa de resposta”, “Em análise” e “Em construção”. Cada linha terá título, origem, tema, situação, apoios, comentários, última atualização e próxima ação. A ausência de uma resposta do GEF tem prioridade sobre a situação ao derivar a ação; depois disso, aplica-se a regra da situação:

- proposta aberta sem retorno do GEF: “Responder”;
- `received`: “Analisar”;
- `analysis`: “Mover para desenvolvimento”;
- `development`: “Abrir atividade”;
- `scheduled`: “Ver atividade”;
- `completed` ou `archived`: “Ver histórico”.

Selecionar uma linha abrirá um painel de contexto com a proposta completa, etapas do ciclo, resposta do GEF, comentários, apoiadores e controles administrativos existentes.

### Panorama por tema

Substituir o posicionamento manual do mapa por uma lista ou barras horizontais com contagem por tema e distribuição por situação. A visualização será legível sem cor, teclado ou hover, e cada tema poderá filtrar a fila.

## Autenticação

### Login local

- O navegador não armazenará senhas nem contas completas em `localStorage`.
- O formulário chamará o endpoint e usará a sessão HttpOnly como fonte de autenticação.
- Senhas da demo serão armazenadas no servidor como hashes derivados com `node:crypto`, não como texto puro.
- Uma rota de sessão devolverá o usuário atual para que o callback do Google e recargas possam hidratar o app.

### Google institucional

Implementar fluxo de autorização por código no servidor:

1. `GET /api/auth/google` valida configuração, cria `state`, `nonce` e PKCE, salva os valores em cookie HttpOnly de curta duração e redireciona para o endpoint oficial do Google.
2. `GET /api/auth/google/callback` valida `state`, troca o código, verifica o ID token com a biblioteca oficial do Google e cria ou atualiza a conta.
3. O token deve ser aceito somente com emissor, audiência e expiração válidos, `nonce` igual ao valor salvo no cookie, `email_verified === true`, `hd === "farroups.com.br"` e `sub` presente.
4. O identificador primário da conta será `sub`; o domínio do campo `email` não será usado sozinho para autorizar acesso.
5. O callback inicia a sessão HttpOnly e retorna ao `/app` com estado de sucesso ou uma mensagem segura de erro, sem expor tokens na URL final.

Variáveis de ambiente documentadas: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI`. Sem elas, o botão permanece visível como caminho institucional, mas a rota informa que a conexão ainda não foi configurada; não haverá falsa promessa de login funcional.

## Contratos de dados e API

### Notificação

Adicionar ao registro:

```ts
type NotificationType = "activity" | "proposal" | "comment" | "system";

type NotificationRecord = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  proposalId?: string;
  activityId?: string;
};
```

O endpoint `PATCH /api/notifications` aceitará `{ id?: string, read?: boolean }`. Sem `id`, marca todos; com `id`, altera apenas o item existente e retorna 404 para identificador desconhecido.

### Sessão

Adicionar `GET /api/auth/session`, que retorna `{ user }` quando autenticado e `{ user: null }` quando não houver sessão. O formato público nunca inclui senha, hash, token OAuth ou segredo.

### Conta

O registro interno usará `passwordHash` opcional, `provider` (`password` ou `google`) e `googleSub` opcional. A resposta pública continua limitada a id, nome, turma, papel e, quando necessário, email institucional mascarado ou omitido.

## Componentes e limites de código

- Manter `src/app/page.tsx` e a landing como estão, salvo correções comprovadas.
- Extrair funções puras para `src/lib/participation-domain.ts`, cobrindo destino de notificação, fila do GEF, resumo e política de identidade Google.
- Manter `GEFShell` como composição, mas separar módulos grandes em componentes focados quando a mudança tornar o arquivo difícil de revisar.
- Manter o sistema de ícones local e ampliar somente os ícones necessários para estados preenchidos; não adicionar biblioteca de ícones sem necessidade.
- Usar `next/image` para as marcas existentes.
- Não adicionar banco, CMS, eleições, chat privado ou notificações push nesta etapa.

## Erros, segurança e acessibilidade

- Toda entrada de API será validada no servidor e toda mutação verificará sessão e papel.
- Ações client-side não poderão assumir que `fetch` teve sucesso; tratarão resposta HTTP e JSON inválido.
- Cookies de sessão e OAuth serão HttpOnly, `SameSite=Lax`, `Secure` em produção e com expiração definida.
- Botões terão foco visível, nomes acessíveis, estados pressionados e área de toque adequada.
- Não haverá botões interativos aninhados.
- Mudanças de estado serão anunciadas de forma curta, sem substituir o conteúdo principal.
- Respeitar `prefers-reduced-motion` e evitar deslocamento de layout durante carregamento.
- Comentários e propostas continuarão com opção de autoria anônima, sem revelar dados em notificações.

## Critérios de aceitação

- Clicar em cada tipo de notificação abre o destino correto e marca apenas o item clicado como lido.
- Salvar e remover o salvamento muda o ícone para preenchido/vazio, atualiza a aba Acompanhando e não exibe o texto quebrado “Acompanhando” no card.
- Apoiar e remover apoio atualiza ícone, rótulo, contador e lista de apoiadores; o controle funciona por teclado.
- Feed, Agenda, Chapas, Notificações e Mais funcionam em desktop e mobile sem transbordamento horizontal.
- GEF consegue encontrar propostas sem resposta, filtrar a fila, abrir uma proposta e avançar sua situação ou criar atividade.
- Login local não persiste senha no navegador; sessão é recuperada pelo endpoint.
- Token Google de domínio ausente, domínio incorreto, email não verificado, audiência inválida ou estado OAuth inválido são rejeitados.
- `pnpm test`, `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.
- O fluxo principal é verificado em navegador: login, feed, salvar, apoiar, notificação, agenda e visão do GEF.
- A landing preserva marca, cópia e composição; qualquer desvio visual fica registrado como intencional.

## Limitações intencionais

- OAuth não pode ser validado contra uma conta real sem configuração Google Cloud e variáveis de ambiente válidas.
- Store e sessões continuam em memória; reinício de processo pode apagar dados.
- A avaliação pós-atividade fica representada no modelo, mas só será ativada quando houver uma atividade concluída no fluxo da demo.
- O trabalho será mantido localmente na branch de implementação; nenhum push ou publicação em Vercel será feito automaticamente.
