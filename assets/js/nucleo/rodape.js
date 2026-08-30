// Rodapé centralizado com mapa do site.
// Reaproveita MENU_ITEMS e resolverHref() de navegacao.js (carregar antes) para
// não duplicar a navegação.
//
// Uso: basta incluir <script src="./assets/js/nucleo/rodape.js"></script>.
// Se a página já tiver <footer class="site-footer">, o conteúdo é substituído;
// caso contrário, o rodapé é criado e anexado ao final do <body>.

(function () {
  'use strict';

  var NOTA = 'Conteúdo curado por estudos pessoais em educação financeira. ' +
    'Todos os dados ficam apenas no seu navegador (localStorage).';

  function href(h) {
    return typeof resolverHref === 'function' ? resolverHref(h) : h;
  }

  function montarMapa() {
    if (typeof MENU_ITEMS === 'undefined' || !Array.isArray(MENU_ITEMS)) return '';

    var colunas = [];
    var geral = [];

    MENU_ITEMS.forEach(function (item) {
      if (item.submenu && item.submenu.length) {
        var lis = item.submenu.map(function (sub) {
          return '<li><a href="' + href(sub.href) + '">' + sub.label + '</a></li>';
        }).join('');
        colunas.push(
          '<div class="rodape-coluna">' +
            '<h3><a href="' + href(item.href) + '">' + item.label + '</a></h3>' +
            '<ul>' + lis + '</ul>' +
          '</div>'
        );
      } else {
        geral.push('<li><a href="' + href(item.href) + '">' + item.label + '</a></li>');
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
    var html =
      '<div class="rodape-conteudo">' +
        montarMapa() +
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
