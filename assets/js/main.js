// Menu responsivo com hambúrguer
document.addEventListener('DOMContentLoaded', initMenu);

let _menuGlobaisRegistrados = false;

function initMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  // O menu é montado dinamicamente por menu.js; se ainda não existe,
  // menu.js chama initMenu() novamente após renderizar.
  if (!menuToggle || !siteNav) return;

  // Toggle menu ao clicar no hambúrguer (evita bind duplicado)
  if (!menuToggle.dataset.bound) {
    menuToggle.dataset.bound = '1';
    menuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
    });
  }

  if (!_menuGlobaisRegistrados) {
    _menuGlobaisRegistrados = true;

    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.site-header')) {
        closeMenu();
      }
    });

    // Fechar menu ao redimensionar para desktop
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    });
  }

  // Submenu mobile
  const menuItems = siteNav.querySelectorAll('.has-submenu > a');
  menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const parent = this.parentElement;
        toggleSubmenu(parent);
      }
    });
  });

  // Fechar menu ao clicar em um link (exceto submenu toggle)
  siteNav.querySelectorAll('a:not(.has-submenu > a)').forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        closeMenu();
      }
    });
  });
}

function toggleMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  menuToggle.classList.toggle('active');
  siteNav.classList.toggle('active');
}

function closeMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  menuToggle.classList.remove('active');
  siteNav.classList.remove('active');

  // Fechar todos os submenus
  siteNav.querySelectorAll('.has-submenu').forEach(item => {
    item.classList.remove('active');
  });
}

function toggleSubmenu(parent) {
  parent.classList.toggle('active');
}

// ---------------------------------------------------------------------------
// PWA: registra o service worker e injeta o manifest onde faltar.
// O caminho da raiz do site é deduzido do src deste próprio main.js, para
// funcionar tanto na raiz quanto em páginas dentro de temas/<tema>/.
// ---------------------------------------------------------------------------
(function inicializarPWA() {
  const script = document.querySelector('script[src$="assets/js/main.js"]');
  const base = script
    ? script.getAttribute('src').replace(/assets\/js\/main\.js.*$/, '')
    : './';

  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = base + 'manifest.json';
    document.head.appendChild(link);
  }
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#4a154b';
    document.head.appendChild(meta);
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(base + 'sw.js', { scope: base })
        .catch((e) => console.warn('Service worker não registrou:', e));
    });
  }
})();

// Gera um link para a definição de um termo no glossário.
// `prefixo` ajusta o caminho relativo (páginas em subpastas passam '../' ou '../../').
function linkGlossario(slug, texto, prefixo) {
  const base = prefixo || './';
  return `<a class="link-glossario" href="${base}glossario.html#termo-${slug}" title="Ver no glossário">${texto}</a>`;
}
