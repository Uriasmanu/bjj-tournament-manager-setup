# Spec: Atribuição de Área na Criação de Chave Manual

## 1. Contexto e Objetivo

- **O que é:** Adicionar seletor de área de luta no modal de criação de chave manual, permitindo que a chave seja automaticamente vinculada a uma área (via atribuição do primeiro árbitro da área).
- **Por que existe:** Atualmente, chaves criadas manualmente ficam sem área atribuída. O operador precisa atribuir um árbitro manualmente depois, o que é trabalhoso e propenso a esquecimento.
- **Quem usa:** Administradores do torneio que criam chaves manuais na tela Gerenciar Chaves.
- **Escopo:** Componente `ModalCriarChaveManual.tsx` — adição de Select de área e auto-atribuição de árbitro.

## 2. Analise dos Documentos de Referência

- **Guia de spec:** `doc/spec.md`
- **Documento de requisitos:** `doc/requisitos.md` (seção 3.11.2 Geração Manual de Chaves)
- **Código-fonte relevante:** `src/components/ModalCriarChaveManual.tsx`, `src/pages/GerenciarChaves.tsx`, `electron/brackets.ts`

## 3. Historia de Usuario

```
Como administrador,
quero selecionar a área de luta ao criar uma chave manual,
para que a chave seja automaticamente atribuída a um árbitro da área e apareça no placar correto.
```

## 4. Requisitos Funcionais

- [ ] RF-01: O modal de criação de chave manual deve exibir um Select de área (opcional)
- [ ] RF-02: O Select de área lista todas as áreas cadastradas no torneio
- [ ] RF-03: Ao criar uma chave com área selecionada, o primeiro árbitro da área é atribuído automaticamente à chave
- [ ] RF-04: Se nenhuma área for selecionada, a chave fica sem árbitro (comportamento atual)
- [ ] RF-05: A chave aparecerá na tela PlacarChaves da área selecionada

## 5. Requisitos Nao-Funcionais

- **Usabilidade:** O Select de área deve ser opcional para não quebrar fluxos existentes
- **Performance:** As áreas devem ser carregadas uma vez ao abrir o modal

## 6. Analise da Aplicacao

- **Relação Area → Chave:** Indireta via Árbitro. Uma área tem `arbitroIds[]`. Uma chave tem `arbitroId`. Para encontrar chaves de uma área, o sistema filtra chaves cujo `arbitroId` está no `arbitroIds` da área.
- **Fluxo de criação:** `ModalCriarChaveManual` → `gerarChave()` → chave salva sem `arbitroId` → atribuição manual futura
- **Fluxo proposto:** `ModalCriarChaveManual` → `gerarChave()` → `atribuirArbitroChave(chaveId, area.arbitroIds[0])` → chave aparece na área

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/ModalCriarChaveManual.tsx` | Modificar | Adicionar Select de área e auto-atribuição |

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum — `loadAreas()` e `atribuirArbitroChave()` já estão disponíveis via preload.

### 8.2 Ambiguidades nos Requisitos
- O que acontece se a área selecionada não tiver árbitros? → A chave fica sem árbitro (área sem árbitro não pode ser atribuída).

### 8.3 Riscos
- Baixo — mudança aditiva, não altera fluxo existente.

## 9. Criterios de Aceite

- [ ] CA-01: dado que o modal está aberto, quando o usuário vê o formulário, então há um Select de área com as áreas cadastradas
- [ ] CA-02: dado que o usuário seleciona uma área com árbitro, quando cria a chave, então o primeiro árbitro da área é atribuído à chave automaticamente
- [ ] CA-03: dado que o usuário não seleciona área, quando cria a chave, então a chave fica sem árbitro
- [ ] CA-04: dado que a chave foi criada com área, quando o usuário acessa PlacarChaves daquela área, então a chave aparece listada

## 10. Plano de Implementacao

```
Passo 1: Adicionar Select de área no ModalCriarChaveManual
  - O que fazer: Carregar áreas via loadAreas(), adicionar Select pesquisável antes do Select de atleta
  - Arquivo(s): src/components/ModalCriarChaveManual.tsx
  - Como validar: Abrir modal e verificar que o Select de área aparece

Passo 2: Auto-atribuir árbitro ao criar chave
  - O que fazer: Após gerarChave(), chamar atribuirArbitroChave() com o primeiro árbitro da área selecionada
  - Arquivo(s): src/components/ModalCriarChaveManual.tsx
  - Como validar: Criar chave com área selecionada e verificar que o árbitro foi atribuído
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto
- **Como monitorar:** Criar chave manual com e sem área, verificar na tela PlacarChaves
- **Plano de rollback:** Remover Select de área do modal

## 12. Definição de Pronto

- [ ] Todos os CA verificados
- [ ] Código sem warnings ou erros
- [ ] Histórico de Correções atualizado em spec.md
