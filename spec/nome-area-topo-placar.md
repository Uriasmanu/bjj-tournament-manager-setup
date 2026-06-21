# Nome da Área no Topo das Telas de Placar

## 1. Contexto e Objetivo

- **O que é:** Exibição do nome da área selecionada no topo de todas as telas de placar (PlacarBracket, PlacarLuta, PlacarLutaCasada).
- **Por que existe:** O administrador/árbitro precisa saber em qual área está trabalhando ao navegar entre as telas de placar.
- **Quem usa:** Árbitros e administradores que acessam o placar de lutas dentro de uma área.
- **Escopo:** Todas as sub-páginas de placar que recebem `areaId` como parâmetro de URL.

## 2. História de Usuário

```
Como administrador do torneio,
quero ver o nome da área selecionada no topo da tela ao acessar qualquer página de placar,
para que eu saiba exatamente em qual área estou trabalhando.
```

**Cenários alternativos:**
- Área não encontrada: exibir título genérico ("Placar") sem nome da área.
- Tela de seleção de área (PlacarMenu): não precisa exibir nome da área (já é a tela de seleção).

## 3. Requisitos Funcionais

- [x] RF-01: O componente `PageLayout` deve renderizar o título passado como prop em um `<Title>` no topo do Paper.
- [x] RF-02: O componente `PageLayout` deve renderizar os `headerExtras` ao lado do título.
- [x] RF-03: A tela `PlacarBracket` deve carregar os dados da área e incluir `area.nome` no título.
- [x] RF-04: A tela `PlacarLuta` deve carregar os dados da área e incluir `area.nome` no título.
- [x] RF-05: A tela `PlacarLutaCasada` deve carregar os dados da área e incluir `area.nome` no título.
- [x] RF-06: Se a área não for encontrada, o título deve exibir apenas "Placar" (fallback).

## 4. Requisitos Não-Funcionais

- **Performance:** Requisição extra `loadAreas()` adicionada em 3 páginas (PlacarBracket, PlacarLuta, PlacarLutaCasada). Dados estáticos, baixo impacto.
- **Compatibilidade:** Funciona em todas as plataformas (Electron desktop).

## 5. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/components/PageLayout.tsx` | Modificar | Corrigir renderização do título e headerExtras |
| `src/pages/PlacarBracket.tsx` | Modificar | Carregar dados da área e incluir nome no título |
| `src/pages/PlacarLuta.tsx` | Modificar | Carregar dados da área e incluir nome no título |
| `src/pages/PlacarLutaCasada.tsx` | Modificar | Carregar dados da área e incluir nome no título |
| `src/types/area.ts` | — | Já possui interface `AreaLuta` com campo `nome` |

## 6. Critérios de Aceite

- [x] CA-01: Dado que estou na tela PlacarBracket dentro da área "Área 1", quando a tela carregar, o título deve exibir "Placar - Área 1".
- [x] CA-02: Dado que estou na tela PlacarLuta dentro da área "Área 2", quando a tela carregar, o título deve exibir "Placar - Área 2 · Luta 1 · Rodada 1".
- [x] CA-03: Dado que estou na tela PlacarLutaCasada dentro da área "Área 3", quando a tela carregar, o título deve exibir "Placar - Área 3 · Luta Casada".
- [x] CA-04: Dado que a área não é encontrada, o título deve exibir o fallback sem nome da área.

## 7. Plano de Implementação

```
Passo 1: Corrigir PageLayout.tsx
  - Remover prefixo underscore de _title e _headerExtras
  - Adicionar <Group> com <Title> e {headerExtras} antes dos children

Passo 2: Atualizar PlacarBracket.tsx
  - Adicionar import de AreaLuta
  - Adicionar state para area
  - Adicionar loadAreas() no useEffect existente
  - Atualizar título do PageLayout para incluir area.nome

Passo 3: Atualizar PlacarLuta.tsx
  - Adicionar import de AreaLuta
  - Adicionar state para area
  - Adicionar loadAreas() no useEffect existente
  - Atualizar título do PageLayout para incluir area.nome

Passo 4: Atualizar PlacarLutaCasada.tsx
  - Adicionar import de AreaLuta
  - Adicionar state para area
  - Adicionar loadAreas() no useEffect existente
  - Atualizar título do PageLayout para incluir area.nome
```

## 8. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (correção de bug existente).
- **Como monitorar:** Verificar que o nome da área aparece no topo ao navegar nas telas de placar.
- **Plano de rollback:** Reverter alterações nos arquivos modificados.

## 9. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Sem warnings ou erros não tratados introduzidos
- [x] Seção Histórico de Correções atualizada em spec.md
