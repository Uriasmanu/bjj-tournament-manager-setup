# Escolher Categoria Livre ao Editar Atleta

## 1. Contexto e Objetivo

- **O que é:** Ao editar um atleta, o Select de categoria deve exibir todas as categorias IBJJF do gênero selecionado, sem filtrar por idade ou faixa.
- **Por que existe:** O administrador precisa poder corrigir ou atribuir manualmente a categoria de um atleta, sem ser limitado pela classificação automática baseada em idade/faixa.
- **Quem usa:** Administrador do torneio, ao editar atletas existentes.
- **Escopo:** Apenas o modo edição do formulário `AthleteForm`. A criação de novos atletas mantém o filtro atual.

## 2. Documentos de Referência

- `doc/spec.md` — guia de spec
- `doc/requisitos.md` — seção 3.8 (Atletas)
- `src/components/AthleteForm.tsx` — componente do formulário
- `src/types/category.ts` — definição de `CATEGORIAS_IBJJF`

## 3. História de Usuário

```
Como administrador do torneio,
quero escolher livremente a categoria ao editar um atleta,
para que eu possa corrigir ou atribuir manualmente a categoria adequada.
```

Cenário alternativo: ao criar um novo atleta, o comportamento atual (filtro por gênero, idade e faixa) permanece inalterado.

## 4. Requisitos Funcionais

- [ ] RF-01: Ao editar um atleta, o Select de categoria exibe todas as categorias IBJJF do gênero selecionado (sem filtro de idade/faixa).
- [ ] RF-02: Ao criar um novo atleta, o filtro atual (gênero + idade + faixa) continua funcionando normalmente.
- [ ] RF-03: O agrupamento das categorias continua sendo feito por prefixo do label (ex: "Adulto", "Master1").
- [ ] RF-04: A validação de campo obrigatório continua funcionando (categoria não pode ser vazia).

## 5. Requisitos Nao-Funcionais

- **Performance:** Sem mudança significativa.
- **UX:** O comportamento de criação não muda para o usuário.

## 6. Analise da Aplicação

- **Arquitetura:** Frontend React (Vite + Mantine). Componente `AthleteForm.tsx` é um modal controlado.
- **Padrões:** `useMemo` para opciones filtradas, `useForm` do Mantine para state management.
- **Fluxo:** `categoriasFiltradas()` retorna as opções baseadas nos filtros → `agruparCategorias()` agrupa para exibição → `<Select>` renderiza.

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/AthleteForm.tsx` | Modificar | Adicionar lógica de filtro condicional (edição vs criação) |

## 8. Problemas e Impedimentos

- Nenhum impedimento bloqueante identificado.

## 9. Criterios de Aceite

- [ ] CA-01: Dado um atleta existente, quando o formulário de edição é aberto, o Select de categoria lista todas as categorias do gênero do atleta (sem filtro de idade/faixa).
- [ ] CA-02: Dado um novo atleta, quando o formulário de criação é aberto, o Select de categoria filtra por gênero + idade + faixa (comportamento atual preservado).
- [ ] CA-03: Ao trocar o gênero no formulário de edição, as opções de categoria são atualizadas para o novo gênero.
- [ ] CA-04: A categoria pré-selecionada no modo edição continua sendo exibida corretamente.

## 10. Plano de Implementacao

```
Passo 1: Modificar categoriasFiltradas() ou adicionar nova função
  - O que fazer: Criar uma variante que filtra apenas por gênero (sem idade/faixa) para uso no modo edição.
  - Arquivo(s): `src/components/AthleteForm.tsx`
  - Como validar: Verificar que o Select mostra ~15 categorias do gênero ao editar.

Passo 2: Passar prop de modo (edição/criação) para o componente
  - O que fazer: Usar a presença de `athlete` para determinar se está em modo edição e usar o filtro correto.
  - Arquivo(s): `src/components/AthleteForm.tsx`
  - Como validar: Testar criação (filtro completo) e edição (filtro só por gênero).
```

## 11. Rollout e Observabilidade

- **Estratégia:** Deploy direto (feature interna).
- **Monitorar:** Teste manual do formulário em ambos os modos.

## 12. Definição de Pronto

- [ ] Todos os critérios de aceite verificados
- [ ] Código revisado
- [ ] Sem warnings ou erros
