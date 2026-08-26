let investimentoEmEdicao = null;

function inicializarInvestimentos() {
  const dados = obterDados();
  if (dados.investimentos.length > 0) {
    document.getElementById('resumo-container').removeAttribute('hidden');
    atualizarVisualizacao();
  }
}

function obterDados() {
  const dados = localStorage.getItem('investimentos');
  return dados ? JSON.parse(dados) : { investimentos: [] };
}

function salvarDados(dados) {
  localStorage.setItem('investimentos', JSON.stringify(dados));
}

function adicionarInvestimento() {
  const nome = document.getElementById('input-nome').value;
  const tipo = document.getElementById('select-tipo').value;
  const data = document.getElementById('input-data').value;
  const valorInvestido = parseFloat(document.getElementById('input-valor-investido').value);
  const valorAtual = parseFloat(document.getElementById('input-valor-atual').value);

  if (!nome || !tipo || !data || !valorInvestido || !valorAtual || valorInvestido < 0 || valorAtual < 0) {
    alert('Por favor, preencha todos os campos obrigatórios');
    return;
  }

  const dados = obterDados();
  dados.investimentos.push({
    id: Date.now(),
    nome,
    tipo,
    data,
    valorInvestido,
    valorAtual,
    dataCriacao: new Date().toISOString(),
    aportes: []
  });

  salvarDados(dados);
  limparFormulario();
  document.getElementById('resumo-container').removeAttribute('hidden');
  atualizarVisualizacao();
}

function atualizarVisualizacao() {
  const dados = obterDados();

  if (dados.investimentos.length === 0) {
    document.getElementById('resumo-container').setAttribute('hidden', '');
    return;
  }

  const totalInvestido = dados.investimentos.reduce((sum, i) => sum + i.valorInvestido, 0);
  const totalAtual = dados.investimentos.reduce((sum, i) => sum + i.valorAtual, 0);
  const ganhoPerda = totalAtual - totalInvestido;
  const rentabilidade = totalInvestido > 0 ? (ganhoPerda / totalInvestido) * 100 : 0;

  document.getElementById('valor-investido').textContent = formatarMoeda(totalInvestido);
  document.getElementById('valor-atual').textContent = formatarMoeda(totalAtual);
  document.getElementById('valor-ganho').textContent = formatarMoeda(ganhoPerda);
  document.getElementById('rentabilidade-percentual').textContent = rentabilidade.toFixed(2) + '%';

  // Ajustar cor do ganho/perda
  const cardGanho = document.querySelector('.card-info:nth-child(3)');
  const cardRentabilidade = document.querySelector('.card-info:nth-child(4)');

  if (ganhoPerda > 0) {
    cardGanho.classList.add('positivo');
    cardGanho.classList.remove('negativo');
  } else if (ganhoPerda < 0) {
    cardGanho.classList.add('negativo');
    cardGanho.classList.remove('positivo');
  }

  if (rentabilidade > 0) {
    cardRentabilidade.classList.add('positivo');
    cardRentabilidade.classList.remove('negativo');
  } else if (rentabilidade < 0) {
    cardRentabilidade.classList.add('negativo');
    cardRentabilidade.classList.remove('positivo');
  }

  atualizarListaInvestimentos();
}

function atualizarListaInvestimentos() {
  const dados = obterDados();
  const lista = document.getElementById('lista-investimentos');

  if (dados.investimentos.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nenhum investimento registrado.</p></div>`;
    return;
  }

  lista.innerHTML = dados.investimentos.map((investimento, index) => {
    const ganhoPerda = investimento.valorAtual - investimento.valorInvestido;
    const rentabilidade = investimento.valorInvestido > 0 ? (ganhoPerda / investimento.valorInvestido) * 100 : 0;

    return `
      <div class="investimento-card">
        <div class="investimento-header">
          <div class="investimento-titulo">
            <h3>${investimento.nome}</h3>
            <p class="investimento-tipo">${obterTipoInvestimento(investimento.tipo)}</p>
          </div>
          <span class="badge-tipo">${obterTipoInvestimento(investimento.tipo)}</span>
        </div>

        <div class="investimento-valores">
          <div class="valor-linha">
            <span>Valor Investido</span>
            <strong>${formatarMoeda(investimento.valorInvestido)}</strong>
          </div>
          <div class="valor-linha">
            <span>Valor Atual</span>
            <strong>${formatarMoeda(investimento.valorAtual)}</strong>
          </div>
          <div class="valor-linha">
            <span>Ganho/Perda</span>
            <strong>${formatarMoeda(ganhoPerda)}</strong>
          </div>
        </div>

        <div class="rentabilidade ${rentabilidade > 0 ? 'positiva' : rentabilidade < 0 ? 'negativa' : 'neutra'}">
          Rentabilidade: ${rentabilidade.toFixed(2)}%
        </div>

        <div style="text-align: right; font-size: 13px; color: var(--cor-texto-leve); margin-bottom: var(--espacamento-md);">
          Investido em: ${new Date(investimento.data).toLocaleDateString('pt-BR')}
        </div>

        <div class="investimento-acoes">
          <button class="btn-adicionar-aporte" onclick="abrirModalAporte(${index})">Adicionar Aporte</button>
          <button class="btn-deletar" onclick="deletarInvestimento(${index})">Deletar</button>
        </div>
      </div>
    `;
  }).join('');
}

function abrirModalAporte(index) {
  investimentoEmEdicao = index;
  const data = new Date().toISOString().split('T')[0];
  document.getElementById('input-aporte-data').value = data;
  document.getElementById('input-aporte-valor').value = '';
  document.getElementById('modal-aporte').removeAttribute('hidden');
}

function fecharModalAporte() {
  investimentoEmEdicao = null;
  document.getElementById('modal-aporte').setAttribute('hidden', '');
}

function salvarAporte() {
  if (investimentoEmEdicao === null) return;

  const valor = parseFloat(document.getElementById('input-aporte-valor').value);
  const data = document.getElementById('input-aporte-data').value;

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  if (!data) {
    alert('Por favor, selecione uma data');
    return;
  }

  const dados = obterDados();
  const investimento = dados.investimentos[investimentoEmEdicao];

  investimento.valorInvestido += valor;
  investimento.aportes = investimento.aportes || [];
  investimento.aportes.push({ valor, data });

  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalAporte();
}

function deletarInvestimento(index) {
  if (confirm('Tem certeza que deseja deletar este investimento?')) {
    const dados = obterDados();
    dados.investimentos.splice(index, 1);
    salvarDados(dados);
    atualizarVisualizacao();
  }
}

function limparFormulario() {
  document.getElementById('input-nome').value = '';
  document.getElementById('select-tipo').value = '';
  document.getElementById('input-data').value = '';
  document.getElementById('input-valor-investido').value = '';
  document.getElementById('input-valor-atual').value = '';
}

function obterTipoInvestimento(tipo) {
  const tipos = {
    'poupanca': 'Poupança',
    'acoes': 'Ações',
    'fundo': 'Fundo de Investimento',
    'tesouro': 'Tesouro Direto',
    'cdb': 'CDB / Renda Fixa',
    'crypto': 'Criptomoedas',
    'imagem': 'Imóvel',
    'outro': 'Outro'
  };
  return tipos[tipo] || tipo;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

document.addEventListener('click', function(event) {
  const modal = document.getElementById('modal-aporte');
  if (event.target === modal) {
    fecharModalAporte();
  }
});

window.addEventListener('load', inicializarInvestimentos);
