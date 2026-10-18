# Sincronização multi-PC: JSON local + Firebase (Firestore)

## Intenção e por quê

Hoje cada torneio é um único arquivo JSON por máquina (`userData/data/torneios/{id}.json`), lido e escrito pelo processo Electron (`electron/*.ts`). Isso funciona bem com um PC, mas o uso real do app já envolve **pelo menos 2 PCs rodando o mesmo torneio ao mesmo tempo** (ex.: um na mesa do admin, outro numa área de luta operando o placar). Hoje, fazer esses dois PCs enxergarem os mesmos dados depende de exportar/importar o JSON manualmente.

O objetivo é fazer mudanças feitas em um PC (atleta cadastrado, chave gerada, resultado de luta registrado, luta casada criada, etc.) aparecerem automaticamente nos outros PCs conectados ao mesmo torneio, usando o **Cloud Firestore** como camada de sincronização — **sem abrir mão do funcionamento 100% local que existe hoje**.

**Importante — o que o Firestore resolve e o que não resolve, revisado após discussão com o usuário:** a conectividade nos locais de evento é incerta, e pode em alguns eventos não haver **internet nenhuma** (só rede local entre os PCs). O Firestore sincroniza cada PC com o servidor do Google — ele não faz sincronização direta entre dois PCs numa rede local sem nenhum caminho até a internet. Por isso o desenho não é mais "trocar o JSON pelo Firestore"; é **manter o JSON local como gravação imediata e garantida** (como hoje, continua funcionando mesmo com zero rede) **e usar o Firestore como camada de sincronização best-effort**, que entrega tempo real entre PCs sempre que exista algum caminho de rede (mesmo fraco/intermitente) até a internet. No caso raro de zero internet o evento inteiro, os PCs continuam operando normalmente de forma isolada (como hoje) e sincronizam assim que qualquer conectividade aparecer — isso foi uma escolha explícita do usuário em vez de construir sincronização direta via rede local, por ser muito mais simples de construir e manter.

## Goals

- Dois ou mais PCs rodando o mesmo torneio veem as mudanças um do outro **em tempo real**, sem exportar/importar manualmente, sempre que exista algum caminho de rede até a internet (mesmo fraco/intermitente).
- O JSON local continua sendo gravado **imediatamente e sempre**, exatamente como hoje — ele é quem garante que o app funciona sem nenhuma rede. O Firestore é uma camada adicional de sincronização, não a nova única fonte de verdade.
- Quando não há nenhuma conectividade, os PCs seguem operando isolados normalmente (equivalente ao comportamento de hoje) e sincronizam entre si assim que algum caminho de rede voltar — sem perda de dados.

## Non-goals (fora do escopo desta migração)

- Sistema de contas/login por organizador. Uso é pessoal por enquanto, mas o usuário confirmou que **o app pode vir a ser compartilhado com outras academias/organizadores no futuro** — isso não entra nesta fase, mas deixa de ser um "nice to have" distante: ver constraint de segurança abaixo e o follow-up explícito no fim do documento, que passa a ser um pré-requisito antes de qualquer distribuição real, não um follow-up opcional.
- Mudar a lógica de negócio já existente (regras de chaveamento, categorias, pontuação) — a mudança é em **como os dados sincronizam entre PCs**, não **as regras do IBJJF já implementadas**. Os bugs já catalogados em `doc/analise-logica-sistema.md` (categorias infantis inacessíveis, duplicação de `advanceWinnerX`, gesto de braço incorreto, etc.) **não são corrigidos aqui**.
- Mudar a tela de arbitragem ao vivo (`PlacarLuta`/`PlacarLutaCasada`), a pontuação por gesto, ou a geração de PDF — essas telas continuam chamando a mesma lógica local (JSON) de hoje; a sincronização via Firestore entra como uma camada adicional, não troca essas telas.
- Sincronizar placar **ponto a ponto** entre PCs em tempo real. O usuário só pediu tempo real para eventos discretos (resultado registrado, chave criada, atleta cadastrado) — a pontuação ao vivo de uma luta em andamento continua sendo estado local da máquina que está arbitrando aquela luta, só é persistida/sincronizada (local e depois nuvem) quando a luta é finalizada (mesmo padrão de hoje, em que só o IPC `registrar-resultado` grava no arquivo).
- Sincronização direta entre PCs via rede local (sem depender de internet) quando não há nenhuma conectividade — decisão explícita do usuário de não construir esse mecanismo agora (ver "Intenção e por quê" acima). Fica registrado como possível trabalho futuro se o cenário de zero-internet se mostrar frequente na prática.
- Licenciamento/ativação (`electron/activation.ts`) continua local e inalterado — não tem relação com dados do torneio.

## Anti-goals (o que tornaria isso um fracasso mesmo "funcionando")

- Perder ou corromper o placar/resultado de uma luta por causa de uma queda de conexão no meio do evento — em qualquer cenário de conectividade, o JSON local grava primeiro e nunca fica bloqueado esperando rede.
- Custo inesperado de Firebase: o uso (pessoal, eventos pontuais) deve caber confortavelmente no plano gratuito (Spark). O plano precisa deixar explícito quando algo arriscaria sair do free tier.
- Quebrar o uso 100% offline: com zero rede, o app precisa continuar permitindo cadastrar atletas, gerar chaves e registrar resultados normalmente, exatamente como hoje — a sincronização entre PCs é um "bônus" quando há rede, nunca um requisito para a operação básica funcionar.
- Depois que o app puder ser distribuído a outras academias, qualquer pessoa com o instalador conseguir ler/escrever os torneios de **qualquer outro organizador** só porque todo mundo compartilha o mesmo projeto Firebase com autenticação anônima — isso é aceitável apenas enquanto o uso for restrito a este usuário (ver constraint abaixo).

## Constraints

- O app continua sendo um app Electron com `electron-builder`; não vira uma aplicação web hospedada.
- A ativação/licença (`electron/activation.ts`) não muda.
- As regras de negócio do IBJJF já implementadas (`electron/brackets.ts`, `electron/pdf.ts`) devem continuar produzindo o mesmo resultado — a migração é de persistência, não de regras.
- `torneio-ativo.json` (qual torneio está ativo + modo `admin`/`area` na máquina) é **estado por dispositivo**, não dado compartilhado do torneio — isso já é assim hoje (é um arquivo separado do JSON do torneio) e deve continuar local a cada PC, mesmo depois da migração. Cada PC escolhe independentemente qual torneio está rodando e em qual modo.
- O arquivo JSON local (`torneios/{id}.json`) continua existindo e sendo a gravação imediata de toda operação, exatamente como hoje — não é removido nem relegado a "backup". O Firestore é sincronizado **em cima** dessa gravação local, nunca no lugar dela.
- Como o app pode vir a ser instalado por outras academias/organizadores no futuro, as Firestore Security Rules desta fase devem no mínimo exigir autenticação (mesmo anônima) para qualquer leitura/escrita — nunca deixar o banco aberto a qualquer um na internet sem nenhuma autenticação. A falta de isolamento *entre* organizadores autenticados é um risco aceito nesta fase (ver anti-goals e follow-up), não a falta de autenticação alguma.

## Decisões já tomadas (o "como")

1. **Firebase JS SDK (modular, v9+) rodando no processo renderer (React)**, não no processo main. Isso não é só convenção — o cache offline do Firestore (`persistentLocalCache`) depende de IndexedDB, que existe no renderer (ambiente de navegador) mas não no processo main do Electron (ambiente Node puro). Então o renderer é onde o SDK do Firestore precisa rodar para a persistência offline funcionar de verdade.
2. **O armazenamento local local deixa de ser um único arquivo por torneio e passa a espelhar 1:1 a estrutura de coleções do Firestore** (decisão do usuário): em vez de `torneios/{id}.json` com tudo dentro, a pasta local passa a ter um arquivo por registro, no mesmo formato de "tabela"/coleção do Firestore:
   ```
   userData/data/torneios/{torneioId}/_torneio.json           (metadados do torneio)
   userData/data/torneios/{torneioId}/atletas/{atletaId}.json
   userData/data/torneios/{torneioId}/arbitros/{arbitroId}.json
   userData/data/torneios/{torneioId}/areas/{areaId}.json
   userData/data/torneios/{torneioId}/chaves/{chaveId}/_chave.json
   userData/data/torneios/{torneioId}/chaves/{chaveId}/lutas/{lutaId}.json
   userData/data/torneios/{torneioId}/lutasCasadas/{lutaCasadaId}.json
   ```
   Isso é uma mudança real em `electron/*.ts` (não é só "adicionar uma chamada ao lado" como uma versão anterior deste documento dizia) — o `loadTorneio`/`saveTorneio` de hoje, que lê/escreve o blob inteiro, precisa virar leitura/escrita por arquivo individual. Em compensação, isso resolve dois problemas de uma vez: (a) a sincronização com o Firestore vira um mapeamento direto arquivo↔documento, sem precisar "traduzir" um blob local para documentos remotos; e (b) dois registros diferentes (ex.: duas lutas de chaves diferentes) nunca mais disputam o mesmo arquivo, mesmo no uso 100% local sem Firebase — reduz o risco de corrupção por escrita concorrente também offline.
3. **Timestamp obrigatório em toda alteração, sem exceção, como mecanismo único de resolução de conflito.** Toda escrita — local ou no Firestore, em qualquer entidade (torneio, atleta, árbitro, área, chave, luta, luta casada) — precisa atualizar um campo `updatedAt` (ISO 8601) no momento exato da gravação, nunca copiado de um valor antigo nem deixado de fora. Isso já existe no tipo `Luta`/`Chave` (`src/types/bracket.ts`) e em boa parte das outras entidades (padrão de soft-delete com `createdAt`/`updatedAt`/`deletedAt`); o plano precisa **auditar todo handler de escrita em `electron/*.ts` e confirmar que nenhum caminho grava sem atualizar esse campo** — é o requisito que torna seguro decidir "quem ganha" quando dois PCs editaram o mesmo registro offline e sincronizam depois (mesma lógica de merge por `updatedAt` que já existe em `import-tournament`, agora aplicada por arquivo/documento individual em vez de array inteiro).
5. **Recebendo mudanças de outro PC**: o renderer escuta o Firestore (`onSnapshot`) por mudanças feitas em outras máquinas e, ao receber uma, chama o IPC local equivalente (ex.: `updateAthlete`) para gravar essa mudança também no arquivo local correspondente — comparando `updatedAt` antes de sobrescrever, igual à lógica de merge que já existe hoje em `import-tournament`, só que agora por arquivo individual em vez de documento único.
6. **Persistência offline do Firestore ativada** (`initializeFirestore` com cache local persistente) — garante que, enquanto há algum caminho de rede (ainda que fraco/intermitente), o SDK sincroniza sozinho assim que a rede permitir, sem o app precisar reimplementar fila de sincronização na mão. Quando não há rede nenhuma, essa fila simplesmente não consegue entregar nada a lugar nenhum — é o cenário já coberto pelo JSON local continuar funcionando normalmente (ver "Intenção e por quê").
7. **Modelo de coleções no Firestore, espelhando 1:1 a estrutura de arquivos locais do item 2**:
   - `torneios/{torneioId}` → metadados (nome, data, categoriasDesabilitadas, categoriasCustomizadas, startedAt, createdAt, updatedAt).
   - `torneios/{torneioId}/atletas/{atletaId}`
   - `torneios/{torneioId}/arbitros/{arbitroId}`
   - `torneios/{torneioId}/areas/{areaId}`
   - `torneios/{torneioId}/chaves/{chaveId}` (metadados da chave: categoria, status, posições, árbitro)
   - `torneios/{torneioId}/chaves/{chaveId}/lutas/{lutaId}` — cada luta é seu próprio documento, não um array embutido dentro da chave (achado do revisor do design: se a chave guardasse `lutas` como array dentro do próprio documento, duas máquinas offline registrando resultados diferentes na mesma chave ao mesmo tempo correriam risco real de uma sobrescrever a outra quando reconectassem, já que o Firestore resolve conflito por documento inteiro, não faz merge de arrays).
   - `torneios/{torneioId}/lutasCasadas/{lutaCasadaId}`

   Motivo: cada tela hoje só precisa de uma fatia dos dados (ex.: `PlacarChaves` só precisa das chaves de uma área) — com subcoleções, cada tela escuta (`onSnapshot`) só o que usa, em vez de reprocessar tudo a cada mudança mínima. Como o item 2 já faz o armazenamento local espelhar essa mesma estrutura arquivo-por-registro, o mapeamento entre JSON local e Firestore é direto: cada arquivo corresponde a exatamente um documento.
8. **Autenticação por torneio via custom token, não apenas anônima aberta** (ajustado após o desenho do painel de chamada web, que precisava de algo parecido e expôs essa inconsistência): toda sessão — Electron ou o site de chamada — se autentica recebendo um **custom token do Firebase com uma claim `torneioId`**, emitido por uma função de servidor (ver `2026-10-18-painel-chamada-web-qrcode-design.md`, decisão 2). As regras do Firestore exigem `request.auth != null && request.auth.token.torneioId == <segmento torneioId do caminho>` em vez de só `request.auth != null`. Para o Electron (app confiável, já instalado), a própria aplicação pede o token diretamente pelo `torneioId` que já tem localmente, sem precisar de código digitado. Isso já dá um nível básico de isolamento por torneio (uma sessão só consegue ler/escrever o torneio para o qual foi autorizada) **sem ser um sistema de contas de organizador** — não identifica *quem* é a pessoa, só *qual torneio* ela pode tocar. Login real por organizador continua como follow-up explícito (ver seção final), mas esse ajuste reduz parte do risco de "qualquer instalação vê os torneios de todo mundo" mencionado antes.
9. **Ferramenta de migração única** para quem já tem torneios só no formato JSON local sem nunca ter sincronizado: uma ação "Enviar torneios locais para a nuvem" na tela de listagem de torneios, reaproveitando a lógica de merge por `updatedAt` que já existe em `import-tournament`, só que escrevendo no Firestore em vez de/além do JSON.
10. **A janela do telão continua recebendo dados via IPC local** (`enviar-dados-placar-telao`), sem envolver o Firebase — é a mesma máquina, não precisa de rede.
11. **Config do Firebase fornecida pelo usuário** (projeto `bjj-tournament-manager-setup` já existe):
   ```
   apiKey: AIzaSyCsvRes9o2yh63500vMYr6P8NajVX8NTgI
   authDomain: bjj-tournament-manager-setup.firebaseapp.com
   projectId: bjj-tournament-manager-setup
   storageBucket: bjj-tournament-manager-setup.firebasestorage.app
   messagingSenderId: 1020504269164
   appId: 1:1020504269164:web:cb4863970c55eb58f41349
   ```
   Esses valores de config web do Firebase não são segredo (vão embutidos no app de qualquer forma; a segurança real vem das Firestore Security Rules, não de esconder essa config) — mesmo assim, por organização, o plano deve colocá-los em variáveis de ambiente (`VITE_FIREBASE_*` + `.env.local` fora do git) em vez de hardcoded direto no código, para facilitar trocar de projeto (ex.: ambiente de teste) no futuro.

## O que fica para o plano de implementação decidir

- Redação final das Firestore Security Rules (baseline: exigir auth anônimo, sem isolamento por dono ainda).
- Exatamente quais dos ~50 métodos hoje expostos em `electron/preload.ts` ganham uma chamada Firestore equivalente no renderer (provavelmente todos os que hoje persistem dado de torneio: atletas, árbitros, áreas, categorias, chaves/lutas, lutas casadas) versus quais não precisam (ativação, PDF, telão — já fora do escopo).
- Reescrita de `loadTorneio`/`saveTorneio`/`getTorneioPath` e equivalentes em cada arquivo de `electron/*.ts` para ler/escrever arquivo-por-registro (item 2) em vez do blob único — inclui decidir a estratégia de escrita atômica por arquivo (ex.: escrever em `.tmp` + rename) já que agora há muito mais arquivos sendo escritos individualmente.
- Auditoria de todos os tipos (`src/types/*.ts`) e handlers de escrita para confirmar que **toda** entidade (não só `Luta`/`Chave`, que já têm `updatedAt`) tem o campo e que nenhum caminho de código grava um registro sem atualizá-lo — isso inclui conferir `Torneio`, `Atleta`, `Arbitro`, `AreaLuta`, `LutaCasada`, `CategoriaCustomizada`.
- Como o app detecta "voltou a ter rede" para disparar a sincronização de forma visível ao usuário (ex.: indicador discreto de status de sincronização na tela), já que hoje não existe esse feedback.
- Resolução de conflito quando o mesmo registro (ex.: mesmo atleta) é editado em dois PCs offline ao mesmo tempo e ambos sincronizam depois — reaproveitar o merge por `updatedAt` que já existe, mas o plano precisa confirmar que isso cobre também o caso de dados vindos do Firestore (não só JSON-para-JSON como hoje).
- Migração do formato de arquivo único (`torneios/{id}.json`) para o novo formato arquivo-por-registro para torneios já existentes em disco, antes mesmo de qualquer sincronização com a nuvem.
- Onde e como a UI de migração ("enviar torneios locais para a nuvem") aparece, para quem tem torneios antigos nunca sincronizados.
- Plano de teste específico para os cenários de conectividade: zero rede o tempo todo (sem sync, sem perda local), rede intermitente (sincroniza quando aparece), e dois PCs editando a mesma coisa offline ao mesmo tempo.

## Follow-up explícito (não entra agora, mas vira pré-requisito antes de distribuir o app)

- **Login por organizador (Firebase Auth com e-mail/Google) + regras de segurança filtrando por dono.** Diferente de quando este documento foi escrito pensando em uso só pessoal, o usuário confirmou que o app pode ser compartilhado com outras academias/organizadores no futuro. Com autenticação só anônima, todo instalador do app cairia no mesmo banco e qualquer pessoa veria/editaria os torneios de qualquer outra — isso é aceitável apenas enquanto o uso for restrito a este usuário. **Antes de entregar o app para qualquer outra pessoa/academia, este item precisa ser resolvido primeiro**, não depois.
