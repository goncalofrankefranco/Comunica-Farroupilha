# Apple Design UI Refresh - Comunica Farroupilha

Data: 06/09/2026
Status: Aprovado
Branch de Trabalho: `feature/apple-design-ui`

---

## 1. Visão Geral e Objetivos

O objetivo deste projeto de design é repaginar visualmente a plataforma **Comunica Farroupilha**, elevando o nível estético e de acabamento para uma interface **clean, moderna e elegante**, inspirada nos princípios de design da **Apple (Human Interface Guidelines / WWDC - Designing Fluid Interfaces)**.

### Diretrizes Centrais
1. **Preservação de Estrutura e Funcionalidade**: Não alterar fluxos de usuário, disposições de páginas nem funcionalidades existentes ("não quero que mude muito").
2. **Apple Restraint & Cleanliness**: Reduzir o ruído visual gerado por bordas duras e caixas opacas consecutivas, substituindo-as por superfícies tonais leves, respiro harmônico e materiais translúcidos (*frosted glass*).
3. **Microinterações e Resposta Imediata (*Kill Latency*)**: Proporcionar sensação tátil instantânea ao clique e toque (`transform: scale(0.98)` com transições imediatas), tornando a plataforma viva e agradável de usar.
4. **Respeito à Identidade Visual**: Manter com distinção o Azul Farroupilha (`#0758b1`) e o Laranja GEF (`#f45a1a`) como cores de ação e destaque institucional.

---

## 2. Fundamentos Visuais e Materiais

### 2.1 Superfícies, Materiais e Profundidade
- **Plano de Fundo da Aplicação**: Ajuste para `#f8fafc` / `#f6f8fa`, criando uma base limpa e confortável para leitura.
- **Vidro Fosco (*Frosted Glass*)**:
  - Topbar fixa com `backdrop-filter: blur(20px) saturate(180%)` e fundo semitransparente `rgba(255, 255, 255, 0.82)`.
  - Modais com overlay `backdrop-filter: blur(16px) saturate(180%)` e fundo suave escurecido `rgba(15, 23, 42, 0.38)`.
- **Bordas Semitransparentes**: Substituição de `#dce5ed` por bordas sutis `rgba(0, 0, 0, 0.06)` e `rgba(23, 54, 93, 0.08)`.
- **Sombras Multicamadas**:
  - Nível 1 (Cards em repouso): `0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)`
  - Nível 2 (Hover / Seleção / Modais): `0 8px 30px rgba(15, 35, 60, 0.12)`

### 2.2 Tipografia e Ritmo
- **Tracking Óptico**:
  - Títulos (`h1`, `h2`, `h3`): `letter-spacing: -0.025em` a `-0.035em`, entrelinhas ajustadas para visual limpo estilo SF Pro.
  - Pequenos rótulos e metadados: tracking neutro ou levemente positivo (`0` a `+0.01em`) para máxima legibilidade.
- **Espaçamento e Respiro**:
  - Hierarquia clara entre blocos sem necessidade de linhas divisórias pesadas em todos os pontos.

---

## 3. Componentes de Interface

### 3.1 Cards de Propostas e Atividades
- Cantos arredondados suavizados para `16px` (estilo squircle Apple).
- Espaçamento interno ampliado para `22px 24px`.
- Efeito hover suave com sutil elevação e borda que reage com leve destaque.
- Barra de etapas de tramitação redesenhada com linhas conectivas elegantes e círculos mais limpos.

### 3.2 Badges de Status e Tags
- Formato **Pill** (`border-radius: 9999px`) com fundos pastéis translúcidos e texto com contraste rigoroso.
- Indicador dot pulsante ou minimalista para status ativos.

### 3.3 Botões e Ações
- **Primários**: Azul institucional com cantos em `10px` a `12px`, padding harmonioso e elevação discreta.
- **Apoiar e Acompanhar**:
  - Estado inativo: contorno refinado e ícone nítido.
  - Estado ativo: preenchimento sólido vibrante com suave brilho de cor (`box-shadow: 0 3px 12px rgba(244, 90, 26, 0.25)`).
- **Feedback Tátil**: `active: scale(0.98)` para dar resposta física imediata ao clique.

### 3.4 Sidebar e Topbar
- **Sidebar**: Lista de navegação com cantos arredondados nos itens (`10px`), transição suave de hover e indicador ativo refinado.
- **Topbar**: Busca em formato pill translúcido, ícones de notificação e perfil com feedback refinado.

### 3.5 Formulários e Entradas
- Inputs, textareas e selects com fundo `#f8fafc`, cantos arredondados de `10px`, borda ultrafina em repouso e anel de foco suave com glow translúcido.

### 3.6 Modais e Overlays
- Cantos de `20px`, espaçamento interno equilibrado, botões de fechamento intuitivos e animação de abertura suave.

---

## 4. Acessibilidade
- Suporte a `prefers-reduced-motion: reduce` mantendo transições instantâneas ou por opacidade direta.
- Alto contraste mantido para conformidade WCAG AA.

---

## 5. Plano de Entrega
1. Atualização dos tokens e classes utilitárias no `src/app/globals.css`.
2. Refinamento de classes e componentes no `src/components/gefshell.tsx`.
3. Validação com `typecheck`, `lint`, `build` e `test`.
4. Commit e push para a branch `feature/apple-design-ui`.
