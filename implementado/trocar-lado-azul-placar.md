# Trocar Lado do Azul no Placar

## 1. Contexto e Objetivo

- **O que é:** Inverter a posição dos painéis do placar, movendo o painel azul (Atleta A) da esquerda para a direita.
- **Por que existe:** O organizador do torneio solicitou que o painel com fundo azul anil (`#1e3a8a`) fique no lado direito do placar, e o painel branco no lado esquerdo.
- **Quem usa:** Operadores de área de luta que utilizam o placar durante as lutas.
- **Escopo:** Apenas a invertação visual dos painéis no layout do placar. Nenhuma mudança de dados ou lógica de pontuação.

---

## 2. Analise dos Documentos de Referência

- **Guia de spec** (doc/spec.md): confirmado
- **Documento de requisitos** `doc/requisitos.md`: seções 3.14 (Placar) descrevem o layout com Atleta A à esquerda (azul) e Atleta B à direita (branco). A mudança inverte essa disposição.
- **Código-fonte relevante:**
  - `src/pages/PlacarLuta.tsx` (linhas 652-671): renderiza `AtletaPanel lado="A"` à esquerda e `AtletaPanel lado="B"` à direita.
  - `src/pages/PlacarLutaCasada.tsx` (linhas 599-614): mesma estrutura.

---

## 3. Historia de Usuario

```
Como operador de área de luta,
quero que o painel azul fique à direita no placar,
para que o layout do placar atenda à preferência visual do organizador.
```

---

## 4. Requisitos Funcionais

- [x] RF-01: O painel do Atleta A deve ser exibido à esquerda com fundo branco e texto escuro.
- [x] RF-02: O painel do Atleta B deve ser exibido à direita com fundo azul anil (`#1e3a8a`) e texto branco.
- [x] RF-03: Os dados de cada atleta (nome, placar, pontuação) devem permanecer vinculados ao painel correto (Atleta A continua sendo A, Atleta B continua sendo B).
- [x] RF-04: A mudança se aplica tanto ao placar de chaves (`PlacarLuta`) quanto ao placar de lutas casadas (`PlacarLutaCasada`).

---

## 5. Requisitos Nao-Funcionais

- **Performance:** Sem impacto — mudança puramente visual (CSS).
- **UI/UX Responsivo:** Layout permanece responsivo; painéis lado a lado em telas largas, empilhados em mobile.

---

## 6. Analise da Aplicacao

- **Arquitetura:** Frontend React com componentes funcionais. O `AtletaPanel` é um componente interno que recebe a prop `lado` ('A' | 'B') e aplica cores com base nessa prop.
- **Padrões:** Cores definidas como constantes (`AZUL_ANIL`, `BRANCO`). Estilos inline via `style={}`.
- **Fluxo de dados:** Nenhuma mudança — os dados dos atletas são carregados via IPC e passados como props.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
| --- | --- | --- |
| `src/pages/PlacarLuta.tsx` | Modificar | Inverter ordem dos AtletaPanel (A à esquerda branco, B à direita azul) |
| `src/pages/PlacarLutaCasada.tsx` | Modificar | Inverter ordem dos AtletaPanel (A à esquerda branco, B à direita azul) |
| `doc/requisitos.md` | Modificar | Atualizar descrição do layout do placar |
| `doc/spec.md` | Modificar | Mover item para Histórico de Correções |

---

## 8. Problemas e Impedimentos

Nenhum impedimento identificado. A mudança é isolada ao CSS dos componentes de placar.

---

## 9. Criterios de Aceite

- [x] CA-01: Dado um placar de luta aberto, quando o painel do Atleta A é renderizado, então ele exibe fundo branco (`#ffffff`) e texto escuro (`#212529`).
- [x] CA-02: Dado um placar de luta aberto, quando o painel do Atleta B é renderizado, então ele exibe fundo azul anil (`#1e3a8a`) e texto branco (`#ffffff`).
- [x] CA-03: Dado um placar de luta casada aberto, quando os painéis são renderizados, então o Atleta A fica à esquerda (branco) e o Atleta B à direita (azul).
- [x] CA-04: Dado qualquer tamanho de tela, quando o placar é exibido, então o layout não quebra e os painéis permanecem legíveis.

---

## 10. Plano de Implementacao

```
Passo 1: Inverter a ordem dos AtletaPanel no PlacarLuta.tsx
  - O que fazer: Trocar a ordem dos componentes <AtletaPanel> no <Group> (linha 652-671), colocando lado="B" primeiro e lado="A" depois.
  - Arquivo(s): src/pages/PlacarLuta.tsx
  - Como validar: Abrir uma luta e verificar que o painel azul está à direita.

Passo 2: Inverter a ordem dos AtletaPanel no PlacarLutaCasada.tsx
  - O que fazer: Trocar a ordem dos componentes <AtletaPanel> no <Group> (linha 599-614), colocando lado="B" primeiro e lado="A" depois.
  - Arquivo(s): src/pages/PlacarLutaCasada.tsx
  - Como validar: Abrir uma luta casada e verificar que o painel azul está à direita.

Passo 3: Atualizar documentação
  - O que fazer: Atualizar doc/requisitos.md e doc/spec.md.
  - Arquivo(s): doc/requisitos.md, doc/spec.md
  - Como validar: Revisão manual do documento.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (mudança visual sem risco de regressão funcional).
- **Como monitorar:** Verificar visualmente em telas de placar.
- **Plano de rollback:** Reverter a ordem dos AtletaPanel nos arquivos.

---

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado
- [x] Documentação atualizada
- [x] Sem warnings ou erros não tratados introduzidos
- [x] Seção Histórico de Correções atualizada em spec.md
