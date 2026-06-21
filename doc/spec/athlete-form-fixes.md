# Spec: Correções no Formulário de Atleta

## RF
- RF1: Verificar nome duplicado ao editar atleta e impedir salvamento
- RF2: Exibir mensagem "Já existe um atleta com este nome" quando nome duplicado
- RF3: Faixa branca deve ser única (sem opção branca-adulto separada)

## CA
- CA1: `AthleteForm.tsx` carrega todos os atletas via `loadAthletes()` ao abrir modal
- CA2: Validação síncrona `validate.nome` verifica nome normalizado (trim + lowercase) contra outros atletas
- CA3: Exclusão do próprio `id` na verificação de duplicidade
- CA4: Opção `branca-adulto` removida do array `faixas`
- CA5: Toda lógica de normalização `branca-adulto` → `branca` removida

## Passos
1. Adicionar estado `allAthletes` e carregar via `loadAthletes()` no useEffect de abertura
2. Criar `allAthletesRef` para acesso no validate síncrono
3. Adicionar validação customizada para campo `nome` que verifica duplicidade
4. Alterar opção `branca-adulto` para `branca` no grupo Adulto
5. Remover normalização `branca-adulto` → `branca` no submit
6. Remover normalização no useEffect de inicialização

## Arquivos
- `src/components/AthleteForm.tsx` — formulário com validação e faixa corrigida
