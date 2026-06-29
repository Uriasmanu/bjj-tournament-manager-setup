# BJJ Tournament Manager

## 1. Visão Geral

O **BJJ Tournament Manager** é um software desktop desenvolvido para gerenciamento completo de campeonatos de Jiu-Jitsu.

O sistema é responsável por controlar todas as etapas do evento, desde o cadastro dos participantes até a definição dos campeões de cada categoria, incluindo gerenciamento de chaves, acompanhamento de lutas em tempo real, placares, árbitros, áreas de luta e resultados.

O objetivo é fornecer uma solução centralizada para organizadores, árbitros e equipes, reduzindo erros operacionais e agilizando a condução dos campeonatos.

---

## 3. Regras de Negócio

### 3.0. Bloqueio de Atribuição de Itens Soft-Deleted

Itens com `deletedAt != null` (soft-deleted) são considerados **inativos** e não podem ser atribuídos a outros itens do sistema:

- **Atletas soft-deleted** não são incluídos na geração de chaves — nem na geração em massa (`gerarTodasChavesHandler`) nem na geração individual (`gerar-chave`). Backend filtra `deletedAt == null` ao carregar atletas dos handlers. Frontend já utiliza `loadAthletes()` que filtra.
- **Árbitros soft-deleted** não são atribuídos a chaves — nem na atribuição automática (`autoAtribuirArbitros`) nem na manual (`atribuirArbitroHandler`). Backend filtra/valida em ambos os fluxos.
- **Árbitros soft-deleted** não podem ser vinculados a áreas de luta — `checkRefereeNotInUse` valida que todos os `arbitroIds` referenciam árbitros ativos antes de salvar/atualizar uma área.

Itens restaurados (possuem `deletedAt` limpo via `restoreAthlete`/`restoreArbitro`/`restoreArea`) voltam a ser elegíveis automaticamente.
### 3.1. Torneio

- **Entidade raiz do sistema:** Para acessar qualquer funcionalidade administrativa (atletas, chaves, categorias), é necessário primeiro **iniciar um torneio** (defini-lo como ativo).
- **Múltiplos torneios:** O sistema suporta múltiplos torneios simultaneamente, cada um armazenado em arquivo JSON individual no diretório `{userData}/data/torneios/`.
- **Torneio ativo:** Apenas um torneio pode estar ativo por vez. O ID do torneio ativo é armazenado em `{userData}/data/torneio-ativo.json`.
- **Título do torneio:** Se o campo `nome` for preenchido, o título exibido é o nome informado. Caso contrário, o título é "Torneio {data}" no formato `dd/MM/yyyy`.
- **Data futura:** A data do torneio deve ser posterior ao dia atual (dia atual e passados são rejeitados).
- **ID único:** Cada torneio recebe um UUID v4 gerado no momento da criação (`crypto.randomUUID()` no main process).
- **Persistência imediata:** O arquivo JSON do torneio é criado no momento da confirmação do formulário ou da importação.

### 3.2. Criação de Torneio

- **Acesso sem torneio ativo:** A página de criação (`/admin/criar-torneio`) e importação (`/admin/importar-torneio`) são acessíveis mesmo quando não há torneio ativo. O `AreaGuard` não protege essas rotas, permitindo a criação do primeiro torneio.
- Campo `nome` é opcional (string vazia se não informado).
- Campo `data` é obrigatório e deve ser uma data futura (rejeita dia atual e passados).
- Data é armazenada em ISO (`YYYY-MM-DD`) e exibida no formato brasileiro (`DD/MM/YYYY`).
- Utiliza `dayjs` para comparação de datas e formatação.
- Após criar com sucesso, o usuário é redirecionado para a listagem de torneios (`/admin/listar-torneios`).
- O formulário (`CriarTorneio.tsx`) usa `@mantine/form` com `mode: 'uncontrolled'`.
- O botão "Criar Torneio" exibe estado de loading durante a submissão do formulário.

### 3.3. Importação de Torneio

- Apenas arquivos com extensão `.json` são aceitos (filtro nativo do diálogo).
- O arquivo deve conter os campos obrigatórios: `id` e `data` (validação no import). `nome` é opcional.
- **Importação com merge por `updatedAt` (last-write-wins):** o handler `import-tournament` (único caminho de importação) unifica os dados do JSON com o estado do torneio em disco, quando o `id` do torneio já existir. A regra é **last-write-wins por `updatedAt`**:
  - Para cada sub-array (`atletas`, `arbitros`, `areas`, `chaves`, `lutasCasadas`), o item é identificado pelo seu `id`. Itens com mesmo `id` em ambos os lados são resolvidos pelo `updatedAt` mais recente (string ISO 8601 — comparação lexicográfica equivalente a cronológica).
  - Itens com `id` presente em um único lado são preservados.
  - **Delete recente vence:** como `delete*`/`restore*` setam `updatedAt = new Date().toISOString()` junto com `deletedAt`, basta comparar `updatedAt`. Se o item vencedor tem `deletedAt != null`, o item permanece (ou passa a estar) deletado no resultado.
  - **Top-level do torneio:** `nome` e `data` seguem o lado com `updatedAt` mais recente. O `updatedAt` do torneio mergeado é `max(existing.updatedAt, incoming.updatedAt)`. O `createdAt` é preservado do existing. O `startedAt`, se já existir no existing, é mantido (evento único); caso contrário, é copiado do incoming.
   - **Todos os sub-arrays têm `updatedAt` próprio:** `chaves` e `lutasCasadas` também possuem `updatedAt` por item. A mesclagem usa `mergeById` (last-write-wins por item) para todos os sub-arrays — `atletas`, `arbitros`, `areas`, `chaves` e `lutasCasadas` — de forma consistente. Chaves não possuem `deletedAt` (não têm soft-delete), portanto o contador `removed` para chaves é sempre zero.
- **Preservação de identidade na importação:** o backend preserva `id`, `createdAt`, `updatedAt`, `deletedAt`, `emChave` e demais campos dos sub-itens. Apenas `nome` e `equipe` de atletas/árbitros são normalizados (`trim().toLowerCase()`). Itens sem `id` recebem `crypto.randomUUID()`. Itens sem `createdAt`/`updatedAt` recebem o `now` da importação.
- **Auto-fix retroativo:** JSONs legados sem o campo `deletedAt` em atletas/árbitros/áreas continuam funcionando (o auto-fix dos handlers `load*` preenche `deletedAt: null` ao carregar). O merge trata `deletedAt` ausente como `null` na comparação.
- **Remoção do caminho destrutivo:** o handler `import-tournament-overwrite` foi removido. Não há mais modal de "Sobrescrever Torneio" na UI. Se o usuário precisar descartar o torneio local e reimportar do zero, ele usa `delete-tournament` e depois importa o JSON novamente.
- **Retorno do handler `import-tournament`:** `{ success: true; merged: boolean; created: number; updated: number; kept: number; removed: number }`.
  - `merged: false` → torneio novo (id não existia no disco). Contadores zerados.
  - `merged: true` → torneio já existia; contadores somam todos os sub-arrays.
  - `created` → sub-itens adicionados (presentes no incoming, ausentes no existing).
  - `updated` → sub-itens sobrescritos pelo lado mais recente.
  - `kept` → sub-itens que só existiam no existing (preservados).
  - `removed` → sub-itens que se tornaram `deletedAt != null` como resultado do merge (estavam ativos no existing e o incoming trouxe a versão deletada, mais recente).
- **Notificações no renderer (em `ImportarTorneio.tsx`):**
  - Torneio novo: `"Torneio importado com sucesso!"` (verde).
  - Merge: `"Torneio mesclado: X adicionado(s), Y atualizado(s), Z mantido(s)."` (verde).
  - Se `removed > 0`: segunda notificação amarela `"W item(ns) marcados como deletados (delete recente prevaleceu)."`.
  - Erro de validação: `"Arquivo inválido. Estrutura de torneio não reconhecida."` (vermelho).
- Após importar com sucesso, o usuário é redirecionado para a listagem de torneios.
- A importação é feita via upload de arquivo (não diálogo nativo), com leitura do conteúdo via `FileReader` e envio ao IPC.

### 3.4. Exportação de Torneio

- Abre diálogo nativo "Salvar como" para o usuário escolher o destino.
- Gera uma cópia exata do arquivo JSON do torneio via `fs.copyFileSync`.
- Nome padrão sugerido: `{nome}_Torneio_{data}.json` com caracteres especiais substituídos por `_`.

### 3.5. Inicialização de Torneio (Iniciar)

- Ao clicar em "Iniciar" (`IconPlayerPlay`) na listagem de torneios, um modal é exibido com duas opções: **Administrador** e **Área de Luta**.
- **Modo Administrador:** inicia o torneio no modo `admin`, escreve `{ id, mode: "admin" }` em `{userData}/data/torneio-ativo.json`, e redireciona para o Dashboard (`/admin/dashboard`) com acesso total a todas as funções administrativas.
- **Modo Área de Luta:** inicia o torneio no modo `area`, escreve `{ id, mode: "area" }` em `{userData}/data/torneio-ativo.json`, e redireciona diretamente para o PlacarMenu (`/admin/placar`).
- **Navegação restrita (modo área):** o operador de área só pode acessar:
  - Menu Inicial (`/`)
  - Dashboard (`/admin/dashboard`) — versão reduzida com apenas cards "Resultados" e "Placar"
  - Placar (`/admin/placar` e sub-rotas `/admin/placar/chaves/:areaId`, `/admin/placar/chave/:areaId/:chaveId`, `/admin/placar/luta/:areaId/:chaveId/:lutaId`, `/admin/placar/luta-casada/:areaId/:lutaCasadaId`)
- **Rotas bloqueadas (modo área):** qualquer tentativa de navegar para `/admin/atletas`, `/admin/arbitros`, `/admin/areas`, `/admin/categorias/chaves`, `/admin/equipes`, `/admin/lutas-casadas`, `/admin/criar-torneio`, `/admin/importar-torneio`, `/admin/listar-torneios` redireciona automaticamente para `/admin/placar`.
- **Persistência do modo:** o modo escolhido é armazenado em `torneio-ativo.json` e consultado via IPC `get-tournament-mode`. O modo é preservado entre reinicializações do app.
- **Busca na listagem:** campo de busca textual que filtra os torneios por nome ou data em tempo real. Exibe mensagem "Nenhum torneio encontrado para a busca {termo}" quando não há resultados.
- Apenas um torneio pode estar ativo por vez (iniciar um novo substitui o anterior no arquivo).
- Registra o timestamp `startedAt` no JSON do torneio no momento do Play (`new Date().toISOString()`).
- O badge "Iniciado {data}" é exibido no Dashboard para torneios com `startedAt` preenchido.

### 3.6. Dashboard Administrativo

- O Dashboard é a tela central de administração do torneio ativo, acessível via `/admin/dashboard`.
- Ao carregar, obtém o torneio ativo via IPC `get-active-tournament`.
- **Header do Dashboard** exibe:
  - Nome e data do torneio.
  - Badge "Iniciado {data}" com dot pulsante se `startedAt` existir.
  - Stats rápidos à direita: total de **Atletas** e total de **Equipes** (cards com número grande e label uppercase).
- Contém um **hero banner** com fundo sólido `#1b325f`, badge "Painel Geral", título e descrição do painel.
- Cards de navegação em layout **Grid** responsivo (1 coluna <700px, 2 colunas <1000px, 2 colunas <1400px, 3 colunas <1800px, 4 colunas ≥1800px).
- Cada card possui: ícone em container circular com cor vibrante, título, descrição, badge de contagem informativa no rodapé, link "Acessar →" com hover effect (translateX).
- Cards de funcionalidades implementadas: clicáveis com hover (translateY(-2px)), opacidade 1.
- Cards de funcionalidades não implementadas: opacidade 0.5, cursor `not-allowed`, badge "Em breve".
- **Habilitação por dependência de dados:** Cards são habilitados/desabilitados dinamicamente conforme a existência de dados dependentes no torneio:
  - **Atletas:** sempre habilitado
  - **Equipes:** habilitado quando houver pelo menos 1 atleta
  - **Árbitros:** habilitado quando houver pelo menos 1 atleta
  - **Áreas de Luta:** habilitado quando houver pelo menos 1 árbitro
  - **Lutas Casadas:** habilitado quando houver pelo menos 1 área de luta
  - **Geração de Chaves:** habilitado quando houver pelo menos 1 área de luta
  - **Placar:** habilitado quando houver pelo menos 1 chave gerada
  - **Resultados:** habilitado quando houver pelo menos 1 chave gerada
- Cards desabilitados exibem `opacity: 0.5`, `cursor: not-allowed` e tooltip explicativo ao hover.
- **Sidebar de navegação** (opcional em telas largas): fundo marinho, links com ícones para todas as seções, active tab com destaque e borda esquerda azul.
- Card "Atletas" navega para `/admin/atletas` (menu intermediário) e exibe contagem de inscritos.
- Card "Equipes" navega para `/admin/equipes` e exibe número de academias.
- Botão "Voltar": ícone de seta que retorna ao Menu Inicial (`/`).

### 3.7. Exclusão de Torneio

- Cada torneio na listagem exibe botão "Excluir" (ícone de lixeira) com `ActionIcon` vermelho.
- Ao clicar, abre modal de confirmação: "Deseja realmente excluir o torneio **{nome}**? Esta ação não pode ser desfeita."
- Se confirmado, o arquivo JSON é removido do diretório `{userData}/data/torneios/` via `fs.unlinkSync`.
- Se o torneio excluído for o torneio ativo, o arquivo `torneio-ativo.json` também é removido.
- Notificação verde de sucesso e listagem recarregada.
- Modal usa `useDisclosure` para controle de abertura.

### 3.8. Atletas (Implementado)

- **Menu intermediário:** Ao clicar no card "Atletas" no Dashboard, navega para `/admin/atletas` que renderiza `AthletesMenu` — um menu com 3 cartões:
  - **Cadastrar Atleta** — Abre o modal `AthleteForm` diretamente na mesma página para criar um novo atleta.
  - **Listar Atletas** — Navega para `/admin/atletas/lista` (tela `AdminAthletes` com tabela CRUD).
  - **Importar Atletas** — Dispara o diálogo nativo de seleção de arquivo JSON via IPC `import-athletes`.
- **Tela de listagem (`/admin/atletas/lista`):** Exibe `AdminAthletes` com:
  - Botões "Importar" (arquivo .json), "Exportar JSON" e "Cadastrar" no topo.
  - Campo de busca textual + filtro por faixa.
  - Card de estatísticas: total de inscritos + grid de distribuição por faixas.
  - Tabela com colunas: Nome, Equipe, Faixa (círculo colorido), Categoria, Idade, Ações (editar/excluir). Ordenada alfabeticamente por nome do atleta.
  - Empty state com "Nenhum atleta cadastrado" + botão "Cadastrar primeiro atleta".
  - Empty state de busca com ícone e texto "Nenhum atleta encontrado".
  - Ações por linha: lápis (editar) e lixeira (excluir).
  - Botão "Voltar" retorna para `/admin/atletas` (menu), não para o Dashboard.
- **Modal de formulário:** `AthleteForm.tsx` usa `@mantine/form` com **modo controlado** (`mode: 'controlled'`). Cada campo recebe os props diretamente de `form.getInputProps(path)`. O `useEffect` de inicialização do formulário depende apenas de `opened` e `athlete` (não de `form`) para evitar loop de re-renderização.
- **Botão de submit padronizado:** o botão de submit do modal (`Cadastrar Atleta` no modo novo / `Salvar Alterações` no modo edição) adota o padrão visual primário do app: `backgroundColor: '#1b325f'`, texto branco, `borderRadius: 12`, ícone `IconUserPlus` à esquerda (`leftSection`, tamanho 16), hover `backgroundColor: '#3a89c9'`. Não usa padding custom nem `borderRadius: 8` (ver `spec/athlete-form-botao-cadastrar-visual.md`).
- **Layout em colunas:** os campos `Gênero` (`Select`) e `Peso (kg)` (`NumberInput`) são renderizados **lado a lado** dentro de um `<Group grow gap="md">` (Mantine), ocupando larguras equivalentes. A ordem é `[Gênero, Peso]` (esquerda → direita). Demais campos (Nome, Equipe, Faixa, Categoria, Ano de Nascimento) permanecem em linhas separadas (ver `spec/athlete-form-peso-genero-lado-a-lado.md`).
- Nome e equipe são obrigatórios (mínimo 2 caracteres) e armazenados em minúsculo (`.trim().toLowerCase()` no submit).
- Gênero é obrigatório: `Select` com opções `Masculino` / `Feminino`.
- Categoria IBJJF é obrigatória: `Select` populado com `CATEGORIAS_IBJJF`. Na **criação**, filtra dinamicamente por faixa etária (calculada da idade), gênero e faixa do atleta. Na **edição**, filtra apenas por gênero, permitindo ao administrador escolher livremente entre todas as categorias do gênero selecionado. O label de cada opção exibe o limite de peso, ex.: `"Adulto Masculino Leve (até 76,0 kg)"`.
- Peso deve estar entre 1 e 300 kg.
- Faixa segue enum: infantil (branca, cinza, amarela, laranja, verde) e adulto (branca, azul, roxa, marrom, preta).
- Ano de nascimento entre 1920 e ano atual.
- Idade é calculada dinamicamente (`ano atual - anoNascimento`), não persistida.
- **Duplicata:** Um atleta é considerado duplicata quando possui o mesmo **nome** (case-insensitive, trimmed) **e** mesmo **ano de nascimento**. A verificação ocorre:
  - No renderer (`AdminAthletes.tsx:handleSave`) antes do IPC, tanto para cadastro quanto para edição (ignorando o próprio `id`).
  - No main process (`athletes.ts:importAthletesFromFile`) durante importação em massa.
  - No main process (`tournament.ts:import-tournament`) durante importação/merge de torneio com atletas — atletas duplicados por `id` são resolvidos por `updatedAt` (last-write-wins), preservando o item mais recente; atletas sem `id` no JSON recebem novo UUID e são adicionados.
- **Exclusão em lote:** Na tela de listagem, cada linha possui um checkbox. O cabeçalho possui um checkbox "Selecionar todos" com estado indeterminado para seleção parcial. Com um ou mais atletas selecionados, um botão "Excluir Selecionados (N)" aparece no topo. A exclusão em lote é feita via IPC `delete-athletes`, que remove todos os atletas em uma única operação de leitura/escrita do arquivo JSON.
- **Armazenamento por torneio:** Atletas são armazenados dentro do JSON do torneio (campo `atletas: Atleta[]`), não mais em arquivo global. Cada torneio possui sua própria lista exclusiva.
- **Torneio ativo obrigatório:** Para cadastrar, editar, excluir ou importar atletas, é necessário que haja um torneio ativo. Caso contrário, o handler IPC lança erro `"Nenhum torneio ativo"` exibido como notificação vermelha.
- **Sincronia imediata:** Qualquer operação CRUD sobre atletas lê e escreve diretamente no arquivo JSON do torneio ativo (`torneios/{id}.json`), atualizando o timestamp `updatedAt` do torneio.
- **Auto-fix silencioso ao carregar (`loadAthletes`):** Se um atleta carregado do JSON estiver sem `id`, `createdAt` ou `updatedAt`, esses campos são gerados automaticamente (`crypto.randomUUID()` para `id`, `new Date().toISOString()` para timestamps). Se alguma correção for aplicada, o arquivo do torneio é reescrito silenciosamente.
- **`saveAthlete` — auto-geração e proteção contra duplicatas:** Se o atleta enviado não possuir `id`, um novo UUID é gerado (`crypto.randomUUID()`). Se não possuir `createdAt`, o timestamp atual é atribuído. `updatedAt` é sempre substituído pelo timestamp atual. Se o `id` já existir na lista, o atleta é atualizado em vez de inserido (proteção contra duplicatas).
- **`updateAthlete` — substituição completa:** A atualização substitui o objeto do atleta por completo no índice correspondente (não é uma mesclagem parcial). Preserva `createdAt` e `deletedAt` do item anterior; atualiza `updatedAt`.
- **Exclusão sem verificação de chaves:** A exclusão de atletas (`deleteAthlete`, `deleteAthletes`) não verifica se o atleta está alocado em alguma chave — o atleta pode ser removido mesmo estando em uma chave.
- **Soft delete (`deleteAthlete`/`deleteAthletes`):** em vez de remover fisicamente do JSON, a operação seta `deletedAt = new Date().toISOString()` no item e atualiza `updatedAt` do torneio. Itens com `deletedAt != null` ficam ocultos de `loadAthletes` e de todas as listagens do app. O `updatedAt` do torneio também é atualizado.
- **Restore (`restoreAthlete`):** nova operação disponível via IPC `restore-athlete` que seta `deletedAt = null` no item e devolve o atleta às listagens ativas.
- **Lixeira — visualizar (`loadDeletedAthletes`):** a tela de listagem `AdminAthletes` exibe um `Switch` "Mostrar apenas os deletados" posicionado na barra de busca/filtros (acima da tabela). O título, o subtítulo, os botões "Importar", "Exportar JSON" e "Cadastrar Atleta", o card "Inscritos" e o painel "Graduações (Faixas)" **permanecem visíveis** em ambos os estados do toggle — apenas a tabela (e seus derivados: coluna "Deletado em", ações de restaurar/excluir permanentemente, botão "Excluir Selecionados", filtro de faixa) muda de conteúdo. A cor do Switch é o azul padrão do tema (não `red`); `selectedIds` é resetado ao alternar.
- **Toggle dinâmico (sem flash de loading):** no mount da página, `AdminAthletes` carrega **ambas** as listas em paralelo via `Promise.all([loadAthletes(), loadDeletedAthletes()])` e armazena em dois estados (`activeAthletes` e `deletedAthletes`). A lista renderizada é derivada: `athletes = showDeleted ? deletedAthletes : activeAthletes` (memoizada). Alternar o `Switch` é **puramente local** — sem IPC, sem `setLoading(true)`, sem remontagem da UI. Mutações (`saveAthlete`, `updateAthlete`, `deleteAthlete`, `restoreAthlete`, `permanentlyDeleteAthlete*`) usam o retorno do IPC para atualizar `activeAthletes` e fazem update local em `deletedAthletes` (adição/remoção) em vez de chamar `loadList()`. `handleImport` (operação em massa) ainda chama `loadAll()` para ressincronizar ambos os estados.
- **Lixeira — restaurar (`restoreAthlete` por linha):** na view deletados, cada linha exibe `ActionIcon` verde com `IconRestore` que chama `restoreAthlete` diretamente (sem modal — ação não destrutiva). Notificação verde "Atleta restaurado com sucesso!" e lista recarregada via `loadDeletedAthletes`.
- **Lixeira — excluir permanentemente (`permanentlyDeleteAthlete` por linha):** na view deletados, cada linha exibe `ActionIcon` vermelho com `IconTrash` que abre modal centralizado "Excluir Permanentemente" com aviso "Esta ação é IRREVERSÍVEL." em vermelho + texto dinâmico com nome do atleta + botões "Cancelar" / "Excluir Permanentemente" (vermelho). Confirmação dispara IPC `permanently-delete-athlete` (remove fisicamente do JSON) e recarrega a lista.
- **Lixeira — exclusão permanente em lote:** checkbox de seleção por linha + checkbox "Selecionar todos" com estado indeterminado. Com N≥1 selecionados, botão "Excluir Permanentemente (N)" aparece no topo (entre filtros e tabela), abrindo modal de confirmação em lote (mesmo padrão visual da exclusão individual, texto dinâmico com quantidade). Confirmação dispara IPC `permanently-delete-athletes` em operação única.
- **Tabela com coluna "Deletado em":** na view deletados, coluna extra exibe `formatDeletedAt(deletedAt)` no formato `dd/MM/yyyy HH:mm`. Ações mudam de `[editar, soft-deletar]` para `[restaurar, excluir permanente]`.
- **Modal de soft delete — texto atualizado:** o modal de confirmação de exclusão (visível na view ativos) teve seu texto alterado de "Esta ação não pode ser desfeita." para "será movido para os deletados. Você poderá restaurá-lo na aba 'Mostrar apenas os deletados'." — refletindo o novo comportamento de soft delete.
- **Campo `deletedAt`:** presente em `Atleta`, `Arbitro` e `AreaLuta` como `string | null` opcional. Ausência é tratada como `null` (item ativo). Auto-fix ao carregar preenche `deletedAt: null` em itens legados que não tenham o campo.
### 3.9. Equipes — Resumo no Dashboard

- **Funcionalidade somente leitura:** A tela de Equipes não permite cadastro, edição ou exclusão de equipes. Ela exibe um resumo agregado a partir dos dados existentes dos atletas.
- **Fonte dos dados:** os dados são obtidos exclusivamente do campo `equipe` de cada atleta no JSON do torneio ativo (`torneio.atletas[].equipe`).
- **Agrupamento:** o sistema percorre a lista de atletas e agrupa por `equipe`, contando quantos atletas pertencem a cada equipe.
- **Ordenação:** as equipes são exibidas em ordem alfabética crescente pelo nome da equipe.
- **Busca:** campo de busca textual no topo da tela que filtra as equipes por nome em tempo real. Exibe mensagem "Nenhuma equipe encontrada para a busca {termo}" quando não há resultados.
- **Normalização:** O campo `equipe` é armazenado em lowercase (ex.: `"gracie barra"`). Na exibição, o nome da equipe é apresentado com capitalização (`text-transform: capitalize`).
- **Cards de resumo:** exibe dois badges no topo: total de atletas e total de equipes distintas.
- **Empty state:** se não houver atletas cadastrados, exibe ícone, mensagem "Nenhum atleta cadastrado" e botão para navegar ao cadastro de atletas.
- **Acesso:** o card "Equipes" no Dashboard está ativo (opacidade 1, clicável) e navega para a rota `/admin/equipes`.
- **Dependência:** depende exclusivamente do módulo de Atletas — se não houver atletas, o resumo de equipes fica vazio.

### 3.10. Importação em Massa de Atletas

- **Gatilhos:** A importação pode ser disparada de dois lugares:
  - Menu de Atletas (`/admin/atletas`): cartão "Importar Atletas" no `AthletesMenu.tsx`.
  - Lista de Atletas (`/admin/atletas/lista`): botão "Importar" no header do `AdminAthletes.tsx`.
- **Formato:** Apenas arquivos `.json` são aceitos (filtro nativo do diálogo de arquivo).
- **Diálogo nativo:** Abre `dialog.showOpenDialog` do Electron com filtro `*.json`. Se o usuário cancelar, retorna `{ imported: 0, skipped: 0 }` sem notificação.
- **Validação de estrutura:**
  - O JSON raiz deve ser um **array**. Objeto, string ou número são rejeitados com erro.
  - Array vazio (`[]`) é válido — importa 0 e ignora 0.
- **Campos obrigatórios por atleta:** `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg`, `genero`, `categoria`. Todos verificados por truthy.
- **Validação de categoria:** A `categoria` informada é validada contra a lista `CATEGORIAS_IBJJF`. Se não for reconhecida, o lote inteiro é rejeitado com mensagem `"Categoria '{categoria}' não reconhecida."`.
- **Campos opcionais:** `id` — gerado automaticamente se ausente. `createdAt` e `updatedAt` são **sempre** substituídos pelo timestamp atual (momento da importação), nunca preservados do arquivo de origem.
- **Campos extras** no JSON são preservados (via `...a` spread), mas ignorados no processo.
- **Validação é fail-fast:** ao primeiro atleta com campos obrigatórios ausentes, todo o lote é rejeitado. Nenhum atleta é importado parcialmente.
- **Normalização:** `nome` e `equipe` são convertidos para `trim().toLowerCase()` antes da inserção e antes da verificação de duplicidade.
- **Deduplicação:** Um atleta é ignorado se:
  1. Seu `id` (se fornecido no arquivo) já existe na lista atual.
  2. Seu `nome` (case-insensitive, trimmed) **e** `anoNascimento` já existem combinados em algum atleta da lista.
- **Persistência:** A lista mesclada é reescrita no JSON do torneio ativo (`torneios/{id}.json` → campo `atletas`) com indentação de 2 espaços.
- **Retorno:** `{ imported: number; skipped: number }` — contagem de novos vs. ignorados.
- **Notificações no renderer:**
  - Cancelamento ou `imported=0, skipped=0`: silêncio (sem notificação).
  - Sucesso: `"X atleta(s) importado(s)."` (verde).
  - Sucesso parcial: `"X atleta(s) importado(s), Y ignorado(s) (já existentes)."` (verde).
  - Erro (arquivo inválido, JSON malformado, campos ausentes, erro de I/O): `"Erro ao importar atletas."` (vermelho).
- **Casos de borda:**
  - Duplicata no próprio arquivo de importação: o primeiro é processado, o segundo é ignorado (já existe na lista após o primeiro ser adicionado).
  - Ano de nascimento `0`: rejeitado por truthy check (`!a.anoNascimento` com `0` é falsy).
  - Nomes com espaços extras internos não são normalizados (ex.: `"joão  silva"` vs `"joão silva"` não são considerados duplicatas).

### 3.11. Geração de Chaves (Implementado)

- **Máximo configurável de atletas por chave:** O organizador pode definir o limite de atletas por chave (valores de 2 a 16) antes de gerar as chaves. O valor padrão é 16. O campo "Máximo de atletas por chave" é exibido na tela "Gerenciar Chaves" antes do botão "Gerar Chaves".
- **Reset ao gerar:** Ao clicar em "Gerar Chaves" (tanto na geração inicial quanto na regeneração), o array `chaves` do torneio é completamente resetado para `[]` antes de gerar as novas chaves. Todos os dados anteriores (resultados de lutas, vencedores, status) são descartados. Os flags `emChave` dos atletas também são recalculados do zero.
- **Distribuição automática:** O sistema preenche cada chave até atingir o limite configurado, criando novas chaves conforme necessário. A última chave pode ter menos atletas, however não pode ficar com apenas 1 atleta. Se a última chave resultar com apenas 1 atleta, o sistema remove 1 atleta da chave anterior e move para a última, garantindo que nenhuma chave tenha apenas 1 atleta e que nenhuma ultrapasse o limite máximo definido.
  - Exemplos (limite = 6): 15 atletas → [6, 6, 3]; 13 atletas → [6, 5, 2] (ajuste automático); 19 atletas → [6, 6, 5, 2] (ajuste automático).
- **Tamanhos suportados:** O gerador aceita chaves com 2 a 16 atletas. Estruturas: 2 (1 luta), 3 (3 lutas, repescagem), 4 (3 lutas), 5 (6 lutas), 6 (7 lutas, quartas com byes + semifinais + final), 7-15 (geral, eliminação simples com byes automáticos), 16 (15 lutas). Para tamanhos 7-15 (exceto 9, 10, 11, 12, 13, 14 e 15), o sistema usa `gerarLutasGeral()` que gera uma bracket de eliminação simples com byes automáticos. Para 9 atletas, usa `gerarLutasNove()` (12 lutas). Para 10 atletas, usa `gerarLutasDez()` (13 lutas). Para 11 atletas, usa `gerarLutasOnze()` (15 lutas). Para 12 atletas, usa `gerarLutasDoze()` (15 lutas). Para 13 atletas, usa `gerarLutasTreze()` (15 lutas). Para 14 atletas, usa `gerarLutasQuatorze()` (15 lutas). Para 15 atletas, usa `gerarLutasQuinze()` (15 lutas). Funções dedicadas de propagação: 3 (`advanceWinnerInChave` com repescagem), 5 (`advanceWinner5`), 6 (`advanceWinner6`), 9 (`advanceWinner9`), 10 (`advanceWinner10`), 11 (`advanceWinner11`), 12 (`advanceWinner12`), 13 (`advanceWinner13`), 14 (`advanceWinner14`), 15 (`advanceWinner15`) e 16 (`advanceWinner16`).
- **Mínimo de 2 atletas:** Categorias com 1 atleta não geram chave — o atleta é listado como "sem chave". Com 0 atletas, nenhuma chave é gerada.
- **Formato eliminatório simples:** Sem repescagem, sem disputa de 3º lugar (exceto chave de 3 atletas que usa sistema de repescagem restrito — ver seção 3.11.1).
- **Estrutura por quantidade de atletas:**
  - 2 atletas: 1 luta, 1 rodada (Final direta)
  - 3 atletas: 3 lutas, 3 rodadas — rodada 1 (semifinal: seed 1 vs seed 2), rodada 2 (tbd vs seed 3 — repescagem), rodada 3 (final)
  - 4 atletas: 3 lutas, 2 rodadas (2 Semifinais + Final)
  - 5 atletas: 6 lutas, 3 rodadas — R1 (3 lutas: seed1 vs seed2, seed3 vs seed4, seed5 vs BYE auto-resolvido), R2 (2 lutas: vencedor(L2) vs seed5, vencedor(L1) vs BYE auto-resolvido), R3 (Final: vencedor(L4) vs vencedor(L5))
  - 6 atletas: 7 lutas, 3 rodadas — R1 (4 lutas: L1 seed0 vs seed1, L2 seed2 vs BYE auto-resolvido [wo], L3 seed3 vs seed4, L4 seed5 vs BYE auto-resolvido [wo]), R2 (2 semifinais: L5 vencedor(L2) vs vencedor(L1), L6 vencedor(L4) vs vencedor(L3)), R3 (Final: L7 vencedor(L5) vs vencedor(L6)). Propagação: `advanceWinner6` — vencedor de L1 preenche L5.atletaBId, vencedor de L3 preenche L6.atletaBId (slots A já preenchidos pelos byes na geração). BYEs (L2, L4) são ignorados na propagação (já processados na geração).
  - 9 atletas: 12 lutas, 4 rodadas — R1 (6 lutas: L1 seed0 vs seed1, L2 seed2 vs BYE [wo], L3 seed3 vs seed4, L4 seed5 vs BYE [wo], L5 seed6 vs seed7, L6 seed8 vs BYE [wo]), R2 (3 lutas: L7 vencedor(L1) vs seed2, L8 vencedor(L3) vs seed5, L9 vencedor(L5) vs seed8), R3 (2 lutas: L10 vencedor(L7) vs vencedor(L8), L11 vencedor(L9) vs BYE [wo] — vencedor de L9 vai direto para a final), R4 (Final: L12 vencedor(L10) vs vencedor(L11)). Propagação: `advanceWinner9` — L1→L7.A, L3→L8.A, L5→L9.A, L7→L10.A, L8→L10.B, L9→L11.A+L11.WO+Final.B, L10→Final.A. BYEs (L2, L4, L6) já resolvidos na geração; L11 (WO na R3) resolve L9→Final em um passo.
  - 10 atletas: 13 lutas, 4 rodadas — R1 (6 lutas: L1 seed0×seed1, L2 seed2×seed3, L3 seed4×seed5, L4 seed6×seed7, L5 seed8×BYE [wo], L6 seed9×BYE [wo]), R2 (4 lutas: L7 vencedor(L1)×vencedor(L2), L8 vencedor(L3)×BYE [wo], L9 vencedor(L4)×BYE [wo], L10 seed8×seed9 — BYEs da R1 se enfrentam), R3 (2 semis: L11 vencedor(L7)×vencedor(L8), L12 vencedor(L9)×vencedor(L10)), R4 (Final: L13 vencedor(L11)×vencedor(L12)). Propagação: `advanceWinner10` — L1→L7.A, L2→L7.B, L3→L8.A+WO+L11.B, L4→L9.A+WO+L12.A, L5→L10.A, L6→L10.B, L7→L11.A, L10→L12.B, L11→L13.A, L12→L13.B. BYEs (L5, L6) já resolvidos na geração; L8 WO e L9 WO propagam direto para as semis.
  - 11 atletas: 15 lutas, 4 rodadas — R1 (8 lutas: L1 seed0×seed1, L2 seed2×seed3, L3 seed4×seed5, L4 seed6×BYE [wo], L5 seed7×BYE [wo], L6 seed8×BYE [wo], L7 seed9×BYE [wo], L8 seed10×BYE [wo]), R2 (4 quartas: L9 vencedor(L1)×vencedor(L2), L10 vencedor(L3)×seed6, L11 seed7×seed8, L12 seed9×seed10), R3 (2 semis: L13 vencedor(L9)×vencedor(L10), L14 vencedor(L11)×vencedor(L12)), R4 (Final: L15 vencedor(L13)×vencedor(L14)). Propagação: `advanceWinner11` — L1→L9.A, L2→L9.B, L3→L10.A, L9→L13.A, L10→L13.B, L11→L14.A, L12→L14.B, L13→L15.A, L14→L15.B. BYEs (L4-L8) já resolvidos na geração (preenchem L10.B, L11, L12).
  - 12 atletas: 15 lutas, 4 rodadas — R1 (8 lutas: L1 seed0×seed1, L2 seed2×seed3, L3 seed4×seed5, L4 seed6×seed7, L5 seed8×BYE [wo], L6 seed9×BYE [wo], L7 seed10×BYE [wo], L8 seed11×BYE [wo]), R2 (4 quartas: L9 vencedor(L1)×vencedor(L2), L10 vencedor(L3)×vencedor(L4), L11 seed8×seed9 pré-preenchida, L12 seed10×seed11 pré-preenchida), R3 (2 semis: L13 vencedor(L9)×vencedor(L10), L14 vencedor(L11)×vencedor(L12)), R4 (Final: L15 vencedor(L13)×vencedor(L14)). Propagação: `advanceWinner12` — L1→L9.A, L2→L9.B, L3→L10.A, L4→L10.B, L9→L13.A, L10→L13.B, L11→L14.A, L12→L14.B, L13→L15.A, L14→L15.B. BYEs (L5-L8) já resolvidos na geração; L11 e L12 pré-preenchidas com atletas das posições 8-11.
  - 13 atletas: 15 lutas, 4 rodadas — R1 (8 lutas: L1 seed0×seed1, L2 seed2×seed3, L3 seed4×seed5, L4 seed6×seed7, L5 seed8×seed9, L6 seed10×BYE [wo], L7 seed11×BYE [wo], L8 seed12×BYE [wo]), R2 (4 quartas: L9 vencedor(L1)×vencedor(L2), L10 vencedor(L3)×vencedor(L4), L11 vencedor(L5)×seed10 (atletaBId pré-preenchido), L12 seed11×seed12 pré-preenchida), R3 (2 semis: L13 vencedor(L9)×vencedor(L10), L14 vencedor(L11)×vencedor(L12)), R4 (Final: L15 vencedor(L13)×vencedor(L14)). Propagação: `advanceWinner13` — L1→L9.A, L2→L9.B, L3→L10.A, L4→L10.B, L5→L11.A, L9→L13.A, L10→L13.B, L11→L14.A, L12→L14.B, L13→L15.A, L14→L15.B. BYEs (L6-L8) já resolvidos na geração; L11 tem atletaBId = seed10 pré-preenchido; L12 pré-preenchida com seed11×seed12.
  - 14 atletas: 15 lutas, 4 rodadas — R1 (8 lutas: L1 seed0×seed1, L2 seed2×seed3, L3 seed4×seed5, L4 seed6×seed7, L5 seed8×seed9, L6 seed10×seed11, L7 seed12×BYE [wo], L8 seed13×BYE [wo]), R2 (4 quartas: L9 vencedor(L1)×vencedor(L2), L10 vencedor(L3)×vencedor(L4), L11 vencedor(L5)×vencedor(L6), L12 seed12×seed13 pré-preenchida), R3 (2 semis: L13 vencedor(L9)×vencedor(L10), L14 vencedor(L11)×vencedor(L12)), R4 (Final: L15 vencedor(L13)×vencedor(L14)). Propagação: `advanceWinner14` — L1→L9.A, L2→L9.B, L3→L10.A, L4→L10.B, L5→L11.A, L6→L11.B, L9→L13.A, L10→L13.B, L11→L14.A, L12→L14.B, L13→L15.A, L14→L15.B. BYEs (L7-L8) já resolvidos na geração; L12 pré-preenchida com seed12×seed13.
  - 15 atletas: 15 lutas, 4 rodadas — R1 (8 lutas: L1 seed0×seed1, L2 seed2×seed3, L3 seed4×seed5, L4 seed6×seed7, L5 seed8×seed9, L6 seed10×seed11, L7 seed12×seed13, L8 seed14×BYE [wo]), R2 (4 quartas: L9 vencedor(L1)×vencedor(L2), L10 vencedor(L3)×vencedor(L4), L11 vencedor(L5)×vencedor(L6), L12 vencedor(L7)×seed14 (atletaBId pré-preenchido)), R3 (2 semis: L13 vencedor(L9)×vencedor(L10), L14 vencedor(L11)×vencedor(L12)), R4 (Final: L15 vencedor(L13)×vencedor(L14)). Propagação: `advanceWinner15` — L1→L9.A, L2→L9.B, L3→L10.A, L4→L10.B, L5→L11.A, L6→L11.B, L7→L12.A, L9→L13.A, L10→L13.B, L11→L14.A, L12→L14.B, L13→L15.A, L14→L15.B. BYE (L8) já resolvido na geração; L12 tem atletaBId = seed14 pré-preenchido.
  - 7-15 atletas (exceto 9, 10, 11, 12, 13, 14 e 15): eliminação simples com byes automáticos — número de rodadas = ceil(log2(N)). Exemplo para 7 atletas: R1 (4 lutas: seed0 vs seed1, seed2 vs seed3, seed4 vs seed5, seed6 vs BYE auto-resolvido), R2 (2 lutas: vencedor(L1) vs vencedor(L2), vencedor(L3) vs vencedor(BYE)), R3 (Final: vencedor(L5) vs vencedor(L6)).
  - 16 atletas: 15 lutas, 4 rodadas (8 lutas R1, 4 lutas R2, 2 lutas R3, 1 luta R4 final)
- **Chave editável:** O administrador pode reordenar manualmente as posições dos atletas na chave antes do início das lutas (status `gerada`).
- **Listagem:** Chaves exibidas como cards em pilha vertical (Stack). Ordenadas alfabeticamente pelo título da chave.
- **Bloqueio de edição:** Após a primeira luta ser iniciada, a edição é bloqueada.
- **Seed sorting (geração inicial — `aplicarSeedSorting`):** Ao gerar a chave, os atletas são primeiro embaralhados aleatoriamente (Fisher-Yates shuffle) e depois ordenados por: peso (decrescente) → idade (decrescente, `currentYear - anoNascimento`) → nome (ascendente, `localeCompare`). O embaralhamento prévio garante que a posição do BYE (quando o número de atletas é ímpar) seja aleatória a cada geração. A divisão em lados é dinâmica: metade superior (sideA) e metade inferior (sideB) da seed, com separação de equipes entre lados.
  - 16 atletas (`aplicarSeedSorting16`): sideA = primeiros 8, sideB = últimos 8; dentro de cada lado, atletas da mesma equipe são trocados com o lado oposto.
- **Embaralhamento (shuffle):** O botão "Embaralhar" randomiza a ordem dos atletas na chave usando Fisher-Yates shuffle e mantém a separação de equipes em lados opostos (via `separarEquipes`). Para 16 atletas, reaplica seed sorting; para os demais, aplica `separarEquipes`. A separação de equipes funciona para chaves de 4 (sideA=[0,3], sideB=[1,2]), 5 (sideA=[0,1,2], sideB=[3,4]), 6 (sideA=[0,1,2], sideB=[3,4,5]), 9 (sideA=[0,1,2,3,4], sideB=[5,6,7,8]), 10 (sideA=[0,1,2,3,4], sideB=[5,6,7,8,9]), 11 (sideA=[0,1,2,3,4,5], sideB=[6,7,8,9,10]), 12 (sideA=[0,1,2,3,4,5], sideB=[6,7,8,9,10,11]), 13 (sideA=[0,1,2,3,4,5], sideB=[6,7,8,9,10,11,12]), 14 (sideA=[0,1,2,3,4,5], sideB=[6,7,8,9,10,11,12,13]) e 15 (sideA=[0,1,2,3,4,5,6], sideB=[7,8,9,10,11,12,13,14]) atletas. Pode ser acionado a qualquer momento enquanto a chave estiver no status `gerada`.
- **Regeneração:** Permitida apenas se nenhuma luta foi iniciada.
- **Propriedade `emChave`:** Todo atleta possui a propriedade booleana opcional `emChave` indicando se está alocado em alguma chave. É marcada automaticamente ao gerar, randomizar ou importar chaves, e computada dinamicamente no frontend ao carregar os dados.
- **Atletas Sem Chave:** Atletas sozinhos na categoria (único atleta) são exibidos em seção destacada com cartões individuais contendo:
  - Nome, equipe e categoria do atleta
  - Badge "Sem chave"
  - Botão **"Descer"** — move o atleta para a categoria de peso imediatamente inferior (se disponível)
  - Botão **"Subir"** — move o atleta para a categoria de peso imediatamente superior (se disponível)
  - Botão **"W.O."** — placeholder para declarar campeão por W.O.
- **Indicador de "luta casada":** Os botões de subir/descer peso exibem:
  - Contagem de atletas na categoria de destino (ex: `↑ 3` ou `↓ 2`)
  - Botão destacado em amarelo quando a categoria destino possui oponentes
  - Botão cinza claro quando a categoria destino está vazia
  - Tooltip com nome da categoria destino e quantidade de atletas
- **Ordem de pesos IBJJF:** `galo → pluma → pena → leve → medio → meio-pesado → pesado → super-pesado → pesadissimo`
- **Busca na listagem:** campo de busca textual que filtra as chaves exibidas por título (faixa, peso, quantidade de atletas) em tempo real. Exibe mensagem "Nenhuma chave encontrada para a busca {termo}" quando não há resultados.
- **Correção de acúmulo de chaveIds:** Ao regenerar chaves ("Gerar Novamente"), os `chaveIds` de todos os árbitros são limpos antes da reatribuição automática, eliminando o acúmulo de IDs de chaves antigas. Isso garante que a contagem exibida na coluna "Chaves Atribuídas" da tela de árbitros reflita sempre o número real de chaves atuais.
### 3.11.1. Propagação de Vencedores e Tratamento de DQ em Chaves

- **Função `advanceWinnerInChave`:** Responsável por propagar o vencedor de uma luta para a rodada seguinte. O algoritmo calcula:
  - `fightsPerNextMatch = currentRoundLutas.length / nextRoundLutas.length` (razão entre número de lutas da rodada atual e da rodada alvo).
  - `nextMatchIndex = Math.floor(matchIndex / fightsPerNextMatch)` — índice da luta na próxima rodada.
  - `slotInNextMatch = matchIndex % fightsPerNextMatch` — slot na luta destino (0 → `atletaAId`, 1 → `atletaBId`).
  - Só preenche o slot se ele estiver vazio (`'tbd'` ou `''`).
- **Função `advanceWinner16` (chave de 16 atletas):** Usa índices hardcoded para propagação:
  - Rodada 1 → Rodada 2: índice `8 + floor(idx / 2)`.
  - Rodada 2 → Rodada 3: índice `12 + floor(adjIdx / 2)`.
  - Rodada 3 → Rodada 4: índice `14`.
- **Função `advanceWinner5` (chave de 5 atletas):** Propagação manual baseada na ordem da luta:
  - **Luta 1 vence:** preenche Luta 5 (`atletaAId` = vencedor, `status = 'wo'` já que对面 é BYE) e Luta 6 (`atletaBId` = vencedor).
  - **Luta 2 vence:** preenche Luta 4 (`atletaAId` = vencedor).
  - **Luta 4 vence:** preenche Luta 6 (`atletaAId` = vencedor).
  - A Luta 3 (seed5 × BYE) é auto-resolvida na geração com `status='wo'`, e seed5 já é pré-preenchido no `atletaBId` da Luta 4.
- **Função `advanceWinner6` (chave de 6 atletas):** Propagação manual baseada na ordem da luta (7 lutas, 3 rodadas). Estrutura: L1-L4 (rodada 1), L5-L6 (semifinais), L7 (final). BYEs (L2, L4) são ignorados na propagação (já processados na geração com `status='wo'`):
  - **Luta 1 vence:** preenche Luta 5 (`atletaBId` = vencedor) — slot A já preenchido pelo bye winner (L2).
  - **Luta 3 vence:** preenche Luta 6 (`atletaBId` = vencedor) — slot A já preenchido pelo bye winner (L4).
  - **Luta 5 vence (semifinal 1):** preenche Luta 7 (`atletaAId` = vencedor).
  - **Luta 6 vence (semifinal 2):** preenche Luta 7 (`atletaBId` = vencedor).
  - **Lutas 2 e 4 (BYE):** ignoradas — vencedores já pré-propagados na geração.
  - **Detecta estrutura antiga:** Se a chave não possui L4 (estrutura antiga com 6 lutas), usa lógica alternativa por rodada/índice para compatibilidade retroativa.
- **Função `advanceWinner9` (chave de 9 atletas):** Propagação manual baseada na ordem da luta (12 lutas, 4 rodadas). Estrutura: L1-L6 (rodada 1), L7-L9 (rodada 2 — quartas), L10-L11 (rodada 3 — semifinais), L12 (rodada 4 — final). BYEs (L2, L4, L6) pré-preenchidos na geração:
  - **Luta 1 vence:** preenche Luta 7 (`atletaAId` = vencedor).
  - **Luta 3 vence:** preenche Luta 8 (`atletaAId` = vencedor).
  - **Luta 5 vence:** preenche Luta 9 (`atletaAId` = vencedor).
  - **Luta 7 vence (QF1):** preenche Luta 10 (`atletaAId` = vencedor).
  - **Luta 8 vence (QF2):** preenche Luta 10 (`atletaBId` = vencedor).
  - **Luta 9 vence (QF3):** preenche Luta 11 (`atletaAId` = vencedor, `status='wo'`) e Luta 12 (`atletaBId` = vencedor) — vencedor de QF3 vai direto para a final (BYE na semifinal).
  - **Luta 10 vence (SF1):** preenche Luta 12 (`atletaAId` = vencedor).
- **Função `advanceWinner10` (chave de 10 atletas):** Propagação manual baseada na ordem da luta (13 lutas, 4 rodadas). Estrutura: L1-L6 (R1), L7-L10 (R2), L11-L12 (R3 — semis), L13 (R4 — final). BYEs (L5, L6) pré-preenchidos na geração:
  - **Luta 1 vence:** preenche Luta 7 (`atletaAId` = vencedor).
  - **Luta 2 vence:** preenche Luta 7 (`atletaBId` = vencedor).
  - **Luta 3 vence:** preenche Luta 8 (`atletaAId` = vencedor, `status='wo'`) e Luta 11 (`atletaBId` = vencedor) — vencedor vai direto para a semi.
  - **Luta 4 vence:** preenche Luta 9 (`atletaAId` = vencedor, `status='wo'`) e Luta 12 (`atletaAId` = vencedor) — vencedor vai direto para a semi.
  - **Luta 5 vence (BYE):** preenche Luta 10 (`atletaAId` = vencedor) — já preenchido na geração.
  - **Luta 6 vence (BYE):** preenche Luta 10 (`atletaBId` = vencedor) — já preenchido na geração.
  - **Luta 7 vence (QF1):** preenche Luta 11 (`atletaAId` = vencedor).
  - **Luta 10 vence (QF4):** preenche Luta 12 (`atletaBId` = vencedor).
  - **Luta 11 vence (SF1):** preenche Luta 13 (`atletaAId` = vencedor).
  - **Luta 12 vence (SF2):** preenche Luta 13 (`atletaBId` = vencedor).
- **Função `clearWinnerFromLaterRounds`:** Quando uma luta tem seu resultado alterado (reaberta), percorre recursivamente TODAS as rodadas seguintes e limpa o vencedor propagado: seta `atletaAId`/`atletaBId` para `'tbd'`, anula `vencedorId`, reseta `status` para `'pending'` se estava `'completed'` ou `'wo'`.
- **Constante `tbd`:** Slots de luta vazios são marcados com o valor `'tbd'` (to be determined).
- **Resultado em chave de 3 atletas com DQ na rodada 1:** Quando `desclassificacao=true` e `luta.rodada === 1`:
  - O atleta perdedor (desclassificado) NÃO é propagado para a rodada 2.
  - O atleta de bye (posição 2 da seed, `atletaBId` da rodada 2) avança diretamente para a rodada 3.
  - A rodada 2 é marcada como auto-WO.
- **Resultado em chave de 3 atletas SEM DQ na rodada 1:** Comportamento de repescagem:
  - O perdedor da rodada 1 vai para a rodada 2 (vs atleta de bye).
  - O vencedor da rodada 1 avança para a rodada 3.
  - O vencedor da rodada 2 preenche o slot `atletaBId` da rodada 3.
- **Resultado em chave de 2 atletas:** Única luta, rodada única. Vencedor é campeão direto. Nenhuma propagação adicional.
- **DQ (`desclassificadoId`):** Quando `desclassificacao=true` no registro de resultado:
  - O campo `desclassificadoId` é preenchido com o ID do atleta que NÃO é o vencedor.
  - Quando `desclassificacao=false` ou `undefined`, `desclassificadoId` é limpo (`undefined`).
- **Mapeamento de status:** `data.status === 'wo'` → luta salva com `status='wo'`; qualquer outro valor → `status='completed'`.
- **Deep-clone:** O handler `registrarResultadoHandler` faz uma cópia profunda do bracket antes de modificá-lo (`JSON.parse(JSON.stringify(...))`), garantindo isolamento de mutação.
- **Normalização retroativa (`normalizeLuta`):** Ao carregar chaves, toda luta recebe defaults: `ordem=0`, `rodada=1`, `atletaAId=''`, `atletaBId=''`, `status='pending'`, `vencedorId=null`, `finalizacao=undefined`, `desclassificacao=undefined`, `desclassificadoId=undefined`, `placarA=undefined`, `placarB=undefined`, `desempateArbitro=undefined`, `updatedAt` gerado com `new Date().toISOString()` se ausente (legado).
- **Normalização retroativa (`normalizeChave`):** Ao carregar, defaults: `categoriaId=''`, `arbitroId=null`, `totalRodadas` computado do maior `luta.rodada`, `updatedAt` gerado com `new Date().toISOString()` se ausente (legado).
- **`updatedAt` em Luta e Chave:** Ambos os campos são obrigatórios no tipo `Luta` e `Chave`. São populados no momento da criação (`criarLuta`, `gerarChave`), no registro de resultado (`registrarResultadoHandler` — todas as lutas da chave e a própria chave recebem `updatedAt = now`), na randomização (`randomizarChaveHandler`), na atribuição de árbitro (`atribuirArbitroHandler`), na limpeza de rodadas futuras (`clearWinnerFromLaterRounds`) e na importação (`importChavesFromFile`).

### 3.11.2. Geração Manual de Chaves (Implementado)

- **Botão "Criar Chave Manual":** Disponível na tela "Gerenciar Chaves" tanto antes quanto depois da geração automática. Abre modal de criação manual.
- **Modal `ModalCriarChaveManual`:** Similar ao `ModalCriarLutaCasada`, mas adaptado para N atletas:
  - Campo "Nome da Chave" (opcional) — se vazio, gera nome automático baseado nos atletas selecionados (ex: "Chave Manual — Atleta A, Atleta B, ...").
  - `Select` pesquisável para adicionar atletas (lista todos os atletas não selecionados).
  - Lista de atletas selecionados em cards com faixa, peso, equipe, categoria e botão de remoção.
  - Validação: mínimo 2 atletas, máximo 16, sem atletas duplicados, sem atletas já em outra chave.
- **Persistência:** Chave criada via IPC `gerar-chave` com `categoriaId: 'manual'` e campo `nome` preenchido. Campo `nome` adicionado ao tipo `Chave` (opcional).
- **Handler `gerar-chave`:** Aceita parâmetros opcionais `atletaIds?: string[]` e `nome?: string`. Quando `atletaIds` é fornecido, bypassa o filtro de categoria e usa os IDs diretamente. Verifica se atletas já estão em outra chave.
- **Exibição:** `getChaveTitle` retorna `chave.nome` quando presente. Chave manual pode ser embaralhada, visualizada e ter árbitro atribuído (mesmo fluxo das chaves automáticas).
- **Seleção de área (Implementado):** O modal `ModalCriarChaveManual` inclui um Select de "Área de Luta" (opcional, pesquisável, clearable). Ao criar uma chave com área selecionada, o primeiro árbitro da área é atribuído automaticamente à chave via `atribuirArbitroChave`. Isso garante que a chave apareça na tela `PlacarChaves` da área selecionada. Se nenhuma área for selecionada, a chave fica sem árbitro (comportamento anterior).
- **Spec:** `spec/geracao-manual-chaves.md`, `spec/chave-manual-area.md`

### 3.12. Importação de Chaves

- **Formato:** Array JSON de objetos `Chave`. Cada chave deve conter `categoriaId` (string) e `lutas` (array) — `id` é opcional.
- **Validação de estrutura:** O arquivo deve ser um array. Objetos, strings ou números são rejeitados com `"Arquivo inválido: o conteúdo deve ser um array de chaves."`. Cada item do array deve possuir `categoriaId` e `lutas` (array); caso contrário, retorna `"Estrutura de chave inválida no arquivo."`.
- **Normalização automática:**
  - `id`: preservado do arquivo se presente; gerado (`crypto.randomUUID()`) se ausente.
  - Demais campos (`posicoesAtletas`, `arbitroId`, `totalAtletas`, `totalLutas`, `status`, `updatedAt`) são preservados do arquivo.
  - `lutas[].updatedAt`: preservado de cada luta se presente; gerado com `new Date().toISOString()` se ausente.
- A lista de chaves substitui completamente a lista existente no torneio (não há mesclagem).
- Atualiza o `updatedAt` do torneio após a importação.
- Disparada via botão "Importar Chaves" na tela de Gerenciamento de Chaves.
- A exportação de chaves é feita via botão "Exportar Chaves", gerando JSON completo da lista atual.

### 3.13. Ativação do Software (Implementado)

- Na primeira execução, exige senha de ativação fornecida pelo desenvolvedor.
- Senha validada por hash SHA-256 (nunca armazenada em texto puro).
- Após ativação bem-sucedida, gera token HMAC-SHA256 vinculado ao hardware da máquina (UUID obtido via `wmic csproduct get uuid`).
- Token salvo em `{userData}/activation.json` com timestamp `activatedAt` (ISO); execuções subsequentes verificam o token automaticamente.
- Senha mestra padrão: `Bjj@2025!Secure` (hash SHA-256: `57a8d2d84be94e9bdae407ad8352065346269c6997b0be31ff32101fc51e7c3e`).
- A senha mestra pode ser sobrescrita via variável de ambiente `MASTER_PASSWORD_HASH` (útil para ambientes de desenvolvimento ou distribuição customizada).
- Fallback para `crypto.randomUUID()` se o comando `wmic` falhar (Linux/macOS ou restrição de segurança).
- O `App.tsx` faz 3 estados: `null` (carregando), `false` (tela de ativação), `true` (app principal). O `.catch(() => setActivated(false))` trata falhas de IPC.

### 3.14. Error Boundary

- Um componente `ErrorBoundary` (classe React) envolve as `<Routes>` no `HashRouter`.
- Captura erros de renderização em qualquer página filha.
- Exibe tela de fallback com: título "Erro inesperado", descrição, mensagem do erro (primeiras 4 linhas do stack) e botão "Tentar novamente".
- O botão "Tentar novamente" reseta o estado de erro (`setState({ hasError: false })`) e re-renderiza os children.

### 3.15. Categorias IBJJF

As categorias de inscrição seguem o padrão oficial da IBJJF (International Brazilian Jiu-Jitsu Federation) para competições com kimono (Gi).

#### 3.15.1. Fatores de Classificação

A categoria de um atleta é determinada pela combinação de quatro fatores:

1. **Idade** (faixa etária) — calculada pelo ano calendário (ano atual - anoNascimento)
2. **Faixa** (graduação) — nível do atleta
3. **Gênero** — masculino ou feminino
4. **Peso** — peso do atleta em kg

#### 3.15.2. Faixas Etárias IBJJF

| Faixa Etária | Idade |
|---|---|
| Pré-Mirim | 4–5 anos |
| Mirim | 6–7 anos |
| Infantil A | 8–9 anos |
| Infantil B | 10–11 anos |
| Infanto-Juvenil A | 12–13 anos |
| Infanto-Juvenil B | 14–15 anos |
| Juvenil | 16–17 anos |
| Adulto | 18–29 anos |
| Master 1 | 30–35 anos |
| Master 2 | 36–40 anos |
| Master 3 | 41–45 anos |
| Master 4 | 46–50 anos |
| Master 5 | 51–55 anos |
| Master 6 | 56–60 anos |
| Master 7 | 61+ anos |

#### 3.15.3. Categorias de Peso por Gênero

**Masculino:**

| Categoria | Limite (kg) |
|---|---|
| Galo | até 57,5 |
| Pluma | até 64,0 |
| Pena | até 70,0 |
| Leve | até 76,0 |
| Médio | até 82,3 |
| Meio-Pesado | até 88,3 |
| Pesado | até 94,3 |
| Super Pesado | até 97,5 |
| Pesadíssimo | sem limite |

**Feminino:**

| Categoria | Limite (kg) |
|---|---|
| Galo | até 48,5 |
| Pluma | até 53,5 |
| Pena | até 58,5 |
| Leve | até 64,0 |
| Médio | até 69,0 |
| Meio-Pesado | até 74,0 |
| Pesado | até 79,3 |
| Super Pesado | sem limite |
| Pesadíssimo | sem limite |

> Pesadíssimo feminino não se aplica na IBJJF. No código, tanto masculino quanto feminino usam `null` como sentinela de "sem limite superior".

#### 3.15.4. Classificação Automática

A função `classificarCategoria(atleta)` em `src/types/category.ts` determina automaticamente a categoria de um atleta com base em:

1. Cálculo da faixa etária a partir da idade (`anoAtual - anoNascimento`)
2. Filtragem por gênero
3. Encaixe na categoria de peso correta: filtra por faixa etária + gênero, ordena por `pesoMaximoKg` ascendente (valores `null` por último — representam "sem limite"), retorna a primeira onde `pesoKg <= pesoMaximoKg` ou a categoria de limite nulo

A classificação automática não substitui a seleção manual no formulário — o usuário sempre escolhe a categoria explicitamente.

O array `CATEGORIAS_IBJJF` é gerado programaticamente por `gerarCategorias()` que itera apenas a faixa etária `adulto` × 2 gêneros × 9 pesos masculinos / 7 femininos (total: 16 categorias). O filtro interno `if (pesoLimite === undefined) continue` exclui Super-Pesado e Pesadíssimo femininos. O lookup `categoriaLabels` é construído a partir do mesmo array, mapeando `categoriaId → label`. Categorias customizadas (`CategoriaCustomizada`) são independentes e não possuem campos `faixaEtaria`, `genero` ou `corFaixa`.

#### 3.15.5. ID da Categoria

Cada categoria possui um identificador único no formato `{faixaEtaria}-{genero}-{peso}`, ex.:
- `adulto-masculino-leve`
- `master1-feminino-galo`
- `juvenil-masculino-pena`

O campo `categoria` no JSON do atleta armazena este ID.

#### 3.15.6. Dados de Referência

Todas as categorias são geradas programaticamente no array `CATEGORIAS_IBJJF` em `src/types/category.ts`, totalizando 16 categorias (1 faixa etária adulto × 2 gêneros: 9 masculino + 7 feminino). O arquivo `doc/IBJJF.md` contém as tabelas de referência originais.

---

### 3.14. Layout Responsivo — Ocupação de Tela

Todas as telas do sistema devem ocupar no mínimo **95% da largura** e **90% da altura** da janela do Electron, independentemente do conteúdo interno.

#### Regras

- **`PageLayout.tsx` é o layout padrão** e define a estrutura base de todas as páginas administrativas. Nenhuma página deve criar seu próprio Container com tamanho fixo.
- **Container `fluid`:** deve usar `<Container fluid px="xl" py="xl">` para que ocupe 100% da largura disponível, sem `max-width` restritivo.
- **`width: 100%` explícito:** Container e Paper devem ter `width: 100%` declarado para garantir que elementos block-flex aninhados (como `Group`) não encolham ao tamanho do texto interno.
- **Altura mínima:** o Container externo deve ter `min-height: 100vh` e o Paper interno `min-height: calc(100vh - 4rem)` para ocupar ao menos 90% da viewport (subtraindo o `py="xl"` de 2rem × 2).
- **Proibido `size` fixo:** nenhuma página pode usar `<Container size="sm"`, `size="md"` ou `size="clamp(...)"` para o layout principal. Os únicos Containers com tamanho fixo permitidos são os de estados temporários (loading/error) que também devem usar `fluid`.
- **Loading/Error states:** devem replicar o mesmo padrão (`fluid` + `min-height`) para evitar "salto visual" quando a tela carrega.
- **Grupos internos:** `Group` que necessite ocupar toda a largura deve receber `w="100%"` para garantir que `justify="space-between"` funcione corretamente.

#### Implementação

| Componente | Propriedade | Valor |
|---|---|---|
| `Container` | `fluid` | Remove `max-width` fixo |
| `Container` | `px` | `"xl"` (respiro lateral proporcional) |
| `Container` | `style.minHeight` | `"100vh"` |
| `Paper` | `style.minHeight` | `"calc(100vh - 4rem)"` |
| `Paper` | `style.width` | `"100%"` |
| `Group` (outer) | `w` | `"100%"` |

#### Arquivos Afetados

| Arquivo | O que foi alterado |
|---|---|
| `src/components/PageLayout.tsx` | Container `fluid`, `width: 100%` explícito, `min-height` no Container e Paper, `w="100%"` no Group, removido `display: flex` do Paper |
| `src/pages/ListarTorneios.tsx` | Loading/Error states: `fluid` + `min-height` |
| `src/pages/AdminAthletes.tsx` | Loading/Error states: `fluid` + `min-height` |
| `src/pages/Equipes.tsx` | Loading/Error states: `fluid` + `min-height` |
| `src/pages/Dashboard.tsx` | Loading state: `fluid` + `min-height` |

### 3.17. Árbitros (Implementado)

- **Menu intermediário:** Ao clicar no card "Árbitros" no Dashboard, navega para `/admin/arbitros` que renderiza `ArbitrosMenu` — um menu com 3 cartões:
  - **Cadastrar Árbitro** — Abre o modal `ArbitroForm` diretamente na mesma página para criar um novo árbitro.
  - **Listar Árbitros** — Navega para `/admin/arbitros/lista` (tela `AdminArbitros` com tabela CRUD).
  - **Importar Árbitros** — Dispara o diálogo nativo de seleção de arquivo JSON via IPC `import-arbitros`.
- **Tela de listagem (`/admin/arbitros/lista`):** Exibe `AdminArbitros` com:
  - Botões "Importar", "Exportar" e "Cadastrar" no topo.
  - Campo de busca textual que filtra a tabela por nome, equipe ou faixa em tempo real.
  - Tabela com colunas: Nome, Equipe, Faixa, Chaves Atribuídas, Ações (editar/excluir). Ordenada alfabeticamente por nome do árbitro.
  - Badge com contagem de chaves atribuídas por árbitro.
  - Empty state com "Nenhum árbitro cadastrado" + botão "Cadastrar primeiro árbitro".
  - Empty state de busca: "Nenhum árbitro encontrado para a busca {termo}" quando filtro não retorna resultados.
  - Ações por linha: lápis (editar) e lixeira (excluir).
  - Botão "Voltar" retorna para `/admin/arbitros` (menu).
- **Modal de formulário:** `ArbitroForm.tsx` usa `@mantine/form` com modo controlado. Campos: Nome (obrigatório, min 2 caracteres), Equipe (opcional) e Faixa (obrigatório).
- **Faixa restrita:** Apenas faixas a partir de **roxa** são permitidas para cadastro de árbitros: `roxa`, `marrom`, `preta`.
- Nome é armazenado em minúsculo (`.trim().toLowerCase()` no submit).
- **Duplicata:** Um árbitro é considerado duplicata quando possui o mesmo **nome** (case-insensitive, trimmed). A verificação ocorre no renderer antes do IPC, tanto para cadastro quanto para edição (ignorando o próprio `id`).
- **Armazenamento por torneio:** Árbitros são armazenados dentro do JSON do torneio (campo `arbitros: Arbitro[]`), seguindo o mesmo padrão dos atletas.
- **Torneio ativo obrigatório:** Para cadastrar, editar, excluir ou importar árbitros, é necessário que haja um torneio ativo.
- **Sincronia imediata:** Qualquer operação CRUD sobre árbitros lê e escreve diretamente no arquivo JSON do torneio ativo.
- **Equipe:** Campo opcional que registra a equipe/academia do árbitro. Utilizado na atribuição de chaves para alertar se o árbitro pertence à mesma equipe que atletas da chave (apenas aviso, não bloqueia).
- **Normalização no cadastro (`saveArbitro`):** `nome.trim().toLowerCase()`, `equipe.trim().toLowerCase()`, auto-geração de `id` e timestamps.
- **Normalização na edição (`updateArbitro`):** Apenas `nome` é re-normalizado (`trim().toLowerCase()`). `equipe` NÃO é re-normalizada (preservada como foi enviada).
- **Importação:** Formato JSON com array de objetos contendo `{ "nome": "...", "faixa": "..." }` — `equipe` e `id` são opcionais. **Validações:**
  - O conteúdo do arquivo deve ser um **array** (objetos/strings/números são rejeitados com `"Arquivo inválido: o conteúdo deve ser um array de árbitros."`).
  - Nome obrigatório, mínimo 2 caracteres.
  - Faixa obrigatória, deve ser `roxa`, `marrom` ou `preta`.
  - Se equipe for informada, deve ter no mínimo 2 caracteres.
  - Deduplicação por nome (case-insensitive).
  - **Normalização automática:**
    - `id`: preservado do arquivo se presente; gerado (`crypto.randomUUID()`) se ausente.
    - `nome`: `trim().toLowerCase()`.
    - `equipe`: `trim().toLowerCase()` ou `''` se falsy/não-string.
    - `createdAt`: sempre substituído pelo timestamp atual (momento da importação).
    - `updatedAt`: sempre substituído pelo timestamp atual (momento da importação).
    - `chaveIds`: preservado do arquivo se presente; `[]` se ausente.
- **Exportação:** Array completo de árbitros com todos os campos (`nome`, `equipe`, `faixa`, `id`, `chaveIds`, `createdAt`, `updatedAt`). Nome padrão do arquivo: `{torneioNome}_arbitros.json` com caracteres especiais substituídos por `_`.
- **Exclusão individual:** Ao excluir um árbitro, as chaves que ele estava arbitrando ficam sem árbitro (`arbitroId = null`). Exibe modal de confirmação antes de excluir.
- **Exclusão em lote (`deleteArbitros`):** Mesmo cascade de exclusão individual — todas as chaves dos árbitros excluídos recebem `arbitroId = null`.
- **Soft delete (`deleteArbitro`/`deleteArbitros`):** em vez de remover fisicamente, seta `deletedAt = new Date().toISOString()` no item e mantém o cascade (`chave.arbitroId = null`). Itens soft-deletados ficam ocultos de `loadArbitros`. Disponibiliza IPC `restore-arbitro` que limpa `deletedAt`.
- **Lixeira — visualizar (`loadDeletedArbitros`):** a tela de listagem `AdminArbitros` exibe um `Switch` "Mostrar apenas os deletados" no header (cor padrão do tema, alinhado a `AdminAthletes`). Quando ativado, chama `loadDeletedArbitros` (IPC `load-deleted-arbitros`) que retorna apenas itens com `deletedAt != null`, ordenados alfabeticamente por nome. Botões "Importar", "Exportar" e "Cadastrar", a barra de busca e o `Switch` permanecem visíveis em ambos os estados — apenas o conteúdo da tabela (coluna "Deletado em", ações de restaurar/excluir permanentemente, botões bulk no topo) muda. O título da página muda para "Árbitros Deletados".
- **Lixeira — restaurar (`restoreArbitro` por linha):** na view deletados, cada linha exibe `ActionIcon` verde com `IconRestore` que chama `restoreArbitro` diretamente. Notificação verde e lista recarregada via `loadDeletedArbitros`.
- **Lixeira — excluir permanentemente (`permanentlyDeleteArbitro` por linha):** na view deletados, cada linha exibe `ActionIcon` vermelho com `IconTrash` que abre modal centralizado "Excluir Permanentemente" com aviso "Esta ação é IRREVERSÍVEL." + texto dinâmico com nome do árbitro + botões "Cancelar" / "Excluir Permanentemente" (vermelho). Confirmação dispara IPC `permanently-delete-arbitro` (remove fisicamente do JSON).
- **Lixeira — exclusão permanente em lote:** checkbox de seleção + "Selecionar todos" com estado indeterminado. Com N≥1 selecionados, botão "Excluir Permanentemente (N)" no topo (junto ao campo de busca), abrindo modal de confirmação em lote. Confirmação dispara IPC `permanently-delete-arbitros` em operação única.
- **Tabela com coluna "Deletado em":** na view deletados, coluna extra exibe `formatDeletedAt(deletedAt)` no formato `dd/MM/yyyy HH:mm`. Ações mudam de `[editar, soft-deletar]` para `[restaurar, excluir permanente]`.
- **Modal de soft delete — texto atualizado:** o modal de confirmação (visível na view ativos) teve seu texto alterado para informar que o árbitro "será movido para os deletados. Você poderá restaurá-lo na aba 'Mostrar apenas os deletados'.". Modal com `chaveIds.length > 0` continua exibindo o aviso de cascade ("As chaves ficarão sem árbitro") seguido da informação de lixeira. Modal de exclusão em lote segue mesmo padrão.
- **Atribuição de chaves:** A atribuição de chaves a um árbitro é feita na tela de Gerenciamento de Chaves. Um árbitro pode arbitrar múltiplas chaves, mas uma chave pode ter no máximo 1 árbitro.
- **Distribuição automática:** Após a geração das chaves, o sistema distribui automaticamente os árbitros entre as chaves com base na hierarquia de faixas. A distribuição pode ser ajustada manualmente.
- **Hierarquia de faixas para arbitragem:** A faixa do árbitro define quais chaves ele pode arbitrar. A ordem hierárquica (mapeada numericamente em `FAIXA_ORDER`: branca=0, cinza=1, amarela=2, laranja=3, verde=4, azul=5, roxa=6, marrom=7, preta=8) define que:
  - **Roxa** (índice 6) arbitra chaves com atletas até faixa roxa (índice ≤6).
  - **Marrom** (índice 7) arbitra chaves com atletas até faixa marrom (índice ≤7).
  - **Preta** (índice 8) arbitra chaves com qualquer faixa.
  - A distribuição automática respeita esta hierarquia. Na edição manual, o sistema avisa se a regra for violada, mas **não bloqueia**.
- **Algoritmo de distribuição automática (`autoAtribuirArbitros`):**
  1. Limpa os `chaveIds` de TODOS os árbitros (elimina acúmulo de IDs antigos).
  2. Para cada chave, calcula o nível máximo de faixa entre seus atletas.
  3. Ordena as chaves por faixa máxima (decrescente).
  4. Para cada chave (da mais exigente para a menos), encontra árbitros elegíveis (faixa do árbitro ≥ faixa máxima da chave).
  5. Dentre os elegíveis, seleciona o árbitro com menor número de chaves atribuídas (balanceamento de carga).
  6. Atribui a chave ao árbitro selecionado.

### 3.18. Áreas de Luta (Implementado)

- **Menu intermediário:** Ao clicar no card "Áreas de Luta" no Dashboard, navega para `/admin/areas` que renderiza `AreasMenu` — um menu com 2 cartões:
  - **Cadastrar Área de Luta** — Abre o modal `AreaForm` diretamente na mesma página.
  - **Listar Áreas de Luta** — Navega para `/admin/areas/lista` (tela `AdminAreas` com tabela CRUD).
- **Tela de listagem (`/admin/areas/lista`):** Exibe `AdminAreas` com:
  - Botão "Cadastrar" no topo.
  - Campo de busca textual que filtra a tabela por nome em tempo real.
  - Tabela com colunas: Nome, Árbitros Responsáveis, Ações (editar/excluir). Ordenada alfabeticamente por nome.
  - Múltiplos badges de árbitros por área (um badge por árbitro).
  - Empty state com "Nenhuma área de luta cadastrada" + botão "Cadastrar primeira área".
  - Empty state de busca: "Nenhuma área encontrada para a busca {termo}".
  - Ações por linha: lápis (editar) e lixeira (excluir).
  - Botão "Voltar" retorna para `/admin/areas` (menu).
- **Modal de formulário:** `AreaForm.tsx` usa `@mantine/form` com modo controlado. Campos:
  - **Nome** (obrigatório, min 2 caracteres) — TextInput.
  - **Árbitros Responsáveis** (opcional, múltiplos) — MultiSelect com busca, populado com lista de árbitros cadastrados.
- **Armazenamento por torneio:** Áreas são armazenadas dentro do JSON do torneio (campo `areas: AreaLuta[]`), seguindo o mesmo padrão das demais entidades.
- **Torneio ativo obrigatório:** Para cadastrar, editar ou excluir áreas, é necessário que haja um torneio ativo.
- **Sincronia imediata:** Qualquer operação CRUD lê e escreve diretamente no arquivo JSON do torneio ativo.
- **Múltiplos árbitros por área:** Cada área pode ter zero, um ou vários árbitros responsáveis (campo `arbitroIds: string[]`).
- **Unicidade de árbitro:** Um árbitro não pode estar atribuído a mais de uma área simultaneamente. A validação ocorre no backend (`electron/areas.ts:checkRefereeNotInUse`) e a mensagem de erro é exibida como notificação vermelha no frontend.
- **`checkRefereeNotInUse` — detalhes:** A função percorre todas as áreas (exceto a própria área sendo editada), coleta todos os `arbitroIds` em uso, e verifica se algum dos árbitros solicitados já está atribuído. No cadastro (`saveArea`), não há exclusão de área; na edição (`updateArea`), a própria área é excluída da verificação.
- **Normalização ao salvar (`saveArea`/`updateArea`):** `nome.trim()` e `arbitroIds.filter(Boolean)` removem espaços extras e IDs vazios antes de persistir.
- **Soft delete (`deleteArea`/`deleteAreas`):** em vez de remover fisicamente, seta `deletedAt = new Date().toISOString()` no item. Itens soft-deletados ficam ocultos de `loadAreas`. Disponibiliza IPC `restore-area` que limpa `deletedAt`.
- **Lixeira — visualizar (`loadDeletedAreas`):** a tela de listagem `AdminAreas` exibe um `Switch` "Mostrar apenas os deletados" no header (cor padrão do tema, alinhado a `AdminAthletes`). Quando ativado, chama `loadDeletedAreas` (IPC `load-deleted-areas`) que retorna apenas itens com `deletedAt != null`, ordenados alfabeticamente por nome. Botões "Importar", "Exportar JSON" e "Cadastrar", a barra de busca e o `Switch` permanecem visíveis em ambos os estados — apenas o conteúdo da tabela (coluna "Deletado em", ações de restaurar/excluir permanentemente, botões bulk no topo) muda. O título da página muda para "Áreas de Luta Deletadas".
- **Lixeira — restaurar (`restoreArea` por linha):** na view deletados, cada linha exibe `ActionIcon` verde com `IconRestore` que chama `restoreArea` diretamente. Notificação verde e lista recarregada via `loadDeletedAreas`.
- **Lixeira — excluir permanentemente (`permanentlyDeleteArea` por linha):** na view deletados, cada linha exibe `ActionIcon` vermelho com `IconTrash` que abre modal centralizado "Excluir Permanentemente" com aviso "Esta ação é IRREVERSÍVEL." + texto dinâmico com nome da área + botões "Cancelar" / "Excluir Permanentemente" (vermelho). Confirmação dispara IPC `permanently-delete-area` (remove fisicamente do JSON).
- **Lixeira — exclusão permanente em lote:** checkbox de seleção + "Selecionar todos" com estado indeterminado. Com N≥1 selecionados, botão "Excluir Permanentemente (N)" no topo (junto ao campo de busca), abrindo modal de confirmação em lote. Confirmação dispara IPC `permanently-delete-areas` em operação única.
- **Tabela com coluna "Deletado em":** na view deletados, coluna extra exibe `formatDeletedAt(deletedAt)` no formato `dd/MM/yyyy HH:mm`. Ações mudam de `[editar, soft-deletar]` para `[restaurar, excluir permanente]`.
- **Modal de soft delete — texto atualizado:** o modal de confirmação (visível na view ativos) teve seu texto alterado para informar que a área de luta "será movida para os deletados. Você poderá restaurá-la na aba 'Mostrar apenas os deletados'.". Modal de exclusão em lote segue mesmo padrão.
- **Migração retroativa:** O campo `normalizeArea()` no backend converte automaticamente dados legados do formato `arbitroId` (string) para `arbitroIds` (array) ao carregar as áreas do JSON.
- **Exclusão em lote:** Na tela de listagem, cada linha possui um checkbox. O cabeçalho possui um checkbox "Selecionar todas" com estado indeterminado. Com uma ou mais áreas selecionadas, um botão "Excluir Selecionados (N)" aparece. A exclusão em lote é feita via IPC `delete-areas`.

#### 3.18.1. Nome Opcional de Área de Luta (Implementado)

- **Comportamento:** O campo `nome` da `AreaLuta` é **opcional** no cadastro, edição e importação. Quando vazio (ou ausente), o sistema gera automaticamente o nome `"Área N"`.
- **Função `gerarNomeAreaPadrao(areas: AreaLuta[]): string`:** em `electron/areas.ts`. Encontra o **menor inteiro ≥ 1** que não está em uso em nomes que casam `/^Área (\d+)$/i` (case-insensitive). Lista vazia → `"Área 1"`. Se a lista tem `["Área 1", "Área 3", "Área 5"]`, a próxima sem nome vira `"Área 2"` (preenche gaps).
- **Pontos de aplicação:** a função é usada em `saveArea`, `updateArea` e `importAreasFromFile` (single source of truth).
- **UI (`AreaForm.tsx`):** label alterado de "Nome *" para "Nome" (sem asterisco). Validação `length < 2` removida. Placeholder informativo: `"Deixe vazio para gerar automaticamente (Área N)"`. Submit com nome vazio é aceito.
- **Validação de duplicata:** o check no frontend (`AdminAreas.tsx:handleSave`) é pulado quando `area.nome.trim() === ''` (vai ser gerado pelo backend). Demais duplicatas (case-insensitive) seguem bloqueadas.
- **Migração retroativa:** áreas já existentes no JSON com `nome: ''` permanecem com string vazia (não há migration automático). O usuário pode editá-las para acionar a geração.

#### 3.18.2. Importação e Exportação de Áreas (Implementado)

- **Botões:** no header de `AdminAreas.tsx`, à esquerda de "Cadastrar" (mesmo padrão de `AdminAthletes.tsx`): **"Importar"** (`IconFileUpload`) e **"Exportar JSON"** (`IconFileCode`). Ambos com `variant="default"`, `borderRadius: 12` e `aria-label`.
- **Exportação (`exportAreas`):** abre diálogo nativo "Salvar como" com default `areas.json`. Grava JSON com indentação de 2 espaços contendo a lista atual de `AreaLuta`.
- **Importação (`importAreasFromFile`):** abre diálogo nativo `.json`. Parseia o conteúdo e valida que é um array (outros formatos rejeitados com erro). Para cada item:
  - Valida `arbitroIds` se presente (deve ser array).
  - Normaliza `nome` (trim) e `arbitroIds` (filtra strings vazias).
  - **Deduplicação:** se já existe área com mesmo `nome` (case-insensitive), conta como `skipped` e segue.
  - Verifica `checkRefereeNotInUse` para evitar conflito de árbitros.
  - Gera `id` (UUID), `createdAt`/`updatedAt` (timestamp atual) e nome padrão se vazio.
  - Persiste atomicamente no JSON do torneio ativo.
- **Retorno:** `{ imported, skipped }` — frontend exibe `"X área(s) importada(s), Y ignorada(s) (já existentes)."` ou silenciar quando ambos são zero (cancelamento do diálogo).
- **Formato do JSON:** array de objetos com `nome` e `arbitroIds`. `id`, `createdAt`, `updatedAt` são opcionais (autogerados/autosobrescritos). Mesma estrutura de `AreaLuta` exportado.
- **Especificação detalhada:** ver `spec/areas-import-export-nome-opcional.md`.

### 3.19. Placar / Scoreboard (Implementado)

- **Fluxo de navegação:** `Dashboard → Placar → PlacarMenu` (seleção de área) → `PlacarChaves` (lista de chaves da área) → `PlacarBracket` (bracket + lutas iniciáveis) → `PlacarLuta` (placar funcional).
- **Tela de seleção de área (`/admin/placar`):** `PlacarMenu` exibe `Select` com as áreas de luta cadastradas. Se houver chaves com atividade recente (lutas com `horarioInicio` ou `horarioTermino`), a área com a atividade mais recente vem pré-selecionada automaticamente. Caso contrário, o Select inicia vazio. Botão "Acessar" navega para `/admin/placar/chaves/:areaId`.
- **Tela de chaves da área (`/admin/placar/chaves/:areaId`):** `PlacarChaves` lista as chaves alocadas na área como cards em pilha vertical (Stack). Cards são ordenados: encerradas por último, depois por timestamp de atividade mais recente (horário de início/término das lutas). Exibe faixa, peso, quantidade de atletas e árbitro responsável. Suporta busca textual por título da chave. Cada card exibe badge de status no canto superior direito:
  - **"ENCERRADO"** (amarelo gold): quando a luta da última rodada da chave possui vencedor definido (chave finalizada com campeão). Cards de chaves encerradas são renderizados com `opacity: 0.5` (visual opaco) mas permanecem clicáveis — o usuário pode navegar para visualizar o bracket e resultados finais.
  - **"EM ANDAMENTO"** (ciano): quando a chave possui pelo menos uma luta finalizada pelo operador (`status: 'completed'`) mas a última rodada ainda não possui vencedor. Lutas com `status: 'wo'` (BYEs auto-resolvidos na geração) não são consideradas.
  - Sem badge: quando nenhuma luta da chave foi iniciada.
  - Badge de contagem de lutas usa cor azul (padrão visual `#1565C0`).
- **Tela do bracket (`/admin/placar/chave/:areaId/:chaveId`):** `PlacarBracket` renderiza a árvore do bracket (`BracketTree`) e abaixo uma tabela "Lutas para Iniciar" com botão "Iniciar" para cada luta válida.
- **Bloqueio de lutas inválidas:** Lutas com pelo menos um lado `tbd` ou `bye` não exibem botão "Iniciar". Lutas com status `completed` ou `wo` também não.
- **Tela do placar (`/admin/placar/luta/:areaId/:chaveId/:lutaId`):** `PlacarLuta` exibe:
  - Atleta A no lado esquerdo com fundo **branco** (`#ffffff`) e texto escuro.
  - Atleta B no lado direito com fundo **azul anil** (`#1e3a8a`) e texto branco.
  - Para cada atleta, exibe nome, faixa (label) e equipe.
  - Cronômetro regressivo central (mm:ss) com botões **Iniciar/Pausar** e **Zerar**; valor inicial editável (1–30 min, padrão 5 min); sem áudio.
  - Contadores de pontos 2/3/4 (com + e −) por atleta; total acumulado = 2×qtd2 + 3×qtd3 + 4×qtd4.
  - Contadores de vantagens e punições (0–4) por atleta.
  - Alerta visual de "Desclassificação" ao atingir 4 punições.
  - Botão "Finalizar Luta" → modal com tipo (Pontos, Finalização, DQ, Desempate) e vencedor. Ao abrir o modal, o cronômetro é pausado automaticamente se estiver em andamento. Todas as opções de resultado estão sempre habilitadas (sem restrição por estado da luta). O modal não exibe detalhes de implementação (flags do JSON). Ao clicar em "Confirmar", um segundo modal centralizado de confirmação aparece (com texto dinâmico por tipo e botão "Confirmar desclassificação" para DQ). Somente após essa segunda confirmação o resultado é persistido e o vencedor é propagado para a próxima rodada.
  - Botão "Voltar sem finalizar" → retorna para o `PlacarBracket` da chave (rota `/admin/placar/chave/:areaId/:chaveId`).
- **Persistência:** Após a segunda confirmação, a `Luta` recebe `vencedorId`, `status` (`completed` ou `wo` — `wo` para DQ), `placarA`, `placarB`, `finalizacao`, `desclassificacao`, `desclassificadoId`, `desempateArbitro`, `updatedAt` (timestamp ISO 8601). O vencedor é propagado para a próxima rodada (slot `tbd`) pela função `advanceWinnerInChave` (ver seção 3.11.1). Todas as lutas da chave e a própria chave também têm seu `updatedAt` atualizado para o momento do resultado. O sistema não implementa regra automática de dupla desclassificação — o operador sempre declara um vencedor.
- **`desclassificadoId`:** Quando o resultado é do tipo DQ, o campo `desclassificadoId` é preenchido com o ID do atleta desclassificado (o perdedor, que não é o `vencedorId`). Quando o resultado não é DQ, `desclassificadoId` fica `undefined`.
- **Validação de pontos:** Quando o tipo de resultado é "Pontos", antes da segunda confirmação o sistema valida se o atleta selecionado como vencedor realmente possui mais pontos totais no placar. Em caso de empate nos pontos, o critério de desempate é `vantagens`. Se a validação falhar, um modal de aviso vermelho é exibido com a mensagem "Tem certeza que este é o campeão?" e opções "Voltar" (retorna ao modal anterior) e "Confirmar mesmo assim" (prossegue com o registro). Para tipos de resultado diferentes de "Pontos" (finalização, DQ, desempate), a validação não é acionada.
- **Normalização retroativa:** Chaves legadas sem `placarA`/`placarB` carregam sem erro; `normalizeLuta` adiciona defaults.
- **Estado bloqueado:** Lutas com `tbd`/`bye` ou `completed`/`wo` exibem placar congelado e desabilitam controles e "Finalizar Luta".
- **Especificação detalhada:** Ver `spec/placar.md` (fluxo), `spec/placar-jiu-jitsu.md` (placar funcional), `spec/placar-voltar-bracket.md` (correção do botão Voltar) e `spec/finalizar-luta-desclassificacao.md` (confirmação de resultado e habilitação de opções).
- **Telão - Segunda janela do Placar (2026-06-29):** Botão "Telão" nas telas PlacarLuta e PlacarLutaCasada que abre uma segunda janela do Electron exibindo o placar completo + cronômetro em estilo telão (fontes grandes, layout otimizado para projeção). A segunda janela atualiza em tempo real via IPC quando o placar é alterado na janela principal. Rota: `/admin/telao/:lutaId`. Arquivos: `PlacarExibicao.tsx`, handlers IPC em `electron/main.ts`, canais em `electron/preload.ts`. Ver `implementado/telao-placar.md`.

#### 3.19.2. Clarificação de WO no Placar (Implementado)

- **Problema:** Os botões de WO no `RegistrarResultadoModal` diziam "WO {nome}", gerando confusão se o atleta vencia ou perdia por WO.
- **Solução:** Os labels dos botões foram alterados para "Vitória WO: {nome}", tornando explícito que o atleta selecionado é o vencedor.
- **Comportamento:** Ao abrir o modal de registro de resultado (via clique em atleta no bracket), dois botões laranjas "Vitória WO: {nome}" são exibidos. Clicar em um deles define o atleta como vencedor com status `'wo'`.
- **Arquivo afetado:** `src/components/RegistrarResultadoModal.tsx`
- **Spec:** `spec/wo-clarificar-vencedor.md`

#### 3.19.1. Registro de Horário de Início e Término de Lutas (Implementado)

- **Campos gravados:** Cada `Luta` (em `src/types/bracket.ts`) grava dois campos opcionais: `horarioInicio?: string` e `horarioTermino?: string`. Cada `LutaCasada` (em `src/types/lutaCasada.ts`) grava `horarioInicio?: string` (e reutiliza o campo `dataFinalizacao?: string | null` já existente como horário de término).
- **Formato:** String `DD/MM/YYYY HH:mm:ss` (ex.: `05/06/2026 14:32:10`), gerada client-side via `dayjs().format('DD/MM/YYYY HH:mm:ss')`. Timezone é o do sistema operacional do usuário (sem `dayjs.tz.setDefault`).
- **Captura do horário de início:** Gravado no **primeiro clique** no botão "Iniciar" do cronômetro em `PlacarLuta.tsx` ou `PlacarLutaCasada.tsx`. Uso de `useRef<string | null>` (não `useState`) para evitar re-render desnecessário. Pausar e retomar o cronômetro **não** sobrescreve `horarioInicio` (verificado por `if (!rodando && horarioInicioRef.current === null)`). Se o operador nunca clicar em "Iniciar" e for direto para "Finalizar Luta", `horarioInicio` permanece `undefined`.
- **Captura do horário de término:** Gravado no momento da **confirmação final** do resultado (clique em "Confirmar resultado" no segundo modal de `PlacarLuta.tsx`, ou no `persistirResultado` de `PlacarLutaCasada.tsx`). Para `LutaCasada`, gravado em `dataFinalizacao`; para `Luta`, gravado em `horarioTermino`.
- **Persistência:** Os timestamps são enviados no mesmo payload do `registrarResultado` (Luta) ou no objeto `LutaCasada` completo (LutaCasada) e gravados atomicamente no JSON do torneio ativo pelo main process. O handler `registrarResultadoHandler` em `electron/brackets.ts:1442` preserva timestamps existentes se o payload não os trouxer (idempotente).
- **Visualização:** A tela de Resultados exibe, em `LutaResumoCard` (`src/pages/Resultados.tsx`), um bloco com `Início: HH:MM:SS` e `Término: HH:MM:SS` para cada luta finalizada (chave e casada). Campos ausentes exibem `—`. `aria-label` descritivo em cada texto para acessibilidade.
- **Normalização retroativa:** `normalizeLuta` (`electron/brackets.ts:954`) e `normalizeLutaCasada` (`electron/lutasCasadas.ts:25`) garantem defaults `undefined` para os novos campos, permitindo que JSONs de torneios legados (sem os campos) sejam lidos sem erro.
- **Limitação conhecida — reabertura de luta:** O sistema não implementa handler explícito de "reabrir luta" (limpar vencedor e voltar status para `pending`). Quando um handler de reabertura for introduzido em ciclo futuro, ele deverá limpar `horarioInicio` e `horarioTermino`/`dataFinalizacao` para forçar nova captura. Atualmente, refinalizações subsequentes sobrescrevem os timestamps (ou preservam se o payload não os trouxer, comportamento idempotente).
- **Especificação detalhada:** Ver `spec/timestamp-inicio-fim-lutas.md`.

---

### 3.20. Geração de Chaves — 16 Atletas

Para chaves com **16 atletas**, o sistema gera uma chave de eliminação simples com **15 lutas** distribuídas em **4 rodadas**, sem BYEs — chave perfeita desde a primeira rodada.

#### Estrutura da Chave

| Rodada | Lutas | Descrição |
|--------|-------|-----------|
| R1 (Oitavas) | L1-L8 | 8 lutas reais entre posições 0-15 (todas com atletas definidos) |
| R2 (Quartas) | L9-L12 | L9: vencedor(L1) × vencedor(L2). L10: vencedor(L3) × vencedor(L4). L11: vencedor(L5) × vencedor(L6). L12: vencedor(L7) × vencedor(L8) |
| R3 (Semifinais) | L13-L14 | L13: vencedor(L9) × vencedor(L10). L14: vencedor(L11) × vencedor(L12) |
| R4 (Final) | L15 | vencedor(L13) × vencedor(L14) |

#### Propagação de Vencedores (`advanceWinner16`)

- L1 → L9.atletaAId
- L2 → L9.atletaBId
- L3 → L10.atletaAId
- L4 → L10.atletaBId
- L5 → L11.atletaAId
- L6 → L11.atletaBId
- L7 → L12.atletaAId
- L8 → L12.atletaBId
- L9 → L13.atletaAId
- L10 → L13.atletaBId
- L11 → L14.atletaAId
- L12 → L14.atletaBId
- L13 → L15.atletaAId
- L14 → L15.atletaBId

#### Separação de Equipes

- `aplicarSeedSorting16`: sideA=[0,1,2,3,4,5,6,7], sideB=[8,9,10,11,12,13,14,15]

#### Detalhes de Implementação

- **Arquivo:** `electron/brackets.ts`
- **Funções:** `gerarLutas16()`, `advanceWinner16()`, `aplicarSeedSorting16()`
- **Dispatchers:** case 16 em `gerarLutas()`, case 16 em `registrarResultadoHandler()`

### 3.21. Bloqueio de Lutas por Rodada

Regra de integridade do bracket: lutas de uma rodada N+1 só podem ser iniciadas (ou ter vencedor registrado) após **todas** as lutas da rodada N estarem finalizadas.

#### Critério de "Rodada Completa"

Uma rodada R é considerada completa quando **toda** luta de R possui um dos status finais:

- `completed` — vencedor registrado normalmente
- `wo` — vitória por WO (inclui BYE pré-preenchido na geração e DQ por desclassificação)

Lutas com status `pending` (ainda não iniciadas) ou `in-progress` (em andamento) **bloqueiam** a próxima rodada.

#### Comportamento Esperado

| Rodada Anterior | Rodada Atual | Pode Iniciar? |
|-----------------|--------------|----------------|
| R1 completa | R2 com atletas definidos | ✅ Sim |
| R1 incompleta (lutas pending) | R2 com atletas definidos | ❌ Não |
| R1 completa (lutas com BYE = `wo`) | R2 | ✅ Sim (BYE já é `wo`) |
| R2 completa | R3 com atletas definidos | ✅ Sim |
| R3 completa | R4 (Final) | ✅ Sim |
| Qualquer | R1 | ✅ Sim (sem rodada anterior) |

#### Pontos de Validação

- **Tabela "Lutas para Iniciar"** (`PlacarBracket.tsx`): apenas lutas cujas rodadas anteriores estão completas são listadas.
- **Card de luta no `BracketTree`**: lutas bloqueadas são renderizadas com opacidade reduzida, cursor `not-allowed` e tooltip "Aguarde a rodada anterior terminar". Cliques no card são ignorados.
- **Backend (futuro)**: IPC `registrar-resultado` e `salvar-resultado-luta` podem ser reforçados para defesa em profundidade.

#### Detalhes de Implementação

- **Arquivo:** `src/pages/PlacarBracket.tsx`
  - `startableFights` (useMemo): adiciona verificação `rodadasCompletas.has(l.rodada)`.
- **Arquivo:** `src/components/BracketTree.tsx`
  - `rodadasCompletas` (useMemo): constrói set de rodadas que satisfazem a regra.
  - `Card` (componente): aceita prop `disabled`; aplica opacidade, cursor e bloqueia `onClick` quando `disabled=true`.
  - Ambos os call sites de `Card` (16 atletas e pirâmide) passam `disabled={!rodadasCompletas.has(item.rodada)}`.
- **Spec:** `spec/16-atletas.md`

### 3.22. Luta Casada (Placar Area)

Recurso de lutas de exibição/super fight na tela `PlacarChaves` (Placar Area). Permite criar uma luta avulsa entre dois atletas cadastrados no torneio, sem vínculo com chave de eliminação oficial, registrando o resultado e exibindo tag "LUTA CASADA".

#### Dados Persistidos

- `LutaCasada` armazenada em `torneio.lutasCasadas` (array de objetos):
  - `id` (uuid), `areaId`, `arbitroId` (primeiro árbitro da área ou `null`)
  - `atletaAId`, `atletaBId` (refs)
  - `atletaASnapshot`, `atletaBSnapshot` (nome, faixa, pesoKg, equipe, categoria — congelados no momento da criação)
  - `tag: 'luta-casada'`
  - `status: 'pending' | 'completed' | 'wo'`
  - `placarA?`, `placarB?`, `vencedorId?`, `finalizacao?`, `desclassificacao?`, `desempateArbitro?`
   - `dataFinalizacao?`
   - `deletedAt?` (soft-delete)
   - `createdAt`, `updatedAt`

#### Fluxo

1. Em `PlacarChaves`, nova seção "Lutas Casadas" no topo, com botão "Nova Luta Casada".
2. Clique abre `ModalCriarLutaCasada`:
   - 2 `Select` pesquisáveis (Atleta A, Atleta B) com lista de `loadAthletes`
   - Snapshot automático de faixa/peso/equipe/categoria ao selecionar
   - Exibe árbitro da área (`area.arbitroIds[0]`)
   - Bloqueia criação se A === B ou se área sem árbitro
3. Ao criar, navega para `/admin/placar/luta-casada/:areaId/:lutaCasadaId`.
4. `PlacarLutaCasada` é espelhada de `PlacarLuta`, mas:
   - Exibe badge "LUTA CASADA" no header
   - Não depende de `chaveId`
   - Usa snapshots congelados nos painéis A/B
   - Persiste via `updateLutaCasada` em vez de `registrarResultado`
5. Ao finalizar, retorna para `PlacarChaves` e a luta aparece com status atualizado.
6. **Listagem administrativa:** A página `AdminLutasCasadas` (rota `/admin/lutas-casadas`) exibe todas as lutas casadas do torneio em tabela, com checkboxes para seleção múltipla, soft-delete em lote, toggle "Mostrar apenas os deletados", restore e exclusão permanente individual/em lote — mesmo padrão das demais telas de listagem (AdminAthletes, AdminAreas, AdminArbitros).

#### Pontos de Validação

- Backend: `atletaAId !== atletaBId` (lançado em `saveLutaCasada` e `updateLutaCasada`).
- Frontend: validações no modal (Atleta A ≠ B, área com árbitro) e botões desabilitados.

#### Detalhes de Implementação

- **Arquivo:** `src/types/lutaCasada.ts` — tipo `LutaCasada`, `AtletaSnapshot`, `LutaCasadaStatus`.
- **Arquivo:** `src/types/tournament.ts` — `Torneio.lutasCasadas?: LutaCasada[]`. Campo `deletedAt` suportado via `LutaCasada`.
- **Arquivo:** `electron/lutasCasadas.ts` — persistência (`loadLutasCasadas`, `loadDeletedLutasCasadas`, `loadLutasCasadasPorArea`, `saveLutaCasada`, `updateLutaCasada`, `deleteLutaCasada`, `deleteLutasCasadas`, `permanentlyDeleteLutaCasada`, `permanentlyDeleteLutasCasadas`, `restoreLutaCasada`, `restoreLutasCasadas`).
- **Arquivo:** `electron/main.ts` — `registerLutasCasadasHandlers` (11 IPCs).
- **Arquivo:** `electron/preload.ts` — expõe todos os métodos acima.
- **Arquivo:** `src/types/electron.d.ts` — typings dos novos métodos.
- **Arquivo:** `src/components/ModalCriarLutaCasada.tsx` — modal de criação.
- **Arquivo:** `src/pages/PlacarChaves.tsx` — seção de lutas casadas e listagem.
- **Arquivo:** `src/pages/PlacarLutaCasada.tsx` — scoreboard de luta casada.
- **Arquivo:** `src/pages/AdminLutasCasadas.tsx` — página de listagem/gestão de todas as lutas casadas (dashboard) com checkboxes, soft-delete em lote, toggle lixeira, restore.
- **Arquivo:** `src/components/PageLayout.tsx` — adiciona prop opcional `headerExtras` para badges no header.
- **Arquivo:** `src/App.tsx` — nova rota `/admin/placar/luta-casada/:areaId/:lutaCasadaId` e `/admin/lutas-casadas`.
- **Spec:** `spec/luta-casada.md`

### 3.23. Resultados — Tela com Tudo do Torneio

Nova rota `/admin/resultados` que exibe uma visão consolidada de todos os dados do torneio ativo (carregados de `torneio.json`). O card "Resultados" do `Dashboard.tsx` (que estava `status: 'planned'`) passa a `status: 'implemented'` com `route: '/admin/resultados'`.

#### Estrutura da Tela

A página usa `Tabs` do Mantine com 6 abas:

| Aba | Conteúdo |
|-----|----------|
| **Visão Geral** | Cards com contadores (atletas, chaves, lutas casadas, áreas, árbitros) + lista de medalhistas (🥇/🥈/🥉) por chave encerrada |
| **Chaves** | Tabela com Categoria, Atletas, Status (PENDENTE/EM ANDAMENTO/ENCERRADO), Vencedor |
| **Lutas Casadas** | Cards com Atleta A vs B, status, vencedor |
| **Equipes** | Tabela com Equipe, Atletas, 🥇 Ouro, 🥈 Prata, 🥉 Bronze agregados |
| **Árbitros** | Tabela com Árbitro, Faixa, Equipe, total de Lutas (chave + casada) |
| **Atletas** | Tabela scrollável com Atleta, Equipe, Faixa, Peso, Categoria, Chave |

#### Cálculo de Medalhistas

- **🥇 Ouro (1º)**: vencedor da luta final (maior `rodada` da chave com `vencedorId`).
- **🥈 Prata (2º)**: perdedor da luta final.
- **🥉 Bronze (3º)**: perdedores das semifinais (apenas para chaves com `rodada ≥ 3`).
- Para chaves com 2-3 atletas (sem semifinal): apenas 1º e 2º são exibidos.

#### Comportamento

- Empty state quando não há torneio ativo, com botão para voltar ao menu inicial.
- Medalhas por equipe são agregadas a partir de todas as chaves encerradas.
- Lista de atletas usa `stickyHeader` e `maxHeight: 60vh` para scroll interno.
- Apenas leitura — nenhum dado é modificado.
- **Status da chave (`getChaveStatus`):** O status é determinado por:
  - **ENCERRADO** — a luta da rodada final (`maxRodada`) possui `vencedorId` definido.
  - **EM ANDAMENTO** — pelo menos uma luta com `status === 'completed'` (luta real finalizada) existe. BYE lutas (`status: 'wo'`) não contam.
  - **PENDENTE** — nenhuma luta real foi finalizada (chave ainda não iniciada).
- **Ordenação das chaves:** No painel "Chaves", as chaves são ordenadas com encerradas no topo da lista, seguidas pelas demais.

#### Detalhes de Implementação

- **Arquivo:** `src/pages/Resultados.tsx` — página completa com 6 abas e cálculos agregados.
- **Arquivo:** `src/pages/Dashboard.tsx` — card "Resultados" muda para `status: 'implemented'` + `route: '/admin/resultados'`.
- **Arquivo:** `src/App.tsx` — nova rota `/admin/resultados`.
- **Spec:** `spec/resultados-menu.md`

### 3.24. PDF de Resultados com Tabelas e Páginas Separadas (Implementado)

- **Botão "Gerar PDF Resultados":** Na aba "Visão Geral" da tela de Resultados, o botão gera um PDF consolidado com 4 seções, cada uma em página separada.
- **Seções do PDF:**
  1. **Medalhistas:** Tabela com colunas: Categoria (nome + faixa), Atletas (qtd), Ouro, Prata, Bronze. Cada chave encerrada é uma linha.
  2. **Ranking de Equipes:** Tabela com colunas: #, Equipe, Atletas, Ouro, Prata, Bronze. Ordenada por ouro (desc), prata (desc), bronze (desc).
  3. **Árbitros:** Tabela com colunas: #, Árbitro, Faixa, Equipe, Lutas (total de chaves atribuídas).
  4. **Atletas:** Tabela com colunas: #, Atleta, Equipe, Faixa, Peso, Categoria, Chave. Ordenada alfabeticamente.
- **Page breaks:** Cada seção (exceto a primeira) inicia em nova página via `pageBreak: 'before'`.
- **Nome do arquivo:** `resultados-{nome-torneio}.pdf`.
- **Spec:** `spec/pdf-resultados.md`

### 3.25. Trocar Área de Luta na Chave com Ícone de Editar (Implementado)

- **Área visível nos cards:** Na tela "Gerenciar Chaves", cada card de chave exibe o nome da área (se atribuída) ao lado do árbitro.
- **Botão "Editar":** Cada card possui um botão "Editar" (ícone `IconPencil`, cor azul) ao lado do "Excluir". O botão abre o modal de visualização da chave, permitindo editar árbitro, área e embaralhar.
- **Seletor de área no modal:** O modal de visualização inclui um Select "Área de Luta" (pesquisável, clearable). Ao selecionar uma nova área, o primeiro árbitro da área é atribuído automaticamente. Ao limpar, o árbitro é removido.
- **Spec:** `spec/trocar-area-chave.md`

### 3.26. Área de Luta Editável em Lutas Casadas (Implementado)

- **Coluna "Área" na listagem:** A tabela de lutas casadas (`AdminLutasCasadas`) exibe uma coluna "Área" com o nome da área de cada luta.
- **Seletor de área no modal de edição:** O `ModalEditarLutaCasada` inclui um Select "Área de Luta" (pesquisável, clearable). Ao trocar de área, o árbitro é automaticamente atualizado para o primeiro árbitro da nova área.
- **Spec:** `spec/area-luta-casada.md`

### 3.27. Criar Chave Manual com Qualquer Faixa/Categoria (Implementado)

- **Sem filtro de faixa/categoria:** Na criação manual de chaves (`ModalCriarChaveManual`), o seletor de atletas lista todos os atletas disponíveis (não estão em outra chave) sem filtrar por faixa ou categoria.
- **Flexibilidade:** O administrador pode criar chaves especiais com atletas de diferentes categorias e faixas.
- **Spec:** `spec/chave-manual-faixa-categoria.md`

---

## 4. Plataforma

A aplicação será desenvolvida para:

- Windows 10
- Windows 11

O sistema será distribuído como software desktop utilizando Electron.

### 4.1. Configuração da Janela

- A janela do Electron é criada com `win.maximize()` na inicialização, ocupando toda a tela disponível.
- Ícone da janela: `{VITE_PUBLIC}/favicon.svg`.

---

## 5. Stack Tecnológica

### Desktop
- Electron 30

### Interface
- React 18 + TypeScript 5
- Vite 5 (bundler)
- Mantine UI 7 (componentes)
- Tabler Icons 3
- React Router 6 (`HashRouter`)
- dayjs (datas)

### Formulários
- `@mantine/form` com `@mantine/core` (TextInput, NumberInput, Select, DatePickerInput)

### Validação
- `@mantine/form` com regras `validate`

### Notificações
- `@mantine/notifications`

### Persistência
- `fs` (Electron main process)

### Build
- electron-builder
- vite-plugin-electron

---

## 6. Persistência de Dados

O sistema utiliza exclusivamente arquivos JSON para armazenamento local, sem dependência de banco de dados externo. Toda operação funciona offline.

### 6.1. Geração dos Arquivos JSON

Cada entidade é persistida em um ou mais arquivos JSON. Os torneios são armazenados em arquivos individuais dentro de `{userData}/data/torneios/`. O arquivo de cada torneio é gerado no momento da criação ou importação.

O torneio ativo é definido por `{userData}/data/torneio-ativo.json` que armazena o `id` do torneio em uso.

- **`ensureDirs()`:** No momento do primeiro acesso a dados, o sistema cria automaticamente os diretórios `{userData}/data/torneios/` e `{userData}/data/` se não existirem.
- **`getActiveTournamentId()`:** Lê o arquivo `torneio-ativo.json`. Se o arquivo não existir ou estiver malformado, retorna `null` (sem lançar erro).
- **`list-tournaments`:** Lê TODOS os arquivos `.json` do diretório `torneios/` — não há validação de esquema; qualquer `.json` presente é tratado como torneio.

### 6.2. Estrutura de Diretórios

```
{userData}/
  data/
    torneios/
      {id}.json           # JSON do torneio com campo "atletas"
    torneio-ativo.json    # { "id": "uuid-do-torneio-ativo" }
    atletas.json          # Exportação da lista de atletas (via export-athletes)
    activation.json       # { "token": "hmac-token", "activatedAt": "ISO" }
```

### 6.3. Estrutura do JSON de Torneio (`{userData}/data/torneios/{id}.json`)

```json
{
  "id": "uuid-v4",
  "nome": "Nome do Torneio",
  "data": "2026-12-25",
  "createdAt": "2026-05-31T10:00:00.000Z",
  "updatedAt": "2026-05-31T10:00:00.000Z",
  "startedAt": "2026-06-01T08:00:00.000Z",
  "atletas": [
    {
      "id": "uuid-v4",
      "nome": "joão silva",
      "equipe": "gracie barra",
      "genero": "masculino",
      "categoria": "adulto-masculino-leve",
      "pesoKg": 76.5,
      "faixa": "azul",
      "anoNascimento": 1998,
      "emChave": true,
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  ]
}
```

### 6.4. Estrutura do JSON de Atleta (formato do array dentro do campo `atletas` do torneio)
```json
[
  {
    "id": "uuid-v4",
    "nome": "joão silva",
    "equipe": "gracie barra",
    "genero": "masculino",
    "categoria": "adulto-masculino-leve",
    "pesoKg": 76.5,
    "faixa": "azul",
    "anoNascimento": 1998,
    "emChave": true,
    "createdAt": "2026-05-31T10:00:00.000Z",
    "updatedAt": "2026-05-31T10:00:00.000Z"
  }
]
```

---

## 7. Comunicação Main <> Renderer (IPC)

| Canal | Direção | Descrição |
|---|---|---|
| `create-tournament` | Renderer → Main | Cria novo torneio e salva no diretório |
| `list-tournaments` | Renderer → Main → Renderer | Retorna array com todos os torneios |
| `start-tournament` | Renderer → Main | Define torneio como ativo e registra `startedAt` |
| `get-active-tournament` | Renderer → Main → Renderer | Retorna torneio ativo ou `null` |
| `export-tournament` | Renderer → Main | Abre diálogo "Salvar como" e copia JSON |
| `import-tournament` | Renderer → Main | Importa JSON com merge por `updatedAt` (last-write-wins por item em todos os sub-arrays: `atletas`, `arbitros`, `areas`, `chaves`, `lutasCasadas`). Retorna `{ success, merged, created, updated, kept, removed }` |
| `read-file` | Renderer → Main → Renderer | Lê conteúdo de arquivo do disco |
| `update-tournament` | Renderer → Main | Atualiza dados do torneio |
| `delete-tournament` | Renderer → Main | Remove arquivo JSON do torneio (+ `torneio-ativo.json` se for o ativo) |
| `load-athletes` | Renderer → Main → Renderer | Carrega atletas do torneio ativo (`torneios/{id}.json` → campo `atletas`) |
| `save-athlete` | Renderer → Main | Adiciona novo atleta ao torneio ativo (lança erro se não houver torneio ativo) |
| `update-athlete` | Renderer → Main | Atualiza atleta existente no torneio ativo (match por `id`) |
| `delete-athlete` | Renderer → Main | Remove atleta do torneio ativo pelo `id` |
| `import-athletes` | Renderer → Main → Renderer | Abre diálogo nativo, lê JSON, mescla com lista do torneio ativo, retorna `{imported, skipped}` |
| `check-activation` | Renderer → Main → Renderer | Verifica se o software está ativado |
| `validate-password` | Renderer → Main → Renderer | Valida senha de ativação (hash SHA-256) |
| `activate-license` | Renderer → Main → Renderer | Gera e salva token HMAC de ativação |
| `gerar-todas-chaves` | Renderer → Main → Renderer | Gera todas as chaves do torneio, distribui árbitros automaticamente, marca `emChave` nos atletas |
| `gerar-chave` | Renderer → Main → Renderer | Gera chave para uma categoria (mín. 2, máx. 16 atletas) + marca `emChave` |
| `load-chaves` | Renderer → Main → Renderer | Carrega todas as chaves do torneio ativo |
| `load-chave-por-categoria` | Renderer → Main → Renderer | Carrega chave de uma categoria específica |
| `randomizar-chave` | Renderer → Main → Renderer | Randomiza ordem dos atletas na chave com separação de equipes, mantém `emChave` |
| `atribuir-arbitro-chave` | Renderer → Main → Renderer | Atribui ou remove árbitro de uma chave |
| `import-chaves` | Renderer → Main → Renderer | Abre diálogo nativo, importa chaves de arquivo JSON, marca `emChave` |
| `export-chaves` | Renderer → Main | Exporta chaves para arquivo JSON via diálogo "Salvar como" |
| `save-arbitro` | Renderer → Main | Adiciona novo árbitro ao torneio ativo |
| `update-arbitro` | Renderer → Main | Atualiza árbitro existente (match por `id`) |
| `delete-arbitro` | Renderer → Main | Remove árbitro do torneio ativo pelo `id` |
| `load-arbitros` | Renderer → Main → Renderer | Carrega todos os árbitros do torneio ativo |
| `import-arbitros` | Renderer → Main → Renderer | Abre diálogo nativo, lê JSON, mescla com lista do torneio ativo |
| `export-arbitros` | Renderer → Main | Abre diálogo "Salvar como" e exporta JSON dos árbitros |
| `load-areas` | Renderer → Main → Renderer | Carrega todas as áreas de luta do torneio ativo |
| `save-area` | Renderer → Main | Adiciona nova área de luta ao torneio ativo |
| `update-area` | Renderer → Main | Atualiza área de luta existente (match por `id`) |
| `delete-area` | Renderer → Main | Remove área de luta do torneio ativo pelo `id` |
| `delete-areas` | Renderer → Main | Remove múltiplas áreas de luta do torneio ativo |
| `delete-athletes` | Renderer → Main | Remove múltiplos atletas do torneio ativo |
| `delete-arbitros` | Renderer → Main | Remove múltiplos árbitros do torneio ativo |
| `registrar-resultado` | Renderer → Main | Registra resultado de luta e propaga vencedor |
| `load-chaves-por-area` | Renderer → Main → Renderer | Carrega chaves filtradas por área (pelos árbitros da área) |
| `editar-chave` | Renderer → Main → Renderer | Edita manualmente as posições dos atletas em uma chave |
| `salvar-resultado-luta` | Renderer → Main | Salva resultado de luta no placar (persistência do placar) |
| `export-athletes` | Renderer → Main | Abre diálogo "Salvar como" e exporta JSON dos atletas |

---

## 8. Rotas da Aplicação

| Rota | Componente | Descrição |
|---|---|---|
| `/` | `MenuInicial` | Menu principal com 3 opções (Criar, Importar, Listar) |
| `/admin/criar-torneio` | `CriarTorneio` | Formulário de criação de torneio |
| `/admin/importar-torneio` | `ImportarTorneio` | Tela de importação com upload e validação |
| `/admin/listar-torneios` | `ListarTorneios` | Lista com ações Iniciar / Exportar / Excluir. Ordenada alfabeticamente por nome do torneio. |
| `/admin/dashboard` | `Dashboard` | Dashboard Administrativo do torneio ativo |
| `/admin/atletas` | `AthletesMenu` | Menu de atletas com 3 cartões (Cadastrar, Listar, Importar) |
| `/admin/atletas/lista` | `AdminAthletes` | Gerenciamento de atletas (tabela CRUD + botões) |
| `/admin/equipes` | `Equipes` | Resumo de equipes com contagem de atletas |
| `/admin/arbitros` | `ArbitrosMenu` | Menu intermediário de árbitros (3 cartões) |
| `/admin/arbitros/lista` | `AdminArbitros` | Gerenciamento de árbitros (tabela CRUD + botões) |
| `/admin/categorias/chaves` | `GerenciarChaves` | Geração, edição e visualização de chaves de luta (máx. 5 atletas) |
| `/admin/areas` | `AreasMenu` | Menu de áreas de luta com 2 cartões (Cadastrar, Listar) |
| `/admin/areas/lista` | `AdminAreas` | Gerenciamento de áreas de luta (tabela CRUD + busca) |
| `/admin/placar` | `PlacarMenu` | Seleção de área de luta para o placar |
| `/admin/placar/chaves/:areaId` | `PlacarChaves` | Lista de chaves da área selecionada |
| `/admin/placar/chave/:areaId/:chaveId` | `PlacarBracket` | Bracket da chave + lutas iniciáveis |
| `/admin/placar/luta/:areaId/:chaveId/:lutaId` | `PlacarLuta` | Placar funcional (cronômetro, pontos, vantagens, punições) |

> O roteamento utiliza `HashRouter` (não `BrowserRouter`) para compatibilidade com o protocolo `file://` no Electron em produção.

### Fluxo de Navegação

```
[Menu Inicial (/)]
  ├── Criar Torneio      → /admin/criar-torneio
  │                        └── (após criar) → /admin/listar-torneios
  │
  ├── Importar Torneio   → /admin/importar-torneio
  │                        └── (após importar) → /admin/listar-torneios
  │
   └── Listar Torneios    → /admin/listar-torneios
                             ├── [Iniciar] → /admin/dashboard (registra startedAt)
                             ├── [Exportar] → diálogo "Salvar como"
                             └── [Excluir] → modal de confirmação → remove arquivo
```

### Fluxo Dashboard → Funcionalidades

```
[Dashboard /admin/dashboard]
    ├── Atletas     → /admin/atletas (AthletesMenu)
    │                 ├── Cadastrar Atleta → modal AthleteForm inline + IPC save
    │                 ├── Listar Atletas   → /admin/atletas/lista (AdminAthletes, tabela CRUD)
    │                 └── Importar Atletas → diálogo nativo de arquivo JSON via IPC
    ├── Equipes     → /admin/equipes (Equipes, resumo com contagem de atletas por equipe)
    ├── Categorias  → (Em breve)
    ├── Inscrições  → (Em breve)
    ├── Pesagem     → (Em breve)
    ├── Chaves      → /admin/categorias/chaves (GerenciarChaves, geração/edição)
    ├── Áreas       → /admin/areas (AreasMenu)
    ├── Árbitros    → /admin/arbitros (ArbitrosMenu)
    ├── Placar      → /admin/placar (PlacarMenu → PlacarChaves → PlacarBracket → PlacarLuta)
    ├── Resultados  → (Em breve)
    └── Relatórios  → (Em breve)
```

### Fluxo AthletesMenu

```
[AthletesMenu /admin/atletas]
    ├── Cadastrar Atleta → abre modal AthleteForm (mesma página, useDisclosure)
    │                      ├── Salvar → IPC save-athlete + recarrega lista via loadAthletes()
    │                      └── Fechar → modal close
    │
    ├── Listar Atletas   → /admin/atletas/lista (AdminAthletes)
    │                      ├── Importar → IPC import-athletes (diálogo nativo)
    │                      ├── Cadastrar → abre modal AthleteForm
    │                      ├── Tabela com ações (editar, excluir)
    │                      ├── Editar → abre modal AthleteForm preenchido
    │                      ├── Excluir → modal confirmação → IPC delete-athlete
    │                      └── Voltar → /admin/atletas (menu)
    │
    └── Importar Atletas → IPC import-athletes (diálogo nativo, mesma página)
```

### Fluxo ArbitrosMenu

```
[ArbitrosMenu /admin/arbitros]
    ├── Cadastrar Árbitro → abre modal ArbitroForm (mesma página, useDisclosure)
    │                       ├── Salvar → IPC save-arbitro + recarrega lista via loadArbitros()
    │                       └── Fechar → modal close
    │
    ├── Listar Árbitros  → /admin/arbitros/lista (AdminArbitros)
    │                      ├── Importar → IPC import-arbitros (diálogo nativo)
    │                      ├── Exportar → IPC export-arbitros (diálogo salvar como)
    │                      ├── Cadastrar → abre modal ArbitroForm
    │                      ├── Tabela com ações (editar, excluir)
    │                      ├── Editar → abre modal ArbitroForm preenchido
    │                      ├── Excluir → modal confirmação → IPC delete-arbitro
    │                      └── Voltar → /admin/arbitros (menu)
    │
    └── Importar Árbitros → IPC import-arbitros (diálogo nativo, mesma página)
```

---

## 9. Identidade Visual

### 9.1 Tema Principal

A identidade visual segue o tema **Oceano & Coral**, com azul marinho profundo como cor principal, azul claro como secundária, coral para destaques e amarelo royal para hovers.

#### 9.1.1 Paleta de Cores

| Elemento | Cor | Uso |
|---|---|---|
| **Primária (Marinho)** | `#1b325f` | Fundo da sidebar, botões principais, textos de título, bordas de cards, cabeçalhos de tabela |
| **Acento Azul** | `#3a89c9` | Hover de botões, borda ativa de navegação, links "Acessar", ícones de cards |
| **Secundário (Azul Claro)** | `#9cc4e4` | Texto de navegação secundário, bordas de cards, separadores |
| **BG Claro** | `#e9f2f9` | Fundo de página, círculos de ícones, backgrounds de badges, hover de navegação |
| **Coral (Destaque)** | `#f26c4f` | Ao vivo, badges de alerta, hover de borda de card, versão do sistema |
| **Amarelo Royal (Hover)** | `#ffbc11` | Hover do botão "Acessar" nos menus, glow de sombra |
| **Confirmação** | `#22c55e` / `#2e7d32` | Texto "Prontos para combate", cronômetro rodando |
| **Alerta / Perigo** | `#fa5252` | Punições, tempo esgotado, desclassificação |
| **Acento Ouro** | `#ccb24c` | Badges de campeão, medalhas, hover de botões secundários |
| **Ouro Claro** | `#f7d683` | Realces suaves, variação de ouro |
| **Branco** | `#ffffff` | Fundo de cards, papers, tabelas, modais |
| **Azul Anil (Placar)** | `#1e3a8a` | Painel do Atleta B no scoreboard (lado direito) |
| **Fundo página** | Gradient `#f8f9fa → #e3f2fd` | Body background |
| **Texto escuro** | `#212529` / `#374151` / `#1b325f` | Textos de corpo, labels, dados de tabela |
| **Texto secundário** | `rgba(27,50,95,0.5)` / `rgba(27,50,95,0.6)` / `#6c757d` | Descrições, labels de estatística, metadados |

### 9.2 Tipografia

| Elemento | Fonte | Peso | Tamanho |
|---|---|---|---|
| **Título principal** | Inter, sans-serif | Bold (700) | `clamp(28px, 2vw, 36px)` |
| **Opções do menu** | Inter, sans-serif | Semibold (600) | `clamp(18px, 1.5vw, 22px)` |
| **Texto auxiliar** | Inter, sans-serif | Regular (400) | `clamp(14px, 1vw, 16px)` |

### 9.3 Responsividade

O tema define tamanhos de fonte usando `clamp()` para garantir proporcionalidade à janela. Componentes Mantine são configurados com `defaultRadius: 'md'` e tamanhos `md` para botões e inputs.

---

## 10. Tela Inicial — Menu de Seleção

### 10.1 User Story

O usuário principal, após fechar as inscrições em seu sistema externo, abre o BJJ Tournament Manager para organizar o torneio. Ele escolhe entre criar um novo torneio, importar um torneio previamente exportado, ou listar os torneios já cadastrados.

### 10.2 Descrição

A primeira tela exibe um menu com três opções principais:

1. **Criar Torneio** — Abertura do formulário de cadastro de um novo torneio (`/admin/criar-torneio`).
2. **Importar Torneio** — Importação de um torneio a partir de um arquivo JSON (`/admin/importar-torneio`).
3. **Listar Torneios** — Visualização de todos os torneios cadastrados (`/admin/listar-torneios`).

### 10.3 Layout

```
+----------------------------------------------------------+
|  ┌───── BJJ TOURNAMENT MANAGER ──────┐ |
|  │                    [back]  Título                     │ |
|  └──────────────────────────────────────────────────────┘ |
|                                                           |
|                    ⭐ Gestão de Competições                |
|            BJJ TOURNAMENT MANAGER (gradient text)         |
|       Crie e coordene chaves de lutas dinâmicas...        |
|                                                           |
|   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   |
|   │ [blue icon]  │  │ [gray icon]  │  │ [teal icon]  │   |
|   │ Criar Novo   │  │ Importar     │  │ Central de   │   |
|   │ Torneio      │  │ via JSON     │  │ Torneios     │   |
|   │ Acessar →    │  │ Acessar →    │  │ Acessar →    │   |
|   └──────────────┘  └──────────────┘  └──────────────┘   |
|                                                           |
+----------------------------------------------------------+
```

### 10.4 Comportamento

- Ao iniciar o Electron, a rota `/` é carregada imediatamente.
- O menu é exibido independentemente de haver torneios cadastrados.
- Seleção: clique/touch, Tab + Enter.
- Feedback visual: hover (translateY(-2px), sombra), active (scale 0.98), foco (outline).

---

## 11. Regras de Validação

### 11.1. Torneio (CriarTorneio)

| Campo | Regra | Mensagem |
|---|---|---|
| **Data** | Obrigatório, deve ser futura (após hoje) | "A data do torneio deve ser futura" |

### 11.2. Atleta (AthleteForm)

| Campo | Regra | Mensagem |
|---|---|---|
| **Nome** | Mínimo 2 caracteres | "Nome deve ter ao menos 2 caracteres" |
| **Equipe** | Mínimo 2 caracteres | "Equipe deve ter ao menos 2 caracteres" |
| **Gênero** | Obrigatório | "Selecione um gênero" |
| **Categoria** | Obrigatório, deve ser uma categoria IBJJF válida | "Selecione uma categoria" |
| **Peso** | Número entre 1 e 300 | "Peso deve estar entre 1 e 300 kg" |
| **Faixa** | Deve ser uma faixa válida do enum | "Selecione uma faixa válida" |
| **Ano Nascimento** | Inteiro entre 1920 e ano atual | "Ano deve estar entre 1920 e {anoAtual}" |

A validação ocorre:
- **Em tempo real** ao digitar (modo controlado), com erro exibido abaixo do campo.
- **No submit** (`form.onSubmit`): se houver erro, o formulário não é enviado.

### 11.3. Árbitro (ArbitroForm)

| Campo | Regra | Mensagem |
|---|---|---|
| **Nome** | Obrigatório, Mínimo 2 caracteres | "Nome deve ter ao menos 2 caracteres" |
| **Equipe** | Obrigatório, se informada mínimo 2 caracteres | "Equipe deve ter ao menos 2 caracteres" |
| **Faixa** | Obrigatório, apenas roxa/marrom/preta | "Selecione uma faixa" |

### 11.4. Importação de Atletas (main process)

- O conteúdo do arquivo deve ser um array.
- Cada atleta deve ter os campos obrigatórios: `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg`, `genero`, `categoria`.
- A `categoria` informada é validada contra a lista de categorias IBJJF (`CATEGORIAS_IBJJF`). Se não for reconhecida, o lote é rejeitado.
- `id` é opcional — gerado automaticamente (`crypto.randomUUID()`) se ausente, preservado se presente.
- `createdAt` e `updatedAt` são **sempre** substituídos pelo timestamp atual (momento da importação), nunca preservados do arquivo de origem.
- Atletas com `id` já existente na lista são ignorados (skipped) — somente se `id` foi fornecido no arquivo.
- Atletas com mesmo `nome` (case-insensitive, trimmed) + `anoNascimento` são ignorados (skipped).

### 11.5. Geração de Chaves (main process)

| Validação | Mensagem de Erro |
|---|---|
| Categoria deve ter entre 2 e 16 atletas | `"A categoria precisa ter entre 2 e 16 atletas para gerar uma chave."` |
| Número de atletas deve ser 2–6, 9–16 | `"Número inválido de atletas"` |
| Chave já existe para a categoria | `"Chave já existe para esta categoria."` |

### 11.6. Importação de Chaves (main process)

| Validação | Mensagem de Erro |
|---|---|
| Conteúdo do arquivo deve ser um array | `"Arquivo inválido: o conteúdo deve ser um array de chaves."` |
| Cada chave deve ter `categoriaId` e `lutas` | `"Estrutura de chave inválida no arquivo."` |

### 11.7. Importação de Árbitros (main process)

| Validação | Mensagem de Erro |
|---|---|
| Conteúdo do arquivo deve ser um array | `"Arquivo inválido: o conteúdo deve ser um array de árbitros."` |
| Nome obrigatório, mínimo 2 caracteres | `"Nome deve ter ao menos 2 caracteres."` |
| Faixa deve ser roxa, marrom ou preta | `"Faixa inválida."` |
| Se equipe informada, mínimo 2 caracteres | `"Equipe deve ter ao menos 2 caracteres se informada."` |

### 11.8. Aplicação do Tema Oceano & Coral

As cores definidas em §9.1.1 (Paleta Oceano & Coral) são a identidade visual da aplicação.

| Regra | Comportamento |
|---|---|
| Cor primária (Marinho `#1b325f`) | Usada em botões principais, sidebar, títulos, bordas de card |
| Acento azul (`#3a89c9`) | Hover de botões, links "Acessar", ícones de cards do Dashboard |
| Coral (`#f26c4f`) | Destaques de alerta, badge "Ao Vivo", hover de borda de card |
| Amarelo royal (`#ffbc11`) | Hover do botão "Acessar" nos menus (AthletesMenu, ArbitrosMenu, AreasMenu) |
| BG claro (`#e9f2f9`) | Fundo de página, círculos de ícone, hover de navegação |
| Azul claro (`#9cc4e4`) | Bordas de card, texto secundário, separadores |
| Background body | Gradient `#f8f9fa → #e3f2fd` |
| Exceções | PlacarLuta e PlacarLutaCasada mantêm azul anil (`#1e3a8a`)/branco por design do scoreboard |

### 11.9. Layout Moderno (Oceano & Coral)

O layout da aplicação segue um padrão moderno com tema Oceano & Coral.

| Elemento | Comportamento |
|---|---|
| **Header** | Removido (PageLayout sem header). Botão "Voltar" como ícone cinza acima do Paper, canto superior esquerdo. |
| **Cards de menu (MenuInicial)** | Componente `MenuCard` reutilizável com hover (translateY -3px, shadow lg), active (scale 0.98), cores de ícone variáveis por card (azul royal, cinza, teal) e link "Acessar →" |
| **Cards de menu (Athletes/Arbitros/Areas)** | Cards com borda esquerda 5px `#1b325f`, hover troca para `#f26c4f` + translateY(-6px) + sombra. Botão "Acessar" marinho no rodapé, hover `#ffbc11` + scale(1.02). |
| **Tabelas** | Container com borda arredondada 16px, fundo branco, header cinza claro (`#f8fafd`), linhas com hover suave |
| **Modais** | `centered` + `size="lg"` por padrão (via tema) |
| **Loading/Error** | `Center` simples com `Loader` / Stack de erro, sem Container/Paper redundantes |
| **Toolbars** | `Group justify="space-between"` com actions à esquerda e busca à direita |
| **Background** | Gradient fixo `#f8f9fa → #e3f2fd` no body |
| **Sidebar (Dashboard)** | Fundo marinho `#1b325f`, nav links com ícones, active tab com borda esquerda `#3a89c9` |
| **Hero banner (Dashboard)** | Fundo sólido `#1b325f` (sem gradient), badge "Painel Geral", título em branco |
| **Stats (Dashboard / menus)** | Cards com ícone em círculo colorido (`#e9f2f9`), número grande em `#1b325f`, label uppercase |

---

## 12. Regras de Duplicidade

### 12.1. Atletas

Um atleta é considerado **duplicata** quando possui o mesmo **nome** (case-insensitive, trimmed) **e** mesmo **ano de nascimento**. A verificação de duplicidade não considera `categoria` ou `genero` — atletas com mesmo nome e ano de nascimento são considerados duplicatas mesmo que pertençam a categorias diferentes.

| Operação | Local da Verificação | Comportamento |
|---|---|---|
| **Cadastro individual** | Renderer (`AdminAthletes.tsx:handleSave`) | Antes de chamar o IPC, percorre a lista local. Se duplicata (excluindo próprio `id`), exibe notificação vermelha e não salva. |
| **Edição** | Renderer (`AdminAthletes.tsx:handleSave`) | Mesma verificação, ignorando o atleta sendo editado pelo `id`. |
| **Importação em massa** | Main process (`athletes.ts:importAthletesFromFile`) | Durante mesclagem, verifica: (1) `id` duplicado — somente se o atleta de entrada possui `id`; (2) nome (case-insensitive, trimmed) + anoNascimento. Duplicatas são ignoradas e contabilizadas em `skipped`. |

---

## 13. Requisitos Não Funcionais

### 13.1. Requisitos Gerais

- Funcionar sem conexão com a internet.
- Carregamento rápido.
- Capaz de armazenar milhares de atletas.
- Permitir backup manual dos arquivos JSON.
- Interface responsiva para diferentes resoluções.
- TypeScript em todo o projeto.

### 13.2. UI Responsiva

| Dispositivo | Largura | Comportamento |
|---|---|---|
| Desktop / Notebook | ≥ 1024px | Layout centralizado |
| Tablet | 768px – 1023px | Cartões empilhados, fonte ajustada |
| TV / Monitor grande | ≥ 1920px | Escala proporcional |
| Resoluções baixas | < 768px | Rolagem vertical se necessário |

Uso de `clamp()` para tamanhos, unidades relativas (`rem`, `vw`), scroll horizontal em tabelas.

### 13.3. Acessibilidade

- Contraste WCAG AA (taxa mínima 4.5:1).
- Suporte a `prefers-reduced-motion` (desativa animações).
- Navegação por teclado (Tab, Enter, teclas numéricas).
- Atributos `aria-label` em elementos interativos.
- Cartões com `role="button"` e `tabIndex`.

---

## 14. Documentação Relacionada

| Arquivo | Conteúdo |
|---|---|
| `doc/requisitos.md` | Este documento — regras de negócio e especificação geral |
| `doc/IBJJF.md` | Tabelas de peso e regras oficiais IBJJF (fonte de dados das categorias) |
| `doc/equipes-dashboard.md` | Especificação do resumo de equipes no Dashboard |
| `spec/cadastro-atletas.md` | Especificação detalhada do CRUD de atletas |
| `spec/spec-import-atleta.md` | Especificação detalhada da importação em massa de atletas |
| `spec/spec-torneio-atletas.md` | Especificação da migração de atletas para armazenamento por torneio |
| `spec/validacao-credential.md` | Especificação da ativação do software |
| `spec/ANALISE-CATEGORIA-ATLETA.md` | Análise de impacto da obrigatoriedade de categoria/gênero no cadastro/import de atletas |
| `spec.md` | Diagnóstico histórico do formulário de atletas (modo uncontrolled) |
| `spec-correção.md` | Análise da correção do formulário (modo controlled + dependência form removida) |
| `spec/geracao-chaves.md` | Especificação da geração de chaves de luta (máx. 5 atletas, chave editável) |
| `spec/cadastro-arbitro.md` | Especificação detalhada do CRUD de árbitros |
| `spec/emchave-atleta.md` | Especificação da propriedade `emChave` e melhoria da visualização de atletas sem chave |
| `spec/busca-chaves-atletas-arbitros-equipes.md` | Especificação da busca textual em todas as telas e correção do acúmulo de `chaveIds` |
| `spec/placar.md` | Especificação do fluxo Placar (PlacarMenu, PlacarChaves, PlacarBracket, PlacarLuta placeholder) |
| `spec/placar-jiu-jitsu.md` | Especificação do placar funcional de Jiu-Jitsu (pontos 2/3/4, vantagens, punições, cronômetro, finalização/DQ/desempate) |
| `spec/placar-voltar-bracket.md` | Correção do botão Voltar do PlacarLuta — navegação para `PlacarBracket` (inclusão de `areaId` na rota) |
| `spec/correcao-avanca-vencedor-chave-4.md` | Correção da propagação de vencedor em chaves de 4 atletas (fórmula baseada em razão) |
| `spec/correcao-dq-bracket.md` | Correção do DQ: campo `desclassificadoId` e propagação em chaves de 2 e 3 atletas |
| `spec/validacao-pontos-vitoria.md` | Validação de pontos/vantagens ao selecionar vencedor por pontos (modal de aviso) |
| `spec/correcao-chave-6-atletas.md` | Correção da chave de 6 atletas: separarEquipes, getTeamConflicts e advanceWinner6 |
| `spec/tag-vencedor-placar-correcao-cores.md` | Tags de status no PlacarChaves (ENCERRADO/EM ANDAMENTO) e correção de cores grape→blue |
| `doc/import-audit.md` | Auditoria de importação: regras de geração automática de ID e timestamps |

---

## 15. Estrutura de Arquivos (Implementada)

```
bjj-tournament-manager-setup/
├── electron/
│   ├── main.ts              ← Registro dos handlers IPC, criação da janela
│   ├── preload.ts           ← Exposição dos canais IPC (contextBridge)
│   ├── tournament.ts        ← CRUD de torneios no sistema de arquivos
│   ├── athletes.ts          ← CRUD de atletas + importação em massa
│   ├── activation.ts        ← Ativação do software (SHA-256, HMAC)
│   ├── referees.ts          ← Handlers IPC de árbitros (CRUD + import/export)
│   └── brackets.ts          ← Handlers IPC de chaves de luta (máx. 5 atletas, edição)
│
├── src/
│   ├── main.tsx             ← Entry point React
│   ├── App.tsx              ← Rotas (HashRouter), providers, ativação gate
│   ├── pages/
│   │   ├── MenuInicial.tsx      ← Menu principal (Criar / Importar / Listar)
│   │   ├── CriarTorneio.tsx     ← Formulário de criação de torneio
│   │   ├── ImportarTorneio.tsx  ← Tela de importação com upload e validação
│   │   ├── ListarTorneios.tsx   ← Lista com ações Iniciar / Exportar / Excluir
│   │   ├── Dashboard.tsx        ← Dashboard Administrativo do torneio ativo
│   │   ├── AthletesMenu.tsx     ← Menu intermediário de atletas (3 cartões)
│   │   ├── AdminAthletes.tsx    ← Gerenciamento de atletas (tabela CRUD)
│   │   ├── Equipes.tsx          ← Resumo de equipes com contagem de atletas
│   │   ├── ArbitrosMenu.tsx     ← Menu intermediário de árbitros (3 cartões)
│   │   ├── AdminArbitros.tsx    ← Gerenciamento de árbitros (tabela CRUD)
│   │   ├── GerenciarChaves.tsx  ← Geração, edição e visualização de chaves de luta
│   │   ├── PlacarMenu.tsx       ← Seleção de área de luta (entrada do Placar)
│   │   ├── PlacarChaves.tsx     ← Lista de chaves da área selecionada
│   │   ├── PlacarBracket.tsx    ← Bracket da chave + lutas iniciáveis
│   │   └── PlacarLuta.tsx       ← Placar funcional da luta (cronômetro, pontos, vantagens, punições)
│   ├── components/
│   │   ├── AthleteForm.tsx      ← Modal de cadastro/edição de atleta (modo controlled)
│   │   ├── AthleteTable.tsx     ← Tabela de listagem de atletas
│   │   ├── PageLayout.tsx       ← Layout padrão (Container, Paper, título, voltar)
│   │   ├── ActivationScreen.tsx ← Tela de ativação do software
│   │   ├── ErrorBoundary.tsx    ← Captura de erros de renderização
│   │   ├── BracketTree.tsx      ← Árvore visual de brackets (eliminação simples)
│   │   ├── BracketCard.tsx      ← Card de luta individual na árvore
│   │   ├── RegistrarResultadoModal.tsx ← Modal de registro de resultado de luta
│   │   ├── EditarChaveModal.tsx ← Modal de edição manual de posições na chave
│   │   ├── AreaForm.tsx         ← Modal de cadastro/edição de área de luta
│   │   └── ArbitroForm.tsx      ← Modal de cadastro/edição de árbitro
│   ├── types/
│   │   ├── tournament.ts        ← Interfaces Torneio, CreateTorneioInput
│   │   ├── athlete.ts           ← Interface Atleta (+genero, +categoria), tipo Faixa (union)
│   │   ├── category.ts          ← Interface CategoriaIBJJF, FaixaEtaria, CATEGORIAS_IBJJF, classificarCategoria()
│   │   ├── bracket.ts           ← Interfaces Chave, Luta, StatusLuta, RodadaNome
│   │   ├── referee.ts           ← Interface Arbitro
│   │   └── electron.d.ts        ← Tipos globais Window.electronAPI + Window.activation
│   └── styles/
│       ├── theme.ts             ← Tema Mantine UI (cores, fontes, componentes)
│       └── global.css           ← Reset CSS, body, prefers-reduced-motion
│
├── doc/IBJJF.md             ← Tabelas de peso e regras oficiais IBJJF
├── doc/requisitos.md        ← Regras de negócio (este documento)
├── spec/
│   ├── cadastro-atletas.md  ← Spec detalhado do CRUD de atletas
│   ├── spec-import-atleta.md  ← Spec detalhado da importação em massa de atletas
│   ├── validacao-credential.md ← Spec da ativação do software
│   ├── ANALISE-CATEGORIA-ATLETA.md ← Análise da obrigatoriedade de categoria/gênero
│   ├── geracao-chaves.md    ← Spec da geração de chaves de luta (máx. 5 atletas, chave editável)
│   ├── shuffle-chave.md    ← Spec da correção do embaralhamento de chaves
│   ├── emchave-atleta.md   ← Spec da propriedade emChave e visualização de atletas sem chave
│   ├── busca-chaves-atletas-arbitros-equipes.md ← Spec da busca textual nas telas e correção do acúmulo de chaveIds
│   ├── cadastro-arbitro.md  ← Spec detalhado do CRUD de árbitros
│   ├── placar.md           ← Spec do fluxo Placar (seleção de área → bracket → placar)
│   ├── placar-jiu-jitsu.md ← Spec do placar funcional de Jiu-Jitsu (pontos, vantagens, punições, cronômetro)
│   ├── placar-voltar-bracket.md ← Spec da correção do botão Voltar (navegação PlacarLuta → PlacarBracket)
│   ├── max-atletas-por-chave.md ← Spec da correção do acúmulo de chaveIds
│   ├── layout-chave-5-atletas.md ← Spec do layout visual de chaves com 5 atletas
│   ├── correcao-chave-5-atletas.md ← Spec da correção de chaves com 5 atletas (6 lutas)
│   └── correcao-chave-6-atletas.md ← Spec da correção de chaves com 6 atletas (5 lutas, carry-over)
├── spec.md                  ← Diagnóstico histórico (bug uncontrolled → controlled)
└── spec-correção.md         ← Análise da correção (form em deps do useEffect)
```

### 3.16. Menu de Categorias (Implementado)

- **Acesso:** O card "Categorias" no Dashboard navega para `/admin/categorias`.
- **Sidebar:** O item "Categorias" aparece na seção "Gestão e Dados" da sidebar do Dashboard.
- **Funcionalidades:**
  - **Categorias IBJJF do Sistema:** Lista todas as ~151 categorias IBJJF com toggle enable/disable. Categorias desabilitadas não aparecem no Select de atletas. O estado é persistido no JSON do torneio (`categoriasDesabilitadas: string[]`). Cada linha exibe nome, faixa de peso e tempo de luta (calculado pela faixa etária).
  - **Categorias Customizadas:** CRUD completo (criar, editar, excluir). Campos: nome, faixa etária, gênero, peso mínimo/máximo (kg), cor da faixa, tempo de luta (minutos). Persistidas no JSON do torneio (`categoriasCustomizadas: CategoriaCustomizada[]`).
  - **Busca:** Campo de busca filtra categorias por nome em tempo real.
  - **Estatísticas:** Exibe total de categorias IBJJF ativas e total de customizadas.
- **Tela de gerenciamento (`/admin/categorias/lista`):** Tabela CRUD de categorias customizadas com ações de editar e excluir.
- **Integração com Atletas:** O `AthleteForm` carrega categorias desabilitadas e customizadas ao abrir. No modo criação, filtra por gênero + idade + faixa. No modo edição, filtra apenas por gênero. Categorias customizadas são exibidas com faixa de peso e tempo de luta no label.
- **Tipos:** `CategoriaCustomizada` com campos: `id` (prefixo `custom-`), `nome`, `faixaEtaria`, `genero`, `pesoMinimoKg`, `pesoMaximoKg`, `corFaixa`, `tempoLutaMinutos`, `createdAt`, `updatedAt`.
- **Auto-fix retroativo:** Torneios legados sem `categoriasDesabilitadas` ou `categoriasCustomizadas` recebem arrays vazios via `?? []` ao carregar.

### 3.12. Atualização Automática de Listas

- **Refresh ao focar janela:** Todas as páginas de listagem (Dashboard, Árbitros, Áreas, Categorias, Equipes, Placar, Resultados) escutam o evento `focus` do `window` e re-buscam dados do backend. Isso garante que as listas estejam sempre atualizadas quando o usuário retorna à janela após adicionar, editar ou excluir itens em outra página.
- **Sem necessidade de navegação extra:** O usuário não precisa sair e entrar novamente na página para ver mudanças refletidas.

### 3.13. Geração de PDF

- **Lutas Casadas:** A tela de Resultados (aba "Lutas Casadas") e o menu de Lutas Casadas (`AdminLutasCasadas`) possuem botão "Gerar PDF". O PDF lista todas as lutas casadas do torneio com: nome dos atletas, status, vencedor, placar e **nome do árbitro** (resolvido a partir do ID). Cards coloridos com accent azul.
- **Chaves de Luta:** A tela de Resultados e a tela de Gerenciar Chaves possuem botão "Gerar PDF Chaves". O PDF mostra cada chave em formato de bracket desenhado graficamente com PDFKit: retângulos arredondados para cards de atletas, linhas de conexão entre rodadas, badge de placar, e destaque dourado para vencedores. Rodadas são exibidas da esquerda para a direita.
- **Resultados:** A tela de Resultados possui botão "Gerar PDF Resultados". O PDF consolidado possui 4 seções em páginas separadas: Medalhistas, Ranking de Equipes, Árbitros e Atletas. Todas as seções usam tabelas coloridas com cabeçalho azul marinho.
- **Categorias customizadas:** Todas as funções de PDF resolvem nomes de categorias customizadas (não exibem UUIDs).
- **Formato:** PDFs gerados via PDFKit (substituiu pdfmake), salvos automaticamente via download Blob no renderer.

### 3.14. Edição e Criação de Lutas Casadas no Menu

- **Criação:** O menu de lutas casadas (`AdminLutasCasadas`) possui botão "Nova Luta Casada" que abre modal com seletor de área e formulário de criação (reutiliza `ModalCriarLutaCasada`).
- **Edição:** Cada linha da tabela possui botão "Editar" (ícone de lápis) que navega para o placar da luta casada correspondente (`/admin/placar/luta-casada/:areaId/:lutaCasadaId`).

### 3.15. Geração de Chaves - Separação por Categoria

- **Agrupamento por categoria:** Na geração em massa (`gerarTodasChavesHandler`), os atletas são agrupados apenas por categoria (idade + peso + gênero), sem separação por cor de faixa. Todos os atletas da mesma categoria compartilham a mesma chave.
- **Cor da faixa:** A cor da faixa é um atributo do atleta, mas não é utilizada como critério de separação de chaves na geração em massa.

cores que gosto:

cores
.color1 { #ccb24c };.color2 { #f7d683 };.color3 { #fffdc0 };.color4 { #fffffd };.color5 { #457d97 };


.color1 { #1b325f };

.color2 { #9cc4e4 };

.color3 { #e9f2f9 };

.color4 { #3a89c9 };

.color5 { #f26c4f }; 

.color1 { #fc354c };
.color2 { #29221f };
.color3 { #13747d };
.color4 { #0abfbc };
.color5 { #fcf7c5 };

.color1 { #1c31a5 };
.color2 { #101f78 };
.color3 { #020f59 };
.color4 { #010937 };
.color5 { #000524 };

.color1 { #092b5a };
.color2 { #09738a };
.color3 { #78a890 };
.color4 { #9ed1b7 };
.color5 { #e7d9b4 };