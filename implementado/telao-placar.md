# Feature: Telão - Segunda Janela do Placar

## 1. Contexto e Objetivo

- **O que é:** Funcionalidade para abrir uma segunda janela do Electron (telão) a partir das telas PlacarLuta e PlacarLutaCasada, exibindo o placar em formato banner horizontal (100% largura × 10% altura, sempre visível na parte inferior da tela, sem moldura).
- **Por que existe:** Necessidade de projetar o placar para o público em uma tela separada (projetor, TV, monitor externo) enquanto o operador controla o placar na tela principal.
- **Quem usa:** Operadores de área de luta em campeonatos de Jiu-Jitsu.
- **Escopo:** 
  - Processo principal (`electron/main.ts`): handlers IPC para criar janela, transmitir dados e fechar
  - Componentes React: `PlacarLuta.tsx`, `PlacarLutaCasada.tsx` (botão Telão)
  - Nova página: `PlacarExibicao.tsx` (renderização do telão)
  - Preload/IPC: novos canais de comunicação entre janelas

## 2. Análise dos Documentos de Referência

- **Guia de spec:** `doc/spec.md` — seguido conforme orientado
- **Documento de requisitos:** `doc/requisitos.md` — seção 3.19 (Placar) atualizada
- **Código-fonte relevante:** 
  - `electron/main.ts` (criação de janela, handlers IPC)
  - `electron/preload.ts` (canais IPC)
  - `src/pages/PlacarLuta.tsx` (botão Telão)
  - `src/pages/PlacarLutaCasada.tsx` (botão Telão)

## 3. História de Usuário

```
Como operador de área de luta,
quero abrir uma segunda janela (telão) com o placar da luta atual,
para que o público possa acompanhar o placar em uma tela separada.
```

**Cenários alternativos:**
- Operador abre o telão e continua alterando o placar na janela principal → telão atualiza em tempo real
- Operador fecha o telão via botão "Fechar Telão" → janela secundária é fechada
- Operador navega para outra luta → telão mantém exibindo a última luta (pode reabrir para nova luta)

## 4. Requisitos Funcionais

- [x] RF-01: Botão "Telão" na PlacarLuta e PlacarLutaCasada abre segunda janela do Electron
- [x] RF-02: Segunda janela exibe placar em formato banner horizontal (100%×10%, alwaysOnTop, sem moldura)
- [x] RF-03: Telão atualiza em tempo real quando o placar é alterado na janela principal
- [x] RF-04: Botão "Fechar Telão" fecha a segunda janela
- [x] RF-05: Telão exibe dados de cada atleta: nome + colunas [Total, Vantagem, Punição] com label acima e valor abaixo
- [x] RF-06: Telão exibe cronômetro com cores dinâmicas (verde=rodando, vermelho=esgotado, branco=pausado)
- [x] RF-07: Layout horizontal: lado B (branco) à esquerda, cronômetro ao centro, lado A (azul) à direita. V e P condicionais (só aparecem quando > 0)

## 5. Requisitos Não-Funcionais

- **Performance:** Atualização em tempo real via IPC (sem polling)
- **Segurança:** Janela secundária usa o mesmo preload script da janela principal
- **Compatibilidade:** Funciona em Windows (plataforma alvo do Electron)
- **Acessibilidade:** Fontes grandes e cores contrastantes para visibilidade em projeção

## 6. Análise da Aplicação

- **Arquitetura:** Electron (main + renderer) com React/Vite frontend
- **Padrão:** IPC bridge via preload script, janela única maximizada (agora suporta segunda janela em formato banner)
- **Janela telão:** Largura 100% da tela, altura 10%, posicionada na parte inferior, `alwaysOnTop: true`, `frame: false`, sem botões de janela
- **Fluxo de dados:** Janela principal → IPC `enviar-dados-placar-telao` → Processo principal → IPC `atualizar-placar-telao` → Janela secundária

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/main.ts` | Modificar | Handlers IPC + função `createTelaoWindow` |
| `electron/preload.ts` | Modificar | Novos canais IPC expostos ao renderer |
| `src/types/electron.d.ts` | Modificar | Tipos dos novos métodos IPC |
| `src/pages/PlacarExibicao.tsx` | Criar | Página de exibição do telão |
| `src/pages/PlacarLuta.tsx` | Modificar | Botão Telão + envio de dados em tempo real |
| `src/pages/PlacarLutaCasada.tsx` | Modificar | Botão Telão + envio de dados em tempo real |
| `src/App.tsx` | Modificar | Nova rota `/admin/telao/:lutaId` |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum — a feature é pontual e não afeta funcionalidades existentes

### 8.2 Ambiguidades nos Requisitos
- Nenhuma

### 8.3 Riscos
- Baixo — a feature usa o padrão IPC já estabelecido no projeto

## 9. Critérios de Aceite

- [x] CA-01: dado que o operador está na PlacarLuta, quando clica no botão "Telão", então uma segunda janela é aberta em formato banner horizontal na parte inferior com placar + cronômetro
- [x] CA-02: dado que o telão está aberto, quando o operador altera o placar na janela principal, então o telão atualiza em tempo real
- [x] CA-03: dado que o telão está aberto, quando o operador clica em "Fechar Telão", então a segunda janela é fechada
- [x] CA-04: dado que o operador está na PlacarLutaCasada, quando clica no botão "Telão", então o telão exibe "Luta Casada" como título
- [x] CA-05: dado que o telão está aberto, quando o cronômetro está rodando, então o tempo é exibido em verde; quando pausado, em branco; quando esgotado, em vermelho

## 10. Plano de Implementação

```
Passo 1: Criar handlers IPC no processo principal
  - O que fazer: Adicionar handlers `abrir-telao`, `enviar-dados-placar-telao`, `fechar-telao` em `electron/main.ts` + função `createTelaoWindow`
  - Arquivo(s): `electron/main.ts`
  - Como validar: Verificar que a janela é criada corretamente e dados são transmitidos

Passo 2: Atualizar preload.ts com novos canais
  - O que fazer: Adicionar `abrirTelao`, `enviarDadosPlacarTelao`, `fecharTelao`, `onAtualizarPlacarTelao` no `contextBridge`
  - Arquivo(s): `electron/preload.ts`
  - Como validar: Verificar que os métodos estão disponíveis em `window.electronAPI`

Passo 3: Atualizar tipos TypeScript
  - O que fazer: Adicionar assinaturas dos novos métodos em `src/types/electron.d.ts`
  - Arquivo(s): `src/types/electron.d.ts`
  - Como validar: `npx tsc --noEmit` sem erros novos

Passo 4: Criar página PlacarExibicao.tsx
  - O que fazer: Criar componente React que recebe dados via IPC e renderiza o telão
  - Arquivo(s): `src/pages/PlacarExibicao.tsx`
  - Como validar: Página renderiza corretamente com dados mockados

Passo 5: Adicionar botão Telão na PlacarLuta.tsx
  - O que fazer: Adicionar botão "Telão"/"Fechar Telão" + lógica de envio de dados em tempo real
  - Arquivo(s): `src/pages/PlacarLuta.tsx`
  - Como validar: Botão abre/fecha telão, dados são enviados ao alterar placar

Passo 6: Adicionar botão Telão na PlacarLutaCasada.tsx
  - O que fazer: Mesmo fluxo da PlacarLuta
  - Arquivo(s): `src/pages/PlacarLutaCasada.tsx`
  - Como validar: Botão abre/fecha telão, dados são enviados ao alterar placar

Passo 7: Adicionar rota no App.tsx
  - O que fazer: Adicionar rota `/admin/telao/:lutaId` para `PlacarExibicao`
  - Arquivo(s): `src/App.tsx`
  - Como validar: Rota funciona corretamente
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto — feature aditiva sem mudança de interface existente
- **Como monitorar:** Teste manual: abrir telão, alterar placar, verificar atualização em tempo real
- **Plano de rollback:** Remover botão Telão e handlers IPC se causar comportamento inesperado

## 12. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados (verificação por inspeção de código)
- [x] Código revisado
- [x] Documentação atualizada (spec.md, requisitos.md)
- [x] Sem warnings ou erros não tratados introduzidos (apenas erro pré-existente em brackets.ts)
- [x] Seção Histórico de Correções atualizada em spec.md

## 13. Correções (2026-06-30)

### Correção: Pontuação total muito grande no telão
- **Problema:** Fonte do placar total usava `clamp(52px, 7vw, 110px)`, excessiva para banner de 10% da altura.
- **Solução:** Fonte reduzida para `clamp(28px, 3.5vw, 64px)`. Adicionado label "Total" acima do valor (padrão label-acima/valor-abixo).

### Correção: Vantagem e punição não renderizavam condicionalmente
- **Problema:** Telão exibia apenas Nome + Total, sem vantagens nem punições.
- **Solução:** Adicionada componente `ColunaPlacar` reutilizável. Colunas Vant/Pun renderizadas condicionalmente (`{placar.vantagens > 0 && ...}`) com label acima e valor abaixo. Fonte do nome reduzida para `clamp(14px, 1.4vw, 24px)` para acomodar as colunas extras.

### Correção: Cores no telão (tempo=branco, vantagem=verde, punição=vermelho)
- **Problema:** Cronômetro mudava de cor dinamicamente. Vantagens e punições usavam cor do tema.
- **Solução:** `corCronometro` fixada como `'#ffffff'`. `ColunaPlacar` usa cores dedicadas: `#22c55e` (verde) para Vant, `#fa5252` (vermelho) para Pun, tanto no label quanto no valor.

### Correção: Equipe e faixa abaixo do nome no telão
- **Problema:** Telão exibia apenas o nome do atleta, sem equipe nem faixa.
- **Solução:** Adicionadas props `equipe` e `faixa` ao `LadoAtleta`. Equipe exibida abaixo do nome com `textTransform: capitalize` e cor secundária. Faixa exibida como `Badge` colorido usando `FAIXA_COLORS`.
