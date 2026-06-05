# Spec: Modelo de Dashboard — Painel Administrativo

## 1. Contexto e Objetivo

- **O que é:** Novo layout do Dashboard administrativo com sidebar de navegação, hero banner, header com stats rápidos (Atletas, Equipes) e cards enriquecidos com badges e link "Acessar →".
- **Por que existe:** O Dashboard atual possui apenas cards simples em grid. O modelo traz uma experiência mais profissional com informações contextuais (contagens, hero banner) e navegação lateral consistente.
- **Quem usa:** Organizadores do torneio que acessam `/admin/dashboard`.
- **Escopo:**
  - Dentro: `Dashboard.tsx`, `PageLayout.tsx` (se necessário), `theme.ts` (cores).
  - Fora: Demais páginas, lógica de negócio, IPC, estado do torneio.

---

## 2. Análise dos Documentos de Referência

- **Requisitos** (`doc/requisitos.md`): §3.6 define o Dashboard, §9.1.1 define a paleta (incluindo as novas cores: marinho `#1b325f`, azul `#3a89c9`, coral `#f26c4f`, azul claro `#9cc4e4`, fundo `#e9f2f9`).
- **Guia de spec** (`doc/spec.md`): template de 12 seções.
- **HTML de referência:** Sidebar escura, hero gradient, cards com footer e link "Acessar →", header com stats.
- **Código-fonte atual:** `src/pages/Dashboard.tsx` — grid simples de `MenuCard` sem sidebar, hero ou stats.

---

## 3. História de Usuário

```
Como organizador do torneio,
quero um dashboard completo com sidebar de navegação, indicadores rápidos de atletas e equipes, e cards com informações contextuais,
para que eu possa monitorar o evento e acessar rapidamente qualquer módulo do sistema.
```

---

## 4. Requisitos Funcionais

- [x] RF-01: Header do Dashboard exibe nome/data do torneio, badge "Iniciado {data}" com dot pulsante, e stats rápidos de **Atletas** (contagem total) e **Equipes** (contagem total).
- [x] RF-02: Hero banner com fundo sólido (marinho `#1b325f`), badge "Painel Geral", título e subtítulo.
- [x] RF-03: Cards de navegação em grid responsivo (1 col <700px, 2 col <1000px, 2 col <1400px, 3 col <1800px, 4 col ≥1800px).
- [x] RF-04: Cada card possui: ícone em container circular com cor distinta (`#3a89c9` para maioria, `#f26c4f` para Placar/Resultados), título, descrição, badge no rodapé, link "Acessar →" com hover translateX.
- [x] RF-05: Sidebar de navegação (visível ≥ 1024px) com fundo marinho `#1b325f`, links para todas as seções, active tab com destaque azul e borda esquerda.
- [x] RF-06: Labels renomeados: "Atletas Confirmados" → "Atletas", "Equipes Ativas" → "Equipes".
- [x] RF-07: Stats do header obtidos via consulta à lista de atletas e equipes do torneio ativo.
- [x] RF-08: Hero banner sem gradient — fundo sólido `#1b325f`.
- [x] RF-09: Ícones dos cards usam a mesma cor do container (ex.: ícone azul em fundo azul transparente), sem ícone branco.

---

## 5. Requisitos Não-Funcionais

- **Performance:** Consultas de contagem devem ser síncronas (já carregadas no JSON do torneio).
- **Acessibilidade:** Sidebar com `role="navigation"`, links com `aria-label`, focus visible.
- **Compatibilidade:** Sidebar recolhida em mobile (< 1024px), grid responsivo.
- **Responsividade:** 1–4 colunas conforme largura da janela.

---

## 6. Análise da Aplicação

- **Dashboard.tsx** é o componente alvo. Atualmente carrega torneio ativo via `getActiveTournament()` e renderiza `MenuCard` em grid.
- **MenuCard** já possui `iconBg`, `iconColor`, `badge` props — suficientes para o novo modelo.
- **PageLayout** não precisa ser alterado — o Dashboard pode estender seu próprio header.
- **Tema:** Cores adicionais (`#1b325f`, `#3a89c9`, `#9cc4e4`, `#e9f2f9`, `#f26c4f`) já documentadas em §9.1.1 dos requisitos.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/pages/Dashboard.tsx` | Modificar | Adicionar sidebar, hero banner, header stats, cards enriquecidos |
| `src/styles/theme.ts` | Modificar (se necessário) | Mapear novas cores como tokens do tema |
| `src/styles/global.css` | Modificar (se necessário) | Estilos da sidebar e hero banner |
| `doc/requisitos.md` | Modificar | §3.6 atualizado com novo modelo |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- Sidebar fixa em telas grandes vs. layout atual baseado em `PageLayout`. Decisão: o Dashboard usará layout próprio (sem `PageLayout`) ou a `PageLayout` precisará de uma prop `sidebar`? Decidido: manter `PageLayout` com `maxWidth` maior e adicionar sidebar como componente interno do Dashboard.

### 8.2 Ambiguidades nos Requisitos

- Nenhuma.

### 8.3 Riscos

- Baixo. Mudança puramente visual, sem alteração de lógica de negócio.

---

## 9. Critérios de Aceite

- [ ] CA-01: Header exibe stats de Atletas e Equipes com números corretos do torneio ativo.
- [ ] CA-02: Hero banner gradient aparece acima dos cards com badge "Painel Geral".
- [ ] CA-03: Cards têm ícone colorido, badge de contagem no footer, link "Acessar →".
- [ ] CA-04: Sidebar de navegação visível em ≥ 1024px, recolhida em < 1024px.
- [ ] CA-05: Labels "Atletas Confirmados" e "Equipes Ativas" não aparecem em lugar nenhum — substituídos por "Atletas" e "Equipes".
- [ ] CA-06: Navegação pelos cards funciona (rota correta).
- [ ] CA-07: tsc passa limpo.

---

## 10. Plano de Implementação

```
Passo 1: Dashboard.tsx — adicionar header stats com contagem real de atletas/equipes do torneio
Passo 2: Dashboard.tsx — adicionar hero banner gradient acima do grid de cards
Passo 3: Dashboard.tsx — enriquecer cards com iconBg/iconColor/badge e footer "Acessar →"
Passo 4: Dashboard.tsx — adicionar sidebar de navegação (opcional, lg+)
Passo 5: Verificar tsc
```

---

## 11. Rollout e Observabilidade

Deploy direto. Verificar visualmente que todos os elementos aparecem e as contagens estão corretas.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite verificados
- [ ] Código revisado
- [ ] Documentação atualizada (spec + requisitos.md)
- [ ] tsc passou limpo
- [ ] Histórico de Correções atualizado em doc/spec.md
