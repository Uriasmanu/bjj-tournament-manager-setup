# spec/pdf-resultados.md — Export em PDF de Resultados

## 1. Contexto e Objetivo

- **O que é:** Funcionalidade de gerar um PDF consolidado com todos os resultados do torneio a partir da tela de Resultados.
- **Por que existe:** Organizadores precisam de um documento impresso com os resultados finais (medalhistas, equipes, árbitros, atletas) para distribuição física no pódio ou arquivo.
- **Quem usa:** Administrador do torneio.
- **Escopo:** Apenas a geração do PDF a partir da tela de Resultados. Não inclui exportação de resultados parciais por aba.

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): confirmado.
- **Documento de requisitos** requisitos.md: seção 3.23 (Resultados) descreve a tela com 6 abas.
- **Documentação técnica existente:** Nenhuma spec específica para PDF de resultados.
- **Código-fonte relevante:** `src/utils/pdfGenerator.ts` (funções existentes `gerarPdfLutasCasadas` e `gerarPdfChaves`), `src/pages/Resultados.tsx`.

## 3. Historia de Usuario

```
Como administrador do torneio,
quero gerar um PDF com todos os resultados consolidados,
para que eu possa imprimir e distribuir os resultados no pódio.
```

Cenários alternativos:
- Usuário clica em "Gerar PDF" sem chaves encerradas → PDF é gerado com seção de medalhistas vazia.
- Torneio sem nome → usa "Torneio {data}".

## 4. Requisitos Funcionais

- [ ] RF-01: A tela de Resultados exibe um botão "Gerar PDF Resultados" na aba "Visão Geral".
- [ ] RF-02: O PDF gerado contém as seguintes seções: cabeçalho (nome do torneio + data de geração), medalhistas por chave, ranking de equipes (ouro/prata/bronze), lista de árbitros com total de lutas, lista completa de atletas.
- [ ] RF-03: O nome do arquivo PDF segue o padrão `resultados-{nome-torneio}.pdf`.
- [ ] RF-04: Medalhistas são exibidos com 🥇/🥈/🥉 por chave encerrada, incluindo nome da categoria.
- [ ] RF-05: Ranking de equipes é uma tabela ordenada por ouro (desc), prata (desc), bronze (desc).
- [ ] RF-06: A tabela de atletas inclui: Nome, Equipe, Faixa, Peso, Categoria, Chave.

## 5. Requisitos Nao-Funcionais

- **Performance:** Geração do PDF deve completar em < 3 segundos para torneios com até 200 atletas.
- **Acessibilidade:** Botão "Gerar PDF" acessível via teclado, com aria-label descritivo.

## 6. Analise da Aplicação

- **Arquitetura:** Frontend React + pdfmake (já instalado).
- **Padrões existentes:** `gerarPdfLutasCasadas` e `gerarPdfChaves` em `src/utils/pdfGenerator.ts` usam pdfmake com `TDocumentDefinitions`.
- **Fluxo de dados:** Dados do torneio vêm de `torneio.json` via IPC `get-active-tournament`.

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/utils/pdfGenerator.ts` | Modificar | Adicionar função `gerarPdfResultados` |
| `src/pages/Resultados.tsx` | Modificar | Adicionar botão "Gerar PDF Resultados" e chamar nova função |

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum identificado. pdfmake já está configurado e funcionando.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O escopo é claro: PDF consolidado com todas as abas.

### 8.3 Riscos
- PDFs grandes podem demorar em máquinas lentas → mitigado pelo limite de 200 atletas.

## 9. Criterios de Aceite

- [ ] CA-01: dado que existem chaves encerradas, quando o usuário clica em "Gerar PDF Resultados", então um PDF é baixado com seção de medalhistas preenchida.
- [ ] CA-02: dado que não existem chaves encerradas, quando o usuário clica em "Gerar PDF Resultados", então um PDF é baixado com seção de medalhistas vazia ("Nenhuma chave encerrada").
- [ ] CA-03: dado que o torneio tem nome "Copa GRACIE", quando o PDF é gerado, então o nome do arquivo é `resultados-copa-gracie.pdf`.

## 10. Plano de Implementacao

```
Passo 1: Adicionar função gerarPdfResultados em pdfGenerator.ts
  - O que fazer: Criar função que recebe chaves, atletas, arbitros, medalhasPorEquipe, nomeTorneio e gera PDF consolidado.
  - Arquivo(s): src/utils/pdfGenerator.ts
  - Como validar: Chamar a função e verificar se o PDF é baixado corretamente.

Passo 2: Adicionar botão na tela de Resultados
  - O que fazer: Adicionar botão "Gerar PDF Resultados" na aba "Visão Geral" do componente Resultados.
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: Clicar no botão e verificar se o PDF é gerado com dados corretos.
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (feature existente, sem risco).
- **Como monitorar:** Verificar se o botão aparece na tela de Resultados.
- **Plano de rollback:** Remover botão e função.

## 12. Definição de Pronto

- [ ] Todos os critérios de aceite foram verificados
- [ ] Código revisado
- [ ] Sem warnings ou erros não tratados introduzidos
