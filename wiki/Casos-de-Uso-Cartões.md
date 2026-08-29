# Casos de Uso — Cartões

Páginas: `cartoes.html`, `cartao.html`, `cartoes-adicionais.html`,
`parcelas-cartao.html`, `analise-fatura.html`, `hacks-nubank.html`.
JS correspondentes + `lembretes.js` (eventos de fechamento/vencimento).

---

## UC-CA-01 — Cadastrar um cartão e suas datas

- **Ator:** usuário
- **Objetivo:** ter fechamento e vencimento de cada cartão para gerar lembretes e
  alertas.
- **Fluxo principal:**
  1. Abre `cartoes.html`.
  2. Cadastra nome, últimos 4 dígitos, dia de **fechamento** e dia de **vencimento**.
  3. Pode registrar o **saldo por mês** (`datasPorMes: [{ mes, saldo }]`).
  4. `lembretes.js` e `alertas.js` passam a avisar dos eventos (30 dias / 3 dias).
- **Dados:** `cartoes`.

---

## UC-CA-02 — Acompanhar o saldo dos cartões (resumo)

- **Ator:** usuário
- **Objetivo:** ver rapidamente quanto está aberto em cada cartão.
- **Fluxo principal:**
  1. Abre `cartao.html`.
  2. Cria cartões e lança gastos por cartão; a tela mostra o total aberto do mês.
- **Dados:** `cartoes_financeiros`, `cartao_credito`.

---

## UC-CA-03 — Controlar cartões adicionais

- **Ator:** usuário
- **Objetivo:** saber quanto cada portador adicional gastou.
- **Fluxo principal:**
  1. Abre `cartoes-adicionais.html`.
  2. Cadastra portadores e lança gastos por portador e data.
  3. A tela resume o gasto por portador e o total.
- **Dados:** `cartoes_adicionais_dados`.

---

## UC-CA-04 — Acompanhar compras parceladas no cartão

- **Ator:** usuário
- **Objetivo:** saber quantas parcelas faltam e o impacto por mês.
- **Fluxo principal:**
  1. Abre `parcelas-cartao.html`.
  2. Cadastra a compra: descrição, valor total ou da parcela, nº de parcelas e mês
     inicial.
  3. A tela projeta o valor comprometido em cada mês futuro.
- **Dados:** `compras_parceladas`.

---

## UC-CA-05 — Analisar uma fatura fechada

- **Ator:** usuário
- **Objetivo:** ler a fatura, categorizar os lançamentos e ver para onde foi o
  dinheiro.
- **Pré-condições:** ter o PDF ou o texto da fatura.
- **Fluxo principal:**
  1. Abre `analise-fatura.html`.
  2. Cola/importa o texto da fatura; **todo o processamento roda no navegador**.
  3. O sistema separa os lançamentos, sugere categoria e permite **filtrar por
     cartão**.
  4. Correções manuais de categoria viram **regras aprendidas**
     (`regras_categorizacao`: trecho da descrição → categoria) e se aplicam nas
     próximas faturas.
  5. Botão **Lançar** envia itens para Despesas Variáveis (ver
     [[Casos de Uso - Despesas]]).
  6. A análise é guardada por competência.
- **Dados:** `analise_faturas` (`{ [competencia]: { ...analise } }`),
  `regras_categorizacao`.

---

## UC-CA-06 — Consultar os hacks do Nubank

- **Ator:** usuário
- **Objetivo:** aplicar dicas práticas de otimização (revisar extrato, checar
  reembolsos, etc.).
- **Fluxo principal:**
  1. Abre `hacks-nubank.html`.
  2. Percorre a lista de hacks (título, descrição, categoria, economia estimada) e
     marca os aplicados.
- **Dados:** `hacks_nubank_dados`.
