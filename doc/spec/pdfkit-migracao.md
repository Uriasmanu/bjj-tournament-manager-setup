# Spec: Migração de PDF para PDFKit

## RF
- RF1: PDFs devem ser gerados com cores, cabeçalhos e formatação visual
- RF2: PDF de chaves deve exibir bracket desenhado com cards, linhas de conexão e destaque para vencedores
- RF3: PDF de resultados deve ter 4 seções em páginas separadas (Medalhistas, Ranking, Árbitros, Atletas)
- RF4: PDF de lutas casadas mantém formato funcional com cards coloridos
- RF5: Nomes de categorias customizadas devem ser resolvidos (não exibir UUIDs)
- RF6: Download do PDF funciona via download Blob no renderer (sem IPC)

## CA
- CA1: `pdfmake` e `@types/pdfmake` foram removidos do `package.json`
- CA2: `pdfkit` e `@types/pdfkit` foram instalados como dependências
- CA3: Funções `gerarPdfResultados`, `gerarPdfChaves`, `gerarPdfLutasCasadas` foram reescritas com PDFKit
- CA4: Função `chunksToBlob` converte streams do PDFKit em Blob para download
- CA5: Função `getCategoriaLabel` recebe parâmetro `customizadas` para resolver categorias customizadas
- CA6: Função `drawBracket` desenha bracket com retângulos arredondados, linhas de conexão e badge de placar
- CA7: Todos os chamadores em `Resultados.tsx`, `GerenciarChaves.tsx` e `AdminLutasCasadas.tsx` passam `customizadas`

## Passos
1. Substituir pdfmake por pdfkit em package.json
2. Reescrever `src/utils/pdfGenerator.ts` com primitivas de desenho vetorial
3. Implementar `drawBracket` com retângulos arredondados, linhas e badges
4. Implementar `drawTableHeader` e `drawTableRow` com cores
5. Adicionar `chunksToBlob` para converter streams em Blob
6. Atualizar chamadores para passar `customizadas`
7. Adicionar parâmetro `customizadas` em `gerarPdfLutasCasadas`
8. Verificar compilação TypeScript

## Arquivos
- `src/utils/pdfGenerator.ts` — reescrito completamente
- `src/pages/Resultados.tsx` — 3 chamadas atualizadas
- `src/pages/GerenciarChaves.tsx` — 1 chamada atualizada
- `src/pages/AdminLutasCasadas.tsx` — carrega customizadas e passa para PDF
- `package.json` — pdfmake removido, pdfkit + @types/pdfkit adicionados
