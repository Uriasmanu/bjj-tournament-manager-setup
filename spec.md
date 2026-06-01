# Diagnóstico: Tela em Branco no Formulário de Cadastro de Atleta

## Resumo

O modal do formulário de cadastro de atleta (`src/components/AthleteForm.tsx`) abre mas exibe os campos **em branco** (vazios) porque o `mode: 'uncontrolled'` do `@mantine/form` combinado com valores iniciais de `NumberInput` como string vazia (`''`) e o `useEffect` de reset causam um conflito no ciclo de montagem dos inputs em modo não-controlado.

---

## Causa Raiz #1: `initialValues` com `''` em `NumberInput` no modo `'uncontrolled'`

**Arquivo:** `src/components/AthleteForm.tsx:39-47`

```tsx
const form = useForm({
  mode: 'uncontrolled',
  initialValues: {
    nome: '',
    equipe: '',
    pesoKg: '' as string | number,   // PROBLEMA
    faixa: '' as string,
    anoNascimento: '' as string | number, // PROBLEMA
  },
  // ...
});
```

**Problema:**
No modo `'uncontrolled'` do Mantine v7, o `form.getInputProps('pesoKg')` retorna `{ defaultValue: '' }`. O componente `NumberInput` do Mantine v7 não lida corretamente com `defaultValue=""` porque:

1. Internamente, `NumberInput` tenta fazer o parse do valor: `Number('')` retorna `0`, mas com `decimalScale={1}` a formatação `(0).toFixed(1)` produz `"0.0"` — criando um valor inesperado no campo
2. O input renderiza o campo visualmente **vazio** (blank) porque o estado interno do `NumberInput` não se sincroniza com o `defaultValue=""` após o primeiro parse
3. Em alguns cenários, o `NumberInput` com `decimalScale={1}` e `defaultValue=""` pode lançar um erro não capturado ao tentar formatar `NaN`, causando a **tela branca** (crash da árvore React por falta de Error Boundary)

**Efeito:** Os campos `Peso (kg)` e `Ano de Nascimento` aparecem em branco no modal, dando a impressão de tela vazia.

---

## Causa Raiz #2: `useEffect` com `form.setValues()`/`form.reset()` em modo não-controlado

**Arquivo:** `src/components/AthleteForm.tsx:65-79`

```tsx
useEffect(() => {
  if (opened) {
    if (athlete) {
      form.setValues({ ... });
    } else {
      form.reset();
    }
  }
}, [opened, athlete, form]);
```

**Problema:**
Em `mode: 'uncontrolled'`, a Mantine usa `defaultValue` nos inputs e manipula a **chave React (`key`)** para forçar remontagem quando os valores mudam. O `useEffect` causa o seguinte ciclo problemático:

1. Modal abre (`opened=true`), React renderiza os inputs com `defaultValue` dos `initialValues` (todos vazios)
2. **Após o paint**, o `useEffect` dispara e chama `form.reset()` (ou `form.setValues()`)
3. `form.reset()` incrementa o contador de versão interno → `form.key()` retorna novas chaves (ex.: `"pesoKg-1"`)
4. React desmonta e **remonta** os inputs com as novas chaves e `defaultValue` atualizado
5. Esse ciclo **força um flash** — os inputs aparecem vazios, depois são remontados

Em `NumberInput`, essa remontagem forçada pode não funcionar corretamente:
- O `NumberInput` mantém estado interno (ref do input HTML, valor formatado)
- A remontagem via `key` nem sempre reinicializa corretamente o estado interno do `NumberInput`
- Resultado: campos ficam **permanentemente em branco** mesmo após a remontagem

---

## Causa Raiz #3: `key` sobrescrito pelo spread de `getInputProps`

**Arquivo:** `src/components/AthleteForm.tsx:121-129`

```tsx
<NumberInput
  key={form.key('pesoKg')}
  decimalScale={1}
  {...form.getInputProps('pesoKg')}  // ← sobrescreve key com o mesmo valor
/>
```

**Problema:**
O `form.getInputProps('pesoKg')` já inclui uma propriedade `key` no objeto retornado. Como o spread vem **depois** da prop explícita `key={form.key('pesoKg')}`, o `key` de `getInputProps` sobrescreve o anterior. Embora os valores sejam os mesmos na teoria, qualquer inconsistência interna na Mantine entre `form.key()` e o `key` de `getInputProps` pode fazer o React não reconhecer corretamente os inputs, resultando em:

- Inputs não remontados após `reset()`/`setValues()`
- Valores incorretos exibidos
- Campos em branco

---

## Causas Agravantes (Aplicação Inteira)

### `BrowserRouter` + protocolo `file://`
`src/App.tsx:20` — O `BrowserRouter` não funciona confiavelmente em `file://` (Electron produção). Pode causar navegação silenciosa para tela em branco ao acessar as rotas `/admin/atletas` ou `/admin/atletas/lista`.

### Ausência de Error Boundary
Nenhum Error Boundary existe na aplicação. Se o `NumberInput` lançar uma exceção ao montar com `decimalScale={1}` e `defaultValue=""` (ex.: `this.toFixed is not a function`), toda a árvore React desmonta → tela em branco completa.

### `.catch()` ausente em `activation.check()`
`src/App.tsx:38` — Se a promise rejeitar, `activated` fica `null` eternamente → usuário nunca chega ao formulário.

---

## Correções

### Correção 1: Inicializar `NumberInput` com valor numérico válido

No lugar de `''`, usar `0` ou `undefined`:

```tsx
initialValues: {
  nome: '',
  equipe: '',
  pesoKg: 0,          // ← número, não string vazia
  faixa: '',
  anoNascimento: 0,   // ← número, não string vazia
},
```

E ajustar as validações para aceitar `0`:

```tsx
pesoKg: (v) => {
  const n = Number(v);
  if (v === 0 || v === '' || isNaN(n) || n < 1 || n > 300) return 'Peso deve estar entre 1 e 300 kg';
  return null;
},
anoNascimento: (v) => {
  const n = Number(v);
  if (v === 0 || v === '' || isNaN(n) || !Number.isInteger(n) || n < 1920 || n > anoAtual) 
    return `Ano deve estar entre 1920 e ${anoAtual}`;
  return null;
},
```

### Correção 2: Trocar `mode: 'uncontrolled'` para `mode: 'controlled'` (recomendado)

`mode: 'controlled'` é mais previsível com `NumberInput`:

```tsx
const form = useForm({
  mode: 'controlled',
  initialValues: {
    nome: '',
    equipe: '',
    pesoKg: 0,
    faixa: '',
    anoNascimento: 0,
  },
  // validate: ...
});
```

### Correção 3: Remover o `useEffect` e controlar o reset manualmente

Em vez do `useEffect`, resetar o formulário ao abrir o modal via `onOpen`:

```tsx
const handleOpenForNew = () => {
  form.reset();
  onOpen();
};

const handleOpenForEdit = (athlete: Atleta) => {
  form.setValues({ ...athlete });
  onOpen();
};
```

### Correção 4: Validar dados do atleta antes de `setValues`

```tsx
form.setValues({
  nome: athlete.nome || '',
  equipe: athlete.equipe || '',
  pesoKg: athlete.pesoKg ?? 0,
  faixa: athlete.faixa || '',
  anoNascimento: athlete.anoNascimento ?? 0,
});
```

---

## Fluxo de Falha Detalhado

```
Usuário clica "Cadastrar Atleta"
  → Modal abre (opened=true)
  → AthleteForm renderiza com initialValues ('' para todos)
    → NumberInput recebe defaultValue="" + decimalScale=1
    → NumberInput tenta parse("") → Number("") = 0
    → NumberInput exibe campo vazio (bug: defaultValue="" não renderiza valor)
  → useEffect dispara: form.reset()
    → versão interna incrementa
    → keys mudam ("pesoKg-0" → "pesoKg-1")
    → React remonta inputs
    → NumberInput recebe novo defaultValue=""  (mesmo problema)
    → Campo continua em branco
  → Usuário vê modal com campos Peso e Ano Nascimento em branco
```

---

## Ambiente

- `@mantine/core`: ^7.17.8
- `@mantine/form`: ^7.17.8 (modo `uncontrolled`)
- `react`: ^18.2.0
- `electron`: ^30.0.1
- `react-router-dom`: ^6.30.4 (`BrowserRouter`)
- Data da análise: 31/05/2026

---

## Alterações Realizadas

### `src/components/AthleteForm.tsx`

| O quê | Antes | Depois |
|-------|-------|--------|
| `mode` | `'uncontrolled'` | `'controlled'` |
| `pesoKg` initialValue | `'' as string \| number` | `0` |
| `anoNascimento` initialValue | `'' as string \| number` | `0` |
| Validação `pesoKg` | `!v \|\| isNaN(n) \|\| n < 1 \|\| n > 300` | `v == null \|\| v < 1 \|\| v > 300` |
| Validação `anoNascimento` | `!v \|\| isNaN(n) \|\| !Number.isInteger(n) \|\| n < 1920 \|\| n > anoAtual` | `v == null \|\| !Number.isInteger(v) \|\| v < 1920 \|\| v > anoAtual` |
| `key={form.key(...)}` explícito | presente em todos os inputs | removido (não necessário em controlled) |
| `useEffect` deps | `[opened, athlete, form]` | `[opened, athlete, form]` (inalterado) |
| `form.setValues` fallbacks | `athlete.pesoKg` direto | `athlete.pesoKg ?? 0` com nullish coalescing |

### `src/App.tsx`

| O quê | Antes | Depois |
|-------|-------|--------|
| Router | `BrowserRouter` | `HashRouter` |
| `activation.check()` | `.then(setActivated)` | `.then(setActivated).catch(() => setActivated(false))` |
| Error Boundary | ausente | `<ErrorBoundary>` envolvendo `<Routes>` |

### `src/components/ErrorBoundary.tsx` (novo)

Componente classe React que captura erros de renderização e exibe uma tela de fallback com botão "Tentar novamente", prevenindo tela em branco total.
