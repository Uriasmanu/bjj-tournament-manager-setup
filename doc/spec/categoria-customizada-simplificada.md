# Spec: Categoria Customizada Simplificada

## RF
- RF1: Categoria customizada não deve pedir cor de faixa, gênero ou faixa etária
- RF2: Formulário deve exigir apenas: nome, peso min/max e tempo de luta
- RF3: Categorias customizadas devem aparecer corretamente em todos os selects de categoria

## CA
- CA1: Campos `faixaEtaria`, `genero` e `corFaixa` removidos da interface `CategoriaCustomizada`
- CA2: Campos removidos do formulário `CategoriaForm.tsx`
- CA3: Campos removidos da tabela `AdminCategorias.tsx`
- CA4: `categoriasPorGenero` e `categoriasFiltradas` em `AthleteForm.tsx` filtram apenas `CategoriaIBJJF` por gênero/faixa etária (customizadas sempre aparecem)
- CA5: Validação do formulário simplificada

## Passos
1. Remover `faixaEtaria`, `genero`, `corFaixa` da interface `CategoriaCustomizada` em `category.ts`
2. Remover campos do formulário `CategoriaForm.tsx`
3. Remover validação desses campos
4. Remover colunas da tabela `AdminCategorias.tsx`
5. Atualizar `categoriasPorGenero` para filtrar apenas categorias IBJJF por gênero
6. Atualizar `categoriasFiltradas` para filtrar apenas categorias IBJJF por faixa etária

## Arquivos
- `src/types/category.ts` — interface simplificada
- `src/components/CategoriaForm.tsx` — formulário simplificado
- `src/pages/AdminCategorias.tsx` — tabela simplificada
- `src/components/AthleteForm.tsx` — filtros de categoria atualizados
