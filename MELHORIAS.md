# Oportunidades de Melhoria — Site de Finanças

Levantamento feito em 2026-08-28 sobre o estado atual do projeto (29 páginas, 30 scripts, ~8.100 linhas de JS, tudo em `localStorage`).

O critério de ordenação é **utilidade real no gerenciamento das finanças ÷ esforço**. As P0 são as que eu faria amanhã.

---

## P0 — Fazer amanhã

### 1. ✅ Backup / Exportar / Importar todos os dados (≈1h) — feito em 2026-08-28

**Problema:** hoje 100% dos dados vivem no `localStorage` do navegador. Limpar cache, trocar de máquina, usar o celular ou o Chrome resetar o site = perda total do histórico financeiro. Não existe nenhuma saída de dados no projeto.

**O que fazer:**
- Criar `assets/js/backup.js` com:
  - `exportarTudo()` — varre a lista de chaves conhecidas e gera um `.json` para download (`financas-backup-AAAA-MM-DD.json`).
  - `importarTudo(arquivo)` — lê o JSON, valida a versão, pede confirmação e restaura.
- Adicionar a seção "Backup" em `dashboard.html` (ou uma página `configuracoes.html`) com dois botões: **Exportar dados** e **Importar backup**.
- Guardar `backup_ultima_data` e mostrar aviso no dashboard quando passar de 30 dias sem backup.

**Chaves a incluir no backup** (levantadas do código):

```
renda_mensal, renda_mensal_competencia, receitas_lista, contracheques_historico,
rendas_extras, despesas_fixas, despesas_variaveis, envelopes_financeiros,
metas_financeiras, dividas, investimentos, balanco_patrimonial, reserva_emergencia,
cartoes, cartoes_financeiros, cartao_credito, cartoes_adicionais_dados,
compras_parceladas, hacks_nubank_dados, cursos_lista
```

> Isso é pré-requisito para quase todo o resto — sem backup, qualquer refatoração de formato de dados vira risco.

---

### 2. ✅ Camada única de storage (`assets/js/storage.js`) (≈1h) — feito em 2026-08-28

**Problema:** cada script reimplementa `getItem` + `JSON.parse` + `try/catch`, e três arquivos diferentes declaram a **mesma global `CHAVE_STORAGE`** (`assets/js/metas.js:3`, `assets/js/envelopes.js:3`, `assets/js/renda-extra.js:3`). Como não há módulos ES, se duas dessas páginas carregarem o mesmo par de scripts, ocorre conflito de declaração. As chaves também estão espalhadas como strings soltas (`assets/js/relatorios.js:282-297`, `assets/js/dashboard.js:11-71`).

**O que fazer:**
- `storage.js` com `Store.ler(chave, padrao)`, `Store.gravar(chave, valor)` e `Store.CHAVES = {...}` (catálogo único de nomes).
- Migrar os módulos para usar `Store` — pode ser incremental, começando por `dashboard.js` e `relatorios.js`, que são os que mais leem dados de terceiros.
- Tratar JSON corrompido devolvendo o padrão em vez de quebrar a página, e capturar `QuotaExceededError` na escrita com aviso ao usuário.

**Ganho:** habilita backup, competência mensal e dashboard consolidado sem retrabalho.

---

### 3. Dashboard com o número que importa: saldo do mês (≈1h30)

**Problema:** `dashboard.js` só lê metas, envelopes, cartões, despesas fixas, despesas variáveis, reserva e cursos. Ele **ignora receitas, rendas extras, dívidas, investimentos e parcelas de cartão**. Ou seja, a tela inicial não responde à pergunta mais útil: *"sobra ou falta dinheiro este mês?"*

**O que fazer:** um bloco no topo do dashboard com:

```
  Receitas do mês (renda + rendas extras)        R$ x
– Despesas fixas do mês                          R$ x
– Despesas variáveis lançadas no mês             R$ x
– Faturas de cartão que vencem no mês            R$ x
– Parcelas de compras parceladas do mês          R$ x
– Dívidas com vencimento no mês                  R$ x
= SALDO PROJETADO DO MÊS                         R$ x   (verde/vermelho)
```

Mais três indicadores de saúde: **taxa de poupança** (% da renda que sobrou), **comprometimento com dívidas** (% da renda — alerta acima de 30%) e **meses de reserva** (reserva ÷ despesa mensal média).

---

## P1 — Alto valor, exige um pouco mais de desenho

### 4. Competência mensal (fechamento de mês) (≈3h)

**Problema:** o modelo de dados é "estado atual", não série temporal. Despesas variáveis, envelopes e receitas não têm um mês de referência consistente, então não dá para responder *"quanto gastei em julho vs agosto?"* nem gerar tendência. Só `renda_mensal_competencia` e `contracheques_historico` têm noção de tempo.

**O que fazer:**
- Padronizar um campo `competencia: "AAAA-MM"` em todo lançamento novo (despesas variáveis, receitas, rendas extras, aportes).
- Seletor de mês global (no header ou no dashboard) que filtra as páginas.
- Ação "Fechar mês": congela o mês, arquiva em `historico_mensal`, zera os envelopes e replica as despesas fixas para o mês seguinte.
- Migração: lançamentos sem `competencia` herdam o mês da `dataCriacao`.

**Ganho:** desbloqueia gráficos de evolução, comparação mês a mês e média móvel de gastos — hoje impossíveis.

---

### 5. Categorias unificadas (≈2h)

**Problema:** despesas fixas, despesas variáveis e a análise de fatura usam vocabulários de categoria independentes. Por isso `relatorios.html` não consegue dizer *"gastei R$ X com alimentação somando tudo"*.

**O que fazer:**
- `assets/js/categorias.js` com lista canônica (Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Assinaturas, Dívidas, Investimentos, Outros), cada uma com ícone e cor.
- Usar o mesmo `<select>` em todos os formulários de lançamento.
- Relatório novo: **gasto por categoria no mês**, com barra de participação e comparação com o mês anterior.

---

### 6. Análise de fatura → lançamento automático (≈2h)

**Problema:** `analise-fatura.html` analisa, mas não persiste o resultado — o trabalho de ler a fatura é jogado fora e as compras precisam ser redigitadas.

**O que fazer:**
- Ao final da análise, botão **"Lançar em despesas variáveis"**, criando os lançamentos já com categoria sugerida e competência.
- Regras de categorização automática por trecho do descritivo (ex.: contém "IFOOD"/"IFD" → Alimentação), guardadas em `regras_categorizacao` e editáveis — cada correção manual vira uma regra nova.
- Detectar compras parceladas no texto ("03/10") e empurrar para `compras_parceladas`, alimentando o fluxo de caixa futuro.

> Alinha com a rotina já registrada: só cartões finais 3616/3614, organizado por categoria.

---

### 7. Fluxo de caixa futuro completo (≈1h30)

**Problema:** `fluxo-caixa-futuro.js` projeta despesas fixas + compras parceladas, mas não considera as **faturas de cartão em aberto** (`cartoes_financeiros`), as **dívidas** (`dividas`) nem as receitas recorrentes. A projeção de 12 meses fica otimista demais para servir de decisão.

**O que fazer:** somar as três fontes na linha do tempo e destacar visualmente os meses com saldo projetado negativo — exatamente onde a decisão precisa ser tomada com antecedência.

---

## P2 — Melhoram bastante a rotina

### 8. Central de alertas no dashboard (≈1h)

`lembretes.js` já gera eventos de fechamento/vencimento de cartão, mas ficam restritos à página de cartões. Levar para um card fixo no dashboard e ampliar o escopo: meta com prazo vencendo, envelope acima de 100%, reserva abaixo do alvo, dívida com vencimento próximo, mês sem backup.

### 9. Lançamento rápido (≈1h)

Um único campo no dashboard — `45,90 mercado` — que cria a despesa variável na hora, com categoria sugerida. A maior parte das despesas some do controle porque anotar dá trabalho; reduzir isso a um campo é o que mais aumenta a adesão na prática.

### 10. PWA + uso no celular (≈1h30)

`manifest.json` + service worker mínimo para cache dos estáticos. Permite instalar o site na tela inicial do celular e lançar a despesa no momento da compra. **Atenção:** `localStorage` é por dispositivo — o celular teria base separada da do desktop, então isso só faz sentido depois do item 1 (backup/importação como sincronização manual), ou aceitando o celular como base principal.

### 11. Gráficos nos relatórios (≈2h)

Hoje os relatórios são numéricos. Com a competência mensal (item 4) resolvida, valem três gráficos em SVG puro (sem CDN, respeitando a regra de zero dependências): evolução do saldo mensal, pizza de gastos por categoria e evolução do patrimônio líquido.

### 12. Simulador de quitação de dívidas (≈2h)

Em `dividas.html`, comparar as estratégias **avalanche** (maior juros primeiro) e **bola de neve** (menor saldo primeiro), mostrando data de quitação e juros totais economizados em cada uma, dado um valor extra mensal disponível. É a página com maior retorno financeiro direto por hora de implementação.

---

## Sugestão de ordem para amanhã

1. **Item 1 (backup)** — protege tudo que já existe.
2. **Item 2 (storage.js)** — base técnica, elimina o conflito de `CHAVE_STORAGE`.
3. **Item 3 (saldo do mês no dashboard)** — o ganho de utilidade mais visível do dia.

Se sobrar tempo: item 8 (alertas) ou item 9 (lançamento rápido), ambos curtos e independentes.

---

## Notas técnicas a respeitar

- Nada de build step, framework ou CDN — JS vanilla, conforme `CLAUDE.md`.
- Cores sempre via variáveis CSS; sem emoji na navegação.
- Toda página nova: link no menu (`assets/js/menu.js`) **e** card na home.
- Mudança de formato de dados exige função de migração idempotente + backup antes.
