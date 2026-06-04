# Spec: Chave de 16 Atletas

## 1. Contexto e Objetivo

- **O que é:** Geração de chave de eliminação simples para exatamente 16 atletas, sem BYEs, com chave perfeita desde a primeira rodada.
- **Por que existe:** Chave de 16 atletas é a mais comum em torneios BJJ, com 8 lutas na primeira rodada e progressão limpa até a final.
- **Quem usa:** Organizadores de torneio ao gerar chaves para categorias com 16 inscritos.
- **Escopo:** Verificação da função existente `gerarLutas16()` + `advanceWinner16` + dispatchers. Fora do escopo: alteração de seeding, UI, outros tamanhos.

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): Confirme que todas as seções serão preenchidas conforme guia.
- **Documento de requisitos** (`doc/requisitos.md`): Seção 3.16 existente com descrição da chave de 16 atletas.
- **Documentação técnica existente** (`doc/IBJJF.md`): Regras de torneio BJJ.
- **Código-fonte relevante** (`electron/brackets.ts`): Função `gerarLutas16()` e `advanceWinner16()` já implementadas.

## 3. História de Usuário

```
Como organizador de torneio,
quero gerar chave para 16 atletas,
para que todos lutem na R1, sem BYEs, com chave perfeita de 8 atletas nas quartas.
```

**Cenários alternativos:**
- **Atleta sem equipe:** A separação de equipes não é aplicada (skip).
- **Empate no peso/idade:** Ordem alfabética por nome como critério de desempate.
- **Regeneração de chave:** Permitida apenas se nenhuma luta foi iniciada (status `gerada`).

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema gera R1 com 8 lutas (L1-L8, todas reais entre posições 0-15)
- [ ] RF-02: O sistema gera R2 com 4 lutas (quartas — chave perfeita): L9(vencedor(L1)×vencedor(L2)), L10(vencedor(L3)×vencedor(L4)), L11(vencedor(L5)×vencedor(L6)), L12(vencedor(L7)×vencedor(L8))
- [ ] RF-03: O sistema gera R3 com 2 lutas (semifinais): L13(vencedor(L9)×vencedor(L10)), L14(vencedor(L11)×vencedor(L12))
- [ ] RF-04: O sistema gera R4 com 1 luta (final): L15(vencedor(L13)×vencedor(L14))
- [ ] RF-05: O total de lutas é 15, distribuídas em 4 rodadas
- [ ] RF-06: Não há BYEs na chave de 16 atletas
- [ ] RF-07: L9-L12 são lutas reais entre vencedores das lutas reais da R1
- [ ] RF-08: A propagação `advanceWinner16` propag vencedores para próxima rodada baseado no índice da luta
- [ ] RF-09: A função `aplicarSeedSorting16` aplica seed sorting específico para 16 atletas (sideA=[0-7], sideB=[8-15])
- [ ] RF-10: A função `separarEquipes` não é aplicada para 16 atletas (usa `aplicarSeedSorting16`)

## 5. Requisitos Não-Funcionais

- **Performance:** Geração instantânea (< 100ms para 16 atletas)
- **Segurança:** Sem exposição de dados sensíveis, sem console.log em produção
- **Acessibilidade:** N/A (lógica backend)
- **Compatibilidade:** Node.js 18+, Electron 30+
- **Observabilidade:** Erros propagados via throw Error com mensagens descritivas

## 6. Análise da Aplicação

- **Arquitetura geral:** Electron app com frontend React + backend Node.js. Geração de chaves ocorre no processo principal (main) via IPC handlers.
- **Padrões em uso:** Funções dedicadas por tamanho de chave, dispatchers por totalAtletas em `gerarLutas()` e `registrarResultadoHandler()`, seed sorting específico para 16 atletas.
- **Fluxo de dados:** Frontend chama IPC `gerar-chave` → `gerarChave()` → `gerarLutas(posicoes)` → retorna Chave com lutas → salva em JSON.
- **Contratos de API:** IPC handlers: `gerar-chave`, `registrar-resultado`, `randomizar-chave`.

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Verificar | Funções `gerarLutas16()`, `advanceWinner16()`, `aplicarSeedSorting16()` já implementadas |
| `spec/16-atletas.md` | Criar | Documentação da spec |
| `doc/requisitos.md` | Verificar | Seção 3.16 já existente |
| `doc/spec.md` | Modificar | Atualizar Histórico de Correções |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum identificado.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma identificada.

### 8.3 Riscos
- Regressão em chaves existentes: Mitigado por não alterar funções existentes.

## 9. Critérios de Aceite

- [ ] CA-01: Dado 16 atletas, quando o organizador gera a chave, então o sistema cria 15 lutas distribuídas em 4 rodadas
- [ ] CA-02: Dado a R1, quando a chave é gerada, então existem 8 lutas reais (L1-L8) sem BYEs
- [ ] CA-03: Dado a R2, quando a chave é gerada, então existem 4 quartas (L9-L12) entre vencedores da R1
- [ ] CA-04: Dado a R3, quando a chave é gerada, então existem 2 semifinais (L13-L14)
- [ ] CA-05: Dado a R4, quando a chave é gerada, então existe 1 final (L15)
- [ ] CA-06: Dado o registro de resultado de L1, quando o vencedor é registrado, então o vencedor é propagado para L9.atletaAId
- [ ] CA-07: Dado o registro de resultado de L9, quando o vencedor é registrado, então o vencedor é propagado para L13.atletaAId
- [ ] CA-08: Dado 16 atletas, quando o organizador randomiza a chave, então `aplicarSeedSorting16` aplica seed sorting com sideA=[0-7], sideB=[8-15]

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Verificar gerarLutas16() existente
  - O que fazer: Confirmar que a função gera 15 lutas conforme spec (R1:8, R2:4, R3:2, R4:1)
  - Arquivo(s): electron/brackets.ts (gerarLutas16)
  - Como validar: Verificar que retorna 15 lutas com rodadas corretas

Passo 2: Verificar advanceWinner16() existente
  - O que fazer: Confirmar que a função propaga vencedores corretamente
  - Arquivo(s): electron/brackets.ts (advanceWinner16)
  - Como validar: Verificar que propagação funciona para todas as rodadas

Passo 3: Verificar dispatchers existentes
  - O que fazer: Confirmar que case 16 está em gerarLutas, registrarResultadoHandler
  - Arquivo(s): electron/brackets.ts
  - Como validar: Verificar que 16 atletas usa gerarLutas16 e advanceWinner16

Passo 4: Criar spec/16-atletas.md
  - O que fazer: Criar documento de spec seguindo guia completo
  - Arquivo(s): spec/16-atletas.md
  - Como validar: Verificar que todas as seções do guia estão preenchidas

Passo 5: Verificar doc/requisitos.md
  - O que fazer: Confirmar que seção 3.16 existe e está correta
  - Arquivo(s): doc/requisitos.md
  - Como validar: Verificar que seção 3.16 descreve chave de 16 atletas

Passo 6: Atualizar doc/spec.md - Histórico de Correções
  - O que fazer: Adicionar entrada no Histórico de Correções com data e descrição
  - Arquivo(s): doc/spec.md
  - Como validar: Verificar que entrada existe com formato correto
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (feature já existente no código)
- **Como monitorar:** 
  - Verificar que chaves de 16 atletas são geradas corretamente
  - Verificar que propagação de vencedores funciona em todas as rodadas
  - Monitorar erros em logs do Electron
- **Plano de rollback:** N/A (funções já existem)

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Documentação atualizada (spec/16-atletas.md, doc/requisitos.md)
- [x] Sem warnings ou erros não tratados introduzidos (lint OK, tsc OK)
- [x] Seção **Histórico de Correções** atualizada em doc/spec.md

---

## Checklist Rápido Antes de Começar a Codar

- [x] Li os itens em **Problemas Encontrados** e os tratei antes de qualquer código novo
- [x] Li os documentos de referência (doc/spec.md, doc/requisitos.md, electron/brackets.ts)
- [x] Entendi a história de usuário e o objetivo de negócio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Listei os problemas e impedimentos
- [x] O plano de implementação está em ordem lógica (base → topo)
- [x] Os critérios de aceite são verificáveis
- [x] Sinalizei todas as incertezas explicitamente