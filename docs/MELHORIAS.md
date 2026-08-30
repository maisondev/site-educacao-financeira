# Oportunidades de Melhoria — Site de Finanças

> **Estado em 2026-08-30:** 50 páginas HTML (38 na raiz + 9 artigos em `temas/` + 3 calculadoras), 47 scripts, ~17.900 linhas de JS, 100% em `localStorage`.
>
> Critério de ordenação: **utilidade real no gerenciamento das finanças ÷ esforço**. As P0 são as que eu faria amanhã.

---

## Registro do que foi entregue em 2026-08-29 / 30

### Backlog N1–N15 (scan de 28/08) — praticamente todo fechado em 29/08

| # | Item | Status |
|---|------|--------|
| N1 | Fechar migração para `Store` + chaves no catálogo | ✅ 29/08 — `CADASTROS`/`REGISTRATO` no catálogo, 9 leitores críticos migrados; `http.log` removido |
| N2 | Análise de fatura → "Lançar em Despesas Variáveis" | ✅ 29/08 — botão + dedup por hash + parcelas para `compras_parceladas` + `regras_categorizacao` |
| N3 | Categorias unificadas lendo `cadastros_gerais` | ✅ 29/08 — `CAD_CATEGORIAS_PADRAO` vira vocabulário único; relatório "gasto por categoria no mês" |
| N4 | "Quanto posso gastar" ÷ dias restantes | ✅ 29/08 — `smBlocoPodeGastar` no card de saldo (Painel + Saldo Projetado) |
| N5 | Contracheque do mês vira a renda daquela competência | ✅ 29/08 — chave `renda_por_competencia`, `saldo-mes.js` prefere esse valor |
| N6 | Auditoria de navegação + home com hierarquia | ✅ 29/08 — órfãs ligadas no menu, home em 6 grupos espelhando o menu |
| N7 | Fluxo de caixa futuro completo (12 meses) | ✅ 29/08 — `renderizarProjecao12Meses` em `parcelas-cartao.html` somando faturas + dívidas + receitas |
| N8 | Competência para envelopes, rendas extras e aportes de reserva | ✅ 29/08 — `COMPETENCIA_FONTES_ANINHADAS` |
| N9 | `registrato.js` + `dividas.js` compartilhando construtor de dívida | ✅ 29/08 — `upsertDividasExternas(lista)` |
| N10 | PWA (manifest + service worker + ícone) | ✅ 29/08 — `financas-v2`, injeção via `main.js` |
| N11 | Página de verificação / testes de fumaça | ✅ 29/08 — `verificacao.html`, mini-runner inline |
| N12 | Resumo do mês para impressão / PDF | ✅ 29/08 — `@media print` em Saldo Projetado e Relatórios |
| N13 | Limpeza de repo (`http.log` + `*.log`) | ✅ 29/08 |
| N14 | Foco / Esc / aria nos modais | ✅ 29/08 — `modaisAcessiveis()` em `main.js` |
| N15 | Despesa fixa com status pago/reservado por mês | ✅ 29/08 — `meses[AAAA-MM] = pago \| reservado`, seletor de mês, "reservar todas as pendentes" no Painel |

### Novas áreas e reforços (29–30/08)

- **Mercado** (`mercado.html` + `mercado.js`, chave `mercado_compras`): acompanha a maior despesa variável (supermercado) por categoria, com teto mensal, histórico, comparativo com a média dos meses anteriores e **lista de compras** pré-mercado. Competência via `competencia.js`.
- **Mercado ↔ Lançamento rápido** (vínculo bidirecional): checkbox "Lançar também nas despesas variáveis" no modal de compra cria/atualiza uma despesa `alimentacao` marcada com `origemMercado`; o Lançamento rápido detecta palavras de supermercado (`lrPareceMercado`) e oferece "Detalhar por categoria no Mercado" com o modal pré-preenchido e o checkbox desligado (evita contagem dupla).
- **Carro — garagem** (`carro.html`): vários veículos (ativo + histórico separado por veículo), ficha técnica do Fox e **calculadora de paridade álcool/gasolina** (regra dos 70%).
- **Cartões — total devido por titular** (`cartoes.js`): quebra do total geral por pessoa, agrupando pelo **primeiro nome normalizado**; "Pago" sempre lido de `datasPorMes[].foiPaga`; **rateio de fatura** (`datasPorMes[].rateio`) realoca parte do saldo para outra pessoa sem mexer no total geral.
- **Cartões — agrupar titulares (casal)** (30/08, commit `04a5c06`): modal "Agrupar titulares" junta dois ou mais primeiros nomes numa linha única da quebra "Total devido por titular" (ex.: Marden + Raissa → um total só para mandar). Não altera o total geral; o botão "Copiar" manda o somatório combinado. Config em `Store.CHAVES.GRUPOS_TITULARES` (`grupos_titulares`), com `mesclarGruposTitulares()` aplicado antes de renderizar a quebra.
- **Cartões — aviso de fechamento no card** (30/08, commit `04a5c06`): selo "Fecha hoje / amanhã / em N dias" no card quando faltam ≤3 dias para o dia de fechamento (`diasAteFechamento` usa a data de `datasPorMes` do mês corrente, senão `cartao.fechamento`). "Fecha hoje" em vermelho pulsante.
- **Convenção competência = mês de VENCIMENTO** documentada no `CLAUDE.md` — fatura identificada pelo mês em que o dinheiro sai; Itaú e Bradesco migrados.
- **Wiki**: casos de uso documentados + link no README.
- **Revisão de Faturas — esteira** (30/08, `revisao-faturas.html` + `revisao-faturas.js`, chave `revisao_faturas`): cada fatura analisada em `analise-fatura.html` vira uma revisão pendente com checklist fixo (5 itens) + insights automáticos dos próprios números (categoria acima da média de 3 meses, assinatura nova, parcelamento novo, juros/IOF) + tarefas livres. Guarda snapshot da fatura, então sobrevive à sobrescrita de `analise_faturas` (que só guarda 1 análise por mês). Estados a-revisar → em-revisão → concluída. Link no menu Análise e na home.

---

## Novo scan — oportunidades (levantadas em 2026-08-30)

### P0 — Fazer amanhã

#### C1. Commitar o rateio recorrente de cartão que está no working tree (≈15min)

`assets/js/paginas/cartoes.js` e `cartoes.html` estão modificados e **não commitados**: `rateioEfetivo()`,
`cartao.rateioRecorrente = { titular, valor, desde }`, checkbox "Repetir este rateio nos próximos
meses", modal de datas abrindo no mês da última fatura e limite proporcional do total rateado ao
saldo do cartão. Revisar, testar em `cartoes.html` (criar rateio recorrente, conferir que aparece
com "(recorrente)" no histórico e na quebra por titular) e commitar antes de qualquer outra coisa.

#### C2. Unificar as três chaves de cartão — `cartao_credito` → `cartoes` ✅ FEITO 2026-08-30

Migração idempotente `migrarCartoesLegado()` em `cartoes.js` funde `cartoes_financeiros` e
`cartao_credito` na store única `cartoes` (dedup por nome) e apaga as chaves mortas.
`relatorios.js` (`obterDadosCartao`) e `dividas.js` (`renderFaturasCartao`) agora leem
`Store.CHAVES.CARTOES`. Removidos `cartao.html`, `assets/js/paginas/cartao.js` e a duplicata
órfã `fluxo-caixa-futuro.html` (o `.js` fica, é usado por `parcelas-cartao.html`). Chaves
`CARTAO_CREDITO` / `CARTOES_FINANCEIROS` saíram do catálogo em `storage.js`.

<details><summary>Contexto original</summary>


**Problema:** existem **três** stores de cartão no catálogo (`storage.js:26-29`): `CARTOES`
(`'cartoes'`, usado por `cartoes.js` e `saldo-mes.js`), `CARTAO_CREDITO` (`'cartao_credito'`, a
página órfã `cartao.html`) e `CARTOES_FINANCEIROS`. `relatorios.js:432` ainda lê `cartao_credito`,
então o gráfico de gasto com cartão do Relatórios **ignora tudo que foi cadastrado em `cartoes.html`**.
Foi o motivo de N6 não ter removido `cartao.html`.

**O que fazer:**
- Migração idempotente `cartao_credito` → `cartoes` (dedup por últimos 4 dígitos + banco).
- `relatorios.js` passa a ler `Store.CHAVES.CARTOES`.
- Remover `cartao.html` + `assets/js/paginas/cartao.js`; apontar os ~5 links restantes para `cartoes.html`.
- Idem para `fluxo-caixa-futuro.html` (duplicata órfã de `parcelas-cartao.html`, sobra de N7).

**Ganho:** o Relatórios volta a refletir a realidade; some a última grande órfã e uma chave morta do catálogo.
</details>

#### C3. Fatura de cartão entra uma única vez nas despesas variáveis ✅ FEITO 2026-08-30

`adicionarDespesaDeCartao()` (nas duas implementações: fallback em `cartoes.js` e a de
`despesas-variaveis.js`) agora marca a linha da fatura com `origem: 'fatura-cartao'` +
`origemFatura: "<ultimos|nome>|<competencia>"`. `afLancarEmDespesas()` em `analise-fatura.js`
detecta essa linha na mesma competência/cartão e oferece **substituí-la pelo detalhamento por
categoria** (confirm; Cancelar = não lança nada). Regra documentada no `CLAUDE.md`.

<details><summary>Contexto original</summary>


**Problema:** hoje há **dois caminhos** que lançam a fatura em `despesas_variaveis`:
(a) "Importar de fatura" em `cartoes.html` → a sincronização de fatura do cartão;
(b) "Lançar em Despesas Variáveis" em `analise-fatura.html` (N2, dedup por `origemHash`).
Nada garante que os dois não se sobreponham no mesmo mês — risco de fatura contada em dobro no
saldo projetado, exatamente como o Mercado resolveu com o aviso "já lançado".

**O que fazer:**
- Ao sincronizar a fatura pelo cartão, marcar a despesa com `origem: 'fatura-cartao'` + `origemFatura: <cartão+competência>`.
- `afLancarEmDespesas()` detecta despesa `fatura-cartao` da mesma competência/cartão e mostra o aviso "esta fatura já está nas despesas variáveis pelo cartão — aqui é só detalhamento por categoria" (checkbox desligado), espelhando `abrirCompraDeParametros()` do Mercado.
- Regra escrita no `CLAUDE.md`: valor da fatura entra **uma vez**; a análise por categoria é sempre só detalhamento.
</details>

#### C4. Mercado alimenta os Relatórios e o card de saldo ✅ FEITO 2026-08-30

`altAlertasMercado()` (`alertas.js`) entra na Central de alertas quando o gasto de Mercado do
mês corrente passa de 90% do teto (crítico ≥ 100%). `smLinhaMercado()` (`saldo-mes.js`) mostra
a linha "Mercado (X% do teto) — R$ gasto de R$ teto" com link para `mercado.html` no card de
saldo (dashboard e saldo-projetado). Sem duplicar valor: a compra já entra nas despesas
variáveis pelo vínculo do checkbox; os Relatórios continuam somando só `alimentacao` das
despesas, sem ler o store do Mercado.

<details><summary>Contexto original</summary>

**Problema:** `CLAUDE.md` diz "o store do Mercado é isolado — nenhum outro módulo o lê". O teto
mensal do supermercado e o gasto acumulado do mês são dados de gestão que só existem dentro de
`mercado.html`. O Painel não avisa "mercado já passou de 80% do teto".

**O que fazer:**
- Alerta na Central de alertas quando o gasto de Mercado do mês corrente passar do teto (ou de 90%).
- Linha "Mercado: R$ X de R$ Y (teto)" no card de saldo do mês, com link para `mercado.html`.
- O relatório "gasto por categoria no mês" (N3) já soma `alimentacao` das despesas — garantir que a
  compra vinda do Mercado com `origemMercado` **não** seja contada duas vezes ali.
</details>

### P1 — Alto valor, exige um pouco mais de desenho

#### C5. "Por onde começar" — onboarding com dados (≈2h)

50 páginas, nenhuma orientação de primeira vez. Um card dispensável no topo do Painel (só aparece
enquanto `renda_mensal` e `despesas_fixas` estiverem vazios): 3 passos — (1) informe sua renda,
(2) cadastre suas despesas fixas, (3) faça o primeiro lançamento rápido. Cada passo é um link
direto e some quando cumprido. Guarda `onboarding_dispensado` no `localStorage`.

#### C6. Busca global entre páginas (≈2h)

Com 50 páginas, achar "onde eu registro o IPVA" exige decorar o menu. Um `Ctrl+K` / campo no header
que abre uma lista de páginas + âncoras do glossário (dados estáticos, sem índice remoto). Reaproveita
a estrutura de `menu.js` como fonte da lista.

#### C7. `analise-fatura.js` para de manter taxonomia própria (≈1h30)

Sobra de N2/N3: `AF_CATEGORIAS` (barras coloridas + regex de categorização) é um vocabulário
paralelo ao `CAD_CATEGORIAS_PADRAO`. O de/para `AF_PARA_CATEGORIA_DV` é grosseiro e joga muita
coisa em "outro". Fazer `afCategorizar` sugerir direto as categorias de `Cadastros.categorias()`
e alimentar `regras_categorizacao` (que N2 já criou) como memória única.

#### C8. Fechar mês também oferece backup + competência onde falta (≈1h) — PARCIAL 2026-08-30

- A ação "Fechar mês" (`competencia.js`) arquiva o retrato mas não lembra do backup. Ao fechar,
  oferecer "exportar backup agora" (reusa `backup.js`). ⬜ pendente.
- ✅ `reserva-emergencia.html` e `renda-extra.html` agora carregam `competencia.js` e chamam
  `migrarCompetencias()` no `DOMContentLoaded`.

### P2 — Melhoram a rotina / reduzem risco

#### C9. Ampliar `verificacao.html` para os módulos novos (≈1h)

Cobrir: soma do rateio de cartão limitada ao saldo (`rateioEfetivo` + fator proporcional),
`primeiroNomeNormalizado` agrupando "Maison" / "MAISON MARCEL", despesa fixa com
`meses[AAAA-MM]` (migração idempotente do `pagoEm`/`provisionada` antigos), e `sincronizarDespesaVariavel`
do Mercado não duplicando ao editar a mesma compra.

#### C10. Tags de PWA no `TEMPLATE_PAGINA.html` ✅ FEITO 2026-08-30 — `<link rel="manifest">` + `theme-color` no `<head>` do template.

Sobra de N10: só `index.html` tem `<link rel="manifest">` + `theme-color` no HTML; as demais
dependem da injeção via `main.js`. Colar as tags no template para as próximas páginas já nascerem completas.

#### C11. Consistência da convenção "competência = mês de vencimento" (≈45min)

A convenção foi decidida em 30/08 e Itaú/Bradesco foram migrados. Varrer `cartoes.js`,
`analise-fatura.js`, `parcelas-cartao.js` e `saldo-mes.js` conferindo que todo lugar que deriva a
competência de uma fatura usa a data de **vencimento**, não a de fechamento. Documentar o resultado
em um teste de fumaça (fatura fecha 29/08, vence 05/09 → `2026-09`).

#### C12. Home: card do Mercado e do Carro-garagem no grupo certo ✅ FEITO 2026-08-30 — os dois já têm card em `index.html`; texto do Carro atualizado para citar garagem, lista da oficina e paridade.

Conferir se `mercado.html` e a nova visão de garagem do `carro.html` estão nos grupos de
`index.html` (regra do `CLAUDE.md`: toda página → link no menu **e** card na home).

---

## Ordem sugerida para amanhã

1. ~~**C1** — commitar o rateio recorrente~~ — já commitado antes (04a5c06); working tree tinha a lista de oficina do Carro, commitada em 8b7a0b4.
2. ~~**C2** — unificar as chaves de cartão e remover `cartao.html` / `fluxo-caixa-futuro.html`~~ ✅ 2026-08-30.
3. ~~**C3** — travar a fatura para não contar em dobro nas despesas variáveis~~ ✅ 2026-08-30.
4. ~~**C4** — Mercado visível no Painel e nos Relatórios~~ ✅ 2026-08-30.

**P0 fechado.** Próximo: P1 (C5 onboarding, C6 busca global, C7 taxonomia da análise de fatura, C8) ou os curtos C10/C11/C12.

Curtos e independentes se sobrar tempo: **C10** (tags PWA no template), **C12** (cards na home), **C8** (competência em reserva/renda-extra).

---

## Notas técnicas a respeitar

- Nada de build step, framework ou CDN — JS vanilla, conforme `CLAUDE.md` / `AGENTS.md`.
- Cores sempre via variáveis CSS; sem emoji na navegação.
- Toda página nova: link no menu (`assets/js/nucleo/menu.js`) **e** card na home (`index.html`).
- Mudança de formato de dados exige função de migração **idempotente** + backup antes.
- Novos acessos a `localStorage` passam por `Store` (`assets/js/nucleo/storage.js`); registrar a chave em `Store.CHAVES`.
- Competência de fatura = **mês de vencimento** (decidido 2026-08-30).
- Valor de supermercado e de fatura de cartão entra **uma única vez** nas despesas variáveis.
