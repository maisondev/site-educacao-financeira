# Casos de Uso — Análises e Relatórios

Páginas: `relatorios.html`, `saldo-projetado.html`, e o cálculo compartilhado de
`assets/js/saldo-mes.js` (usado no Painel). Gráficos em SVG puro: `graficos.js`.

---

## UC-AN-01 — Gerar o relatório mensal

- **Ator:** usuário
- **Objetivo:** ter uma visão fechada do mês em uma página.
- **Fluxo principal:**
  1. Abre `relatorios.html`.
  2. `gerarRelatorio()` monta as seções:
     - **Resumo financeiro** — salário líquido, despesas fixas, disponível,
       dívidas ativas.
     - **Gasto por categoria** — a partir das despesas variáveis, no vocabulário
       único de categorias.
     - **Despesas fixas**, **dívidas**, **reserva** e **cartão**.
  3. Valores formatados em BRL.
- **Dados:** leitura de `despesas_fixas`, `despesas_variaveis`, `dividas`,
  `reserva_emergencia`, `cartoes`.

---

## UC-AN-02 — Responder "sobra ou falta dinheiro este mês?" (Saldo do Mês)

- **Ator:** usuário
- **Objetivo:** consolidar receitas e todas as saídas previstas da competência.
- **Fluxo principal:**
  1. O cálculo (`saldo-mes.js`) roda no Painel e alimenta o Saldo Projetado.
  2. **Receitas do mês:** lançamentos de `receitas_lista` na competência → senão
     contracheque da competência (`renda_por_competencia`) → senão, se for mês
     passado, `0` → senão `renda_mensal`.
  3. Soma rendas extras ativas a partir do mês de início.
  4. Subtrai despesas fixas e variáveis da competência, e demais saídas previstas.
  5. Resultado: saldo do mês (e a linha "quanto posso gastar por dia" no card de
     saldo).
- **Dados:** `receitas_lista`, `renda_por_competencia`, `renda_mensal`,
  `rendas_extras`, `despesas_fixas`, `despesas_variaveis`.

---

## UC-AN-03 — Ajustar o Saldo Projetado com entradas/saídas avulsas

- **Ator:** usuário
- **Objetivo:** simular o mês somando itens pontuais (ex.: "presente de
  aniversário").
- **Fluxo principal:**
  1. Abre `saldo-projetado.html`.
  2. Reaproveita o cálculo do Saldo do Mês e adiciona **ajustes** por mês
     (tipo entrada/saída, descrição, valor).
  3. Os ajustes são gravados na mesma chave que o Painel lê, então também aparecem
     lá.
  4. Cada ajuste pode ser editado/removido; navegação por competência.
- **Dados:** `saldo_ajustes` (`{ [competencia]: [ { tipo, descricao, valor } ] }`).

---

## UC-AN-04 — Visualizar gráficos

- **Ator:** usuário
- **Objetivo:** enxergar tendência e magnitude sem tabelas.
- **Fluxo principal:** `graficos.js` desenha em SVG puro:
  - **Saldo mensal** → colunas divergentes (acima/abaixo de zero).
  - **Gasto por categoria** → barras horizontais ordenadas.
  - **Patrimônio líquido** → linha de tendência.
  - Paleta validada para daltonismo (azul × vermelho).
- **Dados:** derivados das telas acima.
