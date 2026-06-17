# Spec: Geração Manual de Chaves

---

## 1. Contexto e Objetivo

- **O que é:** Capacidade de criar chaves de forma manual, selecionando atletas livremente (sem depender da categoria/belga automática), similar ao fluxo de luta casada mas com N atletas.
- **Por que existe:** O organizador pode querer criar chaves especiais (exhibição, convidados, misturando categorias) sem seguir a regra automática de separação por faixa/categoria.
- **Quem usa:** Administrador do torneio na tela "Gerenciar Chaves".
- **Escopo:** Criação manual de chaves com seleção livre de atletas. Não altera a geração automática existente.

---

## 2. História de Usuario

```
Como administrador do torneio,
quero criar chaves manualmente selecionando atletas livremente,
para montar chaves especiais sem seguir a separação automática por faixa/categoria.
```

**Cenários alternativos:**
- Usuário seleciona menos de 2 atletas → não pode criar chave.
- Usuário seleciona mais de 16 atletas → sistema valida limite.
- Usuário não informa nome → sistema gera nome automático baseado nos atletas.
- Usuário tenta adicionar atleta já em outra chave manual → aviso (não bloqueia, pois pode ser intencional).

---

## 3. Requisitos Funcionais

- [ ] RF-01: Na tela "Gerenciar Chaves", exibir botão "Criar Chave Manual" acessível tanto antes quanto depois da geração automática.
- [ ] RF-02: Ao clicar, abrir modal com campo "Nome da Chave" (opcional, placeholder automático) e lista de atletas para selecionar.
- [ ] RF-03: O modal permite adicionar/remover atletas dinamicamente (mínimo 2, máximo 16).
- [ ] RF-04: Cada atleta selecionado é exibido em card com nome, faixa, peso, equipe e categoria.
- [ ] RF-05: Atletas duplicados (mesmo selecionado duas vezes) são bloqueados com aviso.
- [ ] RF-06: Se o campo nome estiver vazio, o sistema gera um nome automático (ex: "Chave Manual — Atleta A, Atleta B, ...").
- [ ] RF-07: Ao confirmar, a chave é criada com `status: 'gerada'`, sem `categoriaId` (ou com `categoriaId: 'manual'`), e os atletas são marcados com `emChave = true`.
- [ ] RF-08: A chave manual aparece na listagem de chaves com badge "Manual".
- [ ] RF-09: A chave manual pode ser embaralhada, visualizada e ter árbitro atribuído (mesmo fluxo das chaves automáticas).
- [ ] RF-10: A exclusão de chave manual funciona igual à chave automática (soft context — não há exclusão de chave implementada, mas o fluxo de re-geração limpa todas).

---

## 4. Requisitos Nao-Funcionais

- **Performance:** Modal deve carregar lista de atletas rapidamente (já carregada no state da página).
- **Compatibilidade:** Chaves manuais coexistem com chaves automáticas sem conflito.

---

## 5. Analise da Aplicação

- **Arquitetura:** Frontend (React/Mantine) → IPC → Backend (Electron main) → JSON.
- **Padrão de referência:** Modal `ModalCriarLutaCasada.tsx` — Select pesquisável de atletas, cards de preview, validações.
- **Fluxo de dados:** Atletas já carregados no state de `GerenciarChaves`. Chave criada via IPC `gerar-chave` com `categoriaId` especial ou novo handler.

---

## 6. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/pages/GerenciarChaves.tsx` | Modificar | Adicionar botão "Criar Chave Manual" e modal de criação |
| `src/components/ModalCriarChaveManual.tsx` | Criar | Modal de criação manual de chave (novo componente) |
| `electron/brackets.ts` | Modificar | Handler `gerar-chave` aceitar `categoriaId: 'manual'` e lista de `atletaIds` |
| `electron/preload.ts` | Modificar | Atualizar assinatura de `gerarChave` para aceitar `atletaIds` |
| `src/types/electron.d.ts` | Modificar | Atualizar tipo de `gerarChave` |

---

## 7. Problemas e Impedimentos

### 7.1 Problemas Tecnicos
- O handler `gerar-chave` atual filtra atletas por `categoriaId`. Para chaves manuais, precisa aceitar uma lista explícita de `atletaIds` bypassando o filtro de categoria.

### 7.2 Ambiguidades nos Requisitos
- Chave manual com atletas de categorias diferentes: como exibir o título? (decisão: usar nome manual ou "Chave Manual — N atletas")

### 7.3 Riscos
- Atleta em chave manual + chave automática: o campo `emChave` é booleano, não lista. Um atleta não pode estar em duas chaves ao mesmo tempo. (decisão: bloquear se atleta já estiver em qualquer chave)

---

## 8. Criterios de Aceite

- [ ] CA-01: dado que existem atletas cadastrados, quando o administrador clica "Criar Chave Manual", então um modal abre com campo de nome e lista de atletas.
- [ ] CA-02: dado que o administrador seleciona 3 atletas e clica "Criar", então uma chave com 3 atletas é criada e aparece na listagem.
- [ ] CA-03: dado que o administrador não preenche o nome, quando cria a chave, então o nome é gerado automaticamente.
- [ ] CA-04: dado que um atleta já está em uma chave, quando o administrador tenta adicioná-lo à chave manual, então um aviso é exibido e o atleta não é adicionado.
- [ ] CA-05: caso de erro — dado que o administrador seleciona apenas 1 atleta, quando clica "Criar", então o botão está desabilitado.

---

## 9. Plano de Implementacao

```
Passo 1: Atualizar backend (electron/brackets.ts)
  - O que fazer: Modificar handler `gerar-chave` para aceitar `atletaIds?: string[]` bypassando filtro de categoria quando fornecido.
  - Arquivo(s): electron/brackets.ts
  - Como validar: Gerar chave manual com atletas de categorias diferentes.

Passo 2: Atualizar preload e tipos
  - O que fazer: Atualizar assinatura de `gerarChave` em preload.ts e electron.d.ts.
  - Arquivo(s): electron/preload.ts, src/types/electron.d.ts
  - Como validar: Typecheck sem erros.

Passo 3: Criar componente ModalCriarChaveManual
  - O que fazer: Criar modal seguindo padrão de ModalCriarLutaCasada, com campo nome, MultiSelect de atletas, cards de preview, validações.
  - Arquivo(s): src/components/ModalCriarChaveManual.tsx
  - Como validar: Modal abre, seleciona atletas, cria chave.

Passo 4: Integrar na GerenciarChaves
  - O what: Adicionar botão "Criar Chave Manual" e chamar o modal. Atualizar lista de chaves ao criar.
  - Arquivo(s): src/pages/GerenciarChaves.tsx
  - Como validar: Botão visível, modal funciona, chave aparece na listagem.
```

---

## 10. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto.
- **Como monitorar:** Chaves manuais aparecem na listagem com badge "Manual".
- **Plano de rollback:** Reverter handler e remover componente.

---

## 11. Definição de Pronto

- [ ] Todos os critérios de aceite verificados
- [ ] Typecheck sem erros
- [ ] Histórico de Correções em spec.md atualizado
