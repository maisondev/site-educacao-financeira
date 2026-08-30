// Cadastros gerais: gerencia as listas básicas (categorias de despesa,
// formas de pagamento, estabelecimentos) que alimentam os selects do app.
// Lê e grava via o objeto Cadastros (assets/js/nucleo/cadastros-dados.js).

function cadEscapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

// ---------- Categorias ----------

function cadRenderCategorias() {
  const alvo = document.getElementById('cad-categorias');
  if (!alvo) return;

  const custom = Cadastros.categoriasCustom();

  const linhasPadrao = Object.keys(CAD_CATEGORIAS_PADRAO).map(chave => `
    <div class="cad-item">
      <span class="cad-item-rotulo">${cadEscapar(CAD_CATEGORIAS_PADRAO[chave])}</span>
      <span class="cad-tag">padrão</span>
    </div>
  `).join('');

  const linhasCustom = custom.map(c => `
    <div class="cad-item" data-chave="${cadEscapar(c.chave)}">
      <input type="text" class="cad-edit-rotulo" value="${cadEscapar(c.rotulo)}"
             onchange="cadEditarCategoria('${cadEscapar(c.chave)}', this.value)">
      <button type="button" class="cad-btn-remover" onclick="cadRemoverCategoria('${cadEscapar(c.chave)}')"
              aria-label="Remover categoria">Remover</button>
    </div>
  `).join('');

  alvo.innerHTML = linhasPadrao + linhasCustom +
    (custom.length === 0 ? '' : '') +
    '<p class="cad-ajuda">As categorias padrão não podem ser removidas. As personalizadas aparecem em todos os selects de categoria.</p>';
}

function cadAdicionarCategoria() {
  const campo = document.getElementById('cad-nova-categoria');
  const rotulo = campo.value.trim();
  if (!rotulo) return;

  const chave = Cadastros.gerarChave(rotulo);
  const dados = Cadastros.ler();
  dados.categorias = dados.categorias || [];

  if (Cadastros.ehPadraoCategoria(chave) || dados.categorias.some(c => c.chave === chave)) {
    alert('Já existe uma categoria equivalente.');
    return;
  }

  dados.categorias.push({ chave, rotulo });
  Cadastros.gravar(dados);
  campo.value = '';
  cadRenderCategorias();
}

function cadEditarCategoria(chave, novoRotulo) {
  const rotulo = (novoRotulo || '').trim();
  const dados = Cadastros.ler();
  const item = (dados.categorias || []).find(c => c.chave === chave);
  if (!item) return;
  if (!rotulo) {
    cadRenderCategorias();
    return;
  }
  item.rotulo = rotulo;
  Cadastros.gravar(dados);
  cadRenderCategorias();
}

function cadRemoverCategoria(chave) {
  if (!confirm('Remover esta categoria personalizada? Lançamentos antigos que a usam mantêm o texto da chave.')) return;
  const dados = Cadastros.ler();
  dados.categorias = (dados.categorias || []).filter(c => c.chave !== chave);
  Cadastros.gravar(dados);
  cadRenderCategorias();
}

// ---------- Formas de pagamento ----------

function cadRenderPagamentos() {
  const alvo = document.getElementById('cad-pagamentos');
  if (!alvo) return;

  const custom = Cadastros.formasPagamentoCustom();

  const linhasPadrao = Object.keys(CAD_PAGAMENTOS_PADRAO).map(chave => `
    <div class="cad-item">
      <span class="cad-item-rotulo">${cadEscapar(CAD_PAGAMENTOS_PADRAO[chave])}</span>
      <span class="cad-tag">padrão</span>
    </div>
  `).join('');

  const linhasCustom = custom.map(c => `
    <div class="cad-item" data-chave="${cadEscapar(c.chave)}">
      <input type="text" class="cad-edit-rotulo" value="${cadEscapar(c.rotulo)}"
             onchange="cadEditarPagamento('${cadEscapar(c.chave)}', this.value)">
      <button type="button" class="cad-btn-remover" onclick="cadRemoverPagamento('${cadEscapar(c.chave)}')"
              aria-label="Remover forma de pagamento">Remover</button>
    </div>
  `).join('');

  alvo.innerHTML = linhasPadrao + linhasCustom +
    '<p class="cad-ajuda">As formas padrão não podem ser removidas. As personalizadas aparecem no lançamento rápido.</p>';
}

function cadAdicionarPagamento() {
  const campo = document.getElementById('cad-nova-pagamento');
  const rotulo = campo.value.trim();
  if (!rotulo) return;

  const chave = Cadastros.gerarChave(rotulo);
  const dados = Cadastros.ler();
  dados.formasPagamento = dados.formasPagamento || [];

  if (Cadastros.ehPadraoPagamento(chave) || dados.formasPagamento.some(c => c.chave === chave)) {
    alert('Já existe uma forma de pagamento equivalente.');
    return;
  }

  dados.formasPagamento.push({ chave, rotulo });
  Cadastros.gravar(dados);
  campo.value = '';
  cadRenderPagamentos();
}

function cadEditarPagamento(chave, novoRotulo) {
  const rotulo = (novoRotulo || '').trim();
  const dados = Cadastros.ler();
  const item = (dados.formasPagamento || []).find(c => c.chave === chave);
  if (!item) return;
  if (!rotulo) {
    cadRenderPagamentos();
    return;
  }
  item.rotulo = rotulo;
  Cadastros.gravar(dados);
  cadRenderPagamentos();
}

function cadRemoverPagamento(chave) {
  if (!confirm('Remover esta forma de pagamento personalizada?')) return;
  const dados = Cadastros.ler();
  dados.formasPagamento = (dados.formasPagamento || []).filter(c => c.chave !== chave);
  Cadastros.gravar(dados);
  cadRenderPagamentos();
}

// ---------- Estabelecimentos ----------

function cadRenderEstabelecimentos() {
  const alvo = document.getElementById('cad-estabelecimentos');
  if (!alvo) return;

  const lista = Cadastros.estabelecimentos();
  if (lista.length === 0) {
    alvo.innerHTML = '<p class="cad-ajuda">Nenhum estabelecimento cadastrado. Adicione acima ou salve direto pelo lançamento rápido.</p>';
    return;
  }

  alvo.innerHTML = lista.map(nome => `
    <div class="cad-item">
      <input type="text" class="cad-edit-rotulo" value="${cadEscapar(nome)}"
             onchange="cadEditarEstabelecimento('${cadEscapar(nome).replace(/'/g, "\\'")}', this.value)">
      <button type="button" class="cad-btn-remover" onclick="cadRemoverEstabelecimento('${cadEscapar(nome).replace(/'/g, "\\'")}')"
              aria-label="Remover estabelecimento">Remover</button>
    </div>
  `).join('');
}

function cadAdicionarEstabelecimento() {
  const campo = document.getElementById('cad-novo-estabelecimento');
  const nome = campo.value.trim();
  if (!nome) return;
  if (!Cadastros.adicionarEstabelecimento(nome)) {
    alert('Esse estabelecimento já está na lista.');
    return;
  }
  campo.value = '';
  cadRenderEstabelecimentos();
}

function cadEditarEstabelecimento(antigo, novo) {
  const nome = (novo || '').trim();
  const dados = Cadastros.ler();
  dados.estabelecimentos = dados.estabelecimentos || [];
  const idx = dados.estabelecimentos.findIndex(e => e === antigo);
  if (idx === -1) return;
  if (!nome) {
    cadRenderEstabelecimentos();
    return;
  }
  dados.estabelecimentos[idx] = nome;
  Cadastros.gravar(dados);
  cadRenderEstabelecimentos();
}

function cadRemoverEstabelecimento(nome) {
  if (!confirm('Remover este estabelecimento?')) return;
  const dados = Cadastros.ler();
  dados.estabelecimentos = (dados.estabelecimentos || []).filter(e => e !== nome);
  Cadastros.gravar(dados);
  cadRenderEstabelecimentos();
}

// ---------- Init ----------

function cadInit() {
  cadRenderCategorias();
  cadRenderPagamentos();
  cadRenderEstabelecimentos();

  document.getElementById('cad-add-categoria').addEventListener('click', cadAdicionarCategoria);
  document.getElementById('cad-add-pagamento').addEventListener('click', cadAdicionarPagamento);
  document.getElementById('cad-add-estabelecimento').addEventListener('click', cadAdicionarEstabelecimento);

  [
    ['cad-nova-categoria', cadAdicionarCategoria],
    ['cad-nova-pagamento', cadAdicionarPagamento],
    ['cad-novo-estabelecimento', cadAdicionarEstabelecimento]
  ].forEach(([id, fn]) => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); fn(); }
    });
  });
}

document.addEventListener('DOMContentLoaded', cadInit);
