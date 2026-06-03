# Correcao: Flag de Desclassificado em Atleta e Propagacao em Chaves de 2 e 3 Atletas

## 1. Contexto e Objetivo

- **O que e:** Correcao no registro de resultado de luta para: (1) identificar explicitamente qual atleta foi desclassificado na luta, (2) garantir que em chaves de 2 atletas o vencedor seja declarado campeao direto sem propagacao desnecessaria, (3) garantir que em chaves de 3 atletas o atleta com bye avance corretamente quando o oponente da rodada anterior for desclassificado.

- **Por que existe:** Atualmente o campo `desclassificacao` na Luta e apenas um boolean que nao identifica qual atleta foi desclassificado. Alem disso, em chaves de 3 atletas, quando ocorre desclassificacao na rodada 1, o atleta desclassificado e erroneamente propagado para a rodada 2 (luta do bye), quando deveria ser eliminado e o atleta de bye deveria avancar diretamente.

- **Quem usa:** Administradores do torneio usando o placar (PlacarLuta) e operadores registrando resultados.

- **Escopo:** Dentro: correcao do modelo `Luta`, correcao do handler `registrarResultadoHandler` no backend, propagacao correta em brackets de 2 e 3 atletas. Fora: propagacao em brackets de 4, 5 ou 16 atletas (nao sao afetados por este problema).

---

## 2. Analise dos Documentos de Referencia

- **Guia de spec** (`doc/spec.md`): este documento segue todas as secoes.
- **Documento de requisitos** (`doc/requisitos.md`): secao 3.18 (Placar/Scoreboard) descreve o fluxo de placar e registro de resultado.
- **Codigo-fonte relevante:**
  - `src/types/bracket.ts` — interface `Luta` com `desclassificacao?: boolean`
  - `electron/brackets.ts` — `registrarResultadoHandler` contem logica de propagacao para 2, 3, 4, 5 e 16 atletas
  - `src/pages/PlacarLuta.tsx` — UI do placar, modal de finalizacao com tipo `desclassificacao`
  - `src/components/RegistrarResultadoModal.tsx` — modal alternativo de registro de resultado (usado no PlacarBracket)

---

## 3. Historia de Usuario

```
Como administrador do torneio,
quero que atletas desclassificados sejam identificados com uma flag especifica
e que a chave seja resolvida corretamente (campeao direto em chave de 2,
bye avancando em chave de 3 quando o oponente for desclassificado),
para que o bracket reflita com precisao o estado real da competicao.
```

Cenarios alternativos:
- Luta sem desclassificacao: comportamento existente permanece inalterado.
- Desclassificacao em chave de 4 ou 5 atletas: propagacao segue a logica generica (`advanceWinnerInChave`), que apenas avanca o vencedor — o perdedor (DQ) nao e propagado, entao o comportamento ja esta correto.
- Re-registro de resultado (troca de vencedor): `clearWinnerFromLaterRounds` ja limpa propagacoes anteriores.

---

## 4. Requisitos Funcionais

- [ ] RF-01: A interface `Luta` deve conter o campo `desclassificadoId?: string` indicando qual atleta foi desclassificado.
- [ ] RF-02: Ao registrar resultado com `desclassificacao: true`, o handler deve preencher `desclassificadoId` com o ID do atleta perdedor (o que nao e o `vencedorId`).
- [ ] RF-03: Ao registrar resultado com `desclassificacao: false` ou `undefined`, `desclassificadoId` deve ser `undefined`.
- [ ] RF-04: Em chaves de 2 atletas (1 luta, 1 rodada), ao registrar resultado nao ha propagacao para rodada seguinte — o vencedor e campeao direto. Comportamento atual ja esta correto, deve ser mantido.
- [ ] RF-05: Em chaves de 3 atletas, quando a rodada 1 tem desclassificacao, o atleta perdedor (desclassificado) NAO deve ser colocado na rodada 2. Em vez disso, o atleta com bye (posicao 2, que estava na rodada 2) deve avancar diretamente para a rodada 3.
- [ ] RF-06: Em chaves de 3 atletas, quando a rodada 1 NAO tem desclassificacao, o comportamento atual deve ser mantido (perdedor vai para rodada 2 vs bye).
- [ ] RF-07: O campo `desclassificadoId` deve ser preservado na normalizacao (`normalizeLuta`) e ao carregar chaves.
- [ ] RF-08: O campo `desclassificadoId` deve ser incluido na propagacao de vencedor (apenas informativo, nao usado na logica de propagacao).

---

## 5. Requisitos Nao-Funcionais

- **Performance:** impacto negligivel — apenas uma comparacao de string adicional e uma atribuicao.
- **Seguranca:** nenhuma alteracao relevante.
- **Compatibilidade:** o campo `desclassificadoId` e opcional (`?`), garantindo compatibilidade retroativa com chaves existentes que nao possuem o campo.
- **Observabilidade:** logs de erro permanecem inalterados.

---

## 6. Analise da Aplicacao

### Arquitetura geral
- **Frontend:** React + Mantine UI, renderer process do Electron
- **Backend:** Electron main process com handlers IPC
- **Persistencia:** JSON em disco (`{userData}/data/torneios/{id}.json`)
- **Comunicacao:** IPC (`contextBridge` expoe `window.electronAPI`)

### Fluxo de dados do registro de resultado
1. Renderer (PlacarLuta) → IPC `registrar-resultado` → Main handler (`registrarResultadoHandler`) → salva JSON → retorna Chave atualizada
2. Main handler carrega o torneio, modifica a luta, propaga vencedor para rodadas seguintes, salva

### Contratos de API
- IPC `registrar-resultado` recebe `{ chaveId, lutaId, vencedorId, status, placarA, placarB, finalizacao, desclassificacao, desempateArbitro }`
- Retorna `Chave` atualizada

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/types/bracket.ts` | Modificar | Adicionar campo `desclassificadoId?: string` na interface `Luta` |
| `electron/brackets.ts` | Modificar | Atualizar `registrarResultadoHandler` para: (1) preencher `desclassificadoId`, (2) tratar DQ em chaves de 3 atletas — nao propagar DQ para R2, avancar bye direto para R3; (3) atualizar `normalizeLuta` para preservar `desclassificadoId` |
| `src/pages/PlacarLuta.tsx` | Modificar | Incluir `desclassificadoId` na chamada IPC `registrarResultado` |
| `src/components/RegistrarResultadoModal.tsx` | Modificar | Nenhuma — o modal nao oferece opcao de DQ explicita, apenas selecao de vencedor. O fluxo de DQ ocorre exclusivamente no PlacarLuta. |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum identificado. A mudanca e localizada e retroativa.

### 8.2 Ambiguidades nos Requisitos
- O que acontece se uma luta ja finalizada for re-aberta e o resultado alterado de DQ para normal? O `desclassificadoId` deve ser limpo. Resolvido: ao registrar resultado sem `desclassificacao`, o handler deve limpar `desclassificadoId`.
- E se ambos os atletas forem desclassificados? O sistema atual nao suporta dupla DQ (o operador sempre declara um vencedor). Mantido.

### 8.3 Riscos
- Baixo. Mudancas sao retroativamente compativeis (campo opcional).

---

## 9. Criterios de Aceite

- [ ] CA-01: Dado um registro de resultado com `desclassificacao: true`, quando o handler processa, entao a luta salva contem `desclassificadoId` igual ao ID do atleta perdedor.
- [ ] CA-02: Dado um registro de resultado com `desclassificacao: false`, quando o handler processa, entao `desclassificadoId` e `undefined`.
- [ ] CA-03: Dada uma chave de 2 atletas com DQ, quando o resultado e registrado, entao o vencedor e o atleta nao-DQ e nenhuma propagacao adicional ocorre (campeao direto).
- [ ] CA-04: Dada uma chave de 3 atletas com DQ na rodada 1 (ex: atleta A vs B, B DQ), quando o resultado e registrado, entao: (a) `desclassificadoId` = B, (b) o atleta C (bye) avanca direto para R3, (c) R2 fica com status adequado (pulado ou ignorado).
- [ ] CA-05: Dada uma chave de 3 atletas SEM DQ na rodada 1, quando o resultado e registrado, entao o comportamento existente e mantido (perdedor vai para R2 vs bye).
- [ ] CA-06: Dado um torneio existente com chaves que nao possuem `desclassificadoId`, quando carregado via `normalizeLuta`, entao o campo e `undefined` (sem erro).
- [ ] CA-07: Dado um registro de resultado DQ, quando a luta e exibida no bracket, entao o atleta desclassificado aparece com indicacao visual de DQ (onde aplicavel).

---

## 10. Plano de Implementacao (Passo a Passo)

```
Passo 1: Adicionar campo `desclassificadoId` na interface Luta
  - O que fazer: Adicionar `desclassificadoId?: string` a interface `Luta` em `src/types/bracket.ts`
  - Arquivo(s): `src/types/bracket.ts`
  - Como validar: `npm run build` ou `tsc` nao deve acusar erro de tipo

Passo 2: Atualizar registrarResultadoHandler para preencher desclassificadoId e corrigir propagacao DQ em chaves de 3
  - O que fazer:
    (a) No handler, quando `desclassificacao` for true, calcular `desclassificadoId` como o atleta que NAO e o vencedor.
    (b) Quando `desclassificacao` for false/undefined, limpar `desclassificadoId` (setar undefined).
    (c) No bloco de chave de 3 atletas (`chave.totalAtletas === 3`), quando `luta.rodada === 1` e `desclassificacao` for true:
        - NAO colocar o perdedor na R2
        - Avancar o atleta de bye (posicao 2, atletaBId da R2) diretamente para R3.B
        - Marcar R2 como irrelevante (status 'completed' sem vencedor ou apenas ignorar)
    (d) No bloco de chave de 3 atletas, quando `luta.rodada === 1` e `desclassificacao` for false:
        - Manter comportamento existente (perdedor vai para R2)
  - Arquivo(s): `electron/brackets.ts`
  - Como validar: Testar registro de resultado com/sem DQ em chave de 3 atletas

Passo 3: Atualizar normalizeLuta para preservar desclassificadoId
  - O que fazer: Adicionar `desclassificadoId: (luta.desclassificadoId as string) ?? undefined` em `normalizeLuta`
  - Arquivo(s): `electron/brackets.ts`
  - Como validar: carregar chave existente sem o campo — deve retornar undefined sem erro

Passo 4: Atualizar PlacarLuta.tsx para incluir desclassificadoId no IPC
  - O que fazer: Ao enviar `registrarResultado`, incluir o campo `desclassificadoId` calculado (o perdedor, se tipo = desclassificacao)
  - Arquivo(s): `src/pages/PlacarLuta.tsx`
  - Como validar: registrar DQ e verificar no JSON salvo se o campo foi preenchido

Passo 5: Rodar lint e build para verificar consistencia
  - O que fazer: Executar `npm run lint` e `npm run build`
  - Como validar: Sem erros nem warnings
```

---

## 11. Rollout e Observabilidade

- **Estrategia de entrega:** Deploy direto (feature retroativamente compativel).
- **Como monitorar:** N/A — funcionalidade local sem metrica externa.
- **Plano de rollback:** Reverter commits.

---

## 12. Definicao de Pronto (DoD)

- [ ] Todos os criterios de aceite foram verificados manualmente
- [ ] Codigo revisado (auto-revisao documentada)
- [ ] Documentacao atualizada (este documento)
- [ ] Sem warnings ou erros no build (`npm run build`)
- [ ] Sem erros de lint (`npm run lint`)

---

## Checklist Rapido Antes de Comecar a Codar

- [x] Li os documentos de referencia (`doc/spec.md`, `doc/requisitos.md`, `src/types/bracket.ts`, `electron/brackets.ts`)
- [x] Entendi a historia de usuario e o objetivo de negocio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Liste os problemas e impedimentos
- [x] O plano de implementacao esta em ordem logica (modelo → backend → frontend)
- [x] Os criterios de aceite sao verificaaveis
- [x] Sinalizei todas as incertezas explicitamente
