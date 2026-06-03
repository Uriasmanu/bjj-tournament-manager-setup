## Problema

A geracao de chaves com 5 atletas esta implementada com 2 lutas na primeira rodada (quartas de final), mas o formato oficial da IBJJF determina que, para chaves de 5 atletas, deve haver apenas 1 luta na primeira rodada e 3 atletas avancam direto (byes/chapeu).

### Formato atual (incorreto)

```
PRIMEIRA RODADA (Quartas de Final)
seed1 vs seed2 (Luta 1)
seed3 vs seed4 (Luta 2)

SEGUNDA RODADA (Semifinal)
vencedor L1 vs seed5 (Luta 3)

TERCEIRA RODADA (Final)
vencedor L3 vs vencedor L4 (Luta 4)
```

### Formato IBJJF oficial (correto)

```
PRIMEIRA RODADA (Quartas de Final)
seed1 vs seed2 (Luta 1) -> vencedor = A
Atleta 3 -> avanca direto (chapeu) -> vira B
Atleta 4 -> avanca direto (chapeu) -> vira C
Atleta 5 -> avanca direto (chapeu) -> vira D

SEGUNDA RODADA (Semifinal)
A vs B (Luta 2) -> vencedor = E
C vs D (Luta 3) -> vencedor = F

TERCEIRA RODADA (Final)
E vs F (Luta 4) -> Campeao
```

---

## 1. Contexto e Objetivo

- **O que e:** Correcao da estrutura de chaves de 5 atletas para seguir o formato oficial IBJJF com 3 byes na primeira rodada.
- **Por que existe:** O formato atual gera 2 lutas na primeira rodada, o que nao corresponde as regras oficiais da IBJJF. No formato correto, apenas 2 atletas se enfrentam na primeira rodada enquanto 3 aguardam nas semifinais.
- **Quem usa:** Organizadores de torneios que utilizam o sistema de chaves para categorias com exatamente 5 atletas.
- **Escopo:** Apenas a estrutura de chaves de 5 atletas. Nao afeta chaves de 2, 3, 4 ou 16 atletas.

---

## 2. Analise dos Documentos de Referencia

- **doc/spec.md (Feature, linhas 4-24):** Define o formato exato da chave de 5 atletas com 3 byes na primeira rodada.
- **doc/requisitos.md (secao 3.11):** Documenta as estruturas por quantidade de atletas. Atualmente diz "5 atletas: 4 lutas, 3 rodadas (1 luta R1, 1 luta R2 com bye + seed 5, 1 luta R3 final)" — inconsistente com o codigo atual (que tem 2 lutas R1) e precisa ser corrigido para o formato IBJJF.
- **doc/IBJJF.md:** Nao menciona especificamente o formato de 5 atletas, mas confirma o sistema de eliminacao simples com byes.
- **electron/brackets.ts:** Contem `gerarLutasCinco()` que gera o formato incorreto. `separarEquipes()` define lados para 5 atletas. `advanceWinnerInChave()` propaga vencedores de forma generica.
- **src/pages/GerenciarChaves.tsx:** `getTeamConflicts()` define `ladoA/ladoB` para 5 atletas que pode nao corresponder ao novo fluxo da chave.
- **src/components/BracketTree.tsx:** `buildConnections()` e `columns` usam logica generica baseada em `byRodada` que deve funcionar com o novo formato.

---

## 3. Historia de Usuario

```
Como organizador de torneio,
quero que chaves com 5 atletas sigam o formato oficial IBJJF (1 luta em quartas, 3 byes),
para que o chaveamento esteja em conformidade com as regras da federacao.
```

---

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema deve gerar chaves de 5 atletas com 4 lutas distribuidas em 3 rodadas
- [ ] RF-02: A primeira rodada (Quartas) deve conter 1 luta entre os seeds 1 e 2
- [ ] RF-03: Os seeds 3, 4 e 5 devem avancar direto (byes) para a segunda rodada
- [ ] RF-04: A segunda rodada (Semifinal) deve conter 2 lutas: vencedor(R1) vs seed3, e seed4 vs seed5
- [ ] RF-05: A terceira rodada (Final) deve conter 1 luta entre os vencedores das semifinais
- [ ] RF-06: A propagacao de vencedores deve funcionar corretamente: R1→R2→R3
- [ ] RF-07: A visualizacao do bracket no BracketTree deve exibir as rodadas com rotulos corretos (Quartas, Semifinal, Final)
- [ ] RF-08: A separacao de equipes deve considerar a nova estrutura de lados da chave

---

## 5. Requisitos Nao-Funcionais

- **Compatibilidade:** A mudanca e apenas no algoritmo de geracao; contratos IPC e tipos permanecem inalterados.
- **Performance:** Sem impacto mensuravel (numero de atletas e muito pequeno).
- **Observabilidade:** Notificacoes de geracao de chaves ja existentes continuam funcionando.

---

## 6. Analise da Aplicacao

### Arquitetura geral
- Electron + React: backend IPC em `electron/` e frontend React em `src/`.
- Dados persistidos em JSON do torneio ativo.

### Fluxo de dados para geracao de chaves
1. Frontend chama IPC `gerar-todas-chaves` ou `randomizar-chave`
2. Backend em `electron/brackets.ts` processa: `gerarChave()` → `gerarLutas()` → `gerarLutasCinco()`
3. Resultado salvo no JSON do torneio e retornado ao frontend

### Padroes em uso
- Funcoes puras para geracao de lutas (`gerarLutasCinco`, `gerarLutasTres`, etc.)
- Propagacao generica via `advanceWinnerInChave()` baseada em razao entre numero de lutas

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Corrigir `gerarLutasCinco()` para novo formato; atualizar `separarEquipes()` para lados corretos |
| `src/pages/GerenciarChaves.tsx` | Modificar | Atualizar `getTeamConflicts()` com os lados corretos para 5 atletas |
| `doc/requisitos.md` | Modificar | Atualizar descricao da estrutura de 5 atletas na secao 3.11 |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum identificado. O `advanceWinnerInChave()` usa algoritmo generico que funciona com qualquer numero de lutas por rodada.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O formato esta claramente definido na secao Feature do spec.md.

### 8.3 Riscos
- Chaves de 5 atletas existentes (ja geradas) nao serao retroativamente modificadas. Apenas novas geracoes usarao o formato correto.
- Regeneracao de chaves ("Gerar Novamente") aplicara o novo formato.

### 8.4 Layout Visual (corrigido)
- **Problema original:** O BracketTree usava o layout generico para 5 atletas, gerando uma disposicao visual feia com colunas desalinhadas e sem indicacao visual de byes.
- **Solucao:** Layout customizado `isFiveLayout` com 3 colunas: Col1 (Luta1 + ByeCard), Col2 (Luta2, Luta3), Col3 (Luta4 + Campeao). Conexoes visuais claras via `buildConnections5`.
- **Arquivo:** `src/components/BracketTree.tsx` — documentado em `spec/layout-chave-5-atletas.md`.

---

## 9. Criterios de Aceite

- [ ] CA-01: Dado um torneio com 5 atletas na mesma categoria, quando gerar chaves, entao o sistema cria 4 lutas em 3 rodadas
- [ ] CA-02: Dada uma chave de 5 atletas recem-gerada, quando inspecionar a primeira rodada, entao ela contem exatamente 1 luta (seed1 vs seed2)
- [ ] CA-03: Dada uma chave de 5 atletas recem-gerada, quando inspecionar a segunda rodada, entao ela contem 2 lutas (TBD/vencedorR1 vs seed3, seed4 vs seed5)
- [ ] CA-04: Dada uma chave de 5 atletas, quando registrar resultado da luta R1, entao o vencedor e propagado para o slot atletaAId da primeira luta da R2
- [ ] CA-05: Dada uma chave de 5 atletas, quando ambos os vencedores das semifinais forem definidos, entao a final e preenchida corretamente
- [ ] CA-06: Dado um bracket de 5 atletas, quando visualizar no BracketTree, entao os rotulos aparecem como "QUARTAS DE FINAL", "SEMIFINAL" e "FINAL"

---

## 10. Plano de Implementacao (Passo a Passo)

```
Passo 1: Corrigir gerarLutasCinco() em electron/brackets.ts
  - O que fazer: Alterar a funcao para gerar 1 luta em R1, 2 lutas em R2, 1 luta em R3
  - Estrutura nova:
    R1: seed1 vs seed2
    R2: TBD vs seed3, seed4 vs seed5
    R3: TBD vs TBD
  - Arquivo: electron/brackets.ts (linha 127)
  - Como validar: npm run build

Passo 2: Atualizar separarEquipes() em electron/brackets.ts
  - O que fazer: Atualizar sideA/sideB para n=5 no novo formato
  - Novo: sideA=[0,1,2], sideB=[3,4] (quem alimenta cada lado da final)
  - Arquivo: electron/brackets.ts (linha 331)
  - Como validar: npm run build

Passo 3: Atualizar getTeamConflicts() em src/pages/GerenciarChaves.tsx
  - O que fazer: Atualizar ladoA/ladoB para n===5 no novo formato
  - Novo: ladoA=[0,1,2], ladoB=[3,4]
  - Arquivo: src/pages/GerenciarChaves.tsx (linha 92)
  - Como validar: npm run build

Passo 4: Verificar build e testes
  - Executar npm run build para garantir que nao ha erros
```

---

## 11. Rollout e Observabilidade

- **Estrategia de entrega:** Deploy direto (nao ha feature flag para geracao de chaves).
- **Como monitorar:** Gerar chaves para uma categoria com 5 atletas e verificar a estrutura resultante.
- **Plano de rollback:** Reverter commits do `gerarLutasCinco` e `separarEquipes`.

---

## 12. Definicao de Pronto (DoD)

- [ ] CA-01 a CA-06 verificados manualmente
- [ ] Codigo revisado
- [ ] Sem warnings ou erros no build
- [ ] Documento de requisitos atualizado

---

## Checklist Rapido Antes de Comecar a Codar

- [x] Li os documentos de referencia
- [x] Entendi a historia de usuario e o objetivo de negocio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Listei os problemas e impedimentos
- [x] O plano de implementacao esta em ordem logica (base → topo)
- [x] Os criterios de aceite sao verificaveis
- [x] Sinalizei todas as incertezas explicitamente
