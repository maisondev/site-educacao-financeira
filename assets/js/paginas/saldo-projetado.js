// Página "Saldo projetado": reaproveita o cálculo de saldo-mes.js e deixa o
// usuário somar entradas/saídas avulsas por mês (ajustes). Os ajustes são
// gravados na mesma chave que saldo-mes.js lê, então também aparecem no Painel.

const SP_CHAVE = typeof SM_AJUSTES_CHAVE === 'string' ? SM_AJUSTES_CHAVE : 'saldo_ajustes';

let spEditandoId = null;

function spCompetencia() {
  if (typeof competenciaSelecionada === 'function') return competenciaSelecionada();
  if (typeof smCompetenciaAtual === 'function') return smCompetenciaAtual();
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`;
}

function spLerTodos() {
  const dados = Store.ler(SP_CHAVE, {});
  return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};
}

function spGravarTodos(obj) {
  return Store.gravar(SP_CHAVE, obj);
}

function spDoMes(competencia) {
  const lista = spLerTodos()[competencia || spCompetencia()];
  return Array.isArray(lista) ? lista : [];
}

function spEscapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function spMensagem(texto, estado) {
  const el = document.getElementById('sp-mensagem');
  if (!el) return;
  el.className = `sp-mensagem sp-mensagem-${estado}`;
  el.textContent = texto;
}

function spAtualizarTudo() {
  if (typeof renderizarSaldoDoMes === 'function') renderizarSaldoDoMes();
  spRenderLista();
}

function spAdicionar() {
  const competencia = spCompetencia();
  const tipo = document.getElementById('sp-tipo').value === 'entrada' ? 'entrada' : 'saida';
  const descricao = document.getElementById('sp-descricao').value.trim();
  const valor = parseValorBrasileiro(document.getElementById('sp-valor').value);

  if (!descricao) {
    spMensagem('Descreva o ajuste (ex: "presente de aniversário").', 'erro');
    return;
  }
  if (!valor || isNaN(valor) || valor <= 0) {
    spMensagem('Informe um valor válido.', 'erro');
    return;
  }

  const todos = spLerTodos();
  if (!Array.isArray(todos[competencia])) todos[competencia] = [];
  todos[competencia].push({
    id: Date.now(),
    tipo,
    descricao,
    valor: Math.round(valor * 100) / 100
  });
  spGravarTodos(todos);

  document.getElementById('sp-descricao').value = '';
  document.getElementById('sp-valor').value = '';
  document.getElementById('sp-descricao').focus();
  spMensagem('Ajuste adicionado.', 'sucesso');
  spAtualizarTudo();
}

function spRemover(id) {
  if (!confirm('Remover este ajuste?')) return;
  const competencia = spCompetencia();
  const todos = spLerTodos();
  todos[competencia] = spDoMes(competencia).filter(a => a.id !== id);
  spGravarTodos(todos);
  if (spEditandoId === id) spEditandoId = null;
  spMensagem('Ajuste removido.', 'neutro');
  spAtualizarTudo();
}

function spEditar(id) {
  spEditandoId = id;
  spRenderLista();
  const campo = document.querySelector(`.sp-item[data-id="${id}"] .sp-ed-descricao`);
  if (campo) campo.focus();
}

function spCancelarEdicao() {
  spEditandoId = null;
  spRenderLista();
}

function spSalvarEdicao(id) {
  const raiz = document.querySelector(`.sp-item[data-id="${id}"]`);
  if (!raiz) return;

  const tipo = raiz.querySelector('.sp-ed-tipo').value === 'entrada' ? 'entrada' : 'saida';
  const descricao = raiz.querySelector('.sp-ed-descricao').value.trim();
  const valor = parseValorBrasileiro(raiz.querySelector('.sp-ed-valor').value);

  if (!descricao) {
    spMensagem('Descreva o ajuste.', 'erro');
    return;
  }
  if (!valor || isNaN(valor) || valor <= 0) {
    spMensagem('Informe um valor válido.', 'erro');
    return;
  }

  const competencia = spCompetencia();
  const todos = spLerTodos();
  const alvo = (todos[competencia] || []).find(a => a.id === id);
  if (alvo) {
    alvo.tipo = tipo;
    alvo.descricao = descricao;
    alvo.valor = Math.round(valor * 100) / 100;
  }
  spGravarTodos(todos);

  spEditandoId = null;
  spMensagem('Ajuste atualizado.', 'sucesso');
  spAtualizarTudo();
}

function spItemHTML(a) {
  if (a.id === spEditandoId) {
    return `
      <div class="sp-item sp-edicao" data-id="${a.id}">
        <select class="sp-ed-tipo" aria-label="Tipo do ajuste">
          <option value="entrada"${a.tipo === 'entrada' ? ' selected' : ''}>Entrada</option>
          <option value="saida"${a.tipo === 'saida' ? ' selected' : ''}>Saída</option>
        </select>
        <input type="text" class="sp-ed-descricao" value="${spEscapar(a.descricao)}" placeholder="Descrição" aria-label="Descrição">
        <input type="text" class="sp-ed-valor" value="${formatarNumeroBrasileiro(a.valor)}" inputmode="decimal" aria-label="Valor">
        <button type="button" class="btn btn-primary sp-ed-salvar" data-id="${a.id}">Salvar</button>
        <button type="button" class="btn btn-secondary sp-ed-cancelar">Cancelar</button>
      </div>`;
  }

  const sinal = a.tipo === 'entrada' ? '+ ' : '− ';
  return `
    <div class="sp-item sp-${a.tipo === 'entrada' ? 'entrada' : 'saida'}" data-id="${a.id}">
      <span class="sp-item-desc">${spEscapar(a.descricao)}</span>
      <span class="sp-item-valor">${sinal}${formatarMoedaBrasileira(a.valor)}</span>
      <span class="sp-item-acoes">
        <button type="button" class="sp-mini-btn" data-acao="editar" data-id="${a.id}" title="Editar" aria-label="Editar ajuste">${typeof icone === 'function' ? icone('lapis') : 'Editar'}</button>
        <button type="button" class="sp-mini-btn" data-acao="remover" data-id="${a.id}" title="Remover" aria-label="Remover ajuste">${typeof icone === 'function' ? icone('lixeira') : 'Remover'}</button>
      </span>
    </div>`;
}

function spRenderLista() {
  const alvo = document.getElementById('sp-lista');
  if (!alvo) return;

  const itens = spDoMes();
  if (itens.length === 0) {
    alvo.innerHTML = '<p class="sp-vazio">Nenhum ajuste manual neste mês.</p>';
    return;
  }
  alvo.innerHTML = itens.map(spItemHTML).join('');
}

function spTratarClique(e) {
  const botao = e.target.closest('button');
  if (!botao) return;

  if (botao.classList.contains('sp-ed-salvar')) {
    spSalvarEdicao(Number(botao.dataset.id));
    return;
  }
  if (botao.classList.contains('sp-ed-cancelar')) {
    spCancelarEdicao();
    return;
  }

  const acao = botao.dataset.acao;
  if (!acao) return;
  const id = Number(botao.dataset.id);
  if (acao === 'editar') spEditar(id);
  else if (acao === 'remover') spRemover(id);
}

function inicializarSaldoProjetado() {
  if (typeof migrarCompetencias === 'function') migrarCompetencias();

  if (typeof renderizarSeletorCompetencia === 'function') {
    renderizarSeletorCompetencia('sp-seletor-competencia', spAtualizarTudo);
  }

  document.getElementById('sp-adicionar').addEventListener('click', spAdicionar);
  document.getElementById('sp-valor').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      spAdicionar();
    }
  });

  const lista = document.getElementById('sp-lista');
  lista.addEventListener('click', spTratarClique);
  lista.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.closest('.sp-edicao')) {
      e.preventDefault();
      spSalvarEdicao(Number(e.target.closest('.sp-edicao').dataset.id));
    }
  });

  if (typeof renderizarSaldoDoMes === 'function') renderizarSaldoDoMes();
  spRenderLista();
}

document.addEventListener('DOMContentLoaded', inicializarSaldoProjetado);
