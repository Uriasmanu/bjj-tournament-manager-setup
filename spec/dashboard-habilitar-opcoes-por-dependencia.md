# Spec: Dashboard - Habilitar Opções por Dependência de Dados

## 1. Contexto e Objetivo

- **O que é:** Os cards do Dashboard são habilitados/desabilitados dinamicamente conforme a existência de dados dependentes no torneio.
- **Por que existe:** Guiar o usuário no fluxo correto de cadastro, evitando que ele tente acessar funcionalidades sem os dados prerequisite.
- **Quem usa:** Administradores do sistema gerenciando um torneio.
- **Escopo:** Apenas o Dashboard (`src/pages/Dashboard.tsx`). Fora do escopo: rotas de acesso (AreaGuard já trata isso).

---

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): todas as seções serão preenchidas
- **Documento de requisitos** `requisitos.md`: seção 3.6 (Dashboard Administrativo)
- **Documentação técnica existente**: nenhum spec prévio para esta feature
- **Código-fonte relevante**: `src/pages/Dashboard.tsx`, `src/types/tournament.ts`

---

## 3. Historia de Usuario

```
Como administrador,
quero ver os cards do Dashboard habilitados apenas quando tenho os dados necessários,
para que eu saiba quais funcionalidades estão disponíveis para uso.
```

**Cenários alternativos:**
- Torneio recém-criado (sem dados) → apenas "Atletas" habilitado
- Com atletas cadastrados → "Árbitros" e "Equipes" habilitados
- Com árbitros cadastrados → "Áreas de Luta" habilitado
- Com áreas cadastradas → "Lutas Casadas" e "Geração de Chaves" habilitados
- Com chaves geradas → "Placar" e "Resultados" habilitados

---

## 4. Requisitos Funcionais

- [ ] RF-01: O card "Atletas" deve estar sempre habilitado (independente de outros dados).
- [ ] RF-02: O card "Equipes" deve estar habilitado quando houver pelo menos 1 atleta cadastrado.
- [ ] RF-03: O card "Árbitros" deve estar habilitado quando houver pelo menos 1 atleta cadastrado.
- [ ] RF-04: O card "Áreas de Luta" deve estar habilitado quando houver pelo menos 1 árbitro cadastrado.
- [ ] RF-05: O card "Lutas Casadas" deve estar habilitado quando houver pelo menos 1 área de luta cadastrada.
- [ ] RF-06: O card "Geração de Chaves" deve estar habilitado quando houver pelo menos 1 área de luta cadastrada.
- [ ] RF-07: O card "Placar" deve estar habilitado quando houver pelo menos 1 chave gerada.
- [ ] RF-08: O card "Resultados" deve estar habilitado quando houver pelo menos 1 chave gerada.
- [ ] RF-09: Cards desabilitados devem exibir `opacity: 0.5`, `cursor: not-allowed` e tooltip explicando a dependência.
- [ ] RF-10: Cards desabilitados não devem navegar ao clicar.

---

## 5. Requisitos Nao-Funcionais

- **Performance:** cálculo baseado em dados já carregados (sem chamadas adicionais de IPC)
- **Segurança:** sem mudanças
- **Acessibilidade:** tooltip deve ser acessível (title attribute ou componente Mantine)
- **Compatibilidade:** sem mudanças
- **Observabilidade:** sem mudanças

---

## 6. Analise da Aplicacao

- **Arquitetura geral:** Dashboard carrega torneio via IPC `get-active-tournament` e extrai contagens de `atletas`, `arbitros`, `areas`, `chaves`.
- **Padrões em uso:** cards definidos em array `dashboardCards` com propriedade `status: 'implemented' | 'planned'`.
- **Fluxo de dados:** `torneio.atletas`, `torneio.arbitros`, `torneio.areas`, `torneio.chaves` são arrays opcionais.
- **Contratos de API:** sem mudanças

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/pages/Dashboard.tsx` | Modificar | Adicionar lógica de habilitação baseada em dependências |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos

- Nenhum problema técnico identificado

### 8.2 Ambiguidades nos Requisitos

- Nenhuma ambiguidade identificada

### 8.3 Riscos

- Risco baixo: mudança visual apenas, sem impacto em dados

---

## 9. Criterios de Aceite

- [ ] CA-01: dado um torneio sem atletas, quando o usuário visualiza o Dashboard, então apenas o card "Atletas" está habilitado.
- [ ] CA-02: dado um torneio com atletas mas sem árbitros, quando o usuário visualiza o Dashboard, então "Atletas", "Equipes" e "Árbitros" estão habilitados.
- [ ] CA-03: dado um torneio com árbitros mas sem áreas, quando o usuário visualiza o Dashboard, então "Áreas de Luta" está habilitado.
- [ ] CA-04: dado um torneio com áreas mas sem chaves, quando o usuário visualiza o Dashboard, então "Lutas Casadas" e "Geração de Chaves" estão habilitados.
- [ ] CA-05: dado um torneio com chaves, quando o usuário visualiza o Dashboard, então "Placar" e "Resultados" estão habilitados.
- [ ] CA-06: quando o usuário clica em um card desabilitado, então nada acontece (sem navegação).
- [ ] CA-07: quando o usuário passa o mouse sobre um card desabilitado, então um tooltip explica qual dado é necessário.

---

## 10. Plano de Implementacao (Passo a Passo)

```
Passo 1: Adicionar lógica de cálculo de dependências no Dashboard
  - O que fazer: extrair contagens de atletas, arbitros, areas, chaves do torneio e calcular quais cards estão habilitados
  - Arquivo(s): `src/pages/Dashboard.tsx`
  - Como validar: variáveis `hasAtletas`, `hasArbitros`, `hasAreas`, `hasChaves` retornam booleano correto

Passo 2: Modificar renderização dos cards para usar estado habilitado/desabilitado
  - O que fazer: substituir `status === 'implemented'` por lógica de dependência; adicionar tooltip em cards desabilitados
  - Arquivo(s): `src/pages/Dashboard.tsx`
  - Como validar: cards desabilitados exibem opacity 0.5, cursor not-allowed e tooltip

Passo 3: Adicionar tooltip explicativo em cards desabilitados
  - O que fazer: usar componente `Tooltip` do Mantine para exibir mensagem explicativa
  - Arquivo(s): `src/pages/Dashboard.tsx`
  - Como validar: tooltip aparece ao hover em card desabilitado
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto
- **Como monitorar:** verificar Dashboard em torneio com diferentes estados de dados
- **Plano de rollback:** reverter mudanças em `Dashboard.tsx`

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite foram verificados
- [ ] Código revisado
- [ ] Documentação atualizada (este spec)
- [ ] Sem warnings ou erros não tratados introduzidos
- [ ] Seção **Histórico de Correções** atualizada em spec.md
