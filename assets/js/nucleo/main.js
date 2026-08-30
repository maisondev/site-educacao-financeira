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

// ---------------------------------------------------------------------------
// Busca global (Ctrl/Cmd+K): paleta que pula direto para qualquer página do
// site. A lista vem de MENU_ITEMS (navegacao.js) + alguns atalhos com
// sinônimos ("IPVA", "gasolina", "fatura"...). Sem índice remoto.
// ---------------------------------------------------------------------------
(function buscaGlobal() {
  if (typeof MENU_ITEMS === 'undefined') return;

  // Atalhos: termos que o usuário pesquisa mas não são o nome de uma página.
  const ATALHOS = [
    { label: 'IPVA / licenciamento / seguro do carro', href: './carro.html', tags: 'ipva licenciamento seguro dpvat multa detran documento' },
    { label: 'Gasolina / abastecimento / etanol', href: './carro.html', tags: 'gasolina etanol alcool combustivel abastecer posto paridade' },
    { label: 'Fatura / limite / vencimento do cartão', href: './cartoes.html', tags: 'fatura limite vencimento fechamento cartao credito' },
    { label: 'Analisar fatura (PDF/CSV)', href: './analise-fatura.html', tags: 'analise fatura pdf csv categorizar lancamentos extrato' },
    { label: 'Supermercado / compras do mês', href: './mercado.html', tags: 'supermercado mercado compras feira atacado nota lista' },
    { label: 'Quanto posso gastar hoje', href: './dashboard.html', tags: 'quanto posso gastar saldo dia painel' },
    { label: 'Contracheque / holerite', href: './analise-contracheque.html', tags: 'contracheque holerite salario liquido provento desconto' },
    { label: 'Reserva de emergência', href: './reserva-emergencia.html', tags: 'reserva emergencia colchao seguranca' },
    { label: 'Fechar o mês / competência', href: './dashboard.html', tags: 'fechar mes competencia retrato arquivar' },
    { label: 'Backup / exportar dados', href: './dashboard.html', tags: 'backup exportar importar json salvar dados drive' },
    { label: 'Dívidas / parcelas em aberto', href: './dividas.html', tags: 'divida parcela emprestimo financiamento credor juros' }
  ];

  const semAcento = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function construirIndice() {
    const itens = [];
    const vistos = new Set();
    const add = (label, href, grupo, tags) => {
      if (!href || !label) return;
      const chave = href + '|' + label;
      if (vistos.has(chave)) return;
      vistos.add(chave);
      itens.push({ label, href, grupo: grupo || '', busca: semAcento(label + ' ' + (grupo || '') + ' ' + (tags || '')) });
    };
    MENU_ITEMS.forEach(item => {
      add(item.label, item.href, 'Menu');
      (item.submenu || []).forEach(sub => add(sub.label, sub.href, item.label));
    });
    ATALHOS.forEach(a => add(a.label, a.href, 'Atalho', a.tags));
    return itens;
  }

  const INDICE = construirIndice();
  let overlay, campo, lista, dica;
  let filtrados = [];
  let ativo = 0;

  function filtrar(termo) {
    const q = semAcento(termo).trim();
    if (!q) {
      return INDICE.filter(i => i.grupo === 'Atalho' || i.grupo === 'Menu').slice(0, 8);
    }
    const tokens = q.split(/\s+/);
    const casa = INDICE.filter(i => tokens.every(t => i.busca.includes(t)));
    return casa.sort((a, b) => {
      const la = semAcento(a.label), lb = semAcento(b.label);
      return (lb.startsWith(q) - la.startsWith(q)) || (la.indexOf(q) - lb.indexOf(q)) || la.localeCompare(lb);
    }).slice(0, 8);
  }

  function hrefFinal(href) {
    return (typeof resolverHref === 'function') ? resolverHref(href) : href;
  }

  function escapar(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  function renderLista() {
    if (!filtrados.length) {
      lista.innerHTML = '<li class="busca-global-vazio">Nada encontrado.</li>';
      return;
    }
    lista.innerHTML = filtrados.map((i, n) => `
      <li class="busca-global-item${n === ativo ? ' ativo' : ''}" data-n="${n}">
        <span class="busca-global-label">${escapar(i.label)}</span>
        <span class="busca-global-grupo">${escapar(i.grupo)}</span>
      </li>`).join('');
  }

  function atualizar() {
    filtrados = filtrar(campo.value);
    ativo = 0;
    renderLista();
  }

  function irPara(n) {
    const alvo = filtrados[n];
    if (!alvo) return;
    fechar();
    window.location.href = hrefFinal(alvo.href);
  }

  function construirOverlay() {
    if (overlay) return;
    if (!document.getElementById('busca-global-estilo')) {
      const estilo = document.createElement('style');
      estilo.id = 'busca-global-estilo';
      estilo.textContent = `
        .busca-global { position: fixed; inset: 0; z-index: 9999; display: flex;
          align-items: flex-start; justify-content: center; padding-top: 12vh;
          background: rgba(0,0,0,.45); }
        .busca-global[hidden] { display: none; }
        .busca-global-caixa { width: min(560px, 92vw); background: var(--cor-fundo, #fff);
          border-radius: var(--border-radius, 8px); box-shadow: 0 12px 40px rgba(0,0,0,.28);
          overflow: hidden; }
        .busca-global-input { width: 100%; box-sizing: border-box; border: 0;
          border-bottom: 1px solid var(--cor-borda, #e0e0e0); padding: 16px 18px;
          font-size: 16px; color: var(--cor-texto, #1d1d1d); background: transparent; }
        .busca-global-input:focus { outline: none; }
        .busca-global-lista { list-style: none; margin: 0; padding: 6px; max-height: 46vh; overflow-y: auto; }
        .busca-global-item { display: flex; justify-content: space-between; align-items: center;
          gap: 12px; padding: 10px 12px; border-radius: 6px; cursor: pointer; }
        .busca-global-item.ativo, .busca-global-item:hover { background: var(--cor-primaria, #4a154b); }
        .busca-global-item.ativo .busca-global-label,
        .busca-global-item:hover .busca-global-label,
        .busca-global-item.ativo .busca-global-grupo,
        .busca-global-item:hover .busca-global-grupo { color: #fff; }
        .busca-global-label { font-size: 14px; color: var(--cor-texto, #1d1d1d); }
        .busca-global-grupo { font-size: 12px; color: var(--cor-texto-light, #6b6b6b); white-space: nowrap; }
        .busca-global-vazio { padding: 14px 12px; font-size: 14px; color: var(--cor-texto-light, #6b6b6b); }
        .busca-global-dica { margin: 0; padding: 8px 14px; font-size: 12px;
          color: var(--cor-texto-light, #6b6b6b); border-top: 1px solid var(--cor-borda, #e0e0e0); }
        .btn-busca-global { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
          white-space: nowrap; background: none; border: 0; border-radius: 6px; padding: 4px 8px;
          font-size: 16px; line-height: 1; color: inherit; cursor: pointer; opacity: .85; }
        .btn-busca-global:hover { opacity: 1; background: rgba(255,255,255,.12); }
      `;
      document.head.appendChild(estilo);
    }

    overlay = document.createElement('div');
    overlay.className = 'busca-global';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="busca-global-caixa" role="dialog" aria-modal="true" aria-label="Buscar página">
        <input type="search" class="busca-global-input" placeholder="Buscar página… (ex.: IPVA, fatura, metas)"
          autocomplete="off" spellcheck="false" aria-label="Buscar página">
        <ul class="busca-global-lista"></ul>
        <p class="busca-global-dica">↑ ↓ navegar &nbsp;·&nbsp; Enter abrir &nbsp;·&nbsp; Esc fechar</p>
      </div>`;
    document.body.appendChild(overlay);

    campo = overlay.querySelector('.busca-global-input');
    lista = overlay.querySelector('.busca-global-lista');
    dica = overlay.querySelector('.busca-global-dica');

    campo.addEventListener('input', atualizar);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
    lista.addEventListener('click', (e) => {
      const li = e.target.closest('.busca-global-item');
      if (li) irPara(parseInt(li.dataset.n, 10));
    });
    campo.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); ativo = Math.min(ativo + 1, filtrados.length - 1); renderLista(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); ativo = Math.max(ativo - 1, 0); renderLista(); }
      else if (e.key === 'Enter') { e.preventDefault(); irPara(ativo); }
      else if (e.key === 'Escape') { e.preventDefault(); fechar(); }
    });
  }

  let focoAnterior = null;

  function abrir() {
    construirOverlay();
    focoAnterior = document.activeElement;
    overlay.hidden = false;
    campo.value = '';
    atualizar();
    campo.focus();
  }

  function fechar() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    if (focoAnterior && typeof focoAnterior.focus === 'function') focoAnterior.focus();
  }

  function alternar() {
    if (overlay && !overlay.hidden) fechar();
    else abrir();
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      alternar();
      return;
    }
    if (e.key === '/' && !(e.ctrlKey || e.metaKey || e.altKey)) {
      const alvo = e.target;
      const digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);
      if (!digitando) { e.preventDefault(); abrir(); }
    }
  });

  // Botão discreto no topo, ao lado do sino de notificações.
  function adicionarBotao() {
    const nav = document.querySelector('nav');
    if (!nav || nav.querySelector('.btn-busca-global')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-busca-global';
    const atalho = navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K';
    btn.title = `Buscar página (${atalho})`;
    btn.setAttribute('aria-label', btn.title);
    btn.textContent = '🔎';
    const notif = nav.querySelector('.notificacoes-container');
    if (notif) nav.insertBefore(btn, notif);
    else nav.appendChild(btn);
    btn.addEventListener('click', abrir);
  }

  // Espera o menu.js montar o <nav> (ele também roda no DOMContentLoaded) antes
  // de encaixar o botão ao lado do sino.
  const agendarBotao = () => setTimeout(adicionarBotao, 0);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', agendarBotao);
  } else {
    agendarBotao();
  }
})();
