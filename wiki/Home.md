# Wiki — Educação Financeira

Curadoria pessoal de estudos em educação financeira **+** um conjunto de ferramentas
de acompanhamento financeiro que roda inteiro no navegador (HTML/CSS/JS puro, sem
back-end, sem dependências). Todos os dados ficam no `localStorage` da máquina do
usuário — nada é enviado para servidor.

Esta wiki documenta os **casos de uso** do sistema: o que cada tela permite fazer,
quem é o ator, qual o objetivo, o fluxo principal e onde os dados são guardados.

## Índice

| Área | Página | O que cobre |
|------|--------|-------------|
| Visão geral | [[Visão Geral e Arquitetura]] | Stack, competência mensal, chaves de `localStorage`, navegação |
| Painel | [[Casos de Uso - Painel e Alertas]] | Dashboard consolidado, central de alertas, notificações, calendário |
| Renda | [[Casos de Uso - Renda e Receitas]] | Receitas, renda extra, contracheque, renda por competência |
| Despesas | [[Casos de Uso - Despesas]] | Despesas fixas, variáveis, lançamento rápido, mercado, envelopes |
| Cartões | [[Casos de Uso - Cartões]] | Cartões, resumo de cartão, adicionais, parcelas, análise de fatura, hacks |
| Dívidas e metas | [[Casos de Uso - Dívidas e Metas]] | Controle de dívidas e metas financeiras |
| Patrimônio | [[Casos de Uso - Patrimônio]] | Balanço patrimonial, investimentos, FGTS, reserva de emergência, carro |
| Análises | [[Casos de Uso - Análises e Relatórios]] | Relatório mensal, saldo do mês, saldo projetado |
| Referência | [[Casos de Uso - Referência e Estudos]] | Temas, roadmap, glossário, livros, pensadores, máximas, cursos, cadastros, Registrato, desapego |
| Dados | [[Backup e Privacidade]] | Exportar/restaurar, o que fica salvo, limpeza de cache |

## Como ler os casos de uso

Cada caso de uso segue o formato:

- **Ator** — quem executa (sempre o usuário; o sistema aparece quando reage sozinho).
- **Objetivo** — a pergunta que a tela responde.
- **Pré-condições** — o que precisa existir antes.
- **Fluxo principal** — passos numerados do caminho feliz.
- **Dados** — chave(s) de `localStorage` e arquivos JS envolvidos.
