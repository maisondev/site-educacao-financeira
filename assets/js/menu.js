// Estrutura centralizada do menu - edite aqui para atualizar em todas as páginas
const MENU_ITEMS = [
  {
    label: 'Painel',
    href: './dashboard.html',
    submenu: null
  },
  {
    label: 'Início',
    href: './index.html',
    submenu: null
  },
  {
    label: 'Aprender',
    href: './temas/index.html',
    submenu: [
      { label: 'Juros e Investimentos', href: './temas/juros-e-investimentos/index.html' },
      { label: 'Renda Fixa: onde deixar a reserva', href: './temas/juros-e-investimentos/renda-fixa-para-comecar.html' },
      { label: 'Orçamento Pessoal', href: './temas/orcamento-pessoal/index.html' },
      { label: 'Reserva de Emergência', href: './temas/reserva-de-emergencia/index.html' }
    ]
  },
  {
    label: 'Acompanhamento',
    href: './metas.html',
    submenu: [
      { label: 'Carro', href: './carro.html' },
      { label: 'Cartões', href: './cartoes.html' },
      { label: 'Despesas Fixas', href: './despesas-fixas.html' },
      { label: 'Despesas Variáveis', href: './despesas-variaveis.html' },
      { label: 'Desapego', href: './desapego.html' },
      { label: 'Dívidas', href: './dividas.html' },
      { label: 'Cartões Adicionais', href: './cartoes-adicionais.html' },
      { label: 'Envelopes', href: './envelopes.html' },
      { label: 'Investimentos', href: './investimentos.html' },
      { label: 'Metas', href: './metas.html' },
      { label: 'Receitas', href: './receitas.html' },
      { label: 'Renda Extra', href: './renda-extra.html' },
      { label: 'Reserva de Emergência', href: './reserva-emergencia.html' }
    ]
  },
  {
    label: 'Análise',
    href: './relatorios.html',
    submenu: [
      { label: 'Balanço Patrimonial', href: './balanco-patrimonial.html' },
      { label: 'Contracheque', href: './analise-contracheque.html' },
      { label: 'Fatura de Cartão', href: './analise-fatura.html' },
      { label: 'Relatórios', href: './relatorios.html' }
    ]
  },
  {
    label: 'Referência',
    href: './glossario.html',
    submenu: [
      { label: 'Grandes Livros', href: './livros.html' },
      { label: 'Grandes Máximas', href: './maximas.html' },
      { label: 'Grandes Nomes', href: './pensadores.html' },
      { label: 'Glossário', href: './glossario.html' },
      { label: 'Meus Cursos', href: './cursos.html' }
    ]
  },
  {
    label: 'Ferramentas',
    href: './ferramentas/calculadora-juros-compostos.html',
    submenu: [
      { label: 'Hacks Nubank', href: './hacks-nubank.html' },
      { label: 'Juros Compostos', href: './ferramentas/calculadora-juros-compostos.html' },
      { label: 'Juros Simples', href: './ferramentas/calculadora-juros-simples.html' }
    ]
  }
];

// Função para renderizar o menu automaticamente
function renderizarMenu() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  const ul = nav.querySelector('.site-nav') || document.createElement('ul');
  ul.className = 'site-nav';
  ul.innerHTML = '';

  MENU_ITEMS.forEach(item => {
    const li = document.createElement('li');

    if (item.submenu) {
      li.className = 'has-submenu';
      li.innerHTML = `
        <a href="${item.href}">${item.label}</a>
        <ul class="submenu">
          ${item.submenu.map(sub => `<li><a href="${sub.href}">${sub.label}</a></li>`).join('')}
        </ul>
      `;
    } else {
      li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
    }

    ul.appendChild(li);
  });

  if (!nav.querySelector('.site-nav')) {
    nav.appendChild(ul);
  }

  // Adicionar ícone de notificações
  adicionarIconeNotificacoes(nav);
  adicionarDataCalendario(nav);
}

function adicionarIconeNotificacoes(nav) {
  if (nav.querySelector('.notificacoes-container')) return;

  const container = document.createElement('div');
  container.className = 'notificacoes-container';
  container.innerHTML = `
    <button class="btn-notificacoes" id="btn-notificacoes" aria-label="Notificações">
      ${icone('sino', 20)}
      <span class="badge-notificacoes" id="badge-notificacoes" style="display: none;">0</span>
    </button>
    <div class="dropdown-notificacoes" id="dropdown-notificacoes" hidden>
      <div class="dropdown-header">Próximos Eventos</div>
      <div class="dropdown-content" id="conteudo-notificacoes">
        <!-- Preenchido por JavaScript -->
      </div>
    </div>
  `;
  nav.appendChild(container);

  const btn = document.getElementById('btn-notificacoes');
  const dropdown = document.getElementById('dropdown-notificacoes');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.hasAttribute('hidden')) {
      dropdown.removeAttribute('hidden');
      atualizarNotificacoes();
    } else {
      dropdown.setAttribute('hidden', '');
    }
  });

  document.addEventListener('click', () => {
    dropdown.setAttribute('hidden', '');
  });
}

function atualizarNotificacoes() {
  const conteudo = document.getElementById('conteudo-notificacoes');
  if (!conteudo) return;

  // Verificar se o cache de lembretes existe
  if (typeof obterLembretesCache === 'undefined') {
    conteudo.innerHTML = '<p style="padding: var(--espacamento-md); color: var(--cor-texto-leve); text-align: center;">Carregando...</p>';
    return;
  }

  let lembretes, badge, totalLembretes;
  try {
    const todosLembretes = obterLembretesCache();
    lembretes = todosLembretes.slice(0, 10);
    badge = document.getElementById('badge-notificacoes');
    totalLembretes = todosLembretes.length;

    if (totalLembretes > 0) {
      badge.textContent = totalLembretes;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }

    if (lembretes.length === 0) {
      conteudo.innerHTML = '<p style="padding: var(--espacamento-md); color: #999; text-align: center;">Nenhum evento</p>';
      return;
    }
  } catch (e) {
    console.error('Erro ao atualizar notificações:', e);
    return;
  }

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const html = lembretes.map(lembrete => {
    const ehHoje = lembrete.data.toDateString() === hoje.toDateString();
    const ehAmanha = lembrete.data.toDateString() === amanha.toDateString();
    const corBorda = lembrete.tipo === 'fechamento' ? '#90caf9' : '#ffb74d';
    const iconeHtml = lembrete.tipo === 'fechamento' ? icone('prancheta', 14) : icone('relogio', 14);
    const label = lembrete.tipo === 'fechamento' ? 'Fechamento' : 'Vencimento';
    const dataTexto = ehHoje ? 'Hoje' : ehAmanha ? 'Amanhã' : formatarDataLembrete(lembrete.data);

    return `
      <div style="border-left: 3px solid ${corBorda}; padding: 8px var(--espacamento-md); margin-bottom: 8px; font-size: 13px;">
        <div style="font-weight: bold; color: #333;">
          ${iconeHtml} ${lembrete.cartao}${lembrete.ultimos ? ` ●●●● ${lembrete.ultimos}` : ''}
        </div>
        <div style="color: #666; font-size: 12px; margin-top: 2px;">
          ${label} • Dia ${lembrete.dia} • ${dataTexto}
        </div>
        ${ehHoje || ehAmanha ? `<div style="margin-top: 4px;"><span style="background: ${ehHoje ? '#f44336' : '#ff9800'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;">${ehHoje ? 'HOJE' : 'AMANHÃ'}</span></div>` : ''}
      </div>
    `;
  }).join('');

  conteudo.innerHTML = html;
}

function formatarDataLembrete(data) {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

// Renderizar menu quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  renderizarMenu();
  // O menu é montado aqui; (re)liga o hambúrguer e os submenus agora que o .site-nav existe
  if (typeof initMenu === 'function') initMenu();
  // Atualizar notificações assim que lembretes estiver precarregado
  let tentativas = 0;
  const intervalo = setInterval(function() {
    if (typeof obterLembretesCache !== 'undefined') {
      clearInterval(intervalo);
      atualizarNotificacoes();
    }
    tentativas++;
    if (tentativas > 50) clearInterval(intervalo); // Parar após 5 segundos
  }, 50);
});

// ===== Data atual + Calendário no cabeçalho =====
let _calMesOffset = 0;

function adicionarDataCalendario(nav) {
  if (nav.querySelector('.data-container')) return;

  const container = document.createElement('div');
  container.className = 'data-container';
  container.innerHTML = `
    <button class="btn-data" id="btn-data" aria-label="Data e calendário">
      ${icone('calendario', 18) || ''}
      <span class="btn-data-texto" id="btn-data-texto"></span>
    </button>
    <div class="dropdown-calendario" id="dropdown-calendario" hidden></div>
  `;

  const notif = nav.querySelector('.notificacoes-container');
  if (notif) {
    nav.insertBefore(container, notif);
    container.style.marginLeft = 'auto';
    notif.style.marginLeft = '0';
  } else {
    nav.appendChild(container);
  }

  atualizarBotaoData();

  const btn = document.getElementById('btn-data');
  const dropdown = document.getElementById('dropdown-calendario');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.hasAttribute('hidden')) {
      _calMesOffset = 0;
      renderizarCalendario();
      dropdown.removeAttribute('hidden');
    } else {
      dropdown.setAttribute('hidden', '');
    }
  });

  dropdown.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => dropdown.setAttribute('hidden', ''));

  // Manter a data atualizada (vira o dia à meia-noite)
  setInterval(atualizarBotaoData, 60 * 1000);
}

function atualizarBotaoData() {
  const el = document.getElementById('btn-data-texto');
  if (!el) return;
  const hoje = new Date();
  el.textContent = hoje.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short'
  }).replace('.', '');
}

function renderizarCalendario() {
  const dropdown = document.getElementById('dropdown-calendario');
  if (!dropdown) return;

  const hoje = new Date();
  const base = new Date(hoje.getFullYear(), hoje.getMonth() + _calMesOffset, 1);
  const ano = base.getFullYear();
  const mes = base.getMonth();

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const nomeMes = base.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  let celulas = '';
  for (let i = 0; i < primeiroDiaSemana; i++) celulas += '<span class="cal-dia vazio"></span>';
  for (let d = 1; d <= diasNoMes; d++) {
    const ehHoje = _calMesOffset === 0 && d === hoje.getDate();
    celulas += `<span class="cal-dia${ehHoje ? ' hoje' : ''}">${d}</span>`;
  }

  dropdown.innerHTML = `
    <div class="cal-header">
      <button class="cal-nav" id="cal-prev" aria-label="Mês anterior">&lsaquo;</button>
      <span class="cal-titulo">${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}</span>
      <button class="cal-nav" id="cal-next" aria-label="Próximo mês">&rsaquo;</button>
    </div>
    <div class="cal-grid cal-semana">${diasSemana.map(d => `<span>${d}</span>`).join('')}</div>
    <div class="cal-grid cal-dias">${celulas}</div>
    ${_calMesOffset !== 0 ? '<button class="cal-hoje" id="cal-hoje">Voltar para hoje</button>' : ''}
  `;

  document.getElementById('cal-prev').addEventListener('click', () => { _calMesOffset--; renderizarCalendario(); });
  document.getElementById('cal-next').addEventListener('click', () => { _calMesOffset++; renderizarCalendario(); });
  const btnHoje = document.getElementById('cal-hoje');
  if (btnHoje) btnHoje.addEventListener('click', () => { _calMesOffset = 0; renderizarCalendario(); });
}
