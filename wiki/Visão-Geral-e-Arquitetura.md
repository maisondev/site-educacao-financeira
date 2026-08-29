# Visão Geral e Arquitetura

## Stack

- **HTML + CSS + JavaScript vanilla.** Sem framework, bundler, build step ou CDN.
- **Publicação:** GitHub Pages (branch principal, raiz `/`).
- **Persistência:** `localStorage` do navegador. Nenhum dado sai da máquina.
- **CSS único:** `assets/css/style.css`, com variáveis em `:root` (Design System).

## Duas naturezas no mesmo site

1. **Base de conhecimento** — `temas/`, `roadmap.html`, `glossario.html`,
   `maximas.html`, `livros.html`, `pensadores.html`, `cursos.html`,
   `links-uteis.html`. Conteúdo de estudo, do básico ao avançado.
2. **Ferramentas de acompanhamento** — dezenas de páginas na raiz que registram
   e consolidam a vida financeira do usuário (despesas, cartões, dívidas, metas,
   patrimônio, análises).

## Navegação

O menu é centralizado em `assets/js/menu.js` (array `MENU_ITEMS`) e renderizado
por JavaScript em todas as páginas. Grupos:

| Grupo | Páginas principais |
|-------|--------------------|
| Painel | `dashboard.html` |
| Início | `index.html` |
| Aprender | `temas/`, `roadmap.html` |
| Acompanhamento | carro, cartões, despesas fixas/variáveis, desapego, dívidas, cartões adicionais, parcelas, envelopes, FGTS, investimentos, mercado, metas, receitas, renda extra, reserva |
| Análise | balanço patrimonial, contracheque, análise de fatura, relatórios, saldo projetado |
| Referência | livros, máximas, pensadores, glossário, links úteis, cursos, cadastros, Registrato |
| Ferramentas | hacks Nubank, juros compostos, juros simples, correção pela inflação |

No cabeçalho de toda página, `menu.js` injeta ainda:

- **Sino de notificações** — próximos eventos (fechamento/vencimento de cartões e
  despesas fixas) nos próximos 30 dias, a partir de `lembretes.js`.
- **Botão de data + mini calendário** — data corrente e navegação por mês.

## Competência mensal (`assets/js/competencia.js`)

Conceito central das ferramentas. Toda a informação datada pertence a uma
**competência** no formato `"AAAA-MM"`.

- Lançamentos novos gravam `competencia` explícita; os antigos herdam a competência
  deduzida da própria data (migração idempotente).
- Existe um **seletor global de competência** (`competencia_selecionada`). Páginas
  como Envelopes, Saldo do Mês, Despesas Variáveis e Relatórios reagem a ele.
- Apenas o mês corrente costuma ser **editável**; meses fechados ficam só de leitura
  (`historico_mensal`).
- `renda_por_competencia` guarda a renda líquida real de cada mês (ex.: contracheque
  daquele mês), para acertar meses de salário variável sem redigitar.

## Camada de dados (`assets/js/storage.js`)

Objeto `Store` centraliza o acesso ao `localStorage`:

- `Store.CHAVES` — catálogo único de nomes de chave.
- `Store.ler(chave, padrao)` / `Store.gravar(chave, valor)` — tratam JSON corrompido
  e falta de espaço, devolvendo o padrão em vez de quebrar a página.

### Principais chaves de `localStorage`

| Chave | Conteúdo |
|-------|----------|
| `renda_mensal`, `renda_mensal_competencia` | Renda mensal corrente e a competência que a originou |
| `renda_por_competencia` | Mapa `{ "AAAA-MM": líquido }` |
| `receitas_lista` | Extrato de tudo que entrou |
| `contracheques_historico` | Contracheques analisados |
| `rendas_extras` | Rendas extras recorrentes |
| `despesas_fixas` | Despesas fixas + status de pagamento por mês |
| `despesas_variaveis` | Lançamentos variáveis datados |
| `mercado_compras` | Notas de supermercado por categoria |
| `envelopes_financeiros` | Orçamento por envelope |
| `metas_financeiras` | Metas |
| `dividas` | Dívidas e pagamentos |
| `carro`, `fgts`, `investimentos`, `balanco_patrimonial`, `reserva_emergencia` | Patrimônio |
| `cartoes`, `cartoes_financeiros`, `cartao_credito`, `cartoes_adicionais_dados`, `compras_parceladas` | Cartões |
| `analise_faturas`, `regras_categorizacao` | Análise de fatura e regras aprendidas |
| `cadastros_gerais` | Categorias, formas de pagamento e estabelecimentos |
| `registrato_bcb` | Dados do Registrato do Banco Central |
| `hacks_nubank_dados`, `cursos_lista`, `desapego_itens` | Diversos |
| `competencia_selecionada`, `historico_mensal` | Competência |
| `backup_ultima_data` | Data do último backup (para o alerta de 30 dias) |

## Privacidade

Tudo fica no navegador. Limpar os dados do site apaga todo o histórico. Ver
[[Backup e Privacidade]].
