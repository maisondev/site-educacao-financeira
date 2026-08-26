const TERMOS = [
  // Investimentos
  {
    titulo: "Ação",
    categoria: "investimentos",
    definicao: "Fração da propriedade de uma empresa. Quando você compra uma ação, você se torna sócio daquela empresa.",
    exemplo: "Se uma empresa é dividida em 1 milhão de ações e você compra 100, você é dono de 0,01% dela."
  },
  {
    titulo: "Fundo de Investimento",
    categoria: "investimentos",
    definicao: "Agrupamento de dinheiro de vários investidores aplicado em diferentes ativos por um gestor profissional.",
    exemplo: "Um fundo imobiliário reúne R$ 10 milhões de 1000 investidores para comprar imóveis de forma estratégica."
  },
  {
    titulo: "Rentabilidade",
    categoria: "investimentos",
    definicao: "Ganho que um investimento gera. Pode ser em percentual (%) ou em reais (R$).",
    exemplo: "Investir R$ 1.000 e ganhar R$ 100 = 10% de rentabilidade."
  },
  {
    titulo: "Dividendo",
    categoria: "investimentos",
    definicao: "Parte do lucro de uma empresa distribuída aos seus acionistas periodicamente (geralmente anual ou semestral).",
    exemplo: "Uma empresa lucra R$ 1 bilhão e distribui 50%, ou seja, R$ 500 milhões aos seus acionistas."
  },
  {
    titulo: "Tesouro Direto",
    categoria: "investimentos",
    definicao: "Títulos públicos emitidos pelo governo que você compra e recebe rendimento com prazo definido.",
    exemplo: "Comprar um título que rende 10% ao ano e recebe o dinheiro + juros daqui a 5 anos."
  },

  // Juros & Empréstimos
  {
    titulo: "Juros",
    categoria: "juros",
    definicao: "Valor cobrado pelo uso do dinheiro emprestado. É o custo de pedir dinheiro emprestado.",
    exemplo: "Pedir R$ 1.000 emprestado a 10% de juros significa pagar R$ 100 de juros além do valor original."
  },
  {
    titulo: "Taxa de Juros",
    categoria: "juros",
    definicao: "Percentual cobrado pelo empréstimo, geralmente expresso ao mês (a.m.) ou ao ano (a.a.).",
    exemplo: "Um empréstimo com taxa de 2% a.m. significa que a cada mês você paga 2% do valor pendente em juros."
  },
  {
    titulo: "Juros Compostos",
    categoria: "juros",
    definicao: "Juros que incidem sobre juros anteriores. Também chamado de 'juros sobre juros'.",
    exemplo: "R$ 1.000 a 1% a.m.: mês 1 = R$ 1.010, mês 2 = R$ 1.020,10 (o juros de R$ 10 também rende)."
  },
  {
    titulo: "Taxa Selic",
    categoria: "juros",
    definicao: "Taxa básica de juros da economia brasileira. É a taxa que o Banco Central usa como referência.",
    exemplo: "Quando a Selic aumenta, empréstimos ficam mais caros e poupança rende mais."
  },

  // Mercado
  {
    titulo: "Bolsa de Valores",
    categoria: "mercado",
    definicao: "Mercado onde ações e outros títulos são comprados e vendidos. No Brasil, é a B3.",
    exemplo: "Você compra ações da Petrobras na B3 e depois as vende se quiser lucrar."
  },
  {
    titulo: "Índice",
    categoria: "mercado",
    definicao: "Indicador que mede o desempenho de um grupo de ações ou investimentos.",
    exemplo: "O Ibovespa é um índice que mede como as 100 maiores empresas da B3 estão se comportando."
  },
  {
    titulo: "Volatilidade",
    categoria: "mercado",
    definicao: "Medida de quanto o preço de um investimento sobe e desce. Alta volatilidade = mais oscilação.",
    exemplo: "Uma ação que vai de R$ 10 para R$ 15 (50% de ganho) tem mais volatilidade que uma que vai de R$ 100 para R$ 101."
  },
  {
    titulo: "Correção Monetária",
    categoria: "mercado",
    definicao: "Ajuste de valor para compensar a inflação. Garante que o poder de compra não diminua.",
    exemplo: "Um título com correção pelo IPCA garante que se a inflação é 5%, seu dinheiro rende 5% + juros."
  },

  // Impostos
  {
    titulo: "Imposto de Renda (IR)",
    categoria: "impostos",
    definicao: "Imposto cobrado sobre rendimentos (salário, investimentos, aluguel, etc).",
    exemplo: "Se você recebe R$ 5.000 de salário, parte vai para o IR, e você recebe menos na conta."
  },
  {
    titulo: "IRRF",
    categoria: "impostos",
    definicao: "Imposto de Renda Retido na Fonte. É cobrado no momento do ganho, antes de você receber.",
    exemplo: "Ganhar R$ 1.000 em investimentos, mas receber apenas R$ 850 porque R$ 150 foi retido em imposto."
  },
  {
    titulo: "IOF",
    categoria: "impostos",
    definicao: "Imposto sobre Operações Financeiras. Cobrado em operações de crédito e seguros.",
    exemplo: "Um empréstimo de R$ 10.000 pode ter IOF adicionado, aumentando o valor a pagar."
  },

  // Contas
  {
    titulo: "Conta Corrente",
    categoria: "conta",
    definicao: "Conta bancária para depósitos, saques e transferências do dia a dia. Geralmente não rende juros.",
    exemplo: "Sua conta do salário é uma conta corrente onde você recebe, gasta e transfere dinheiro."
  },
  {
    titulo: "Conta Poupança",
    categoria: "conta",
    definicao: "Conta para poupar dinheiro que rende juros. Rende menos que outras aplicações, mas é segura.",
    exemplo: "R$ 1.000 em poupança que rende 0,5% a.m. viram R$ 1.005 no próximo mês."
  },
  {
    titulo: "Saldo",
    categoria: "conta",
    definicao: "Quantidade de dinheiro que você tem em uma conta em um momento específico.",
    exemplo: "Sua conta tem R$ 5.000 de saldo. Se você gasta R$ 1.000, o novo saldo é R$ 4.000."
  },
  {
    titulo: "Extrato",
    categoria: "conta",
    definicao: "Relatório de todas as transações (depósitos, saques, transferências) de uma conta em um período.",
    exemplo: "Você pede o extrato de janeiro e vê todos os gastos e ganhos daquele mês."
  }
];

let categoriaAtiva = 'todos';

function carregarTermos() {
  mostrarTermos(TERMOS);
  atualizarContador(TERMOS.length);
}

function mostrarTermos(termos) {
  const container = document.getElementById('lista-termos');

  if (termos.length === 0) {
    container.innerHTML = '<div class="lista-vazia">Nenhum termo encontrado</div>';
    return;
  }

  container.innerHTML = termos.map(termo => `
    <div class="termo-card" onclick="toggle(this)">
      <div class="termo-header">
        <div class="termo-titulo">
          <h3>${termo.titulo}</h3>
          <p class="termo-categoria">${obterNomeCategoria(termo.categoria)}</p>
        </div>
        <span class="termo-icone">▼</span>
      </div>

      <div class="termo-definicao">
        <p>${termo.definicao}</p>
        <div class="termo-exemplo">
          <strong>Exemplo:</strong>
          ${termo.exemplo}
        </div>
      </div>
    </div>
  `).join('');
}

function toggle(element) {
  element.classList.toggle('expandido');
}

function filtrarTermos() {
  const busca = document.getElementById('input-busca').value.toLowerCase();
  const termosFiltrados = TERMOS.filter(termo => {
    const matchBusca = termo.titulo.toLowerCase().includes(busca) ||
                       termo.definicao.toLowerCase().includes(busca);
    const matchCategoria = categoriaAtiva === 'todos' || termo.categoria === categoriaAtiva;
    return matchBusca && matchCategoria;
  });

  mostrarTermos(termosFiltrados);
  atualizarContador(termosFiltrados.length);
}

function filtrarPorCategoria(categoria) {
  categoriaAtiva = categoria;

  // Atualizar botões
  document.querySelectorAll('.btn-categoria').forEach(btn => {
    btn.classList.remove('ativo');
  });
  event.target.classList.add('ativo');

  // Filtrar termos
  filtrarTermos();
}

function obterNomeCategoria(slug) {
  const nomes = {
    'investimentos': 'Investimentos',
    'juros': 'Juros & Empréstimos',
    'mercado': 'Mercado',
    'impostos': 'Impostos',
    'conta': 'Contas'
  };
  return nomes[slug] || slug;
}

function atualizarContador(total) {
  const contador = document.getElementById('contador-termos');
  contador.textContent = `Mostrando ${total} termo${total !== 1 ? 's' : ''}`;
}
