# Como publicar esta wiki no GitHub

O GitHub só cria o repositório Git da wiki (`.wiki.git`) **depois que a primeira
página existe**. Não há API para isso — tem que ser 1 clique no site.

## Passo 1 — criar a primeira página (uma vez)

1. Abra: https://github.com/maisondev/site-educacao-financeira/wiki
2. Clique em **Create the first page**.
3. Pode deixar o conteúdo padrão e clicar em **Save page**. (Vamos sobrescrever.)

## Passo 2 — enviar todas as páginas

No terminal, na raiz do projeto:

```bash
git clone https://github.com/maisondev/site-educacao-financeira.wiki.git ../wiki-remote
cp wiki/*.md ../wiki-remote/
cd ../wiki-remote
rm -f PUBLICAR.md
git add -A
git commit -m "Wiki: casos de uso do sistema"
git push
```

Pronto. As páginas ficam em
`https://github.com/maisondev/site-educacao-financeira/wiki`.

## Atualizações futuras

Edite os `.md` em `wiki/` deste repositório, repita o Passo 2 (o `git clone` vira
`git pull` se a pasta `../wiki-remote` já existir).

## Nomes de arquivo ↔ títulos

O GitHub troca `-` por espaço no título e usa `_Sidebar.md` como menu lateral.
Os links `[[Página]]` já estão no padrão do GitHub Wiki.
