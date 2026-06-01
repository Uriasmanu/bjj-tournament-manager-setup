# Relatório de Análise — Formulário de Atletas

## Problema

O formulário de atletas (modal) abre mas os campos `TextInput`, `NumberInput` e `Select` não
respondem à digitação e o `Select` não expande o dropdown.

---

## Diagnóstico da Causa Raiz

### 1. `mode: 'uncontrolled'` + `form.key()` + `form.reset()` / `form.setValues()`

**Arquivo:** `src/components/AthleteForm.tsx`

O formulário é configurado com `mode: 'uncontrolled'` (linha 40) e cada campo recebe
um `key={form.key('nome')}` (ex.: linhas 114, 121, 131, 142, 152).

Em Mantine v7, `form.key()` retorna um identificador que **muda sempre que o estado
interno do formulário é alterado** (ex.: `'nome:0'` → `'nome:1'` após `form.reset()`).

Ao abrir o modal, o `useEffect` (linhas 65-83) executa:

- **Modo criação (`athlete` é `null`):** chama `form.reset()` (linha 80)
- **Modo edição (`athlete` populado):** chama `form.setValues({...})` (linhas 72-78)

Ambos os métodos incrementam o contador interno do formulário, fazendo com que **todas
as `form.key()` mudem simultaneamente**. O React interpreta a mudança de `key` como
a necessidade de desmontar e remontar cada input do zero.

### 2. Consequência direta

- O input é removido do DOM e reinserido enquanto o modal ainda está animando a abertura
- O estado interno do input (ref do DOM, foco, cursor, dropdown state do Select) é perdido
- Qualquer tentativa de digitar ou clicar no Select é descartada porque o componente
  alvo é substituído no meio da interação
- O Select perde a referência ao dropdown e não abre

### 3. Por que `mode: 'uncontrolled'` agrava

No modo controlado (padrão), `form.getInputProps('nome')` retorna `{ value, onChange }`
e o `key` não é necessário para sincronia. Já no modo uncontrolled, a sincronia
depende exclusivamente da troca de `key` + `defaultValue`, o que força a remontagem
sempre que o valor precisa ser redefinido.

---

## Arquivos envolvidos

| Arquivo | Relevância |
|---|---|
| `src/components/AthleteForm.tsx:40` | `mode: 'uncontrolled'` — causa raiz |
| `src/components/AthleteForm.tsx:65-83` | `useEffect` que dispara `form.reset()` / `form.setValues()` |
| `src/components/AthleteForm.tsx:114,121,131,142,152` | `form.key()` em cada campo |
| `src/pages/AdminAthletes.tsx:37-45` | `handleNew` / `handleEdit` — acionam abertura |
| `src/pages/AthletesMenu.tsx:25-27` | `handleNew` — acionam abertura |

---

## Solução recomendada

Trocar para **modo controlado** removendo `mode: 'uncontrolled'`:

```tsx
// ANTES (linha 40)
const form = useForm({
  mode: 'uncontrolled',
  initialValues: { ... },
});

// DEPOIS
const form = useForm({
  initialValues: { ... },
});
```

Isso faz com que `form.getInputProps('nome')` retorne `{ value, onChange }` em vez
de `{ key, defaultValue }`, eliminando a necessidade de `form.key()` e portanto
a remontagem dos componentes.

Os `key={form.key('nome')}` existentes podem ser removidos (ou mantidos, já que
em modo controlado `form.key()` retorna um valor estável).

---

## Verificação adicional

Nenhum outro problema foi encontrado no código:

- Não há `disabled`, `readOnly` ou `pointer-events: none` em nenhum campo
- Não há conflito de `z-index` entre modais ou overlays
- Não há `event.stopPropagation()` ou `preventDefault()` bloqueando interações
- O CSS global é limpo e não interfere em componentes Mantine
- O bug de "modal branco" documentado em `spec/cadastro-atletas.md` seção 12.3
  já foi corrigido anteriormente e não é o causador deste problema
