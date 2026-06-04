# Spec: Chave de 10 Atletas

## 1. Contexto e Objetivo

- **O que é:** Geração de chave de eliminação simples para exatamente 10 atletas.
- **Por que existe:** O algoritmo genérico (`gerarLutasGeral`) produz apenas 5 lutas no round 1 (ceil(10/2)) com propagação de BYE quebrada.
- **Quem usa:** Organizadores de torneio ao gerar chaves para categorias com 10 inscritos.
- **Escopo:** Criação de função dedicada `gerarLutasDez` + `advanceWinner10`. Fora do escopo: alteração de seeding, UI, outros tamanhos.

## 2. Documentos de Referência

- `doc/spec.md` — template + feature descrita
- `doc/requisitos.md` — requisitos (seção 3.11)
- `electron/brackets.ts` — código atual

## 3. História de Usuário

```
Como organizador,
quero gerar chave para 10 atletas,
para que 8 lutem na R1, 2 descansem, e haja BYEs estratégicos na R2 resultando em 4 semifinalistas.
```

## 4. Requisitos Funcionais

- [ ] RF-01: R1 com 6 lutas (4 reais + 2 BYEs nos índices 4,5)
- [ ] RF-02: R2 com 4 lutas (2 reais + 2 BYEs nos índices 1,2)
- [ ] RF-03: R3 com 2 lutas (semifinais)
- [ ] RF-04: R4 com 1 luta (final)
- [ ] RF-05: Total de 13 lutas
- [ ] RF-06: Propagação correta: L3→L8.WO→L11.B, L4→L9.WO→L12.A
- [ ] RF-07: BYEs da R1 (L5, L6) se enfrentam na R2 (L10)

## 5. Requisitos Não-Funcionais

- Geração instantânea
- Sem console.log

## 6. Análise da Aplicação

Mesma arquitetura de `electron/brackets.ts`. Função dedicada no dispatcher `gerarLutas()` case 10.

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Adicionar `gerarLutasDez()`, `advanceWinner10()`, dispatchers |
| `spec/10-atletas.md` | Criar | Documentação |

## 8. Problemas e Impedimentos

Nenhum.

## 9. Critérios de Aceite

- [ ] CA-01: 10 atletas → 13 lutas, 4 rodadas
- [ ] CA-02: R1 = 6 lutas (índices 0-3 reais, 4-5 BYE)
- [ ] CA-03: R2 = 4 lutas (índices 0 real, 1-2 BYE, 3 real)
- [ ] CA-04: R3 = 2 lutas (semifinais)
- [ ] CA-05: Vencedor de L3 avança direto para SF (L11.B) via L8.WO
- [ ] CA-06: Vencedor de L4 avança direto para SF (L12.A) via L9.WO
- [ ] CA-07: BYEs da R1 (pos[8], pos[9]) se enfrentam em L10

## 10. Plano de Implementação

```
Passo 1: gerarLutasDez()
  R1: L1(pos[0]×pos[1]), L2(pos[2]×pos[3]), L3(pos[4]×pos[5]), L4(pos[6]×pos[7]), L5(pos[8]×BYE wo), L6(pos[9]×BYE wo)
  R2: L7(TBD×TBD), L8(TBD×TBD), L9(TBD×TBD), L10(pos[8]×pos[9])
  R3: L11(TBD×TBD), L12(TBD×TBD)
  R4: L13(TBD×TBD)

Passo 2: advanceWinner10()
  L1→L7.A, L2→L7.B, L3→L8.A+WO+L11.B, L4→L9.A+WO+L12.A
  L5→L10.A, L6→L10.B, L7→L11.A, L10→L12.B, L11→L13.A, L12→L13.B

Passo 3: Dispatchers
  gerarLutas: case 10
  registrarResultadoHandler: totalAtletas === 10
  separarEquipes: n === 10
```

## 11. Rollout e Observabilidade

Deploy direto.

## 12. Definição de Pronto

- [ ] Código compila sem erros
- [ ] spec.md atualizado
- [ ] requisitos.md atualizado
