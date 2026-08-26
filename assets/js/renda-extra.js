// Gerenciar rendas extras com localStorage

const CHAVE_STORAGE = 'rendas_extras';

// Carregar rendas ao abrir a página
document.addEventListener('DOMContentLoaded', function() {
  renderizarRendas();

  // Listener para o formulário de edição
  const formularioEdicao = document.getElementById('formulario-edicao');
  if (formularioEdicao) {
    formularioEdicao.addEventListener('submit', salvarEdicao);
  }

  // Fechar modal ao clicar fora
  const modal = document.getElementById('modal-edicao');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        fecharModalEdicao();
      }
    });
  }
});

function adicionarRenda() {
  const nome = document.getElementById('renda-nome').value.trim();
  const descricao = document.getElementById('renda-descricao').value.trim();
  const categoria = document.getElementById('renda-categoria').value;
  const mensal = parseFloat(document.getElementById('renda-mensal').value);
  const dataInicio = document.getElementById('renda-data-inicio').value;
  const status = document.getElementById('renda-status').value;

  // Validação
  if (!nome) {
    alert('Por favor, adicione um nome para a renda extra');
    return;
  }

  if (!categoria) {
    alert('Por favor, selecione uma categoria');
    return;
  }

  if (!mensal || mensal <= 0) {
    alert('Por favor, adicione um rendimento mensal válido');
    return;
  }

  if (!dataInicio) {
    alert('Por favor, selecione quando começou');
    return;
  }

  if (!status) {
    alert('Por favor, selecione um status');
    return;
  }

  // Criar objeto renda
  const renda = {
    id: Date.now(),
    nome: nome,
    descricao: descricao,
    categoria: categoria,
    mensal: mensal,
    dataInicio: dataInicio,
    status: status,
    dataCriacao: new Date().toISOString()
  };

  // Salvar no localStorage
  const rendas = obterRendas();
  rendas.push(renda);
  salvarRendas(rendas);

  // Limpar formulário e renderizar
  limparFormulario();
  renderizarRendas();
}

function obterRendas() {
  try {
    const dados = localStorage.getItem(CHAVE_STORAGE);
    return dados ? JSON.parse(dados) : [];
  } catch (e) {
    console.error('Erro ao obter rendas do localStorage:', e);
    return [];
  }
}

function salvarRendas(rendas) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(rendas));
  } catch (e) {
    console.error('Erro ao salvar rendas no localStorage:', e);
    alert('Não foi possível salvar a renda. Verifique o espaço disponível.');
  }
}

function renderizarRendas() {
  const rendas = obterRendas();
  const container = document.getElementById('lista-rendas');
  const secaoResumo = document.getElementById('secao-resumo');

  if (rendas.length === 0) {
    container.innerHTML = '<div class="lista-vazia"><p>Nenhuma renda extra adicionada ainda. Comece a registrar acima!</p></div>';
    secaoResumo.style.display = 'none';
    return;
  }

  // Ordenar por status (ativas primeiro) e depois por rendimento mensal
  rendas.sort((a, b) => {
    const statusOrder = { 'ativa': 0, 'pausada': 1, 'encerrada': 2 };
    const statusComparison = statusOrder[a.status] - statusOrder[b.status];
    if (statusComparison !== 0) return statusComparison;
    return b.mensal - a.mensal;
  });

  container.innerHTML = rendas.map(renda => criarCardRenda(renda)).join('');
  atualizarResumo(rendas);
  secaoResumo.style.display = 'block';
}

function criarCardRenda(renda) {
  const anual = renda.mensal * 12;
  const categoriaClass = `categoria-${renda.categoria}`;
  const textoCategoria = {
    alto: 'Alto rendimento',
    medio: 'Médio rendimento',
    baixo: 'Baixo rendimento'
  }[renda.categoria];

  const textoStatus = {
    ativa: 'Ativa',
    pausada: 'Pausada',
    encerrada: 'Encerrada'
  }[renda.status];

  let dataInicio = '';
  if (renda.dataInicio) {
    const date = new Date(renda.dataInicio);
    dataInicio = date.toLocaleDateString('pt-BR');
  }

  return `
    <div class="card-renda">
      <div class="renda-info">
        <h3>${escaparHTML(renda.nome)}</h3>

        <span class="renda-categoria ${categoriaClass}">${textoCategoria}</span>
        <span class="renda-categoria" style="background-color: #e6f2ff; color: #1264a3; margin-left: var(--espacamento-sm);">${textoStatus}</span>

        ${renda.descricao ? `<p class="renda-descricao">${escaparHTML(renda.descricao)}</p>` : ''}

        <div class="renda-valores">
          <div>Mensal:</div>
          <div><strong>R$ ${renda.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
          <div>Anual:</div>
          <div><strong>R$ ${anual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
          <div>Desde:</div>
          <div><strong>${dataInicio}</strong></div>
        </div>
      </div>

      <div class="renda-acoes">
        <button class="btn-editar" onclick="abrirEdicao(${renda.id})">Editar</button>
        <button class="btn-deletar" onclick="deletarRenda(${renda.id})">Deletar</button>
      </div>
    </div>
  `;
}

function atualizarResumo(rendas) {
  // Calcular totais apenas de rendas ativas
  const rendasAtivas = rendas.filter(r => r.status === 'ativa');
  const totalMensal = rendasAtivas.reduce((sum, r) => sum + r.mensal, 0);
  const totalAnual = totalMensal * 12;
  const totalAtivas = rendasAtivas.length;
  const totalTestadas = rendas.length;

  document.getElementById('total-mensal').textContent = 'R$ ' + totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('total-anual').textContent = 'R$ ' + totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('total-ativas').textContent = totalAtivas;
  document.getElementById('total-testadas').textContent = totalTestadas;
}

function abrirEdicao(id) {
  const rendas = obterRendas();
  const renda = rendas.find(r => r.id === id);

  if (!renda) return;

  // Preencher o formulário com os dados da renda
  document.getElementById('edit-renda-id').value = renda.id;
  document.getElementById('edit-nome').value = renda.nome;
  document.getElementById('edit-descricao').value = renda.descricao;
  document.getElementById('edit-categoria').value = renda.categoria;
  document.getElementById('edit-mensal').value = renda.mensal;
  document.getElementById('edit-data-inicio').value = renda.dataInicio;
  document.getElementById('edit-status').value = renda.status;

  // Mostrar o modal
  document.getElementById('modal-edicao').removeAttribute('hidden');
}

function fecharModalEdicao() {
  document.getElementById('modal-edicao').setAttribute('hidden', '');
  document.getElementById('formulario-edicao').reset();
}

function salvarEdicao(event) {
  event.preventDefault();

  const rendaId = parseInt(document.getElementById('edit-renda-id').value);
  const nome = document.getElementById('edit-nome').value.trim();
  const descricao = document.getElementById('edit-descricao').value.trim();
  const categoria = document.getElementById('edit-categoria').value;
  const mensal = parseFloat(document.getElementById('edit-mensal').value);
  const dataInicio = document.getElementById('edit-data-inicio').value;
  const status = document.getElementById('edit-status').value;

  // Validação
  if (!nome) {
    alert('Por favor, insira um nome');
    return;
  }

  if (!categoria) {
    alert('Por favor, selecione uma categoria');
    return;
  }

  if (!mensal || mensal <= 0) {
    alert('Por favor, insira um rendimento mensal válido');
    return;
  }

  if (!dataInicio) {
    alert('Por favor, selecione uma data');
    return;
  }

  if (!status) {
    alert('Por favor, selecione um status');
    return;
  }

  // Atualizar a renda
  const rendas = obterRendas();
  const renda = rendas.find(r => r.id === rendaId);

  if (!renda) return;

  renda.nome = nome;
  renda.descricao = descricao;
  renda.categoria = categoria;
  renda.mensal = mensal;
  renda.dataInicio = dataInicio;
  renda.status = status;

  salvarRendas(rendas);
  fecharModalEdicao();
  renderizarRendas();
}

function deletarRenda(id) {
  const rendas = obterRendas();
  const renda = rendas.find(r => r.id === id);

  if (!renda) return;

  const confirmar = confirm(`Tem certeza que quer deletar a renda extra "${renda.nome}"?`);
  if (!confirmar) return;

  const rendasAtualizadas = rendas.filter(r => r.id !== id);
  salvarRendas(rendasAtualizadas);
  renderizarRendas();
}

function limparFormulario() {
  document.getElementById('renda-nome').value = '';
  document.getElementById('renda-descricao').value = '';
  document.getElementById('renda-categoria').value = '';
  document.getElementById('renda-mensal').value = '';
  document.getElementById('renda-data-inicio').value = '';
  document.getElementById('renda-status').value = '';
  document.getElementById('renda-nome').focus();
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
