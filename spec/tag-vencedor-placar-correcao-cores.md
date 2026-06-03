# Feature: Tag de Vencedor no Placar + Correção de Cores

## 1. Contexto e Objetivo

- **O que é:** Adicionar tag visual de "VENCEDOR" nos cards de chave na tela PlacarChaves quando a chave possui pelo menos uma luta com vencedor definido. Corrigir a cor roxa (grape) para azul (`#1565C0`) em badges e textos, seguindo o padrão visual definido nos requisitos.
- **Por que existe:** O organizador precisa identificar rapidamente quais chaves já têm resultado na tela de Placar, sem precisar abrir cada chave individualmente. A cor roxa viola o padrão visual do tema (azul royal).
- **Quem usa:** Organizador/operador do torneio usando o módulo Placar.
- **Escopo:** Dentro: tag de vencedor nos cards de PlacarChaves, correção de cor grape→blue. Fora: alterações no BracketTree ou BracketCard.

---

## 2. Documentos de Referência

- **Guia de spec:** `doc/spec.md` — template utilizado
- **Requisitos:** `doc/requisitos.md` — seção 9.1.1 define paleta de cores (azul royal `#1565C0` como cor primária, sem uso de grape/roxo)
- **Código-fonte relevante:**
  - `src/pages/PlacarChaves.tsx` — cards de chave no Placar (badge grape na linha 153)
  - `src/pages/GerenciarChaves.tsx` — cards de chave no Gerenciamento (badge grape na linha 429)
  - `src/pages/PlacarLuta.tsx` — texto grape na confirmação de finalização (linha 717)
  - `src/types/bracket.ts` — interface `Luta` com campo `vencedorId`
  - `src/components/BracketTree.tsx` — já exibe tag "VENCEU" na árvore visual

---

## 3. Historia de Usuario

```
Como operador do torneio,
quero ver quais chaves já possuem vencedor na tela de PlacarChaves,
para que eu possa identificar rapidamente o progresso do torneio sem abrir cada chave.
```

Cenários alternativos:
- Chave sem nenhuma luta concluída: nenhuma tag exibida
- Chave com todas as lutas concluídas (campeão definido): tag "CAMPEÃO" pode ser exibida
- Badge de lutas: cor padronizada para azul

---

## 4. Requisitos Funcionais

- [ ] RF-01: O card de chave em PlacarChaves exibe badge "ENCERRADO" no canto superior direito, em amarelo gold, quando a chave possui um campeão definido (última rodada com vencedor)
- [ ] RF-06: O card de chave em PlacarChaves exibe badge "EM ANDAMENTO" no canto superior direito, em ciano, quando a chave possui pelo menos uma luta finalizada pelo operador (`status: 'completed'`) mas ainda não possui campeão. BYEs auto-resolvidos (`status: 'wo'`) não são considerados.
- [ ] RF-02: O badge de contagem de lutas em PlacarChaves usa cor azul (`blue`) em vez de grape
- [ ] RF-03: O badge de contagem de lutas em GerenciarChaves usa cor azul (`blue`) em vez de grape
- [ ] RF-04: O texto de confirmação de finalização em PlacarLuta usa cor azul (`blue`) em vez de grape
- [ ] RF-05: OBracketTree continua exibindo "VENCEU" e "DESCLASSIFICADO" conforme implementado

---

## 5. Requisitos Nao-Funcionais

- **Performance:** Sem impacto — cálculo baseado em dados já carregados
- **Acessibilidade:** Badges mantêm contraste adequado
- **Compatibilidade:** Sem alteração de compatibilidade

---

## 6. Analise da Aplicacao

- **Arquitetura:** React frontend com dados carregados via IPC do Electron main process
- **Padrões:** Mantine UI components, badges com `color` prop
- **Fluxo de dados:** Chaves são carregadas em `PlacarChaves` via `loadChavesPorArea`, que retorna `Chave[]` com `lutas` contendo `vencedorId`
- **Contratos:** A interface `Chave` já contém `lutas: Luta[]` onde cada `Luta` possui `vencedorId?: string | null`

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/pages/PlacarChaves.tsx` | Modificar | Substituir `color="grape"` por `color="blue"` e adicionar badge "VENCEDOR" |
| `src/pages/GerenciarChaves.tsx` | Modificar | Substituir `color="grape"` por `color="blue"` |
| `src/pages/PlacarLuta.tsx` | Modificar | Substituir `c="grape"` por `c="blue"` no texto de finalização |
| `spec/tag-vencedor-placar-correcao-cores.md` | Criar | Este documento de spec |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- **Reset de chaves:** O array `chaves` no JSON do torneio não estava sendo explicitamente resetado antes da geração. Embora `gerarTodasChavesHandler` substituísse o array com `novasChaves`, a adição de `torneio.chaves = []` no início da função garante que dados anteriores sejam descartados de forma explícita e segura.

### 8.2 Ambiguidades nos Requisitos
- "Placar - Area 1" pode se referir à primeira área ou à tela de PlacarChaves em geral. Adotado como PlacarChaves (lista de chaves da área selecionada).

### 8.3 Riscos
- Baixo risco — alterações cosméticas sem impacto em lógica de negócio

---

## 9. Criterios de Aceite

- [ ] CA-01: Dado uma chave com campeão definido, quando o operador acessa PlacarChaves, então o card exibe badge "ENCERRADO" no canto superior direito, em amarelo gold
- [ ] CA-02: Dado uma chave com pelo menos uma luta finalizada pelo operador mas sem campeão, quando o operador acessa PlacarChaves, então o card exibe badge "EM ANDAMENTO" no canto superior direito, em ciano
- [ ] CA-03: Dado uma chave sem lutas concluídas, quando o operador acessa PlacarChaves, então o card não exibe badge de status
- [ ] CA-03: Dado qualquer badge de contagem de lutas (PlacarChaves ou GerenciarChaves), quando renderizado, então a cor do badge é azul (não grape)
- [ ] CA-04: Dado o modal de confirmação de finalização por finalização em PlacarLuta, quando exibido, então o nome do atleta é exibido em azul (não grape)

---

## 10. Plano de Implementacao

```
Passo 1: Corrigir cores grape→blue nos badges e textos
  - O que fazer: Substituir `color="grape"` por `color="blue"` em PlacarChaves.tsx, GerenciarChaves.tsx e `c="grape"` por `c="blue"` em PlacarLuta.tsx
  - Arquivos: PlacarChaves.tsx:153, GerenciarChaves.tsx:429, PlacarLuta.tsx:717
  - Como validar: Verificar visualmente que badges e texto usam azul

Passo 2: Adicionar badge "VENCEDOR" em PlacarChaves
  - O que fazer: Na renderização dos cards, verificar se alguma luta da chave tem `vencedorId` preenchido. Se sim, exibir badge "VENCEDOR" com cor verde.
  - Arquivo: PlacarChaves.tsx
  - Como validar: Abrir PlacarChaves com chaves que têm e não têm vencedor; verificar que apenas as com vencedor exibem o badge
```

---

## 11. Rollout e Observabilidade

- **Estratégia:** Deploy direto (alteração cosmética)
- **Monitorar:** Verificar visualmente na tela PlacarChaves
- **Rollback:** Reverter alterações nos 3 arquivos

---

## 12. Definicao de Pronto

- [ ] Todos os critérios de aceite verificados
- [ ] Código revisado
- [ ] Sem warnings ou erros
- [ ] Documentação atualizada (este documento)

---

## Checklist

- [x] Li os documentos de referência
- [x] Entendi a historia de usuario
- [x] Identifiquei todos os arquivos envolvidos
- [x] Listei os problemas e impedimentos
- [x] O plano de implementação está em ordem lógica
- [x] Os critérios de aceite são verificáveis
