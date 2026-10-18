# Painel de chamada (web, Vercel) + abertura assistida de luta via QR code

> Depende do documento [`2026-10-18-firebase-firestore-migration-design.md`](./2026-10-18-firebase-firestore-migration-design.md) — este recurso só existe porque os dados do torneio passam a ter um espelho em tempo real no Firestore. Sem aquela mudança, este documento não se sustenta.

## Intenção e por quê

Hoje, quando o "chamador" (pessoa que busca os atletas e os leva até a área de luta) chega na mesa com os dois competidores, quem está operando o sistema naquela área precisa **procurar manualmente** (pela lupa de busca ou visualmente) qual chave contém aquela dupla — perda de tempo e chance de erro num momento em que o evento já está correndo.

A ideia é dar ao chamador um site simples, acessível pelo celular (hospedado no Vercel), onde ele vê a lista de lutas pendentes com os nomes dos atletas, escolhe qual foi buscar, e — ao chegar fisicamente na área — escaneia um QR code fixo naquela área para confirmar a chegada. Essa confirmação aparece como um aviso na tela do PC daquela área, com um botão para abrir a luta direto, sem o operador precisar buscar nada.

## Goals

- Site mobile-friendly (Vercel) com uma lista das lutas pendentes (nomes dos atletas, categoria), permitindo ao chamador escolher qual luta ele foi buscar.
- Cada área de luta tem um QR code fixo e físico (impresso) que a identifica.
- Ao escanear o QR da área pelo site (câmera do celular, leitura feita no navegador), o sistema combina "luta escolhida" + "área confirmada" e manda um aviso em tempo real para o PC daquela área.
- O PC daquela área mostra uma notificação ("Próxima luta confirmada: Fulano x Ciclano") com um botão para abrir — **nunca troca de tela sozinho** (decisão do usuário: evitar interromper uma pontuação em andamento por engano).
- Acesso ao site protegido por um código do evento — não é um link público sem nenhuma barreira.

## Non-goals

- Pontuar ou arbitrar luta pelo celular — o site só serve para identificar/abrir a luta certa na mesa, não substitui `PlacarLuta`.
- Check-in/pesagem de atletas — fora de escopo, não modelado aqui.
- Troca automática de tela no PC — está decidido que é sempre o operador quem decide abrir, nunca automático.
- Resolver isolamento entre organizadores diferentes (mesmo não-goal já registrado no documento de Firestore) — o código do evento aqui é uma barreira de acesso simples para esta fase, não um sistema de contas.

## Anti-goals

- Interromper uma luta em andamento na tela da mesa por causa de uma confirmação de chegada de outra luta.
- Qualquer pessoa no ginásio (sem o código do evento) conseguir abrir o site e disparar avisos nas mesas.
- O recurso falhar silenciosamente sem internet nenhuma, sem deixar claro para o chamador que a confirmação não foi entregue — ver constraint de conectividade abaixo.

## Constraints

- **Depende de alguma conectividade com a internet para funcionar**, assim como a sincronização Firestore já desenhada: tanto carregar o site (Vercel) quanto escrever/ler o sinal de chamada no Firestore precisam de rede. Em evento com zero internet (cenário já aceito como limitação no documento de Firestore), este recurso simplesmente não funciona, e a forma de contorno é a mesma de hoje: o operador busca a chave manualmente. Isso deve ficar visível na UI do site (ex.: aviso de "sem conexão" antes de tentar confirmar uma chegada), não falhar silenciosamente.
- Reaproveita o vínculo chave↔área que já existe hoje (`chave.arbitroId` pertence à lista `area.arbitroIds`) — não cria uma segunda fonte de verdade para "quais lutas são de qual área".
- É a primeira parte do sistema exposta diretamente à internet pública (diferente do app Electron) — a proteção por código de evento precisa ser aplicada nas regras do Firestore, não só escondida na interface do site.

## Decisões já tomadas (o "como")

1. **App web separado** (ex.: pasta `web-chamadas/` no mesmo repositório), React + Vite, deploy no Vercel — não faz parte do bundle do Electron. Reaproveita os tipos de domínio já existentes em `src/types/*.ts` (são TypeScript puro, sem dependência de Electron).
2. **Código do evento vira um token de acesso ao Firestore, não só uma trava de UI**: o site manda o código para uma função serverless (rota de API do Vercel) que confere esse código contra o torneio correspondente e devolve um **token de autenticação do Firebase (custom token)** limitado àquele torneio — o navegador usa esse token para autenticar no Firestore, e as regras de segurança checam que o token corresponde ao torneio antes de liberar leitura/escrita. Isso evita o problema de "como verificar uma senha dentro de uma regra do Firestore sem expor o valor certo para todo mundo" — quem decide se o código está certo é a função serverless, que tem acesso privilegiado (chave de serviço, nunca exposta ao navegador).
3. **QR code identifica só a área** (`{torneioId, areaId}`), gerado uma vez por área (ex.: botão "Gerar QR" na tela `AdminAreas` do Electron, que gera um QR para imprimir e fixar fisicamente na mesa daquela área).
4. **Sinal de chamada por área**, um documento pequeno no Firestore por área (ex.: `torneios/{id}/areas/{areaId}/chamadaAtual`) contendo `chaveId`, `lutaId`, os dois atletas e o horário da confirmação. O app Electron já está ouvindo o Firestore (pelo desenho já existente) e passa a também escutar esse documento por área — quando muda, mostra a notificação com botão "abrir" na tela correspondente daquele PC.
5. **Lista de lutas pendentes no site** é somente leitura do espelho do Firestore já desenhado (`atletas`, `chaves`, `chaves/{id}/lutas`) — não introduz um novo modelo de dados para as lutas em si, só lê o que já existe.

## O que fica para o plano de implementação decidir

- Layout e fluxo de tela do site (lista de lutas → detalhe da luta escolhida → tela de câmera/scanner → confirmação).
- Onde e como gerar/imprimir os QR codes das áreas no Electron (`AdminAreas`).
- Redação das Firestore Security Rules que usam o custom token por torneio (complementando as já previstas no documento de Firestore).
- Onde roda a função serverless que verifica o código do evento e emite o custom token (rota de API do Vercel, usando o Firebase Admin SDK com uma chave de serviço guardada como variável de ambiente secreta do Vercel — nunca no código).
- O que acontece com o documento `chamadaAtual` depois que o operador abre ou ignora o aviso (limpo? mantido como histórico de chamadas?) e se múltiplas confirmações seguidas para a mesma área devem substituir uma à outra ou enfileirar.
- Expiração/rotação do código do evento (ex.: um código novo por torneio, visível só para o admin).
- Biblioteca de leitura de QR code pelo navegador (câmera) a usar no site.
