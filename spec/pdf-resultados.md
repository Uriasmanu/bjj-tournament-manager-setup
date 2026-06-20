# spec/pdf-resultados.md — Export em PDF de Resultados (com Tabelas e Páginas Separadas)

## 1. Contexto e Objetivo

- **O que é:** Funcionalidade de gerar um PDF consolidado com todos os resultados do torneio a partir da tela de Resultados, com formato de tabela profissional e cada seção em página separada.
- **Por que existe:** Organizadores precisam de um documento impresso com os resultados finais (medalhistas, equipes, árbitros, atletas) para distribuição física no pódio ou arquivo. O PDF anterior era muito simples, sem tabelas e tudo numa única página.
- **Quem usa:** Administrador do torneio.
- **Escopo:** A geração do PDF a partir da tela de Resultados, com 4 seções em páginas separadas: Medalhistas, Ranking de Equipes, Árbitros, Atletas.

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): confirmado.
- **Documento de requisitos** requisitos.md: seção 3.23 (Resultados) descreve a tela com 6 abas.
- **Documentação técnica existente:** `spec/pdf-resultados.md` (versão anterior sem tabelas).
- **Código-fonte relevante:** `src/utils/pdfGenerator.ts` (funções `gerarPdfLutasCasadas`, `gerarPdfChaves`, `gerarPdfResultados`), `src/pages/Resultados.tsx`.

## 3. Historia de Usuario

```
Como administrador do torneio,
quero gerar um PDF com todos os resultados consolidados em formato de tabela,
para que eu possa imprimir e distribuir os resultados no pódio de forma profissional.
```

Cenários alternativos:
- Usuário clica em "Gerar PDF" sem chaves encerradas → PDF é gerado com seção de medalhistas vazia.
- Torneio sem nome → usa "Torneio {data}".
- Nenhum árbitro cadastrado → seção de árbitros exibe "Nenhum árbitro cadastrado".

## 4. Requisitos Funcionais

- [x] RF-01: A tela de Resultados exibe um botão "Gerar PDF Resultados" na aba "Visão Geral".
- [x] RF-02: O PDF gerado contém 4 seções: Medalhistas, Ranking de Equipes, Árbitros, Atletas — cada uma em página separada.
- [x] RF-03: O nome do arquivo PDF segue o padrão `resultados-{nome-torneio}.pdf`.
- [x] RF-04: Medalhistas são exibidos em tabela com colunas: Categoria, Atletas (qtd), Ouro, Prata, Bronze.
- [x] RF-05: Ranking de equipes é uma tabela com colunas: #, Equipe, Atletas, Ouro, Prata, Bronze — ordenada por ouro (desc), prata (desc), bronze (desc).
- [x] RF-06: Tabela de árbitros com colunas: #, Árbitro, Faixa, Equipe, Lutas (total de chaves atribuídas).
- [x] RF-07: Tabela de atletas com colunas: #, Atleta, Equipe, Faixa, Peso, Categoria, Chave — ordenada alfabeticamente.
- [x] RF-08: Cada seção (Medalhistas, Ranking, Árbitros, Atletas) inicia em nova página via `pageBreak: 'before'`.
- [x] RF-09: A primeira seção (Medalhistas) não possui pageBreak (inicia na primeira página).
- [x] RF-10: Seção de medalhistas exibe medalha 🥇/🥈/🥉 para cada chave encerrada.

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
| `src/utils/pdfGenerator.ts` | Modificar | Reescrever `gerarPdfResultados` com tabelas e pageBreaks |
| `src/pages/Resultados.tsx` | Modificar | Botão "Gerar PDF Resultados" na aba Visão Geral |

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum identificado. pdfmake suporta `pageBreak: 'before'` nativamente.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O escopo é claro: PDF consolidado com tabelas e páginas separadas.

### 8.3 Riscos
- PDFs grandes podem demorar em máquinas lentas → mitigado pelo limite de 200 atletas.

## 9. Criterios de Aceite

- [x] CA-01: dado que existem chaves encerradas, quando o usuário clica em "Gerar PDF Resultados", então um PDF é baixado com seção de medalhistas em tabela.
- [x] CA-02: dado que não existem chaves encerradas, quando o usuário clica em "Gerar PDF Resultados", então um PDF é baixado com seção de medalhistas vazia ("Nenhuma chave encerrada").
- [x] CA-03: dado que o torneio tem nome "Copa GRACIE", quando o PDF é gerado, então o nome do arquivo é `resultados-copa-gracie.pdf`.
- [x] CA-04: dado que o PDF é gerado, então cada seção (Medalhistas, Ranking, Árbitros, Atletas) inicia em página separada.
- [x] CA-05: dado que existem equipes com medalhas, quando o PDF é gerado, então o ranking de equipes é uma tabela ordenada por ouro/prata/bronze.

## 10. Plano de Implementacao

```
Passo 1: Reescrever gerarPdfResultados em pdfGenerator.ts
  - O que fazer: Reescrever a função com 4 seções em tabela: Medalhistas (Categoria, Atletas, Ouro, Prata, Bronze), Ranking (#, Equipe, Atletas, Ouro, Prata, Bronze), Árbitros (#, Arbitro, Faixa, Equipe, Lutas), Atletas (#, Atleta, Equipe, Faixa, Peso, Categoria, Chave). Adicionar pageBreak: 'before' nas seções 2, 3 e 4.
  - Arquivo(s): src/utils/pdfGenerator.ts
  - Como validar: Gerar PDF e verificar que cada seção está em página separada com formato de tabela.

Passo 2: Verificar botão na tela de Resultados
  - O que fazer: Confirmar que o botão "Gerar PDF Resultados" já existe na aba "Visão Geral" e chama a função atualizada.
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: Clicar no botão e verificar se o PDF é gerado com tabelas e páginas separadas.
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (feature existente, sem risco).
- **Como monitorar:** Verificar se o botão aparece na tela de Resultados e se o PDF gerado tem tabelas e páginas separadas.
- **Plano de rollback:** Reverter para versão anterior da função.

## 12. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado
- [x] Sem warnings ou erros não tratados introduzidos
