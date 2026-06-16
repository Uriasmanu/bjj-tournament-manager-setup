# Spec: Permitir Mesmo Árbitro em Múltiplas Áreas com Aviso

## 1. Contexto e Objetivo

- **O que é:** Permitir que um árbitro seja atribuído a mais de uma área de luta, exibindo um aviso quando isso ocorrer.
- **Por que existe:** O sistema anterior bloqueava a atribuição, impedindo o uso compartilhado de árbitros.
- **Quem usa:** Administradores do sistema ao cadastrar ou editar áreas de luta.
- **Escopo:** Formulário de área (`AreaForm`), backend de áreas (`electron/areas.ts`).

---

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): todas as seções serão preenchidas
- **Documento de requisitos** `requisitos.md`: seção relativa a áreas de luta e árbitros
- **Código-fonte relevante**: `src/components/AreaForm.tsx`, `electron/areas.ts`

---

## 3. Historia de Usuario

```
Como administrador,
quero atribuir o mesmo árbitro a mais de uma área,
para que eu possa compartilhar árbitros entre áreas quando necessário.
```

**Cenários alternativos:**
- Árbitro já está em outra área → exibe aviso indicando qual área
- Árbitro não está em nenhuma outra área → sem aviso

---

## 4. Requisitos Funcionais

- [x] RF-01: O sistema deve permitir atribuir um árbitro a mais de uma área.
- [x] RF-02: Ao selecionar um árbitro que já está em outra área, o sistema deve exibir um aviso indicando o nome da área conflitante.
- [x] RF-03: O aviso deve ser exibido dentro do formulário, antes de salvar.
- [x] RF-04: Todos os árbitros devem estar disponíveis no dropdown, independentemente de já estarem em outra área.

---

## 5. Requisitos Nao-Funcionais

- **Performance:** sem impacto significativo
- **Segurança:** sem mudanças
- **Acessibilidade:** alerta usa componente `Alert` do Mantine

---

## 6. Analise da Aplicacao

- **Arquitetura geral:** Backend valida existência de árbitros (não mais exclusão mútua). Frontend exibe todos os árbitros e calcula avisos.
- **Padrões em uso:** `useMemo` para cálculo de avisos, `Alert` do Mantine para exibição.
- **Fluxo de dados:** `areas` (lista de áreas) é passada ao `AreaForm`. Avisos são calculados comparando seleção atual com outras áreas.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `electron/areas.ts` | Modificar | Remover validação de exclusão mútua de árbitros |
| `src/components/AreaForm.tsx` | Modificar | Remover filtro de árbitros usados + adicionar aviso |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum

### 8.2 Ambiguidades nos Requisitos
- Nenhuma

### 8.3 Riscos
- Risco baixo: o backend permite, frontend avisa visualmente

---

## 9. Criterios de Aceite

- [x] CA-01: dado um árbitro já atribuído à área "Área 1", quando o usuário seleciona esse árbitro na edição da "Área 2", então um aviso exibe "O árbitro X já está atribuído à área Área 1".
- [x] CA-02: quando o usuário salva a área com árbitro duplicado, então a operação é bem-sucedida (sem erro).
- [x] CA-03: todos os árbitros devem aparecer no dropdown, independentemente de estarem em outras áreas.

---

## 10. Plano de Implementacao

```
Passo 1: Modificar backend para remover bloqueio
  - O que fazer: renomear `checkRefereeNotInUse` para `checkRefereesExist` removendo validação de exclusão mútua
  - Arquivo(s): `electron/areas.ts`
  - Como validar: `saveArea` e `updateArea` aceitam árbitro duplicado

Passo 2: Modificar frontend para mostrar todos os árbitros
  - O que fazer: remover filtro `usedArbitroIds` no `AreaForm`
  - Arquivo(s): `src/components/AreaForm.tsx`
  - Como validar: dropdown mostra todos os árbitros

Passo 3: Adicionar cálculo e exibição de avisos
  - O que fazer: usar `useMemo` para detectar conflitos e exibir `Alert`
  - Arquivo(s): `src/components/AreaForm.tsx`
  - Como validar: aviso aparece ao selecionar árbitro duplicado
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto
- **Como monitorar:** testar atribuição de árbitro duplicado em áreas diferentes
- **Plano de rollback:** reverter alterações em `areas.ts` e `AreaForm.tsx`

---

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado
- [x] Sem warnings ou erros não tratados introduzidos
