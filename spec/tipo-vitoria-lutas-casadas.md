# Tipo de Vitória em Lutas Casadas

## 1. Contexto e Objetivo

- **O que é:** Exibição do tipo de vitória (pontos, finalização, desclassificação, desempate) nas lutas casadas em todos os pontos de exibição.
- **Por que existe:** O administrador/árbitro precisa saber como a luta foi finalizada para fins de controle e estatísticas do torneio.
- **Quem usa:** Árbitros e administradores que acessam o placar e resultados de lutas casadas.
- **Escopo:** PlacarChaves, AdminLutasCasadas, PlacarLutaCasada e PDF de lutas casadas.

## 2. História de Usuário

```
Como administrador do torneio,
quero ver o tipo de vitória (pontos, finalização, desclassificação, desempate) ao visualizar lutas casadas,
para que eu saiba exatamente como a luta foi finalizada.
```

**Cenários alternativos:**
- Luta pendente: não exibir tipo de vitória.
- Luta finalizada sem tipo definido: exibir "Pontos" como padrão.

## 3. Requisitos Funcionais

- [x] RF-01: A função `getTipoVitoria` deve retornar o tipo de vitória com base nos campos `finalizacao`, `desclassificacao` e `desempateArbitro`.
- [x] RF-02: Os cards de lutas casadas em `PlacarChaves.tsx` devem exibir um badge com o tipo de vitória.
- [x] RF-03: A tabela de `AdminLutasCasadas.tsx` deve incluir uma coluna "Tipo" com badge de tipo de vitória.
- [x] RF-04: O alert de finalização em `PlacarLutaCasada.tsx` deve incluir o tipo de vitória.
- [x] RF-05: A função `getTipoVitoria` deve ser compartilhada em `src/utils/vitoria.ts` para reutilização.

## 4. Requisitos Não-Funcionais

- **Performance:** Sem impacto — apenas consultas de campos booleanos existentes.
- **Compatibilidade:** Funciona em todas as plataformas (Electron desktop).

## 5. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/utils/vitoria.ts` | Criar | Função compartilhada `getTipoVitoria` |
| `src/pages/Resultados.tsx` | Modificar | Usar função compartilhada em vez de local |
| `src/pages/PlacarChaves.tsx` | Modificar | Adicionar badge de tipo de vitória nos cards |
| `src/pages/AdminLutasCasadas.tsx` | Modificar | Adicionar coluna "Tipo" na tabela |
| `src/pages/PlacarLutaCasada.tsx` | Modificar | Incluir tipo de vitória no alert |

## 6. Critérios de Aceite

- [x] CA-01: Dado uma luta casada finalizada por finalização, quando visualizar o card em PlacarChaves, o badge deve exibir "🏁 Finalização".
- [x] CA-02: Dado uma luta casada finalizada por desclassificação, quando visualizar a tabela em AdminLutasCasadas, a coluna "Tipo" deve exibir "🚫 Desclassificação".
- [x] CA-03: Dado uma luta casada finalizada por pontos, quando acessar o placar, o alert deve exibir "(Pontos)".
- [x] CA-04: Dado uma luta casada pendente, nenhum badge de tipo de vitória deve ser exibido.

## 7. Plano de Implementação

```
Passo 1: Criar função compartilhada
  - Criar src/utils/vitoria.ts com função getTipoVitoria

Passo 2: Atualizar Resultados.tsx
  - Importar e usar getTipoVitoria de utils/vitoria.ts

Passo 3: Atualizar PlacarChaves.tsx
  - Importar getTipoVitoria e adicionar badge nos cards

Passo 4: Atualizar AdminLutasCasadas.tsx
  - Importar getTipoVitoria e adicionar coluna na tabela

Passo 5: Atualizar PlacarLutaCasada.tsx
  - Importar getTipoVitoria e incluir no alert
```

## 8. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (correção de bug existente).
- **Como monitorar:** Verificar que o tipo de vitória aparece nas telas de lutas casadas.
- **Plano de rollback:** Reverter alterações nos arquivos modificados.

## 9. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Sem warnings ou erros não tratados introduzidos
- [x] Seção Histórico de Correções atualizada em spec.md
