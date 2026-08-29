# Casos de Uso — Referência e Estudos

Cobre a base de conhecimento e as listas de apoio.

Páginas: `temas/`, `roadmap.html`, `glossario.html`, `livros.html`,
`pensadores.html`, `maximas.html`, `cursos.html`, `links-uteis.html`,
`cadastros.html`, `registrato.html`, `desapego.html`,
`ferramentas/calculadora-*.html`.

---

## UC-ES-01 — Estudar um tema do básico ao avançado

- **Ator:** usuário
- **Objetivo:** aprender um assunto (orçamento pessoal, reserva de emergência,
  juros e investimentos, renda fixa).
- **Fluxo principal:**
  1. Abre `temas/index.html` ou o Roadmap de Estudos (`roadmap.html`).
  2. Escolhe o tema e o artigo pelo nível (badge básico/intermediário/avançado).
  3. Cada artigo segue a estrutura didática: conceito → exemplo prático → por quê →
     grande máxima → aplicação prática → resumo em 1 frase.
  4. "Próximos passos" liga para o próximo artigo da jornada.
- **Dados:** nenhum (conteúdo estático).

---

## UC-ES-02 — Consultar glossário, máximas, livros e pensadores

- **Ator:** usuário
- **Objetivo:** consulta rápida de um termo, princípio, livro ou autor.
- **Fluxo principal:**
  - `glossario.html` — termos com definição e exemplo, por categoria.
  - `maximas.html` — princípios fundamentais memoráveis.
  - `livros.html` — grandes livros (resumo + ensinamentos).
  - `pensadores.html` — grandes nomes (princípios de cada um).
- **Dados:** conteúdo embutido nos respectivos `.js`.

---

## UC-ES-03 — Registrar cursos estudados

- **Ator:** usuário
- **Objetivo:** manter o histórico de cursos e o progresso.
- **Fluxo principal:**
  1. Abre `cursos.html`.
  2. Cadastra curso (título, fonte, status) e filtra por status.
- **Dados:** `cursos_lista`.

---

## UC-RF-01 — Manter os cadastros gerais (vocabulário do app)

- **Ator:** usuário
- **Objetivo:** ajustar as listas que alimentam os `<select>` de todas as telas.
- **Fluxo principal:**
  1. Abre `cadastros.html`.
  2. Edita **categorias de despesa**, **formas de pagamento** e **estabelecimentos**.
  3. Padrões embutidos não podem ser removidos; chaves antigas continuam para não
     orfanar registros já salvos.
- **Dados:** `cadastros_gerais`.

---

## UC-RF-02 — Guardar os dados do Registrato (Banco Central)

- **Ator:** usuário
- **Objetivo:** ter à mão o resumo dos relatórios do Registrato do BCB.
- **Fluxo principal:**
  1. Abre `registrato.html`.
  2. Registra/edita: Relacionamentos (CCS), Chaves Pix e Empréstimos e
     Financiamentos (SCR), além da data de emissão.
  3. Vem com dados iniciais de exemplo, editáveis.
- **Dados:** `registrato_bcb`.

---

## UC-RF-03 — Controlar itens de desapego

- **Ator:** usuário
- **Objetivo:** transformar objetos parados em venda, troca, doação, conserto ou
  descarte.
- **Fluxo principal:**
  1. Abre `desapego.html`.
  2. Cadastra o item e a ação pretendida; filtra por status.
- **Dados:** `desapego_itens`.

---

## UC-FE-01 — Usar as calculadoras

- **Ator:** usuário
- **Objetivo:** simular cenários simples.
- **Fluxo principal:**
  - **Juros compostos** — aporte inicial + aportes mensais + taxa + prazo → montante
    mês a mês, em BRL.
  - **Juros simples** — cálculo linear.
  - **Correção pela inflação** — atualiza um valor por um índice no período.
- **Dados:** nenhum (cálculo em memória).
