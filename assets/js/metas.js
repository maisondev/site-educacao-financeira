// Gerenciar metas financeiras com localStorage


// Carregar metas ao abrir a página
document.addEventListener('DOMContentLoaded', function() {
  renderizarMetas();

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

function adicionarMeta() {
  const titulo = document.getElementById('meta-titulo').value.trim();
  const descricao = document.getElementById('meta-descricao').value.trim();
  const valorAlvo = parseFloat(document.getElementById('meta-valor-alvo').value);
  const valorAtual = parseFloat(document.getElementById('meta-valor-atual').value);
  const prazo = document.getElementById('meta-prazo').value;
  const data = document.getElementById('meta-data').value;

  // Validação
  if (!titulo) {
    alert('Por favor, adicione um título para a meta');
    return;
  }

  if (!valorAlvo || valorAlvo <= 0) {
    alert('Por favor, adicione um valor alvo válido');
    return;
  }

  if (!prazo) {
    alert('Por favor, selecione um prazo');
    return;
  }

  // Criar objeto meta
  const meta = {
    id: Date.now(),
    titulo: titulo,
    descricao: descricao,
    valorAlvo: valorAlvo,
    valorAtual: valorAtual || 0,
    prazo: prazo,
    data: data || null,
    dataCriacao: new Date().toISOString()
  };

  // Salvar no localStorage
  const metas = obterMetas();
  metas.push(meta);
  salvarMetas(metas);

  // Limpar formulário e renderizar
  limparFormulario();
  renderizarMetas();
}

function obterMetas() {
  return Store.ler(Store.CHAVES.METAS, []);
}

function salvarMetas(metas) {
  Store.gravar(Store.CHAVES.METAS, metas);
}

function renderizarMetas() {
  const metas = obterMetas();
  const container = document.getElementById('lista-metas');

  if (metas.length === 0) {
    container.innerHTML = '<div class="lista-vazia"><p>Nenhuma meta adicionada ainda. Crie sua primeira meta acima!</p></div>';
    return;
  }

  // Ordenar metas por valor alvo decrescente
  metas.sort((a, b) => b.valorAlvo - a.valorAlvo);

  container.innerHTML = metas.map(meta => criarCardMeta(meta)).join('');
}

function criarCardMeta(meta) {
  const progresso = (meta.valorAtual / meta.valorAlvo) * 100;
  const progressoLimitado = Math.min(progresso, 100);
  const atingiu = meta.valorAtual >= meta.valorAlvo;
  const nivelClass = `nivel-${meta.prazo}`;
  const textoPrazo = {
    curto: 'Curto prazo',
    medio: 'Médio prazo',
    longo: 'Longo prazo'
  }[meta.prazo];

  let dataLimite = '';
  if (meta.data) {
    const date = new Date(meta.data);
    dataLimite = date.toLocaleDateString('pt-BR');
  }

  return `
    <div class="card-meta">
      <div class="meta-info">
        <h3>${escaparHTML(meta.titulo)}</h3>

        <span class="meta-nivel ${nivelClass}">${textoPrazo}</span>

        ${meta.descricao ? `<p class="meta-descricao">${escaparHTML(meta.descricao)}</p>` : ''}

        <div class="meta-status">
          <div>
            <strong>R$ ${meta.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            de R$ ${meta.valorAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div>
            ${progressoLimitado.toFixed(0)}%
          </div>
          ${atingiu ? `<div style="color: #2d7e3c; font-weight: bold;">${icone('check', 14)} Atingida!</div>` : ''}
        </div>

        <div class="meta-progresso">
          <div class="meta-progresso-barra" style="width: ${progressoLimitado}%"></div>
        </div>

        ${dataLimite ? `<p class="meta-descricao">Prazo: ${dataLimite}</p>` : ''}
      </div>

      <div class="meta-acoes">
        <button class="btn-editar" onclick="abrirEdicao(${meta.id})">Editar</button>
        <button class="btn-deletar" onclick="deletarMeta(${meta.id})">Deletar</button>
      </div>
    </div>
  `;
}

function abrirEdicao(id) {
  const metas = obterMetas();
  const meta = metas.find(m => m.id === id);

  if (!meta) return;

  // Preencher o formulário com os dados da meta
  document.getElementById('edit-meta-id').value = meta.id;
  document.getElementById('edit-titulo').value = meta.titulo;
  document.getElementById('edit-descricao').value = meta.descricao;
  document.getElementById('edit-valor-alvo').value = meta.valorAlvo;
  document.getElementById('edit-valor-atual').value = meta.valorAtual;
  document.getElementById('edit-prazo').value = meta.prazo;
  document.getElementById('edit-data').value = meta.data || '';

  // Mostrar o modal
  document.getElementById('modal-edicao').removeAttribute('hidden');
}

function fecharModalEdicao() {
  document.getElementById('modal-edicao').setAttribute('hidden', '');
  document.getElementById('formulario-edicao').reset();
}

function salvarEdicao(event) {
  event.preventDefault();

  const metaId = parseInt(document.getElementById('edit-meta-id').value);
  const titulo = document.getElementById('edit-titulo').value.trim();
  const descricao = document.getElementById('edit-descricao').value.trim();
  const valorAlvo = parseFloat(document.getElementById('edit-valor-alvo').value);
  const valorAtual = parseFloat(document.getElementById('edit-valor-atual').value);
  const prazo = document.getElementById('edit-prazo').value;
  const data = document.getElementById('edit-data').value;

  // Validação
  if (!titulo) {
    alert('Por favor, insira um título');
    return;
  }

  if (!valorAlvo || valorAlvo <= 0) {
    alert('Por favor, insira um valor alvo válido');
    return;
  }

  if (!prazo) {
    alert('Por favor, selecione um prazo');
    return;
  }

  // Atualizar a meta
  const metas = obterMetas();
  const meta = metas.find(m => m.id === metaId);

  if (!meta) return;

  meta.titulo = titulo;
  meta.descricao = descricao;
  meta.valorAlvo = valorAlvo;
  meta.valorAtual = valorAtual;
  meta.prazo = prazo;
  meta.data = data || null;

  salvarMetas(metas);
  fecharModalEdicao();
  renderizarMetas();
}

function deletarMeta(id) {
  const metas = obterMetas();
  const meta = metas.find(m => m.id === id);

  if (!meta) return;

  const confirmar = confirm(`Tem certeza que quer deletar a meta "${meta.titulo}"?`);
  if (!confirmar) return;

  const metasAtualizadas = metas.filter(m => m.id !== id);
  salvarMetas(metasAtualizadas);
  renderizarMetas();
}

function limparFormulario() {
  document.getElementById('meta-titulo').value = '';
  document.getElementById('meta-descricao').value = '';
  document.getElementById('meta-valor-alvo').value = '';
  document.getElementById('meta-valor-atual').value = '0';
  document.getElementById('meta-prazo').value = '';
  document.getElementById('meta-data').value = '';
  document.getElementById('meta-titulo').focus();
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
