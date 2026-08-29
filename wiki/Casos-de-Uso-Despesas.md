# Casos de Uso — Despesas

Páginas: `despesas-fixas.html`, `despesas-variaveis.html`, `mercado.html`,
`envelopes.html`. JS: `despesas-fixas.js`, `despesas-variaveis.js`,
`lancamento-rapido.js`, `mercado.js`, `envelopes.js`, `cadastros-dados.js`.

O **vocabulário de categorias** (água, luz, gás, internet, telefone, streaming,
alimentação, combustível, manutenção, cartão, outro) e as **formas de pagamento**
(Pix, débito, crédito, dinheiro, boleto) são únicos no app, definidos em
`cadastros-dados.js` e ajustáveis em `cadastros.html` (ver
[[Casos de Uso - Referência e Estudos]]).

---

## UC-DF-01 — Cadastrar uma despesa fixa

- **Ator:** usuário
- **Objetivo:** listar contas recorrentes e seus vencimentos.
- **Fluxo principal:**
  1. Abre `despesas-fixas.html`.
  2. Cadastra nome, valor, categoria e **dia de vencimento**.
  3. Pode marcar como oculta (não gera lembrete) e editar/remover.
  4. A lista pode ser ordenada por "próximas" (vencimento mais perto) ou outros
     critérios.
- **Dados:** `despesas_fixas` (`{ salario, despesas: [...] }`).

---

## UC-DF-02 — Marcar uma despesa fixa como paga no mês

- **Ator:** usuário
- **Objetivo:** acompanhar o que já foi pago na competência atual.
- **Fluxo principal:**
  1. Na competência ativa, clica em "pago" na despesa.
  2. O status é gravado por mês (`despesa.meses[competencia].status = 'pago'` com
     `pagoEm`).
  3. Despesas pagas não geram lembrete nem alerta.
- **Dados:** `despesas_fixas`.

---

## UC-DV-01 — Lançar uma despesa variável (formulário)

- **Ator:** usuário
- **Objetivo:** registrar um gasto avulso do mês.
- **Fluxo principal:**
  1. Abre `despesas-variaveis.html`.
  2. Preenche descrição, valor, data e categoria.
  3. O lançamento recebe a `competencia` da data e aparece agrupado por categoria
     (grupos podem ser colapsados; o estado fica em
     `despesas_variaveis_colapsadas`).
- **Dados:** `despesas_variaveis`.

---

## UC-DV-02 — Lançamento rápido em um campo só

- **Ator:** usuário
- **Objetivo:** registrar um gasto do dia digitando `"45,90 mercado"`.
- **Fluxo principal:**
  1. Digita valor + descrição num único campo.
  2. `lancamento-rapido.js` normaliza a descrição e **sugere a categoria** por
     palavras-chave (ex.: "ifood", "posto", "netflix").
  3. Opcionalmente informa estabelecimento, forma de pagamento e horário aproximado.
  4. Cria a despesa variável do dia; a lista permite navegar por mês/dia e
     editar/remover cada item.
- **Dados:** `despesas_variaveis`.

---

## UC-DV-03 — Lançar em Despesas Variáveis a partir da análise de fatura

- **Ator:** usuário
- **Objetivo:** transformar itens de uma fatura já analisada em despesas variáveis.
- **Fluxo principal:** na tela de análise de fatura, usa o botão **Lançar**; ver
  [[Casos de Uso - Cartões|Análise de fatura]].
- **Dados:** `analise_faturas` → `despesas_variaveis`.

---

## UC-ME-01 — Registrar uma compra de supermercado por categoria

- **Ator:** usuário
- **Objetivo:** enxergar onde vai a maior despesa variável da casa e onde dá para
  cortar.
- **Fluxo principal:**
  1. Abre `mercado.html`.
  2. Registra a nota (data, valor, estabelecimento, CPF na nota) e distribui os
     itens pelas categorias de mercado (hortifrúti, carnes e frios, padaria,
     mercearia, bebidas, laticínios, limpeza, etc.).
  3. A tela consolida gasto por categoria e ao longo do tempo.
- **Dados:** `mercado_compras`.

---

## UC-EN-01 — Orçar o mês por envelopes

- **Ator:** usuário
- **Objetivo:** dividir a renda em envelopes e acompanhar quanto sobra em cada um.
- **Fluxo principal:**
  1. Abre `envelopes.html`; informa a renda.
  2. O sistema aloca por envelope conforme o percentual. Padrão (modelo 50/30/20):
     Essenciais 50%, Lazer & Diversão 20%, Educação & Desenvolvimento 10%,
     Aposentadoria 10%, Metas & Investimentos 10%.
  3. Adiciona despesas/investimentos por envelope; vê disponível × gasto em tempo
     real.
  4. Barra de progresso: **amarela** acima de 80%, **vermelha** acima de 100%.
  5. Só o mês corrente é editável; meses fechados ficam só de leitura.
- **Dados:** `envelopes_financeiros`, `renda_mensal`, competência.
