# Equipes — Resumo no Dashboard

## Descrição

O usuário acessa a tela de Dashboard e clica no card **Equipes** para visualizar um resumo com o nome das equipes e a quantidade de atletas registrados em cada uma.

## Fonte dos Dados

Os dados são obtidos exclusivamente da lista de atletas armazenada no JSON do torneio ativo.

- **Arquivo:** `{userData}/data/torneios/{id}.json`
- **Campo utilizado:** `atletas[].equipe` (string normalizada em lowercase)
- **Estrutura do atleta:**

```typescript
interface Atleta {
  id: string;
  nome: string;
  equipe: string;       // → utilizado para agrupar
  pesoKg: number;
  faixa: Faixa;
  anoNascimento: number;
  createdAt: string;
  updatedAt: string;
}
```

- **Interface Torneio:**

```typescript
interface Torneio {
  id: string;
  nome: string;
  data: string;
  atletas?: Atleta[];   // → array fonte para a consulta
  // ...
}
```

## Lógica da Consulta

Não existe uma rota ou tabela separada de equipes. O resumo é gerado percorrendo o array `atletas` e agregando por `equipe`:

```
para cada atleta em torneio.atletas:
    agrupar por atleta.equipe
    contar ocorrências por grupo
```

**Resultado esperado:** `Record<string, number>` — ex: `{ "gracie barra": 15, "nova união": 10, "checkmat": 8 }`

## Fluxo

1. Dashboard carrega o torneio ativo via `window.electronAPI.getActiveTournament()`
2. Usuário clica no card **Equipes**
3. Navega para rota `/admin/equipes`
4. A página carrega os atletas via `window.electronAPI.loadAthletes()`
5. Um `useMemo` agrupa por `equipe` e calcula a contagem
6. Exibe uma lista ou tabela com: `Nome da Equipe` | `Qtd. Atletas`

## Implementação Referência

O mesmo padrão já é usado em `AdminAthletes.tsx` (linhas 131-137) para contar atletas por faixa:

```typescript
const equipeCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const a of athletes) {
    const key = a.equipe;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}, [athletes]);
```

## Arquivos Envolvidos

| Arquivo | Papel |
|---|---|
| `src/pages/Dashboard.tsx` | Card "Equipes" (atualmente `status: 'planned'`) |
| `src/pages/AdminAthletes.tsx` | Referência de padrão de contagem agrupada |
| `src/types/athlete.ts` | Interface `Atleta` com campo `equipe` |
| `src/types/tournament.ts` | Interface `Torneio` com array `atletas` |
| `electron/athletes.ts` | CRUD de atletas (fonte dos dados) |
| `electron/main.ts` | Handlers IPC |
| `electron/preload.ts` | Bridge para o renderer |

## Status Atual

O card **Equipes** no Dashboard existe mas está marcado como `'planned'` (não implementado):
- Renderizado com opacidade 50%
- Cursor `not-allowed`
- Badge "Em breve"
- Nenhuma rota registrada em `App.tsx`
- Nenhuma página ou componente criado
