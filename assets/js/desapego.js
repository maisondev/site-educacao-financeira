// Área de Desapego — objetos parados em casa que podem virar venda, troca, doação ou conserto.
// Persistência local em Store.CHAVES.DESAPEGO. Nenhum dado sai do navegador.

let itemEmEdicaoId = null;
let filtroStatus = 'todos';

const ACOES = {
  vender: 'Vender',
  trocar: 'Trocar',
  doar: 'Doar',
  consertar: 'Consertar',
  descartar: 'Descartar'
};

// Fluxo de progresso de cada item. "concluido" é o estado final.
const STATUS = {
  parado: 'Parado',
  preparando: 'Preparando',
  anunciado: 'Anunciado',
  negociando: 'Negociando',
  concluido: 'Concluído'
};

const STATUS_ORDEM = ['parado', 'preparando', 'anunciado', 'negociando', 'concluido'];

function dpEscapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function dpGerarId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function obterItens() {
  const lista = Store.ler(Store.CHAVES.DESAPEGO, []);
  if (!Array.isArray(lista)) return [];
  lista.forEach(item => {
    item.id = item.id != null ? String(item.id) : dpGerarId();
  });
  return lista;
}

function salvarItens(lista) {
  Store.gravar(Store.CHAVES.DESAPEGO, lista);
}

function inicializarDesapego() {
  const btnFiltro = document.getElementById('filtro-status');
  if (btnFiltro) {
    btnFiltro.addEventListener('change', function () {
      filtroStatus = this.value;
      renderizarLista();
    });
  }
  renderizar();
}

function renderizar() {
  renderizarResumo();
  renderizarLista();
}

function renderizarResumo() {
  const container = document.getElementById('resumo-desapego');
  if (!container) return;

  const itens = obterItens();
  if (itens.length === 0) {
    container.setAttribute('hidden', '');
    return;
  }

  const pendentes = itens.filter(i => i.status !== 'concluido');
  const concluidos = itens.length - pendentes.length;
  const valorPotencial = pendentes.reduce((soma, i) => soma + (Number(i.valorEstimado) || 0), 0);
  const valorRealizado = itens
    .filter(i => i.status === 'concluido')
    .reduce((soma, i) => soma + (Number(i.valorRealizado) || 0), 0);

  container.innerHTML = `
    <div class="card-info">
      <p>Itens parados</p>
      <p class="valor">${pendentes.length}</p>
    </div>
    <div class="card-info">
      <p>Potencial a realizar</p>
      <p class="valor">${formatarMoedaBrasileira(valorPotencial)}</p>
    </div>
    <div class="card-info sucesso">
      <p>Já resolvidos</p>
      <p class="valor">${concluidos}${valorRealizado > 0 ? ` · ${formatarMoedaBrasileira(valorRealizado)}` : ''}</p>
    </div>
  `;
  container.removeAttribute('hidden');
}

function renderizarLista() {
  const lista = document.getElementById('lista-desapego');
  if (!lista) return;

  const itens = obterItens();

  if (itens.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nenhum item registrado. Comece adicionando aquilo que está parado em casa.</p></div>`;
    return;
  }

  const visiveis = itens.filter(i => filtroStatus === 'todos' || i.status === filtroStatus);

  if (visiveis.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nenhum item com esse status.</p></div>`;
    return;
  }

  // Pendentes primeiro (na ordem do fluxo), concluídos por último.
  const ordenados = [...visiveis].sort((a, b) => {
    const ia = STATUS_ORDEM.indexOf(a.status);
    const ib = STATUS_ORDEM.indexOf(b.status);
    return ia - ib;
  });

  lista.innerHTML = ordenados.map(item => {
    const acao = ACOES[item.acao] || item.acao || '';
    const status = STATUS[item.status] || 'Parado';
    const proximo = obterProximoStatus(item.status);

    const detalhes = [];
    if (item.valorEstimado) {
      detalhes.push(`Estimado: ${formatarMoedaBrasileira(Number(item.valorEstimado))}`);
    }
    if (item.status === 'concluido' && item.valorRealizado) {
      detalhes.push(`Realizado: ${formatarMoedaBrasileira(Number(item.valorRealizado))}`);
    }
    if (item.local) {
      detalhes.push(dpEscapar(item.local));
    }

    return `
      <div class="item-desapego status-${item.status || 'parado'}">
        <div class="item-info">
          <h3>${dpEscapar(item.nome)}</h3>
          <div class="item-badges">
            ${acao ? `<span class="badge-acao">${acao}</span>` : ''}
            <span class="badge-status badge-${item.status || 'parado'}">${status}</span>
          </div>
          ${item.descricao ? `<p class="item-descricao">${dpEscapar(item.descricao)}</p>` : ''}
          ${detalhes.length ? `<p class="item-detalhes">${detalhes.join(' · ')}</p>` : ''}
        </div>
        <div class="item-acoes">
          ${proximo ? `<button class="btn-avancar" onclick="avancarStatus('${item.id}')">Marcar: ${STATUS[proximo]}</button>` : ''}
          <button class="btn-editar" onclick="abrirModalEdicao('${item.id}')" aria-label="Editar">${icone('lapis')}</button>
          <button class="btn-remover" onclick="removerItem('${item.id}')" aria-label="Remover">${icone('lixeira')}</button>
        </div>
      </div>
    `;
  }).join('');
}

function obterProximoStatus(atual) {
  const i = STATUS_ORDEM.indexOf(atual);
  if (i === -1) return 'preparando';
  return STATUS_ORDEM[i + 1] || null;
}

function avancarStatus(id) {
  const itens = obterItens();
  const item = itens.find(i => i.id === id);
  if (!item) return;

  const proximo = obterProximoStatus(item.status);
  if (!proximo) return;

  if (proximo === 'concluido') {
    const entrada = prompt('Valor realizado na venda/troca (deixe em branco se doou ou descartou):', '');
    if (entrada === null) return;
    const valor = parseValorBrasileiro(entrada);
    item.valorRealizado = valor && valor > 0 ? Math.round(valor * 100) / 100 : 0;
    item.dataConclusao = new Date().toISOString();
  }

  item.status = proximo;
  salvarItens(itens);
  renderizar();
}

function abrirModalNovo() {
  itemEmEdicaoId = null;
  document.getElementById('modal-titulo').textContent = 'Novo item para desapegar';
  document.getElementById('btn-salvar-item').textContent = 'Adicionar';
  document.getElementById('campo-nome').value = '';
  document.getElementById('campo-acao').value = 'vender';
  document.getElementById('campo-descricao').value = '';
  document.getElementById('campo-valor').value = '';
  document.getElementById('campo-local').value = '';
  document.getElementById('campo-status').value = 'parado';
  document.getElementById('modal-item').removeAttribute('hidden');
  document.getElementById('campo-nome').focus();
}

function abrirModalEdicao(id) {
  const item = obterItens().find(i => i.id === id);
  if (!item) return;

  itemEmEdicaoId = id;
  document.getElementById('modal-titulo').textContent = 'Editar item';
  document.getElementById('btn-salvar-item').textContent = 'Salvar';
  document.getElementById('campo-nome').value = item.nome || '';
  document.getElementById('campo-acao').value = item.acao || 'vender';
  document.getElementById('campo-descricao').value = item.descricao || '';
  document.getElementById('campo-valor').value = item.valorEstimado
    ? formatarNumeroBrasileiro(Number(item.valorEstimado))
    : '';
  document.getElementById('campo-local').value = item.local || '';
  document.getElementById('campo-status').value = item.status || 'parado';
  document.getElementById('modal-item').removeAttribute('hidden');
  document.getElementById('campo-nome').focus();
}

function fecharModal() {
  document.getElementById('modal-item').setAttribute('hidden', '');
  itemEmEdicaoId = null;
}

function salvarItem() {
  const nome = document.getElementById('campo-nome').value.trim();
  const acao = document.getElementById('campo-acao').value;
  const descricao = document.getElementById('campo-descricao').value.trim();
  const local = document.getElementById('campo-local').value.trim();
  const status = document.getElementById('campo-status').value;
  let valorEstimado = parseValorBrasileiro(document.getElementById('campo-valor').value);

  if (!nome) {
    alert('Dê um nome ao item (ex: "Ar-condicionado de janela").');
    return;
  }

  valorEstimado = valorEstimado && valorEstimado > 0 ? Math.round(valorEstimado * 100) / 100 : 0;

  const itens = obterItens();

  if (itemEmEdicaoId !== null) {
    const item = itens.find(i => i.id === itemEmEdicaoId);
    if (item) {
      item.nome = nome;
      item.acao = acao;
      item.descricao = descricao;
      item.local = local;
      item.status = status;
      item.valorEstimado = valorEstimado;
    }
  } else {
    itens.push({
      id: dpGerarId(),
      nome,
      acao,
      descricao,
      local,
      status,
      valorEstimado,
      valorRealizado: 0,
      dataCriacao: new Date().toISOString()
    });
  }

  salvarItens(itens);
  renderizar();
  fecharModal();
}

function removerItem(id) {
  if (!confirm('Remover este item da lista de desapego?')) return;
  const itens = obterItens().filter(i => i.id !== id);
  salvarItens(itens);
  renderizar();
}

// Fechar modal ao clicar fora ou apertar Esc
document.addEventListener('click', function (event) {
  if (event.target === document.getElementById('modal-item')) fecharModal();
});
document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  const modal = document.getElementById('modal-item');
  if (modal && !modal.hasAttribute('hidden')) fecharModal();
});

window.addEventListener('load', inicializarDesapego);
