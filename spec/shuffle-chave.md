# Spec: Correção do Embaralhamento de Chaves

## 1. Contexto e Objetivo

- **O que é:** Correção do botão "Embaralhar" na tela de gerenciamento de chaves para que ele realmente randomize os confrontos entre atletas.
- **Por que existe:** Atualmente, o botão "Embaralhar" não funciona corretamente — após o embaralhamento aleatório, o código re-aplica o algoritmo `aplicarSeedSorting` que reordena os atletas por peso, idade e nome, anulando completamente o efeito do shuffle.
- **Quem usa:** Administradores do torneio que desejam randomizar manualmente os confrontos de uma chave.
- **Escopo:** Apenas a função `randomizarChaveHandler` em `electron/brackets.ts`. Nenhuma alteração no frontend.

## 2. Documentos de Referência

- `doc/spec.md` — Guia de especificação
- `doc/requisitos.md` — Regras de negócio (seção 3.11 sobre geração de chaves)
- `electron/brackets.ts` — Código fonte do handler de randomização
- `src/pages/GerenciarChaves.tsx` — Frontend da tela de chaves

## 3. Historia de Usuario

Como administrador do torneio,
quero clicar em "Embaralhar" em uma chave e ver os confrontos realmente randomizados,
para que possa ajustar manualmente as lutas da primeira rodada.

## 4. Requisitos Funcionais

- [ ] RF-01: O botão "Embaralhar" deve randomizar a ordem dos atletas na chave
- [ ] RF-02: Os confrontos da primeira rodada devem refletir a nova ordem randomizada
- [ ] RF-03: Atletas da mesma equipe devem ser separados em lados opostos da chave (mesmo comportamento do seed sorting original)

## 5. Requisitos Não-Funcionais

- **Performance:** Operação O(n) para shuffle e O(n) para separação de equipes
- **Compatibilidade:** Sem quebra de contrato IPC — o handler continua retornando `Chave`

## 6. Análise da Aplicação

### Arquitetura

- `electron/brackets.ts` — Main process, contém a lógica de geração e randomização de chaves
- `src/pages/GerenciarChaves.tsx` — Renderer, chama `window.electronAPI.randomizarChave()` e atualiza estado

### Fluxo atual (bug)

1. Usuário clica "Embaralhar"
2. `handleRandomizar` chama `window.electronAPI.randomizarChave({ chaveId })`
3. IPC handler `randomizar-chave` chama `randomizarChaveHandler`
4. `randomizarChaveHandler`:
   - Shuffle Fisher-Yates nas posições
   - Re-aplica `aplicarSeedSorting` (re-ordena por peso/idade/nome) → **anula o shuffle**
   - Gera lutas com a ordem re-sortida

### Fluxo esperado (corrigido)

1. Usuário clica "Embaralhar"
2. `handleRandomizar` chama `window.electronAPI.randomizarChave({ chaveId })`
3. IPC handler `randomizar-chave` chama `randomizarChaveHandler`
4. `randomizarChaveHandler`:
   - Shuffle Fisher-Yates nas posições
   - Separa atletas da mesma equipe em lados opostos (sem re-sort por peso/idade)
   - Gera lutas com a ordem randomizada

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Remover `aplicarSeedSorting` do `randomizarChaveHandler` e implementar separação leve de equipes |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

Nenhum. A mudança é localizada e não afeta outros handlers ou o frontend.

### 8.2 Ambiguidades nos Requisitos

Nenhuma. O comportamento desejado é claro: randomizar os confrontos mantendo separação de equipes.

### 8.3 Riscos

- Nenhum risco identificado. A função `randomizarChaveHandler` é autocontida e não compartilha estado com outros handlers.

## 9. Critérios de Aceite

- [ ] CA-01: Dado uma chave com 4 atletas [A, B, C, D] na ordem [1,2,3,4], quando clicar "Embaralhar", então a ordem dos atletas deve ser diferente (com alta probabilidade)
- [ ] CA-02: Dado uma chave com atletas da mesma equipe, quando clicar "Embaralhar", então os atletas da mesma equipe devem ficar em lados opostos
- [ ] CA-03: Dado uma chave com 3 atletas onde um deles tinha "bye", quando clicar "Embaralhar", então o "bye" pode se mover para outro confronto

## 10. Plano de Implementação

### Passo 1: Remover `aplicarSeedSorting` do `randomizarChaveHandler`

**O que fazer:** Substituir o trecho que chama `aplicarSeedSorting` por lógica que mantém a ordem shuffled mas separa equipes.

**Arquivo:** `electron/brackets.ts:243-272`

**Detalhes:**
- Manter o shuffle Fisher-Yates existente
- Substituir `const sorted = aplicarSeedSorting(atletas)` por lógica de separação de equipes que preserva a ordem aleatória
- Usar a mesma estrutura de lados da chave (sideA e sideB) que `aplicarSeedSorting` usa

**Código novo:**
```typescript
function randomizarChaveHandler(torneioId: string, data: { chaveId: string }): Chave {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];
  const index = chaves.findIndex(c => c.id === data.chaveId);
  if (index < 0) throw new Error('Chave não encontrada');

  const chave = chaves[index];

  // Shuffle positions randomly
  const shuffled = [...chave.posicoesAtletas];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const atletas = shuffled
    .map(id => (torneio.atletas ?? []).find(a => a.id === id))
    .filter((a): a is Atleta => a !== undefined);

  // Separate same-team athletes to opposite sides
  const n = atletas.length;
  if (n >= 4) {
    const sideA = n === 4 ? [0, 3] : [0, 1];
    const sideB = n === 4 ? [1, 2] : [2, 3, 4];

    for (const side of [sideA, sideB]) {
      const seenTeams = new Set<string>();
      for (let si = 0; si < side.length; si++) {
        const idx = side[si];
        const team = atletas[idx]?.equipe;
        if (!team) continue;
        if (seenTeams.has(team)) {
          const otherSide = side === sideA ? sideB : sideA;
          for (const oi of otherSide) {
            const otherTeam = atletas[oi]?.equipe;
            if (otherTeam !== team) {
              [atletas[idx], atletas[oi]] = [atletas[oi], atletas[idx]];
              break;
            }
          }
        }
        if (atletas[idx]?.equipe) seenTeams.add(atletas[idx].equipe);
      }
    }
  }

  chave.posicoesAtletas = atletas.map(a => a.id);
  chave.lutas = gerarLutas(atletas);

  chaves[index] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return chave;
}
```

### Como validar

1. Abrir o app, gerar chaves
2. Clicar em "Embaralhar" em uma chave
3. Verificar que os confrontos mudaram
4. Clicar novamente e verificar que os confrontos mudaram novamente (para valores diferentes)
5. Verificar que atletas da mesma equipe estão em lados opostos

## 11. Rollout e Observabilidade

- **Estratégia:** Deploy direto (substituição da função)
- **Rollback:** Reverter a alteração em `electron/brackets.ts`
