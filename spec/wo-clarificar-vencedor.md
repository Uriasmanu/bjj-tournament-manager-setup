# Spec: Clarificar seleção de vencedor por WO no Placar

## 1. Contexto e Objetivo

- **O que é:** Melhoria na usabilidade do modal `RegistrarResultadoModal` para tornar claro quem VENCEU por WO (walkover).
- **Por que existe:** O comportamento atual exibe botões "WO {nome}" que geram confusão — o usuário não sabe se o botão significa que aquele atleta perdeu ou venceu por WO.
- **Quem usa:** Operadores de área (árbitros) que registram resultados de lutas no placar.
- **Escopo:** Apenas o componente `RegistrarResultadoModal.tsx` — alters nos labels dos botões de WO.

## 2. Analise dos Documentos de Referência

- **Guia de spec:** `doc/spec.md`
- **Documento de requisitos:** `doc/requisitos.md` (seção 3.19 Placar / Scoreboard)
- **Código-fonte relevante:** `src/components/RegistrarResultadoModal.tsx`, `src/pages/PlacarBracket.tsx`

## 3. Historia de Usuario

```
Como operador de área,
quero que os botões de WO indiquem claramente quem será o vencedor,
para que eu não confunda o atleta que perdeu com o que venceu por WO.
```

## 4. Requisitos Funcionais

- [ ] RF-01: Os botões de WO devem indicar explicitamente que o atleta é o VENCEDOR por WO
- [ ] RF-02: O texto do botão deve seguir o padrão "Vitória WO: {nome}" ou equivalente claro
- [ ] RF-03: A funcionalidade de seleção de vencedor por WO não deve ser alterada (apenas os labels)

## 5. Requisitos Nao-Funcionais

- **Usabilidade:** A mudança deve ser imediatamente perceptível sem necessidade de treinamento
- **Acessibilidade:** Botões devem manter contraste adequado (laranja sobre fundo claro)

## 6. Analise da Aplicacao

- **Arquitetura:** Componente React funcional (`RegistrarResultadoModal`) utilizado dentro de `PlacarBracket`
- **Padrões:** Mantine UI (Button, Modal, Radio, Group, Stack)
- **Fluxo de dados:** O modal recebe `luta`, `atletaANome`, `atletaBNome` e `onConfirm(vencedorId, status)`

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/RegistrarResultadoModal.tsx` | Modificar | Alterar labels dos botões WO |

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum identificado.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma.

### 8.3 Riscos
- Baixo risco — mudança cosmética nos labels.

## 9. Criterios de Aceite

- [ ] CA-01: dado que o modal está aberto com dois atletas, quando o usuário vê os botões de WO, então o texto indica claramente quem vence por WO
- [ ] CA-02: dado que o usuário clica em um botão de WO, então o atleta correspondente é definido como vencedor com status 'wo'
- [ ] CA-03: dado que o usuário seleciona um vencedor pelo Radio (sem WO), então o resultado é registrado como 'completed'

## 10. Plano de Implementacao

```
Passo 1: Alterar labels dos botões WO no RegistrarResultadoModal
  - O que fazer: Trocar "WO {nome}" por "Vitória WO: {nome}" (ou similar) nos dois botões
  - Arquivo(s): src/components/RegistrarResultadoModal.tsx
  - Como validar: Abrir o modal no PlacarBracket e verificar que os botões mostram texto claro
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (mudança de UI sem impacto em dados)
- **Como monitorar:** Verificar visualmente na tela de Placar
- **Plano de rollback:** Reverter a alteração de label

## 12. Definição de Pronto

- [ ] CA-01 verificado visualmente
- [ ] CA-02 verificado funcionalmente
- [ ] CA-03 verificado funcionalmente
- [ ] Código sem warnings ou erros
