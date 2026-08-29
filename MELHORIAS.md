# Oportunidades de Melhoria — Site de Finanças

> **Estado em 2026-08-28 (fim do dia):** 48 páginas HTML (36 na raiz + 9 artigos em `temas/` + 3 calculadoras), 46 scripts, ~15.000 linhas de JS, 100% em `localStorage`.
>
> Critério de ordenação: **utilidade real no gerenciamento das finanças ÷ esforço**. As P0 são as que eu faria amanhã.

---

## Registro do que foi entregue em 2026-08-28

Cerca de 55 commits ao longo do dia. Agrupados por tema:

### Infraestrutura de dados
- **Backup completo** (`assets/js/backup.js`): exporta todo o `localStorage` num `.json` (`financas-backup-AAAA-MM-DD.json`) e restaura com confirmação. Aviso de "sem backup há 30+ dias" no Painel.
- **Camada `Store`** (`assets/js/storage.js`): catálogo único de chaves (`Store.CHAVES`), leitura tolerante a JSON corrompido (`Store.ler` devolve o padrão em vez de quebrar a página) e tratamento de `QuotaExceededError` na escrita. Migração **iniciada** por `dashboard.js`, `relatorios.js`, `saldo-mes.js`, `competencia.js`, `backup.js`.
- **Competência mensal** (`assets/js/competencia.js`): campo `competencia: "AAAA-MM"` em despesas variáveis e receitas, migração idempotente (`migrarCompetencias`), seletor de mês reutilizável (`renderizarSeletorCompetencia`) e ação **"Fechar mês"** — arquiva o retrato em `historico_mensal`, zera os envelopes e mantém tudo reabrível.
- **Envelopes com competência** (`envelopes.html` + `envelopes.js`, *no working tree, ainda não commitado*): seletor de mês, botão "Fechar mês", meses fechados renderizados como retrato **somente leitura** a partir de `historico_mensal`, e bloqueio de lançamento fora do mês corrente. Link "Ver lançamentos do dia" para o lançamento rápido do Painel.

### Painel (dashboard)
- **Saldo projetado do mês** (`saldo-mes.js`): `receitas − despesas fixas − variáveis − faturas − parcelas − dívidas + ajustes = saldo`, com indicadores de **taxa de economia**, **comprometimento com dívidas** e **meses de reserva**.
- **Central de alertas**: cartões (fechamento/vencimento), dívidas, metas com prazo, envelope acima de 100%, reserva abaixo do alvo e mês sem backup — num card fixo.
- **Lançamento rápido**: um único campo (`45,90 mercado`) cria a despesa variável na hora; a lista abre no mês vigente com navegação por mês (setas + "mês atual") e total do mês.

### Novas áreas de acompanhamento
- **Carro** (`carro.html`): histórico de manutenções, plano preventivo por km/tempo, fundo de reserva mensal, custo por km, consumo e dicas de priorização/economia.
- **FGTS** (`fgts.html`): contas de FGTS, registro de saldo por extrato (snapshot) e resumo consolidado.
- **Desapego** (`desapego.html`): itens para vender, com valor esperado.
- **Dívidas** reformulada (`dividas.js`): separa dívidas onerosas de contas de curto prazo, modo parcelado, saldo devedor, débito automático, faturas de cartão read-only, **simulador avalanche × bola de neve** e edição.
- **Cadastros Gerais** (`cadastros.html`): categorias de despesa, formas de pagamento e estabelecimentos reutilizáveis (chave `cadastros_gerais`).
- **Registrato (BCB)** (`registrato.html`): relacionamentos com instituições (CCS), chaves Pix, dívidas e limites (SCR), com envio das dívidas do SCR para o Acompanhador de Dívidas.
- **Saldo Projetado** (`saldo-projetado.html`): página própria com seletor de mês e **ajustes manuais avulsos** por competência (entradas/saídas pontuais que também entram no cálculo do Painel).

### Análise
- **Relatórios** (`relatorios.html` + `graficos.js`): gráficos **SVG puro, sem CDN** de saldo mensal, gasto por categoria e evolução do patrimônio líquido.
- **Análise de fatura** (`analise-fatura.html`): página por categoria; gera manifesto `cartao-<mes>-<ano>.json` na pasta da fatura.
- **Importar cartão de fatura** (`cartoes.html`): botão que lê o manifesto JSON e cadastra/atualiza o cartão (dedup por últimos 4 dígitos + banco).
- **Histórico de contracheques** (`analise-contracheque.html`): ordenação por coluna (competência, bruto, descontos, líquido), linha de média mensal e variação % vs. mês anterior.

### Conteúdo e navegação
- **Roadmap de Estudos** (`roadmap.html`): 14 módulos em 3 etapas (fundamentos → fazer render → construir/proteger patrimônio).
- **Renda Fixa** (`temas/juros-e-investimentos/renda-fixa-para-comecar.html`): artigo comparando ativos e indicando os melhores para reserva e para começar.
- **Glossário** (`glossario.html`): contador fixo de termos, cadastro/edição em `localStorage`, deep-link por âncora e links das páginas de acompanhamento para as definições.
- **Cabeçalho**: data atual + calendário do mês no header; correção do menu hambúrguer nas páginas com nav dinâmico (religa `initMenu` após `menu.js` montar o `.site-nav`).
- **Reserva de emergência** (`reserva-emergencia.html`): campo "onde aportou" com distribuição por local e edição de aportes; guia de onde e como juntar (CDB, conta rendendo, Tesouro Selic).

---

## Backlog anterior — o que sobrou

| # | Item | Status |
|---|------|--------|
| 1 | Backup exportar/importar | ✅ feito |
| 2 | Camada única de storage | ✅ **feito (2026-08-29)** — catálogo com `CADASTROS`/`REGISTRATO`; leitores críticos (`despesas-fixas`, `despesas-variaveis`, `dividas`, `cartoes`, `reserva-emergencia`, `investimentos`, `balanco-patrimonial`, `registrato`, `cadastros-dados`) migrados para `Store.ler`/`Store.gravar` |
| 3 | Saldo do mês no dashboard | ✅ feito |
| 4 | Competência mensal | ✅ base feita — só `despesas_variaveis` e `receitas_lista` têm competência → ampliação em **N8** |
| 5 | Categorias unificadas | ◑ **parcial** — `cadastros.html` cadastra as listas, mas os formulários não as consomem → ver **N3** |
| 6 | Análise de fatura → lançamento automático | ✅ **feito (2026-08-29)** — botão "Lançar em Despesas Variáveis" (N2) |
| 7 | Fluxo de caixa futuro completo | ✗ pendente → detalhado em **N7** |
| 8 | Central de alertas | ✅ feito |
| 9 | Lançamento rápido | ✅ feito |
| 10 | PWA + uso no celular | ✗ pendente → ver **N10** |
| 11 | Gráficos nos relatórios | ✅ feito |
| 12 | Simulador de quitação de dívidas | ✅ feito |

---

## Novo scan — oportunidades (levantadas em 2026-08-28)

### P0 — Fazer amanhã

#### N1. Fechar a migração para `Store` + chaves fora do catálogo (≈1h30) — ✅ FEITO 2026-08-29

> `Store.CHAVES` ganhou `CADASTROS` e `REGISTRATO`. `storage.js` passou a ser carregado em
> despesas-fixas, dividas, cartoes, reserva-emergencia, investimentos, balanco-patrimonial,
> registrato e cadastros. Nove scripts migrados para `Store.ler`/`Store.gravar`. `http.log`
> (não versionado) removido; `*.log` já estava no `.gitignore` (N13 resolvido).
> **Resta:** ~15 scripts menores ainda com `localStorage` direto (lembretes, carro, cursos,
> fluxo-caixa-futuro, hacks-nubank, glossario, renda-extra, desapego, analise-*, cartoes-adicionais…).

**Problema:**
- `Store.CHAVES` **não inclui** `cadastros_gerais` (`assets/js/cadastros-dados.js:6`) nem `registrato_bcb` (`assets/js/registrato.js:6`). O `backup.js` só as pega no *sweep* do `localStorage` se já existirem no momento da exportação — não estão declaradas em lugar nenhum.
- **24 scripts** ainda fazem `localStorage.getItem` + `JSON.parse` sem `try/catch`. Um único JSON corrompido (dado truncado, aba fechada no meio de uma escrita) deixa a página **em branco**. `Store.ler` já resolve isso devolvendo o padrão.
- `const CHAVE_*` como string literal ainda em ~12 arquivos (`despesas-variaveis.js:1-2`, `envelopes.js:3`, `carro.js:4`, `cursos.js:1`, `fluxo-caixa-futuro.js:3`, `lembretes.js:3`, `analise-contracheque.js:3`, `competencia.js:5-6`…), duplicando o catálogo.

**O que fazer:**
- Adicionar `CADASTROS: 'cadastros_gerais'` e `REGISTRATO: 'registrato_bcb'` ao `Store.CHAVES`.
- Migrar por lote os leitores mais críticos para `Store.ler`/`Store.gravar`: `despesas-fixas.js`, `despesas-variaveis.js`, `dividas.js`, `cartoes.js`, `reserva-emergencia.js`, `investimentos.js`, `balanco-patrimonial.js`, `fgts.js`.
- Onde não migrar agora, ao menos apontar `const CHAVE_X = Store.CHAVES.X` (uma linha) em vez da string literal — igual `fgts.js:18` já faz.

**Ganho:** encerra o item 2 do backlog (marcado ✅ sem estar), elimina a classe "página branca por dado ruim" e garante que o backup declara 100% das chaves.

---

#### N2. Análise de fatura → "Lançar em Despesas Variáveis" (≈2h) — ✅ FEITO 2026-08-29

> Botão **"Lançar em Despesas Variáveis"** em `analise-fatura.html` (ao lado de "Salvar análise").
> `afLancarEmDespesas()` cria uma despesa variável por lançamento incluído, com `competencia` = mês
> da fatura e `origem: 'fatura'` + `origemHash` (cartão + data + valor + descrição) para deduplicar
> reimportações. Linhas parceladas (`03/10`) viram registro em `compras_parceladas` com `dataInicio`
> recuada para a 1ª parcela. Correção manual de categoria é gravada em `regras_categorizacao`
> (nova chave no catálogo) e reaplicada em `afCategorizar` nas próximas análises. `analise-fatura.html`
> passou a carregar `storage.js` e `competencia.js`.
> **Resta:** de/para de categorias AF→despesas-variáveis é grosseiro (`AF_PARA_CATEGORIA_DV`,
> muita coisa cai em "outro") — some com o N3.

**Resumo original:**

**Problema:** `analise-fatura.js` categoriza cada linha (`afCategorizar`, `afAlterarCategoria`) e salva a análise em `analise_faturas` (`afGravarTodas:302`), mas **nunca cria despesas**. Todo o trabalho de ler e classificar a fatura é jogado fora e as compras precisam ser redigitadas em `despesas-variaveis.html`. É o maior desperdício de tempo da rotina mensal de faturas registrada na memória (`analise-faturas-cartao.md`).

**O que fazer:**
- Botão **"Lançar em Despesas Variáveis"** perto do `af-salvar` (`analise-fatura.html:484`): cria um lançamento por linha incluída, já com `categoria` escolhida e `competencia` = mês de vencimento da fatura.
- Dedup por `origem: 'fatura'` + hash (cartão + data + valor + descrição) — reimportar a mesma fatura não duplica.
- Detectar parcela no descritivo (`"03/10"`) e mandar para `compras_parceladas` (alimenta o fluxo de caixa futuro) em vez de lançar 1×.
- Guardar cada correção manual de categoria como regra em `regras_categorizacao` (trecho do descritivo → categoria) e aplicar nas próximas análises — `afCategorizar` já é o ponto de entrada.

**Ganho:** a fatura vira lançamento com um clique. Alinha com a rotina: finais 3616/3614, organizado por categoria, HTML+CSV na pasta do mês.

---

#### N3. Categorias unificadas de verdade: formulários lendo `cadastros_gerais` (≈1h30)

**Problema:** `cadastros.html` grava categorias de despesa, formas de pagamento e estabelecimentos em `cadastros_gerais`, mas `despesas-fixas.js`, `despesas-variaveis.js` e `analise-fatura.js` (`afOpcoesCategoria:458`) mantêm listas próprias. Resultado: `relatorios.html` não soma "Alimentação" das três fontes e a análise de fatura sugere categorias que não batem com as das despesas.

**O que fazer:**
- `cadastros-dados.js` expõe `Cadastros.categorias()`, `Cadastros.formasPagamento()`, `Cadastros.estabelecimentos()`.
- Todo `<select>` de categoria passa a montar as opções a partir daí, com *fallback* para uma lista canônica (Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Assinaturas, Dívidas, Investimentos, Outros) quando `cadastros_gerais` estiver vazio. *Seed* inicial com as categorias que já existem espalhadas.
- Relatório novo em `relatorios.html`: **"gasto por categoria no mês"** somando despesas fixas + variáveis + fatura, com comparação com o mês anterior (agora possível pela competência).

**Ganho:** destrava a pergunta "quanto gastei com X somando tudo?" e para de fragmentar o vocabulário a cada página nova.

---

#### N4. "Quanto posso gastar" — disponível ÷ dias restantes (≈40min)

**Problema:** o Painel mostra o saldo do mês inteiro, mas não responde a pergunta mais usada no dia a dia: *"posso gastar quanto hoje?"*

**O que fazer:** uma linha no card de saldo: `(saldo projetado positivo − o que já está reservado) ÷ dias que faltam no mês` → *"R$ 87/dia até 31/ago"*. Reutiliza `calcularSaldoDoMes` (`saldo-mes.js:167`), que já existe. "Reservado" = envelopes de metas + aporte de reserva planejado.

**Ganho:** o número mais prático possível, quase de graça.

---

### P1 — Alto valor, exige um pouco mais de desenho

#### N5. Contracheque do mês vira a renda daquela competência (≈1h)

**Problema:** `analise-contracheque.js` guarda o histórico em `contracheques_historico`, mas o líquido **não** vira a renda da competência. `saldo-mes.js:42` cai no `renda_mensal` (valor único) como *fallback*, então meses com hora extra, 13º ou falta ficam errados no saldo.

**O que fazer:** ao salvar um contracheque com competência AAAA-MM, gravar `renda_mensal_competencia[AAAA-MM] = liquido`; `smReceitasDoMes` passa a preferir esse valor. Remove a redigitação e deixa o saldo correto em meses de salário variável.

---

#### N6. Auditoria de navegação + home com hierarquia (≈1h)

**Problema:**
- Páginas **fora do menu** mas linkadas na home: `parcelas-cartao.html`, `links-uteis.html`, `cartao.html` (esta parece órfã — substituída por `cartoes.html`, mas ainda referenciada por 5 páginas). `ferramentas/calculadora-inflacao.html` não está no menu nem na home. Isso viola a regra do `CLAUDE.md`: "toda página → link no menu **e** card na home".
- `index.html` "Seções Principais" tem ~28 cards planos, sem agrupamento — difícil achar no uso diário.

**O que fazer:**
- Decidir para cada órfã: linkar no `menu.js` ou remover. `cartao.html` provavelmente sai (migrar os 5 links para `cartoes.html`).
- Agrupar os cards da home em **Planejar / Acompanhar / Analisar / Aprender / Referência**, espelhando `menu.js`. Só HTML + um `<h3>` por grupo.

---

#### N7. Fluxo de caixa futuro completo (item 7) (≈1h30)

**Problema:** `fluxo-caixa-futuro.js` projeta despesas fixas + compras parceladas (`CHAVE_COMPRAS:3`), mas ignora `cartoes_financeiros` (faturas em aberto), `dividas` e receitas recorrentes. A projeção de 12 meses fica otimista demais para decidir.

**O que fazer:** somar as três fontes na linha do tempo e pintar de vermelho os meses com saldo projetado negativo — exatamente onde a decisão precisa ser antecipada.

---

#### N8. Competência para envelopes, rendas extras e aportes de reserva (≈2h)

**Problema:** `competencia.js` só migra `COMPETENCIA_FONTES` = despesas variáveis + receitas (linhas 9-12). Envelopes (`registros[]`), `rendas_extras` e aportes de reserva não têm competência, então a comparação mês a mês desses só existe no *snapshot* de `fecharMes`.

**O que fazer:** adicionar `rendas_extras` e os `registros` de envelope às fontes; dar competência aos aportes de reserva. Completa a série temporal e destrava as linhas que faltam nos gráficos de evolução.

---

### P2 — Melhoram a rotina / reduzem risco

#### N9. `registrato.js` e `dividas.js` compartilhando um construtor de dívida (≈1h)

`registrato.js:400 regEnviarParaDividas()` monta objetos de dívida à mão (linhas 433-449) e grava **direto** em `localStorage['dividas']` (linha 454), sem passar por `Store` nem por nenhuma função de `dividas.js`. Se o schema de dívida mudar, o Registrato grava registros desatualizados sem erro. **Fazer:** `dividas.js` expõe `upsertDividasExternas(lista)`; o Registrato chama isso e grava via `Store`.

#### N10. PWA (item 10) (≈1h30)

`manifest.json` + service worker mínimo cacheando os estáticos. Com o backup pronto, o celular pode ser base e restaurar no desktop. Sem framework, ~40 linhas de SW.

#### N11. Página de verificação / testes de fumaça sem framework (≈2h)

`verificacao.html` que carrega todos os módulos e roda *asserts* no navegador (verde/vermelho): migrações idempotentes (rodar 2× não muda nada), `calcularSaldoDoMes` bate com a soma manual de um *fixture*, todas as `Store.CHAVES` legíveis, nenhum `const CHAVE_*` divergente do catálogo. Com 46 scripts, cada refactor de storage hoje arrisca quebrar algo em silêncio.

#### N12. Resumo do mês para impressão / PDF (≈1h)

`@media print` decente em `relatorios.html` e `saldo-projetado.html` + botão "Imprimir resumo do mês". Fecha o ciclo mensal — guardar o PDF na pasta do mês no Drive, como já é a rotina das faturas.

#### N13. Limpeza de repo (≈15min)

`http.log` (0 bytes) está versionado e o `.gitignore` não cobre. Remover + adicionar `*.log`.

#### N14. Foco / Esc / aria nos modais (≈1h)

Modais (`abrirModalDespesa` em envelopes, snapshot em `fgts.html`, etc.) sem *trap* de foco, sem fechar no Esc, sem `aria-modal`. Um par `abrirModal(el)` / `fecharModal(el)` compartilhado resolve para todos de uma vez.

---

## Ordem sugerida para amanhã

1. **N1 (migração `Store`)** — remove o risco que o item 2 deixou pela metade e declara todas as chaves no catálogo.
2. **N2 (fatura → despesas variáveis)** — o maior ganho de rotina, direto na análise mensal de faturas.
3. **N3 (categorias unificadas)** — fecha o loop do `cadastros.html` e destrava o relatório "gasto por categoria somando tudo".

Se sobrar tempo: **N4** (quanto posso gastar) ou **N13** (limpeza) — ambos curtos e independentes.

---

## Notas técnicas a respeitar

- Nada de build step, framework ou CDN — JS vanilla, conforme `CLAUDE.md` / `AGENTS.md`.
- Cores sempre via variáveis CSS; sem emoji na navegação.
- Toda página nova: link no menu (`assets/js/menu.js`) **e** card na home (`index.html`).
- Mudança de formato de dados exige função de migração **idempotente** + backup antes.
- Novos acessos a `localStorage` passam por `Store` (`assets/js/storage.js`); registrar a chave em `Store.CHAVES`.
