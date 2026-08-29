# Educação Financeira

Uma curadoria pessoal de estudos sobre educação financeira, organizada por tema e por nível (do básico ao avançado). Reúne resumos de cursos e fontes diversas em um só lugar, com algumas ferramentas interativas simples para colocar a mão na massa.

Este não é um curso formal nem um app de controle financeiro — é uma base de conhecimento em construção, atualizada conforme novos estudos são feitos.

## Documentação

Os **casos de uso** de cada tela (ator, objetivo, fluxo e onde os dados são guardados) estão na [Wiki do projeto](https://github.com/maisondev/site-educacao-financeira/wiki). A fonte editável fica em `wiki/`.

## Como está organizado

- **`temas/`** — conteúdo agrupado por assunto (orçamento, reserva de emergência, juros e investimentos, etc.), cada um com artigos do nível básico ao avançado.
- **`ferramentas/`** — calculadoras e utilitários simples em JavaScript puro.
- **`assets/`** — CSS e JS compartilhados por todas as páginas.

## Stack

HTML, CSS e JavaScript puro (vanilla). Sem frameworks, sem bundlers, sem dependências externas. Publicado via GitHub Pages.

## Fontes

O conteúdo é baseado em cursos e materiais estudados pelo autor, com a fonte de origem citada em cada página quando aplicável. Começou com o curso "Organização Financeira" (Nathalia Arcuri), mas cresce com outras fontes ao longo do tempo.

## Como manter o menu atualizado

O menu é centralizado em `assets/js/menu.js`. Sempre que você quer adicionar um novo item ao menu:

1. Abra `assets/js/menu.js`
2. Adicione um novo objeto ao array `MENU_ITEMS` com:
   - `label`: nome que aparece no menu
   - `href`: URL relativa da página
   - `submenu`: array de subitens (ou `null` se não tiver)
3. Salve e pronto! O menu se atualiza automaticamente em todas as páginas.

Exemplo:
```javascript
{
  label: 'Minha Nova Página',
  href: './nova-pagina.html',
  submenu: null
}
```

## Começar a explorar

Abra `index.html` em um navegador (ou publique no GitHub Pages) para começar a explorar os temas.
