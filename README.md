# Grêmio Comunica Farroupilha

Landing page do projeto voltado ao GEF e à melhoria do lazer nos intervalos do Colégio Farroupilha.

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

Uma página pública, responsiva, com apresentação da proposta e demonstração interativa local. As escolhas apenas alteram o exemplo exibido; nada é enviado, salvo ou contado como voto. Login, banco de dados, agenda real, consultas e painel administrativo serão implementados nas próximas etapas, neste mesmo projeto.

Autenticação futura definida: conta de estudante na plataforma, usando e-mail/senha ou Google. O provedor e a verificação de vínculo escolar ainda serão escolhidos.

## Estrutura

- `src/app`: página, layout, metadados e estilos.
- `src/components`: demonstração de escuta e ícone de seta.
- `public/brand`: marcas utilizadas pela página.
- `assets/originals`: logo original do projeto fornecida pelo idealizador.
- `PRODUCT.md`: público, escopo e decisões de produto.
- `DESIGN.md`: sistema visual documentado após a revisão.
- `docs/plans`: plano e decisões técnicas.

As fontes Archivo e Manrope são servidas pelo próprio site através dos pacotes Fontsource. Não há rastreamento, formulário, banco ou segredo de autenticação nesta entrega. As imagens vieram do idealizador e mantêm sua identificação de origem; não se presume autorização institucional além do uso solicitado no projeto.

## Continuidade

Hospedagem planejada na Vercel com Next.js. Após conectar o repositório GitHub ao projeto, alterações da branch de produção poderão disparar novas publicações. Consulte `docs/delivery.md` para o estado real da publicação e eventuais pendências de acesso.
