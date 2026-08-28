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
