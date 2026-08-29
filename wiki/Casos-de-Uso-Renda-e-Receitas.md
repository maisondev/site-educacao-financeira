# Casos de Uso — Renda e Receitas

Páginas: `receitas.html`, `renda-extra.html`, `analise-contracheque.html`.
JS: `receitas.js`, `renda-extra.js`, `analise-contracheque.js`, `config.js`,
`competencia.js`.

---

## UC-RE-01 — Registrar uma receita no extrato

- **Ator:** usuário
- **Objetivo:** manter o histórico de tudo que entrou.
- **Fluxo principal:**
  1. Abre `receitas.html`.
  2. Preenche descrição, valor, data e tipo: salário, férias, 13º, bônus/PLR,
     diferença salarial/ACT, restituição IR, venda ou outro.
  3. Salva; o lançamento recebe a `competencia` da data.
  4. A lista mostra as receitas do mês em foco (seletor global de competência).
- **Dados:** `receitas_lista`.

---

## UC-RE-02 — Cadastrar uma renda extra recorrente

- **Ator:** usuário
- **Objetivo:** contar uma entrada recorrente (freela, aluguel, etc.) a partir de
  um mês de início.
- **Fluxo principal:**
  1. Abre `renda-extra.html`.
  2. Cadastra nome, valor e mês de início; pode editar ou remover depois.
  3. Rendas extras ativas entram como entrada recorrente no [[Casos de Uso - Análises e Relatórios|Saldo do Mês]]
     a partir do mês de início.
- **Dados:** `rendas_extras`.

---

## UC-RE-03 — Analisar um contracheque

- **Ator:** usuário
- **Objetivo:** entender bruto, descontos e líquido de um mês e guardar o histórico.
- **Fluxo principal:**
  1. Abre `analise-contracheque.html`.
  2. Informa/cola os dados do contracheque (proventos e descontos) e a competência.
  3. O sistema calcula totais e aplica a **tabela progressiva de IRRF vigente em
     2026** (`TABELA_IRRF_2026`) para conferência.
  4. Salva no histórico; a tabela pode ser ordenada por competência, bruto,
     descontos ou líquido.
- **Dados:** `contracheques_historico`.

---

## UC-RE-04 — Fazer o contracheque virar a renda daquele mês

- **Ator:** usuário
- **Objetivo:** acertar meses de salário variável (hora extra, 13º, falta) sem
  redigitar em cada tela.
- **Fluxo principal:**
  1. Ao salvar um contracheque, o líquido daquela competência é gravado em
     `renda_por_competencia` (`{ "AAAA-MM": líquido }`).
  2. Telas de saldo passam a usar esse valor real para o mês, inclusive meses
     passados.
- **Dados:** `renda_por_competencia`, `renda_mensal`, `renda_mensal_competencia`.

---

## UC-RE-05 — Definir a renda mensal padrão

- **Ator:** usuário
- **Objetivo:** ter um valor de renda usado como base quando não há lançamento de
  receita nem contracheque no mês.
- **Fluxo principal:**
  1. Informa a renda mensal (em Envelopes, Reserva ou config).
  2. `config.js` grava `renda_mensal` e, opcionalmente, a competência de origem.
  3. Regra de fallback do Saldo do Mês: receitas do mês → senão contracheque da
     competência → senão, se for mês passado, `0` → senão `renda_mensal`.
- **Dados:** `renda_mensal`, `renda_mensal_competencia`.
