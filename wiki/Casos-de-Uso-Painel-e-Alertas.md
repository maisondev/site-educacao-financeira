# Casos de Uso — Painel e Alertas

Páginas: `dashboard.html` (+ `assets/js/dashboard.js`), componentes de
`assets/js/alertas.js`, `assets/js/lembretes.js` e `assets/js/menu.js`.

---

## UC-PA-01 — Ver o resumo financeiro consolidado

- **Ator:** usuário
- **Objetivo:** entender a situação geral do mês sem abrir cada tela.
- **Pré-condições:** ter usado pelo menos uma das telas de acompanhamento.
- **Fluxo principal:**
  1. Abre `dashboard.html`.
  2. O painel lê `localStorage` de várias páginas (metas, envelopes, cartões,
     despesas fixas e variáveis, reserva, cursos) via `Store`.
  3. Monta cards de resumo: saldo do mês, despesas variáveis do mês corrente,
     progresso das metas, situação da reserva, etc.
  4. Áreas ainda sem dados aparecem como **card vazio** com link de atalho para a
     tela correspondente.
- **Dados:** leitura de `metas_financeiras`, `envelopes_financeiros`, `cartoes`,
  `despesas_fixas`, `despesas_variaveis`, `reserva_emergencia`, `cursos_lista`.

---

## UC-PA-02 — Consultar a central de alertas

- **Ator:** sistema (gera) / usuário (consulta)
- **Objetivo:** ver só o que exige ação nos próximos dias.
- **Fluxo principal:**
  1. `alertas.js` varre cartões, despesas fixas, dívidas, metas e a data do último
     backup.
  2. Classifica cada item por severidade: **crítico** (0), **atenção** (1),
     **info** (2) e ordena.
  3. Regras de antecedência: cartão e despesa fixa em ≤ 3 dias, dívida em ≤ 7 dias,
     meta em ≤ 30 dias do prazo, backup com mais de 30 dias.
  4. Cada alerta traz título, detalhe (ex.: "Dia 10 de cada mês"), link e rótulo
     do link ("hoje", "amanhã", "em 5 dias", "há 3 dias").
- **Dados:** `cartoes`, `despesas_fixas`, `dividas`, `metas_financeiras`,
  `backup_ultima_data`.

---

## UC-PA-03 — Ver próximos eventos pelo sino de notificações

- **Ator:** usuário
- **Objetivo:** conferir vencimentos e fechamentos sem sair da página atual.
- **Fluxo principal:**
  1. Em qualquer página, clica no ícone de sino no cabeçalho.
  2. `lembretes.js` gera os eventos dos próximos 30 dias: vencimento de despesas
     fixas (dia do mês, ignorando as ocultas e as já pagas) e
     fechamento/vencimento de cartões.
  3. O dropdown lista até 10 eventos, com destaque **HOJE** / **AMANHÃ**.
  4. O badge do sino mostra o total de eventos.
- **Dados:** `cartoes`, `despesas_fixas`.

---

## UC-PA-04 — Consultar o calendário do cabeçalho

- **Ator:** usuário
- **Objetivo:** situar-se no mês e navegar entre meses.
- **Fluxo principal:**
  1. Clica no botão de data (mostra "seg, 01 set").
  2. Abre um mini calendário com o mês atual e o dia de hoje destacado.
  3. Navega com `‹` / `›`; "Voltar para hoje" reseta o offset.
- **Dados:** nenhum (só data do sistema).
