# spec.md — Template de Feature

NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `spec/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto

---

## Problemas Encontrados
<!-- Ao iniciar qualquer ciclo, a IA deve: ler todos os itens [aberto], corrigir, mover para Histórico de Correções e atualizar os RF/CA/Passos afetados. -->

<!--
### [aberto] Título curto do problema
**Comportamento atual:** o que está acontecendo de errado.
**Comportamento esperado:** o que deveria acontecer.
**Escopo:** onde no código isso precisa ser resolvido (geração, exibição, ambos...).
-->
---


## Histórico de Correções
<!-- ZONA DA IA: a IA preenche após cada ciclo. -->

### 2026-06-04 — Aplicação do tema visual (cores dos requisitos)
**Tipo:** ajuste visual
**O que mudou:** Cores hardcoded (`#1565C0`, `#6c757d`, `#f8f9fa`) em MenuInicial, CriarTorneio e ImportarTorneio foram substituídas por referências ao tema Mantine (`c="blue"`, `c="dimmed"`, `var(--mantine-color-gray-0)`).
**Itens atualizados:** RF-01 a RF-05, CA-01 a CA-04
**Arquivo de detalhe:** `spec/aparencia-moderna.md`

### 2026-06-04 — Fundo com gradiente criativo (não branco puro)
**Tipo:** ajuste visual
**O que mudou:** body background de `#f5f7fa` (sólido) → `linear-gradient(135deg, #f8f9fa, #e3f2fd)` (gradiente suave usando Gray 0 + Blue 0).
**Arquivo de detalhe:** `spec/aparencia-moderna.md`

### 2026-06-04 — Modelo de Dashboard (sidebar, hero, header stats)
**Tipo:** ajuste visual
**O que mudou:** Criada spec `spec/dashboard-modelo.md` descrevendo o novo layout do Dashboard com sidebar de navegação, hero banner gradient, header stats (Atletas/Equipes) e cards enriquecidos com badges e link "Acessar →". Labels "Atletas Confirmados"/"Equipes Ativas" renomeados para "Atletas"/"Equipes".
**Arquivo de detalhe:** `spec/dashboard-modelo.md`

### 2026-06-04 — Refactor completo do layout (todas as páginas)
**Tipo:** ajuste visual
**O que mudou:** PageLayout com header gradient azul fixo; novo componente MenuCard reutilizável; theme.ts com defaultProps globais; todas as 19 páginas simplificadas (hover effects removidos para MenuCard, loading/error states simplificados, imports não usados removidos); cores hex restantes substituídas por tokens do tema.
**Arquivo de detalhe:** `spec/refactor-layout.md`

<!--
### AAAA-MM-DD — Título curto
**Tipo:** bug | ajuste visual | lógica incompleta
**O que mudou:** comportamento anterior → comportamento atual.
**Itens atualizados:** RF-XX, CA-XX, Passo X
**Arquivo de detalhe:** `spec/nome-da-correcao.md`
-->

---

## Feature
<!--  A IA vai usar isso como ponto de partida para preencher todas as seções abaixo. -->
Quero que a aplicação tenha uma aparencia moderna e use as cores que estão determinadas em requisitos
**observação:** Implementado em 2026-06-04. Cores hardcoded substituídas por tokens do tema Mantine em MenuInicial, CriarTorneio e ImportarTorneio. Ver `spec/aparencia-moderna.md`.
**observação:** Refatoração completa do layout em 2026-06-04: PageLayout com header gradient, MenuCard, theme.ts com defaultProps, todas as páginas simplificadas. Ver `spec/refactor-layout.md`.
**observação:** Novo modelo de Dashboard criado em 2026-06-04: sidebar de navegação, hero banner gradient, header com stats de Atletas e Equipes, cards enriquecidos com badges e link "Acessar →". Ver `spec/dashboard-modelo.md`.

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

codigo de exemplo

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Administrativo do Torneio — Tema Claro</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            100: '#e9f2f9', // color3 (Fundo Suave)
                            200: '#9cc4e4', // color2 (Bordas / Detalhes)
                            500: '#3a89c9', // color4 (Azul Ativo / Botões)
                            800: '#1b325f', // color1 (Marinho Principal / Textos)
                            coral: '#f26c4f', // color5 (Destaque Coral / Alertas)
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #e9f2f9;
            color: #1b325f;
        }
        /* Custom scrollbars */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #e9f2f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #9cc4e4;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #3a89c9;
        }
        .active-tab {
            background-color: #e9f2f9;
            border-left: 4px solid #3a89c9;
            color: #1b325f;
            font-weight: 700;
        }
        .pulsing-dot {
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.6; }
        }
    </style>
</head>
<body class="min-h-screen flex flex-col lg:flex-row">

    <!-- Sidebar Navigation -->
    <aside class="w-full lg:w-72 bg-[#1b325f] text-white border-b lg:border-r border-[#9cc4e4]/30 flex flex-col shrink-0 shadow-lg">
        <!-- Logo and Brand Header -->
        <div class="p-6 border-b border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white text-[#1b325f] flex items-center justify-center shadow-md">
                    <i class="fa-solid fa-trophy text-lg"></i>
                </div>
                <div>
                    <h1 class="font-extrabold text-lg tracking-wide leading-none text-white">ARENA</h1>
                    <span class="text-xs text-[#9cc4e4] font-semibold uppercase tracking-widest">Championship</span>
                </div>
            </div>
            <button id="mobile-menu-btn" class="lg:hidden text-[#9cc4e4] hover:text-white focus:outline-none">
                <i class="fa-solid fa-bars text-xl"></i>
            </button>
        </div>

        <!-- Navigation Links -->
        <nav id="sidebar-menu" class="hidden lg:flex flex-col gap-1 p-4 flex-1">
            <span class="px-3 py-2 text-xs font-semibold text-[#9cc4e4] uppercase tracking-wider">Painel</span>
            <button onclick="switchView('dashboard')" id="nav-dashboard" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-200 active-tab w-full text-left">
                <i class="fa-solid fa-chart-pie w-5 text-center text-brand-500"></i>
                <span>Dashboard</span>
            </button>
            
            <span class="px-3 py-2 mt-4 text-xs font-semibold text-[#9cc4e4] uppercase tracking-wider">Gestão e Dados</span>
            <button onclick="switchView('atletas')" id="nav-atletas" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition duration-200 w-full text-left">
                <i class="fa-solid fa-user-ninja w-5 text-center text-[#9cc4e4]"></i>
                <span>Atletas</span>
            </button>
            <button onclick="switchView('equipes')" id="nav-equipes" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition duration-200 w-full text-left">
                <i class="fa-solid fa-users w-5 text-center text-[#9cc4e4]"></i>
                <span>Equipes</span>
            </button>
            <button onclick="switchView('chaves')" id="nav-chaves" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition duration-200 w-full text-left">
                <i class="fa-solid fa-diagram-project w-5 text-center text-[#9cc4e4]"></i>
                <span>Geração de Chaves</span>
            </button>
            <button onclick="switchView('areas')" id="nav-areas" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition duration-200 w-full text-left">
                <i class="fa-solid fa-square-person-confined w-5 text-center text-[#9cc4e4]"></i>
                <span>Áreas de Luta</span>
            </button>
            <button onclick="switchView('arbitros')" id="nav-arbitros" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition duration-200 w-full text-left">
                <i class="fa-solid fa-gavel w-5 text-center text-[#9cc4e4]"></i>
                <span>Árbitros</span>
            </button>

            <span class="px-3 py-2 mt-4 text-xs font-semibold text-[#9cc4e4] uppercase tracking-wider">Combate e Placar</span>
            <button onclick="switchView('placar')" id="nav-placar" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition duration-200 w-full text-left">
                <i class="fa-solid fa-stopwatch w-5 text-center text-[#9cc4e4]"></i>
                <span>Placar</span>
            </button>
            <button onclick="switchView('resultados')" id="nav-resultados" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition duration-200 w-full text-left">
                <i class="fa-solid fa-medal w-5 text-center text-[#9cc4e4]"></i>
                <span>Resultados</span>
            </button>
        </nav>

        <!-- Footer Info -->
        <div class="p-4 border-t border-white/10 bg-[#15274b] mt-auto text-center hidden lg:block">
            <span class="text-xs text-[#9cc4e4] block">Torneio ID: #75892</span>
            <span class="text-xs text-[#f26c4f] font-semibold">Admin Panel v2.2</span>
        </div>
    </aside>

    <!-- Main Content Container -->
    <main class="flex-1 flex flex-col min-w-0 bg-[#e9f2f9]">
        
        <!-- Header -->
        <header class="bg-white border-b border-[#9cc4e4]/40 py-5 px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
            <div>
                <h2 id="page-title" class="text-2xl font-extrabold text-[#1b325f] tracking-tight">Administração do Torneio</h2>
                <div class="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-[#1b325f]/70">
                    <span class="flex items-center gap-1 font-medium">
                        <i class="fa-regular fa-calendar-days text-[#3a89c9]"></i>
                        07/06/2026 — 07/06/2026
                    </span>
                    <span class="text-[#9cc4e4]">•</span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f26c4f]/10 text-[#f26c4f] border border-[#f26c4f]/20 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-[#f26c4f] pulsing-dot"></span>
                        INICIADO EM 04/06/2026
                    </span>
                </div>
            </div>
            
            <!-- Quick Stats in Header -->
            <div class="flex items-center gap-3">
                <div class="bg-white border border-[#9cc4e4] rounded-xl px-4 py-2 text-right shadow-sm">
                    <span class="text-[10px] text-[#1b325f]/60 uppercase font-bold block tracking-wider">Atletas Confirmados</span>
                    <span class="text-lg font-extrabold text-[#1b325f]" id="header-athlete-count">342</span>
                </div>
                <div class="bg-white border border-[#9cc4e4] rounded-xl px-4 py-2 text-right shadow-sm">
                    <span class="text-[10px] text-[#1b325f]/60 uppercase font-bold block tracking-wider">Equipes Ativas</span>
                    <span class="text-lg font-extrabold text-[#1b325f]">18</span>
                </div>
            </div>
        </header>

        <!-- Dynamic Panels Wrapper -->
        <div class="p-6 lg:p-8 flex-1 overflow-y-auto max-w-[1600px] mx-auto w-full">
            
            <!-- ALERT / TOAST SYSTEM -->
            <div id="toast-container" class="fixed top-4 right-4 z-50 flex flex-col gap-2"></div>

            <!-- SECTION 1: MAIN DASHBOARD -->
            <section id="view-dashboard" class="space-y-8 block">
                <!-- Highlight summary banner -->
                <div class="relative bg-gradient-to-r from-[#1b325f] via-[#3a89c9] to-[#1b325f] border border-white/10 rounded-2xl p-6 lg:p-8 overflow-hidden shadow-md text-white">
                    <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div class="relative z-10 max-w-2xl">
                        <span class="px-3 py-1 rounded-full text-xs font-bold bg-[#f26c4f] text-white uppercase tracking-wider">Painel Geral</span>
                        <h3 class="text-2xl lg:text-3xl font-extrabold mt-4 leading-tight">Painel de Controle Unificado do Evento</h3>
                        <p class="text-[#e9f2f9] mt-2 text-sm lg:text-base">Gerencie chaves, cronômetros, árbitros e categorias a partir de um único ambiente centralizado. Acesse os módulos abaixo para interagir.</p>
                    </div>
                </div>

                <!-- Main Navigation Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <!-- Atletas Card -->
                    <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl hover:border-[#3a89c9] hover:shadow-md transition-all duration-300 flex flex-col group shadow-sm">
                        <div class="p-6">
                            <div class="w-12 h-12 rounded-xl bg-[#3a89c9]/10 text-[#3a89c9] flex items-center justify-center mb-5 group-hover:scale-105 transition duration-300 border border-[#3a89c9]/20">
                                <i class="fa-solid fa-user-ninja text-xl"></i>
                            </div>
                            <h4 class="text-xl font-bold text-[#1b325f] mb-2">Atletas</h4>
                            <p class="text-sm text-[#1b325f]/70 leading-relaxed mb-6">Cadastro, regularização médica, pesagem e gerenciamento de atletas.</p>
                        </div>
                        <div class="mt-auto px-6 pb-6 pt-2 border-t border-[#9cc4e4]/30 flex justify-between items-center">
                            <span class="text-xs font-semibold text-[#1b325f]/60">342 Inscritos</span>
                            <button onclick="switchView('atletas')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#3a89c9] hover:text-[#1b325f] group-hover:translate-x-1 transition duration-200 bg-[#3a89c9]/10 hover:bg-[#3a89c9]/20 px-3 py-1.5 rounded-lg border border-[#3a89c9]/10">
                                Acessar <i class="fa-solid fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Equipes Card -->
                    <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl hover:border-[#3a89c9] hover:shadow-md transition-all duration-300 flex flex-col group shadow-sm">
                        <div class="p-6">
                            <div class="w-12 h-12 rounded-xl bg-[#3a89c9]/10 text-[#3a89c9] flex items-center justify-center mb-5 group-hover:scale-105 transition duration-300 border border-[#3a89c9]/20">
                                <i class="fa-solid fa-users text-xl"></i>
                            </div>
                            <h4 class="text-xl font-bold text-[#1b325f] mb-2">Equipes</h4>
                            <p class="text-sm text-[#1b325f]/70 leading-relaxed mb-6">Resumo, estatísticas, filiações de equipes e academias participantes.</p>
                        </div>
                        <div class="mt-auto px-6 pb-6 pt-2 border-t border-[#9cc4e4]/30 flex justify-between items-center">
                            <span class="text-xs font-semibold text-[#1b325f]/60">18 Academias</span>
                            <button onclick="switchView('equipes')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#3a89c9] hover:text-[#1b325f] group-hover:translate-x-1 transition duration-200 bg-[#3a89c9]/10 hover:bg-[#3a89c9]/20 px-3 py-1.5 rounded-lg border border-[#3a89c9]/10">
                                Acessar <i class="fa-solid fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Chaves Card -->
                    <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl hover:border-[#3a89c9] hover:shadow-md transition-all duration-300 flex flex-col group shadow-sm">
                        <div class="p-6">
                            <div class="w-12 h-12 rounded-xl bg-[#3a89c9]/10 text-[#3a89c9] flex items-center justify-center mb-5 group-hover:scale-105 transition duration-300 border border-[#3a89c9]/20">
                                <i class="fa-solid fa-diagram-project text-xl"></i>
                            </div>
                            <h4 class="text-xl font-bold text-[#1b325f] mb-2">Geração de Chaves</h4>
                            <p class="text-sm text-[#1b325f]/70 leading-relaxed mb-6">Criação, sorteio e visualização dinâmica de chaves por categoria de peso.</p>
                        </div>
                        <div class="mt-auto px-6 pb-6 pt-2 border-t border-[#9cc4e4]/30 flex justify-between items-center">
                            <span class="text-xs font-semibold text-[#1b325f]/60">14 Categorias</span>
                            <button onclick="switchView('chaves')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#3a89c9] hover:text-[#1b325f] group-hover:translate-x-1 transition duration-200 bg-[#3a89c9]/10 hover:bg-[#3a89c9]/20 px-3 py-1.5 rounded-lg border border-[#3a89c9]/10">
                                Acessar <i class="fa-solid fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Áreas de Luta Card -->
                    <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl hover:border-[#3a89c9] hover:shadow-md transition-all duration-300 flex flex-col group shadow-sm">
                        <div class="p-6">
                            <div class="w-12 h-12 rounded-xl bg-[#3a89c9]/10 text-[#3a89c9] flex items-center justify-center mb-5 group-hover:scale-105 transition duration-300 border border-[#3a89c9]/20">
                                <i class="fa-solid fa-square-person-confined text-xl"></i>
                            </div>
                            <h4 class="text-xl font-bold text-[#1b325f] mb-2">Áreas de Luta</h4>
                            <p class="text-sm text-[#1b325f]/70 leading-relaxed mb-6">Status dos tatames, filas de espera de lutas e andamento em tempo real.</p>
                        </div>
                        <div class="mt-auto px-6 pb-6 pt-2 border-t border-[#9cc4e4]/30 flex justify-between items-center">
                            <span class="text-xs font-semibold text-[#1b325f]/60">3 Áreas Ativas</span>
                            <button onclick="switchView('areas')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#3a89c9] hover:text-[#1b325f] group-hover:translate-x-1 transition duration-200 bg-[#3a89c9]/10 hover:bg-[#3a89c9]/20 px-3 py-1.5 rounded-lg border border-[#3a89c9]/10">
                                Acessar <i class="fa-solid fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Árbitros Card -->
                    <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl hover:border-[#3a89c9] hover:shadow-md transition-all duration-300 flex flex-col group shadow-sm">
                        <div class="p-6">
                            <div class="w-12 h-12 rounded-xl bg-[#3a89c9]/10 text-[#3a89c9] flex items-center justify-center mb-5 group-hover:scale-105 transition duration-300 border border-[#3a89c9]/20">
                                <i class="fa-solid fa-gavel text-xl"></i>
                            </div>
                            <h4 class="text-xl font-bold text-[#1b325f] mb-2">Árbitros</h4>
                            <p class="text-sm text-[#1b325f]/70 leading-relaxed mb-6">Cadastro, controle de escala por tatame e histórico de atuações.</p>
                        </div>
                        <div class="mt-auto px-6 pb-6 pt-2 border-t border-[#9cc4e4]/30 flex justify-between items-center">
                            <span class="text-xs font-semibold text-[#1b325f]/60">8 Árbitros Escalados</span>
                            <button onclick="switchView('arbitros')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#3a89c9] hover:text-[#1b325f] group-hover:translate-x-1 transition duration-200 bg-[#3a89c9]/10 hover:bg-[#3a89c9]/20 px-3 py-1.5 rounded-lg border border-[#3a89c9]/10">
                                Acessar <i class="fa-solid fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Placar Card -->
                    <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl hover:border-[#3a89c9] hover:shadow-md transition-all duration-300 flex flex-col group shadow-sm">
                        <div class="p-6">
                            <div class="w-12 h-12 rounded-xl bg-[#f26c4f]/10 text-[#f26c4f] flex items-center justify-center mb-5 group-hover:scale-105 transition duration-300 border border-[#f26c4f]/20">
                                <i class="fa-solid fa-stopwatch text-xl"></i>
                            </div>
                            <h4 class="text-xl font-bold text-[#1b325f] mb-2">Placar</h4>
                            <p class="text-sm text-[#1b325f]/70 leading-relaxed mb-6">Acompanhamento de lutas e controle de pontos/penalidades ativo.</p>
                        </div>
                        <div class="mt-auto px-6 pb-6 pt-2 border-t border-[#9cc4e4]/30 flex justify-between items-center">
                            <span class="text-xs text-[#f26c4f] font-extrabold flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#f26c4f] pulsing-dot"></span>
                                Ao Vivo
                            </span>
                            <button onclick="switchView('placar')" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#3a89c9] hover:text-[#1b325f] group-hover:translate-x-1 transition duration-200 bg-[#3a89c9]/10 hover:bg-[#3a89c9]/20 px-3 py-1.5 rounded-lg border border-[#3a89c9]/10">
                                Acessar <i class="fa-solid fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Resultados Card -->
                    <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl hover:border-[#3a89c9] hover:shadow-md transition-all duration-300 flex flex-col group lg:col-span-3 shadow-sm">
                        <div class="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-xl bg-[#f26c4f]/10 text-[#f26c4f] flex items-center justify-center group-hover:scale-105 transition duration-300 border border-[#f26c4f]/20 shrink-0">
                                    <i class="fa-solid fa-medal text-xl"></i>
                                </div>
                                <div>
                                    <h4 class="text-xl font-bold text-[#1b325f] mb-1">Resultados</h4>
                                    <p class="text-sm text-[#1b325f]/70 max-w-2xl leading-relaxed">Quadro Geral de Medalhas por equipes, campeões de categorias e distribuição de pódios do torneio em tempo real.</p>
                                </div>
                            </div>
                            <button onclick="switchView('resultados')" class="inline-flex items-center gap-1.5 text-sm font-bold text-[#f26c4f] hover:text-[#1b325f] group-hover:translate-x-1 transition duration-200 bg-[#f26c4f]/10 hover:bg-[#f26c4f]/20 px-5 py-2.5 rounded-xl border border-[#f26c4f]/20 self-start md:self-auto shrink-0">
                                Acessar Classificação <i class="fa-solid fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            <!-- SECTION 2: ATLETAS PANEL -->
            <section id="view-atletas" class="space-y-6 hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 class="text-xl font-extrabold text-[#1b325f]">Cadastro e Gerenciamento de Atletas</h3>
                        <p class="text-sm text-[#1b325f]/70">Total de 342 atletas inscritos em diversas categorias de peso e faixas.</p>
                    </div>
                    <button onclick="openModal('modal-add-atleta')" class="bg-[#3a89c9] hover:bg-[#1b325f] text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition duration-200 shadow-sm">
                        <i class="fa-solid fa-plus"></i> Novo Atleta
                    </button>
                </div>

                <!-- Filters -->
                <div class="bg-white border border-[#9cc4e4]/60 p-4 rounded-xl flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
                    <div class="relative w-full lg:w-96">
                        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-[#1b325f]/50 text-sm"></i>
                        <input type="text" id="athlete-search" oninput="filterAthletes()" placeholder="Pesquisar por atleta ou equipe..." class="bg-[#e9f2f9]/60 border border-[#9cc4e4] rounded-lg pl-10 pr-4 py-2 w-full text-[#1b325f] placeholder-[#1b325f]/50 focus:outline-none focus:border-[#3a89c9] text-sm">
                    </div>
                    <div class="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                        <select id="filter-belt" onchange="filterAthletes()" class="bg-[#e9f2f9]/60 border border-[#9cc4e4] rounded-lg px-3 py-2 text-sm text-[#1b325f] font-medium focus:outline-none focus:border-[#3a89c9]">
                            <option value="todos">Todas as Graduações</option>
                            <option value="Preta">Preta</option>
                            <option value="Marrom">Marrom</option>
                            <option value="Roxa">Roxa</option>
                            <option value="Azul">Azul</option>
                            <option value="Branca">Branca</option>
                        </select>
                        <select id="filter-status" onchange="filterAthletes()" class="bg-[#e9f2f9]/60 border border-[#9cc4e4] rounded-lg px-3 py-2 text-sm text-[#1b325f] font-medium focus:outline-none focus:border-[#3a89c9]">
                            <option value="todos">Todos Status</option>
                            <option value="Confirmado">Confirmado</option>
                            <option value="Pendente">Pesagem Pendente</option>
                        </select>
                    </div>
                </div>

                <!-- Athlete Table -->
                <div class="bg-white border border-[#9cc4e4]/60 rounded-xl overflow-hidden shadow-sm">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-[#e9f2f9] text-xs font-bold uppercase text-[#1b325f] border-b border-[#9cc4e4]/60">
                                    <th class="p-4">Nome do Atleta</th>
                                    <th class="p-4">Graduação / Faixa</th>
                                    <th class="p-4">Categoria / Peso</th>
                                    <th class="p-4">Equipe / Academia</th>
                                    <th class="p-4 text-center">Pesagem</th>
                                    <th class="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="athlete-table-body" class="text-sm divide-y divide-[#9cc4e4]/30 text-[#1b325f]">
                                <!-- Generated Dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- SECTION 3: EQUIPES PANEL -->
            <section id="view-equipes" class="space-y-6 hidden">
                <div>
                    <h3 class="text-xl font-extrabold text-[#1b325f]">Resumo de Equipes / Academias</h3>
                    <p class="text-sm text-[#1b325f]/70">Classificação parcial e filiações das agremiações parceiras do evento.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white border border-[#9cc4e4]/60 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                            <span class="text-xs text-[#1b325f]/60 font-bold uppercase">Total Equipes</span>
                            <span class="text-3xl font-black text-[#1b325f] block mt-1">18</span>
                        </div>
                        <div class="w-12 h-12 rounded-xl bg-[#3a89c9]/10 text-[#3a89c9] flex items-center justify-center">
                            <i class="fa-solid fa-users text-lg"></i>
                        </div>
                    </div>
                    <div class="bg-white border border-[#9cc4e4]/60 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                            <span class="text-xs text-[#1b325f]/60 font-bold uppercase">Equipe Líder</span>
                            <span class="text-xl font-black text-[#1b325f] block mt-1">Alliance Jiu-Jitsu</span>
                        </div>
                        <div class="w-12 h-12 rounded-xl bg-[#f26c4f]/10 text-[#f26c4f] flex items-center justify-center">
                            <i class="fa-solid fa-crown text-lg"></i>
                        </div>
                    </div>
                    <div class="bg-white border border-[#9cc4e4]/60 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                            <span class="text-xs text-[#1b325f]/60 font-bold uppercase">Atletas Federados</span>
                            <span class="text-3xl font-black text-[#1b325f] block mt-1">290</span>
                        </div>
                        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <i class="fa-solid fa-id-card text-lg"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white border border-[#9cc4e4]/60 rounded-xl overflow-hidden shadow-sm">
                    <div class="p-5 border-b border-[#9cc4e4]/60 bg-[#e9f2f9]/40 flex justify-between items-center">
                        <span class="font-bold text-[#1b325f]">Classificação Geral de Escolas</span>
                        <span class="text-xs text-[#3a89c9] font-extrabold">Atualizado há 10 min</span>
                    </div>
                    <div class="divide-y divide-[#9cc4e4]/30" id="teams-list">
                        <!-- Dynamic teams -->
                    </div>
                </div>
            </section>

            <!-- SECTION 4: GERAÇÃO DE CHAVES -->
            <section id="view-chaves" class="space-y-6 hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 class="text-xl font-extrabold text-[#1b325f]">Chaves de Competição</h3>
                        <p class="text-sm text-[#1b325f]/70">Geração de pareamento automatizado ou manual das lutas.</p>
                    </div>
                    <div class="flex gap-2">
                        <select id="bracket-category-select" class="bg-white border border-[#9cc4e4] rounded-xl px-4 py-2.5 text-sm text-[#1b325f] font-semibold focus:ring-2 focus:ring-[#3a89c9] focus:outline-none shadow-sm">
                            <option value="adulto-pena">Adulto / Preta / Pena (-70kg)</option>
                            <option value="adulto-medio">Adulto / Preta / Médio (-82kg)</option>
                            <option value="master-pesado">Master / Marrom / Pesado (-94kg)</option>
                        </select>
                        <button onclick="regenerateBrackets()" class="bg-[#3a89c9] hover:bg-[#1b325f] text-white font-bold text-sm px-4 py-2.5 rounded-xl transition duration-200 flex items-center gap-2 shadow-sm">
                            <i class="fa-solid fa-arrows-rotate"></i> Recriar Chave
                        </button>
                    </div>
                </div>

                <!-- Bracket Visualization -->
                <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <div class="min-w-[800px] grid grid-cols-3 gap-8 relative py-8">
                        
                        <!-- Col 1: Semifinals -->
                        <div class="space-y-12 flex flex-col justify-center">
                            <div class="text-xs font-bold text-[#1b325f]/60 uppercase tracking-widest text-center mb-2">Semifinais</div>
                            
                            <!-- Match 1 -->
                            <div class="bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-xl overflow-hidden shadow-sm">
                                <div class="p-3 border-b border-[#9cc4e4]/60 flex items-center justify-between bg-white">
                                    <span class="text-xs text-[#1b325f]/70 font-bold">Luta #01</span>
                                    <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">Finalizada</span>
                                </div>
                                <div class="p-3 space-y-2 bg-white/70">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="w-1.5 h-6 bg-[#3a89c9] rounded-full"></span>
                                            <span class="text-sm font-bold text-[#1b325f] truncate" id="fighter-semifinal-1a">Carlos Silva</span>
                                        </div>
                                        <span class="text-xs font-black text-[#3a89c9]" id="score-semifinal-1a">11</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="w-1.5 h-6 bg-[#9cc4e4] rounded-full"></span>
                                            <span class="text-sm font-medium text-[#1b325f]/60" id="fighter-semifinal-1b">Pedro Oliveira</span>
                                        </div>
                                        <span class="text-xs font-semibold text-[#1b325f]/40" id="score-semifinal-1b">2</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Match 2 -->
                            <div class="bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-xl overflow-hidden shadow-sm">
                                <div class="p-3 border-b border-[#9cc4e4]/60 flex items-center justify-between bg-white">
                                    <span class="text-xs text-[#1b325f]/70 font-bold">Luta #02</span>
                                    <span class="px-2 py-0.5 rounded text-[10px] bg-[#f26c4f]/10 text-[#f26c4f] font-bold">Em Breve</span>
                                </div>
                                <div class="p-3 space-y-2 bg-white/70">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                            <span class="text-sm font-semibold text-[#1b325f]" id="fighter-semifinal-2a">Marcus Vinicius</span>
                                        </div>
                                        <span class="text-xs font-semibold text-[#1b325f]/40">-</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
                                            <span class="text-sm font-semibold text-[#1b325f]" id="fighter-semifinal-2b">Felipe Diniz</span>
                                        </div>
                                        <span class="text-xs font-semibold text-[#1b325f]/40">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Col 2: Finals -->
                        <div class="space-y-12 flex flex-col justify-center relative">
                            <!-- Branch connectors decoration -->
                            <div class="absolute -left-4 top-1/4 bottom-1/4 w-4 border-y-2 border-r-2 border-[#9cc4e4] pointer-events-none rounded-r-lg"></div>
                            
                            <div class="text-xs font-bold text-[#1b325f]/60 uppercase tracking-widest text-center mb-2">Final</div>
                            
                            <!-- Match Final -->
                            <div class="bg-white border-2 border-[#3a89c9]/30 rounded-xl overflow-hidden shadow-md relative z-10">
                                <div class="p-3 border-b border-[#9cc4e4]/60 flex items-center justify-between bg-[#e9f2f9]/30">
                                    <span class="text-xs text-[#3a89c9] font-extrabold">Luta de Ouro (#05)</span>
                                    <span class="px-2 py-0.5 rounded text-[10px] bg-[#e9f2f9] text-[#1b325f]/60 font-semibold">Não Iniciada</span>
                                </div>
                                <div class="p-3 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="w-1.5 h-6 bg-[#3a89c9] rounded-full"></span>
                                            <span class="text-sm font-bold text-[#1b325f]" id="fighter-final-1">Carlos Silva</span>
                                        </div>
                                        <span class="text-xs font-semibold text-[#1b325f]/40">-</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="w-1.5 h-6 bg-[#9cc4e4] rounded-full"></span>
                                            <span class="text-sm font-medium text-[#1b325f]/50" id="fighter-final-2">Aguardando Luta #02</span>
                                        </div>
                                        <span class="text-xs font-semibold text-[#1b325f]/40">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Col 3: Champion Display -->
                        <div class="flex flex-col items-center justify-center text-center">
                            <div class="bg-[#e9f2f9] p-8 rounded-2xl border-2 border-[#9cc4e4] shadow-md flex flex-col items-center max-w-[240px]">
                                <div class="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-[#f26c4f] rounded-full flex items-center justify-center shadow-md mb-4 animate-bounce">
                                    <i class="fa-solid fa-trophy text-white text-2xl"></i>
                                </div>
                                <span class="text-[10px] font-black text-[#f26c4f] uppercase tracking-widest block mb-1">Campeão</span>
                                <h4 class="font-extrabold text-[#1b325f] text-lg leading-tight" id="champion-name">A Definir</h4>
                                <span class="text-xs text-[#1b325f]/60 mt-2 block font-medium" id="champion-team">-</span>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <!-- SECTION 5: ÁREAS DE LUTA (MATS) -->
            <section id="view-areas" class="space-y-6 hidden">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-extrabold text-[#1b325f]">Status das Áreas de Luta (Tatames)</h3>
                        <p class="text-sm text-[#1b325f]/70">Distribuição ao vivo e gerenciamento das lutas.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="mats-grid">
                    <!-- Dynamic Mat Cards go here -->
                </div>
            </section>

            <!-- SECTION 6: ÁRBITROS -->
            <section id="view-arbitros" class="space-y-6 hidden">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-extrabold text-[#1b325f]">Cadastro e Escala de Árbitros</h3>
                        <p class="text-sm text-[#1b325f]/70">Árbitros cadastrados e escalação para os tatames.</p>
                    </div>
                    <button onclick="openModal('modal-add-arbitro')" class="bg-[#3a89c9] hover:bg-[#1b325f] text-white font-bold text-sm px-4 py-2.5 rounded-xl transition duration-200 shadow-sm">
                        + Escalar Árbitro
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="arbitros-grid">
                    <!-- Dynamic Arbiters -->
                </div>
            </section>

            <!-- SECTION 7: PLACAR -->
            <section id="view-placar" class="space-y-6 hidden">
                <div class="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div>
                        <h3 class="text-xl font-extrabold text-[#1b325f]">Placar Interativo</h3>
                        <p class="text-sm text-[#1b325f]/70">Selecione uma luta ou controle manualmente os pontos em tempo real.</p>
                    </div>
                    
                    <div class="flex gap-2">
                        <select id="placar-select-mat" onchange="loadPlacarMatch()" class="bg-white border border-[#9cc4e4] rounded-xl px-4 py-2 text-sm text-[#1b325f] font-semibold focus:outline-none focus:border-[#3a89c9] shadow-sm">
                            <option value="mat-1">Tatame 1 (Luta Ativa)</option>
                            <option value="mat-2">Tatame 2 (Luta Ativa)</option>
                            <option value="mat-3">Tatame 3 (Luta Ativa)</option>
                        </select>
                    </div>
                </div>

                <!-- Digital Scoreboard Interface -->
                <div class="bg-white border-2 border-[#9cc4e4] rounded-2xl overflow-hidden shadow-md">
                    
                    <!-- Scoreboard Info Banner -->
                    <div class="bg-[#e9f2f9] p-4 border-b border-[#9cc4e4]/60 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <span class="w-3.5 h-3.5 rounded-full bg-[#f26c4f] pulsing-dot"></span>
                            <span class="text-sm font-bold text-[#1b325f]" id="placar-fight-title">LUTADOR A vs LUTADOR B</span>
                        </div>
                        <div class="text-xs text-[#1b325f]/70 font-semibold">
                            Área de Combate: <span class="text-[#1b325f] font-black" id="placar-mat-name">Tatame 1</span>
                        </div>
                    </div>

                    <!-- Split layout for fighters and timer -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#9cc4e4]/50">
                        
                        <!-- Fighter Blue/Left Side -->
                        <div class="lg:col-span-5 p-8 flex flex-col items-center justify-between bg-[#3a89c9]/5">
                            <div class="text-center w-full">
                                <span class="px-3 py-1 bg-[#3a89c9]/10 text-[#3a89c9] text-xs font-bold rounded-full border border-[#3a89c9]/20 uppercase tracking-widest">KIMONO AZUL</span>
                                <h4 class="text-2xl font-black text-[#1b325f] mt-4" id="placar-athlete1-name">Carlos Silva</h4>
                                <span class="text-xs text-[#1b325f]/60 font-semibold block mt-1" id="placar-athlete1-team">Alliance Jiu-Jitsu</span>
                            </div>

                            <!-- BIG POINTS COUNT -->
                            <div class="my-8 flex flex-col items-center">
                                <span class="text-8xl font-black text-[#1b325f]" id="placar-points-1">00</span>
                                <span class="text-xs text-[#1b325f]/50 uppercase tracking-widest font-extrabold mt-1">PONTOS</span>
                            </div>

                            <!-- Controls -->
                            <div class="grid grid-cols-2 gap-4 w-full">
                                <div class="bg-white rounded-xl p-3 border border-[#9cc4e4]/60 flex flex-col items-center shadow-sm">
                                    <span class="text-[10px] text-[#1b325f]/60 font-bold uppercase tracking-wider mb-2">VANTAGENS</span>
                                    <div class="flex items-center gap-4">
                                        <button onclick="changeStat(1, 'adv', -1)" class="w-8 h-8 rounded-lg bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold flex items-center justify-center">-</button>
                                        <span class="text-lg font-black text-amber-500" id="placar-adv-1">0</span>
                                        <button onclick="changeStat(1, 'adv', 1)" class="w-8 h-8 rounded-lg bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold flex items-center justify-center">+</button>
                                    </div>
                                </div>
                                <div class="bg-white rounded-xl p-3 border border-[#9cc4e4]/60 flex flex-col items-center shadow-sm">
                                    <span class="text-[10px] text-[#1b325f]/60 font-bold uppercase tracking-wider mb-2">PUNIÇÕES</span>
                                    <div class="flex items-center gap-4">
                                        <button onclick="changeStat(1, 'pen', -1)" class="w-8 h-8 rounded-lg bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold flex items-center justify-center">-</button>
                                        <span class="text-lg font-black text-[#f26c4f]" id="placar-pen-1">0</span>
                                        <button onclick="changeStat(1, 'pen', 1)" class="w-8 h-8 rounded-lg bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold flex items-center justify-center">+</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Main Point Buttons -->
                            <div class="flex gap-2 w-full mt-6">
                                <button onclick="changeStat(1, 'points', 2)" class="flex-1 bg-[#3a89c9] hover:bg-[#1b325f] text-white font-black py-2.5 px-3 rounded-lg text-sm text-center shadow-sm">+2 PTS</button>
                                <button onclick="changeStat(1, 'points', 3)" class="flex-1 bg-[#3a89c9] hover:bg-[#1b325f] text-white font-black py-2.5 px-3 rounded-lg text-sm text-center shadow-sm">+3 PTS</button>
                                <button onclick="changeStat(1, 'points', 4)" class="flex-1 bg-[#3a89c9] hover:bg-[#1b325f] text-white font-black py-2.5 px-3 rounded-lg text-sm text-center shadow-sm">+4 PTS</button>
                                <button onclick="changeStat(1, 'points', -1)" class="w-10 bg-[#9cc4e4] hover:bg-[#3a89c9] hover:text-white text-[#1b325f] font-bold py-2.5 rounded-lg text-sm text-center transition">-1</button>
                            </div>
                        </div>

                        <!-- Timer Middle Controls -->
                        <div class="lg:col-span-2 p-6 flex flex-col items-center justify-center bg-[#e9f2f9]/30">
                            <span class="text-[10px] text-[#1b325f]/60 font-bold uppercase tracking-wider mb-2">CRONÔMETRO</span>
                            
                            <!-- Large Digital Clock -->
                            <div class="text-4xl lg:text-5xl font-mono font-extrabold text-[#1b325f] tracking-widest my-4" id="timer-display">
                                05:00
                            </div>

                            <!-- Controls -->
                            <div class="flex gap-2 w-full mt-2">
                                <button id="timer-toggle-btn" onclick="toggleTimer()" class="flex-1 bg-[#3a89c9] hover:bg-[#1b325f] text-white font-bold py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-sm">
                                    <i class="fa-solid fa-play text-xs"></i> <span>Iniciar</span>
                                </button>
                                <button onclick="resetTimer()" class="p-3 bg-[#9cc4e4]/40 hover:bg-[#9cc4e4] text-[#1b325f] rounded-xl transition duration-150">
                                    <i class="fa-solid fa-rotate-left"></i>
                                </button>
                            </div>

                            <div class="mt-8 flex flex-col gap-2 w-full">
                                <button onclick="setTimerLength(3)" class="text-xs bg-[#e9f2f9] border border-[#9cc4e4]/80 hover:bg-[#9cc4e4]/30 text-[#1b325f] font-semibold py-1.5 px-3 rounded-lg">3 Minutos</button>
                                <button onclick="setTimerLength(5)" class="text-xs bg-[#e9f2f9] border border-[#9cc4e4]/80 hover:bg-[#9cc4e4]/30 text-[#1b325f] font-semibold py-1.5 px-3 rounded-lg">5 Minutos</button>
                                <button onclick="setTimerLength(10)" class="text-xs bg-[#e9f2f9] border border-[#9cc4e4]/80 hover:bg-[#9cc4e4]/30 text-[#1b325f] font-semibold py-1.5 px-3 rounded-lg">10 Minutos</button>
                            </div>
                        </div>

                        <!-- Fighter Coral/Right Side (Replacing Green theme beautifully) -->
                        <div class="lg:col-span-5 p-8 flex flex-col items-center justify-between bg-[#f26c4f]/5">
                            <div class="text-center w-full">
                                <span class="px-3 py-1 bg-[#f26c4f]/10 text-[#f26c4f] text-xs font-bold rounded-full border border-[#f26c4f]/20 uppercase tracking-widest">KIMONO BRANCO / CORAL</span>
                                <h4 class="text-2xl font-black text-[#1b325f] mt-4" id="placar-athlete2-name">Pedro Oliveira</h4>
                                <span class="text-xs text-[#1b325f]/60 font-semibold block mt-1" id="placar-athlete2-team">Gracie Barra</span>
                            </div>

                            <!-- BIG POINTS COUNT -->
                            <div class="my-8 flex flex-col items-center">
                                <span class="text-8xl font-black text-[#1b325f]" id="placar-points-2">00</span>
                                <span class="text-xs text-[#1b325f]/50 uppercase tracking-widest font-extrabold mt-1">PONTOS</span>
                            </div>

                            <!-- Controls -->
                            <div class="grid grid-cols-2 gap-4 w-full">
                                <div class="bg-white rounded-xl p-3 border border-[#9cc4e4]/60 flex flex-col items-center shadow-sm">
                                    <span class="text-[10px] text-[#1b325f]/60 font-bold uppercase tracking-wider mb-2">VANTAGENS</span>
                                    <div class="flex items-center gap-4">
                                        <button onclick="changeStat(2, 'adv', -1)" class="w-8 h-8 rounded-lg bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold flex items-center justify-center">-</button>
                                        <span class="text-lg font-black text-amber-500" id="placar-adv-2">0</span>
                                        <button onclick="changeStat(2, 'adv', 1)" class="w-8 h-8 rounded-lg bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold flex items-center justify-center">+</button>
                                    </div>
                                </div>
                                <div class="bg-white rounded-xl p-3 border border-[#9cc4e4]/60 flex flex-col items-center shadow-sm">
                                    <span class="text-[10px] text-[#1b325f]/60 font-bold uppercase tracking-wider mb-2">PUNIÇÕES</span>
                                    <div class="flex items-center gap-4">
                                        <button onclick="changeStat(2, 'pen', -1)" class="w-8 h-8 rounded-lg bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold flex items-center justify-center">-</button>
                                        <span class="text-lg font-black text-[#f26c4f]" id="placar-pen-2">0</span>
                                        <button onclick="changeStat(2, 'pen', 1)" class="w-8 h-8 rounded-lg bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold flex items-center justify-center">+</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Main Point Buttons -->
                            <div class="flex gap-2 w-full mt-6">
                                <button onclick="changeStat(2, 'points', 2)" class="flex-1 bg-[#f26c4f] hover:bg-[#1b325f] text-white font-black py-2.5 px-3 rounded-lg text-sm text-center shadow-sm">+2 PTS</button>
                                <button onclick="changeStat(2, 'points', 3)" class="flex-1 bg-[#f26c4f] hover:bg-[#1b325f] text-white font-black py-2.5 px-3 rounded-lg text-sm text-center shadow-sm">+3 PTS</button>
                                <button onclick="changeStat(2, 'points', 4)" class="flex-1 bg-[#f26c4f] hover:bg-[#1b325f] text-white font-black py-2.5 px-3 rounded-lg text-sm text-center shadow-sm">+4 PTS</button>
                                <button onclick="changeStat(2, 'points', -1)" class="w-10 bg-[#9cc4e4] hover:bg-[#f26c4f] hover:text-white text-[#1b325f] font-bold py-2.5 rounded-lg text-sm text-center transition">-1</button>
                            </div>
                        </div>

                    </div>

                    <!-- Actions Bottom -->
                    <div class="bg-[#e9f2f9] p-6 border-t border-[#9cc4e4]/60 flex justify-between gap-4">
                        <button onclick="declareWinner(1)" class="bg-[#3a89c9] hover:bg-[#1b325f] text-white font-bold py-2.5 px-5 rounded-xl text-sm transition shadow-sm">VITÓRIA ATLETA AZUL</button>
                        <button onclick="declareWinner(2)" class="bg-[#f26c4f] hover:bg-[#1b325f] text-white font-bold py-2.5 px-5 rounded-xl text-sm transition shadow-sm">VITÓRIA ATLETA BRANCO/CORAL</button>
                    </div>

                </div>
            </section>

            <!-- SECTION 8: RESULTADOS -->
            <section id="view-resultados" class="space-y-8 hidden">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-extrabold text-[#1b325f]">Classificação e Medalhistas</h3>
                        <p class="text-sm text-[#1b325f]/70">Pódio oficial por categoria e contagem de medalhas do torneio.</p>
                    </div>
                </div>

                <!-- Custom visual podium -->
                <div class="bg-white border border-[#9cc4e4]/60 rounded-2xl p-6 shadow-sm">
                    <h4 class="font-extrabold text-[#1b325f] mb-6 text-center">Pódio Simulado (Categoria: Adulto - Preta - Pena)</h4>
                    
                    <div class="flex flex-col sm:flex-row items-end justify-center gap-4 pt-12 max-w-lg mx-auto">
                        <!-- 2nd place -->
                        <div class="flex flex-col items-center w-full sm:w-1/3 order-2 sm:order-1">
                            <span class="text-sm font-bold text-[#1b325f]">Pedro Oliveira</span>
                            <span class="text-[10px] text-[#1b325f]/60 mb-2 font-semibold">Gracie Barra</span>
                            <div class="bg-[#e9f2f9] border-2 border-[#9cc4e4] w-full h-24 rounded-t-xl flex flex-col items-center justify-center p-4 shadow-sm">
                                <div class="w-10 h-10 bg-slate-400 rounded-full flex items-center justify-center text-white font-extrabold text-sm mb-1 shadow-sm">2</div>
                                <span class="text-xs text-[#1b325f]/70 font-bold uppercase tracking-wider">Prata</span>
                            </div>
                        </div>
                        <!-- 1st place -->
                        <div class="flex flex-col items-center w-full sm:w-1/3 order-1 sm:order-2">
                            <div class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white mb-1 animate-bounce shadow-md">
                                <i class="fa-solid fa-crown text-sm"></i>
                            </div>
                            <span class="text-base font-extrabold text-[#1b325f]">Carlos Silva</span>
                            <span class="text-[10px] text-[#1b325f]/60 mb-2 font-semibold">Alliance Jiu-Jitsu</span>
                            <div class="bg-gradient-to-tr from-yellow-400 to-[#f26c4f] w-full h-36 rounded-t-xl flex flex-col items-center justify-center p-4 shadow-md border-t-4 border-[#f26c4f]">
                                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#1b325f] font-black text-lg mb-1 shadow-md">1</div>
                                <span class="text-sm text-white font-extrabold uppercase tracking-wider">Ouro</span>
                            </div>
                        </div>
                        <!-- 3rd place -->
                        <div class="flex flex-col items-center w-full sm:w-1/3 order-3">
                            <span class="text-sm font-bold text-[#1b325f]">Marcus Vinicius</span>
                            <span class="text-[10px] text-[#1b325f]/60 mb-2 font-semibold">Checkmat</span>
                            <div class="bg-[#e9f2f9] border-2 border-[#9cc4e4] w-full h-20 rounded-t-xl flex flex-col items-center justify-center p-4 shadow-sm">
                                <div class="w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center text-white font-extrabold text-xs mb-1 shadow-sm">3</div>
                                <span class="text-xs text-[#1b325f]/70 font-bold uppercase tracking-wider">Bronze</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Medal Table -->
                <div class="bg-white border border-[#9cc4e4]/60 rounded-xl overflow-hidden shadow-sm">
                    <div class="p-5 border-b border-[#9cc4e4]/60 bg-[#e9f2f9]/30">
                        <span class="font-extrabold text-[#1b325f]">Quadro Geral de Medalhas</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead>
                                <tr class="bg-[#e9f2f9] text-xs font-bold uppercase text-[#1b325f]/80 border-b border-[#9cc4e4]/60">
                                    <th class="p-4">Rank</th>
                                    <th class="p-4">Equipe</th>
                                    <th class="p-4 text-center"><i class="fa-solid fa-circle text-yellow-400 mr-1 shadow-sm"></i> Ouro</th>
                                    <th class="p-4 text-center"><i class="fa-solid fa-circle text-slate-300 mr-1 shadow-sm"></i> Prata</th>
                                    <th class="p-4 text-center"><i class="fa-solid fa-circle text-amber-600 mr-1 shadow-sm"></i> Bronze</th>
                                    <th class="p-4 text-center">Pontos Totais</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#9cc4e4]/30 text-sm text-[#1b325f] font-medium">
                                <tr class="hover:bg-[#e9f2f9]/30">
                                    <td class="p-4 font-black">#1</td>
                                    <td class="p-4 font-black">Alliance Jiu-Jitsu</td>
                                    <td class="p-4 text-center font-bold text-yellow-500">12</td>
                                    <td class="p-4 text-center">8</td>
                                    <td class="p-4 text-center">5</td>
                                    <td class="p-4 text-center font-black text-[#3a89c9]">141</td>
                                </tr>
                                <tr class="hover:bg-[#e9f2f9]/30">
                                    <td class="p-4 font-black">#2</td>
                                    <td class="p-4">Gracie Barra</td>
                                    <td class="p-4 text-center font-bold text-yellow-500">9</td>
                                    <td class="p-4 text-center">11</td>
                                    <td class="p-4 text-center">6</td>
                                    <td class="p-4 text-center font-black text-[#3a89c9]">123</td>
                                </tr>
                                <tr class="hover:bg-[#e9f2f9]/30">
                                    <td class="p-4 font-black">#3</td>
                                    <td class="p-4">Checkmat</td>
                                    <td class="p-4 text-center font-bold text-yellow-500">7</td>
                                    <td class="p-4 text-center">5</td>
                                    <td class="p-4 text-center">9</td>
                                    <td class="p-4 text-center font-black text-[#3a89c9]">86</td>
                                </tr>
                                <tr class="hover:bg-[#e9f2f9]/30">
                                    <td class="p-4 font-black">#4</td>
                                    <td class="p-4">Atos Jiu-Jitsu</td>
                                    <td class="p-4 text-center font-bold text-yellow-500">4</td>
                                    <td class="p-4 text-center">6</td>
                                    <td class="p-4 text-center">4</td>
                                    <td class="p-4 text-center font-black text-[#3a89c9]">58</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

        </div>
    </main>

    <!-- MODALS SECTION -->
    
    <!-- Modal: Adicionar Atleta -->
    <div id="modal-add-atleta" class="fixed inset-0 bg-[#1b325f]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white border-2 border-[#9cc4e4] rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onclick="closeModal('modal-add-atleta')" class="absolute top-4 right-4 text-[#1b325f]/50 hover:text-[#1b325f]">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
            <h4 class="text-lg font-black text-[#1b325f] mb-4">Inscrever Novo Atleta</h4>
            
            <form id="add-atleta-form" onsubmit="handleNewAthlete(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-[#1b325f] uppercase mb-1">Nome Completo</label>
                    <input type="text" id="new-ath-name" required class="w-full bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-lg p-2.5 text-sm text-[#1b325f] focus:outline-none focus:border-[#3a89c9] font-medium">
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#1b325f] uppercase mb-1">Graduação / Faixa</label>
                    <select id="new-ath-belt" class="w-full bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-lg p-2.5 text-sm text-[#1b325f] focus:outline-none focus:border-[#3a89c9] font-medium">
                        <option value="Preta">Preta</option>
                        <option value="Marrom">Marrom</option>
                        <option value="Roxa">Roxa</option>
                        <option value="Azul">Azul</option>
                        <option value="Branca">Branca</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#1b325f] uppercase mb-1">Categoria de Peso</label>
                    <input type="text" id="new-ath-weight" placeholder="Ex: Pena (-70kg)" required class="w-full bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-lg p-2.5 text-sm text-[#1b325f] focus:outline-none focus:border-[#3a89c9] font-medium">
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#1b325f] uppercase mb-1">Equipe / Academia</label>
                    <input type="text" id="new-ath-team" required class="w-full bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-lg p-2.5 text-sm text-[#1b325f] focus:outline-none focus:border-[#3a89c9] font-medium">
                </div>

                <div class="flex gap-2 pt-4">
                    <button type="button" onclick="closeModal('modal-add-atleta')" class="flex-1 bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold py-2 rounded-xl text-sm transition">Cancelar</button>
                    <button type="submit" class="flex-1 bg-[#3a89c9] hover:bg-[#1b325f] text-white font-bold py-2 rounded-xl text-sm transition shadow-sm">Salvar Cadastro</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Escalar Árbitro -->
    <div id="modal-add-arbitro" class="fixed inset-0 bg-[#1b325f]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white border-2 border-[#9cc4e4] rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onclick="closeModal('modal-add-arbitro')" class="absolute top-4 right-4 text-[#1b325f]/50 hover:text-[#1b325f]">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
            <h4 class="text-lg font-black text-[#1b325f] mb-4">Escalar Árbitro para o Evento</h4>
            
            <form id="add-arbitro-form" onsubmit="handleNewRef(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-[#1b325f] uppercase mb-1">Nome Completo</label>
                    <input type="text" id="new-ref-name" required class="w-full bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-lg p-2.5 text-sm text-[#1b325f] focus:outline-none focus:border-[#3a89c9] font-medium">
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#1b325f] uppercase mb-1">Nível de Certificação</label>
                    <select id="new-ref-level" class="w-full bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-lg p-2.5 text-sm text-[#1b325f] focus:outline-none focus:border-[#3a89c9] font-medium">
                        <option value="Internacional A">Internacional A</option>
                        <option value="Nacional B">Nacional B</option>
                        <option value="Estadual C">Estadual C</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#1b325f] uppercase mb-1">Alocar para Tatame</label>
                    <select id="new-ref-mat" class="w-full bg-[#e9f2f9]/40 border border-[#9cc4e4] rounded-lg p-2.5 text-sm text-[#1b325f] focus:outline-none focus:border-[#3a89c9] font-medium">
                        <option value="Tatame 1">Tatame 1</option>
                        <option value="Tatame 2">Tatame 2</option>
                        <option value="Tatame 3">Tatame 3</option>
                        <option value="Reserva">Ref. Reserva / Supervisor</option>
                    </select>
                </div>

                <div class="flex gap-2 pt-4">
                    <button type="button" onclick="closeModal('modal-add-arbitro')" class="flex-1 bg-[#e9f2f9] hover:bg-[#9cc4e4]/40 text-[#1b325f] font-bold py-2 rounded-xl text-sm transition">Cancelar</button>
                    <button type="submit" class="flex-1 bg-[#3a89c9] hover:bg-[#1b325f] text-white font-bold py-2 rounded-xl text-sm transition shadow-sm">Escalar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- JAVASCRIPT LOGIC ENGINE -->
    <script>
        // --- IN-MEMORY DATABASE STATE ---
        const state = {
            athletes: [
                { id: 1, name: "Carlos Silva", belt: "Preta", weight: "Pena (-70kg)", team: "Alliance Jiu-Jitsu", weighed: true },
                { id: 2, name: "Pedro Oliveira", belt: "Preta", weight: "Pena (-70kg)", team: "Gracie Barra", weighed: true },
                { id: 3, name: "Marcus Vinicius", belt: "Preta", weight: "Pena (-70kg)", team: "Checkmat", weighed: true },
                { id: 4, name: "Felipe Diniz", belt: "Preta", weight: "Pena (-70kg)", team: "Atos Jiu-Jitsu", weighed: true },
                { id: 5, name: "Lucas Gomes", belt: "Roxa", weight: "Médio (-82kg)", team: "Alliance Jiu-Jitsu", weighed: true },
                { id: 6, name: "Ricardo Santos", belt: "Azul", weight: "Médio (-82kg)", team: "Nova União", weighed: false },
                { id: 7, name: "Gustavo Albuquerque", belt: "Marrom", weight: "Pesado (-94kg)", team: "GFTeam", weighed: true },
                { id: 8, name: "Rodrigo Melo", belt: "Branca", weight: "Pesado (-94kg)", team: "Checkmat", weighed: false }
            ],
            teams: [
                { name: "Alliance Jiu-Jitsu", gold: 12, silver: 8, bronze: 5, points: 141, totalAthletes: 94 },
                { name: "Gracie Barra", gold: 9, silver: 11, bronze: 6, points: 123, totalAthletes: 88 },
                { name: "Checkmat", gold: 7, silver: 5, bronze: 9, points: 86, totalAthletes: 74 },
                { name: "Atos Jiu-Jitsu", gold: 4, silver: 6, bronze: 4, points: 58, totalAthletes: 42 },
                { name: "GFTeam", gold: 3, silver: 4, bronze: 8, points: 47, totalAthletes: 31 },
                { name: "Nova União", gold: 2, silver: 3, bronze: 5, points: 34, totalAthletes: 13 }
            ],
            mats: [
                { 
                    id: "mat-1", 
                    name: "Tatame 1", 
                    status: "Em Combate", 
                    fight: { 
                        athlete1: { name: "Carlos Silva", points: 0, adv: 0, pen: 0, team: "Alliance Jiu-Jitsu" },
                        athlete2: { name: "Pedro Oliveira", points: 0, adv: 0, pen: 0, team: "Gracie Barra" },
                        category: "Adulto / Preta / Pena"
                    },
                    referee: "Marcos Barbosa"
                },
                { 
                    id: "mat-2", 
                    name: "Tatame 2", 
                    status: "Aguardando", 
                    fight: { 
                        athlete1: { name: "Lucas Gomes", points: 0, adv: 0, pen: 0, team: "Alliance" },
                        athlete2: { name: "Ricardo Santos", points: 0, adv: 0, pen: 0, team: "Nova União" },
                        category: "Adulto / Roxa / Médio"
                    },
                    referee: "Ana Castro"
                },
                { 
                    id: "mat-3", 
                    name: "Tatame 3", 
                    status: "Pausa", 
                    fight: null,
                    referee: "Luiz Henrique"
                }
            ],
            referees: [
                { id: 1, name: "Marcos Barbosa", level: "Internacional A", mat: "Tatame 1", status: "Em Combate" },
                { id: 2, name: "Ana Castro", level: "Internacional A", mat: "Tatame 2", status: "Aguardando" },
                { id: 3, name: "Luiz Henrique", level: "Nacional B", mat: "Tatame 3", status: "Intervalo" },
                { id: 4, name: "Juliana Mendes", level: "Estadual C", mat: "Reserva", status: "Pronto" }
            ],
            activePlacar: {
                selectedMatId: "mat-1",
                athlete1: { points: 0, adv: 0, pen: 0 },
                athlete2: { points: 0, adv: 0, pen: 0 }
            }
        };

        // --- STREAMING_CHUNK:Defining navigation and view-switching logic... ---
        // --- NAVIGATION ENGINE ---
        function switchView(viewId) {
            // Hide all sections
            const views = ['dashboard', 'atletas', 'equipes', 'chaves', 'areas', 'arbitros', 'placar', 'resultados'];
            views.forEach(v => {
                const element = document.getElementById(`view-${v}`);
                if (element) element.classList.add('hidden');
                
                const navBtn = document.getElementById(`nav-${v}`);
                if (navBtn) navBtn.classList.remove('active-tab');
            });

            // Show active section
            const targetView = document.getElementById(`view-${viewId}`);
            if (targetView) targetView.classList.remove('hidden');

            const targetNav = document.getElementById(`nav-${viewId}`);
            if (targetNav) targetNav.classList.add('active-tab');

            // Set Breadcrumb / Header Title
            const titles = {
                dashboard: "Administração do Torneio",
                atletas: "Cadastro e Gerenciamento de Atletas",
                equipes: "Resumo de Equipes / Academias",
                chaves: "Geração de Chaves por Categoria",
                areas: "Gerenciamento de Áreas de Competição",
                arbitros: "Cadastro e Escala de Árbitros",
                placar: "Acompanhamento de Lutas e Placar",
                resultados: "Classificação Geral e Medalhistas"
            };
            document.getElementById('page-title').innerText = titles[viewId] || "Administração";

            // If entering scoreboard, synchronize it with active mat
            if (viewId === 'placar') {
                loadPlacarMatch();
            }

            // Close mobile menu
            document.getElementById('sidebar-menu').classList.add('hidden');
            document.getElementById('sidebar-menu').classList.add('lg:flex');
        }

        // --- MOBILE MENU ---
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            const menu = document.getElementById('sidebar-menu');
            menu.classList.toggle('hidden');
        });

        // --- TOAST NOTIFICATIONS ---
        function showToast(message, type = "success") {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold shadow-md transition-all duration-300 transform translate-y-2 opacity-0`;
            
            if (type === "success") {
                toast.className += " bg-emerald-50 border-emerald-500 text-emerald-900";
                toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600"></i> <span>${message}</span>`;
            } else if (type === "error") {
                toast.className += " bg-rose-50 border-rose-400 text-rose-900";
                toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-600"></i> <span>${message}</span>`;
            } else {
                toast.className += " bg-[#e9f2f9] border-[#9cc4e4] text-[#1b325f]";
                toast.innerHTML = `<i class="fa-solid fa-info-circle text-[#3a89c9]"></i> <span>${message}</span>`;
            }

            container.appendChild(toast);
            
            // Fade-in trigger
            setTimeout(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            }, 50);

            // Fade-out trigger
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-[-10px]');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }

        // --- MODAL ENGINE ---
        function openModal(modalId) {
            document.getElementById(modalId).classList.remove('hidden');
        }
        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }

        // --- STREAMING_CHUNK:Implementing athletes management and search filters... ---
        // --- ATLETAS GESTÃO ---
        function filterAthletes() {
            const query = document.getElementById('athlete-search').value.toLowerCase();
            const belt = document.getElementById('filter-belt').value;
            const status = document.getElementById('filter-status').value;

            const filtered = state.athletes.filter(ath => {
                const matchesSearch = ath.name.toLowerCase().includes(query) || ath.team.toLowerCase().includes(query);
                const matchesBelt = (belt === "todos") || (ath.belt === belt);
                const matchesStatus = (status === "todos") || (status === "Confirmado" && ath.weighed) || (status === "Pendente" && !ath.weighed);
                return matchesSearch && matchesBelt && matchesStatus;
            });

            renderAthletes(filtered);
        }

        function renderAthletes(athleteList = state.athletes) {
            const tbody = document.getElementById('athlete-table-body');
            tbody.innerHTML = '';

            athleteList.forEach(ath => {
                // Belt color helper in light mode
                const beltColors = {
                    Preta: "bg-black border border-slate-700 text-white",
                    Marrom: "bg-amber-800 text-amber-50",
                    Roxa: "bg-purple-800 text-purple-50",
                    Azul: "bg-blue-800 text-blue-50",
                    Branca: "bg-slate-100 border border-[#9cc4e4] text-[#1b325f]"
                };

                const weightStatusHtml = ath.weighed 
                    ? `<span class="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"><i class="fa-solid fa-weight-scale"></i> Verificado</span>`
                    : `<span class="inline-flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20"><i class="fa-solid fa-hourglass-half animate-pulse"></i> Pendente</span>`;

                const tr = document.createElement('tr');
                tr.className = "hover:bg-[#e9f2f9]/30 transition-colors";
                tr.innerHTML = `
                    <td class="p-4">
                        <div class="font-bold text-[#1b325f]">${ath.name}</div>
                        <span class="text-xs text-[#1b325f]/60 font-medium">Reg: #100${ath.id}</span>
                    </td>
                    <td class="p-4">
                        <span class="px-3 py-1 rounded text-xs font-bold ${beltColors[ath.belt]}">
                            Faixa ${ath.belt}
                        </span>
                    </td>
                    <td class="p-4 font-semibold text-[#1b325f]/80">${ath.weight}</td>
                    <td class="p-4 font-semibold text-[#1b325f]/70">${ath.team}</td>
                    <td class="p-4 text-center">${weightStatusHtml}</td>
                    <td class="p-4 text-right">
                        <div class="inline-flex gap-1.5">
                            <button onclick="toggleWeighed(${ath.id})" class="text-xs bg-[#e9f2f9] hover:bg-[#9cc4e4]/30 text-[#1b325f] py-1.5 px-3 rounded-lg border border-[#9cc4e4] font-bold">
                                Alternar Balança
                            </button>
                            <button onclick="deleteAthlete(${ath.id})" class="text-[#f26c4f] hover:text-white p-2 rounded-lg hover:bg-[#f26c4f]/20 transition">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Update header state
            document.getElementById('header-athlete-count').innerText = state.athletes.length;
        }

        function toggleWeighed(athleteId) {
            const ath = state.athletes.find(a => a.id === athleteId);
            if (ath) {
                ath.weighed = !ath.weighed;
                showToast(`Status da balança de "${ath.name}" alterado!`, "info");
                filterAthletes();
                buildRefereesAndMats();
            }
        }

        function deleteAthlete(athleteId) {
            const index = state.athletes.findIndex(a => a.id === athleteId);
            if (index > -1) {
                const name = state.athletes[index].name;
                state.athletes.splice(index, 1);
                showToast(`Atleta "${name}" removido com sucesso.`, "error");
                filterAthletes();
            }
        }

        function handleNewAthlete(event) {
            event.preventDefault();
            const name = document.getElementById('new-ath-name').value;
            const belt = document.getElementById('new-ath-belt').value;
            const weight = document.getElementById('new-ath-weight').value;
            const team = document.getElementById('new-ath-team').value;

            const newAthlete = {
                id: Date.now(),
                name,
                belt,
                weight,
                team,
                weighed: false
            };

            state.athletes.unshift(newAthlete);
            showToast(`Atleta "${name}" inscrito com sucesso! Aguarde pesagem.`, "success");
            closeModal('modal-add-atleta');
            document.getElementById('add-atleta-form').reset();
            filterAthletes();
        }

        // --- EQUIPES GESTÃO ---
        function renderTeams() {
            const list = document.getElementById('teams-list');
            list.innerHTML = '';

            state.teams.forEach((team, index) => {
                const div = document.createElement('div');
                div.className = "p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#e9f2f9]/30 transition duration-150 text-[#1b325f]";
                div.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-8 h-8 rounded-full bg-[#e9f2f9] text-[#1b325f] font-black flex items-center justify-center text-sm border border-[#9cc4e4]">
                            ${index + 1}
                        </div>
                        <div>
                            <h5 class="font-bold text-base">${team.name}</h5>
                            <span class="text-xs text-[#1b325f]/60 font-semibold">${team.totalAthletes} Competidores cadastrados</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="flex items-center gap-4">
                            <span class="flex items-center gap-1.5 text-yellow-500 font-black text-sm"><i class="fa-solid fa-medal"></i> ${team.gold}</span>
                            <span class="flex items-center gap-1.5 text-slate-400 font-black text-sm"><i class="fa-solid fa-medal"></i> ${team.silver}</span>
                            <span class="flex items-center gap-1.5 text-amber-700 font-black text-sm"><i class="fa-solid fa-medal"></i> ${team.bronze}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] text-[#1b325f]/50 font-bold block">PONTOS</span>
                            <span class="font-black text-[#1b325f] text-base">${team.points} pts</span>
                        </div>
                    </div>
                `;
                list.appendChild(div);
            });
        }

        // --- CHAVES / BRACKETS ---
        function regenerateBrackets() {
            const selectCategory = document.getElementById('bracket-category-select').value;
            showToast(`Chave gerada para "${selectCategory.toUpperCase()}" de forma justa!`, "success");
            
            if (selectCategory === "adulto-pena") {
                document.getElementById('fighter-semifinal-1a').innerText = "Carlos Silva";
                document.getElementById('fighter-semifinal-1b').innerText = "Pedro Oliveira";
                document.getElementById('fighter-semifinal-2a').innerText = "Marcus Vinicius";
                document.getElementById('fighter-semifinal-2b').innerText = "Felipe Diniz";
                document.getElementById('fighter-final-1').innerText = "Carlos Silva";
                document.getElementById('fighter-final-2').innerText = "Aguardando Luta #02";
                document.getElementById('champion-name').innerText = "A Definir";
                document.getElementById('champion-team').innerText = "-";
            } else {
                document.getElementById('fighter-semifinal-1a').innerText = "Lucas Gomes";
                document.getElementById('fighter-semifinal-1b').innerText = "Ricardo Santos";
                document.getElementById('fighter-semifinal-2a').innerText = "Gustavo Albuquerque";
                document.getElementById('fighter-semifinal-2b').innerText = "Rodrigo Melo";
                document.getElementById('fighter-final-1').innerText = "Lucas Gomes";
                document.getElementById('fighter-final-2').innerText = "Aguardando Luta #02";
                document.getElementById('champion-name').innerText = "A Definir";
                document.getElementById('champion-team').innerText = "-";
            }
        }

        // --- ARBITROS & TATAMES ---
        function buildRefereesAndMats() {
            // Render Mats/Areas
            const gridMats = document.getElementById('mats-grid');
            gridMats.innerHTML = '';

            state.mats.forEach(mat => {
                let statusColor = "bg-[#e9f2f9] text-[#1b325f]/60 border-[#9cc4e4]";
                if (mat.status === "Em Combate") statusColor = "bg-[#f26c4f]/10 text-[#f26c4f] border-[#f26c4f]/20";
                if (mat.status === "Aguardando") statusColor = "bg-[#3a89c9]/10 text-[#3a89c9] border-[#3a89c9]/20";
                if (mat.status === "Pausa") statusColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";

                const fightInfoHtml = mat.fight 
                    ? `
                        <div class="space-y-2 mt-4 text-[#1b325f]">
                            <span class="text-[10px] text-[#1b325f]/50 font-bold uppercase block">LUTA ATUAL</span>
                            <div class="flex items-center justify-between text-sm">
                                <span class="font-extrabold truncate">${mat.fight.athlete1.name}</span>
                                <span class="text-xs font-bold text-[#3a89c9] bg-[#3a89c9]/10 px-1.5 rounded">AZUL</span>
                            </div>
                            <div class="flex items-center justify-between text-sm">
                                <span class="font-extrabold truncate">${mat.fight.athlete2.name}</span>
                                <span class="text-xs font-bold text-[#f26c4f] bg-[#f26c4f]/10 px-1.5 rounded">CORAL</span>
                            </div>
                            <span class="text-[10px] font-semibold text-[#1b325f]/60 block pt-1.5">${mat.fight.category}</span>
                        </div>
                    `
                    : `
                        <div class="py-6 text-center text-[#1b325f]/40 border border-dashed border-[#9cc4e4] rounded-xl mt-4">
                            <i class="fa-solid fa-ban text-lg block mb-1"></i>
                            <span class="text-xs font-bold">Nenhum combate alocado</span>
                        </div>
                    `;

                const card = document.createElement('div');
                card.className = "bg-white border border-[#9cc4e4]/60 p-6 rounded-2xl flex flex-col justify-between shadow-sm text-[#1b325f]";
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-center pb-4 border-b border-[#9cc4e4]/30">
                            <div>
                                <h4 class="font-black text-lg">${mat.name}</h4>
                                <span class="text-xs text-[#1b325f]/60 font-medium">Árbitro: ${mat.referee || "Nenhum"}</span>
                            </div>
                            <span class="px-2.5 py-1 text-xs font-bold rounded-lg border ${statusColor}">
                                ${mat.status}
                            </span>
                        </div>
                        ${fightInfoHtml}
                    </div>
                    <div class="pt-6 mt-4 border-t border-[#9cc4e4]/30 flex gap-2">
                        <button onclick="switchView('placar'); selectPlacarMat('${mat.id}');" class="flex-1 bg-[#e9f2f9] hover:bg-[#3a89c9] hover:text-white text-[#1b325f] font-bold py-2 rounded-xl text-xs text-center transition border border-[#9cc4e4]">
                            <i class="fa-solid fa-stopwatch mr-1"></i> Abrir Placar
                        </button>
                    </div>
                `;
                gridMats.appendChild(card);
            });

            // Render Referees Grid
            const gridRefs = document.getElementById('arbitros-grid');
            gridRefs.innerHTML = '';

            state.referees.forEach(ref => {
                let badgeColor = "bg-[#e9f2f9] text-[#1b325f]/60 border-[#9cc4e4]";
                if (ref.status === "Em Combate") badgeColor = "bg-[#f26c4f]/15 text-[#f26c4f]";
                if (ref.status === "Pronto" || ref.status === "Aguardando") badgeColor = "bg-emerald-500/15 text-emerald-600";
                if (ref.status === "Intervalo") badgeColor = "bg-amber-500/15 text-amber-600";

                const card = document.createElement('div');
                card.className = "bg-white border border-[#9cc4e4]/60 p-5 rounded-2xl flex flex-col justify-between shadow-sm text-[#1b325f]";
                card.innerHTML = `
                    <div class="space-y-3">
                        <div class="flex justify-between items-start">
                            <div class="w-10 h-10 rounded-full bg-[#e9f2f9] text-[#1b325f] flex items-center justify-center font-black border border-[#9cc4e4]">
                                ${ref.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${badgeColor}">
                                ${ref.status}
                            </span>
                        </div>
                        <div>
                            <h5 class="font-bold text-sm leading-tight">${ref.name}</h5>
                            <span class="text-[11px] text-[#1b325f]/60 font-semibold">Nível: ${ref.level}</span>
                        </div>
                    </div>
                    <div class="pt-4 border-t border-[#9cc4e4]/30 mt-4 flex justify-between items-center text-xs">
                        <span class="text-[#1b325f]/50 font-semibold">Escalado em:</span>
                        <span class="font-black text-[#1b325f]">${ref.mat || "Não Alocado"}</span>
                    </div>
                `;
                gridRefs.appendChild(card);
            });
        }

        function handleNewRef(event) {
            event.preventDefault();
            const name = document.getElementById('new-ref-name').value;
            const level = document.getElementById('new-ref-level').value;
            const mat = document.getElementById('new-ref-mat').value;

            const newRef = {
                id: Date.now(),
                name,
                level,
                mat: mat === "Reserva" ? null : mat,
                status: "Pronto"
            };

            state.referees.unshift(newRef);
            
            if (mat !== "Reserva") {
                const targetMat = state.mats.find(m => m.name === mat);
                if (targetMat) {
                    targetMat.referee = name;
                }
            }

            showToast(`Árbitro "${name}" integrado à escala do evento!`, "success");
            closeModal('modal-add-arbitro');
            document.getElementById('add-arbitro-form').reset();
            buildRefereesAndMats();
        }

        // --- STREAMING_CHUNK:Programming the live scoreboard timer and controls... ---
        // --- SCOREBOARD TIMER AND POINTS ---
        let timerInterval = null;
        let timeRemaining = 300; // 5 minutes

        function selectPlacarMat(matId) {
            document.getElementById('placar-select-mat').value = matId;
            loadPlacarMatch();
        }

        function loadPlacarMatch() {
            const matId = document.getElementById('placar-select-mat').value;
            const mat = state.mats.find(m => m.id === matId);
            
            if (mat && mat.fight) {
                document.getElementById('placar-fight-title').innerText = `${mat.fight.athlete1.name.toUpperCase()} VS ${mat.fight.athlete2.name.toUpperCase()}`;
                document.getElementById('placar-mat-name').innerText = mat.name;
                
                document.getElementById('placar-athlete1-name').innerText = mat.fight.athlete1.name;
                document.getElementById('placar-athlete1-team').innerText = mat.fight.athlete1.team;
                
                document.getElementById('placar-athlete2-name').innerText = mat.fight.athlete2.name;
                document.getElementById('placar-athlete2-team').innerText = mat.fight.athlete2.team;

                state.activePlacar.athlete1 = mat.fight.athlete1;
                state.activePlacar.athlete2 = mat.fight.athlete2;

                updateScoreboardDisplay();
            } else {
                document.getElementById('placar-fight-title').innerText = "NENHUMA LUTA ATIVA";
                document.getElementById('placar-athlete1-name').innerText = "Aguardando";
                document.getElementById('placar-athlete2-name').innerText = "Aguardando";
            }
            resetTimer();
        }

        function changeStat(fighterIndex, stat, val) {
            const fighter = fighterIndex === 1 ? state.activePlacar.athlete1 : state.activePlacar.athlete2;
            if (!fighter) return;

            if (stat === 'points') {
                fighter.points = Math.max(0, fighter.points + val);
            } else if (stat === 'adv') {
                fighter.adv = Math.max(0, fighter.adv + val);
            } else if (stat === 'pen') {
                fighter.pen = Math.max(0, fighter.pen + val);
            }

            updateScoreboardDisplay();
        }

        function updateScoreboardDisplay() {
            // Left (Fighter 1)
            document.getElementById('placar-points-1').innerText = String(state.activePlacar.athlete1.points).padStart(2, '0');
            document.getElementById('placar-adv-1').innerText = state.activePlacar.athlete1.adv;
            document.getElementById('placar-pen-1').innerText = state.activePlacar.athlete1.pen;

            // Right (Fighter 2)
            document.getElementById('placar-points-2').innerText = String(state.activePlacar.athlete2.points).padStart(2, '0');
            document.getElementById('placar-adv-2').innerText = state.activePlacar.athlete2.adv;
            document.getElementById('placar-pen-2').innerText = state.activePlacar.athlete2.pen;
        }

        function toggleTimer() {
            const btn = document.getElementById('timer-toggle-btn');
            if (timerInterval) {
                // Pause
                clearInterval(timerInterval);
                timerInterval = null;
                btn.innerHTML = `<i class="fa-solid fa-play text-xs"></i> <span>Retomar</span>`;
                btn.className = btn.className.replace('bg-amber-600', 'bg-[#3a89c9]').replace('hover:bg-amber-500', 'hover:bg-[#1b325f]');
            } else {
                // Play
                timerInterval = setInterval(() => {
                    if (timeRemaining > 0) {
                        timeRemaining--;
                        updateTimerDisplay();
                    } else {
                        clearInterval(timerInterval);
                        timerInterval = null;
                        showToast("Tempo de combate encerrado!", "info");
                        soundEndAlert();
                    }
                }, 1000);
                btn.innerHTML = `<i class="fa-solid fa-pause text-xs"></i> <span>Pausar</span>`;
                btn.className = "flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-sm";
            }
        }

        function resetTimer() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            timeRemaining = 300;
            updateTimerDisplay();
            const btn = document.getElementById('timer-toggle-btn');
            btn.innerHTML = `<i class="fa-solid fa-play text-xs"></i> <span>Iniciar</span>`;
            btn.className = "flex-1 bg-[#3a89c9] hover:bg-[#1b325f] text-white font-bold py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-sm";
        }

        function setTimerLength(minutes) {
            timeRemaining = minutes * 60;
            updateTimerDisplay();
        }

        function updateTimerDisplay() {
            const mins = Math.floor(timeRemaining / 60);
            const secs = timeRemaining % 60;
            document.getElementById('timer-display').innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        function declareWinner(fighterIndex) {
            const matId = document.getElementById('placar-select-mat').value;
            const mat = state.mats.find(m => m.id === matId);
            
            if (mat && mat.fight) {
                const winnerName = fighterIndex === 1 ? mat.fight.athlete1.name : mat.fight.athlete2.name;
                const winnerTeam = fighterIndex === 1 ? mat.fight.athlete1.team : mat.fight.athlete2.team;
                
                showToast(`Combate finalizado! Vencedor: ${winnerName} (${winnerTeam})`, "success");
                
                if (matId === "mat-1") {
                    document.getElementById('champion-name').innerText = winnerName;
                    document.getElementById('champion-team').innerText = winnerTeam;
                    document.getElementById('fighter-final-1').innerText = winnerName;
                }
            } else {
                showToast("Nenhum atleta ativo no placar para declarar vitória.", "error");
            }
        }

        function soundEndAlert() {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                oscillator.connect(audioCtx.destination);
                oscillator.start();
                setTimeout(() => oscillator.stop(), 1000);
            } catch (e) {
                console.log("Audio alert blocked by browser autoplay rules");
            }
        }

        // --- CORE BOOTSTRAPPER ---
        window.onload = function() {
            renderAthletes();
            renderTeams();
            buildRefereesAndMats();
        }
    </script>
</body>
</html>
---

# Guia de Spec para Implementação de Features

> Este documento define o padrão de especificação que deve ser seguido antes de implementar qualquer feature. Ao iniciar uma tarefa, analise este guia e aplique cada seção ao contexto da feature solicitada. Sempre siga a regra do SOLID.

---

## Como usar este guia

Antes de escrever qualquer linha de código, leia este documento inteiro e produza uma spec completa seguindo todas as seções abaixo. Só inicie a implementação após a spec estar escrita e validada.

> ⚠️ Se houver itens em **Problemas Encontrados** com status `[aberto]`, trate-os ANTES de qualquer nova implementação. Após corrigir, mova o item para **Histórico de Correções** e atualize os RF, CA e Passos afetados.

---

## 1. Contexto e Objetivo

- **O que é:** descrição funcional em uma ou duas frases
- **Por que existe:** problema de negócio ou necessidade do usuário
- **Quem usa:** perfil do usuário ou sistema que vai interagir com ela
- **Escopo:** o que está dentro e o que está fora desta entrega

---

## 2. Analise os Documentos de Referência

- **Guia de spec** (este documento): confirme que todas as seções serão preenchidas
- **Documento de requisitos** requisitos.md
- **Documentação técnica existente** `spec/{nome-da-feature}.md`: identifique padrões e convenções já estabelecidos
- **Código-fonte relevante**: leia os arquivos relacionados antes de propor qualquer mudança

> ⚠️ Nunca assuma o comportamento de um arquivo sem tê-lo lido. Sinalize explicitamente quando uma informação é uma inferência e não uma certeza.

---

## 3. Historia de Usuario

```
Como [tipo de usuário],
quero [ação ou capacidade],
para que [benefício ou objetivo].
```

Inclua também os cenários alternativos relevantes (ex: usuário sem permissão, dado inválido, estado vazio).

---

## 4. Requisitos Funcionais

Liste o comportamento esperado de forma objetiva e verificável. Cada item deve ser testável.

- [ ] RF-01: descrição do comportamento esperado
- [ ] RF-02: ...

Use linguagem de comportamento observável: "o sistema exibe", "o endpoint retorna", "o componente emite". Evite linguagem de implementação: "o método chama", "a variável recebe".

---

## 5. Requisitos Nao-Funcionais

- **Performance:** tempo de resposta esperado, limites de payload, paginação
- **Segurança:** autenticação, autorização, validação de entrada
- **Acessibilidade:** padrões de UI relevantes
- **Compatibilidade:** versões de browser, SO, plataforma
- **Observabilidade:** logs esperados, métricas, rastreamento de erros

---

## 6. Analise da Aplicação

- **Arquitetura geral:** camadas envolvidas (frontend, backend, banco, integrações)
- **Padrões em uso:** naming conventions, estrutura de pastas, padrões de componentes ou repositórios
- **Fluxo de dados:** de onde os dados vêm, como trafegam, onde são persistidos
- **Contratos de API:** endpoints existentes, formato de request/response, status codes

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/MeuComponente.vue` | Modificar | Adicionar nova prop e emissão de evento |
| `src/services/MeuService.ts` | Criar | Encapsular chamada ao novo endpoint |
| `Controllers/MeuController.cs` | Modificar | Adicionar novo endpoint POST |
| `Repositories/MeuRepositorio.cs` | Modificar | Adicionar query para novo filtro |
| `migrations/2025_xx_xx_descricao.sql` | Criar | Adicionar nova coluna na tabela |

> ⚠️ Se não tiver certeza sobre um arquivo, sinalize como "a confirmar" em vez de assumir.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos

- Dependências circulares ou acoplamento forte
- Ausência de abstração necessária
- Comportamento legado que pode quebrar com a mudança
- Inconsistência entre o contrato da API e o uso atual no frontend

### 8.2 Ambiguidades nos Requisitos

- Requisitos que precisam de decisão antes da implementação
- Comportamentos não especificados
- Conflito entre comportamentos esperados

### 8.3 Riscos

- Mudanças com potencial de regressão em outros módulos
- Operações que afetam dados em produção
- Dependência de terceiros ou serviços externos

> ⚠️ Sinalize impedimentos bloqueantes explicitamente antes de iniciar qualquer código.

---

## 9. Criterios de Aceite

- [ ] CA-01: dado [contexto], quando [ação], então [resultado esperado]
- [ ] CA-02: dado [contexto], quando [ação], então [resultado esperado]
- [ ] CA-03: caso de erro — dado [contexto inválido], quando [ação], então [mensagem/status esperado]

---

## 10. Plano de Implementacao (Passo a Passo)

Ordene da base para o topo: banco → backend → frontend.

```
Passo 1: [descrição clara da ação]
  - O que fazer: ...
  - Arquivo(s): ...
  - Como validar: ...

Passo 2: [descrição clara da ação]
  - O que fazer: ...
  - Arquivo(s): ...
  - Como validar: ...
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** feature flag, deploy direto, migração gradual
- **Como monitorar:** logs, alertas, métricas que indicam que a feature está funcionando
- **Plano de rollback:** o que fazer se algo der errado após o deploy

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite foram verificados
- [ ] Código revisado (PR aprovado ou auto-revisão documentada)
- [ ] Documentação atualizada (wiki, task, comentários no código se necessário)
- [ ] Sem warnings ou erros não tratados introduzidos
- [ ] Migração de banco aplicada (se aplicável)
- [ ] Seção **Histórico de Correções** atualizada com todas as correções feitas neste ciclo

---

## Checklist Rapido Antes de Comecar a Codar

- [ ] Li os itens em **Problemas Encontrados** e os tratei antes de qualquer código novo
- [ ] Li os documentos de referência
- [ ] Entendi a historia de usuario e o objetivo de negócio
- [ ] Identifiquei todos os arquivos envolvidos e os li
- [ ] Listei os problemas e impedimentos
- [ ] O plano de implementação está em ordem lógica (base → topo)
- [ ] Os critérios de aceite são verificáveis
- [ ] Sinalizei todas as incertezas explicitamente

> ⚠️ Se qualquer item do checklist estiver pendente, resolva antes de escrever código.

---

## Instrucoes para a IA

**Ao iniciar qualquer tarefa com este documento:**

1. Leia a seção **Problemas Encontrados**. Se houver itens `[aberto]`, trate-os PRIMEIRO antes de qualquer nova feature.
2. Para cada item `[aberto]` resolvido: mova-o para **Histórico de Correções** com o formato estabelecido e atualize os RF, CA e Passos afetados.
3. Crie o arquivo `spec/{nome-da-feature}.md` seguindo todas as seções deste guia antes de escrever qualquer código.
4. Após criar o `.md`, revise-o para verificar coerência. Só então implemente.
5. Ao finalizar qualquer ciclo (feature nova ou correção), registre no **Histórico de Correções** em spec.md NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `spec/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto