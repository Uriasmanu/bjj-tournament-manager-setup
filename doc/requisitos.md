# BJJ Tournament Manager

## 1. Visão Geral

O **BJJ Tournament Manager** é um software desktop desenvolvido para gerenciamento completo de campeonatos de Jiu-Jitsu.

O sistema é responsável por controlar todas as etapas do evento, desde o cadastro dos participantes até a definição dos campeões de cada categoria, incluindo gerenciamento de chaves, acompanhamento de lutas em tempo real, placares, árbitros, áreas de luta e resultados.

O objetivo é fornecer uma solução centralizada para organizadores, árbitros e equipes, reduzindo erros operacionais e agilizando a condução dos campeonatos.

---

## 2. Status da Implementação

### 2.1. Implementado (MVP)

| Módulo | Status | Observação |
|---|---|---|
| Menu Inicial | ✅ Completo | Tela com 3 cartões (Criar, Importar, Listar) + teclas 1/2/3 |
| Criar Torneio | ✅ Completo | Formulário com nome (opcional), data (futura), validação, IPC |
| Importar Torneio | ✅ Completo | Upload JSON, validação de estrutura, modal de sobrescrita |
| Listar Torneios | ✅ Completo | Tabela com Iniciar/Exportar/Excluir; registro de startedAt no Play |
| Gerenciamento de Torneios (IPC) | ✅ Completo | CRUD completo no main process (`electron/tournament.ts`) |
| Tema Mantine UI | ✅ Completo | Tema azul royal (#1565C0), fonte Inter, componentes responsivos com `clamp()` |
| Cadastro de Atletas | ✅ Completo | Menu com 3 cartões (Cadastrar, Listar, Importar); CRUD com modal controlado, validação em tempo real, tabela, duplicata, normalização de texto, IPC. Atletas armazenados por torneio (dentro do JSON do torneio). Campos `genero` e `categoria` IBJJF obrigatórios no formulário e importação. |
| Importação em Massa de Atletas | ✅ Completo | Diálogo nativo, validação fail-fast, deduplicação por ID e nome+ano, mesclagem com lista existente. Validação de `genero` e `categoria` como obrigatórios, com verificação contra lista de categorias IBJJF. |
| Dashboard Administrativo | ✅ Completo | Tela com cards em grid (1-4 colunas responsivas), funcionalidades implementadas × planejadas |
| Resumo de Equipes | ✅ Completo | Tela que consulta a lista de atletas e exibe nome das equipes com contagem de atletas por equipe |
| Cadastro de Árbitros | ✅ Completo | Menu com 3 cartões (Cadastrar, Listar, Importar); CRUD com modal controlado, validação, duplicata por nome. Faixas permitidas: roxa, marrom, preta. Importação/exportação JSON. Campo de busca por nome, equipe e faixa. |
| Busca em Atletas | ✅ Completo | Campo de busca na tela de listagem que filtra por nome, equipe e categoria |
| Busca em Árbitros | ✅ Completo | Campo de busca na tela de listagem que filtra por nome, equipe e faixa |
| Busca em Equipes | ✅ Completo | Campo de busca na tela de equipes que filtra por nome da equipe |
| Busca em Chaves | ✅ Completo | Campo de busca na tela de chaves que filtra por título (faixa, peso, atletas) |
| Busca em Torneios | ✅ Completo | Campo de busca na tela de listagem de torneios que filtra por nome e data |
| Correção chaveIds | ✅ Completo | Ao regenerar chaves, `chaveIds` dos árbitros é limpo antes da reatribuição automática, eliminando acúmulo de IDs antigos |
| Tela de Ativação | ✅ Completo | Componente que bloqueia o acesso até ativação; senha SHA-256, token HMAC por hardware |
| Error Boundary | ✅ Completo | Componente classe que captura erros de renderização e exibe fallback com "Tentar novamente" |
| PageLayout | ✅ Completo | Layout padrão com Container, Paper, título e botão de voltar |
| Áreas de Luta | ✅ Completo | CRUD com nome + múltiplos árbitros por área. Validação de unicidade de árbitro entre áreas. Migração retroativa de dados legados. Menu com Cadastrar/Listar, tabela com busca, exclusão individual/em lote. |
| Placar (Scoreboard) | ✅ Completo | Fluxo `PlacarMenu → PlacarChaves → PlacarBracket → PlacarLuta` (seleção de área, lista de chaves da área, bracket com lutas iniciáveis, placar funcional com cronômetro, pontos 2/3/4, vantagens, punições, finalização/DQ/desempate, persistência no JSON do torneio). Cores azul anil (Atleta A) e branco (Atleta B). Vencedor propagado para a próxima rodada. Validação de pontos/vantagens ao selecionar vencedor por pontos com modal de aviso. `desclassificadoId` identifica atleta desclassificado. Correção de propagação em chaves de 2, 3 e 4 atletas. |

### 2.2. Não Implementado (Planejado)

| Módulo | Status |
|---|---|
| Geração de Chaves | ✅ Completo | Máximo de 16 atletas por chave (subgrupos configuráveis de 2 a 16), chave editável manualmente, shuffle com separação de equipes (Fisher-Yates), import/export JSON. Estruturas: 2, 3, 4, 5, 6-15 (geral) e 16 atletas. Atletas sem oponente exibidos em cartões com opções de remanejamento (subir/descer peso) e indicador de "luta casada". |
| Áreas de Luta | ✅ Completo | CRUD completo, múltiplos árbitros por área, unicidade de árbitro |
| Resultados | ❌ Pendente | Tela de consolidação de resultados por categoria (pódios, medalhistas, ranking). |
| Ranking / Medalhistas | ❌ Pendente |

---

## 3. Regras de Negócio

### 3.1. Torneio

- **Entidade raiz do sistema:** Para acessar qualquer funcionalidade administrativa (atletas, chaves, categorias), é necessário primeiro **iniciar um torneio** (defini-lo como ativo).
- **Múltiplos torneios:** O sistema suporta múltiplos torneios simultaneamente, cada um armazenado em arquivo JSON individual no diretório `{userData}/data/torneios/`.
- **Torneio ativo:** Apenas um torneio pode estar ativo por vez. O ID do torneio ativo é armazenado em `{userData}/data/torneio-ativo.json`.
- **Título do torneio:** Se o campo `nome` for preenchido, o título exibido é o nome informado. Caso contrário, o título é "Torneio {data}" no formato `dd/MM/yyyy`.
- **Data futura:** A data do torneio deve ser posterior ao dia atual (dia atual e passados são rejeitados).
- **ID único:** Cada torneio recebe um UUID v4 gerado no momento da criação (`crypto.randomUUID()` no main process).
- **Persistência imediata:** O arquivo JSON do torneio é criado no momento da confirmação do formulário ou da importação.

### 3.2. Criação de Torneio

- Campo `nome` é opcional (string vazia se não informado).
- Campo `data` é obrigatório e deve ser uma data futura (rejeita dia atual e passados).
- Data é armazenada em ISO (`YYYY-MM-DD`) e exibida no formato brasileiro (`DD/MM/YYYY`).
- Utiliza `dayjs` para comparação de datas e formatação.
- Após criar com sucesso, o usuário é redirecionado para a listagem de torneios (`/admin/listar-torneios`).
- O formulário (`CriarTorneio.tsx`) usa `@mantine/form` com `mode: 'uncontrolled'`.

### 3.3. Importação de Torneio

- Apenas arquivos com extensão `.json` são aceitos (filtro nativo do diálogo).
- O arquivo deve conter os campos obrigatórios: `data` (validação no import). `id` e `nome` são opcionais.
- **Normalização automática ao importar:** O backend sempre normaliza os dados antes de salvar:
  - `id`: preservado do arquivo se presente; gerado (`crypto.randomUUID()`) se ausente.
  - `createdAt`: sempre substituído pelo timestamp atual (momento da importação).
  - `updatedAt`: sempre substituído pelo timestamp atual (momento da importação).
- Se o `id` do torneio importado já existir no diretório, o sistema pergunta se deseja sobrescrever via modal de confirmação.
- Na sobrescrita (`import-tournament-overwrite`), o `id` E a `data` do arquivo são obrigatórios. O `id` é usado como nome do arquivo (não é gerado novo ID, ao contrário do `import-tournament`). `createdAt` e `updatedAt` são normalizados da mesma forma.
- Se o arquivo de destino já existir e o usuário escolher não sobrescrever, o `import-tournament` retorna `{ success: false, exists: true }` em vez de lançar erro.
- Após importar com sucesso, o usuário é redirecionado para a listagem de torneios.
- A importação é feita via upload de arquivo (não diálogo nativo), com leitura do conteúdo via `FileReader` e envio ao IPC.

### 3.4. Exportação de Torneio

- Abre diálogo nativo "Salvar como" para o usuário escolher o destino.
- Gera uma cópia exata do arquivo JSON do torneio via `fs.copyFileSync`.
- Nome padrão sugerido: `{nome}_Torneio_{data}.json` com caracteres especiais substituídos por `_`.

### 3.5. Inicialização de Torneio (Iniciar)

- Define o torneio como ativo escrevendo seu `id` em `{userData}/data/torneio-ativo.json`.
- Após iniciar, redireciona para o Dashboard Administrativo (`/admin/dashboard`).
- **Busca na listagem:** campo de busca textual que filtra os torneios por nome ou data em tempo real. Exibe mensagem "Nenhum torneio encontrado para a busca {termo}" quando não há resultados.
- Apenas um torneio pode estar ativo por vez (iniciar um novo substitui o anterior no arquivo).
- Registra o timestamp `startedAt` no JSON do torneio no momento do Play (`new Date().toISOString()`).
- O badge "Iniciado {data}" é exibido no Dashboard para torneios com `startedAt` preenchido.

### 3.6. Dashboard Administrativo

- O Dashboard é a tela central de administração do torneio ativo, acessível via `/admin/dashboard`.
- Ao carregar, obtém o torneio ativo via IPC `get-active-tournament`.
- Exibe o nome e data do torneio ativo, além de um badge verde "Iniciado {data}" se `startedAt` existir.
- Contém cards em layout **Grid** (1 coluna <700px, 2 colunas <1400px, 3 colunas <1800px, 4 colunas ≥1800px).
- Cards de funcionalidades implementadas: clicáveis com hover elevado (translateY(-2px)), opacidade 1.
- Cards de funcionalidades não implementadas: opacidade 0.5, cursor `not-allowed`, badge "Em breve".
- Atalho: card "Atletas" navega para `/admin/atletas` (menu intermediário).
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
  - Botões "Importar" e "Cadastrar" no topo.
  - Campo de busca textual que filtra a tabela por nome, equipe ou categoria em tempo real.
  - Tabela com colunas: Nome, Equipe, Gênero, Faixa, Categoria, Idade, Ações (editar/excluir). Ordenada alfabeticamente por nome do atleta.
  - Badges de resumo de faixas e categorias no topo da tabela (top 10 categorias por quantidade).
  - Empty state com "Nenhum atleta cadastrado" + botão "Cadastrar primeiro atleta".
  - Empty state de busca: "Nenhum atleta encontrado para a busca {termo}" quando filtro não retorna resultados.
  - Ações por linha: lápis (editar) e lixeira (excluir).
  - Botão "Voltar" retorna para `/admin/atletas` (menu), não para o Dashboard.
- **Modal de formulário:** `AthleteForm.tsx` usa `@mantine/form` com **modo controlado** (`mode: 'controlled'`). Cada campo recebe os props diretamente de `form.getInputProps(path)`. O `useEffect` de inicialização do formulário depende apenas de `opened` e `athlete` (não de `form`) para evitar loop de re-renderização.
- Nome e equipe são obrigatórios (mínimo 2 caracteres) e armazenados em minúsculo (`.trim().toLowerCase()` no submit).
- Gênero é obrigatório: `Select` com opções `Masculino` / `Feminino`.
- Categoria IBJJF é obrigatória: `Select` populado com `CATEGORIAS_IBJJF`, filtrado dinamicamente por faixa etária (calculada da idade), gênero e faixa do atleta. O label de cada opção exibe o limite de peso, ex.: `"Adulto Masculino Leve (até 76,0 kg)"`.
- Peso deve estar entre 1 e 300 kg.
- Faixa segue enum: infantil (branca, cinza, amarela, laranja, verde) e adulto (branca-adulto, azul, roxa, marrom, preta). O valor `branca-adulto` é mapeado para `branca` na persistência.
- Ano de nascimento entre 1920 e ano atual.
- Idade é calculada dinamicamente (`ano atual - anoNascimento`), não persistida.
- **Duplicata:** Um atleta é considerado duplicata quando possui o mesmo **nome** (case-insensitive, trimmed) **e** mesmo **ano de nascimento**. A verificação ocorre:
  - No renderer (`AdminAthletes.tsx:handleSave`) antes do IPC, tanto para cadastro quanto para edição (ignorando o próprio `id`).
  - No main process (`athletes.ts:importAthletesFromFile`) durante importação em massa.
  - No main process (`tournament.ts:import-tournament` e `import-tournament-overwrite`) durante importação de torneio com atletas.
- **Exclusão em lote:** Na tela de listagem, cada linha possui um checkbox. O cabeçalho possui um checkbox "Selecionar todos" com estado indeterminado para seleção parcial. Com um ou mais atletas selecionados, um botão "Excluir Selecionados (N)" aparece no topo. A exclusão em lote é feita via IPC `delete-athletes`, que remove todos os atletas em uma única operação de leitura/escrita do arquivo JSON.
- **Armazenamento por torneio:** Atletas são armazenados dentro do JSON do torneio (campo `atletas: Atleta[]`), não mais em arquivo global. Cada torneio possui sua própria lista exclusiva.
- **Torneio ativo obrigatório:** Para cadastrar, editar, excluir ou importar atletas, é necessário que haja um torneio ativo. Caso contrário, o handler IPC lança erro `"Nenhum torneio ativo"` exibido como notificação vermelha.
- **Sincronia imediata:** Qualquer operação CRUD sobre atletas lê e escreve diretamente no arquivo JSON do torneio ativo (`torneios/{id}.json`), atualizando o timestamp `updatedAt` do torneio.
- **Auto-fix silencioso ao carregar (`loadAthletes`):** Se um atleta carregado do JSON estiver sem `id`, `createdAt` ou `updatedAt`, esses campos são gerados automaticamente (`crypto.randomUUID()` para `id`, `new Date().toISOString()` para timestamps). Se alguma correção for aplicada, o arquivo do torneio é reescrito silenciosamente.
- **`saveAthlete` — auto-geração:** Se o atleta enviado não possuir `id`, um novo UUID é gerado (`crypto.randomUUID()`). Se não possuir `createdAt`, o timestamp atual é atribuído. `updatedAt` é sempre substituído pelo timestamp atual.
- **`updateAthlete` — substituição completa:** A atualização substitui o objeto do atleta por completo no índice correspondente (não é uma mesclagem parcial).
- **Exclusão sem verificação de chaves:** A exclusão de atletas (`deleteAthlete`, `deleteAthletes`) não verifica se o atleta está alocado em alguma chave — o atleta pode ser removido mesmo estando em uma chave.
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
- **Tamanhos suportados:** O gerador aceita chaves com 2 a 16 atletas. Estruturas: 2 (1 luta), 3 (3 lutas, repescagem), 4 (3 lutas), 5 (6 lutas), 6-15 (geral, eliminação simples com byes automáticos), 16 (15 lutas). Para tamanhos 6-15, o sistema usa `gerarLutasGeral()` que gera uma bracket de eliminação simples com byes automáticos. Funções dedicadas de propagação existem para 3 (`advanceWinnerInChave` com lógica de repescagem), 5 (`advanceWinner5`), 6 (`advanceWinner6`) e 16 (`advanceWinner16`) atletas.
- **Mínimo de 2 atletas:** Categorias com 1 atleta não geram chave — o atleta é listado como "sem chave". Com 0 atletas, nenhuma chave é gerada.
- **Formato eliminatório simples:** Sem repescagem, sem disputa de 3º lugar (exceto chave de 3 atletas que usa sistema de repescagem restrito — ver seção 3.11.1).
- **Estrutura por quantidade de atletas:**
  - 2 atletas: 1 luta, 1 rodada (Final direta)
  - 3 atletas: 3 lutas, 3 rodadas — rodada 1 (semifinal: seed 1 vs seed 2), rodada 2 (tbd vs seed 3 — repescagem), rodada 3 (final)
  - 4 atletas: 3 lutas, 2 rodadas (2 Semifinais + Final)
  - 5 atletas: 6 lutas, 3 rodadas — R1 (3 lutas: seed1 vs seed2, seed3 vs seed4, seed5 vs BYE auto-resolvido), R2 (2 lutas: vencedor(L2) vs seed5, vencedor(L1) vs BYE auto-resolvido), R3 (Final: vencedor(L4) vs vencedor(L5))
  - 6 atletas: 5 lutas, 3 rodadas — R1 (3 lutas: seed0 vs seed1, seed2 vs seed3, seed4 vs seed5), R2 (1 luta: vencedor(L1) vs vencedor(L2) + carry-over do vencedor(L3) direto para a final), R3 (Final: vencedor(L4) vs vencedor(L3))
  - 7-15 atletas: eliminação simples com byes automáticos — número de rodadas = ceil(log2(N))
  - 16 atletas: 15 lutas, 4 rodadas (8 lutas R1, 4 lutas R2, 2 lutas R3, 1 luta R4 final)
- **Chave editável:** O administrador pode reordenar manualmente as posições dos atletas na chave antes do início das lutas (status `gerada`).
- **Listagem:** Chaves exibidas como cards em grid. Ordenadas alfabeticamente pelo título da chave.
- **Bloqueio de edição:** Após a primeira luta ser iniciada, a edição é bloqueada.
- **Seed sorting (geração inicial — `aplicarSeedSorting`):** Ao gerar a chave, os atletas são primeiro embaralhados aleatoriamente (Fisher-Yates shuffle) e depois ordenados por: peso (decrescente) → idade (decrescente, `currentYear - anoNascimento`) → nome (ascendente, `localeCompare`). O embaralhamento prévio garante que a posição do BYE (quando o número de atletas é ímpar) seja aleatória a cada geração. A divisão em lados é dinâmica: metade superior (sideA) e metade inferior (sideB) da seed, com separação de equipes entre lados.
  - 16 atletas (`aplicarSeedSorting16`): sideA = primeiros 8, sideB = últimos 8; dentro de cada lado, atletas da mesma equipe são trocados com o lado oposto.
- **Embaralhamento (shuffle):** O botão "Embaralhar" randomiza a ordem dos atletas na chave usando Fisher-Yates shuffle e mantém a separação de equipes em lados opostos (via `separarEquipes`). Para 16 atletas, reaplica seed sorting; para os demais, aplica `separarEquipes`. A separação de equipes funciona para chaves de 4 (sideA=[0,3], sideB=[1,2]), 5 (sideA=[0,1,2], sideB=[3,4]) e 6 (sideA=[0,1,2], sideB=[3,4,5]) atletas. Pode ser acionado a qualquer momento enquanto a chave estiver no status `gerada`.
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
- **Função `advanceWinner6` (chave de 6 atletas):** Propagação manual baseada na ordem da luta (5 lutas, 3 rodadas):
  - **Luta 1 vence:** preenche Luta 4 (`atletaAId` = vencedor).
  - **Luta 2 vence:** preenche Luta 4 (`atletaBId` = vencedor).
  - **Luta 3 vence:** preenche Luta 5 (`atletaBId` = vencedor) — carry-over direto para a final.
  - **Luta 4 vence:** preenche Luta 5 (`atletaAId` = vencedor) — semifinal → final.
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
- **Normalização retroativa (`normalizeLuta`):** Ao carregar chaves, toda luta recebe defaults: `ordem=0`, `rodada=1`, `atletaAId=''`, `atletaBId=''`, `status='pending'`, `vencedorId=null`, `finalizacao=undefined`, `desclassificacao=undefined`, `desclassificadoId=undefined`, `placarA=undefined`, `placarB=undefined`, `desempateArbitro=undefined`.
- **Normalização retroativa (`normalizeChave`):** Ao carregar, defaults: `categoriaId=''`, `arbitroId=null`, `totalRodadas` computado do maior `luta.rodada`.

### 3.12. Importação de Chaves

- **Formato:** Array JSON de objetos `Chave`. Cada chave deve conter `categoriaId` (string) e `lutas` (array) — `id` é opcional.
- **Validação de estrutura:** O arquivo deve ser um array. Objetos, strings ou números são rejeitados com `"Arquivo inválido: o conteúdo deve ser um array de chaves."`. Cada item do array deve possuir `categoriaId` e `lutas` (array); caso contrário, retorna `"Estrutura de chave inválida no arquivo."`.
- **Normalização automática:**
  - `id`: preservado do arquivo se presente; gerado (`crypto.randomUUID()`) se ausente.
  - Demais campos (`posicoesAtletas`, `arbitroId`, `totalAtletas`, `totalLutas`, `status`) são preservados do arquivo.
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

O array `CATEGORIAS_IBJJF` é gerado programaticamente por `gerarCategorias()` que itera 15 faixas etárias × 2 gêneros × 9 pesos, pulando combinações onde `pesoLimite === undefined` (total: 151 categorias). O lookup `categoriaLabels` é construído a partir do mesmo array, mapeando `categoriaId → label`.

#### 3.15.5. ID da Categoria

Cada categoria possui um identificador único no formato `{faixaEtaria}-{genero}-{peso}`, ex.:
- `adulto-masculino-leve`
- `master1-feminino-galo`
- `juvenil-masculino-pena`

O campo `categoria` no JSON do atleta armazena este ID.

#### 3.15.6. Dados de Referência

Todas as categorias são geradas programaticamente no array `CATEGORIAS_IBJJF` em `src/types/category.ts`, totalizando 151 categorias (9 faixas etárias × 2 gêneros × 9 pesos, excluindo pesadíssimo feminino). O arquivo `doc/IBJJF.md` contém as tabelas de referência originais.

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
- **Migração retroativa:** O campo `normalizeArea()` no backend converte automaticamente dados legados do formato `arbitroId` (string) para `arbitroIds` (array) ao carregar as áreas do JSON.
- **Exclusão em lote:** Na tela de listagem, cada linha possui um checkbox. O cabeçalho possui um checkbox "Selecionar todas" com estado indeterminado. Com uma ou mais áreas selecionadas, um botão "Excluir Selecionados (N)" aparece. A exclusão em lote é feita via IPC `delete-areas`.

### 3.19. Placar / Scoreboard (Implementado)

- **Fluxo de navegação:** `Dashboard → Placar → PlacarMenu` (seleção de área) → `PlacarChaves` (lista de chaves da área) → `PlacarBracket` (bracket + lutas iniciáveis) → `PlacarLuta` (placar funcional).
- **Tela de seleção de área (`/admin/placar`):** `PlacarMenu` exibe `Select` com as áreas de luta cadastradas. Botão "Acessar" navega para `/admin/placar/chaves/:areaId`.
- **Tela de chaves da área (`/admin/placar/chaves/:areaId`):** `PlacarChaves` lista as chaves alocadas na área como cards clicáveis. Exibe faixa, peso, quantidade de atletas e árbitro responsável. Suporta busca textual por título da chave. Cada card exibe badge de status no canto superior direito:
  - **"ENCERRADO"** (amarelo gold): quando a luta da última rodada da chave possui vencedor definido (chave finalizada com campeão).
  - **"EM ANDAMENTO"** (ciano): quando a chave possui pelo menos uma luta finalizada pelo operador (`status: 'completed'`) mas a última rodada ainda não possui vencedor. Lutas com `status: 'wo'` (BYEs auto-resolvidos na geração) não são consideradas.
  - Sem badge: quando nenhuma luta da chave foi iniciada.
  - Badge de contagem de lutas usa cor azul (padrão visual `#1565C0`).
- **Tela do bracket (`/admin/placar/chave/:areaId/:chaveId`):** `PlacarBracket` renderiza a árvore do bracket (`BracketTree`) e abaixo uma tabela "Lutas para Iniciar" com botão "Iniciar" para cada luta válida.
- **Bloqueio de lutas inválidas:** Lutas com pelo menos um lado `tbd` ou `bye` não exibem botão "Iniciar". Lutas com status `completed` ou `wo` também não.
- **Tela do placar (`/admin/placar/luta/:areaId/:chaveId/:lutaId`):** `PlacarLuta` exibe:
  - Atleta A no lado esquerdo com fundo **azul anil** (`#1e3a8a`) e texto branco.
  - Atleta B no lado direito com fundo **branco** (`#ffffff`) e texto escuro.
  - Cronômetro regressivo central (mm:ss) com botões **Iniciar/Pausar** e **Zerar**; valor inicial editável (1–30 min, padrão 5 min); sem áudio.
  - Contadores de pontos 2/3/4 (com + e −) por atleta; total acumulado = 2×qtd2 + 3×qtd3 + 4×qtd4.
  - Contadores de vantagens e punições (0–4) por atleta.
  - Alerta visual de "Desclassificação" ao atingir 4 punições.
  - Botão "Finalizar Luta" → modal com tipo (Pontos, Finalização, DQ, Desempate) e vencedor. Todas as opções de resultado estão sempre habilitadas (sem restrição por estado da luta). O modal não exibe detalhes de implementação (flags do JSON). Ao clicar em "Confirmar", um segundo modal centralizado de confirmação aparece (com texto dinâmico por tipo e botão "Confirmar desclassificação" para DQ). Somente após essa segunda confirmação o resultado é persistido e o vencedor é propagado para a próxima rodada.
  - Botão "Voltar sem finalizar" → retorna para o `PlacarBracket` da chave (rota `/admin/placar/chave/:areaId/:chaveId`).
- **Persistência:** Após a segunda confirmação, a `Luta` recebe `vencedorId`, `status` (`completed` ou `wo` — `wo` para DQ), `placarA`, `placarB`, `finalizacao`, `desclassificacao`, `desclassificadoId`, `desempateArbitro`. O vencedor é propagado para a próxima rodada (slot `tbd`) pela função `advanceWinnerInChave` (ver seção 3.11.1). O sistema não implementa regra automática de dupla desclassificação — o operador sempre declara um vencedor.
- **`desclassificadoId`:** Quando o resultado é do tipo DQ, o campo `desclassificadoId` é preenchido com o ID do atleta desclassificado (o perdedor, que não é o `vencedorId`). Quando o resultado não é DQ, `desclassificadoId` fica `undefined`.
- **Validação de pontos:** Quando o tipo de resultado é "Pontos", antes da segunda confirmação o sistema valida se o atleta selecionado como vencedor realmente possui mais pontos totais no placar. Em caso de empate nos pontos, o critério de desempate é `vantagens`. Se a validação falhar, um modal de aviso vermelho é exibido com a mensagem "Tem certeza que este é o campeão?" e opções "Voltar" (retorna ao modal anterior) e "Confirmar mesmo assim" (prossegue com o registro). Para tipos de resultado diferentes de "Pontos" (finalização, DQ, desempate), a validação não é acionada.
- **Normalização retroativa:** Chaves legadas sem `placarA`/`placarB` carregam sem erro; `normalizeLuta` adiciona defaults.
- **Estado bloqueado:** Lutas com `tbd`/`bye` ou `completed`/`wo` exibem placar congelado e desabilitam controles e "Finalizar Luta".
- **Especificação detalhada:** Ver `spec/placar.md` (fluxo), `spec/placar-jiu-jitsu.md` (placar funcional), `spec/placar-voltar-bracket.md` (correção do botão Voltar) e `spec/finalizar-luta-desclassificacao.md` (confirmação de resultado e habilitação de opções).

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
| `import-tournament` | Renderer → Main | Importa JSON verificando duplicidade de ID |
| `import-tournament-overwrite` | Renderer → Main | Sobrescreve torneio existente (mesmo ID) |
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
| `gerar-chave` | Renderer → Main → Renderer | Gera chave para uma categoria (mín. 2, máx. 5 atletas) + marca `emChave` |
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

A identidade visual utiliza cores que transmitam organização, confiança e profissionalismo.

#### 9.1.1 Paleta de Cores

| Elemento | Cor | Uso |
|---|---|---|
| **Fundo principal** | `#f8f9fa` (Gray 0) | Fundo da interface |
| **Título principal** | `#212529` (Gray 9) | Títulos e logotipo |
| **Botões / Destaques** | Azul Royal (`#1565C0`) | Botões primários, indicadores, links |
| **Hover/Focus** | Azul escuro (`#0d47a1`) | Feedback visual em interações |
| **Texto secundário** | `#6c757d` (Gray 6) | Descrições e textos auxiliares |
| **Divisores/Bordas** | `#e9ecef` (Gray 2) | Separar elementos |
| **Confirmação** | Verde (`#2E7D32`) | Resultados positivos, status concluídos |
| **Alerta** | Vermelho | Erros, exclusões |

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
+--------------------------------------------------+
|   ┌──────────────────────────────────────────┐    |
|   │           BJJ TOURNAMENT MANAGER          │    |
|   │         Gerencie seu campeonato           │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │   [IconPlus]  Criar Torneio              │    |
|   │   Cadastre um novo torneio               │    |
|   └──────────────────────────────────────────┘    |
|   ┌──────────────────────────────────────────┐    |
|   │   [IconFileUpload]  Importar Torneio     │    |
|   │   Importe torneio de arquivo JSON        │    |
|   └──────────────────────────────────────────┘    |
|   ┌──────────────────────────────────────────┐    |
|   │   [IconList]  Listar Torneios            │    |
|   │   Veja todos os torneios cadastrados     │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   Pressione 1, 2 ou 3 para selecionar             |
+--------------------------------------------------+
```

### 10.4 Comportamento

- Ao iniciar o Electron, a rota `/` é carregada imediatamente.
- O menu é exibido independentemente de haver torneios cadastrados.
- Seleção: clique/touch, teclado numérico (1/2/3) ou Tab + Enter.
- Feedback visual: hover (translateY(-2px), sombra), active (scale 0.98), foco (outline).
- Teclas 1/2/3 registradas via `window.addEventListener('keydown')` no `useEffect`.

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
| Número de atletas deve ser 2, 3, 4, 5 ou 16 | `"Número inválido de atletas"` |
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
