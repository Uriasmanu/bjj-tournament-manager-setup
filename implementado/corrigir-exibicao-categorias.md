# Corrigir Exibição de Categorias Customizadas

## 1. Contexto e Objetivo

- **O que é:** Corrigir a exibição de categorias personalizadas que apareciam como UUIDs (`custom-3f6e8e0e-...`) em vez de nomes legíveis em todas as telas, incluindo o placar.
- **Por que existe:** Múltiplas causas: `getCategoriaLabel` retornava o ID bruto como fallback, `extrairPeso()` não conseguia extrair o peso de categorias customizadas (sem `masculino`/`feminino` no ID), e vários `useMemo` tinham dependência `customizadas` faltando.
- **Quem usa:** Todos os usuários que visualizam categorias de atletas e chaves, especialmente no placar.
- **Escopo:** Correção de bug em fallback de categorias, função `extrairPeso` e dependências de hooks.

---

## 2. Analise dos Documentos de Referência

- **Guia de spec** (doc/spec.md): confirmado
- **Documento de requisitos** `doc/requisitos.md`: categorias devem ser exibidas como nomes legíveis (ex: "Adulto Masculino Leve")
- **Código-fonte relevante:**
  - `src/types/category.ts:120-127` — `getCategoriaLabel` com fallback para UUID
  - `electron/pdf.ts:432-436` — função duplicada com mesmo bug
  - `src/pages/PlacarChaves.tsx:31-36` — `extrairPeso()` retornava UUID bruto para categorias custom
  - `src/pages/GerenciarChaves.tsx:33-39` — `extrairPeso()` com mesmo bug
  - `src/pages/AdminAthletes.tsx:90-104` — useMemo sem dependência `customizadas`
  - `src/pages/GerenciarChaves.tsx:164,172` — useMemo sem dependência `customizadas`
  - `src/pages/PlacarChaves.tsx:128` — useMemo sem dependência `customizadas`

---

## 3. Historia de Usuario

```
Como organizador do torneio,
quero que as categorias personalizadas sejam exibidas com nome legível no placar,
para que eu consiga identificar as categorias na interface.
```

---

## 4. Requisitos Funcionais

- [x] RF-01: Categorias IBJJF devem ser exibidas com seu nome legível (ex: "Adulto Masculino Leve").
- [x] RF-02: Categorias personalizadas devem ser exibidas com o nome definido pelo usuário.
- [x] RF-03: Quando a categoria não é encontrada e começa com "custom-", exibir "Categoria Personalizada" em vez do UUID.
- [x] RF-04: A busca por categoria deve funcionar corretamente após o carregamento assíncrono das categorias.
- [x] RF-05: O título da chave no placar deve exibir o nome legível da categoria mesmo para categorias customizadas.
- [x] RF-06: Chaves com campo `nome` preenchido devem exibir esse nome diretamente no placar.

---

## 5. Requisitos Nao-Funcionais

- **Performance:** Sem impacto — mudança em lógica de fallback e dependências de memoização.
- **Observabilidade:** Logs de erro permanecem inalterados.

---

## 6. Analise da Aplicacao

- **Causa raiz 1:** `getCategoriaLabel` retornava `categoriaId` (UUID bruto) como fallback quando `customizadas` era `[]`.
- **Causa raiz 2:** `extrairPeso()` tentava extrair o peso do ID da categoria, mas categorias customizadas (`custom-UUID`) não contêm `masculino`/`feminino`, então retornava o UUID bruto.
- **Causa raiz 3:** `getChaveTitle` no `PlacarChaves.tsx` não verificava `chave.nome` antes de montar o título.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
| --- | --- | --- |
| `src/types/category.ts` | Modificar | Corrigir fallback de `getCategoriaLabel` |
| `electron/pdf.ts` | Modificar | Corrigir fallback duplicado |
| `src/pages/PlacarChaves.tsx` | Modificar | Corrigir `extrairPeso()`, adicionar `chave.nome` check, adicionar `customizadas` ao useMemo |
| `src/pages/GerenciarChaves.tsx` | Modificar | Corrigir `extrairPeso()`, passar `customizadas`, adicionar `customizadas` aos useMemo |
| `src/pages/AdminAthletes.tsx` | Modificar | Adicionar `customizadas` ao useMemo |

---

## 8. Problemas e Impedimentos

Nenhum impedimento. Correção isolada de bug.

---

## 9. Criterios de Aceite

- [x] CA-01: Dado um atleta com categoria personalizada, quando a tabela é exibida, então o nome da categoria aparece como texto legível (não UUID).
- [x] CA-02: Dado uma busca por texto que inclui nome de categoria personalizada, quando o usuário digita o nome, então os resultados filtrados são exibidos corretamente.
- [x] CA-03: Dado um atleta com categoria que não existe nas customizadas nem no IBJJF, quando a categoria começa com "custom-", então "Categoria Personalizada" é exibido.
- [x] CA-04: Dado o PDF de resultados, quando categorias personalizadas são listadas, então os nomes legíveis são exibidos.
- [x] CA-05: Dado uma chave com categoria customizada no placar, quando o título é exibido, então o nome legível da categoria aparece em vez do UUID.
- [x] CA-06: Dado uma chave com campo `nome` preenchido, quando o título é exibido no placar, então o nome da chave é exibido diretamente.

---

## 10. Plano de Implementacao

```
Passo 1: Corrigir getCategoriaLabel em src/types/category.ts
  - O que fazer: Adicionar verificação `categoriaId.startsWith('custom-')` antes do fallback.
  - Arquivo(s): src/types/category.ts
  - Como validar: Testar com atleta de categoria custom.

Passo 2: Corrigir getCategoriaLabel em electron/pdf.ts
  - O que fazer: Aplicar mesma lógica de fallback.
  - Arquivo(s): electron/pdf.ts
  - Como validar: Gerar PDF com atleta de categoria custom.

Passo 3: Corrigir extrairPeso() em PlacarChaves.tsx e GerenciarChaves.tsx
  - O que fazer: Para categorias custom (startsWith 'custom-'), retornar getCategoriaLabel em vez do UUID.
  - Arquivo(s): PlacarChaves.tsx, GerenciarChaves.tsx
  - Como validar: Abrir placar com chave de categoria custom e verificar título legível.

Passo 4: Adicionar check chave.nome em PlacarChaves.tsx
  - O que fazer: Adicionar `if (chave.nome) return chave.nome;` no início de getChaveTitle.
  - Arquivo(s): PlacarChaves.tsx
  - Como validar: Criar chave manual com nome e verificar exibição no placar.

Passo 5: Corrigir dependências de useMemo
  - O que fazer: Adicionar `customizadas` aos arrays de dependência em AdminAthletes, GerenciarChaves e PlacarChaves.
  - Arquivo(s): AdminAthletes.tsx, GerenciarChaves.tsx, PlacarChaves.tsx
  - Como validar: Buscar por nome de categoria personalizada após navegação.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto.
- **Como monitorar:** Verificar exibição de categorias em todas as telas, especialmente no placar.
- **Plano de rollback:** Reverter as mudanças nos arquivos.

---

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado (lint sem novos erros)
- [x] Documentação atualizada
- [x] Sem warnings ou erros não tratados introduzidos
- [x] Seção Histórico de Correções atualizada em spec.md
