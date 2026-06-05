# Spec: Aparência Moderna — Cores Consistentes do Tema

## 1. Contexto e Objetivo

- **O que é:** Substituir códigos hexadecimais hardcoded (`#1565C0`, `#6c757d`, etc.) nos componentes por referências ao tema Mantine (`c="blue"`, `c="dimmed"`, etc.), garantindo que as cores definidas em `doc/requisitos.md §9.1.1` sejam usadas de forma consistente em toda a aplicação.
- **Por que existe:** Cores hardcoded quebram a manutenibilidade do tema — qualquer alteração futura na paleta precisaria ser replicada manualmente em N arquivos. Além disso, componentes que não usam o tema podem ficar inconsistentes com a identidade visual do sistema.
- **Quem usa:** Todos os usuários finais (visual) e desenvolvedores (manutenção).
- **Escopo:**
  - Dentro: `MenuInicial.tsx`, `CriarTorneio.tsx`, `ImportarTorneio.tsx`.
  - Fora: `PlacarLuta.tsx` e `PlacarLutaCasada.tsx` (usam azul anil/branco intencionalmente por design do scoreboard).

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): todas as 12 seções preenchidas.
- **Requisitos** (`doc/requisitos.md`): §9.1.1 define a paleta (Azul Royal `#1565C0` para destaques, Gray 6 `#6c757d` para texto secundário, Gray 0 `#f8f9fa` para fundo).
- **Tema existente** (`src/styles/theme.ts`): já define `primaryColor: 'blue'` + arrays `blue` (index 6 = `#1565C0`) e `gray` (index 0 = `#f8f9fa`, index 2 = `#e9ecef`, index 6 = `#6c757d`).
- **Código-fonte:** `MenuInicial.tsx`, `CriarTorneio.tsx`, `ImportarTorneio.tsx` — 9 ocorrências de hex hardcoded.

## 3. História de Usuário

```
Como desenvolvedor do tema,
quero que a aplicação use referências ao tema Mantine em vez de cores hex hardcoded,
para garantir a consistência visual e facilitar futuras alterações na paleta de cores.
```

## 4. Requisitos Funcionais

- [x] RF-01: Substituir `c="#1565C0"` por `c="blue"` ou `c="blue.6"` em todos os componentes.
- [x] RF-02: Substituir `color="#1565C0"` em `Icon` por `color="blue"`.
- [x] RF-03: Substituir `c="#6c757d"` por `c="dimmed"`.
- [x] RF-04: Substituir `backgroundColor: '#f8f9fa'` por `backgroundColor: 'var(--mantine-color-gray-0)'` onde aplicável.
- [x] RF-05: Verificar que todos os arquivos de `src/pages/` não possuem mais cores hex hardcoded (exceto `PlacarLuta.tsx` e `PlacarLutaCasada.tsx`).
- [x] RF-06: Substituir fundo sólido do `body` por gradiente suave usando Gray 0 (`#f8f9fa`) e Blue 0 (`#e3f2fd`).

## 5. Requisitos Não-Funcionais

- **Performance:** Sem impacto (apenas substituição de strings).
- **Segurança:** N/A.
- **Acessibilidade:** Manter contraste adequado (as cores do tema já são WCAG-compliant).
- **Compatibilidade:** Idêntico.

## 6. Análise da Aplicação

Todos os targets estão em `src/pages/`. O Mantine já injeta variáveis CSS via `createTheme`, então `c="blue"` e `c="dimmed"` funcionam nativamente.

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/pages/MenuInicial.tsx` | Modificar | 3 ocorrências de hex hardcoded |
| `src/pages/CriarTorneio.tsx` | Modificar | 1 ocorrência de hex hardcoded |
| `src/pages/ImportarTorneio.tsx` | Modificar | 4 ocorrências de hex hardcoded |
| `src/styles/global.css` | Modificar | Background do body: sólido → gradiente (Gray 0 + Blue 0) |

## 8. Problemas e Impedimentos

Nenhum.

## 9. Critérios de Aceite

- [x] Nenhum `#1565C0`, `#6c757d`, `#e9ecef` ou `#f8f9fa` hardcoded em `src/pages/` (exceto `PlacarLuta.tsx` e `PlacarLutaCasada.tsx`).
- [x] `MenuInicial.tsx` usa `c="blue"` e `Icon color="blue"` e `c="dimmed"`.
- [x] `CriarTorneio.tsx` usa `c="blue"`.
- [x] `ImportarTorneio.tsx` usa `c="blue"`, `Icon color="blue"` e `c="dimmed"`.
- [x] `global.css` body background usa gradiente `linear-gradient(135deg, #f8f9fa, #e3f2fd)`.

## 10. Plano de Implementação

```
Passo 1: MenuInicial.tsx — 3 substituições
Passo 2: CriarTorneio.tsx — 1 substituição
Passo 3: ImportarTorneio.tsx — 4 substituições
Passo 4: global.css — body de sólido para gradiente
Passo 5: Verificar lint + tsc
```

## 11. Rollout e Observabilidade

Deploy direto. Verificar que as cores aparecem corretamente em cada página.

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite verificados
- [x] Código revisado
- [x] Documentação atualizada (spec/aparencia-moderna.md)
- [x] Sem warnings/erros introduzidos
- [x] Histórico de Correções atualizado
