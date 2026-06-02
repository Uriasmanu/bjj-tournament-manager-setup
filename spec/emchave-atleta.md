# Spec: Propriedade `emChave` e Melhoria na Visualização de Atletas Sem Chave

## 1. Contexto e Objetivo

- **O que é:** Adição da propriedade booleana `emChave` ao tipo `Atleta` (indicando se o atleta já está alocado em uma chave de luta) e melhoria da visualização dos atletas que estão sem chave na tela de gerenciamento de chaves, com opções acionáveis para lidar com cada caso.
- **Por que existe:** Atualmente, não há um campo explícito no atleta que indique se ele já foi alocado em uma chave. Além disso, a lista de "Atletas Sem Chave" na tela `GerenciarChaves` é apenas informativa (texto simples), sem oferecer ações para o administrador resolver a situação desses atletas que ficaram sozinhos na categoria.
- **Quem usa:** Administradores do torneio que gerenciam chaves e precisam tomar decisões sobre atletas sem oponente.
- **Escopo:** Adição da propriedade no tipo, atualização da lógica de geração de chaves para marcar `emChave`, melhoria do componente de visualização com cartões acionáveis contendo opções de remanejamento e declaração de W.O.

## 2. Documentos de Referência

- `doc/spec.md` — Guia de especificação
- `src/types/athlete.ts` — Tipo `Atleta`
- `src/pages/GerenciarChaves.tsx` — Tela de gerenciamento de chaves
- `electron/brackets.ts` — Lógica de geração de chaves
- `electron/athletes.ts` — Persistência de atletas

## 3. História de Usuário

Como administrador do torneio,
quero ver claramente quais atletas estão sem chave e ter opções para agir (mover para outra categoria ou declarar W.O.),
para que nenhum atleta inscrito fique sem resolução no evento.

## 4. Requisitos Funcionais

- [ ] RF-01: O tipo `Atleta` deve ter a propriedade opcional `emChave: boolean` indicando se o atleta está alocado em uma chave
- [ ] RF-02: Ao gerar chaves, os atletas alocados devem ter `emChave = true` e os não alocados `emChave = false`
- [ ] RF-03: A seção "Atletas Sem Chave" deve exibir cartões individuais com nome, equipe, categoria e ações disponíveis
- [ ] RF-04: Cada cartão deve oferecer a ação "Subir peso" (próximo peso acima) quando disponível
- [ ] RF-05: Cada cartão deve oferecer a ação "Descer peso" (próximo peso abaixo) quando disponível
- [ ] RF-06: Cada cartão deve oferecer a ação "Declarar W.O." que gera uma chave com o atleta como campeão
- [ ] RF-07: As ações "Subir peso" e "Descer peso" devem exibir um indicador visual da quantidade de atletas na categoria de destino ("luta casada")
- [ ] RF-08: Quando a categoria de destino tiver atletas, o botão deve ser destacado (preenchido/amarelo) para indicar que resultará em uma luta

## 5. Requisitos Não-Funcionais

- **Performance:** Sem impacto significativo — operações O(n) para computar `emChave`
- **Compatibilidade:** A propriedade `emChave` é opcional, não quebra contratos existentes
- **Persistência:** O campo `emChave` não é armazenado no JSON do torneio, é computado dinamicamente a partir das chaves existentes

## 6. Análise da Aplicação

### Arquitetura

- `src/types/athlete.ts` — Definição do tipo `Atleta`
- `electron/brackets.ts` — Geração de chaves no main process
- `src/pages/GerenciarChaves.tsx` — Frontend que exibe chaves e atletas sem chave
- `src/components/AthleteTable.tsx` — Tabela de atletas (exibe `emChave`)

### Fluxo de dados

1. Admin acessa "Gerenciar Chaves"
2. Frontend carrega atletas e chaves via IPC
3. Frontend calcula `emChave` para cada atleta (verificando se ID está em `posicoesAtletas` de alguma chave)
4. Atletas com `emChave = false` e que estão sozinhos na categoria são exibidos na seção "Atletas Sem Chave"
5. Admin pode clicar em "Subir peso" → chama `updateAthlete` com categoria de peso superior
6. Admin pode clicar em "Descer peso" → chama `updateAthlete` com categoria de peso inferior
7. Admin pode clicar em "Declarar W.O." → cria chave especial (pendente de implementação futura)
8. Botões de subir/descer mostram indicador visual (contagem de atletas) da categoria de destino

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/types/athlete.ts` | Modificar | Adicionar `emChave?: boolean` à interface `Atleta` |
| `src/pages/GerenciarChaves.tsx` | Modificar | Melhorar visualização com cartões acionáveis para atletas sem chave |
| `electron/brackets.ts` | Modificar | Marcar `emChave` nos atletas ao gerar chaves |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

Nenhum. A propriedade é opcional e não quebra contratos existentes.

### 8.2 Ambiguidades nos Requisitos

- **"Declarar W.O."**: A implementação completa de criar uma chave especial para W.O. pode ser complexa. Para esta entrega, será exibido o botão com notificação informando que a funcionalidade será implementada em versão futura, OU será criada uma chave com um único atleta e status especial.

### 8.3 Riscos

- Baixo risco de regressão: a propriedade é adicionada como opcional e não afeta fluxos existentes

## 9. Critérios de Aceite

- [ ] CA-01: Dado um atleta alocado em uma chave, quando a tela carregar, então `emChave` deve ser `true`
- [ ] CA-02: Dado um atleta não alocado em nenhuma chave, quando a tela carregar, então `emChave` deve ser `false`
- [ ] CA-03: Dado um atleta sem chave, quando visualizar a seção "Atletas Sem Chave", então deve ver um cartão com nome, equipe, categoria e botões de ação
- [ ] CA-04: Dado um atleta sem chave com categoria que possui peso superior disponível, quando clicar em "Subir peso", então a categoria do atleta deve ser atualizada
- [ ] CA-05: Dado um atleta sem chave com categoria que possui peso inferior disponível, quando clicar em "Descer peso", então a categoria do atleta deve ser atualizada
- [ ] CA-06: Dado um atleta sem chave e uma categoria de destino com 3 atletas, quando visualizar o cartão, então o botão "Subir peso" ou "Descer peso" deve mostrar "3" como indicador

## 10. Plano de Implementação

### Passo 1: Adicionar `emChave` ao tipo `Atleta`

**O que fazer:** Adicionar a propriedade opcional `emChave?: boolean` à interface `Atleta`.

**Arquivo:** `src/types/athlete.ts`

**Validação:** TypeScript compila sem erros.

### Passo 2: Computar `emChave` ao carregar dados no frontend

**O que fazer:** No `GerenciarChaves.tsx`, após carregar atletas e chaves, percorrer todos os atletas e marcar `emChave` como `true` se o ID do atleta estiver em `posicoesAtletas` de alguma chave.

**Arquivo:** `src/pages/GerenciarChaves.tsx`

### Passo 3: Melhorar visualização dos atletas sem chave

**O que fazer:** Substituir a lista textual de atletas sem chave por cartões estilizados com:
- Nome do atleta (capitalizado)
- Equipe
- Categoria (label legível)
- Badge "Sem chave"
- Botão "Subir peso" (se houver peso acima disponível) com indicador de atletas na categoria destino
- Botão "Descer peso" (se houver peso abaixo disponível) com indicador de atletas na categoria destino
- Botão "Declarar W.O." (placeholder com notificação)

**Arquivo:** `src/pages/GerenciarChaves.tsx`

### Passo 4: Implementar ações "Subir peso" e "Descer peso"

**O que fazer:** Ao clicar no botão, identificar a categoria atual do atleta, extrair o peso, encontrar o próximo/anterior peso na ordem, construir o novo categoryId e chamar `window.electronAPI.updateAthlete()` com a nova categoria.

**Arquivo:** `src/pages/GerenciarChaves.tsx`

**Lógica de navegação de peso:**
```typescript
const PESO_ORDER = ['galo', 'pluma', 'pena', 'leve', 'medio', 'meio-pesado', 'pesado', 'super-pesado', 'pesadissimo'];
```

Extrair peso do categoryId: `const partes = categoriaId.split('-')` → o último segmento é o peso.

### Passo 5: Indicador de "luta casada"

**O que fazer:** Calcular `catCount` (mapa de categoria → número de atletas) via `useMemo` e exibir a contagem nos botões de subir/descer peso. Quando a categoria de destino tiver atletas, o botão fica preenchido (amarelo) e exibe a contagem (ex: "↓ 3" ou "↑ 2").

## 11. Rollout e Observabilidade

- **Estratégia:** Deploy direto — todas as mudanças são aditivas e não quebram funcionalidades existentes
- **Rollback:** Reverter alterações nos arquivos modificados
