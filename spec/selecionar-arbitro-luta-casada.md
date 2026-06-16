# Spec: Selecionar Árbitro ao Criar Luta Casada

## 1. Contexto e Objetivo

- **O que é:** Permitir que o administrador escolha qual árbitro da área será responsável por uma luta casada, quando a área possui múltiplos árbitros.
- **Por que existe:** O sistema anteriormente sempre atribuía o primeiro árbitro da área (`area.arbitroIds[0]`), sem permitir escolha.
- **Quem usa:** Administradores do sistema ao criar lutas casadas.
- **Escopo:** Apenas o modal de criação de luta casada (`ModalCriarLutaCasada`).

---

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): todas as seções serão preenchidas
- **Documento de requisitos** `requisitos.md`: seção relativa a lutas casadas
- **Código-fonte relevante**: `src/components/ModalCriarLutaCasada.tsx`, `src/types/area.ts`, `src/types/referee.ts`

---

## 3. Historia de Usuario

```
Como administrador,
quero escolher qual árbitro da área será responsável pela luta casada,
para que eu possa atribuir o árbitro mais adequado para cada luta.
```

**Cenários alternativos:**
- Área com apenas 1 árbitro → seleção continua automática (sem dropdown)
- Área sem árbitros → alerta de que é necessário cadastrar árbitro

---

## 4. Requisitos Funcionais

- [x] RF-01: Quando a área possui mais de 1 árbitro, o modal deve exibir um `Select` para escolher o árbitro.
- [x] RF-02: Quando a área possui apenas 1 árbitro, a seleção continua automática (sem dropdown).
- [x] RF-03: O árbitro selecionado deve ser usado ao criar a luta casada.

---

## 5. Requisitos Nao-Funcionais

- **Performance:** sem impacto significativo
- **Segurança:** sem mudanças
- **Acessibilidade:** componente `Select` do Mantine é acessível por padrão

---

## 6. Analise da Aplicacao

- **Arquitetura geral:** Modal de criação recebe `area`, `atletas` e `arbitros` como props.
- **Padrões em uso:** React hooks para estado, Mantine para UI.
- **Fluxo de dados:** `area.arbitroIds` lista os árbitros da área. O modal filtra `arbitros` por esses IDs.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/ModalCriarLutaCasada.tsx` | Modificar | Adicionar Select para escolha de árbitro |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum

### 8.2 Ambiguidades nos Requisitos
- Nenhuma

### 8.3 Riscos
- Risco baixo: mudança de UI apenas

---

## 9. Criterios de Aceite

- [x] CA-01: dado uma área com 2+ árbitros, quando o usuário abre o modal de luta casada, então um Select de árbitro é exibido.
- [x] CA-02: dado uma área com 1 árbitro, quando o usuário abre o modal, então o árbitro é selecionado automaticamente.
- [x] CA-03: quando o usuário seleciona um árbitro e cria a luta casada, então o árbitro selecionado é salvo na luta.

---

## 10. Plano de Implementacao

```
Passo 1: Adicionar estado `arbitroSelectedId` e lógica de opções
  - Arquivo(s): `src/components/ModalCriarLutaCasada.tsx`
  - Como validar: Select exibe árbitros da área

Passo 2: Atualizar UI com Select condicional
  - Arquivo(s): `src/components/ModalCriarLutaCasada.tsx`
  - Como validar: Select aparece apenas quando há mais de 1 árbitro
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto
- **Como monitorar:** testar criação de luta casada com área multi-árbitro
- **Plano de rollback:** reverter alterações em `ModalCriarLutaCasada.tsx`

---

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado
- [x] Sem warnings ou erros não tratados introduzidos
