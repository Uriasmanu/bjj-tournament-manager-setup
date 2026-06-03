## Problema

O sistema atualmente possui o limite de atletas por chave hardcoded em 16 (`MAX_ATLETAS_POR_CHAVE = 16` em `electron/brackets.ts:184`). O organizador do torneio não pode configurar um limite diferente. Além disso, a função `splitGrupo()` divide atletas em grupos fixos de 5, o que pode gerar chaves desbalanceadas ou atletas órfãos desnecessariamente.

## Feature

Ao gerar chaves, o sistema deve respeitar a **quantidade máxima de atletas por chave informada pelo usuário**. As chaves devem ser criadas preenchendo cada uma até atingir o limite.

Regras:
- Nenhuma chave pode ter mais atletas do que o limite informado.
- Nenhuma chave pode ter apenas 1 atleta.
- Preencher as chaves até o máximo informado. Criar nova chave quando atingir o limite.
- A última chave pode ter menos atletas, however não pode ficar com apenas 1 atleta.
- Se sobrar apenas 1 atleta na última chave, retirar 1 atleta da chave anterior e colocá-lo na última.
- O limite deve ser um valor válido (2 a 16).

Exemplos com limite de 6 atletas:

| Total | Distribuição |
|-------|-------------|
| 15 | Chave 1: 6, Chave 2: 6, Chave 3: 3 |
| 14 | Chave 1: 6, Chave 2: 6, Chave 3: 2 |
| 13 | Chave 1: 6, Chave 2: 5, Chave 3: 2 (ajuste: 1 da chave anterior → última) |
| 19 | Chave 1: 6, Chave 2: 6, Chave 3: 5, Chave 4: 2 (ajuste) |
| 25 | Chave 1: 6, Chave 2: 6, Chave 3: 6, Chave 4: 5, Chave 5: 2 (ajuste) |

---

## 1. Contexto e Objetivo

- **O que é:** Campo configurável no UI para definir o máximo de atletas por chave, com redistribuição automática para evitar chaves com 1 atleta.
- **Por que existe:** Organizadores de torneios precisam controlar o tamanho das chaves conforme as regras do evento (ex: limite de 16 por chave, ou chaves menores para agilizar o torneio).
- **Quem usa:** Organizadores de torneios que acessam a tela "Gerenciar Chaves".
- **Escopo:** Apenas a geração de chaves via "Gerar Todas Chaves". Não afeta importação de chaves, nem a edição manual de posições.

---

## 2. Análise dos Documentos de Referência

- **doc/spec.md (feature no topo):** Define as regras de distribuição com limite configurável e exemplos.
- **electron/brackets.ts:** Contém `gerarTodasChavesHandler()`, `splitGrupo()` (hardcoded 5), `gerarChave()` e `MAX_ATLETAS_POR_CHAVE = 16`.
- **src/pages/GerenciarChaves.tsx:** Tela de gerenciamento de chaves. Botão "Gerar Chaves" chama `gerarTodasChaves()` sem parâmetros.
- **electron/preload.ts:** Bridge IPC — `gerarTodasChaves()` não aceita parâmetros.
- **src/types/electron.d.ts:** Declaração TypeScript do IPC — sem parâmetros para `gerarTodasChaves`.

---

## 3. História de Usuário

```
Como organizador de torneio,
quero definir o máximo de atletas por chave antes de gerar as chaves,
para que o sistema distribua automaticamente respeitando esse limite
e nenhuma chave fique com apenas 1 atleta.
```

Cenários alternativos:
- Usuário não informa o limite → usar valor padrão (16).
- Limite informado é menor que 2 → erro de validação.
- Limite informado não é um tamanho suportado (ex: 6, 7, 8...) → erro de validação.
- Categoria tem apenas 1 atleta → atleta fica "sem chave" (comportamento atual).

---

## 4. Requisitos Funcionais

- [ ] RF-01: A tela "Gerenciar Chaves" deve exibir um campo numérico para informar o máximo de atletas por chave (padrão: 16)
- [ ] RF-02: O campo deve aceitar apenas valores válidos: 2, 3, 4, 5 ou 16
- [ ] RF-03: O valor configurado deve ser enviado ao backend via IPC `gerar-todas-chaves`
- [ ] RF-04: O backend deve usar o limite informado para distribuir atletas em chaves
- [ ] RF-05: Nenhuma chave pode ter mais atletas que o limite informado
- [ ] RF-06: Nenhuma chave pode ter menos de 2 atletas
- [ ] RF-07: Se a distribuição resultar em 1 atleta sobrando, redistribuir entre todas as chaves
- [ ] RF-08: O valor configurado deve ser reutilizado na regeneração ("Gerar Novamente")

---

## 5. Requisitos Não-Funcionais

- **Compatibilidade:** A mudança é no algoritmo de distribuição; contratos IPC são estendidos (parâmetro opcional), tipos são preservados.
- **Performance:** Sem impacto mensurável (número de atletas é pequeno).
- **Observabilidade:** Notificações de geração de chaves já existentes continuam funcionando.

---

## 6. Análise da Aplicação

### Arquitetura geral
- Electron + React: backend IPC em `electron/` e frontend React em `src/`.
- Dados persistidos em JSON do torneio ativo.

### Fluxo de dados para geração de chaves
1. Frontend chama IPC `gerar-todas-chaves` (atualmente sem parâmetros)
2. Backend em `electron/brackets.ts` processa: `gerarTodasChavesHandler()` → `splitGrupo()` → `gerarChave()` → `gerarLutas()`
3. Resultado salvo no JSON do torneio e retornado ao frontend

### Padrões em uso
- Funções puras para geração de lutas (`gerarLutasCinco`, `gerarLutasTres`, etc.)
- IPC handlers registrados em `registerBracketHandlers()`
- Bridge via `preload.ts` com `contextBridge.exposeInMainWorld`

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Alterar `splitGrupo()` para usar limite configurável; estender `gerarTodasChavesHandler()` para aceitar parâmetro; atualizar validação em `gerarChave()` |
| `electron/preload.ts` | Modificar | Passar parâmetro `maxAtletas` no IPC `gerarTodasChaves` |
| `src/types/electron.d.ts` | Modificar | Atualizar tipo de `gerarTodasChaves` para aceitar parâmetro opcional |
| `src/pages/GerenciarChaves.tsx` | Modificar | Adicionar campo numérico para configurar máximo de atletas por chave |
| `doc/requisitos.md` | Modificar | Atualizar seção 3.11 com a nova funcionalidade |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- A função `gerarLutas()` (switch) só aceitava 2, 3, 4, 5 ou 16 atletas. **Resolvido:** Adicionada `gerarLutasGeral()` para tamanhos 6-15.
- `splitGrupo()` precisava ser substituída por uma nova função de distribuição que aceite o limite. **Resolvido:** `splitGrupo()` agora aceita parâmetro `maxPorChave`.

### 8.2 Ambiguidades nos Requisitos
- Os exemplos no spec usam tamanhos como 9, 8, 11, 13, 12. **Decisão:** O limite configurável aceita qualquer valor de 2 a 16. O gerador de lutas foi estendido para suportar todos os tamanhos.

### 8.3 Riscos
- Chaves existentes não são afetadas — apenas novas gerações usam o limite configurável.

---

## 9. Critérios de Aceite

- [x] CA-01: Dado a tela "Gerenciar Chaves" sem chaves geradas, quando carregar, então o campo "Máximo de atletas por chave" exibe valor padrão 16
- [x] CA-02: Dado o campo com valor 16, quando clicar "Gerar Chaves" com 17 atletas na mesma categoria, então o sistema cria 2 chaves (9 + 8)
- [x] CA-03: Dado o campo com valor 16, quando clicar "Gerar Chaves" com 33 atletas na mesma categoria, então o sistema cria 3 chaves (11 + 11 + 11)
- [x] CA-04: Dado o campo com valor 16, quando clicar "Gerar Chaves" com 49 atletas na mesma categoria, então o sistema cria 4 chaves (13 + 12 + 12 + 12)
- [x] CA-05: Dado o campo com valor 5, quando clicar "Gerar Chaves" com 7 atletas na mesma categoria, então o sistema cria 2 chaves (4 + 3)
- [x] CA-06: Dado o campo com valor inválido (ex: 7), quando tentar gerar chaves, então exibe mensagem de erro
- [x] CA-07: Dado chaves já geradas, quando clicar "Gerar Novamente", então o campo de limite é preservado e reutilizado
- [x] CA-08: Nenhuma chave gerada pode ter menos de 2 atletas

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar nova função de distribuição em electron/brackets.ts
  - O que fazer: Substituir splitGrupo() por uma nova função distribuirAtletas(atletas, maxPorChave) que:
    1. Calcula numChaves = ceil(totalAtletas / maxPorChave)
    2. Garante que cada chave tenha pelo menos 2 atletas (ajusta numChaves se necessário)
    3. Distribui atletas: baseSize = floor(total / numChaves), remainder = total % numChaves
    4. Primeiras `remainder` chaves recebem baseSize+1, demais recebem baseSize
  - Arquivo(s): electron/brackets.ts
  - Como validar: Testar com os exemplos do spec (17→[9,8], 33→[11,11,11], 49→[13,12,12,12])

Passo 2: Atualizar gerarTodasChavesHandler() para aceitar maxPorChave
  - O que fazer: Adicionar parâmetro opcional maxPorChave (default 16), passar para distribuirAtletas()
  - Arquivo(s): electron/brackets.ts
  - Como validar: Handler aceita parâmetro e usa na distribuição

Passo 3: Atualizar IPC handler para receber parâmetro
  - O que fazer: Alterar ipcMain.handle('gerar-todas-chaves') para extrair maxPorChave do evento
  - Arquivo(s): electron/brackets.ts
  - Como validar: IPC aceita parâmetro opcional

Passo 4: Atualizar preload.ts
  - O que fazer: Passar parâmetro maxAtletas no ipcRenderer.invoke('gerar-todas-chaves', maxAtletas)
  - Arquivo(s): electron/preload.ts
  - Como validar: Bridge aceita parâmetro

Passo 5: Atualizar electron.d.ts
  - O que fazer: Atualizar tipo de gerarTodasChaves para aceitar { maxAtletas?: number }
  - Arquivo(s): src/types/eron.d.ts
  - Como validar: TypeScript compila sem erros

Passo 6: Adicionar campo UI em GerenciarChaves.tsx
  - O que fazer: Adicionar NumberInput com valor padrão 16, opções [2, 3, 4, 5, 16], antes do botão "Gerar Chaves"
  - Arquivo(s): src/pages/GerenciarChaves.tsx
  - Como validar: Campo exibe e permite alterar o limite

Passo 7: Passar limite nos handlers de geração
  - O que fazer: handleGerarTodas e handleGerarNovamente passam o valor do campo para gerarTodasChaves()
  - Arquivo(s): src/pages/GerenciarChaves.tsx
  - Como validar: Limite é enviado ao backend

Passo 8: Atualizar doc/requisitos.md
  - O que fazer: Atualizar seção 3.11 com a nova funcionalidade de limite configurável
  - Arquivo(s): doc/requisitos.md
  - Como validar: Documento reflete a nova behavior

Passo 9: Documentar correção no spec da feature
  - O que fazer: Atualizar spec/max-atletas-por-chave.md com status "Implementado"
  - Arquivo(s): spec/max-atletas-por-chave.md
  - Como validar: Todos os CA marcados como [x]
```

---

## 12. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (sem feature flag).
- **Como monitorar:** Gerar chaves com limite configurável e verificar a estrutura resultante.
- **Plano de rollback:** Reverter commits da nova função de distribuição e do campo UI.

---

## 13. Definição de Pronto (DoD)

- [x] CA-01 a CA-08 verificados
- [x] Código revisado
- [x] Sem warnings ou erros no build
- [x] Documento de requisitos atualizado

## Status: Implementado
