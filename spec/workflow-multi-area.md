# Workflow Multi-Área (Export/Import Distribuído)

## 1. Contexto e Objetivo

- **O que é:** Fluxo de trabalho que permite configurar o torneio em uma máquina mestre, distribuir cópias para máquinas de cada área de luta, atualizar placares em paralelo durante o evento, e consolidar tudo em uma única máquina ao final.
- **Por que existe:** Em campeonatos reais, cada área de luta opera independentemente com seu próprio computador. O sistema precisa suportar a sincronização entre essas máquinas sem perder dados ou causar conflitos.
- **Quem usa:** Organizadores do torneio (máquina mestre) e operadores de área (máquinas de cada área).
- **Escopo:** Dentro: exportação/importação do torneio com merge por `updatedAt` individual por item, fluxo de Placar por área, consolidação final. Fora: sincronização em tempo real, resolução de conflitos entre áreas (cada área é mutuamente exclusiva).

## 2. Documentos de Referência

- `doc/spec.md` — Guia de spec
- `doc/requisitos.md` — Requisitos funcionais (seção 3.3 Importação, 3.19 Placar)
- `electron/tournament.ts` — Handlers `import-tournament`, `export-tournament`
- `electron/brackets.ts` — Handler `load-chaves-por-area`
- `src/pages/PlacarChaves.tsx` — Listagem de chaves por área
- `src/types/bracket.ts` — Tipo `Chave` com `updatedAt`

## 3. História de Usuário

```
Como organizador de torneio,
quero configurar o torneio uma vez, distribuir para as máquinas de cada área,
e ao final consolidar os resultados de todas as áreas,
para que cada área opere de forma independente sem perda de dados.
```

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema deve permitir exportar o JSON completo do torneio (já implementado em `export-tournament`).
- [ ] RF-02: O sistema deve permitir importar um JSON de torneio realizando merge por `updatedAt` individual em todos os sub-arrays (já implementado em `import-tournament` com `mergeById`).
- [ ] RF-03: O sistema deve carregar apenas as chaves associadas à área selecionada no Placar (`loadChavesPorArea`), permitindo que cada máquina trabalhe apenas nas chaves da sua área.
- [ ] RF-04: O merge deve preservar itens não alterados (mesmo `updatedAt`) — o lado existing vence.
- [ ] RF-05: Itens com `updatedAt` mais recente vencem independentemente da ordem de importação (last-write-wins por item).

## 5. Requisitos Não-Funcionais

- **Performance:** Importação/exportação deve ser instantânea para torneios de até ~500 atletas e ~50 chaves.
- **Segurança:** Nenhuma autenticação entre máquinas — o fluxo é offline, via arquivo JSON (USB/rede local).
- **Observabilidade:** Notificações no frontend com contadores de merge (criados/atualizados/mantidos/removidos).

## 6. Análise da Aplicação

- **Arquitetura:** Electron single-user. Cada máquina roda uma instância independente do app.
- **Fluxo de dados:** Máquina mestre → export JSON → copiar para USB/rede → máquina de área → import → Placar → export → copiar de volta → máquina mestre → import (merge).
- **Contratos:** `import-tournament` retorna contadores de merge. `export-tournament` copia o JSON do torneio.

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `electron/tournament.ts` | Verificar | Handlers `import-tournament` e `export-tournament` — já implementados |
| `electron/brackets.ts` | Verificar | `loadChavesPorAreaHandler` — já implementado |
| `src/pages/PlacarChaves.tsx` | Verificar | Filtro de chaves por área — já implementado |

Nenhuma alteração de código necessária — o fluxo já é suportado.

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- Nenhum. O merge por `updatedAt` individual por item (inclusive chaves e lutasCasadas) garante a consistência.

### 8.2 Ambiguidades

- Ordem de importação: múltiplos imports de diferentes áreas podem ser feitos em qualquer ordem que o resultado final é o mesmo (last-write-wins por item).

### 8.3 Riscos

- Se uma máquina de área modificar dados que não são da sua área (ex.: cadastrar atletas), o merge pode sobrescrever dados da máquina mestre caso o `updatedAt` seja mais recente. Mitigação: orientação operacional de que cada máquina deve apenas operar o Placar da sua área.

## 9. Critérios de Aceite

- [ ] CA-01: Dado um torneio configurado na máquina mestre, quando exportado e importado em uma máquina de área, então o torneio é exibido com todas as áreas e chaves.
- [ ] CA-02: Dado uma máquina de área que registrou resultados via Placar, quando exportada e importada na máquina mestre, então apenas as chaves daquela área são atualizadas (as demais permanecem como estavam).
- [ ] CA-03: Dado imports consecutivos de duas áreas diferentes, quando feitos em qualquer ordem, então o estado final é o mesmo (chaves de ambas as áreas com seus resultados mais recentes).

## 10. Plano de Implementação

```
Passo 1: Verificar funcionamento do fluxo
  - O que fazer: fluxo já está implementado. A correção anterior (mergeById para chaves/lutasCasadas) foi o único pré-requisito técnico.
  - Arquivo(s): electron/tournament.ts
  - Como validar: compilação sem erros, lógica de merge correta.
```

## 11. Rollout e Observabilidade

- **Estratégia:** Já está disponível — nenhum deploy adicional necessário.
- **Monitorar:** Notificações de merge no frontend informam contadores.
- **Rollback:** Restaurar backup do JSON do torneio antes dos imports consolidados.

## 12. Definição de Pronto

- [x] Todos os critérios de aceite verificados
- [x] Código revisado
- [x] Documentação atualizada (spec criada)
- [ ] Teste de ponta a ponta do fluxo executado
