# Spec: Chave de 14 Atletas

## 1. Contexto e Objetivo

- **O que é:** Geração de chave de eliminação simples para exatamente 14 atletas, com 2 BYEs na primeira rodada resultando em chave perfeita de 8 atletas nas quartas de final.
- **Por que existe:** O algoritmo genérico (`gerarLutasGeral`) produz bracket subótimo com BYEs mal distribuídos para 14 atletas, não garantindo chave perfeita nas quartas.
- **Quem usa:** Organizadores de torneio ao gerar chaves para categorias com 14 inscritos.
- **Escopo:** Criação de função dedicada `gerarLutasQuatorze` + `advanceWinner14` + dispatchers. Fora do escopo: alteração de seeding, UI, outros tamanhos, alteração de regras de negócio existentes.

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): Confirme que todas as seções serão preenchidas conforme guia.
- **Documento de requisitos** (`doc/requisitos.md`): Seção 3.14 será criada com a estrutura da chave de 14 atletas.
- **Documentação técnica existente** (`doc/IBJJF.md`): Regras de torneio BJJ.
- **Código-fonte relevante** (`electron/brackets.ts`): Arquivo principal onde serão adicionadas as funções. Padrões identificados: funções dedicadas por tamanho (gerarLutasOnze, gerarLutasDoze, gerarLutasTreze), dispatchers por totalAtletas, separação de equipes por lado.

## 3. História de Usuário

```
Como organizador de torneio,
quero gerar chave para 14 atletas,
para que 12 lutem na R1, 2 descansem (BYE), e haja exatamente 8 atletas nas quartas em chave perfeita.
```

**Cenários alternativos:**
- **Atleta sem equipe:** A separação de equipes não é aplicada (skip).
- **Empate no peso/idade:** Ordem alfabética por nome como critério de desempate.
- **Regeneração de chave:** Permitida apenas se nenhuma luta foi iniciada (status `gerada`).

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema gera R1 com 8 lutas (L1-L6 reais entre posições 0-11, L7-L8 BYEs automáticos para posições 12-13)
- [ ] RF-02: O sistema gera R2 com 4 lutas (quartas — chave perfeita): L9(vencedor(L1)×vencedor(L2)), L10(vencedor(L3)×vencedor(L4)), L11(vencedor(L5)×vencedor(L6)), L12(pos[12]×pos[13])
- [ ] RF-03: O sistema gera R3 com 2 lutas (semifinais): L13(vencedor(L9)×vencedor(L10)), L14(vencedor(L11)×vencedor(L12))
- [ ] RF-04: O sistema gera R4 com 1 luta (final): L15(vencedor(L13)×vencedor(L14))
- [ ] RF-05: O total de lutas é 15, distribuídas em 4 rodadas
- [ ] RF-06: BYEs da R1 (L7-L8) são pré-preenchidos na geração com vencedorId setado e status='wo'
- [ ] RF-07: L12 é pré-preenchida na geração com pos[12]×pos[13]
- [ ] RF-08: L9-L11 são lutas reais entre vencedores das lutas reais da R1 (L1-L6)
- [ ] RF-09: A propagação `advanceWinner14` propag L1→L9.A, L2→L9.B, L3→L10.A, L4→L10.B, L5→L11.A, L6→L11.B, L9→L13.A, L10→L13.B, L11→L14.A, L12→L14.B, L13→L15.A, L14→L15.B
- [ ] RF-10: BYEs (L7-L8) são ignorados na propagação (já processados na geração)
- [ ] RF-11: A função `separarEquipes` divide posições: sideA=[0,1,2,3,4,5], sideB=[6,7,8,9,10,11,12,13]

## 5. Requisitos Não-Funcionais

- **Performance:** Geração instantânea (< 100ms para 14 atletas)
- **Segurança:** Sem exposição de dados sensíveis, sem console.log em produção
- **Acessibilidade:** N/A (lógica backend)
- **Compatibilidade:** Node.js 18+, Electron 30+
- **Observabilidade:** Erros propagados via throw Error com mensagens descritivas

## 6. Análise da Aplicação

- **Arquitetura geral:** Electron app com frontend React + backend Node.js. Geração de chaves ocorre no processo principal (main) via IPC handlers.
- **Padrões em uso:** Funções dedicadas por tamanho de chave (gerarLutasDois, gerarLutasTres, etc.), dispatchers por totalAtletas em `gerarLutas()` e `registrarResultadoHandler()`, separação de equipes em `separarEquipes()`.
- **Fluxo de dados:** Frontend chama IPC `gerar-chave` → `gerarChave()` → `gerarLutas(posicoes)` → retorna Chave com lutas → salva em JSON.
- **Contratos de API:** IPC handlers: `gerar-chave`, `registrar-resultado`, `randomizar-chave`.

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Adicionar `gerarLutasQuatorze()`, `advanceWinner14()`, case 14 em `gerarLutas()`, case 14 em `registrarResultadoHandler()`, n===14 em `separarEquipes()` |
| `spec/14-atletas.md` | Criar | Documentação da spec |
| `doc/requisitos.md` | Modificar | Adicionar seção 3.14 com descrição da chave de 14 atletas |
| `doc/spec.md` | Modificar | Atualizar Histórico de Correções |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum identificado.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma identificada.

### 8.3 Riscos
- Regressão em chaves existentes: Mitigado por não alterar funções existentes, apenas adicionar novas.

## 9. Critérios de Aceite

- [ ] CA-01: Dado 14 atletas, quando o organizador gera a chave, então o sistema cria 15 lutas distribuídas em 4 rodadas
- [ ] CA-02: Dado a R1, quando a chave é gerada, então existem 8 lutas (L1-L6 reais, L7-L8 BYEs com vencedorId setado e status='wo')
- [ ] CA-03: Dado a R2, quando a chave é gerada, então L9-L11 são lutas reais entre vencedores das lutas reais da R1, e L12 é pré-preenchida com pos[12]×pos[13]
- [ ] CA-04: Dado a R3, quando a chave é gerada, então existem 2 semifinais (L13-L14)
- [ ] CA-05: Dado a R4, quando a chave é gerada, então existe 1 final (L15)
- [ ] CA-06: Dado BYEs L7-L8, quando a chave é gerada, então estão pré-preenchidos (vencedorId = atleta da posição, status='wo')
- [ ] CA-07: Dado L12, quando a chave é gerada, então está pré-preenchida com pos[12]×pos[13]
- [ ] CA-08: Dado o registro de resultado de L1, quando o vencedor é registrado, então o vencedor é propagado para L9.atletaAId
- [ ] CA-09: Dado o registro de resultado de L9, quando o vencedor é registrado, então o vencedor é propagado para L13.atletaAId
- [ ] CA-10: Dado o registro de resultado de L12, quando o vencedor é registrado, então o vencedor é propagado para L14.atletaBId
- [ ] CA-11: Dado 14 atletas, quando o organizador randomiza a chave, então `separarEquipes` divide: sideA=[0,1,2,3,4,5], sideB=[6,7,8,9,10,11,12,13]

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Adicionar gerarLutasQuatorze() em electron/brackets.ts
  - O que fazer: Criar função que gera 15 lutas para 14 atletas. L7-L8 são BYEs pré-preenchidos. L12 é pré-preenchida com pos[12]×pos[13].
  - Arquivo(s): electron/brackets.ts (após gerarLutasTreze, antes de gerarLutasDez)
  - Como validar: Verificar que retorna 15 lutas com rodadas corretas (R1:8, R2:4, R3:2, R4:1) e que L12 tem atletas pré-preenchidos

Passo 2: Adicionar advanceWinner14() em electron/brackets.ts
  - O que fazer: Criar função de propagação que mapeia vencedores para próxima rodada. L7-L8 são ignorados (BYEs já resolvidos).
  - Arquivo(s): electron/brackets.ts (após advanceWinner13, antes de advanceWinner16)
  - Como validar: Verificar que L1→L9.A, L2→L9.B, L3→L10.A, L4→L10.B, L5→L11.A, L6→L11.B, L9→L13.A, L10→L13.B, L11→L14.A, L12→L14.B, L13→L15.A, L14→L15.B

Passo 3: Adicionar case 14 em gerarLutas()
  - O que fazer: Adicionar case 14 no switch de gerarLutas chamando gerarLutasQuatorze
  - Arquivo(s): electron/brackets.ts (switch de gerarLutas)
  - Como validar: Verificar que 14 atletas chama gerarLutasQuatorze

Passo 4: Adicionar case 14 em registrarResultadoHandler()
  - O que fazer: Adicionar else if (chave.totalAtletas === 14) chamando advanceWinner14
  - Arquivo(s): electron/brackets.ts (registrarResultadoHandler)
  - Como validar: Verificar que resultado de luta em chave de 14 atletas propaga corretamente

Passo 5: Atualizar separarEquipes() para n === 14
  - O que fazer: Adicionar n === 14 ? [0,1,2,3,4,5] : e n === 14 ? [6,7,8,9,10,11,12,13] :
  - Arquivo(s): electron/brackets.ts (separarEquipes)
  - Como validar: Verificar que separação ocorre corretamente para 14 atletas

Passo 6: Criar spec/14-atletas.md
  - O que fazer: Criar documento de spec seguindo guia completo
  - Arquivo(s): spec/14-atletas.md
  - Como validar: Verificar que todas as seções do guia estão preenchidas

Passo 7: Atualizar doc/requisitos.md
  - O que fazer: Adicionar seção 3.14 com descrição da chave de 14 atletas
  - Arquivo(s): doc/requisitos.md
  - Como validar: Verificar que seção 3.14 existe e está correta

Passo 8: Atualizar doc/spec.md - Histórico de Correções
  - O que fazer: Adicionar entrada no Histórico de Correções com data e descrição
  - Arquivo(s): doc/spec.md
  - Como validar: Verificar que entrada existe com formato correto
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (feature já existente no código, apenas nova funcionalidade)
- **Como monitorar:** 
  - Verificar que chaves de 14 atletas são geradas corretamente
  - Verificar que propagação de vencedores funciona em todas as rodadas
  - Monitorar erros em logs do Electron
- **Plano de rollback:** Reverter alterações em `electron/brackets.ts` removendo funções e dispatchers adicionados

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Documentação atualizada (spec/14-atletas.md, doc/requisitos.md)
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