# Validacao: Vitoria por Pontos com Verificacao de Placar

## 1. Contexto e Objetivo

- **O que e:** Validacao ao registrar resultado do tipo "Vitoria por pontos" para garantir que o atleta selecionado como vencedor realmente possui mais pontos (ou mais vantagens em caso de empate) no placar, exibindo um aviso vermelho caso contrario.

- **Por que existe:** Quando o tempo de luta esgota, a vitoria e majoritariamente por pontos. Operadores podem selecionar o atleta errado como vencedor por engano. O sistema deve alertar antes de confirmar para evitar erros de registro.

- **Quem usa:** Operadores do placar (administradores do torneio) usando a tela `PlacarLuta`.

- **Escopo:** Dentro: validacao no frontend (`PlacarLuta.tsx`) no momento da finalizacao com tipo "pontos", exibicao de modal de aviso. Fora: alteracao no backend, alteracao em outros tipos de resultado (finalizacao, desclassificacao, desempate).

---

## 2. Analise dos Documentos de Referencia

- **Guia de spec** (`doc/spec.md`): este documento segue todas as secoes.
- **Documento de requisitos** (`doc/spec.md` secao ## Feature): descreve a necessidade de validar vencedor por pontos e exibir aviso.
- **Codigo-fonte relevante:**
  - `src/pages/PlacarLuta.tsx` — fluxo de finalizacao com modais, estado `resultadoTipo` e `vencedorFinal`
  - `src/types/bracket.ts` — interface `PlacarLuta` com `total` e `vantagens`

---

## 3. Historia de Usuario

```
Como operador do placar,
quero que o sistema valide se o atleta selecionado como vencedor por pontos
realmente tem mais pontos/vantagens no placar,
para evitar erros de registro ao finalizar a luta.
```

Cenarios alternativos:
- Vencedor valido (tem mais pontos): fluxo normal, sem aviso.
- Vencedor valido por vantagens (empate nos pontos, mas mais vantagens): fluxo normal, sem aviso.
- Vencedor invalido (menos pontos): exibe aviso vermelho, operador pode continuar ou voltar.
- Tipo de resultado nao e "pontos": validacao nao e acionada.

---

## 4. Requisitos Funcionais

- [ ] RF-01: Ao clicar "Confirmar" no modal de finalizacao com `resultadoTipo === 'pontos'`, o sistema deve verificar se o `vencedorFinal` possui `placar.total` maior que o oponente.
- [ ] RF-02: Se `placar.total` for igual, o sistema deve usar `vantagens` como criterio de desempate — o atleta com mais `vantagens` e considerado vencedor valido.
- [ ] RF-03: Se a verificacao falhar (vencedor invalido), o sistema deve exibir um modal de aviso em vermelho perguntando "Tem certeza que este e o campeao?".
- [ ] RF-04: O modal de aviso deve ter duas opcoes: "Voltar" (retorna ao modal anterior para corrigir) e "Confirmar mesmo assim" (prossegue com o registro).
- [ ] RF-05: Se a verificacao passar (vencedor valido), o fluxo normal de confirmacao deve prosseguir sem interrupcao.
- [ ] RF-06: Para `resultadoTipo` diferente de `'pontos'`, a validacao nao deve ser acionada.

---

## 5. Requisitos Nao-Funcionais

- **Performance:** impacto negligivel — apenas comparacao de numeros.
- **Seguranca:** nenhuma alteracao relevante.
- **Compatibilidade:** nenhuma alteracao de API ou contrato.
- **Observabilidade:** apenas log de erro existente mantido.

---

## 6. Analise da Aplicacao

### Arquitetura geral
- **Frontend:** React + Mantine UI, renderer process do Electron
- **Backend:** Electron main process com handlers IPC
- **Persistencia:** JSON em disco
- **Comunicacao:** IPC (`contextBridge` expoe `window.electronAPI`)

### Fluxo de dados do registro de resultado (trecho relevante)
1. Usuario abre modal "Finalizar Luta" (`handleAbrirFinalizar`)
2. Usuario seleciona tipo de resultado e vencedor
3. Usuario clica "Confirmar" (`handleConfirmarFinalizar`) — **AQUI deve ser inserida a validacao**
4. Modal de confirmacao aparece (`confirmarResultadoOpened`)
5. Usuario confirma (`handleConfirmarResultado` → `persistirResultado`)

### Contratos de API
Nenhuma alteracao nos contratos IPC existentes.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/pages/PlacarLuta.tsx` | Modificar | Adicionar validacao em `handleConfirmarFinalizar` e modal de aviso quando vencedor por pontos for invalido |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum identificado. A mudanca e localizada a um unico arquivo.

### 8.2 Ambiguidades nos Requisitos
- O que acontece se o usuario insiste em confirmar mesmo com o aviso? Resolvido: o sistema deve permitir, pois o operador pode estar corrigindo um erro no placar ou ter uma interpretacao diferente.
- E se `placarA.total === placarB.total` e `vantagens` tambem sao iguais? Nesse caso, o `handleAbrirFinalizar` ja define automaticamente `resultadoTipo` como `'desempate'`, entao a validacao de pontos nao sera acionada.

### 8.3 Riscos
- Baixo. Mudanca puramente frontend, sem alteracao de contratos.

---

## 9. Criterios de Aceite

- [ ] CA-01: Dado `resultadoTipo === 'pontos'` com `vencedorFinal` tendo `placar.total` maior que o oponente, quando o usuario clica "Confirmar", entao o modal de confirmacao padrao aparece sem aviso.
- [ ] CA-02: Dado `resultadoTipo === 'pontos'` com empate no `placar.total` e `vencedorFinal` tendo mais `vantagens`, quando o usuario clica "Confirmar", entao o modal de confirmacao padrao aparece sem aviso.
- [ ] CA-03: Dado `resultadoTipo === 'pontos'` com `vencedorFinal` tendo `placar.total` menor que o oponente, quando o usuario clica "Confirmar", entao um modal de aviso vermelho e exibido com a mensagem "Tem certeza que este e o campeao?" e opcoes "Voltar" e "Confirmar mesmo assim".
- [ ] CA-04: Dado o aviso do CA-03, quando o usuario clica "Voltar", entao o modal de aviso fecha e o modal de selecao anterior e reaberto.
- [ ] CA-05: Dado o aviso do CA-03, quando o usuario clica "Confirmar mesmo assim", entao o registro prossegue normalmente (modal de confirmacao aparece).
- [ ] CA-06: Dado `resultadoTipo` diferente de `'pontos'` (finalizacao, desclassificacao, desempate), quando o usuario clica "Confirmar", entao a validacao nao e acionada.

---

## 10. Plano de Implementacao (Passo a Passo)

```
Passo 1: Adicionar estado para o modal de aviso de pontos
  - O que fazer: Adicionar `useDisclosure` para `avisoPontosOpened` e estado `confirmouAvisoPontos` (boolean)
  - Arquivo(s): `src/pages/PlacarLuta.tsx`
  - Como validar: Estado existe e pode ser manipulado

Passo 2: Implementar logica de validacao em handleConfirmarFinalizar
  - O que fazer: No inicio de `handleConfirmarFinalizar`, se `resultadoTipo === 'pontos'`:
    (a) Determinar `vencedorPlacar` e `perdedorPlacar` baseado em `vencedorFinal`
    (b) Verificar se `vencedorPlacar.total > perdedorPlacar.total` OU
        (`vencedorPlacar.total === perdedorPlacar.total && vencedorPlacar.vantagens >= perdedorPlacar.vantagens`)
    (c) Se falhar E `confirmouAvisoPontos` for false: abrir modal de aviso e retornar sem prosseguir
    (d) Se passar OU `confirmouAvisoPontos` for true: prosseguir normalmente
  - Arquivo(s): `src/pages/PlacarLuta.tsx`
  - Como validar: Testar com diferentes cenarios de placar

Passo 3: Adicionar modal de aviso vermelho
  - O que fazer: Adicionar um terceiro Modal similar ao `confirmarResultadoOpened` com:
    - Titulo: "Atencao"
    - Cor vermelha
    - Mensagem: "O atleta selecionado nao esta vencendo no placar. Tem certeza que este e o campeao?"
    - Botoes: "Voltar" (fecha aviso, abre modal anterior) e "Confirmar mesmo assim" (fecha aviso, segue para confirmacao)
  - Arquivo(s): `src/pages/PlacarLuta.tsx`
  - Como validar: Modal aparece nas condicoes corretas

Passo 4: Limpar estado confirmouAvisoPontos ao reabrir modal de finalizacao
  - O que fazer: Em `handleAbrirFinalizar`, resetar `confirmouAvisoPontos` para false
  - Arquivo(s): `src/pages/PlacarLuta.tsx`
  - Como validar: Ao reabrir o modal, o aviso pode ser exibido novamente se necessario

Passo 5: Rodar lint e build para verificar consistencia
  - O que fazer: Executar `npm run lint` e `npm run build`
  - Como validar: Sem erros nem warnings
```

---

## 11. Rollout e Observabilidade

- **Estrategia de entrega:** Deploy direto (feature retroativamente compativel).
- **Como monitorar:** N/A — funcionalidade local sem metrica externa.
- **Plano de rollback:** Reverter commits.

---

## 12. Definicao de Pronto (DoD)

- [ ] Todos os criterios de aceite foram verificados manualmente
- [ ] Codigo revisado (auto-revisao documentada)
- [ ] Documentacao atualizada (este documento)
- [ ] Sem warnings ou erros no build (`npm run build`)
- [ ] Sem erros de lint (`npm run lint`)

---

## Checklist Rapido Antes de Comecar a Codar

- [x] Li os documentos de referencia (`doc/spec.md`, `src/pages/PlacarLuta.tsx`, `src/types/bracket.ts`)
- [x] Entendi a historia de usuario e o objetivo de negocio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Liste os problemas e impedimentos
- [x] O plano de implementacao esta em ordem logica
- [x] Os criterios de aceite sao verificaaveis
- [x] Sinalizei todas as incertezas explicitamente
