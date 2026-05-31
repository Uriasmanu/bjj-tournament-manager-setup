# BJJ Tournament Manager

## 1. Visão Geral

O **BJJ Tournament Manager** é um software desktop desenvolvido para gerenciamento completo de campeonatos de Jiu-Jitsu.

O sistema será responsável por controlar todas as etapas do evento, desde o cadastro dos participantes até a definição dos campeões de cada categoria, incluindo gerenciamento de chaves, acompanhamento de lutas em tempo real, placares, árbitros, áreas de luta e resultados.

O objetivo é fornecer uma solução centralizada para organizadores, árbitros e equipes, reduzindo erros operacionais e agilizando a condução dos campeonatos.

---

# 2. Objetivos do Sistema

O sistema deverá permitir:

* Cadastro de atletas.
* Cadastro de equipes.
* Cadastro de campeonatos.
* Cadastro de categorias.
* Controle de inscrições.
* Controle de pesagem.
* Geração automática de chaves.
* Gerenciamento de áreas de luta.
* Gerenciamento de árbitros.
* Controle de chamadas para as lutas.
* Controle de placares.
* Registro de resultados.
* Definição automática dos vencedores das chaves.
* Exibição de rankings e medalhistas.
* Emissão de relatórios.
* Exportação e importação de dados.
* Operação totalmente offline.

---

# 3. Plataforma

A aplicação será desenvolvida para:

* Windows 10
* Windows 11

O sistema será distribuído como software desktop utilizando Electron.

---

# 4. Stack Tecnológica

## Desktop

* Electron

## Interface

* React
* TypeScript

## Componentes Visuais

* Mantine UI
* Tabler Icons

---

# 5. Persistência de Dados

O sistema utilizará exclusivamente arquivos JSON para armazenamento local.

Não haverá dependência de banco de dados externo.

Toda a operação deverá funcionar offline.

# 6. Identidade Visual

## 6.1 Tema Principal

A identidade visual do sistema será inspirada em aplicações administrativas modernas, utilizando cores que transmitam organização, confiança e profissionalismo.

### 6.1.1 Cor Principal — Azul Royal

Utilizada em:

- Botões primários.
- Barra superior.
- Menus ativos.
- Indicadores principais.
- Elementos de destaque.

### 6.1.2 Fundo Principal — Branco

Utilizado como cor predominante da interface.

### 6.1.3 Cor dos Textos — Preto

Utilizado para garantir máxima legibilidade.

### 6.1.4 Paleta Secundária

**Preto** — Utilizado para:
- Títulos.
- Ícones.
- Elementos de contraste.

**Amarelo Royal** — Utilizado para:
- Alertas.
- Avisos.
- Destaques temporários.
- Indicadores de atenção.

**Azul** — Utilizado para:
- Informações.
- Links.
- Elementos auxiliares.

**Verde** — Utilizado para:
- Confirmações.
- Resultados positivos.
- Status concluídos.
- Aprovações.

---

# 7. Requisitos Não Funcionais

O sistema deverá:

- Funcionar sem conexão com a internet.
- Possuir carregamento rápido.
- Ser capaz de armazenar milhares de atletas.
- Permitir backup manual dos arquivos JSON.
- Possuir interface responsiva para diferentes resoluções.
- Ser simples de instalar.
- Possuir estrutura de código organizada e escalável.
- Utilizar TypeScript em todo o projeto.
- Seguir os princípios **SOLID** em toda a arquitetura do código.
- Seguir as **boas práticas de programação** (código limpo, legível, testável e de fácil manutenção).