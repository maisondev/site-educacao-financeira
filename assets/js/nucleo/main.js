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
  const script = document.querySelector('script[src$="assets/js/nucleo/main.js"]');
  const base = script
    ? script.getAttribute('src').replace(/assets\/js\/nucleo\/main\.js.*$/, '')
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

// ---------------------------------------------------------------------------
// Acessibilidade dos modais, para todo `.modal` do site de uma vez só, sem
// tocar em cada página: foco preso dentro do modal, Esc fecha, clique no fundo
// fecha, `role="dialog"` + `aria-modal`, e o foco volta para quem abriu.
// Detecta abrir/fechar pelo atributo `hidden` ou pela classe `.ativo`.
// ---------------------------------------------------------------------------
(function modaisAcessiveis() {
  const SEL_FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]),'
    + ' select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const pilha = [];   // modais abertos; o último é o do topo
  let gatilho = null; // quem tinha o foco antes de abrir

  function visivel(el) {
    if (!el || el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  function focaveis(modal) {
    return Array.prototype.filter.call(
      modal.querySelectorAll(SEL_FOCAVEIS),
      el => el.offsetParent !== null || el === document.activeElement
    );
  }

  function aoAbrir(modal) {
    if (pilha.indexOf(modal) !== -1) return;
    if (!pilha.length) gatilho = document.activeElement;
    pilha.push(modal);
    if (!modal.getAttribute('role')) modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const alvo = modal.querySelector('[autofocus]')
      || modal.querySelector('input:not([type="hidden"]), select, textarea')
      || focaveis(modal)[0]
      || modal;
    setTimeout(function () { try { alvo.focus(); } catch (e) {} }, 0);
  }

  function aoFechar(modal) {
    const i = pilha.indexOf(modal);
    if (i === -1) return;
    pilha.splice(i, 1);
    modal.setAttribute('aria-modal', 'false');
    if (!pilha.length && gatilho && typeof gatilho.focus === 'function') {
      try { gatilho.focus(); } catch (e) {}
      gatilho = null;
    }
  }

  function fecharTopo() {
    const modal = pilha[pilha.length - 1];
    if (!modal) return;
    const btn = modal.querySelector('.btn-fechar, [data-fechar-modal], button[onclick^="fechar"]');
    if (btn) { btn.click(); return; }
    modal.setAttribute('hidden', '');
    modal.classList.remove('ativo');
  }

  document.addEventListener('keydown', function (e) {
    if (!pilha.length) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      fecharTopo();
      return;
    }
    if (e.key === 'Tab') {
      const modal = pilha[pilha.length - 1];
      const f = focaveis(modal);
      if (!f.length) { e.preventDefault(); return; }
      const primeiro = f[0];
      const ultimo = f[f.length - 1];
      const ativo = document.activeElement;
      if (e.shiftKey && (ativo === primeiro || !modal.contains(ativo))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (ativo === ultimo || !modal.contains(ativo))) {
        e.preventDefault();
        primeiro.focus();
      }
    }
  });

  // Clique no próprio .modal (o fundo escurecido), não no conteúdo, fecha.
  document.addEventListener('click', function (e) {
    if (pilha.length && e.target === pilha[pilha.length - 1]) fecharTopo();
  });

  function registrar(modal) {
    if (modal.__modalObservado) return;
    modal.__modalObservado = true;
    if (!modal.getAttribute('role')) modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', visivel(modal) ? 'true' : 'false');

    new MutationObserver(function () {
      if (visivel(modal)) aoAbrir(modal);
      else aoFechar(modal);
    }).observe(modal, { attributes: true, attributeFilter: ['hidden', 'class', 'style', 'aria-hidden'] });

    if (visivel(modal)) aoAbrir(modal);
  }

  function varrer() {
    document.querySelectorAll('.modal, .modal-overlay').forEach(registrar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', varrer);
  } else {
    varrer();
  }
})();

// Gera um link para a definição de um termo no glossário.
// `prefixo` ajusta o caminho relativo (páginas em subpastas passam '../' ou '../../').
function linkGlossario(slug, texto, prefixo) {
  const base = prefixo || './';
  return `<a class="link-glossario" href="${base}glossario.html#termo-${slug}" title="Ver no glossário">${texto}</a>`;
}
