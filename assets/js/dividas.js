let dividaEmEdicao = null;

function inicializarDividas() {
  const dados = obterDados();
  if (dados.dividas.length > 0) {
    document.getElementById('resumo-container').removeAttribute('hidden');
    atualizarVisualizacao();
  }
}

function obterDados() {
  const dados = localStorage.getItem('dividas');
  return dados ? JSON.parse(dados) : { dividas: [] };
}

function salvarDados(dados) {
  localStorage.setItem('dividas', JSON.stringify(dados));
}

function adicionarDivida() {
  const credor = document.getElementById('input-credor').value;
  const valorTotal = parseFloat(document.getElementById('input-valor-total').value);
  const taxa = parseFloat(document.getElementById('input-taxa').value) || 0;
  const vencimento = document.getElementById('input-vencimento').value;
  const tipo = document.getElementById('select-tipo').value;
  const observacoes = document.getElementById('input-observacoes').value;

  if (!credor || !valorTotal || valorTotal <= 0 || !vencimento || !tipo) {
    alert('Por favor, preencha todos os campos obrigatórios');
    return;
  }

  const dados = obterDados();
  dados.dividas.push({
    id: Date.now(),
    credor,
    valorTotal,
    valorPago: 0,
    taxa,
    vencimento,
    tipo,
    observacoes,
    dataCriacao: new Date().toISOString(),
    pagamentos: []
  });

  salvarDados(dados);
  limparFormulario();
  document.getElementById('resumo-container').removeAttribute('hidden');
  atualizarVisualizacao();
}

function atualizarVisualizacao() {
  const dados = obterDados();

  if (dados.dividas.length === 0) {
    document.getElementById('resumo-container').setAttribute('hidden', '');
    return;
  }

  const totalDivida = dados.dividas.reduce((sum, d) => sum + d.valorTotal, 0);
  const totalPago = dados.dividas.reduce((sum, d) => sum + d.valorPago, 0);
  const totalFaltante = totalDivida - totalPago;

  document.getElementById('valor-total').textContent = formatarMoeda(totalDivida);
  document.getElementById('valor-pago').textContent = formatarMoeda(totalPago);
  document.getElementById('valor-faltante').textContent = formatarMoeda(totalFaltante);

  atualizarListaDividas();
  verificarAlerta(dados);
}

function atualizarListaDividas() {
  const dados = obterDados();
  const lista = document.getElementById('lista-dividas');

  if (dados.dividas.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nenhuma dívida registrada.</p></div>`;
    return;
  }

  lista.innerHTML = dados.dividas.map((divida, index) => {
    const faltante = divida.valorTotal - divida.valorPago;
    const percentualPago = divida.valorTotal > 0 ? (divida.valorPago / divida.valorTotal) * 100 : 0;
    const quitada = faltante <= 0;

    return `
      <div class="divida-card ${quitada ? 'quitada' : ''}">
        <div class="divida-header">
          <div class="divida-titulo">
            <h3>${divida.credor}</h3>
            <p class="divida-credor">${obterTipoDivida(divida.tipo)}</p>
          </div>
          <span class="divida-status ${quitada ? 'quitada' : ''}">${quitada ? 'Quitada' : 'Ativa'}</span>
        </div>

        <div class="divida-valores">
          <div class="valor-linha">
            <span>Valor Total</span>
            <strong>${formatarMoeda(divida.valorTotal)}</strong>
          </div>
          <div class="valor-linha">
            <span>Já Pago</span>
            <strong>${formatarMoeda(divida.valorPago)}</strong>
          </div>
          <div class="valor-linha">
            <span>Falta Pagar</span>
            <strong>${formatarMoeda(faltante)}</strong>
          </div>
          ${divida.taxa > 0 ? `<div class="valor-linha"><span>Taxa de Juros</span><strong>${divida.taxa}% a.m</strong></div>` : ''}
        </div>

        <div class="divida-progresso">
          <div class="divida-progresso-barra" style="width: ${percentualPago}%"></div>
        </div>

        <div style="text-align: right; font-size: 13px; color: var(--cor-texto-leve); margin-bottom: var(--espacamento-md);">
          Vencimento: ${new Date(divida.vencimento).toLocaleDateString('pt-BR')}
        </div>

        ${!quitada ? `
          <div class="divida-acoes">
            <button class="btn-pagar" onclick="abrirModalPagamento(${index})">Registrar Pagamento</button>
            <button class="btn-editar" onclick="editarDivida(${index})">Editar</button>
            <button class="btn-deletar" onclick="deletarDivida(${index})">Deletar</button>
          </div>
        ` : `
          <div class="divida-acoes">
            <button class="btn-deletar" onclick="deletarDivida(${index})">Remover</button>
          </div>
        `}
      </div>
    `;
  }).join('');
}

function verificarAlerta(dados) {
  const container = document.getElementById('alerta-container');
  container.innerHTML = '';

  const hoje = new Date();
  const proximasSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dividasVencendo = dados.dividas.filter(d => {
    const vencimento = new Date(d.vencimento);
    return vencimento > hoje && vencimento <= proximasSemana && (d.valorTotal - d.valorPago) > 0;
  });

  if (dividasVencendo.length > 0) {
    container.innerHTML = `
      <div class="alerta">
        <p>Atenção: ${dividasVencendo.length} dívida(s) vencendo nos próximos 7 dias!</p>
      </div>
    `;
  }

  const totalDivida = dados.dividas.reduce((sum, d) => sum + d.valorTotal, 0);
  const totalPago = dados.dividas.reduce((sum, d) => sum + d.valorPago, 0);

  if (totalDivida > 0 && totalPago >= totalDivida) {
    container.innerHTML = `
      <div class="sucesso">
        <p>Parabéns! Você quitou todas as suas dívidas!</p>
      </div>
    `;
  }
}

function abrirModalPagamento(index) {
  dividaEmEdicao = index;
  const data = new Date().toISOString().split('T')[0];
  document.getElementById('input-data-pagamento').value = data;
  document.getElementById('input-valor-pagamento').value = '';
  document.getElementById('modal-pagamento').removeAttribute('hidden');
}

function fecharModalPagamento() {
  dividaEmEdicao = null;
  document.getElementById('modal-pagamento').setAttribute('hidden', '');
}

function salvarPagamento() {
  if (dividaEmEdicao === null) return;

  const valor = parseFloat(document.getElementById('input-valor-pagamento').value);
  const data = document.getElementById('input-data-pagamento').value;

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  if (!data) {
    alert('Por favor, selecione uma data');
    return;
  }

  const dados = obterDados();
  const divida = dados.dividas[dividaEmEdicao];
  const novoValorPago = divida.valorPago + valor;

  if (novoValorPago > divida.valorTotal) {
    alert('O valor do pagamento não pode ser maior que o valor devido');
    return;
  }

  divida.valorPago = novoValorPago;
  divida.pagamentos = divida.pagamentos || [];
  divida.pagamentos.push({ valor, data });

  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalPagamento();
}

function editarDivida(index) {
  alert('Função de edição em desenvolvimento. Você pode deletar e adicionar novamente.');
}

function deletarDivida(index) {
  if (confirm('Tem certeza que deseja deletar esta dívida?')) {
    const dados = obterDados();
    dados.dividas.splice(index, 1);
    salvarDados(dados);
    atualizarVisualizacao();
  }
}

function limparFormulario() {
  document.getElementById('input-credor').value = '';
  document.getElementById('input-valor-total').value = '';
  document.getElementById('input-taxa').value = '';
  document.getElementById('input-vencimento').value = '';
  document.getElementById('select-tipo').value = '';
  document.getElementById('input-observacoes').value = '';
}

function obterTipoDivida(tipo) {
  const tipos = {
    'cartao': 'Cartão de Crédito',
    'emprestimo': 'Empréstimo',
    'financiamento': 'Financiamento',
    'amigo': 'Empréstimo com Amigo',
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
  const modal = document.getElementById('modal-pagamento');
  if (event.target === modal) {
    fecharModalPagamento();
  }
});

window.addEventListener('load', inicializarDividas);
