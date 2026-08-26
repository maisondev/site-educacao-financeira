// Estrutura centralizada do menu - edite aqui para atualizar em todas as páginas
const MENU_ITEMS = [
  {
    label: 'Início',
    href: './index.html',
    submenu: null
  },
  {
    label: 'Aprender',
    href: './temas/index.html',
    submenu: [
      { label: 'Orçamento Pessoal', href: './temas/orcamento-pessoal/index.html' },
      { label: 'Reserva de Emergência', href: './temas/reserva-de-emergencia/index.html' },
      { label: 'Juros e Investimentos', href: './temas/juros-e-investimentos/index.html' }
    ]
  },
  {
    label: 'Metas',
    href: './metas.html',
    submenu: null
  },
  {
    label: 'Reserva',
    href: './reserva-emergencia.html',
    submenu: null
  },
  {
    label: 'Dívidas',
    href: './dividas.html',
    submenu: null
  },
  {
    label: 'Investimentos',
    href: './investimentos.html',
    submenu: null
  },
  {
    label: 'Despesas Fixas',
    href: './despesas-fixas.html',
    submenu: null
  },
  {
    label: 'Renda',
    href: './renda-extra.html',
    submenu: null
  },
  {
    label: 'Cartão',
    href: './cartao.html',
    submenu: null
  },
  {
    label: 'Envelopes',
    href: './envelopes.html',
    submenu: null
  },
  {
    label: 'Máximas',
    href: './maximas.html',
    submenu: null
  },
  {
    label: 'Relatórios',
    href: './relatorios.html',
    submenu: null
  },
  {
    label: 'Balanço Patrimonial',
    href: './balanco-patrimonial.html',
    submenu: null
  },
  {
    label: 'Ferramentas',
    href: './ferramentas/calculadora-juros-compostos.html',
    submenu: [
      { label: 'Calculadora de Juros', href: './ferramentas/calculadora-juros-compostos.html' }
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
}

// Renderizar menu quando o DOM carregar
document.addEventListener('DOMContentLoaded', renderizarMenu);
