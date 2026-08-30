function inicializarBalanco() {
  atualizarVisualizacao();
}

let ativoEditandoId = null;
let passivoEditandoId = null;

function obterDados() {
  const dados = Store.ler(Store.CHAVES.BALANCO, { ativos: [], passivos: [] })
    || { ativos: [], passivos: [] };
  if (!Array.isArray(dados.ativos)) dados.ativos = [];
  if (!Array.isArray(dados.passivos)) dados.passivos = [];
  return dados;
}

function salvarDados(dados) {
  Store.gravar(Store.CHAVES.BALANCO, dados);
}

// Saldo total do FGTS, puxado da página FGTS (chave 'fgts').
// Soma o último registro de saldo de cada conta vinculada. Entra como ativo
// automático no balanço — não é editável aqui.
function obterSaldoFgts() {
  const dados = Store.ler(Store.CHAVES.FGTS, null);
  if (!dados || !Array.isArray(dados.contas)) return 0;

  return dados.contas.reduce((total, conta) => {
    const snaps = Array.isArray(conta.snapshots) ? conta.snapshots : [];
    if (snaps.length === 0) return total;
    const ultimo = [...snaps].sort((a, b) => new Date(a.data) - new Date(b.data)).pop();
    return total + (ultimo && ultimo.saldo ? ultimo.saldo : 0);
  }, 0);
}

function abrirModalAtivo() {
  ativoEditandoId = null;
  document.getElementById('input-ativo-nome').value = '';
  document.getElementById('select-ativo-categoria').value = '';
  document.getElementById('input-ativo-valor').value = '';
  document.getElementById('titulo-modal-ativo').textContent = 'Adicionar Ativo';
  document.getElementById('btn-salvar-ativo').textContent = 'Adicionar';
  document.getElementById('modal-ativo').removeAttribute('hidden');
  document.getElementById('input-ativo-nome').focus();
}

function editarAtivo(id) {
  const dados = obterDados();
  const ativo = dados.ativos.find(a => a.id === id);
  if (!ativo) return;

  ativoEditandoId = id;
  document.getElementById('input-ativo-nome').value = ativo.nome;
  document.getElementById('select-ativo-categoria').value = ativo.categoria;
  document.getElementById('input-ativo-valor').value = formatarMoedaBrasileira(ativo.valor).replace(/R\$\s?/, '');
  document.getElementById('titulo-modal-ativo').textContent = 'Editar Ativo';
  document.getElementById('btn-salvar-ativo').textContent = 'Salvar alterações';
  document.getElementById('modal-ativo').removeAttribute('hidden');
  document.getElementById('input-ativo-nome').focus();
}

function fecharModalAtivo() {
  document.getElementById('modal-ativo').setAttribute('hidden', '');
}

function abrirModalPassivo() {
  passivoEditandoId = null;
  document.getElementById('input-passivo-nome').value = '';
  document.getElementById('select-passivo-categoria').value = '';
  document.getElementById('input-passivo-valor').value = '';
  document.getElementById('titulo-modal-passivo').textContent = 'Adicionar Passivo';
  document.getElementById('btn-salvar-passivo').textContent = 'Adicionar';
  document.getElementById('modal-passivo').removeAttribute('hidden');
  document.getElementById('input-passivo-nome').focus();
}

function editarPassivo(id) {
  const dados = obterDados();
  const passivo = dados.passivos.find(p => p.id === id);
  if (!passivo) return;

  passivoEditandoId = id;
  document.getElementById('input-passivo-nome').value = passivo.nome;
  document.getElementById('select-passivo-categoria').value = passivo.categoria;
  document.getElementById('input-passivo-valor').value = formatarMoedaBrasileira(passivo.valor).replace(/R\$\s?/, '');
  document.getElementById('titulo-modal-passivo').textContent = 'Editar Passivo';
  document.getElementById('btn-salvar-passivo').textContent = 'Salvar alterações';
  document.getElementById('modal-passivo').removeAttribute('hidden');
  document.getElementById('input-passivo-nome').focus();
}

function fecharModalPassivo() {
  document.getElementById('modal-passivo').setAttribute('hidden', '');
}

function salvarAtivo() {
  const nome = document.getElementById('input-ativo-nome').value.trim();
  const categoria = document.getElementById('select-ativo-categoria').value;
  let valor = parseValorBrasileiro(document.getElementById('input-ativo-valor').value);

  if (!nome) {
    alert('Por favor, insira uma descrição');
    return;
  }

  if (!categoria) {
    alert('Por favor, selecione uma categoria');
    return;
  }

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  valor = Math.round(valor * 100) / 100;

  const dados = obterDados();

  if (ativoEditandoId !== null) {
    const ativo = dados.ativos.find(a => a.id === ativoEditandoId);
    if (ativo) {
      ativo.nome = nome;
      ativo.categoria = categoria;
      ativo.valor = valor;
    }
  } else {
    dados.ativos.push({
      id: Date.now(),
      nome,
      categoria,
      valor,
      dataCriacao: new Date().toISOString()
    });
  }

  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalAtivo();
}

function salvarPassivo() {
  const nome = document.getElementById('input-passivo-nome').value.trim();
  const categoria = document.getElementById('select-passivo-categoria').value;
  let valor = parseValorBrasileiro(document.getElementById('input-passivo-valor').value);

  if (!nome) {
    alert('Por favor, insira uma descrição');
    return;
  }

  if (!categoria) {
    alert('Por favor, selecione uma categoria');
    return;
  }

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  valor = Math.round(valor * 100) / 100;

  const dados = obterDados();

  if (passivoEditandoId !== null) {
    const passivo = dados.passivos.find(p => p.id === passivoEditandoId);
    if (passivo) {
      passivo.nome = nome;
      passivo.categoria = categoria;
      passivo.valor = valor;
    }
  } else {
    dados.passivos.push({
      id: Date.now(),
      nome,
      categoria,
      valor,
      dataCriacao: new Date().toISOString()
    });
  }

  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalPassivo();
}

function atualizarVisualizacao() {
  const dados = obterDados();

  const saldoFgts = obterSaldoFgts();
  const totalAtivos = dados.ativos.reduce((sum, a) => sum + a.valor, 0) + saldoFgts;
  const totalPassivos = dados.passivos.reduce((sum, p) => sum + p.valor, 0);
  const patrimonioLiquido = totalAtivos - totalPassivos;

  // Atualizar cards resumo
  document.getElementById('total-ativo').textContent = formatarMoedaBrasileira(totalAtivos);
  document.getElementById('total-passivo').textContent = formatarMoedaBrasileira(totalPassivos);
  document.getElementById('patrimonio-liquido').textContent = formatarMoedaBrasileira(patrimonioLiquido);

  // Atualizar totais das seções
  document.getElementById('total-ativo-secao').textContent = formatarMoedaBrasileira(totalAtivos);
  document.getElementById('total-passivo-secao').textContent = formatarMoedaBrasileira(totalPassivos);

  atualizarListaAtivos(dados);
  atualizarListaPassivos(dados);
}

function atualizarListaAtivos(dados) {
  const lista = document.getElementById('lista-ativos');
  const saldoFgts = obterSaldoFgts();

  if (dados.ativos.length === 0 && saldoFgts <= 0) {
    lista.innerHTML = '<div class="lista-vazia">Nenhum ativo registrado</div>';
    return;
  }

  const linhaFgts = saldoFgts > 0 ? `
    <div class="item-patrimonio item-ativo">
      <div class="item-info">
        <h4>FGTS</h4>
        <p class="item-categoria">Saldo automático — da página <a href="./fgts.html">FGTS</a></p>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="item-valor">
          <div class="item-valor-principal">${formatarMoedaBrasileira(saldoFgts)}</div>
        </div>
      </div>
    </div>
  ` : '';

  // Ordenar por valor (maior primeiro)
  const ativosOrdenados = [...dados.ativos].sort((a, b) => b.valor - a.valor);

  lista.innerHTML = linhaFgts + ativosOrdenados.map((ativo) => `
    <div class="item-patrimonio item-ativo">
      <div class="item-info">
        <h4>${ativo.nome}</h4>
        <p class="item-categoria">${obterNomeCategoriaAtivo(ativo.categoria)}</p>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="item-valor">
          <div class="item-valor-principal">${formatarMoedaBrasileira(ativo.valor)}</div>
        </div>
        <button class="btn-editar" onclick="editarAtivo(${ativo.id})" title="Editar ativo">Editar</button>
        <button class="btn-remover" onclick="removerAtivo(${ativo.id})" title="Remover ativo">×</button>
      </div>
    </div>
  `).join('');
}

function atualizarListaPassivos(dados) {
  const lista = document.getElementById('lista-passivos');

  if (dados.passivos.length === 0) {
    lista.innerHTML = '<div class="lista-vazia">Nenhum passivo registrado</div>';
    return;
  }

  // Ordenar por valor (maior primeiro)
  const passivosOrdenados = [...dados.passivos].sort((a, b) => b.valor - a.valor);

  lista.innerHTML = passivosOrdenados.map((passivo) => `
    <div class="item-patrimonio item-passivo">
      <div class="item-info">
        <h4>${passivo.nome}</h4>
        <p class="item-categoria">${obterNomeCategoriaPassivo(passivo.categoria)}</p>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="item-valor">
          <div class="item-valor-principal">${formatarMoedaBrasileira(passivo.valor)}</div>
        </div>
        <button class="btn-editar" onclick="editarPassivo(${passivo.id})" title="Editar passivo">Editar</button>
        <button class="btn-remover" onclick="removerPassivo(${passivo.id})" title="Remover passivo">×</button>
      </div>
    </div>
  `).join('');
}

function removerAtivo(id) {
  if (confirm('Tem certeza que deseja remover este ativo?')) {
    const dados = obterDados();
    dados.ativos = dados.ativos.filter(a => a.id !== id);
    salvarDados(dados);
    atualizarVisualizacao();
  }
}

function removerPassivo(id) {
  if (confirm('Tem certeza que deseja remover este passivo?')) {
    const dados = obterDados();
    dados.passivos = dados.passivos.filter(p => p.id !== id);
    salvarDados(dados);
    atualizarVisualizacao();
  }
}

function obterNomeCategoriaAtivo(categoria) {
  const categorias = {
    'banco': 'Banco / Poupança',
    'investimentos': 'Investimentos',
    'imovel': 'Imóvel',
    'veiculo': 'Veículo',
    'joias': 'Joias / Ouro',
    'outros': 'Outros'
  };
  return categorias[categoria] || categoria;
}

function obterNomeCategoriaPassivo(categoria) {
  const categorias = {
    'emprestimo': 'Empréstimo Pessoal',
    'financiamento': 'Financiamento',
    'cartao': 'Cartão de Crédito',
    'outro': 'Outro'
  };
  return categorias[categoria] || categoria;
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
  const modalAtivo = document.getElementById('modal-ativo');
  const modalPassivo = document.getElementById('modal-passivo');

  if (event.target === modalAtivo) {
    fecharModalAtivo();
  }
  if (event.target === modalPassivo) {
    fecharModalPassivo();
  }
});
