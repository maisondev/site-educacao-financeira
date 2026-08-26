let cartaoAtualAbertoParaGasto = null;

function carregarCartoes() {
  const cartoes = JSON.parse(localStorage.getItem('cartoes_financeiros') || '[]');
  const listaCartoes = document.getElementById('lista-cartoes');

  if (cartoes.length === 0) {
    listaCartoes.innerHTML = '<div class="lista-vazia"><p>Nenhum cartão adicionado ainda. Crie seu primeiro cartão acima!</p></div>';
    return;
  }

  listaCartoes.innerHTML = '';

  cartoes.forEach(cartao => {
    const gastoTotal = (cartao.gastos || []).reduce((sum, gasto) => sum + gasto.valor, 0);
    const disponivel = cartao.limite - gastoTotal;
    const percentualUsado = (gastoTotal / cartao.limite) * 100;

    const cardElement = document.createElement('div');
    cardElement.className = 'card-credito';
    cardElement.innerHTML = `
      <div class="card-header">
        <div class="card-nome">${cartao.nome}</div>
        <div class="card-acoes">
          <button class="btn-editar-card" onclick="abrirModalEdicaoCartao('${cartao.id}')" title="Editar">✎</button>
          <button class="btn-deletar-card" onclick="deletarCartao('${cartao.id}')" title="Deletar">×</button>
        </div>
      </div>

      <div class="card-info">
        <div class="card-numero">•••• •••• •••• 0000</div>
      </div>

      <div class="card-stats">
        <div class="card-stat">
          <span class="card-stat-label">Limite</span>
          <span class="card-stat-valor">${formatarMoeda(cartao.limite)}</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-label">Disponível</span>
          <span class="card-stat-valor">${formatarMoeda(disponivel)}</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-label">Gasto</span>
          <span class="card-stat-valor">${formatarMoeda(gastoTotal)}</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-label">Vencimento</span>
          <span class="card-stat-valor">Dia ${cartao.vencimento}</span>
        </div>
      </div>

      <button onclick="abrirModalGasto('${cartao.id}')" style="
        margin-top: var(--espacamento-lg);
        padding: var(--espacamento-md);
        background-color: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.3)'" onmouseout="this.style.backgroundColor='rgba(255,255,255,0.2)'">
        + Adicionar Gasto
      </button>
    `;

    listaCartoes.appendChild(cardElement);

    // Adiciona a seção de gastos após o card
    if ((cartao.gastos || []).length > 0) {
      const gastosList = document.createElement('div');
      gastosList.style.marginTop = 'var(--espacamento-md)';
      gastosList.style.backgroundColor = 'white';
      gastosList.style.borderRadius = '4px';
      gastosList.style.overflow = 'hidden';

      const gastoListHTML = '<div class="lista-gastos">' +
        (cartao.gastos || []).map(gasto => `
          <div class="gasto-item">
            <div style="flex: 1;">
              <div class="gasto-descricao">${gasto.descricao}</div>
              <div class="gasto-data">${new Date(gasto.data).toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="gasto-valor">${formatarMoeda(gasto.valor)}</div>
            <button class="btn-remover-gasto" onclick="removerGasto('${cartao.id}', '${gasto.id}')">×</button>
          </div>
        `).join('') +
        '</div>';

      gastosList.innerHTML = gastoListHTML;
      listaCartoes.appendChild(gastosList);
    }
  });
}

function adicionarCartao() {
  const nome = document.getElementById('card-nome').value.trim();
  const bandeira = document.getElementById('card-bandeira').value;
  const limite = parseFloat(document.getElementById('card-limite').value);
  const vencimento = parseInt(document.getElementById('card-vencimento').value);

  if (!nome || !bandeira || !limite || !vencimento) {
    alert('Preencha todos os campos obrigatórios');
    return;
  }

  const cartao = {
    id: Date.now().toString(),
    nome,
    bandeira,
    limite,
    vencimento,
    gastos: [],
    dataCriacao: new Date().toISOString()
  };

  const cartoes = JSON.parse(localStorage.getItem('cartoes_financeiros') || '[]');
  cartoes.push(cartao);
  localStorage.setItem('cartoes_financeiros', JSON.stringify(cartoes));

  limparFormularioCard();
  carregarCartoes();
}

function limparFormularioCard() {
  document.getElementById('card-nome').value = '';
  document.getElementById('card-bandeira').value = '';
  document.getElementById('card-limite').value = '';
  document.getElementById('card-vencimento').value = '';
}

function deletarCartao(cartaoId) {
  if (!confirm('Tem certeza que deseja deletar este cartão?')) {
    return;
  }

  const cartoes = JSON.parse(localStorage.getItem('cartoes_financeiros') || '[]');
  const cartoesFiltrados = cartoes.filter(c => c.id !== cartaoId);
  localStorage.setItem('cartoes_financeiros', JSON.stringify(cartoesFiltrados));
  carregarCartoes();
}

function abrirModalGasto(cartaoId) {
  cartaoAtualAbertoParaGasto = cartaoId;
  document.getElementById('gasto-descricao').value = '';
  document.getElementById('gasto-valor').value = '';
  document.getElementById('gasto-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal-gasto').removeAttribute('hidden');
}

function fecharModalGasto() {
  document.getElementById('modal-gasto').setAttribute('hidden', '');
  cartaoAtualAbertoParaGasto = null;
}

function salvarGasto() {
  const descricao = document.getElementById('gasto-descricao').value.trim();
  const valor = parseFloat(document.getElementById('gasto-valor').value);
  const data = document.getElementById('gasto-data').value;

  if (!descricao || !valor || !data) {
    alert('Preencha todos os campos');
    return;
  }

  const cartoes = JSON.parse(localStorage.getItem('cartoes_financeiros') || '[]');
  const cartao = cartoes.find(c => c.id === cartaoAtualAbertoParaGasto);

  if (!cartao) {
    alert('Cartão não encontrado');
    return;
  }

  if (!cartao.gastos) {
    cartao.gastos = [];
  }

  cartao.gastos.push({
    id: Date.now().toString(),
    descricao,
    valor,
    data
  });

  localStorage.setItem('cartoes_financeiros', JSON.stringify(cartoes));
  fecharModalGasto();
  carregarCartoes();
}

function removerGasto(cartaoId, gastoId) {
  if (!confirm('Tem certeza que deseja remover este gasto?')) {
    return;
  }

  const cartoes = JSON.parse(localStorage.getItem('cartoes_financeiros') || '[]');
  const cartao = cartoes.find(c => c.id === cartaoId);

  if (cartao && cartao.gastos) {
    cartao.gastos = cartao.gastos.filter(g => g.id !== gastoId);
    localStorage.setItem('cartoes_financeiros', JSON.stringify(cartoes));
    carregarCartoes();
  }
}

function abrirModalEdicaoCartao(cartaoId) {
  const cartoes = JSON.parse(localStorage.getItem('cartoes_financeiros') || '[]');
  const cartao = cartoes.find(c => c.id === cartaoId);

  if (!cartao) {
    alert('Cartão não encontrado');
    return;
  }

  document.getElementById('edit-card-nome').value = cartao.nome;
  document.getElementById('edit-card-bandeira').value = cartao.bandeira;
  document.getElementById('edit-card-limite').value = cartao.limite;
  document.getElementById('edit-card-vencimento').value = cartao.vencimento;
  document.getElementById('edit-card-nome').dataset.cartaoId = cartaoId;

  document.getElementById('modal-edicao-cartao').removeAttribute('hidden');
}

function fecharModalEdicaoCartao() {
  document.getElementById('modal-edicao-cartao').setAttribute('hidden', '');
}

function salvarEdicaoCartao() {
  const cartaoId = document.getElementById('edit-card-nome').dataset.cartaoId;
  const nome = document.getElementById('edit-card-nome').value.trim();
  const bandeira = document.getElementById('edit-card-bandeira').value;
  const limite = parseFloat(document.getElementById('edit-card-limite').value);
  const vencimento = parseInt(document.getElementById('edit-card-vencimento').value);

  if (!nome || !bandeira || !limite || !vencimento) {
    alert('Preencha todos os campos obrigatórios');
    return;
  }

  const cartoes = JSON.parse(localStorage.getItem('cartoes_financeiros') || '[]');
  const cartao = cartoes.find(c => c.id === cartaoId);

  if (cartao) {
    cartao.nome = nome;
    cartao.bandeira = bandeira;
    cartao.limite = limite;
    cartao.vencimento = vencimento;

    localStorage.setItem('cartoes_financeiros', JSON.stringify(cartoes));
    fecharModalEdicaoCartao();
    carregarCartoes();
  }
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

document.addEventListener('DOMContentLoaded', carregarCartoes);
