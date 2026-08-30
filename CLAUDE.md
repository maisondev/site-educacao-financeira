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

## Página de Mercado (localStorage)

**Arquivo**: `mercado.html` + `assets/js/mercado.js` — chave `Store.CHAVES.MERCADO` (`mercado_compras`).

Acompanha a maior despesa variável da casa (supermercado) por categoria, com teto mensal, histórico e comparativo com a média dos meses anteriores.

**Estrutura do store**: `{ tetoMensal: number, compras: [], lista: [] }`
- `compras`: `{ id, data, estabelecimento, obs, itens: [{ categoria, valor }] }` — cada compra tem N itens por categoria (`CATEGORIAS_MERCADO`)
- `lista`: `{ id, nome, categoria, noCarrinho }` — lista de compras pré-mercado (não some ao trocar de mês)

**Mês (competência)**: usa `competenciaSelecionada()` de `competencia.js`, com seletor próprio (`renderSeletorMercado`).

### Integração com Lançamento rápido (2026-08-29)

O store do Mercado é isolado — nenhum outro módulo o lê. Para não digitar a mesma ida ao supermercado duas vezes, há vínculo bidirecional com as despesas variáveis (`Store.CHAVES.DESPESAS_VARIAVEIS`):

**Mercado → Despesa Variável (checkbox no modal)**
- Modal "Registrar compra" tem o checkbox `#chk-lancar-despesa` ("Lançar também nas despesas variáveis"), marcado por padrão em compras novas.
- Ao salvar com o checkbox marcado, `sincronizarDespesaVariavel(compra)` cria/atualiza uma despesa `categoria: 'alimentacao'`, `descricao: "Mercado — <estabelecimento>"`, `valor` = total da compra, marcada com `origemMercado: <id da compra>`.
- Editar a compra atualiza a despesa; desmarcar o checkbox ou remover a compra remove a despesa vinculada (`removerDespesaVinculada`).
- A lista "Compras do mês" mostra o selo `↗ lançada nas despesas variáveis` (`compraTemDespesaVinculada`).

**Lançamento rápido → Mercado (link na mensagem)**
- `lrPareceMercado(descricao)` (em `lancamento-rapido.js`) detecta palavras de supermercado/feira/atacado (`LR_PALAVRAS_MERCADO`).
- Quando bate, a mensagem de sucesso ganha o link "Detalhar por categoria no Mercado" → `mercado.html?novaCompra=1&valor=&data=&estab=&desc=`.
- `abrirCompraDeParametros()` (em `mercado.js`, chamada no `inicializarMercado`) abre o modal já preenchido, com o checkbox **desligado** e um aviso (`#aviso-ja-lancado`), porque o valor já entrou nas despesas variáveis pelo Lançamento rápido — ali o registro é só detalhamento por categoria, para não contar em dobro. `history.replaceState` limpa a query.

**Regra**: valor do supermercado entra **uma vez** nas despesas variáveis — ou pelo checkbox do Mercado, ou pelo Lançamento rápido. O registro no store do Mercado sempre serve para a análise por categoria.

## Página de Cartões (localStorage)

**Arquivo**: `cartoes.html` + `assets/js/cartoes.js` — chave `Store.CHAVES.CARTOES`.

Cadastra cartões de crédito com limite, ciclo (fechamento → vencimento), saldo por mês (`datasPorMes`) e histórico de utilização. O botão **"Importar de fatura"** lê um manifesto `cartao-<mes>-<ano>[-<titular>].json` (gerado na análise da fatura, salvo na pasta do mês no Google Drive) e cadastra/atualiza o cartão + registra a fatura do mês, que é lançada em Despesas Variáveis pela sincronização existente.

**Manifesto** (`tipo: "cartao-financas"`, `versao: 1`):
```json
{ "tipo":"cartao-financas", "versao":1, "gerado_em":"", "fonte":"",
  "cartao":{ "titular","nome","banco","ultimos","bandeira","tipo","limite","fechamento","vencimento" },
  "fatura":{ "competencia":"AAAA-MM", "fechamento":"DD/MM", "vencimento":"DD/MM", "saldo": number } }
```
Cartões adicionais (de familiares) têm seu próprio JSON, sem `limite` (compartilham o do titular).

### Convenção: competência = mês de VENCIMENTO (decidido 2026-08-30)

Uma fatura é sempre identificada pelo **mês em que vence** (quando o dinheiro sai), nunca pelo mês de fechamento.

- Fatura que fecha **29/08** e vence **05/09** → "Setembro 2026", `competencia: "2026-09"`, pasta `09 - Setembro`.
- Vale para: campo `competencia` do JSON, `<title>`/`<h1>` do HTML de análise, nome dos arquivos (`*-setembro-2026.*`) e nome da pasta do mês no Drive.
- Nubank e Caixa já seguiam isso; Itaú e Bradesco foram migrados (pastas e conteúdo).

### Resumo "Total devido por titular"

Abaixo do total geral, o resumo mostra a quebra por pessoa:
- Agrupa pelo **primeiro nome normalizado** (`primeiroNomeNormalizado` — sem acento/maiúsculas), então "Maison", "Maison Souza" e "MAISON MARCEL MADRI…" caem no mesmo grupo. Cada grupo lista os cartões que o compõem.
- **"Pago"** é lido sempre de `datasPorMes[].foiPaga` (mesma fonte do checkbox), nunca do objeto de `obterUltimaFaturaDisponivel` (que pode vir de `historicoUtilizacao` sem o flag). Fatura paga sai do total e da quebra.
- **Rateio (cartão emprestado)**: `datasPorMes[].rateio = [{ titular, valor }]` realoca parte do saldo daquela fatura para outra pessoa na quebra por titular — o total geral não muda. Configurado no modal "Gerenciar datas por mês" (campo "Parte da fatura é de outra pessoa"). O item aparece no grupo do beneficiário com a marca "(cartão de \<dono\>)".
  - **Recorrente**: o checkbox "Repetir nos próximos meses" grava um template `cartao.rateioRecorrente = { titular, valor, desde }`. `rateioEfetivo(cartao, mes, entrada)` resolve o rateio de um mês: o do próprio mês vence; senão o recorrente para `mes >= desde` (valor limitado ao saldo). Desmarcar o checkbox e salvar remove o template.
  - O modal "Gerenciar datas por mês" abre já no **mês da última fatura registrada** (não no mês do calendário), e recarrega os campos ao trocar o mês — para o saldo/rateio caírem no mês certo.
- **Botão "Copiar" por titular**: cada linha de titular tem um botão que copia (via `navigator.clipboard`, com `prompt` de fallback) um resumo em texto pronto para o WhatsApp — cabeçalho `💳 *Cartões — <titular>*`, um bloco por cartão (`• Nome (final XXXX)[ — cartão de <dono>]` + valor indentado na linha seguinte), divisória e `*Total devido: R$ ...*`. Os grupos ficam em `resumosPorTitular` (var de módulo, repopulada a cada `atualizarVisualizacao`); `copiarResumoTitular(indice, botao)` monta o texto e dá feedback "Copiado!" no botão.

## Linguagem e Público

- **Linguagem**: português (Brasil), simples e acessível para leigos
- **Público-alvo**: iniciantes em educação financeira
- **Tom**: educacional, amigável, nunca técnico demais
- **Exemplos**: use valores do dia a dia (salários brasileiros, despesas locais)

## Backup dos dados (`assets/js/backup.js`)

Renderizado na seção `#container-backup` do `dashboard.html` (via `renderizarSecaoBackup()`, chamada em `dashboard.js`).

**Backup manual** — `exportarTudo()` gera um `.json` (`financas-backup-AAAA-MM-DD.json`) com **todas** as chaves do `localStorage` (as de `Store.CHAVES` + qualquer outra presente, menos as de `BACKUP_CHAVES_IGNORADAS`); valores gravados como texto puro, para restauração fiel. `importarTudo()` valida (`versao` = `BACKUP_VERSAO`), pede confirmação e **substitui tudo** (chaves ausentes no arquivo são removidas). Aviso na tela se passou de `BACKUP_DIAS_ALERTA` (30) dias desde o último export (`backup_ultima_data`).

**Backup automático diário** — só aparece em navegadores com File System Access API (`window.showDirectoryPicker`, Chrome/Edge). O usuário escolhe uma pasta uma vez (ideal: dentro do Google Drive); o `FileSystemDirectoryHandle` é persistido no **IndexedDB** (`financas-backup` / store `handles` / chave `pasta`). A cada abertura do dashboard, `inicializarBackupAutomatico()` consulta a permissão (sem prompt) e, se `backup_auto_ultima_data` ≠ hoje, grava `financas-backup-AAAA-MM-DD.json` na pasta silenciosamente (um arquivo por dia, sobrescreve o do mesmo dia). Se o navegador pedir para reconfirmar o acesso, mostra botão "Reautorizar pasta". "Desativar" limpa o handle do IndexedDB.

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
