# Verificação manual de conectividade — sincronização Firebase/Firestore

> Checklist do Task 14 do plano `2026-10-18-firebase-firestore-sync.md`. Esses cenários só fazem sentido com duas máquinas reais (ou dois perfis/instâncias do app com `userData` apontando para pastas diferentes) e com o projeto Firebase (`bjj-tournament-manager-setup`) com as regras e a Cloud Function `mintTournamentToken` já implantadas (ver Task 5, Step 7 — deploy manual ainda pendente, feito fora desta sessão). **Nenhum item abaixo foi executado nesta sessão** — não há dois PCs nem acesso de rede real disponíveis neste ambiente. Marcados como pendentes para quem for validar com hardware real.

## Pré-requisitos antes de rodar este checklist

- [ ] `firebase deploy --only firestore:rules,functions` já rodado com sucesso no projeto `bjj-tournament-manager-setup` (Task 5, Step 7).
- [ ] Duas instâncias do app (dois PCs, ou duas pastas `userData` diferentes na mesma máquina) configuradas com o mesmo `.env.local` (mesma config do Firebase).

## Cenários

- [ ] **Cadastrar atleta no PC A sem internet nenhuma** → aparece salvo localmente, sem erro de UI; ao reconectar a rede, aparece no PC B dentro de alguns segundos.
- [ ] **Dois PCs offline ao mesmo tempo editando o mesmo atleta com nomes diferentes** → ao reconectar os dois, vence o que editou por último (conferir pelo horário de cada ação); o outro não trava nem gera erro, só é sobrescrito silenciosamente conforme o esperado (critério de conflito por `updatedAt`).
- [ ] **Registrar resultado de duas lutas diferentes da mesma chave, uma em cada PC, ambos offline** → ao reconectar, as duas lutas aparecem atualizadas nos dois PCs (nenhuma sobrescreve a outra, graças a cada luta ser um documento/arquivo próprio).
- [ ] **Abrir um torneio salvo no formato antigo (pré-migração, um único `torneios/{id}.json`)** → abre normalmente, sem erro, e os dados passam a existir no novo formato arquivo-por-registro em disco (`torneios/{id}/atletas/*.json` etc.), com o arquivo antigo renomeado para `.json.migrated`.
- [ ] **Usar "Enviar para a nuvem" duas vezes seguidas no mesmo torneio** → não duplica nada no Firestore (cada reenvio é idempotente, pois cada `push*` usa o id do registro como id do documento).
- [ ] **Indicador de status de sincronização** (ícone no cabeçalho das telas) mostra "sem conexão" ao desligar a rede e volta para "conectado" ao religar, sem precisar recarregar a tela.

## Resultado

_Preencher após a execução com hardware real:_

| Cenário | Resultado | Observações |
|---|---|---|
| Cadastro offline + sync ao reconectar | pendente | |
| Conflito de edição simultânea offline | pendente | |
| Duas lutas da mesma chave, PCs diferentes, offline | pendente | |
| Abrir torneio no formato antigo | pendente | |
| "Enviar para a nuvem" idempotente | pendente | |
| Indicador de status online/offline | pendente | |
