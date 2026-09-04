# Comunica Farroupilha

Plataforma do GEF para ouvir estudantes e melhorar o lazer nos intervalos do Colégio Farroupilha.

## Executar

Requer Node.js 22 ou superior e pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abra http://localhost:3000. Para produção, use `pnpm build` e `pnpm start`.

## Verificação

```sh
pnpm lint
pnpm typecheck
pnpm build
```

## Escopo desta versão

Landing page pública e app demonstrativo responsivo do Comunica Farroupilha. A demo inclui feed de propostas, detalhes com apoiadores e comentários, apoio, acompanhamento com a aba `Acompanhando`, criação anônima ou identificada, agenda com calendário mensal, notificações, catálogo informativo da Chapa 1 e da Chapa 2 por área e visão de temas para o GEF. O piloto considera todo o Ensino Fundamental e Médio. Há Route Handlers em `src/app/api` para o fluxo de backend; o store atual é temporário e está documentado em `docs/backend.md`.

Autenticação futura definida: conta de estudante na plataforma, usando e-mail/senha ou Google. O provedor e a verificação de vínculo escolar ainda serão escolhidos.

## Estrutura

- `src/app`: página, layout, metadados e estilos.
- `src/components`: demonstração de escuta, ícone de seta e shell funcional do app.
- `public/brand`: marcas utilizadas pela página.
- `assets/originals`: logo original do projeto fornecida pelo idealizador.
- `PRODUCT.md`: público, escopo e decisões de produto.
- `DESIGN.md`: sistema visual documentado após a revisão.
- `docs/plans`: plano e decisões técnicas.
- `docs/backend.md`: endpoints, permissões e limites do armazenamento da demo.

As fontes Archivo e Manrope são servidas pelo próprio site através dos pacotes Fontsource. A demo não usa banco persistente nem credencial escolar; as rotas de backend e a sessão temporária estão descritas em `docs/backend.md`. As imagens vieram do idealizador e mantêm sua identificação de origem; não se presume autorização institucional além do uso solicitado no projeto.

## Continuidade

Hospedagem planejada na Vercel com Next.js. Após conectar o repositório GitHub ao projeto, alterações da branch de produção poderão disparar novas publicações. Consulte `docs/delivery.md` para o estado real da publicação e eventuais pendências de acesso.
