# Spec: Correção da Chave para 6 Atletas

---

## Problemas Encontrados

### [aberto] Chave para 6 atletas não gera Rodada 3 (Final)
**Comportamento atual:** A função `gerarLutasGeral` gera apenas 3 lutas na rodada 1 (A×B, C×D, E×F) sem byes. A luta 3 não tem para onde propagar o vencedor na rodada 2, resultando em uma chave incompleta sem Final.
**Comportamento esperado:** Chave com 4 lutas na rodada 1 (2 com BYE + 2 reais), 2 semifinais e 1 final, conforme diagrama:
```
Rodada 1 (Quartas de Final / Ajuste)
  Atleta A × Atleta B → G
  Atleta C × BYE → H (C avança direto)
  Atleta D × Atleta E → I
  Atleta F × BYE → J (F avança direto)

Rodada 2 (Semifinais)
  G × H → Vencedor_Finalista1
  I × J → Vencedor_Finalista2

Rodada 3 (Final)
  Vencedor_Finalista1 × Vencedor_Finalista2 → Campeão
```
**Escopo:** Geração de lutas (`electron/brackets.ts`), propagação de vencedores, renderização visual (`BracketTree.tsx`)

---

## Histórico de Correções
<!-- ZONA DA IA: a IA preenche após cada ciclo. -->

---

## Feature

Chave de chaves com 6 atletas deve gerar a estrutura completa com 3 rodadas: Quartas de Final (com byes), Semifinais e Final.

---

## 1. Contexto e Objetivo

- **O que é:** Correção na geração de chaves para 6 atletas para incluir a rodada final
- **Por que existe:** A estrutura atual gera uma chave incompleta onde o vencedor da luta 3 não propaga para nenhuma luta posterior
- **Quem usa:** Organizadores de torneios BJJ que geram chaves com 6 participantes
- **Escopo:** Apenas chaves com 6 atletas;其他 tamanhos não são afetados

---

## 2. Análise dos Documentos de Referência

- **Código fonte:** `electron/brackets.ts` — função `gerarLutasGeral` (linhas 148-213) e `advanceWinner6` (linhas 719-736)
- **Componente visual:** `src/components/BracketTree.tsx` — renderização da árvore de chaves
- **Tipo:** `src/types/bracket.ts` — interfaces `Chave` e `Luta`

---

## 3. História do Usuário

```
Como organizador de torneio BJJ,
quero gerar uma chave com 6 atletas que tenha a estrutura completa (Quartas, Semifinais, Final),
para que o torneio seja disputado até a definição de um campeão.
```

---

## 4. Requisitos Funcionais

- [ ] RF-01: A geração de chave com 6 atletas deve criar 6 lutas: 4 na rodada 1 (2 reais + 2 BYE), 2 na rodada 2 (semifinais), 1 na rodada 3 (final)
- [ ] RF-02: As lutas com BYE devem ter status 'wo' e o atleta deve avançar automaticamente
- [ ] RF-03: O vencedor da luta 1 (A×B) deve propagar para a semifinal (luta 5, slot A)
- [ ] RF-04: O vencedor da luta BYE superior (C) deve propagar para a semifinal (luta 5, slot B)
- [ ] RF-05: O vencedor da luta 3 (D×E) deve propagar para a semifinal (luta 6, slot A)
- [ ] RF-06: O vencedor da luta BYE inferior (F) deve propagar para a semifinal (luta 6, slot B)
- [ ] RF-07: Os vencedores das semifinais devem propagar para a final (luta 7)
- [ ] RF-08: A renderização visual deve exibir a árvore completa com 3 colunas + campeão

---

## 5. Requisitos Não-Funcionais

- **Performance:** Sem impacto — operação local
- **Compatibilidade:** Manter compatibilidade com chaves existentes de 6 atletas (normalização)
- **Observabilidade:** totalRodadas deve ser 3, totalLutas deve ser 6

---

## 6. Análise da Aplicação

- **Arquitetura:** Electron IPC — backend gera dados, frontend renderiza
- **Padrão:** Cada tamanho de chave tem função dedicada de geração e propagação
- **Fluxo:** `gerarLutas()` → `criarLuta()` → salvar JSON → `BracketTree` renderiza

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Criar `gerarLutasSeis()`, atualizar `gerarLutas()` switch, ajustar `advanceWinner6()` |
| `src/components/BracketTree.tsx` | Verificar | Adicionar caso `isSixLayout` se necessário para layout correto |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- `gerarLutasGeral` para 6 atletas gera 3 lutas na rodada 1 em vez de 4 (2+2 byes)
- A luta 3 não tem slot na rodada 2 — o vencedor fica "perdido"
- `advanceWinner6` assume lutas 1-4 na rodada 1, mas a função atual gera apenas 3

### 8.2 Ambiguidades
- Nenhuma — o diagrama na spec é claro

### 8.3 Riscos
- Chaves de 6 atletas já salvas podem ter estrutura inconsistente (normalização necessária)

---

## 9. Critérios de Aceite

- [ ] CA-01: Dado 6 atletas, quando a chave é gerada, então existem 6 lutas com 3 rodadas
- [ ] CA-02: Dado uma luta com BYE, quando a chave é gerada, então o atleta avança automaticamente (status 'wo')
- [ ] CA-03: Dado o vencedor da luta 1 (A×B), quando o resultado é registrado, então o vencedor aparece na semifinal correspondente
- [ ] CA-04: Dado o vencedor de uma semifinal, quando o resultado é registrado, então o vencedor aparece na final
- [ ] CA-05: Dado o vencedor da final, quando o resultado é registrado, então o campeão é exibido no card "CAMPEÃO"

---

## 10. Plano de Implementação

```
Passo 1: Criar função `gerarLutasSeis()` em electron/brackets.ts
  - O que fazer: Criar função dedicada que gera 6 lutas: 4 na rodada 1 (2 reais + 2 BYE), 2 semifinais, 1 final
  - Arquivo(s): electron/brackets.ts
  - Como validar: Verificar que a função retorna 6 lutas com rodadas 1,2,3 corretas

Passo 2: Atualizar switch em `gerarLutas()` para case 6
  - O que fazer: Adicionar case 6 que chama `gerarLutasSeis()`
  - Arquivo(s): electron/brackets.ts
  - Como validar: Gerar chave com 6 atletas e verificar estrutura

Passo 3: Ajustar `advanceWinner6()` para nova estrutura
  - O que fazer: Mapear propagação correta: luta1→luta5.A, luta2(BYE)→luta5.B, luta3→luta6.A, luta4(BYE)→luta6.B, luta5→luta7.A, luta6→luta7.B
  - Arquivo(s): electron/brackets.ts
  - Como validar: Simular registro de resultados e verificar propagação

Passo 4: Verificar BracketTree.tsx para layout de 6 atletas
  - O que fazer: Verificar se o layout genérico funciona ou se precisa de caso dedicado
  - Arquivo(s): src/components/BracketTree.tsx
  - Como validar: Renderizar chave de 6 atletas e verificar árvore visual

Passo 5: Build e validação
  - O que fazer: Rodar build para verificar erros de tipo
  - Arquivo(s): Todos os modificados
  - Como validar: npm run build sem erros
```

---

## 11. Rollout e Observabilidade

- **Estratégia:** Deploy direto — correção de bug sem mudança de API
- **Monitorar:** Verificar chaves de 6 atletas em torneios existentes
- **Rollback:** Reverter commit se necessário

---

## 12. Definição de Pronto

- [ ] Todos os critérios de aceite verificados
- [ ] Código revisado
- [ ] Build sem erros
- [ ] Histórico de Correções atualizado
