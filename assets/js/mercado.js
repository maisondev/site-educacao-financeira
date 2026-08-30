// Área de Mercado: acompanha a maior despesa variável da casa (supermercado),
// registrando cada nota (com o CPF que o usuário já pede) e classificando os
// gastos por categoria, para enxergar onde o dinheiro vai e onde dá pra cortar.

const CATEGORIAS_MERCADO = [
  'Hortifrúti',
  'Carnes e frios',
  'Padaria',
  'Mercearia e industrializados',
  'Bebidas',
  'Laticínios e ovos',
  'Limpeza',
  'Higiene e beleza',
  'Pet',
  'Outros'
];

// id da compra em edição (null = nova compra)
let compraEditandoId = null;

function obterDadosMercado() {
  const dados = Store.ler(Store.CHAVES.MERCADO, { tetoMensal: 0, compras: [] })
    || { tetoMensal: 0, compras: [] };
  if (!Array.isArray(dados.compras)) dados.compras = [];
  if (!Array.isArray(dados.lista)) dados.lista = [];
  if (typeof dados.tetoMensal !== 'number') dados.tetoMensal = 0;

  let precisaSalvar = false;
  dados.compras.forEach((c, i) => {
    if (c.id === undefined || c.id === null) {
      c.id = Date.now() + i;
      precisaSalvar = true;
    }
    if (!Array.isArray(c.itens)) {
      // compatibilidade: compra antiga com valor único
      c.itens = [{ categoria: c.categoria || 'Outros', valor: Number(c.valor) || 0 }];
      precisaSalvar = true;
    }
  });
  if (precisaSalvar) Store.gravar(Store.CHAVES.MERCADO, dados);

  return dados;
}

function salvarDadosMercado(dados) {
  Store.gravar(Store.CHAVES.MERCADO, dados);
}

// ===== Vínculo com Despesas Variáveis =====
// Uma compra pode espelhar-se numa despesa variável (categoria Alimentação) com
// o total da compra, marcada por `origemMercado: <id da compra>`. Editar ou
// remover a compra mantém a despesa em sincronia; o checkbox no modal liga/desliga.

function descricaoDespesaDaCompra(compra) {
  return compra.estabelecimento
    ? `Mercado — ${compra.estabelecimento}`
    : 'Mercado';
}

function despesaVinculadaDaCompra(compraId) {
  return Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, [])
    .find(d => d.origemMercado === compraId);
}

function compraTemDespesaVinculada(compraId) {
  return !!despesaVinculadaDaCompra(compraId);
}

// Cria ou atualiza a despesa variável espelho da compra.
function sincronizarDespesaVariavel(compra) {
  const despesas = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []);
  const total = Math.round(totalDaCompra(compra) * 100) / 100;
  let despesa = despesas.find(d => d.origemMercado === compra.id);

  if (despesa) {
    despesa.descricao = descricaoDespesaDaCompra(compra);
    despesa.valor = total;
    despesa.data = compra.data;
    despesa.competencia = (compra.data || '').slice(0, 7);
  } else {
    despesas.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      categoria: 'alimentacao',
      descricao: descricaoDespesaDaCompra(compra),
      valor: total,
      data: compra.data,
      competencia: (compra.data || '').slice(0, 7),
      dataCriacao: new Date().toISOString(),
      origemMercado: compra.id
    });
  }
  Store.gravar(Store.CHAVES.DESPESAS_VARIAVEIS, despesas);
}

function removerDespesaVinculada(compraId) {
  const despesas = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []);
  const restantes = despesas.filter(d => d.origemMercado !== compraId);
  if (restantes.length !== despesas.length) {
    Store.gravar(Store.CHAVES.DESPESAS_VARIAVEIS, restantes);
  }
}

function totalDaCompra(compra) {
  return (compra.itens || []).reduce((s, i) => s + (Number(i.valor) || 0), 0);
}

function competenciaDaCompra(compra) {
  return (compra.data || '').slice(0, 7);
}

function comprasDaCompetencia(competencia) {
  return obterDadosMercado().compras
    .filter(c => competenciaDaCompra(c) === competencia)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
}

function formatarMoedaMercado(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

// ===== Seletor de mês (local, para não depender das fontes globais de competência) =====

function mesesDisponiveisMercado() {
  const set = new Set([competenciaAtual(), competenciaSelecionada()]);
  obterDadosMercado().compras.forEach(c => {
    const comp = competenciaDaCompra(c);
    if (competenciaValida(comp)) set.add(comp);
  });
  return Array.from(set).sort().reverse();
}

function renderSeletorMercado() {
  const container = document.getElementById('container-competencia');
  if (!container) return;
  const selecionada = competenciaSelecionada();
  const opcoes = mesesDisponiveisMercado()
    .map(c => `<option value="${c}"${c === selecionada ? ' selected' : ''}>${formatarCompetencia(c)}</option>`)
    .join('');
  container.innerHTML = `
    <label class="cmp-label" for="cmp-select">Mês</label>
    <select id="cmp-select" class="cmp-select">${opcoes}</select>
  `;
  document.getElementById('cmp-select').addEventListener('change', e => {
    definirCompetenciaSelecionada(e.target.value);
    renderTudoMercado();
  });
}

// ===== Lista de compras (pré-mercado) =====

function adicionarItemLista() {
  const input = document.getElementById('input-item-lista');
  const nome = input.value.trim();
  if (!nome) return;
  const categoria = document.getElementById('select-item-cat').value || 'Outros';

  const dados = obterDadosMercado();
  dados.lista.push({ id: Date.now(), nome, categoria, noCarrinho: false });
  salvarDadosMercado(dados);

  input.value = '';
  input.focus();
  renderListaMercado();
}

function alternarItemLista(id) {
  const dados = obterDadosMercado();
  const item = dados.lista.find(i => i.id === id);
  if (!item) return;
  item.noCarrinho = !item.noCarrinho;
  salvarDadosMercado(dados);
  renderListaMercado();
}

function removerItemLista(id) {
  const dados = obterDadosMercado();
  dados.lista = dados.lista.filter(i => i.id !== id);
  salvarDadosMercado(dados);
  renderListaMercado();
}

function limparItensComprados() {
  const dados = obterDadosMercado();
  dados.lista = dados.lista.filter(i => !i.noCarrinho);
  salvarDadosMercado(dados);
  renderListaMercado();
}

function limparListaCompras() {
  if (!confirm('Apagar todos os itens da lista?')) return;
  const dados = obterDadosMercado();
  dados.lista = [];
  salvarDadosMercado(dados);
  renderListaMercado();
}

function renderListaMercado() {
  const container = document.getElementById('lista-mercado-itens');
  if (!container) return;

  const lista = obterDadosMercado().lista;

  if (lista.length === 0) {
    container.innerHTML = '<div class="lista-vazia"><p>Lista vazia. Adicione o que precisa comprar.</p></div>';
    return;
  }

  const noCarrinho = lista.filter(i => i.noCarrinho).length;

  // Agrupa por categoria, na ordem de CATEGORIAS_MERCADO
  const grupos = CATEGORIAS_MERCADO
    .map(cat => ({ cat, itens: lista.filter(i => i.categoria === cat) }))
    .filter(g => g.itens.length > 0);

  const gruposHTML = grupos.map(g => `
    <div class="lista-mkt-grupo">
      <h4>${g.cat}</h4>
      ${g.itens.map(i => `
        <div class="lista-mkt-item${i.noCarrinho ? ' comprado' : ''}">
          <input type="checkbox" id="item-${i.id}" ${i.noCarrinho ? 'checked' : ''} onchange="alternarItemLista(${i.id})">
          <label for="item-${i.id}">${i.nome}</label>
          <button class="btn-remover" onclick="removerItemLista(${i.id})" title="Remover">×</button>
        </div>
      `).join('')}
    </div>
  `).join('');

  container.innerHTML = `
    <div class="lista-mkt-resumo">
      <span>${noCarrinho} de ${lista.length} no carrinho</span>
      <span>
        ${noCarrinho > 0 ? '<button onclick="limparItensComprados()">Limpar comprados</button>' : ''}
        <button onclick="limparListaCompras()">Limpar tudo</button>
      </span>
    </div>
    ${gruposHTML}
  `;
}

// ===== Inicialização =====

function inicializarMercado() {
  renderSeletorMercado();

  const selCat = document.getElementById('select-item-cat');
  if (selCat) {
    selCat.innerHTML = CATEGORIAS_MERCADO
      .map(cat => `<option value="${cat}">${cat}</option>`)
      .join('');
  }
  const inputItem = document.getElementById('input-item-lista');
  if (inputItem) {
    inputItem.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); adicionarItemLista(); }
    });
  }

  const dados = obterDadosMercado();
  if (dados.tetoMensal > 0) {
    document.getElementById('input-teto').value = formatarNumeroBrasileiro(dados.tetoMensal);
  }

  // Sugestão de teto a partir da renda centralizada (~15% da renda líquida)
  const renda = typeof obterRendaMensal === 'function' ? obterRendaMensal() : null;
  const hint = document.getElementById('hint-teto');
  if (hint && renda && renda > 0) {
    hint.textContent = `Sugestão: cerca de ${formatarMoedaMercado(renda * 0.15)} (15% da sua renda líquida).`;
  }

  renderTudoMercado();
  abrirCompraDeParametros();
}

// Abre o modal já preenchido quando a página é aberta a partir do Lançamento
// rápido (mercado.html?novaCompra=1&valor=&data=&estab=&desc=). Como o valor já
// foi lançado nas despesas variáveis lá, aqui o registro é só para análise por
// categoria — o checkbox de lançar despesa vem desligado.
function abrirCompraDeParametros() {
  const params = new URLSearchParams(location.search);
  if (!params.get('novaCompra')) return;

  const valor = parseValorBrasileiro(params.get('valor') || '') || 0;
  const data = params.get('data') || new Date().toISOString().split('T')[0];
  const estab = params.get('estab') || '';
  const desc = params.get('desc') || '';

  // Limpa a URL para não reabrir o modal ao atualizar a página.
  history.replaceState(null, '', location.pathname);

  abrirModalCompra();
  document.getElementById('input-compra-data').value = data;
  document.getElementById('input-compra-estabelecimento').value = estab;
  document.getElementById('input-compra-obs').value = desc;
  document.getElementById('itens-compra').innerHTML = '';
  adicionarLinhaItem('Outros', valor ? formatarNumeroBrasileiro(valor) : '');

  const chk = document.getElementById('chk-lancar-despesa');
  if (chk) chk.checked = false;
  const aviso = document.getElementById('aviso-ja-lancado');
  if (aviso) aviso.hidden = false;
}

function definirTetoMercado() {
  const valor = parseValorBrasileiro(document.getElementById('input-teto').value);
  if (!valor || isNaN(valor) || valor <= 0) {
    alert('Informe um teto mensal válido (maior que zero).');
    return;
  }
  const dados = obterDadosMercado();
  dados.tetoMensal = Math.round(valor * 100) / 100;
  salvarDadosMercado(dados);
  renderTudoMercado();
}

// ===== Render =====

function renderTudoMercado() {
  renderSeletorMercado();
  renderListaMercado();
  renderResumoMercado();
  renderListaComprasMercado();
  renderPorCategoriaMercado();
  renderHistoricoMercado();
}

function renderResumoMercado() {
  const competencia = competenciaSelecionada();
  const dados = obterDadosMercado();
  const teto = dados.tetoMensal || 0;
  const gasto = comprasDaCompetencia(competencia).reduce((s, c) => s + totalDaCompra(c), 0);
  const saldo = teto - gasto;

  document.getElementById('valor-teto').textContent = teto > 0 ? formatarMoedaMercado(teto) : '—';
  document.getElementById('valor-gasto').textContent = formatarMoedaMercado(gasto);

  const cardSaldo = document.getElementById('card-saldo');
  const labelSaldo = document.getElementById('label-saldo');
  const valorSaldo = document.getElementById('valor-saldo');
  cardSaldo.classList.remove('alerta', 'sucesso', 'erro');

  if (teto <= 0) {
    labelSaldo.textContent = 'Disponível';
    valorSaldo.textContent = '—';
  } else if (saldo >= 0) {
    labelSaldo.textContent = 'Ainda disponível';
    valorSaldo.textContent = formatarMoedaMercado(saldo);
    cardSaldo.classList.add(saldo > teto * 0.2 ? 'sucesso' : 'alerta');
  } else {
    labelSaldo.textContent = 'Estourou em';
    valorSaldo.textContent = formatarMoedaMercado(Math.abs(saldo));
    cardSaldo.classList.add('erro');
  }

  // Barra
  const pct = teto > 0 ? (gasto / teto) * 100 : 0;
  const barra = document.getElementById('barra-fill');
  barra.style.width = Math.min(pct, 100) + '%';
  barra.classList.remove('alerta', 'erro');
  if (pct >= 100) barra.classList.add('erro');
  else if (pct > 80) barra.classList.add('alerta');
  document.getElementById('percentual-progresso').textContent = teto > 0 ? Math.round(pct) + '%' : '—';
  document.getElementById('texto-barra').textContent = pct > 12 ? Math.round(pct) + '%' : '';

  // Comparação com a média dos meses anteriores
  const infoMedia = document.getElementById('info-media');
  const historico = totaisPorCompetenciaMercado();
  const anteriores = Object.keys(historico)
    .filter(c => c < competencia)
    .sort()
    .slice(-3)
    .map(c => historico[c]);
  if (anteriores.length > 0) {
    const media = anteriores.reduce((s, v) => s + v, 0) / anteriores.length;
    if (media > 0 && gasto > 0) {
      const dif = ((gasto - media) / media) * 100;
      const sinal = dif >= 0 ? 'acima' : 'abaixo';
      infoMedia.textContent = `Média dos últimos ${anteriores.length} meses: ${formatarMoedaMercado(media)} — você está ${Math.abs(Math.round(dif))}% ${sinal}.`;
    } else {
      infoMedia.textContent = `Média dos últimos ${anteriores.length} meses: ${formatarMoedaMercado(media)}.`;
    }
  } else {
    infoMedia.textContent = 'Registre alguns meses para comparar com a sua média.';
  }
}

function renderListaComprasMercado() {
  const competencia = competenciaSelecionada();
  const compras = comprasDaCompetencia(competencia);
  const lista = document.getElementById('lista-compras');

  if (compras.length === 0) {
    lista.innerHTML = '<div class="lista-vazia"><p>Nenhuma compra registrada neste mês. Clique em "Registrar compra".</p></div>';
    return;
  }

  lista.innerHTML = compras.map(c => {
    const cats = (c.itens || []).map(i => `${i.categoria}: ${formatarMoedaMercado(i.valor)}`).join(' • ');
    const vinculo = compraTemDespesaVinculada(c.id)
      ? '<span class="compra-vinculo">↗ lançada nas despesas variáveis</span>'
      : '';
    return `
      <div class="compra-item">
        <div class="compra-info">
          <h4>${c.estabelecimento || 'Compra'}</h4>
          <p class="compra-data">${new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          <p class="compra-cats">${cats}</p>
          ${c.obs ? `<p class="compra-obs">${c.obs}</p>` : ''}
          ${vinculo}
        </div>
        <div class="compra-acoes">
          <span class="compra-valor">${formatarMoedaMercado(totalDaCompra(c))}</span>
          <button class="btn-editar" onclick="editarCompraMercado(${c.id})">Editar</button>
          <button class="btn-remover" onclick="removerCompraMercado(${c.id})" title="Remover">×</button>
        </div>
      </div>
    `;
  }).join('');
}

// Soma por categoria numa lista de compras
function somarPorCategoria(compras) {
  const mapa = {};
  compras.forEach(c => (c.itens || []).forEach(i => {
    const cat = i.categoria || 'Outros';
    mapa[cat] = (mapa[cat] || 0) + (Number(i.valor) || 0);
  }));
  return mapa;
}

function renderPorCategoriaMercado() {
  const competencia = competenciaSelecionada();
  const container = document.getElementById('lista-categorias');
  const mesAtual = somarPorCategoria(comprasDaCompetencia(competencia));
  const nomes = Object.keys(mesAtual);

  if (nomes.length === 0) {
    container.innerHTML = '<div class="lista-vazia"><p>Sem gastos classificados neste mês.</p></div>';
    return;
  }

  // Média por categoria nos até 3 meses anteriores
  const historico = totaisPorCompetenciaMercado();
  const mesesAnteriores = Object.keys(historico).filter(c => c < competencia).sort().slice(-3);
  const somaCatAnt = {};
  mesesAnteriores.forEach(c => {
    const m = somarPorCategoria(comprasDaCompetencia(c));
    Object.keys(m).forEach(cat => { somaCatAnt[cat] = (somaCatAnt[cat] || 0) + m[cat]; });
  });

  const total = nomes.reduce((s, n) => s + mesAtual[n], 0);
  const maior = Math.max(...nomes.map(n => mesAtual[n]));

  container.innerHTML = nomes
    .sort((a, b) => mesAtual[b] - mesAtual[a])
    .map(nome => {
      const valor = mesAtual[nome];
      const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
      const largura = maior > 0 ? (valor / maior) * 100 : 0;
      let comparativo = '';
      if (mesesAnteriores.length > 0) {
        const media = (somaCatAnt[nome] || 0) / mesesAnteriores.length;
        if (media > 0) {
          const dif = Math.round(((valor - media) / media) * 100);
          comparativo = `<span class="cat-comp ${dif > 0 ? 'sobe' : 'desce'}">${dif > 0 ? '+' : ''}${dif}% vs média</span>`;
        }
      }
      return `
        <div class="cat-linha">
          <div class="cat-topo">
            <span class="cat-nome">${nome}</span>
            <span class="cat-valor">${formatarMoedaMercado(valor)} <span class="cat-pct">${pct}%</span></span>
          </div>
          <div class="cat-barra"><div class="cat-barra-fill" style="width:${largura}%"></div></div>
          ${comparativo}
        </div>
      `;
    }).join('');
}

function totaisPorCompetenciaMercado() {
  const mapa = {};
  obterDadosMercado().compras.forEach(c => {
    const comp = competenciaDaCompra(c);
    if (!comp) return;
    mapa[comp] = (mapa[comp] || 0) + totalDaCompra(c);
  });
  return mapa;
}

function renderHistoricoMercado() {
  const container = document.getElementById('historico-meses');
  const mapa = totaisPorCompetenciaMercado();
  const comps = Object.keys(mapa).sort().slice(-6);

  if (comps.length === 0) {
    container.innerHTML = '<div class="lista-vazia"><p>Ainda não há histórico.</p></div>';
    return;
  }

  const maior = Math.max(...comps.map(c => mapa[c]));
  const dados = obterDadosMercado();
  container.innerHTML = comps.map(c => {
    const valor = mapa[c];
    const altura = maior > 0 ? (valor / maior) * 100 : 0;
    const estourou = dados.tetoMensal > 0 && valor > dados.tetoMensal;
    const [ano, mes] = c.split('-');
    const rotulo = `${mes}/${ano.slice(2)}`;
    return `
      <div class="hist-col">
        <span class="hist-valor">${formatarMoedaMercado(valor)}</span>
        <div class="hist-barra"><div class="hist-barra-fill ${estourou ? 'erro' : ''}" style="height:${Math.max(altura, 3)}%"></div></div>
        <span class="hist-mes">${rotulo}</span>
      </div>
    `;
  }).join('');
}

// ===== Modal de compra =====

function linhaItemHTML(categoria = '', valor = '') {
  const opcoes = CATEGORIAS_MERCADO
    .map(cat => `<option value="${cat}"${cat === categoria ? ' selected' : ''}>${cat}</option>`)
    .join('');
  return `
    <div class="item-linha">
      <select class="item-categoria">${opcoes}</select>
      <input type="text" class="item-valor" data-moeda placeholder="0,00" value="${valor}">
      <button type="button" class="btn-remover-item" onclick="this.parentElement.remove()">×</button>
    </div>
  `;
}

function adicionarLinhaItem(categoria = '', valor = '') {
  const container = document.getElementById('itens-compra');
  container.insertAdjacentHTML('beforeend', linhaItemHTML(categoria, valor));
  const ultimoInput = container.querySelector('.item-linha:last-child .item-valor');
  if (ultimoInput && typeof aplicarMascaraMoedaBrasileira === 'function') {
    aplicarMascaraMoedaBrasileira(ultimoInput);
  }
}

function abrirModalCompra() {
  compraEditandoId = null;
  document.getElementById('modal-compra-titulo').textContent = 'Registrar compra';
  document.getElementById('btn-salvar-compra').textContent = 'Registrar';
  document.getElementById('input-compra-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('input-compra-estabelecimento').value = '';
  document.getElementById('input-compra-obs').value = '';
  document.getElementById('itens-compra').innerHTML = '';
  adicionarLinhaItem();
  document.getElementById('chk-lancar-despesa').checked = true;
  document.getElementById('aviso-ja-lancado').hidden = true;
  document.getElementById('modal-compra').removeAttribute('hidden');
}

function editarCompraMercado(id) {
  const compra = obterDadosMercado().compras.find(c => c.id === id);
  if (!compra) return;
  compraEditandoId = id;
  document.getElementById('modal-compra-titulo').textContent = 'Editar compra';
  document.getElementById('btn-salvar-compra').textContent = 'Salvar';
  document.getElementById('input-compra-data').value = compra.data;
  document.getElementById('input-compra-estabelecimento').value = compra.estabelecimento || '';
  document.getElementById('input-compra-obs').value = compra.obs || '';
  document.getElementById('itens-compra').innerHTML = '';
  (compra.itens || []).forEach(i => adicionarLinhaItem(i.categoria, formatarNumeroBrasileiro(i.valor)));
  if ((compra.itens || []).length === 0) adicionarLinhaItem();
  document.getElementById('chk-lancar-despesa').checked = compraTemDespesaVinculada(id);
  document.getElementById('aviso-ja-lancado').hidden = true;
  document.getElementById('modal-compra').removeAttribute('hidden');
}

function fecharModalCompra() {
  compraEditandoId = null;
  document.getElementById('modal-compra').setAttribute('hidden', '');
}

function salvarCompraMercado() {
  const data = document.getElementById('input-compra-data').value;
  const estabelecimento = document.getElementById('input-compra-estabelecimento').value.trim();
  const obs = document.getElementById('input-compra-obs').value.trim();

  if (!data) {
    alert('Selecione a data da compra.');
    return;
  }

  const itens = [];
  document.querySelectorAll('#itens-compra .item-linha').forEach(linha => {
    const categoria = linha.querySelector('.item-categoria').value;
    const valor = parseValorBrasileiro(linha.querySelector('.item-valor').value);
    if (valor && valor > 0) {
      itens.push({ categoria, valor: Math.round(valor * 100) / 100 });
    }
  });

  if (itens.length === 0) {
    alert('Informe pelo menos uma categoria com valor.');
    return;
  }

  const dados = obterDadosMercado();
  let compraSalva;
  if (compraEditandoId !== null) {
    compraSalva = dados.compras.find(c => c.id === compraEditandoId);
    if (compraSalva) {
      compraSalva.data = data;
      compraSalva.estabelecimento = estabelecimento;
      compraSalva.obs = obs;
      compraSalva.itens = itens;
      delete compraSalva.categoria;
      delete compraSalva.valor;
    }
  } else {
    compraSalva = { id: Date.now(), data, estabelecimento, obs, itens };
    dados.compras.push(compraSalva);
  }

  salvarDadosMercado(dados);

  // Sincroniza (ou remove) a despesa variável espelho conforme o checkbox.
  if (compraSalva) {
    if (document.getElementById('chk-lancar-despesa').checked) {
      sincronizarDespesaVariavel(compraSalva);
    } else {
      removerDespesaVinculada(compraSalva.id);
    }
  }

  fecharModalCompra();

  // Se a compra caiu em outro mês, segue esse mês
  if (data.slice(0, 7) !== competenciaSelecionada() && competenciaValida(data.slice(0, 7))) {
    definirCompetenciaSelecionada(data.slice(0, 7));
  }
  renderTudoMercado();
}

function removerCompraMercado(id) {
  const temVinculo = compraTemDespesaVinculada(id);
  const pergunta = temVinculo
    ? 'Remover esta compra? A despesa variável vinculada também será removida.'
    : 'Remover esta compra?';
  if (!confirm(pergunta)) return;
  const dados = obterDadosMercado();
  dados.compras = dados.compras.filter(c => c.id !== id);
  salvarDadosMercado(dados);
  removerDespesaVinculada(id);
  renderTudoMercado();
}

// Fechar modal ao clicar fora
document.addEventListener('click', function (event) {
  const modal = document.getElementById('modal-compra');
  if (event.target === modal) fecharModalCompra();
});

window.addEventListener('load', inicializarMercado);
