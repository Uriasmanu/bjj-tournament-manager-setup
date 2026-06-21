# Spec: Categorias Apenas Adulto

## RF
- RF1: Gerar apenas categorias da faixa etária Adulto
- RF2: Manter 16 categorias: 9 masculino + 7 feminino
- RF3: Excluir Super-Pesado e Pesadíssimo femininos
- RF4: Pesado feminino deve ter limite `null` (sem limite superior)

## CA
- CA1: `gerarCategorias()` itera apenas sobre `['adulto']` em vez de 15 faixas etárias
- CA2: `getPesoLimite()` retorna `undefined` para Super-Pesado e Pesadíssimo femininos (excluídos)
- CA3: Removida variável `kidsLabel` não utilizada
- CA4: `FAIXA_ETARIA_LABELS` e `COR_FAIXA_OPTIONS` removidos (não utilizados)

## Passos
1. Alterar `faixasEtarias` de array com 15 valores para `['adulto']`
2. Atualizar `getPesoLimite()` para retornar `undefined` para combos femininos excluídos
3. Remover `kidsLabel` não utilizado
4. Remover exports não utilizados `FAIXA_ETARIA_LABELS` e `COR_FAIXA_OPTIONS`
5. Verificar que `classificarCategoria` funciona corretamente com 16 categorias

## Arquivos
- `src/types/category.ts` — função `gerarCategorias()` e `getPesoLimite()` modificadas
