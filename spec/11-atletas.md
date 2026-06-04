# Spec: Chave de 11 Atletas

## 1. Contexto e Objetivo

- **O que é:** Geração de chave de eliminação simples para exatamente 11 atletas.
- **Por que existe:** O algoritmo genérico (`gerarLutasGeral`) produz bracket subótimo com BYEs mal distribuídos para 11 atletas.
- **Quem usa:** Organizadores de torneio ao gerar chaves para categorias com 11 inscritos.
- **Escopo:** Criação de função dedicada `gerarLutasOnze` + `advanceWinner11`. Fora do escopo: alteração de seeding, UI, outros tamanhos.

## 2. Documentos de Referência

- `doc/spec.md` — template + feature descrita (seção Feature, linhas 34-74)
- `doc/requisitos.md` — requisitos (seção 3.11)
- `electron/brackets.ts` — código atual

## 3. História de Usuário

```
Como organizador,
quero gerar chave para 11 atletas,
para que 6 lutem na R1, 5 descansem (BYE), e haja exatamente 8 atletas nas quartas.
```

## 4. Requisitos Funcionais

- [ ] RF-01: R1 com 8 lutas (3 reais + 5 BYEs)
- [ ] RF-02: R2 com 4 lutas (quartas — 1 real + 1 mista + 2 BYE-vs-BYE)
- [ ] RF-03: R3 com 2 lutas (semifinais)
- [ ] RF-04: R4 com 1 luta (final)
- [ ] RF-05: Total de 15 lutas, 4 rodadas
- [ ] RF-06: Propagação correta: BYEs da R1 (L4-L8) pré-preenchidos na geração
- [ ] RF-07: L11 e L12 são lutas reais entre BYE winners (pos[7]×pos[8], pos[9]×pos[10])

## 5. Requisitos Não-Funcionais

- Geração instantânea
- Sem console.log

## 6. Análise da Aplicação

Mesma arquitetura de `electron/brackets.ts`. Função dedicada no dispatcher `gerarLutas()` case 11.

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Adicionar `gerarLutasOnze()`, `advanceWinner11()`, dispatchers |
| `spec/11-atletas.md` | Criar | Documentação |
| `doc/requisitos.md` | Modificar | Adicionar descrição da chave de 11 |

## 8. Problemas e Impedimentos

Nenhum.

## 9. Critérios de Aceite

- [ ] CA-01: 11 atletas → 15 lutas, 4 rodadas
- [ ] CA-02: R1 = 8 lutas (L1-L3 reais, L4-L8 BYE)
- [ ] CA-03: R2 = 4 lutas (L9 TBD×TBD, L10 TBD×pos[6], L11 pos[7]×pos[8], L12 pos[9]×pos[10])
- [ ] CA-04: R3 = 2 lutas (semifinais)
- [ ] CA-05: R4 = 1 luta (final)
- [ ] CA-06: BYEs L4-L8 pré-preenchidos (vencedorId setado, status='wo')
- [ ] CA-07: L10 tem atletaBId = pos[6].id pré-preenchido na geração

## 10. Plano de Implementação

```
Passo 1: gerarLutasOnze()
  R1: L1(pos[0]×pos[1]), L2(pos[2]×pos[3]), L3(pos[4]×pos[5]),
      L4(pos[6]×BYE wo), L5(pos[7]×BYE wo), L6(pos[8]×BYE wo),
      L7(pos[9]×BYE wo), L8(pos[10]×BYE wo)
  R2: L9(TBD×TBD), L10(TBD×pos[6]), L11(pos[7]×pos[8]), L12(pos[9]×pos[10])
  R3: L13(TBD×TBD), L14(TBD×TBD)
  R4: L15(TBD×TBD)

Passo 2: advanceWinner11()
  L1→L9.A, L2→L9.B, L3→L10.A
  BYEs L4-L8 ignorados (já preenchidos na geração)
  L9→L13.A, L10→L13.B, L11→L14.A, L12→L14.B
  L13→L15.A, L14→L15.B

Passo 3: Dispatchers
  gerarLutas: case 11
  registrarResultadoHandler: totalAtletas === 11
  separarEquipes: n === 11 → sideA=[0..5], sideB=[6..10]
```

## 11. Rollout e Observabilidade

Deploy direto.

## 12. Definição de Pronto

- [ ] Código compila sem erros
- [ ] spec.md atualizado
- [ ] requisitos.md atualizado
