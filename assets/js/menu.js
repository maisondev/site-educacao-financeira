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
    label: 'Acompanhamento',
    href: './metas.html',
    submenu: [
      { label: 'Metas', href: './metas.html' },
      { label: 'Receitas', href: './receitas.html' },
      { label: 'Reserva de Emergência', href: './reserva-emergencia.html' },
      { label: 'Dívidas', href: './dividas.html' },
      { label: 'Investimentos', href: './investimentos.html' },
      { label: 'Despesas Fixas', href: './despesas-fixas.html' },
      { label: 'Despesas Variáveis', href: './despesas-variaveis.html' },
      { label: 'Renda Extra', href: './renda-extra.html' },
      { label: 'Cartões', href: './cartoes.html' },
      { label: 'Envelopes', href: './envelopes.html' }
    ]
  },
  {
    label: 'Análise',
    href: './relatorios.html',
    submenu: [
      { label: 'Contracheque', href: './analise-contracheque.html' },
      { label: 'Relatórios', href: './relatorios.html' },
      { label: 'Balanço Patrimonial', href: './balanco-patrimonial.html' }
    ]
  },
  {
    label: 'Referência',
    href: './glossario.html',
    submenu: [
      { label: 'Glossário', href: './glossario.html' },
      { label: 'Grandes Máximas', href: './maximas.html' },
      { label: 'Grandes Nomes', href: './pensadores.html' },
      { label: 'Grandes Livros', href: './livros.html' },
      { label: 'Meus Cursos', href: './cursos.html' }
    ]
  },
  {
    label: 'Ferramentas',
    href: './ferramentas/calculadora-juros-compostos.html',
    submenu: [
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
}

// Renderizar menu quando o DOM carregar
document.addEventListener('DOMContentLoaded', renderizarMenu);
