# Guia do Menu Centralizado

## O Problema

Antes, o menu estava hardcoded em HTML em cada página. Isso significava:
- Quando adicionava um novo item, precisava atualizar todas as páginas manualmente
- Risco de inconsistência entre páginas
- Muito trabalho repetitivo

## A Solução

Agora o menu é gerado automaticamente por JavaScript a partir de um arquivo centralizado: `assets/js/nucleo/menu.js`

## Como Usar

### 1. Adicionar um novo item ao menu

Abra `assets/js/nucleo/menu.js` e procure pelo array `MENU_ITEMS`:

```javascript
const MENU_ITEMS = [
  {
    label: 'Início',
    href: './index.html',
    submenu: null
  },
  // ... mais itens ...
];
```

### 2. Adicione seu novo item

Exemplo - adicionar "Blog":

```javascript
{
  label: 'Blog',
  href: './blog/index.html',
  submenu: null
}
```

### 3. Com submenu

Se quiser adicionar um submenu (como em "Aprender"):

```javascript
{
  label: 'Cursos',
  href: './cursos/index.html',
  submenu: [
    { label: 'Iniciante', href: './cursos/iniciante.html' },
    { label: 'Avançado', href: './cursos/avancado.html' }
  ]
}
```

## Estrutura de um Item

```javascript
{
  label: 'Texto que aparece no menu',      // obrigatório
  href: './caminho/relativo/pagina.html',  // obrigatório
  submenu: null                             // null se não tiver submenu
  // OU
  submenu: [
    { label: '...', href: '...' },
    { label: '...', href: '...' }
  ]
}
```

## Onde o Menu é Renderizado

O menu é renderizado automaticamente em qualquer página que:
1. Tenha uma `<nav>` vazia ou com `.site-nav`
2. Inclua os scripts:
   - `assets/js/nucleo/main.js` (lógica de toggle)
   - `assets/js/nucleo/menu.js` (estrutura e renderização)

Exemplo de estrutura mínima:
```html
<header class="site-header">
  <div class="header-container">
    <a href="./index.html" class="logo">Meu Site</a>
    <button class="menu-toggle" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <nav></nav>
  </div>
</header>

<script src="./assets/js/nucleo/main.js"></script>
<script src="./assets/js/nucleo/menu.js"></script>
```

## Vantagens

✅ Edita em um lugar, atualiza em todas as páginas
✅ Sem risco de inconsistência
✅ Fácil manutenção
✅ Sem dependências externas
✅ Funciona com localStorage e páginas estáticas

## Onde a estrutura vive

`MENU_ITEMS` fica em `assets/js/nucleo/navegacao.js` — **fonte única** consumida
tanto pelo menu do topo (`menu.js`) quanto pelo mapa do site no rodapé
(`rodape.js`). Toda página carrega `navegacao.js` antes de `menu.js`/`rodape.js`.

## Dicas

- Mantenha os `href` como caminhos relativos à raiz (começando com `./`)
- `resolverHref()` (em `navegacao.js`) converte o `./` para o contexto da página
  em tempo de execução, então o mesmo item funciona na raiz, em `temas/<tema>/` e
  em `ferramentas/`
- O `<nav>` no HTML fica **vazio** (`<nav></nav>`); o menu é montado por JS
- Teste em páginas em diferentes profundidades (raiz, subpasta, etc)
