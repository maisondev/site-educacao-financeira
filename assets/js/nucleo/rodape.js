// Rodapé centralizado com mapa do site.
// Reaproveita a estrutura de MENU_ITEMS (assets/js/nucleo/menu.js) para não
// duplicar a navegação. Deve ser carregado DEPOIS de menu.js.
//
// Uso: basta incluir <script src="./assets/js/nucleo/rodape.js"></script>.
// Se a página já tiver <footer class="site-footer">, o conteúdo é substituído;
// caso contrário, o rodapé é criado e anexado ao final do <body>.

(function () {
  'use strict';

  var NOTA = 'Conteúdo curado por estudos pessoais em educação financeira. ' +
    'Todos os dados ficam apenas no seu navegador (localStorage).';

  // Descobre o prefixo relativo (./ , ../ , ../../) a partir do src deste script,
  // para funcionar tanto na raiz quanto em temas/<tema>/ ou ferramentas/.
  function descobrirBase() {
    var s = document.querySelector('script[src$="assets/js/nucleo/rodape.js"]');
    if (!s) return './';
    return s.getAttribute('src').replace(/assets\/js\/nucleo\/rodape\.js.*$/, '') || './';
  }

  function ajustarHref(href, base) {
    if (!href) return href;
    if (/^(https?:|mailto:|#)/.test(href)) return href;
    return href.replace(/^\.\//, base);
  }

  function montarMapa(base) {
    if (typeof MENU_ITEMS === 'undefined' || !Array.isArray(MENU_ITEMS)) return '';

    var colunas = [];
    var geral = [];

    MENU_ITEMS.forEach(function (item) {
      if (item.submenu && item.submenu.length) {
        var lis = item.submenu.map(function (sub) {
          return '<li><a href="' + ajustarHref(sub.href, base) + '">' + sub.label + '</a></li>';
        }).join('');
        colunas.push(
          '<div class="rodape-coluna">' +
            '<h3><a href="' + ajustarHref(item.href, base) + '">' + item.label + '</a></h3>' +
            '<ul>' + lis + '</ul>' +
          '</div>'
        );
      } else {
        geral.push('<li><a href="' + ajustarHref(item.href, base) + '">' + item.label + '</a></li>');
      }
    });

    if (geral.length) {
      colunas.unshift(
        '<div class="rodape-coluna"><h3>Geral</h3><ul>' + geral.join('') + '</ul></div>'
      );
    }

    return '<nav class="rodape-mapa" aria-label="Mapa do site">' + colunas.join('') + '</nav>';
  }

  function render() {
    var base = descobrirBase();
    var html =
      '<div class="rodape-conteudo">' +
        montarMapa(base) +
        '<p class="rodape-nota">' + NOTA + '</p>' +
      '</div>';

    var footer = document.querySelector('footer.site-footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'site-footer';
      document.body.appendChild(footer);
    }
    footer.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
