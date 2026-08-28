// Área do Carro — manutenções, plano preventivo, fundo e custo por km.
// Persistência em localStorage sob a chave 'carro'.

const CHAVE_CARRO = 'carro';

let manutencaoEditandoId = null;
let abastecimentoEditandoId = null;
let movimentoFundoEditandoId = null;

// Plano preventivo de referência. Intervalos típicos para carro de passeio flex.
// Ajuste sempre pelo manual do fabricante — este é só um ponto de partida.
const PLANO_PADRAO = [
  { id: 'oleo',          nome: 'Óleo do motor + filtro de óleo', km: 10000, meses: 12, essencial: true },
  { id: 'filtro-ar',     nome: 'Filtro de ar do motor',          km: 15000, meses: 12, essencial: false },
  { id: 'filtro-cabine', nome: 'Filtro de cabine (ar-condicionado)', km: 15000, meses: 12, essencial: false },
  { id: 'filtro-comb',   nome: 'Filtro de combustível',          km: 20000, meses: 24, essencial: true },
  { id: 'velas',         nome: 'Velas de ignição',               km: 40000, meses: 48, essencial: false },
  { id: 'alinhamento',   nome: 'Alinhamento e balanceamento',    km: 10000, meses: 12, essencial: false },
  { id: 'rodizio-pneus', nome: 'Rodízio de pneus',               km: 10000, meses: 12, essencial: false },
  { id: 'pneus',         nome: 'Troca de pneus',                 km: 40000, meses: 60, essencial: true },
  { id: 'pastilhas',     nome: 'Pastilhas de freio (dianteiras)', km: 30000, meses: 36, essencial: true },
  { id: 'fluido-freio',  nome: 'Fluido de freio',                km: 20000, meses: 24, essencial: true },
  { id: 'correia',       nome: 'Correia dentada + tensor',       km: 50000, meses: 60, essencial: true },
  { id: 'arrefecimento', nome: 'Líquido de arrefecimento (radiador)', km: 40000, meses: 24, essencial: true },
  { id: 'amortecedores', nome: 'Amortecedores / suspensão',      km: 60000, meses: 60, essencial: true },
  { id: 'bateria',       nome: 'Bateria',                        km: 0,     meses: 36, essencial: false },
  { id: 'cambio',        nome: 'Óleo do câmbio automático',      km: 60000, meses: 48, essencial: false },
  { id: 'revisao',       nome: 'Revisão geral',                  km: 20000, meses: 12, essencial: false }
];

function labelCategoria(id) {
  const item = PLANO_PADRAO.find(p => p.id === id);
  return item ? item.nome : (id === 'outro' ? 'Outro' : id);
}

function escaparHtml(t) {
  const d = document.createElement('div');
  d.textContent = t == null ? '' : String(t);
  return d.innerHTML;
}

function moeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function num(v, casas = 1) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v || 0);
}

function obterDadosCarro() {
  let d;
  try {
    d = JSON.parse(localStorage.getItem(CHAVE_CARRO) || '{}');
  } catch (e) {
    d = {};
  }
  return {
    veiculo: d.veiculo || { nome: '', placa: '', ano: '', kmAtual: 0, kmAtualData: '' },
    manutencoes: Array.isArray(d.manutencoes) ? d.manutencoes : [],
    abastecimentos: Array.isArray(d.abastecimentos) ? d.abastecimentos : [],
    fundo: d.fundo || { aporteMensal: 0, saldoInicial: 0, movimentos: [] }
  };
}

function salvarDadosCarro(d) {
  localStorage.setItem(CHAVE_CARRO, JSON.stringify(d));
}

// ---------------------------------------------------------------------------
// Veículo
// ---------------------------------------------------------------------------
function salvarVeiculo() {
  const d = obterDadosCarro();
  d.veiculo = {
    nome: document.getElementById('v-nome').value.trim(),
    placa: document.getElementById('v-placa').value.trim(),
    ano: document.getElementById('v-ano').value.trim(),
    kmAtual: parseInt(document.getElementById('v-km').value, 10) || 0,
    kmAtualData: document.getElementById('v-km-data').value || new Date().toISOString().split('T')[0]
  };
  if (!d.veiculo.nome) { alert('Informe o nome/modelo do carro.'); return; }
  salvarDadosCarro(d);
  renderTudo();
}

// ---------------------------------------------------------------------------
// Manutenções
// ---------------------------------------------------------------------------
function adicionarManutencao() {
  const d = obterDadosCarro();
  const m = {
    id: Date.now(),
    data: document.getElementById('m-data').value,
    km: parseInt(document.getElementById('m-km').value, 10) || 0,
    tipo: document.getElementById('m-tipo').value,
    categoria: document.getElementById('m-categoria').value,
    descricao: document.getElementById('m-descricao').value.trim(),
    oficina: document.getElementById('m-oficina').value.trim(),
    valorPecas: parseFloat(document.getElementById('m-pecas').value) || 0,
    valorMaoObra: parseFloat(document.getElementById('m-mao-obra').value) || 0,
    observacoes: document.getElementById('m-obs').value.trim()
  };
  if (!m.data || !m.categoria || !m.tipo) { alert('Preencha data, tipo e categoria.'); return; }

  if (manutencaoEditandoId !== null) {
    const idx = d.manutencoes.findIndex(x => x.id === manutencaoEditandoId);
    if (idx !== -1) {
      m.id = manutencaoEditandoId;
      d.manutencoes[idx] = m;
    }
    if (m.km > (d.veiculo.kmAtual || 0)) {
      d.veiculo.kmAtual = m.km;
      d.veiculo.kmAtualData = m.data;
    }
    salvarDadosCarro(d);
    cancelarEdicaoManutencao();
    renderTudo();
    return;
  }

  const total = m.valorPecas + m.valorMaoObra;
  const pagarComFundo = document.getElementById('m-fundo').checked;

  d.manutencoes.push(m);
  if (pagarComFundo && total > 0) {
    d.fundo.movimentos = d.fundo.movimentos || [];
    d.fundo.movimentos.push({
      id: Date.now() + 1,
      data: m.data,
      tipo: 'retirada',
      valor: total,
      descricao: labelCategoria(m.categoria)
    });
  }
  // Atualiza o km atual do veículo se a manutenção for mais recente
  if (m.km > (d.veiculo.kmAtual || 0)) {
    d.veiculo.kmAtual = m.km;
    d.veiculo.kmAtualData = m.data;
  }

  salvarDadosCarro(d);
  limparFormManutencao();
  renderTudo();
}

function limparFormManutencao() {
  ['m-data', 'm-km', 'm-descricao', 'm-oficina', 'm-pecas', 'm-mao-obra', 'm-obs'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('m-categoria').value = '';
  document.getElementById('m-tipo').value = 'preventiva';
  document.getElementById('m-fundo').checked = false;
}

function iniciarEdicaoManutencao(id) {
  const d = obterDadosCarro();
  const m = d.manutencoes.find(x => x.id === id);
  if (!m) return;
  preencherSelectCategoria();

  manutencaoEditandoId = id;
  document.getElementById('m-data').value = m.data || '';
  document.getElementById('m-km').value = m.km || '';
  document.getElementById('m-tipo').value = m.tipo || 'preventiva';
  document.getElementById('m-categoria').value = m.categoria || '';
  document.getElementById('m-oficina').value = m.oficina || '';
  document.getElementById('m-descricao').value = m.descricao || '';
  document.getElementById('m-pecas').value = m.valorPecas || '';
  document.getElementById('m-mao-obra').value = m.valorMaoObra || '';
  document.getElementById('m-obs').value = m.observacoes || '';
  document.getElementById('m-fundo').checked = false;

  document.getElementById('titulo-form-manutencao').textContent = 'Editar manutenção';
  document.getElementById('btn-salvar-manutencao').textContent = 'Salvar alterações';
  document.getElementById('btn-cancelar-manutencao').style.display = '';
  document.getElementById('titulo-form-manutencao').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelarEdicaoManutencao() {
  manutencaoEditandoId = null;
  limparFormManutencao();
  document.getElementById('titulo-form-manutencao').textContent = 'Registrar manutenção';
  document.getElementById('btn-salvar-manutencao').textContent = 'Adicionar manutenção';
  document.getElementById('btn-cancelar-manutencao').style.display = 'none';
}

function removerManutencao(id) {
  if (!confirm('Remover esta manutenção?')) return;
  const d = obterDadosCarro();
  d.manutencoes = d.manutencoes.filter(m => m.id !== id);
  salvarDadosCarro(d);
  renderTudo();
}

// ---------------------------------------------------------------------------
// Abastecimentos
// ---------------------------------------------------------------------------
function adicionarAbastecimento() {
  const d = obterDadosCarro();
  const litros = parseFloat(document.getElementById('a-litros').value) || 0;
  const valorLitro = parseFloat(document.getElementById('a-valor-litro').value) || 0;
  const valorTotalInput = parseFloat(document.getElementById('a-valor-total').value) || 0;
  const valorTotal = valorTotalInput > 0 ? valorTotalInput : litros * valorLitro;

  const a = {
    id: Date.now(),
    data: document.getElementById('a-data').value,
    km: parseInt(document.getElementById('a-km').value, 10) || 0,
    litros,
    valorLitro: valorLitro || (litros > 0 ? valorTotal / litros : 0),
    valorTotal,
    tanqueCheio: document.getElementById('a-cheio').checked
  };
  if (!a.data || !a.km || !a.litros) { alert('Preencha data, km e litros.'); return; }

  if (abastecimentoEditandoId !== null) {
    const idx = d.abastecimentos.findIndex(x => x.id === abastecimentoEditandoId);
    if (idx !== -1) {
      a.id = abastecimentoEditandoId;
      d.abastecimentos[idx] = a;
    }
    if (a.km > (d.veiculo.kmAtual || 0)) {
      d.veiculo.kmAtual = a.km;
      d.veiculo.kmAtualData = a.data;
    }
    salvarDadosCarro(d);
    cancelarEdicaoAbastecimento();
    renderTudo();
    return;
  }

  d.abastecimentos.push(a);
  if (a.km > (d.veiculo.kmAtual || 0)) {
    d.veiculo.kmAtual = a.km;
    d.veiculo.kmAtualData = a.data;
  }
  salvarDadosCarro(d);
  ['a-data', 'a-km', 'a-litros', 'a-valor-litro', 'a-valor-total'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('a-cheio').checked = true;
  renderTudo();
}

function iniciarEdicaoAbastecimento(id) {
  const d = obterDadosCarro();
  const a = d.abastecimentos.find(x => x.id === id);
  if (!a) return;

  abastecimentoEditandoId = id;
  document.getElementById('a-data').value = a.data || '';
  document.getElementById('a-km').value = a.km || '';
  document.getElementById('a-litros').value = a.litros || '';
  document.getElementById('a-valor-litro').value = a.valorLitro || '';
  document.getElementById('a-valor-total').value = a.valorTotal || '';
  document.getElementById('a-cheio').checked = !!a.tanqueCheio;

  document.getElementById('btn-salvar-abastecimento').textContent = 'Salvar alterações';
  document.getElementById('btn-cancelar-abastecimento').style.display = '';
  document.getElementById('a-data').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelarEdicaoAbastecimento() {
  abastecimentoEditandoId = null;
  ['a-data', 'a-km', 'a-litros', 'a-valor-litro', 'a-valor-total'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('a-cheio').checked = true;
  document.getElementById('btn-salvar-abastecimento').textContent = 'Adicionar abastecimento';
  document.getElementById('btn-cancelar-abastecimento').style.display = 'none';
}

function removerAbastecimento(id) {
  if (!confirm('Remover este abastecimento?')) return;
  const d = obterDadosCarro();
  d.abastecimentos = d.abastecimentos.filter(a => a.id !== id);
  salvarDadosCarro(d);
  renderTudo();
}

// ---------------------------------------------------------------------------
// Fundo do carro
// ---------------------------------------------------------------------------
function salvarConfigFundo() {
  const d = obterDadosCarro();
  d.fundo.aporteMensal = parseFloat(document.getElementById('f-aporte').value) || 0;
  d.fundo.saldoInicial = parseFloat(document.getElementById('f-saldo-inicial').value) || 0;
  salvarDadosCarro(d);
  renderTudo();
}

function movimentarFundo(tipo) {
  const valor = parseFloat(document.getElementById('f-mov-valor').value) || 0;
  const descricao = document.getElementById('f-mov-desc').value.trim();
  if (valor <= 0) { alert('Informe um valor.'); return; }
  const d = obterDadosCarro();
  d.fundo.movimentos = d.fundo.movimentos || [];

  if (movimentoFundoEditandoId !== null) {
    const mv = d.fundo.movimentos.find(x => x.id === movimentoFundoEditandoId);
    if (mv) {
      mv.tipo = tipo;
      mv.valor = valor;
      mv.descricao = descricao || (tipo === 'aporte' ? 'Aporte' : 'Retirada');
    }
    salvarDadosCarro(d);
    cancelarEdicaoMovimentoFundo();
    renderTudo();
    return;
  }

  d.fundo.movimentos.push({
    id: Date.now(),
    data: new Date().toISOString().split('T')[0],
    tipo,
    valor,
    descricao: descricao || (tipo === 'aporte' ? 'Aporte' : 'Retirada')
  });
  salvarDadosCarro(d);
  document.getElementById('f-mov-valor').value = '';
  document.getElementById('f-mov-desc').value = '';
  renderTudo();
}

function iniciarEdicaoMovimentoFundo(id) {
  const d = obterDadosCarro();
  const mv = (d.fundo.movimentos || []).find(x => x.id === id);
  if (!mv) return;

  movimentoFundoEditandoId = id;
  document.getElementById('f-mov-valor').value = mv.valor || '';
  document.getElementById('f-mov-desc').value = mv.descricao || '';
  document.getElementById('btn-mov-aporte').textContent = 'Salvar como aporte';
  document.getElementById('btn-mov-retirada').textContent = 'Salvar como retirada';
  document.getElementById('btn-cancelar-mov-fundo').style.display = '';
  document.getElementById('f-mov-valor').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelarEdicaoMovimentoFundo() {
  movimentoFundoEditandoId = null;
  document.getElementById('f-mov-valor').value = '';
  document.getElementById('f-mov-desc').value = '';
  document.getElementById('btn-mov-aporte').textContent = '+ Aporte';
  document.getElementById('btn-mov-retirada').textContent = '− Retirada';
  document.getElementById('btn-cancelar-mov-fundo').style.display = 'none';
}

function registrarAporteMensal() {
  const d = obterDadosCarro();
  if (!d.fundo.aporteMensal) { alert('Configure o aporte mensal primeiro.'); return; }
  d.fundo.movimentos = d.fundo.movimentos || [];
  d.fundo.movimentos.push({
    id: Date.now(),
    data: new Date().toISOString().split('T')[0],
    tipo: 'aporte',
    valor: d.fundo.aporteMensal,
    descricao: 'Aporte do mês'
  });
  salvarDadosCarro(d);
  renderTudo();
}

function removerMovimentoFundo(id) {
  const d = obterDadosCarro();
  d.fundo.movimentos = (d.fundo.movimentos || []).filter(mv => mv.id !== id);
  salvarDadosCarro(d);
  renderTudo();
}

function saldoFundo(d) {
  const movs = d.fundo.movimentos || [];
  return (d.fundo.saldoInicial || 0) + movs.reduce((s, mv) => s + (mv.tipo === 'aporte' ? mv.valor : -mv.valor), 0);
}

// ---------------------------------------------------------------------------
// Cálculos: consumo e custo por km
// ---------------------------------------------------------------------------
function calcularConsumo(abastecimentos) {
  const cheios = abastecimentos
    .filter(a => a.tanqueCheio && a.km > 0)
    .sort((x, y) => x.km - y.km);
  const medias = [];
  for (let i = 1; i < cheios.length; i++) {
    const kmRodado = cheios[i].km - cheios[i - 1].km;
    if (kmRodado > 0 && cheios[i].litros > 0) medias.push(kmRodado / cheios[i].litros);
  }
  if (medias.length === 0) return null;
  return medias.reduce((s, v) => s + v, 0) / medias.length;
}

function calcularCustos(d) {
  const kms = [
    ...d.manutencoes.map(m => m.km),
    ...d.abastecimentos.map(a => a.km)
  ].filter(k => k > 0);
  const kmAtual = d.veiculo.kmAtual || (kms.length ? Math.max(...kms) : 0);
  const kmInicial = kms.length ? Math.min(...kms) : 0;
  const kmRodado = kmAtual - kmInicial;

  const totalManut = d.manutencoes.reduce((s, m) => s + m.valorPecas + m.valorMaoObra, 0);
  const totalComb = d.abastecimentos.reduce((s, a) => s + a.valorTotal, 0);

  return {
    kmRodado,
    totalManut,
    totalComb,
    custoManutKm: kmRodado > 0 ? totalManut / kmRodado : 0,
    custoCombKm: kmRodado > 0 ? totalComb / kmRodado : 0,
    custoTotalKm: kmRodado > 0 ? (totalManut + totalComb) / kmRodado : 0
  };
}

// ---------------------------------------------------------------------------
// Plano preventivo — status de cada item
// ---------------------------------------------------------------------------
function addMeses(dataStr, meses) {
  const dt = new Date(dataStr + 'T00:00:00');
  dt.setMonth(dt.getMonth() + meses);
  return dt;
}

function statusPlano(d) {
  const kmAtual = d.veiculo.kmAtual || 0;
  const hoje = new Date();

  return PLANO_PADRAO.map(item => {
    const feitas = d.manutencoes
      .filter(m => m.categoria === item.id)
      .sort((a, b) => (b.km - a.km) || (new Date(b.data) - new Date(a.data)));

    if (feitas.length === 0) {
      return { item, status: 'sem-registro', detalhe: 'Nunca registrado', ultima: null };
    }

    const ult = feitas[0];
    let kmFalta = null;
    let dataProx = null;

    if (item.km > 0 && kmAtual > 0) kmFalta = (ult.km + item.km) - kmAtual;
    if (item.meses > 0 && ult.data) {
      dataProx = addMeses(ult.data, item.meses);
    }
    const diasFalta = dataProx ? Math.round((dataProx - hoje) / 86400000) : null;

    let status = 'em-dia';
    if ((kmFalta !== null && kmFalta <= 0) || (diasFalta !== null && diasFalta <= 0)) {
      status = 'atrasado';
    } else if ((kmFalta !== null && kmFalta <= 1500) || (diasFalta !== null && diasFalta <= 30)) {
      status = 'proximo';
    }

    const partes = [];
    if (kmFalta !== null) partes.push(kmFalta > 0 ? `em ${num(kmFalta, 0)} km` : `${num(-kmFalta, 0)} km atrás`);
    if (dataProx) partes.push(`até ${dataProx.toLocaleDateString('pt-BR')}`);

    return {
      item, status,
      detalhe: partes.join(' ou '),
      ultima: `${num(ult.km, 0)} km · ${ult.data ? new Date(ult.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}`
    };
  });
}

const ROTULO_STATUS = {
  'atrasado': 'Atrasado',
  'proximo': 'Está na hora',
  'em-dia': 'Em dia',
  'sem-registro': 'Sem registro'
};

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function renderTudo() {
  const d = obterDadosCarro();
  renderVeiculo(d);
  renderResumo(d);
  renderPlano(d);
  renderListaManutencoes(d);
  renderListaAbastecimentos(d);
  renderFundo(d);
  preencherSelectCategoria();
}

function preencherSelectCategoria() {
  const sel = document.getElementById('m-categoria');
  if (sel.options.length > 1) return;
  PLANO_PADRAO.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.nome;
    sel.appendChild(o);
  });
  const outro = document.createElement('option');
  outro.value = 'outro';
  outro.textContent = 'Outro';
  sel.appendChild(outro);
}

function renderVeiculo(d) {
  document.getElementById('v-nome').value = d.veiculo.nome || '';
  document.getElementById('v-placa').value = d.veiculo.placa || '';
  document.getElementById('v-ano').value = d.veiculo.ano || '';
  document.getElementById('v-km').value = d.veiculo.kmAtual || '';
  document.getElementById('v-km-data').value = d.veiculo.kmAtualData || '';
}

function renderResumo(d) {
  const custos = calcularCustos(d);
  const consumo = calcularConsumo(d.abastecimentos);
  document.getElementById('r-km').textContent = num(d.veiculo.kmAtual || 0, 0) + ' km';
  document.getElementById('r-custo-km').textContent = custos.custoTotalKm > 0 ? moeda(custos.custoTotalKm) + '/km' : '—';
  document.getElementById('r-consumo').textContent = consumo ? num(consumo, 1) + ' km/l' : '—';
  document.getElementById('r-fundo').textContent = moeda(saldoFundo(d));

  document.getElementById('detalhe-custos').innerHTML = custos.kmRodado > 0 ? `
    <div class="valor-linha"><span>Km rodados no período</span><strong>${num(custos.kmRodado, 0)} km</strong></div>
    <div class="valor-linha"><span>Gasto com manutenção</span><strong>${moeda(custos.totalManut)} (${moeda(custos.custoManutKm)}/km)</strong></div>
    <div class="valor-linha"><span>Gasto com combustível</span><strong>${moeda(custos.totalComb)} (${moeda(custos.custoCombKm)}/km)</strong></div>
    <div class="valor-linha"><span>Custo total por km</span><strong>${moeda(custos.custoTotalKm)}/km</strong></div>
  ` : '<p class="vazio-msg">Registre manutenções e abastecimentos com o km para calcular o custo por km.</p>';
}

function renderPlano(d) {
  const linhas = statusPlano(d);
  const tbody = document.getElementById('plano-body');
  tbody.innerHTML = linhas.map(l => `
    <tr>
      <td>${escaparHtml(l.item.nome)}${l.item.essencial ? ' <span class="tag-essencial">essencial</span>' : ''}</td>
      <td class="col-num">${l.item.km > 0 ? num(l.item.km, 0) + ' km' : '—'}${l.item.meses ? ' / ' + l.item.meses + ' m' : ''}</td>
      <td>${l.ultima || '—'}</td>
      <td>${escaparHtml(l.detalhe)}</td>
      <td><span class="pill pill-${l.status}">${ROTULO_STATUS[l.status]}</span></td>
    </tr>
  `).join('');

  const atencao = linhas.filter(l => l.status === 'atrasado' || l.status === 'proximo');
  const box = document.getElementById('plano-alerta');
  if (atencao.length > 0) {
    box.hidden = false;
    box.innerHTML = `<strong>${atencao.length} item(ns) pedindo atenção:</strong> ` +
      atencao.map(l => escaparHtml(l.item.nome)).join(', ') + '.';
  } else {
    box.hidden = true;
  }
}

function renderListaManutencoes(d) {
  const lista = document.getElementById('lista-manutencoes');
  const total = document.getElementById('total-manutencoes');
  if (d.manutencoes.length === 0) {
    lista.innerHTML = '<p class="vazio-msg">Nenhuma manutenção registrada.</p>';
    total.textContent = '';
    return;
  }
  const ordenadas = [...d.manutencoes].sort((a, b) => new Date(b.data) - new Date(a.data));
  const somaTotal = d.manutencoes.reduce((s, m) => s + m.valorPecas + m.valorMaoObra, 0);
  total.textContent = `Total gasto em manutenção: ${moeda(somaTotal)}`;

  lista.innerHTML = ordenadas.map(m => {
    const t = m.valorPecas + m.valorMaoObra;
    return `
      <div class="registro-card ${m.tipo === 'corretiva' ? 'corretiva' : ''}">
        <div class="registro-topo">
          <div>
            <strong>${escaparHtml(labelCategoria(m.categoria))}</strong>
            <span class="registro-tipo">${m.tipo === 'corretiva' ? 'corretiva' : 'preventiva'}</span>
          </div>
          <strong>${moeda(t)}</strong>
        </div>
        <p class="registro-meta">
          ${m.data ? new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} ·
          ${num(m.km, 0)} km${m.oficina ? ' · ' + escaparHtml(m.oficina) : ''}
        </p>
        ${m.descricao ? `<p class="registro-desc">${escaparHtml(m.descricao)}</p>` : ''}
        <p class="registro-meta">Peças ${moeda(m.valorPecas)} · Mão de obra ${moeda(m.valorMaoObra)}</p>
        ${m.observacoes ? `<p class="registro-desc">${escaparHtml(m.observacoes)}</p>` : ''}
        <button class="btn-link-remover" onclick="iniciarEdicaoManutencao(${m.id})">Editar</button>
        <button class="btn-link-remover" onclick="removerManutencao(${m.id})">Remover</button>
      </div>
    `;
  }).join('');
}

function renderListaAbastecimentos(d) {
  const lista = document.getElementById('lista-abastecimentos');
  if (d.abastecimentos.length === 0) {
    lista.innerHTML = '<p class="vazio-msg">Nenhum abastecimento registrado.</p>';
    return;
  }
  const ord = [...d.abastecimentos].sort((a, b) => b.km - a.km);
  lista.innerHTML = ord.map((a, i) => {
    const anterior = ord[i + 1];
    let consumo = '';
    if (anterior && a.tanqueCheio && a.litros > 0) {
      const kmRodado = a.km - anterior.km;
      if (kmRodado > 0) consumo = ` · ${num(kmRodado / a.litros, 1)} km/l`;
    }
    return `
      <div class="registro-card">
        <div class="registro-topo">
          <strong>${num(a.km, 0)} km</strong>
          <strong>${moeda(a.valorTotal)}</strong>
        </div>
        <p class="registro-meta">
          ${a.data ? new Date(a.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} ·
          ${num(a.litros, 2)} L · ${moeda(a.valorLitro)}/L${a.tanqueCheio ? ' · tanque cheio' : ''}${consumo}
        </p>
        <button class="btn-link-remover" onclick="iniciarEdicaoAbastecimento(${a.id})">Editar</button>
        <button class="btn-link-remover" onclick="removerAbastecimento(${a.id})">Remover</button>
      </div>
    `;
  }).join('');
}

function renderFundo(d) {
  document.getElementById('f-aporte').value = d.fundo.aporteMensal || '';
  document.getElementById('f-saldo-inicial').value = d.fundo.saldoInicial || '';

  const saldo = saldoFundo(d);
  document.getElementById('f-saldo').textContent = moeda(saldo);

  // Quanto o fundo cobre da próxima manutenção prevista essencial
  const proximos = statusPlano(d).filter(l => l.status === 'atrasado' || l.status === 'proximo');
  const dica = document.getElementById('f-dica');
  if (d.fundo.aporteMensal > 0) {
    dica.textContent = `Aporte mensal: ${moeda(d.fundo.aporteMensal)}. Em 12 meses o fundo recebe ${moeda(d.fundo.aporteMensal * 12)}.`;
  } else {
    dica.textContent = 'Defina um aporte mensal para transformar manutenção em despesa planejada, não em dívida.';
  }

  const movs = (d.fundo.movimentos || []).slice().sort((a, b) => new Date(b.data) - new Date(a.data));
  const lista = document.getElementById('lista-fundo');
  lista.innerHTML = movs.length === 0
    ? '<p class="vazio-msg">Nenhuma movimentação.</p>'
    : movs.map(mv => `
        <div class="registro-card">
          <div class="registro-topo">
            <span>${escaparHtml(mv.descricao)} <span class="registro-tipo">${mv.tipo}</span></span>
            <strong style="color: ${mv.tipo === 'aporte' ? 'var(--cor-verde)' : 'var(--cor-vermelho)'};">
              ${mv.tipo === 'aporte' ? '+' : '−'} ${moeda(mv.valor)}
            </strong>
          </div>
          <p class="registro-meta">${mv.data ? new Date(mv.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</p>
          <button class="btn-link-remover" onclick="removerMovimentoFundo(${mv.id})">Remover</button>
        </div>
      `).join('');
}

// ---------------------------------------------------------------------------
window.addEventListener('load', function() {
  document.getElementById('m-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('a-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('a-cheio').checked = true;
  renderTudo();
});
