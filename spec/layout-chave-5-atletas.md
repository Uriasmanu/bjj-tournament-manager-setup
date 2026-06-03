## Problema

A disposição visual da chave de 5 atletas no BracketTree usa o layout genérico, que agrupa lutas por rodada em colunas. Com o formato IBJJF (1 luta R1, 2 lutas R2, 1 luta R3), o resultado é:

```
Col1 (R1)     Col2 (R2)       Col3 (R3)    Col4
[Luta1]       [Luta2]         [Luta4]       [Campeão]
              [Luta3]
```

- **Espaçamento vertical desalinhado:** Luta1 (1 item) fica centralizada vs Luta2+Luta3 (2 itens) distribuídas com `space-around`, gerando uma visualização sem simetria.
- **Conexões genéricas:** As linhas entre colunas usam o cálculo `fightsPerNext = currentRound.length / nextRound.length`, o que gera conexões visuais confusas (R1→R2 com razão 0.5, R2→R3 com razão 2).
- **Sem indicação visual de byes:** Os atletas 3, 4 e 5 que avançam direto não são mostrados como "byes" no bracket — apenas aparecem como slots preenchidos nas lutas R2, sem contexto visual.

## Objetivo

Criar um layout customizado (assim como já existe para chaves de 3 e 16 atletas) que represente visualmente a estrutura correta da chave de 5 atletas:

```
Col1                Col2                Col3          Col4
[Luta1] [Chapeu3]   [Luta2]             [Luta4]       [Campeão]
                    [Luta3]
```

- Luta1 e Chapeu3 lado a lado na primeira coluna
- Luta2 e Luta3 na segunda coluna
- Luta4 e Campeão na terceira coluna
- Conexões visuais claras entre lutas

## Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/components/BracketTree.tsx` | Modificar | Adicionar `isFiveLayout`, `buildConnections5`, colunas customizadas e componente `ByeCard5` |
| `spec/layout-chave-5-atletas.md` | Criar | Documentar problema, objetivo e solução |

## Critérios de Aceite

- [x] CA-01: Chave de 5 atletas exibe 3 colunas de lutas + coluna campeão (se houver)
- [x] CA-02: Coluna 1 mostra Luta1 ao lado do card "Chapeu" (badge do atleta que avança direto)
- [x] CA-03: Coluna 2 mostra Luta2 e Luta3 alinhadas verticalmente
- [x] CA-04: Conexões visuais ligam corretamente: R1→R2-1, R2-1→R3, R2-2→R3
- [x] CA-05: Layout funciona com e sem campeão definido
- [x] CA-06: Rotulos de rodada aparecem corretamente (Quartas, Semifinal, Final)

## Status: Implementado

Implementado em `src/components/BracketTree.tsx`:
- `isFiveLayout` detecta chaves de 5 atletas
- Colunas customizadas: [Luta1, bye5] → [Luta2, Luta3] → [Luta4, champion]
- `buildConnections5` gera conexões visuais corretas
- `ByeCard` existente (de 3 atletas) reutilizado para exibir atleta com bye
