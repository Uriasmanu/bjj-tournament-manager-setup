## Problema

A disposicao visual da chave de 5 atletas no BracketTree precisa representar a estrutura de 6 lutas com 3 rodadas.

## Objetivo

Exibir o bracket de 5 atletas em formato piramide com 3 colunas:

```
Col1                Col2                Col3
[Luta1]             [Luta4]             [Luta6]
[Luta2]             [Luta5]             [Campeao]
[Luta3]
```

- Luta1, Luta2, Luta3 na primeira coluna (Rodada 1)
- Luta4, Luta5 na segunda coluna (Rodada 2)
- Luta6 e Campeao na terceira coluna (Rodada 3)
- Conexoes visuais claras entre lutas

## Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/BracketTree.tsx` | Modificado | Layout customizado `isFiveLayout` com 3 colunas |

## Critérios de Aceite

- [x] CA-01: Chave de 5 atletas exibe 3 colunas de lutas + coluna campeao
- [x] CA-02: Coluna 1 mostra Luta1, Luta2 e Luta3
- [x] CA-03: Coluna 2 mostra Luta4 e Luta5
- [x] CA-04: Coluna 3 mostra Luta6 e Campeao (quando definido)
- [x] CA-05: Conexoes visuais ligam corretamente: L1→L5, L2→L4, L3→L4, L4→L6, L5→L6
- [x] CA-06: Layout funciona com e sem campeao definido

## Status: Implementado

Implementado em `src/components/BracketTree.tsx`:
- `isFiveLayout` detecta chaves de 5 atletas
- Colunas customizadas: [Luta1, Luta2, Luta3] → [Luta4, Luta5] → [Luta6, champion]
- `buildConnections()` gera conexoes visuais corretas para 5 atletas
