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
│       ├── nucleo/                     # Infra compartilhada (menu, rodape, storage, formatacao, icones, competencia, lembretes...)
│       ├── paginas/                    # Um controlador por pagina (dashboard.js, metas.js, cartoes.js...)
│       └── ferramentas/               # Scripts das calculadoras
├── docs/                               # Documentacao interna (DESIGN_SYSTEM, AGENTS, MELHORIAS, MENU_GUIDE)
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
2. Criar `assets/js/ferramentas/nova-ferramenta.js` se necessário
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

**Exemplo: calculadora de juros compostos** (`assets/js/ferramentas/calculadora-juros-compostos.js`):
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

**Arquivo**: `envelopes.html` + `assets/js/paginas/envelopes.js`

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

**Arquivo**: `metas.html` + `assets/js/paginas/metas.js`

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

**Arquivo**: `mercado.html` + `assets/js/paginas/mercado.js` — chave `Store.CHAVES.MERCADO` (`mercado_compras`).

Acompanha a maior despesa variável da casa (supermercado) por categoria, com teto mensal, histórico e comparativo com a média dos meses anteriores.

**Estrutura do store**: `{ tetoMensal: number, compras: [], lista: [] }`
- `compras`: `{ id, data, estabelecimento, obs, itens: [{ categoria, valor }] }` — cada compra tem N itens por categoria (`CATEGORIAS_MERCADO`)
- `lista`: `{ id, nome, categoria, noCarrinho }` — lista de compras pré-mercado (não some ao trocar de mês)

**Mês (competência)**: usa `competenciaSelecionada()` de `competencia.js`, com seletor próprio (`renderSeletorMercado`).

### Integração com Lançamento rápido (2026-08-29)

O store do Mercado só é **escrito** por `mercado.js`. Em leitura, o Painel usa o teto + gasto do mês em dois lugares (sem duplicar valor, porque a compra já entra nas despesas variáveis pelo vínculo abaixo): `altAlertasMercado()` (`alertas.js`) dispara um alerta quando o gasto passa de 90% do teto, e `smLinhaMercado()` (`saldo-mes.js`) mostra a linha informativa "Mercado (X% do teto) — R$ gasto de R$ teto" no card de saldo. Para não digitar a mesma ida ao supermercado duas vezes, há vínculo bidirecional com as despesas variáveis (`Store.CHAVES.DESPESAS_VARIAVEIS`):

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

**Arquivo**: `cartoes.html` + `assets/js/paginas/cartoes.js` — chave `Store.CHAVES.CARTOES`.

Cadastra cartões de crédito com limite, ciclo (fechamento → vencimento), saldo por mês (`datasPorMes`) e histórico de utilização. O botão **"Importar de fatura"** lê um manifesto `cartao-<mes>-<ano>[-<titular>].json` (gerado na análise da fatura, salvo na pasta do mês no Google Drive) e cadastra/atualiza o cartão + registra a fatura do mês, que é lançada em Despesas Variáveis pela sincronização existente.

**Manifesto** (`tipo: "cartao-financas"`, `versao: 1`):
```json
{ "tipo":"cartao-financas", "versao":1, "gerado_em":"", "fonte":"",
  "cartao":{ "titular","nome","banco","ultimos","bandeira","tipo","limite","fechamento","vencimento" },
  "fatura":{ "competencia":"AAAA-MM", "fechamento":"DD/MM", "vencimento":"DD/MM", "saldo": number } }
```
Cartões adicionais (de familiares) têm seu próprio JSON, sem `limite` (compartilham o do titular).

### Fatura entra uma única vez nas despesas variáveis (decidido 2026-08-30)

Há dois caminhos que lançam uma fatura em `despesas_variaveis`:
- **Página Cartões** (`sincronizarFaturasExistentes` / registro de saldo do mês) → `adicionarDespesaDeCartao(...)` cria **uma linha única** com o total da fatura, marcada `origem: 'fatura-cartao'` + `origemFatura: "<ultimos|nome>|<competencia>"`.
- **Análise de fatura** (`analise-fatura.html`, botão "Lançar em Despesas Variáveis") → `afLancarEmDespesas()` cria **uma linha por lançamento**, categorizada, com `origem: 'fatura'` + `origemHash`.

`afLancarEmDespesas()` detecta uma linha `fatura-cartao` da mesma competência (e cartão, quando os finais batem) e oferece **substituir a linha única pelo detalhamento por categoria** (confirm; Cancelar = não lança nada). Assim o valor da fatura entra uma vez só — igual ao aviso "já lançado" do Mercado. A análise por categoria é sempre só detalhamento.

### Convenção: competência = mês de VENCIMENTO (decidido 2026-08-30)

Uma fatura é sempre identificada pelo **mês em que vence** (quando o dinheiro sai), nunca pelo mês de fechamento.

- Fatura que fecha **29/08** e vence **05/09** → "Setembro 2026", `competencia: "2026-09"`, pasta `09 - Setembro`.
- Vale para: campo `competencia` do JSON, `<title>`/`<h1>` do HTML de análise, nome dos arquivos (`*-setembro-2026.*`) e nome da pasta do mês no Drive.
- Nubank e Caixa já seguiam isso; Itaú e Bradesco foram migrados (pastas e conteúdo).

### `analise_faturas` chaveado por competência + banco + apelido (decidido 2026-08-30, apelido em 2026-08-31)

**Arquivo**: `analise-fatura.html` + `assets/js/paginas/analise-fatura.js` — chave `Store.CHAVES.ANALISE_FATURAS` (`analise_faturas`).

Antes a store usava **só a competência** como chave (`analise_faturas["2026-09"]`), então salvar a análise do Bradesco de setembro apagava a do Nubank do mesmo mês. Depois passou a **`afChave(competencia, banco)` = `"AAAA-MM|Banco"`** — mas isso ainda colapsava várias faturas do **mesmo** banco no mês (um cartão por pessoa: Nubank Mônica, Nubank Raíssa…). Agora a chave é **`afChave(competencia, banco, apelido)` = `"AAAA-MM|Banco[|Apelido]"`**: `banco` = valor do `<select id="af-banco">` (`Bradesco`, `Nubank`, `Inter`, `Itaú`, …, `Outro`); `apelido` = campo de texto **opcional** `#af-apelido`. Regra: **sem apelido**, reanalisar o mesmo banco/mês sobrescreve aquela entrada (comportamento antigo); **com apelido**, cada apelido é uma entrada independente.

- Antes de salvar, o `<select id="af-banco">` é reconhecido pelo texto da fatura (`afDetectarBanco` — marcas tipo `CARTÕES CAIXA`, `Banco Inter`, `Bradesco`) e ajustado sozinho; o valor do seletor + `#af-apelido` no momento do clique em "Salvar" são a fonte da verdade (`afEstado.banco`/`afEstado.apelido` sincronizados via `change`/`input` também).
- `afMigrarChaves(dados)` roda dentro de `afLerTodas()`: converte chaves antigas (`/^\d{4}-\d{2}$/`) para `"<competencia>|<banco>"` e persiste (best-effort). Idempotente. Não mexe em chaves já com banco.
- `afEstado.chave` guarda a chave do registro salvo/aberto; `afAutoSalvarSeSalva()` grava nela.
- `afAbrirAnalise(chave)` e o deep-link `?abrir=` aceitam a chave completa, **ou** `"AAAA-MM|Banco"`, **ou** só a competência (links antigos de "Meus Cartões"): nesses casos abrem a 1ª entrada que casar (competência e, se informado, banco).
- Histórico ("Análises salvas") ordena por competência desc, depois banco asc, depois apelido asc; mostra `· <apelido>` no rótulo; botões Abrir/Excluir passam a chave completa.
- **Consumidores**: `relatorios.js` (`relGastosFaturaPorCategoria`) soma **todas** as entradas da competência (varre por `reg.competencia`, indiferente ao apelido); `cartoes.js` (`analiseSalvaDaFatura` faz varredura por competência+banco, cobrindo chaves com apelido; link "Ver análise" → `?abrir=<comp>|<Banco>`, resolvido para a 1ª análise daquele banco); `revisao-faturas.js` (`rfSincronizar` deriva competência/banco/apelido de `reg.*` e `rfChaveFatura(comp, banco, apelido)` cria uma revisão por apelido). Todos com fallback para as chaves antigas.

### Mensagem de status da análise aparece perto dos botões (2026-08-30)

`afMostrarMsg` escreve em **dois** elementos: `#af-msg` (topo, contexto de upload) e `#af-msg-acoes` (logo abaixo dos botões "Salvar análise / Lançar / Baixar CSV"), e rola até a cópia visível mais próxima do centro da tela. Antes só existia `#af-msg` no topo, então quem clicava em "Salvar" já rolado para baixo não via a confirmação e achava que "nada acontecia". `afSalvarAnalise` também trata `QuotaExceededError` (localStorage cheio) com aviso em vez de falhar em silêncio.

### Resumo "Total devido por titular"

Abaixo do total geral, o resumo mostra a quebra por pessoa:
- Agrupa pelo **primeiro nome normalizado** (`primeiroNomeNormalizado` — sem acento/maiúsculas), então "Maison", "Maison Souza" e "MAISON MARCEL MADRI…" caem no mesmo grupo. Cada grupo lista os cartões que o compõem.
- **"Pago"** é lido sempre de `datasPorMes[].foiPaga` (mesma fonte do checkbox), nunca do objeto de `obterUltimaFaturaDisponivel` (que pode vir de `historicoUtilizacao` sem o flag). Fatura paga sai do total e da quebra.
- **Rateio (cartão emprestado)**: `datasPorMes[].rateio = [{ titular, valor }]` realoca parte do saldo daquela fatura para outra pessoa na quebra por titular — o total geral não muda. Configurado no modal "Gerenciar datas por mês" (campo "Parte da fatura é de outra pessoa"). O item aparece no grupo do beneficiário com a marca "(cartão de \<dono\>)".
  - **Recorrente**: o checkbox "Repetir nos próximos meses" grava um template `cartao.rateioRecorrente = { titular, valor, desde }`. `rateioEfetivo(cartao, mes, entrada)` resolve o rateio de um mês: o do próprio mês vence; senão o recorrente para `mes >= desde` (valor limitado ao saldo). Desmarcar o checkbox e salvar remove o template.
  - O modal "Gerenciar datas por mês" abre já no **mês da última fatura registrada** (não no mês do calendário), e recarrega os campos ao trocar o mês — para o saldo/rateio caírem no mês certo.
- **Botão "Copiar" por titular**: cada linha de titular tem um botão que copia (via `navigator.clipboard`, com `prompt` de fallback) um resumo em texto pronto para o WhatsApp — cabeçalho `💳 *Cartões — <titular>*`, um bloco por cartão (`• Nome (final XXXX)[ — cartão de <dono>]` + valor indentado na linha seguinte), divisória e `*Total devido: R$ ...*`. Os grupos ficam em `resumosPorTitular` (var de módulo, repopulada a cada `atualizarVisualizacao`); `copiarResumoTitular(indice, botao)` monta o texto e dá feedback "Copiado!" no botão.

### Vínculos com Análise e Revisão de Fatura (2026-08-30)

Cada card do resumo "saldos abertos" (`atualizarVisualizacao` → `lista-saldos-por-cartao`) e cada card de cartão (`montarCardCartao`) linkam a fatura do mês às páginas de detalhe, quando existe registro da **mesma competência e mesmo banco**:
- `analiseSalvaDaFatura(cartao, competencia)` — procura `analise_faturas["<competencia>|<Banco>"]` (chave nova; ver seção abaixo), com fallback para a chave antiga só com a competência casando `AF_BANCO_LABEL[obterBancoPorNome(nome)]` com `.banco`.
- `linksFaturaCartao(cartao, competencia)` — "Ver análise" → `analise-fatura.html?abrir=<comp>`; "Ver revisão" → `revisao-faturas.html?abrir=<comp>|<Banco>`.
- Destino: `inicializarAnaliseFatura` chama `afAbrirAnalise(abrir)`; `revisao-faturas.js` tem `rfIrParaRevisao(chave)` (rola e destaca; troca o filtro p/ "todas" se a revisão estiver concluída). Ambos limpam a query com `history.replaceState`.
- Reciprocidade: breadcrumb de `analise-fatura.html`/`revisao-faturas.html` passa por "Meus Cartões"; `cartoes.html` tem botões "Analisar fatura" / "Revisão de faturas".

### Trilha de pagamento da fatura: analisar → separar → pagar (2026-08-30)

No card do resumo, `montarTrilhaPagamento(c, mes, dataAtual)` mostra 3 passos antes de pagar (coerente com educação financeira: só pago depois de saber o que estou pagando e ter o valor separado):
1. **Fatura analisada** — automático, via `analiseSalvaDaFatura`.
2. **Dinheiro separado na caixinha** — `marcarDinheiroSeparado(cartaoId, mes)` pede o valor (`prompt`, sugestão = saldo da fatura) e grava `datasPorMes[].{dinheiroSeparado, valorSeparado, dinheiroSeparadoEm}`. O card compara com o total (`bate` / `faltam X` / `sobra X`). "desfazer" limpa os campos.
3. **Marcar como paga** — checkbox **desabilitado** até 1 e 2. `marcarFaturaPaga` também trava por segurança (alerta o que falta) ao tentar marcar paga sem os pré-requisitos.

`comFaturaDoMes(cartaoId, mes, fn)` — helper que acha/cria a entrada de `datasPorMes` do mês, aplica `fn`, salva e re-renderiza.

### Alerta "fatura fechada aguardando pagamento" (2026-08-30)

`altAlertasFaturaFechada()` (`alertas.js`) cobre a lacuna entre o fechamento e o vencimento: `altAlertasCartoes()` só alerta nos 3 dias anteriores ao dia do vencimento e, como `altDiasAteDiaDoMes` sempre rola para a frente, nunca enxerga fatura vencida. O novo alerta lê `Store.CHAVES.CARTOES` direto (dashboard não carrega `cartoes.js`): para cada `datasPorMes` com `saldo > 0` e `!foiPaga`, monta a data de vencimento a partir de `mes` (competência = mês de vencimento) + dia de `entrada.vencimento`/`cartao.vencimento`, exige que já tenha passado o fechamento (`altDataFechamento`), ignora entrada > 45 dias à frente e pula 0–3 dias (já coberto). Sem limite para trás (fatura vencida e não paga fica em alerta para sempre).

- **Antes de vencer** (`dias >= 0`): título "Fatura do X fechada — provisionar pagamento" (ou "dinheiro já separado"); **nunca** diz "não está paga". Severidade `atencao` (≤10 dias) ou `info`.
- **Depois de vencer** (`dias < 0`): "Fatura do X venceu há N dias e não está paga", `critico`.
- Detalhe: `R$ saldo · fatura de <mês por extenso> · venceu/vence <prazo> (dia D) · <estado do dinheiro separado, com valor se houver>`.
- Link: **"Abrir fatura"** → `cartoes.html?fatura=<ultimos>|<AAAA-MM>`. `abrirFaturaDeParametros()` (em `cartoes.js`, no `inicializarCartoes`) acha o cartão pelos 4 últimos, seta `cartaoEmEdicaoId` e chama `abrirModalDatasMes(comp)` — o modal "Gerenciar datas por mês" abre naquele mês. `history.replaceState` limpa a query.
- O modal "Gerenciar datas por mês" tem o checkbox **`#chk-fatura-paga-mes`** ("Fatura deste mês está paga") → `alternarFaturaPagaMes()` grava `datasPorMes[].foiPaga` do mês selecionado na hora (sem a trava análise+dinheiro-separado do fluxo guiado do resumo; aqui é edição manual).

## Página de Revisão de Faturas — esteira (localStorage)

**Arquivo**: `revisao-faturas.html` + `assets/js/paginas/revisao-faturas.js` — chave `Store.CHAVES.REVISAO_FATURAS` (`revisao_faturas`).

Transforma cada fatura fechada numa lista de tarefas de revisão pendente, para não só pagar a fatura mas sair dela com 1 corte definido para o mês seguinte.

**Fonte de dados**: lê `Store.CHAVES.ANALISE_FATURAS` (`analise_faturas`, gerado em `analise-fatura.html`). Aquela store é chaveada por **`"AAAA-MM|Banco[|Apelido]"`** (ver seção abaixo), então Nubank e Bradesco de setembro — e vários cartões Nubank com apelido — coexistem. A revisão espelha isso: `rfChaveFatura(comp, banco, apelido)` cria uma esteira por apelido. A revisão continua guardando um **snapshot** dos números no momento em que é criada (protege contra reanálise). Fluxo do usuário: analisar 1 fatura → salvar → **Sincronizar** na esteira → analisar a próxima → Sincronizar de novo. `rfSincronizar` deriva competência/banco/apelido de `reg.*` (não da chave).

**Estrutura do store**: `{ [competencia|banco[|apelido]]: { competencia, banco, apelido, estado, criadaEm, atualizadaEm, snapshot, tarefas: [] } }`
- `estado`: `'a-revisar'` → `'em-revisao'` (ao marcar a 1ª tarefa) → `'concluida'` (botão "Concluir revisão"; reabrível).
- `snapshot`: `{ total, qtdLancamentos, porCategoria, encargos, maior, assinaturas[], parcelamentosNovos[] }` — respeita os cartões `inclusos` da análise e ignora `tipo:'pagamento'`.
- `tarefas[]`: `{ id, tipo, texto, feito, auto, chave? }`. `tipo`: `checklist` (5 fixas, `RF_CHECKLIST_FIXO`), `insight` (automáticas), `livre` (o usuário digita).

**Insights automáticos** (`rfTarefasAutomaticas`), deduplicados por `chave` ao ressincronizar (nunca removem, só adicionam novos):
- `cat:<categoria>` — total da categoria ≥ média dos até 3 meses anteriores × 1,20 **e** diferença ≥ R$ 30 (`RF_LIMITE_PCT` / `RF_LIMITE_REAIS`). Baseline = snapshots anteriores do mesmo banco, senão de qualquer banco.
- `assin:<nome>` — assinatura (categoria `assinatura`) cujo nome normalizado (`rfNormAssinatura`, 2 primeiras palavras) não apareceu em fatura anterior.
- `parcelas` — lançamentos com `parcelaAtual === 1 && parcelaTotal > 1`.
- `encargos` — soma de `tipo:'encargo'` > 0 (juros/IOF/multa).
- `primeira` — quando não há baseline nenhum.

**Sincronização** (`rfSincronizar(silencioso)`): roda no `DOMContentLoaded` em modo silencioso e no botão "Sincronizar". Revisão nova = checklist fixo + insights; revisão existente = atualiza `snapshot` e injeta só insights com `chave` inédita, preservando `feito`.

## Linguagem e Público

- **Linguagem**: português (Brasil), simples e acessível para leigos
- **Público-alvo**: iniciantes em educação financeira
- **Tom**: educacional, amigável, nunca técnico demais
- **Exemplos**: use valores do dia a dia (salários brasileiros, despesas locais)

## Backup dos dados (`assets/js/nucleo/backup.js`)

Renderizado na seção `#container-backup` do `dashboard.html` (via `renderizarSecaoBackup()`, chamada em `dashboard.js`).

**Backup manual** — `exportarTudo()` gera um `.json` (`financas-backup-AAAA-MM-DD.json`) com **todas** as chaves do `localStorage` (as de `Store.CHAVES` + qualquer outra presente, menos as de `BACKUP_CHAVES_IGNORADAS`); valores gravados como texto puro, para restauração fiel. `importarTudo()` valida (`versao` = `BACKUP_VERSAO`), pede confirmação e **substitui tudo** (chaves ausentes no arquivo são removidas). Aviso na tela se passou de `BACKUP_DIAS_ALERTA` (30) dias desde o último export (`backup_ultima_data`).

**Backup automático diário** — só aparece em navegadores com File System Access API (`window.showDirectoryPicker`, Chrome/Edge). O usuário escolhe uma pasta uma vez (ideal: dentro do Google Drive); o `FileSystemDirectoryHandle` é persistido no **IndexedDB** (`financas-backup` / store `handles` / chave `pasta`). A cada abertura do dashboard, `inicializarBackupAutomatico()` consulta a permissão (sem prompt) e, se `backup_auto_ultima_data` ≠ hoje, grava `financas-backup-AAAA-MM-DD.json` na pasta silenciosamente (um arquivo por dia, sobrescreve o do mesmo dia). Se o navegador pedir para reconfirmar o acesso, mostra botão "Reautorizar pasta". "Desativar" limpa o handle do IndexedDB.

## Busca global (Ctrl+K)

`assets/js/nucleo/main.js` → IIFE `buscaGlobal`: paleta de navegação rápida presente em toda
página que carrega `main.js`. Índice = `MENU_ITEMS` (navegacao.js) + lista `ATALHOS` (sinônimos
como "IPVA", "gasolina", "fatura", "contracheque"). Abre com **Ctrl/⌘+K**, com **`/`** fora de
campos, ou pelo botão 🔎 no `<nav>` (inserido antes de `.notificacoes-container`). Filtro sem
acento por tokens; ↑↓ + Enter navega (`resolverHref` resolve o caminho relativo); Esc/fundo fecha.
Para um atalho novo, adicionar `{ label, href, tags }` em `ATALHOS`.

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
- `docs/DESIGN_SYSTEM.md` — guia completo de cores, tipografia, componentes
- `design-system-demo.html` — playground visual de todos os estilos
- `assets/css/style.css` — 30+ variáveis CSS reutilizáveis
