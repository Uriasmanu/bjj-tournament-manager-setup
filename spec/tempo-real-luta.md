# Tempo Real de Luta

## 1. Contexto e Objetivo

- **O que é:** Exibição do tempo real utilizado em uma luta (chave ou luta casada) quando ela já foi encerrada.
- **Por que existe:** O administrador/árbitro precisa saber quanto tempo durou cada luta para fins de controle e estatísticas do torneio.
- **Quem usa:** Árbitros e administradores que acessam o placar de lutas encerradas.
- **Escopo:** Chaves de luta e lutas casadas — persistência, exibição no placar e exibição nos resultados.

## 2. História de Usuário

```
Como administrador do torneio,
quero ver o tempo real que uma luta durou ao acessá-la após o encerramento,
para que eu saiba exatamente quanto tempo foi gasto em cada luta.
```

**Cenários alternativos:**
- Luta nunca foi iniciada: exibir tempo sugerido IBJJF como padrão.
- Luta foi finalizada mas sem `horarioInicio`: o tempo real é calculado como `tempoInicial - tempoRestante` no momento da finalização.

## 3. Requisitos Funcionais

- [x] RF-01: O sistema deve calcular `tempoRealSegundos` como `tempoInicial - tempoRestante` no momento em que a luta é finalizada.
- [x] RF-02: O sistema deve persistir `tempoRealSegundos` junto com os demais dados da luta (chave e luta casada).
- [x] RF-03: Ao abrir uma luta encerrada, o sistema deve recuperar `tempoRealSegundos` salvo e exibir o tempo restante correspondente (início = tempoInicial, fim = tempoInicial - tempoReal).
- [x] RF-04: A tela de Resultados deve exibir `tempoRealSegundos` formatado (MM:SS) para lutas encerradas.
- [x] RF-05: Se `tempoRealSegundos` não estiver definido (lutas antigas), o sistema deve exibir "—" como fallback.

## 4. Requisitos Não-Funcionais

- **Performance:** Sem impacto — cálculo simples de subtração.
- **Compatibilidade:** Funciona em todas as plataformas (Electron desktop).

## 5. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/pages/PlacarLuta.tsx` | Modificar | Calcular `tempoRealSegundos` ao finalizar e recuperar ao abrir luta encerrada |
| `src/pages/PlacarLutaCasada.tsx` | Modificar | Calcular `tempoRealSegundos` ao finalizar e recuperar ao abrir luta casada encerrada |
| `electron/brackets.ts` | Modificar | Salvar `tempoRealSegundos` no handler `registrarResultadoHandler` e incluir na `normalizeLuta` |
| `electron/lutasCasadas.ts` | Modificar | Incluir `tempoRealSegundos` na `normalizeLutaCasada` |
| `electron/preload.ts` | Modificar | Adicionar `tempoRealSegundos` na definição de tipo `registrarResultado` |
| `src/types/electron.d.ts` | Modificar | Adicionar `tempoRealSegundos` no typedef `registrarResultado` |
| `src/types/bracket.ts` | — | Já possui `tempoRealSegundos?: number` (linha 24) |
| `src/types/lutaCasada.ts` | — | Já possui `tempoRealSegundos?: number` (linha 31) |

## 6. Critérios de Aceite

- [x] CA-01: Dado uma luta em chave que foi finalizada com cronômetro de 3min45s, quando o administrador abrir o placar novamente, o cronômetro deve exibir "01:15" (tempo restante) em vez de "05:00".
- [x] CA-02: Dado uma luta casada que foi finalizada com cronômetro de 4min20s, quando o administrador abrir o placar novamente, o cronômetro deve exibir "00:40" (tempo restante).
- [x] CA-03: Dado uma luta finalizada, quando o administrador acessar a tela de Resultados, o card da luta deve exibir o tempo real formatado (ex: "4:20") em vez de "—".
- [x] CA-04: Dado uma luta que nunca foi iniciada (tempoRealSegundos = undefined), o sistema deve exibir "—" nos Resultados e o tempo sugerido no placar.

## 7. Plano de Implementação

```
Passo 1: Atualizar backend (electron/brackets.ts)
  - Adicionar `tempoRealSegundos` no tipo de data de `registrarResultadoHandler`
  - Salvar `luta.tempoRealSegundos = data.tempoRealSegundos` 
  - Incluir `tempoRealSegundos` na função `normalizeLuta`

Passo 2: Atualizar normalização de lutas casadas (electron/lutasCasadas.ts)
  - Incluir `tempoRealSegundos` na função `normalizeLutaCasada`

Passo 3: Atualizar preload e typedefs
  - Adicionar `tempoRealSegundos?: number` em `registrarResultado` no preload.ts e electron.d.ts

Passo 4: Atualizar PlacarLuta.tsx
  - Calcular `tempoRealSegundos = tempoInicial - tempoRestante` ao finalizar
  - Enviar `tempoRealSegundos` na chamada `registrarResultado`
  - Ao abrir luta finalizada, usar `tempoRealSegundos` salvo para setar `tempoRestante`

Passo 5: Atualizar PlacarLutaCasada.tsx
  - Calcular `tempoRealSegundos = tempoInicial - tempoRestante` ao finalizar
  - Enviar `tempoRealSegundos` no objeto `atualizada`
  - Ao abrir luta casada finalizada, usar `tempoRealSegundos` salvo para setar `tempoRestante`
```

## 8. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (correção de bug existente).
- **Como monitorar:** Verificar que lutas novas exibem tempo real ao reabrir placar.
- **Plano de rollback:** Reverter alterações nos arquivos modificados.

## 9. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Sem warnings ou erros não tratados introduzidos
- [x] Seção Histórico de Correções atualizada em spec.md
