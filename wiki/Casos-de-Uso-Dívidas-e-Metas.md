# Casos de Uso — Dívidas e Metas

Páginas: `dividas.html`, `metas.html`. JS: `dividas.js`, `metas.js`.

---

## UC-DI-01 — Cadastrar uma dívida

- **Ator:** usuário
- **Objetivo:** ter o mapa de tudo que se deve.
- **Fluxo principal:**
  1. Abre `dividas.html`.
  2. Cadastra credor, valor total, valor já pago e **tipo**: cartão rotativo,
     parcelamento sem juros, consignado/FGTS, empréstimo pessoal, financiamento,
     cheque especial, empréstimo com amigo ou outro.
  3. A tela calcula o saldo devedor (`valorTotal - valorPago`) e lista as dívidas
     ativas.
- **Dados:** `dividas`.

---

## UC-DI-02 — Registrar um pagamento de dívida

- **Ator:** usuário
- **Objetivo:** abater o saldo devedor.
- **Fluxo principal:**
  1. Abre o modal de pagamento na dívida alvo.
  2. Informa o valor pago; `valorPago` é somado.
  3. Quando `valorPago >= valorTotal`, a dívida sai da lista de ativas.
  4. `alertas.js` avisa de dívidas com vencimento em ≤ 7 dias.
- **Dados:** `dividas`.

---

## UC-MG-01 — Criar uma meta financeira

- **Ator:** usuário
- **Objetivo:** definir um alvo de poupança com prazo.
- **Fluxo principal:**
  1. Abre `metas.html`.
  2. Cadastra título, descrição, valor alvo, valor atual, prazo
     (curto/médio/longo) e data limite.
  3. Salva automaticamente; o card mostra a barra de progresso
     (`valorAtual / valorAlvo`).
- **Dados:** `metas_financeiras` (array de
  `{ id, titulo, descricao, valorAlvo, valorAtual, prazo, data, dataCriacao }`).

---

## UC-MG-02 — Atualizar o valor guardado de uma meta

- **Ator:** usuário
- **Fluxo principal:**
  1. Clica em atualizar na meta.
  2. Informa o novo valor atual; a barra e o percentual recalculam.
- **Dados:** `metas_financeiras`.

---

## UC-MG-03 — Filtrar, ordenar e concluir metas

- **Ator:** usuário
- **Fluxo principal:**
  1. Filtra por prazo, ordena (por valor alvo, etc.) e opta por mostrar/ocultar
     concluídas (estado só de interface, não persistido).
  2. Deleta uma meta com confirmação.
  3. `alertas.js` avisa de metas a ≤ 30 dias da data limite.
- **Dados:** `metas_financeiras`.
