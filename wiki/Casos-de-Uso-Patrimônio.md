# Casos de Uso — Patrimônio

Páginas: `balanco-patrimonial.html`, `investimentos.html`, `fgts.html`,
`reserva-emergencia.html`, `carro.html`.

---

## UC-BP-01 — Montar o balanço patrimonial

- **Ator:** usuário
- **Objetivo:** saber o patrimônio líquido (ativos − passivos).
- **Fluxo principal:**
  1. Abre `balanco-patrimonial.html`.
  2. Cadastra **ativos** (conta, investimentos, imóvel, carro…) e **passivos**
     (dívidas, financiamentos…).
  3. A tela soma cada lado e mostra o patrimônio líquido; itens editáveis/removíveis.
- **Dados:** `balanco_patrimonial` (`{ ativos: [], passivos: [] }`).

---

## UC-IN-01 — Acompanhar investimentos

- **Ator:** usuário
- **Objetivo:** consolidar aplicações e sua evolução.
- **Fluxo principal:**
  1. Abre `investimentos.html`.
  2. Cadastra cada investimento (tipo, valor, instituição…).
  3. Com pelo menos um registro, aparece o resumo consolidado.
- **Dados:** `investimentos` (`{ investimentos: [] }`).

---

## UC-FG-01 — Acompanhar o FGTS por conta

- **Ator:** usuário
- **Objetivo:** acompanhar o saldo do FGTS de cada vínculo.
- **Fluxo principal:**
  1. Abre `fgts.html`.
  2. Cadastra uma **conta** por vínculo (apelido, nº da conta, empregador,
     admissão, modalidade de saque `rescisão` ou `aniversário`, depósito mensal,
     ativa/inativa).
  3. Registra **snapshots** periódicos do saldo, tirados do extrato (app FGTS ou
     site da Caixa).
  4. A tela mostra a evolução por conta.
- **Dados:** `fgts` (`{ contas: [ { …, snapshots: [] } ] }`).

---

## UC-RS-01 — Dimensionar e acompanhar a reserva de emergência

- **Ator:** usuário
- **Objetivo:** saber quantos meses de despesa a reserva cobre e o quanto falta.
- **Fluxo principal:**
  1. Abre `reserva-emergencia.html`.
  2. O salário é pré-preenchido com a renda centralizada (`renda_mensal`), quando
     houver.
  3. Informa despesas mensais, nº de meses desejado e valor já guardado.
  4. A tela calcula a meta da reserva e o progresso.
- **Dados:** `reserva_emergencia`, `renda_mensal`.

---

## UC-CR-01 — Gerir manutenções e custo do carro

- **Ator:** usuário
- **Objetivo:** controlar manutenção preventiva, fundo do carro e custo por km.
- **Fluxo principal:**
  1. Abre `carro.html`.
  2. Registra manutenções, abastecimentos e movimentos do **fundo do carro**.
  3. Compara com o **plano preventivo de referência** (`PLANO_PADRAO`, intervalos
     típicos de carro flex — ajustar pelo manual do fabricante).
  4. A tela calcula custo por km e o que está próximo da próxima revisão.
- **Dados:** `carro`.
