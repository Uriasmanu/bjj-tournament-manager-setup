# Spec: Gerar PDF das Lutas Casadas e das Chaves

## 1. Contexto e Objetivo

- **O que é:** Geração de PDFs para lutas casadas e chaves de luta do torneio
- **Por que existe:** Organizadores e árbitros precisam de documentos impressos para acompanhamento do torneio
- **Quem usa:** Organizadores do torneio, árbitros, equipes
- **Escopo:** Botão de gerar PDF na tela de resultados e na tela de gerenciar chaves

## 2. Historia de Usuario

```
Como organizador do torneio,
quero gerar PDFs das lutas casadas e das chaves de luta,
para que eu possa imprimir e usar como referência durante o torneio.
```

## 3. Requisitos Funcionais

- [ ] RF-01: O sistema deve permitir gerar um PDF com todas as lutas casadas do torneio
- [ ] RF-02: O sistema deve permitir gerar um PDF com todas as chaves de luta do torneio
- [ ] RF-03: O PDF das chaves deve mostrar a chave completa, incluindo rodadas futuras (cards de progressão)
- [ ] RF-04: O layout das chaves deve ser vertical, com progressão da esquerda para a direita
- [ ] RF-05: Cada chave deve mostrar: nome da categoria, atletas, rodadas e resultados (quando disponíveis)

## 4. Criterios de Aceite

- [ ] CA-01: Dado que o torneio possui lutas casadas, quando o usuário clica em "Gerar PDF Lutas Casadas", então um PDF é baixado com todas as lutas listadas
- [ ] CA-02: Dado que o torneio possui chaves, quando o usuário clica em "Gerar PDF Chaves", então um PDF é baixado com todas as chaves em formato de bracket vertical
- [ ] CA-03: O PDF das chaves mostra rodadas futuras mesmo sem resultados preenchidos (cards vazios para progressão)

## 5. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/pages/Resultados.tsx` | Modificar | Adicionar botão de gerar PDF |
| `src/pages/GerenciarChaves.tsx` | Modificar | Adicionar botão de gerar PDF |
| `src/utils/pdfGenerator.ts` | Criar | Lógica de geração de PDF |

## 6. Plano de Implementacao

```
Passo 1: Criar utilitário de geração de PDF
  - O que fazer: Criar src/utils/pdfGenerator.ts com funções para gerar PDF de lutas casadas e chaves
  - Arquivo(s): src/utils/pdfGenerator.ts
  - Como validar: Chamar as funções e verificar se o PDF é gerado corretamente

Passo 2: Adicionar botão na tela de Resultados
  - O que fazer: Adicionar botão "Gerar PDF" que gera PDF com lutas casadas
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: Clicar no botão e verificar se o PDF é baixado

Passo 3: Adicionar botão na tela de Gerenciar Chaves
  - O que fazer: Adicionar botão "Gerar PDF" que gera PDF com chaves em formato bracket
  - Arquivo(s): src/pages/GerenciarChaves.tsx
  - Como validar: Clicar no botão e verificar se o PDF é baixado com bracket vertical
```
