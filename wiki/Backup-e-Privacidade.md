# Backup e Privacidade

JS: `assets/js/backup.js`, `assets/js/storage.js`.

---

## UC-BK-01 — Exportar todos os dados

- **Ator:** usuário
- **Objetivo:** ter uma cópia de segurança de tudo que está no navegador.
- **Fluxo principal:**
  1. Aciona "Exportar" (backup).
  2. `montarBackup()` varre **todas as chaves conhecidas** (`Store.CHAVES`) **e**
     qualquer outra chave presente no `localStorage` — nada é esquecido se uma
     página nova criar a própria chave.
  3. Gera um único `.json`: `{ versao, geradoEm, origem, dados }`, com os valores
     como texto puro (fiel ao `localStorage`).
  4. `backup_ultima_data` é atualizada; o alerta de backup dispara após 30 dias.
- **Observação:** se não houver nada guardado, avisa e não gera arquivo.
- **Dados:** todas as chaves, exceto `backup_ultima_data`.

---

## UC-BK-02 — Restaurar a partir de um backup

- **Ator:** usuário
- **Objetivo:** recuperar os dados em outro navegador ou após limpeza de cache.
- **Fluxo principal:**
  1. Seleciona o `.json` exportado.
  2. O conteúdo é escrito de volta chave a chave no `localStorage`.
  3. As telas voltam a exibir o histórico ao recarregar.

---

## UC-BK-03 — Lembrete de backup vencido

- **Ator:** sistema
- **Fluxo principal:** `alertas.js` compara `backup_ultima_data` com hoje; se
  passaram mais de 30 dias (`BACKUP_DIAS_ALERTA`), entra um alerta na central do
  Painel.

---

## Privacidade — o que você precisa saber

- **Nada sai do navegador.** Não há servidor, API, analytics ou tracking. A
  análise de fatura e de contracheque processa o texto localmente.
- Os dados vivem no `localStorage` do domínio onde o site está aberto
  (GitHub Pages ou `file://`). **São por navegador e por máquina.**
- **Limpar os dados do site / o cache do navegador apaga todo o histórico.** Sem
  backup, não há como recuperar.
- Não guarde dados sensíveis que não queira em texto puro no navegador (senhas,
  PINs, tokens). O sistema não pede nada disso.
- Trocar de máquina ou de navegador = exportar em um, restaurar no outro
  (UC-BK-01 / UC-BK-02).
