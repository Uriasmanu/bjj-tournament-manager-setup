# Spec: Chave de 9 Atletas

## 1. Contexto e Objetivo

- **O que é:** Geração de chave de eliminação simples para exatamente 9 atletas em uma categoria.
- **Por que existe:** O algoritmo genérico (`gerarLutasGeral`) não produz a estrutura correta para 9 atletas — gera 5 lutas no round 1 em vez de 6, e a propagação de BYEs falha.
- **Quem usa:** Organizadores de torneio ao gerar chaves para categorias com 9 inscritos.
- **Escopo:** Criação de função dedicada `gerarLutasNove` + `advanceWinner9`, integração no dispatcher. Fora do escopo: alteração do seeding, UI, outros tamanhos de chave.

## 2. Documentos de Referência

- `doc/spec.md` — template de feature e guia de implementação
- `doc/requisitos.md` — requisitos do sistema (seção 3.11)
- `electron/brackets.ts` — código atual de geração de chaves
- `doc/IBJJF.md` — regras IBJJF de chaveamento

## 3. História de Usuário

```
Como organizador de torneio,
quero gerar uma chave para 9 atletas,
para que a competição progrida corretamente com 4 rodadas e 12 lutas totais.
```

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema deve gerar exatamente 6 lutas na rodada 1 para 9 atletas
- [ ] RF-02: O sistema deve distribuir 3 BYEs na rodada 1 (posições ímpares: 1, 3, 5)
- [ ] RF-03: O sistema deve gerar 3 lutas na rodada 2
- [ ] RF-04: O sistema deve gerar 2 lutas na rodada 3 (1 real + 1 BYE)
- [ ] RF-05: O sistema deve gerar 1 luta na rodada 4 (final)
- [ ] RF-06: O sistema deve propagar corretamente os vencedores entre rodadas
- [ ] RF-07: O sistema deve tratar reabertura de luta (clearWinnerFromLaterRounds)

## 5. Requisitos Não-Funcionais

- **Performance:** Geração de 12 lutas é instantânea
- **Observabilidade:** Log de depuração com contagem de lutas geradas

## 6. Análise da Aplicação

- **Arquitetura:** Electron + React. Geração de chaves no main process (`electron/brackets.ts`). A função `gerarLutas` é o dispatcher que roteia para a função específica baseada no número de atletas.
- **Fluxo de dados:** `gerarTodasChavesHandler()` → `gerarChave()` → `gerarLutas()` → função específica → `Chave` com array de `Luta`.
- **Propagação de vencedores:** `registrarResultadoHandler()` dispatches para `advanceWinner9()` com base em `chave.totalAtletas`.

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Adicionar `gerarLutasNove()`, `advanceWinner9()`, atualizar dispatchers |
| `spec/9-atletas.md` | Criar | Documentação da feature |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- `gerarLutasGeral()` produz apenas 5 lutas no round 1 para 9 atletas (ceil(9/2) = 5)
- BYE propagation em `gerarLutasGeral()` falha quando `fightsPerNextMatch` não é inteiro
- `advanceWinnerInChave()` não propaga quando slot index > 1

### 8.2 Ambiguidades nos Requisitos
- Nenhuma

### 8.3 Riscos
- Nenhum — função dedicada isolada não afeta outros tamanhos

## 9. Critérios de Aceite

- [ ] CA-01: dado 9 atletas em uma categoria, quando gerar chave, então round 1 tem 6 lutas
- [ ] CA-02: dado 9 atletas em uma categoria, quando gerar chave, então total de lutas = 12
- [ ] CA-03: dado 9 atletas em uma categoria, quando gerar chave, então total de rodadas = 4
- [ ] CA-04: dado uma luta da rodada 1, quando registrar resultado, então vencedor propaga para rodada 2
- [ ] CA-05: dado uma luta da rodada 2, quando registrar resultado, então vencedor propaga para rodada 3
- [ ] CA-06: dado uma luta da rodada 3, quando registrar resultado, então vencedor propaga para rodada 4
- [ ] CA-07: dado uma luta da rodada 2 ordem 9 (última QF), quando registrar resultado, então vencedor vai direto para final (BYE na semifinal)

## 10. Plano de Implementação

```
Passo 1: Criar gerarLutasNove()
  - O que fazer: implementar função que gera 12 lutas para 9 atletas
    Round 1: 6 lutas (3 reais nos índices 0,2,4 + 3 BYEs nos índices 1,3,5)
    Round 2: 3 lutas (cada uma recebe vencedor de 2 lutas do round 1)
    Round 3: 2 lutas (1 real entre vencedores R2[0]×R2[1] + 1 BYE para vencedor R2[2])
    Round 4: 1 luta (final)
  - Arquivo(s): electron/brackets.ts
  - Como validar: verificar lutas.length === 12, lutas por rodada [6,3,2,1]

Passo 2: Criar advanceWinner9()
  - O que fazer: propagar vencedores entre rodadas
    R1[0] → R2[0].A
    R1[2] → R2[1].A  
    R1[4] → R2[2].A
    R2[0] → R3[0].A
    R2[1] → R3[0].B
    R2[2] → R3[1].A + R3[1] como WO (BYE) → Final.B
    R3[0] → Final.A
  - Arquivo(s): electron/brackets.ts
  - Como validar: teste de propagação após registrar resultados

Passo 3: Atualizar dispatchers
  - O que fazer: adicionar case 9 em gerarLutas() e registrarResultadoHandler()
  - Arquivo(s): electron/brackets.ts
  - Como validar: chave de 9 atletas usa funções dedicadas

Passo 4: Atualizar getTotalRodadas e separarEquipes (se necessário)
  - O que fazer: verificar se 9 atletas é coberto corretamente
  - Arquivo(s): electron/brackets.ts
  - Como validar: totalRodadas === 4, separarEquipes funciona
```

## 11. Rollout e Observabilidade

- **Estratégia:** Deploy direto (sem feature flag)
- **Monitoramento:** Logs de console nos handlers
- **Rollback:** Reverter alterações em brackets.ts

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite verificados
- [ ] Código revisado
- [ ] Sem warnings ou erros introduzidos
- [ ] Histórico de Correções atualizado em spec.md
