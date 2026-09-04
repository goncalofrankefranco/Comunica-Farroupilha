# Entrega — 4 de setembro de 2026

## Site publicado

https://comunica-farroupilha.vercel.app/

Projeto: `comunica-farroupilha`, conta Vercel `LGS/lgs10`.
Implantação informada pela integração: `dpl_sBivoGJ1Mt2N9aZoQytQmTSPbw2Z`.
Inspetor: https://vercel.com/lgs10/comunica-farroupilha/sBivoGJ1Mt2N9aZoQytQmTSPbw2Z

Publicação feita por envio dos arquivos de construção ao conector Vercel. O domínio de produção retornou HTTP 200, título correto e interface funcional sem autenticação Vercel. Os endereços gerados com sufixo `lgs10` exigem login; use o domínio público acima. As ferramentas de consulta de projeto e logs retornaram 404 apesar da publicação pública verificada; não foi possível obter um projectId confiável por essas ferramentas nesta sessão.

## GitHub: push manual pelo usuário

Repositório remoto informado pelo usuário: `goncalofrankefranco/Gr-mio-Comunica-Farroupilha`. O código está preparado localmente e o push ficará a cargo do usuário, conforme solicitado; nenhuma alteração será enviada automaticamente.

Depois de revisar a demo, o usuário pode fazer o push dessa base e conectar o mesmo repositório ao projeto Vercel existente. Não criar outra implementação nem outro projeto de hospedagem.

## Demo atual do Comunica Farroupilha

O caminho `/app` reúne uma demo funcional com feed de propostas, detalhes de cada proposta com apoiadores e comentários, autoria identificada ou anônima, acompanhamento de propostas na aba `Acompanhando`, login local de demonstração, agenda com calendário mensal, notificações, catálogo informativo da Chapa 1 e da Chapa 2 por área e mapa de temas para a visão do GEF. A conta administrativa da demo é `administrador` com a senha `admteste123`; os dados ficam somente no navegador. O piloto considera todo o Ensino Fundamental e Médio.

A direção de comunicação do Grêmio Estudantil Farroupilha já aprova a ideia e considera essencial desenvolver atividades de lazer no recreio. Essa aprovação está visível na landing page e no espaço de participação do app.

## Verificações realizadas

- `pnpm build`, `pnpm lint`, `pnpm typecheck`: passaram.
- `pnpm peers check`: sem incompatibilidades.
- Desktop de 1440 × 1000 e celular de 390 × 844: layout e controles conferidos; sem transbordamento horizontal observado. Capturas verticais estão em `docs/screens/`.
- Demonstração alterna cenários via clique e Enter; mantém `aria-pressed` e região `aria-live`.
- Navegador local e domínio público sem mensagens de erro ou aviso no console durante a verificação.
- Revisão Impeccable: único ajuste material solicitado foi contraste do botão. Corrigido para #061d32 sobre #ff5000 (5,20:1); veredicto `ship` no escopo dessa correção.
- Marcas com origem documentada. Logo original mantida; versão WebP de 64 KB preserva a composição e reduz o download.

## Continuidade

O Google Doc foi atualizado na aba Projeto com a tecnologia, o escopo e o link público. As demais abas, mapas, logos e histórico foram preservados.

Persistência de produção, consultas reais, integração com Google Workspace e regras operacionais ficam para futuras instruções. Dúvidas de operação e privacidade constam em PRODUCT.md e no Docs; o usuário pediu para guardá-las sem perguntas nesta etapa.
