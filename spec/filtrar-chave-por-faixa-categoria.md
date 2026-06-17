# Spec: Filtrar Geração de Chaves por Cor de Faixa e Categoria

> **Atualização (2026-06-17):** Filtros UI foram removidos — a separação por faixa/categoria é regra interna sempre aplicada. Apenas as correções backend permanecem.

---

## 1. Contexto e Objetivo

- **O que é:** Capacidade de filtrar a geração de chaves por cor de faixa (belt color) e/ou categoria, tanto na geração em massa quanto na geração individual.
- **Por que existe:** O sistema já agrupava atletas por `(categoria, faixa)` na geração em massa, mas o handler de geração individual (`gerar-chave`) misturava todas as faixas de uma categoria. A UI não oferecia controle sobre quais faixas/categorias gerar.
- **Quem usa:** Administrador do torneio na tela "Gerenciar Chaves".
- **Escopo:** Filtros na geração de chaves (bulk e individual). Não altera regras de propagação, placar ou exibição.

---

## 2. História de Usuario

```
Como administrador do torneio,
quero filtrar a geração de chaves por cor de faixa e/ou categoria,
para gerar chaves seletivamente sem misturar faixas diferentes.
```

**Cenários alternativos:**
- Usuário não seleciona nenhum filtro → todas as faixas/categorias são geradas (comportamento legado).
- Filtro resulta em grupo com apenas 1 atleta → atleta fica "sem chave".
- Filtro resulta em grupo vazio → nenhuma chave gerada para aquele组合o.

---

## 3. Requisitos Funcionais

- [x] RF-07: O handler `gerar-chave` (IPC individual) aceita parâmetro opcional `faixa?` e filtra atletas por ela antes de gerar a chave.
- [x] RF-08: O handler `gerar-todas-chaves` (IPC bulk) aceita arrays opcionais `faixas?` e `categorias?` e filtra atletas antes do agrupamento (parâmetros mantidos para compatibilidade).
- [ ] ~~RF-01 a RF-06, RF-09:~~ Removidos — filtros UI não são necessários, a separação é regra interna sempre aplicada automaticamente pelo backend.

---

## 4. Requisitos Nao-Funcionais

- **Performance:** Filtros são aplicados no backend antes do agrupamento, sem impacto perceptível.
- **Compatibilidade:** JSONs legados sem os novos parâmetros continuam funcionando (parâmetros são opcionais).

---

## 5. Analise da Aplicação

- **Arquitetura:** Frontend (React/Mantine) → IPC (Electron preload) → Backend (Electron main process) → Persistência (JSON).
- **Padrões existentes:** `MultiSelect` já usado em `AreaForm.tsx` para seleção múltipla de árbitros.
- **Fluxo de dados:** Filtros do UI → parâmetros IPC → filtragem no backend antes do agrupamento `categoria__faixa`.

---

## 6. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Adicionar parâmetros `faixas?` e `categorias?` ao `gerarTodasChavesHandler` e `faixa?` ao handler `gerar-chave` |
| `electron/preload.ts` | Modificar | Atualizar assinatura de `gerarTodasChaves` e `gerarChave` |
| `src/types/electron.d.ts` | Modificar | Atualizar tipos das funções IPC |
| `src/pages/GerenciarChaves.tsx` | ~~Modificar~~ | ~~Adicionar `MultiSelect` de faixa e categoria~~ Removido — filtros UI não necessários |

---

## 7. Problemas e Impedimentos

### 7.1 Problemas Tecnicos
- Nenhum identificado.

### 7.2 Ambiguidades nos Requisitos
- Nenhuma.

### 7.3 Riscos
- Filtros vazios devem preservar comportamento legado (gerar tudo).

---

## 8. Criterios de Aceite

- [ ] CA-01: dado que existem atletas com faixa "azul" e "roxa" na categoria "adulto-masculino-leve", quando o administrador seleciona apenas "azul" no filtro de faixa e clica "Gerar Chaves", então apenas atletas com faixa "azul" são incluídos na chave gerada.
- [ ] CA-02: dado que existem atletas em 3 categorias, quando o administrador seleciona 1 categoria no filtro e clica "Gerar Chaves", então chaves são geradas apenas para aquela categoria.
- [ ] CA-03: dado que os filtros estão vazios, quando o administrador clica "Gerar Chaves", então o comportamento é idêntico ao legado (todas as faixas e categorias são geradas).
- [ ] CA-04: dado que o administrador seleciona faixa "roxa" e categoria "adulto-masculino-leve", quando gera chaves, então apenas atletas com faixa "roxa" E categoria "adulto-masculino-leve" são incluídos.
- [ ] CA-05: caso de erro — dado que nenhum atleta corresponde aos filtros selecionados, quando o administrador clica "Gerar Chaves", então nenhuma chave é gerada e uma notificação informativa é exibida.

---

## 9. Plano de Implementacao

```
Passo 1: Atualizar backend (electron/brackets.ts)
  - O que fazer: Adicionar parâmetros `faixas?` e `categorias?` ao `gerarTodasChavesHandler` e aplicar filtros antes do agrupamento. Adicionar `faixa?` ao handler `gerar-chave` e filtrar atletas.
  - Arquivo(s): electron/brackets.ts
  - Como validar: Verificar que chaves geradas com filtros contêm apenas atletas dos filtros aplicados.

Passo 2: Atualizar preload e tipos
  - O que fazer: Atualizar assinatura de `gerarTodasChaves` e `gerarChave` em preload.ts e electron.d.ts.
  - Arquivo(s): electron/preload.ts, src/types/electron.d.ts
  - Como validar: Typecheck sem erros nos arquivos modificados.

Passo 3: Atualizar UI (GerenciarChaves.tsx)
  - O que fazer: Adicionar state para `filterFaixas` e `filterCategorias`. Adicionar `MultiSelect` ao modal de configuração. Passar filtros para handlers.
  - Arquivo(s): src/pages/GerenciarChaves.tsx
  - Como validar: UI exibe dropdowns funcionais, filtros são passados corretamente ao backend.
```

---

## 10. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (funcionalidade backward-compatible).
- **Como monitorar:** Verificar que chaves geradas com filtros contêm apenas atletas das faixas/categorias selecionadas.
- **Plano de rollback:** Reverter para versão anterior dos handlers (parâmetros opcionais são ignorados).

---

## 11. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Typecheck sem erros nos arquivos modificados
- [x] Seção "Histórico de Correções" em spec.md atualizada
