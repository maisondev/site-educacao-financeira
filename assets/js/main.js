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

// Gera um link para a definição de um termo no glossário.
// `prefixo` ajusta o caminho relativo (páginas em subpastas passam '../' ou '../../').
function linkGlossario(slug, texto, prefixo) {
  const base = prefixo || './';
  return `<a class="link-glossario" href="${base}glossario.html#termo-${slug}" title="Ver no glossário">${texto}</a>`;
}
