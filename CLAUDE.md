# CLAUDE.md

Este arquivo fornece orientação ao Claude Code ao trabalhar com código neste repositório.

## Visão Geral do Projeto

**Educação Financeira** é um site estático de curadoria pessoal de estudos sobre educação financeira. Organiza conteúdo do básico ao avançado por tema, com notas de estudo e ferramentas interativas simples em JavaScript puro.

### O que é
- Uma curadoria pessoal dos estudos em educação financeira do autor
- Começou com o curso "Organização Financeira" (Nathalia Arcuri), mas cresce com outras fontes
- Base de conhecimento em construção

### O que NÃO é
- Um curso formal (não há quizzes, certificados ou cronograma)
- Um app de controle financeiro robusto (não gerencia contas bancárias)
- Um sistema complicado (HTML/CSS/JS puro, nenhuma dependência)

## Stack & Ambiente

- **Linguagens**: HTML, CSS, JavaScript vanilla (puro)
- **Build**: Nenhum — HTML/CSS/JS direto, sem bundler, webpack, ou framework
- **Publicação**: GitHub Pages (branch principal, raiz `/`)
- **Editor**: WebStorm (ideal para HTML/CSS/JS)
- **Nenhuma dependência externa** — tudo é self-contained (fontes do sistema, sem CDN)

## Estrutura de Pastas

```
/
├── index.html                          # Homepage com 3 seções: Aprender, Metas, Máximas
├── maximas.html                        # Página de Grandes Máximas (princípios fundamentais)
├── metas.html                          # Gerenciador de Metas (localStorage)
├── README.md
├── CLAUDE.md                           # Este arquivo
├── assets/
│   ├── css/
│   │   └── style.css                   # CSS único, compartilhado por todas as páginas
│   └── js/
│       ├── main.js                     # Reservado para interações globais
│       ├── calculadora-juros-compostos.js
│       └── metas.js                    # Gerenciar metas com localStorage
├── temas/
│   ├── index.html                      # Índice de todos os temas
│   ├── orcamento-pessoal/
│   │   ├── index.html                  # Índice do tema
│   │   ├── o-que-e-orcamento-pessoal.html
│   │   └── metodo-50-30-20.html
│   ├── reserva-de-emergencia/
│   │   ├── index.html
│   │   └── o-que-e-reserva-de-emergencia.html
│   └── juros-e-investimentos/
│       ├── index.html
│       └── juros-compostos-na-pratica.html
└── ferramentas/
    └── calculadora-juros-compostos.html
```

## Organização da Navegação

- **Homepage** (`index.html`): 3 cards principais
  - 📚 Aprender → leva a `temas/index.html`
  - 🎯 Minhas Metas → leva a `metas.html`
  - 💡 Grandes Máximas → leva a `maximas.html`
- **Header simplificado**: logo + link "Explorar" (que vai para temas)
- **Evitar**: tudo em um lugar só (monolítico). Cada seção tem seu próprio espaço.
- **Footers**: todas as páginas mostram o footer padrão

A estrutura NOT é uma SPA — são páginas HTML reais linkadas entre si, sem framework.

**Convenção de caminhos**: páginas em `temas/<tema>/` usam `../../assets/...`; páginas em `ferramentas/` usam `../assets/...`. Ser disciplinado com caminhos relativos é crucial sem build tool.

## Adicionando Novo Conteúdo

### Novo artigo em um tema existente

1. Criar `.html` na pasta do tema (ex: `temas/orcamento-pessoal/novo-artigo.html`)
2. Copiar o template de nota de estudo de um artigo existente
3. Preencher: título, nível (badge), fonte de origem (se aplicável), conteúdo, próximos passos
4. Adicionar link no `temas/<tema>/index.html` (dentro da `<ul class="lista-artigos">`, sob o nível apropriado)

### Novo tema

1. Criar `temas/<novo-slug>/index.html` (copiar estrutura de um tema existente)
2. Criar o primeiro artigo do tema
3. Adicionar entrada no `temas/index.html` (dentro da `<div class="indice-temas">`)
4. Atualizar `index.html` (home) se o tema for muito importante

### Nova ferramenta

1. Criar `ferramentas/nova-ferramenta.html`
2. Criar `assets/js/nova-ferramenta.js` se necessário
3. Linkar a partir de artigos relevantes (ex: calculadora linkada em "Juros Compostos na Prática")

## Estrutura de Conceitos (Didática)

Cada página de conteúdo deve seguir esta estrutura pedagógica:

1. **Conceito** (definição simples, 1-2 parágrafos)
   - O que é? Explicado de forma simples, sem jargão.
   
2. **Exemplo Prático** (o mais concreto e simples possível)
   - Personagem real + números reais
   - Tabela ou simulação
   - Resultado final claro
   
3. **Por quê?** (importância)
   - Razão de ser daquele conhecimento
   
4. **Grande Máxima** (se aplicável)
   - Uma verdade universal e memorável
   - Destacada visualmente com `.maxima`
   
5. **Aplicação Prática** (como fazer)
   - Passos concretos
   - O que fazer e o que evitar

6. **Resumo em 1 frase** (memorização)
   - Uma sentença que captura a essência

Página dedicada de máximas: `maximas.html` lista todos os princípios fundamentais de educação financeira.

## Padrões de Código

### Template de página de nota de estudo

Toda página de conteúdo começa assim (copiar e preencher):

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título da Página | Educação Financeira</title>
  <link rel="stylesheet" href="../../assets/css/style.css">
</head>
<body>
  <header class="site-header">
    <a href="../../index.html" class="logo">Educação Financeira</a>
    <nav><a href="../index.html">Temas</a></nav>
  </header>

  <main class="conteudo-nota">
    <p class="breadcrumb"><!-- breadcrumb aqui --></p>
    <span class="badge-nivel badge-basico">Básico</span>
    <h1>Título</h1>
    <p class="fonte-origem">Baseado em: ...</p>

    <section class="texto-estudo"><!-- conteúdo aqui --></section>

    <section class="proximos-passos">
      <h2>Próximos passos</h2>
      <ul><!-- links internos guiando a jornada --></ul>
    </section>
  </main>

  <footer class="site-footer">
    <p>Conteúdo curado por estudos pessoais em educação financeira.</p>
  </footer>
</body>
</html>
```

**Campos obrigatórios**: breadcrumb, badge de nível, título, fonte de origem (opcional se compilação de várias fontes), conteúdo, próximos passos.

### CSS

Um único `assets/css/style.css`. Características:
- Variáveis CSS (`:root`) para cores, espaçamento, tipografia
- Mobile-first (começa simples, cresce em `@media (min-width: 640px)`)
- Classes reutilizáveis: `.badge-nivel`, `.card-tema`, `.caixa-ferramenta`, `.formulario-calculadora`, etc.
- Sem dependências externas (fontes do sistema, nenhum CDN)
- Responsivo via flexbox/grid simples

### JavaScript

Preferencialmente vanilla (puro). Nenhuma biblioteca ou framework. Se precisar de funcionalidades mais complexas, considere adicionar em `assets/js/`, mas evite abstrações desnecessárias.

**Exemplo: calculadora de juros compostos** (`assets/js/calculadora-juros-compostos.js`):
- Escuta `submit` do formulário
- Valida inputs
- Calcula mês a mês
- Formata resultado em BRL via `toLocaleString`
- Atualiza DOM com resultado

## Crescimento sem Over-engineering

- **Não introduzir**: template engine, includes via JS/fetch, build step, linters, tests automatizados
- **Estratégia**: copiar template existente + ajustar → adicionar link no índice pai
- **Consistência**: cada novo `.html` começa copiando um existente, não do zero
- **Escalabilidade**: estrutura de pastas naturalmente comporta centenas de artigos

## Como testar localmente

1. Abrir `index.html` diretamente no navegador (funciona com `file://` URLs)
2. Ou usar um servidor estático simples: `python -m http.server 8000` (Python 3) e acessar `http://localhost:8000`
3. Testar navegação entre todos os links
4. Testar responsividade (redimensionar janela ou DevTools mobile)
5. Testar ferramenta interativa (calculadora) com valores de exemplo

## Publicação no GitHub Pages

1. Criar repositório no GitHub
2. `git init` + `git add .` + `git commit -m "..."` + `git push -u origin main`
3. Ir em **Settings → Pages** do repositório
4. Selecionar branch `main`, raiz `/` como source
5. Salvar e acessar o link gerado (ex: `https://seu-usuario.github.io/educacao-financeira`)

## Notas para futuras melhorias

- Conteúdo é prioridade sobre design — texto simples, bem organizado, é suficiente
- Se adicionar novos temas, manter a estrutura de pastas `temas/<slug>/`
- Cada tema deve ter pelo menos um artigo (não deixar vazio)
- Aportes mensais na calculadora simulam investimentos, não economias (há crescimento com taxa)
- Não adicionar contador de visitas, analytics ou tracking sem necessidade

## Página de Envelopes (localStorage)

**Arquivo**: `envelopes.html` + `assets/js/envelopes.js`

Funcionalidades:
- Sistema de "envelope budgeting" — aloca a renda mensal em categorias predefinidas
- 7 envelopes padrão:
  - Essenciais: 55%
  - Educação: 5%
  - Aposentadoria: 10%
  - Metas Nível 1, 2, 3, 4: 5% cada
- Usuário define sua renda mensal
- Sistema aloca automaticamente em cada envelope
- Adiciona despesas/investimentos por envelope
- Visualiza disponível vs gasto em tempo real
- Barras de progresso com alertas (amarelo >80%, vermelho >100%)
- localStorage para persistir dados

**Fluxo**:
1. Usuário define renda mensal
2. Sistema calcula alocação por envelope
3. Usuário adiciona despesas clicando "+ Adicionar"
4. Modal simples com descrição e valor
5. Pode remover despesas individuais ou limpar envelope inteiro

## Página de Metas (localStorage)

**Arquivo**: `metas.html` + `assets/js/metas.js`

Funcionalidades:
- Adicionar meta com: título, descrição, valor alvo, valor atual, prazo (curto/médio/longo), data limite
- Visualizar todas as metas em cards com progresso visual (barra)
- Atualizar valor atual de uma meta (via prompt simples)
- Deletar meta com confirmação
- Tudo salva automaticamente em `localStorage` com chave `metas_financeiras`

**localStorage** (`metas.js`):
- Array de objetos meta: `{ id, titulo, descricao, valorAlvo, valorAtual, prazo, data, dataCriacao }`
- Salva/carrega automaticamente
- Não requer servidor ou banco de dados

**CSS personalizado** (inline em `metas.html`): formulário, cards, botões de ação, responsividade mobile.

## Linguagem e Público

- **Linguagem**: português (Brasil), simples e acessível para leigos
- **Público-alvo**: iniciantes em educação financeira
- **Tom**: educacional, amigável, nunca técnico demais
- **Exemplos**: use valores do dia a dia (salários brasileiros, despesas locais)

## Segurança e Privacidade

- **localStorage**: tudo fica no navegador do usuário. Nenhum dado é enviado para servidor.
- Dados persistem enquanto o cache não for limpo
- Se o usuário limpar dados do navegador, as metas desaparecem (avise o usuário disso na página)
- Não adicionar campos sensíveis (senhas, PINs, tokens)

## 🎨 Design System (Implementado - 2026-08-25)

### Paleta de Cores (Variáveis CSS em `:root`)
- **Primária**: `#4a154b` (roxo profundo) — brand principal
- **Secundária**: `#1264a3` (azul) — links e acentos
- **Neutras**: texto (#1d1d1d), fundo (#ffffff), cinzas para bordas
- **Status**: verde (sucesso), amarelo (aviso), vermelho (erro)

### Padrão de Código para TODAS as páginas

1. **Sem emojis no texto de navegação** — apenas texto simples
2. **Menu hamburger** com `<span>` aninhadas, não emoji ☰
3. **Cores sempre via variáveis** — nunca hardcode colors
4. **Classes reutilizáveis**:
   - `.badge-nivel` (com `.badge-basico`, `.badge-intermediario`, `.badge-avancado`)
   - `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-large`
   - `.maxima` (caixa de insight)
   - `.caixa-ferramenta` (caixa interativa)
   - `.table-highlight-primary`, `.table-highlight-success`, `.table-highlight-warning`
   - `<hr>` (sem estilos inline)

5. **Template para novas páginas**: copiar `TEMPLATE_PAGINA.html` — substitui colors hardcoded e emojis automaticamente

### Como criar novas páginas

1. Copiar `TEMPLATE_PAGINA.html`
2. Ajustar paths (se `temas/<tema>/nova-pagina.html`, use `../../assets/css/style.css`)
3. Substituir: título, badge de nível, breadcrumb, conteúdo
4. Usar classes `.btn-primary`, `.maxima`, `.badge-nivel badge-basico`, etc. — NÃO inline styles
5. Remover qualquer emoji do título/menu

### Referências de design
- `DESIGN_SYSTEM.md` — guia completo de cores, tipografia, componentes
- `design-system-demo.html` — playground visual de todos os estilos
- `assets/css/style.css` — 30+ variáveis CSS reutilizáveis
