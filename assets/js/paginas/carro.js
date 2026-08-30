// Área do Carro — garagem com vários veículos, manutenções, plano preventivo,
// fundo e custo por km. Persistência em localStorage sob a chave 'carro'.
//
// Formato dos dados:
// {
//   veiculos: [ { id, nome, placa, ano, kmAtual, kmAtualData } ],
//   veiculoAtivoId: <id> | null,
//   manutencoes:    [ { id, veiculoId, ... } ],
//   abastecimentos: [ { id, veiculoId, ... } ],
//   fundos: { <veiculoId>: { aporteMensal, saldoInicial, movimentos: [] } }
// }

const CHAVE_CARRO = 'carro';

let manutencaoEditandoId = null;
let abastecimentoEditandoId = null;
let movimentoFundoEditandoId = null;
let veiculoModoNovo = false;

// Plano preventivo de referência. Intervalos típicos para carro de passeio flex.
// Ajuste sempre pelo manual do fabricante — este é só um ponto de partida.
// prioridade: 'essencial' (segurança / risco de dano grave ao motor),
//             'importante' (desempenho, consumo e confiabilidade),
//             'rotina' (conforto). A lista já vem ordenada da mais essencial para a menos.
// custoMin / custoMax: faixa de referência em R$ (peça de linha + mão de obra,
//   oficina independente, carro popular flex — 2025/2026). Só um chute pra orçar.
const PLANO_PADRAO = [
  { id: 'correia',       nome: 'Correia dentada + tensor',       km: 50000, meses: 60, prioridade: 'essencial',  custoMin: 600,  custoMax: 1500 },
  { id: 'oleo',          nome: 'Óleo do motor + filtro de óleo', km: 10000, meses: 12, prioridade: 'essencial',  custoMin: 250,  custoMax: 450 },
  { id: 'pastilhas',     nome: 'Pastilhas de freio (dianteiras)', km: 30000, meses: 36, prioridade: 'essencial',  custoMin: 180,  custoMax: 400 },
  { id: 'fluido-freio',  nome: 'Fluido de freio',                km: 20000, meses: 24, prioridade: 'essencial',  custoMin: 120,  custoMax: 250 },
  { id: 'pneus',         nome: 'Troca de pneus',                 km: 40000, meses: 60, prioridade: 'essencial',  custoMin: 1200, custoMax: 2400 },
  { id: 'arrefecimento', nome: 'Líquido de arrefecimento (radiador)', km: 40000, meses: 24, prioridade: 'essencial',  custoMin: 150,  custoMax: 350 },
  { id: 'amortecedores', nome: 'Amortecedores / suspensão',      km: 60000, meses: 60, prioridade: 'essencial',  custoMin: 800,  custoMax: 2000 },
  { id: 'filtro-comb',   nome: 'Filtro de combustível',          km: 20000, meses: 24, prioridade: 'essencial',  custoMin: 80,   custoMax: 220 },
  { id: 'velas',         nome: 'Velas de ignição',               km: 40000, meses: 48, prioridade: 'importante', custoMin: 150,  custoMax: 400 },
  { id: 'filtro-ar',     nome: 'Filtro de ar do motor',          km: 15000, meses: 12, prioridade: 'importante', custoMin: 50,   custoMax: 120 },
  { id: 'rodizio-pneus', nome: 'Rodízio de pneus',               km: 10000, meses: 12, prioridade: 'importante', custoMin: 40,   custoMax: 100 },
  { id: 'alinhamento',   nome: 'Alinhamento e balanceamento',    km: 10000, meses: 12, prioridade: 'importante', custoMin: 100,  custoMax: 200 },
  { id: 'bateria',       nome: 'Bateria',                        km: 0,     meses: 36, prioridade: 'importante', custoMin: 400,  custoMax: 800 },
  { id: 'cambio',        nome: 'Óleo do câmbio automático',      km: 60000, meses: 48, prioridade: 'importante', custoMin: 400,  custoMax: 900 },
  { id: 'revisao',       nome: 'Revisão geral',                  km: 20000, meses: 12, prioridade: 'importante', custoMin: 300,  custoMax: 800 },
  { id: 'filtro-cabine', nome: 'Filtro de cabine (ar-condicionado)', km: 15000, meses: 12, prioridade: 'rotina',    custoMin: 60,   custoMax: 150 }
];

// Metadados de prioridade: ordem (menor = mais essencial) e rótulo do badge.
const PRIORIDADE_META = {
  essencial:  { ordem: 1, rotulo: 'essencial' },
  importante: { ordem: 2, rotulo: 'importante' },
  rotina:     { ordem: 3, rotulo: 'rotina' }
};

// Estado dos controles de ordenar/filtrar do plano preventivo.
let planoOrdenar = 'prioridade';
let planoFiltrar = 'todos';

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

function gerarId() {
  return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------------------------------------------------------------------------
// Persistência + migração do formato antigo (um único veículo em d.veiculo)
// ---------------------------------------------------------------------------
function obterDadosCarro() {
  let d;
  try {
    d = JSON.parse(localStorage.getItem(CHAVE_CARRO) || '{}');
  } catch (e) {
    d = {};
  }

  if (!Array.isArray(d.veiculos)) {
    const antigo = d.veiculo || {};
    const temDadosAntigos = !!(antigo.nome || antigo.kmAtual) ||
      (Array.isArray(d.manutencoes) && d.manutencoes.length > 0) ||
      (Array.isArray(d.abastecimentos) && d.abastecimentos.length > 0);

    if (temDadosAntigos) {
      const id = gerarId();
      d = {
        veiculos: [{
          id,
          nome: antigo.nome || 'Meu carro',
          placa: antigo.placa || '',
          ano: antigo.ano || '',
          kmAtual: antigo.kmAtual || 0,
          kmAtualData: antigo.kmAtualData || ''
        }],
        veiculoAtivoId: id,
        manutencoes: (Array.isArray(d.manutencoes) ? d.manutencoes : []).map(m => ({ ...m, veiculoId: m.veiculoId || id })),
        abastecimentos: (Array.isArray(d.abastecimentos) ? d.abastecimentos : []).map(a => ({ ...a, veiculoId: a.veiculoId || id })),
        fundos: { [id]: d.fundo || { aporteMensal: 0, saldoInicial: 0, movimentos: [] } }
      };
    } else {
      d = { veiculos: [], veiculoAtivoId: null, manutencoes: [], abastecimentos: [], fundos: {} };
    }
  }

  // Normalização defensiva
  d.veiculos = Array.isArray(d.veiculos) ? d.veiculos : [];
  d.manutencoes = Array.isArray(d.manutencoes) ? d.manutencoes : [];
  d.abastecimentos = Array.isArray(d.abastecimentos) ? d.abastecimentos : [];
  d.fundos = (d.fundos && typeof d.fundos === 'object') ? d.fundos : {};
  // listaOficina: { <veiculoId>: [ idDoItemDoPlano, ... ] } — serviços marcados para a próxima visita
  d.listaOficina = (d.listaOficina && typeof d.listaOficina === 'object') ? d.listaOficina : {};
  if (!d.veiculoAtivoId || !d.veiculos.some(v => v.id === d.veiculoAtivoId)) {
    d.veiculoAtivoId = d.veiculos.length ? d.veiculos[0].id : null;
  }
  d.veiculos.forEach(v => {
    if (!d.fundos[v.id]) d.fundos[v.id] = { aporteMensal: 0, saldoInicial: 0, movimentos: [] };
    if (!Array.isArray(d.listaOficina[v.id])) d.listaOficina[v.id] = [];
  });

  return d;
}

function salvarDadosCarro(d) {
  localStorage.setItem(CHAVE_CARRO, JSON.stringify(d));
}

// Acessores do veículo ativo
function veiculoAtivo(d) {
  return d.veiculos.find(v => v.id === d.veiculoAtivoId) || null;
}
function manutencoesAtivas(d) {
  return d.manutencoes.filter(m => m.veiculoId === d.veiculoAtivoId);
}
function abastecimentosAtivos(d) {
  return d.abastecimentos.filter(a => a.veiculoId === d.veiculoAtivoId);
}
function fundoAtivo(d) {
  return d.fundos[d.veiculoAtivoId] || { aporteMensal: 0, saldoInicial: 0, movimentos: [] };
}
function listaOficinaAtiva(d) {
  return Array.isArray(d.listaOficina[d.veiculoAtivoId]) ? d.listaOficina[d.veiculoAtivoId] : [];
}

// ---------------------------------------------------------------------------
// Garagem (vários veículos)
// ---------------------------------------------------------------------------
function mostrarStatusVeiculo(msg) {
  const status = document.getElementById('v-status');
  if (!status) return;
  status.textContent = msg;
  clearTimeout(mostrarStatusVeiculo._t);
  mostrarStatusVeiculo._t = setTimeout(() => { status.textContent = ''; }, 3000);
}

function lerFormVeiculo() {
  return {
    nome: document.getElementById('v-nome').value.trim(),
    placa: document.getElementById('v-placa').value.trim(),
    ano: document.getElementById('v-ano').value.trim(),
    kmAtual: parseInt(document.getElementById('v-km').value, 10) || 0,
    kmAtualData: document.getElementById('v-km-data').value || new Date().toISOString().split('T')[0]
  };
}

function limparFormVeiculo() {
  ['v-nome', 'v-placa', 'v-ano', 'v-km', 'v-km-data'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

function salvarVeiculo() {
  const d = obterDadosCarro();
  const dados = lerFormVeiculo();
  if (!dados.nome) { alert('Informe o nome/modelo do carro.'); return; }

  if (veiculoModoNovo || d.veiculos.length === 0) {
    const id = gerarId();
    d.veiculos.push({ id, ...dados });
    d.fundos[id] = { aporteMensal: 0, saldoInicial: 0, movimentos: [] };
    d.veiculoAtivoId = id;
    veiculoModoNovo = false;
    mostrarStatusVeiculo('Veículo adicionado.');
  } else {
    const v = veiculoAtivo(d);
    if (!v) return;
    Object.assign(v, dados);
    mostrarStatusVeiculo('Veículo salvo.');
  }

  salvarDadosCarro(d);
  renderTudo();
}

function novoVeiculo() {
  veiculoModoNovo = true;
  limparFormVeiculo();
  document.getElementById('titulo-form-veiculo').textContent = 'Novo veículo';
  document.getElementById('btn-salvar-veiculo').textContent = 'Adicionar veículo';
  document.getElementById('btn-cancelar-veiculo').style.display = '';
  document.getElementById('v-nome').focus();
}

function cancelarNovoVeiculo() {
  veiculoModoNovo = false;
  document.getElementById('btn-salvar-veiculo').textContent = 'Salvar veículo';
  document.getElementById('btn-cancelar-veiculo').style.display = 'none';
  renderTudo();
}

function selecionarVeiculo(id) {
  const d = obterDadosCarro();
  if (!d.veiculos.some(v => v.id === id)) return;
  d.veiculoAtivoId = id;
  veiculoModoNovo = false;
  document.getElementById('btn-salvar-veiculo').textContent = 'Salvar veículo';
  document.getElementById('btn-cancelar-veiculo').style.display = 'none';
  salvarDadosCarro(d);
  renderTudo();
}

function removerVeiculo(id) {
  const d = obterDadosCarro();
  const v = d.veiculos.find(x => x.id === id);
  if (!v) return;
  if (!confirm(`Remover "${v.nome}" e todo o histórico dele (manutenções, abastecimentos e fundo)?`)) return;

  d.veiculos = d.veiculos.filter(x => x.id !== id);
  d.manutencoes = d.manutencoes.filter(m => m.veiculoId !== id);
  d.abastecimentos = d.abastecimentos.filter(a => a.veiculoId !== id);
  delete d.fundos[id];
  if (d.veiculoAtivoId === id) {
    d.veiculoAtivoId = d.veiculos.length ? d.veiculos[0].id : null;
  }
  veiculoModoNovo = false;
  salvarDadosCarro(d);
  renderTudo();
}

// ---------------------------------------------------------------------------
// Manutenções
// ---------------------------------------------------------------------------
function adicionarManutencao() {
  const d = obterDadosCarro();
  const ativo = veiculoAtivo(d);
  if (!ativo) { alert('Cadastre um veículo primeiro.'); return; }

  const m = {
    id: Date.now(),
    veiculoId: ativo.id,
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
      m.veiculoId = d.manutencoes[idx].veiculoId || ativo.id;
      d.manutencoes[idx] = m;
    }
    const alvo = d.veiculos.find(v => v.id === m.veiculoId) || ativo;
    if (m.km > (alvo.kmAtual || 0)) {
      alvo.kmAtual = m.km;
      alvo.kmAtualData = m.data;
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
    d.fundos[ativo.id].movimentos = d.fundos[ativo.id].movimentos || [];
    d.fundos[ativo.id].movimentos.push({
      id: Date.now() + 1,
      data: m.data,
      tipo: 'retirada',
      valor: total,
      descricao: labelCategoria(m.categoria)
    });
  }
  // Atualiza o km atual do veículo se a manutenção for mais recente
  if (m.km > (ativo.kmAtual || 0)) {
    ativo.kmAtual = m.km;
    ativo.kmAtualData = m.data;
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
  const ativo = veiculoAtivo(d);
  if (!ativo) { alert('Cadastre um veículo primeiro.'); return; }

  const litros = parseFloat(document.getElementById('a-litros').value) || 0;
  const valorLitro = parseFloat(document.getElementById('a-valor-litro').value) || 0;
  const valorTotalInput = parseFloat(document.getElementById('a-valor-total').value) || 0;
  const valorTotal = valorTotalInput > 0 ? valorTotalInput : litros * valorLitro;

  const a = {
    id: Date.now(),
    veiculoId: ativo.id,
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
      a.veiculoId = d.abastecimentos[idx].veiculoId || ativo.id;
      d.abastecimentos[idx] = a;
    }
    const alvo = d.veiculos.find(v => v.id === a.veiculoId) || ativo;
    if (a.km > (alvo.kmAtual || 0)) {
      alvo.kmAtual = a.km;
      alvo.kmAtualData = a.data;
    }
    salvarDadosCarro(d);
    cancelarEdicaoAbastecimento();
    renderTudo();
    return;
  }

  d.abastecimentos.push(a);
  if (a.km > (ativo.kmAtual || 0)) {
    ativo.kmAtual = a.km;
    ativo.kmAtualData = a.data;
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
// Fundo do carro (por veículo)
// ---------------------------------------------------------------------------
function salvarConfigFundo() {
  const d = obterDadosCarro();
  const ativo = veiculoAtivo(d);
  if (!ativo) { alert('Cadastre um veículo primeiro.'); return; }
  const fundo = d.fundos[ativo.id];
  fundo.aporteMensal = parseFloat(document.getElementById('f-aporte').value) || 0;
  fundo.saldoInicial = parseFloat(document.getElementById('f-saldo-inicial').value) || 0;
  salvarDadosCarro(d);
  renderTudo();
}

function movimentarFundo(tipo) {
  const d = obterDadosCarro();
  const ativo = veiculoAtivo(d);
  if (!ativo) { alert('Cadastre um veículo primeiro.'); return; }

  const valor = parseFloat(document.getElementById('f-mov-valor').value) || 0;
  const descricao = document.getElementById('f-mov-desc').value.trim();
  if (valor <= 0) { alert('Informe um valor.'); return; }

  const fundo = d.fundos[ativo.id];
  fundo.movimentos = fundo.movimentos || [];

  if (movimentoFundoEditandoId !== null) {
    const mv = fundo.movimentos.find(x => x.id === movimentoFundoEditandoId);
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

  fundo.movimentos.push({
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
  const mv = (fundoAtivo(d).movimentos || []).find(x => x.id === id);
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
  const ativo = veiculoAtivo(d);
  if (!ativo) { alert('Cadastre um veículo primeiro.'); return; }
  const fundo = d.fundos[ativo.id];
  if (!fundo.aporteMensal) { alert('Configure o aporte mensal primeiro.'); return; }
  fundo.movimentos = fundo.movimentos || [];
  fundo.movimentos.push({
    id: Date.now(),
    data: new Date().toISOString().split('T')[0],
    tipo: 'aporte',
    valor: fundo.aporteMensal,
    descricao: 'Aporte do mês'
  });
  salvarDadosCarro(d);
  renderTudo();
}

function removerMovimentoFundo(id) {
  const d = obterDadosCarro();
  const fundo = fundoAtivo(d);
  fundo.movimentos = (fundo.movimentos || []).filter(mv => mv.id !== id);
  salvarDadosCarro(d);
  renderTudo();
}

function saldoFundo(fundo) {
  const movs = (fundo && fundo.movimentos) || [];
  return ((fundo && fundo.saldoInicial) || 0) + movs.reduce((s, mv) => s + (mv.tipo === 'aporte' ? mv.valor : -mv.valor), 0);
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

function calcularCustos(manutencoes, abastecimentos, veiculo) {
  const kms = [
    ...manutencoes.map(m => m.km),
    ...abastecimentos.map(a => a.km)
  ].filter(k => k > 0);
  const kmAtual = (veiculo && veiculo.kmAtual) || (kms.length ? Math.max(...kms) : 0);
  const kmInicial = kms.length ? Math.min(...kms) : 0;
  const kmRodado = kmAtual - kmInicial;

  const totalManut = manutencoes.reduce((s, m) => s + m.valorPecas + m.valorMaoObra, 0);
  const totalComb = abastecimentos.reduce((s, a) => s + a.valorTotal, 0);

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

function statusPlano(manutencoes, veiculo) {
  const kmAtual = (veiculo && veiculo.kmAtual) || 0;
  const hoje = new Date();

  return PLANO_PADRAO.map(item => {
    const feitas = manutencoes
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

// Ordem de urgência do status (menor = mais urgente), para ordenar o plano.
const ORDEM_STATUS = { 'atrasado': 1, 'proximo': 2, 'sem-registro': 3, 'em-dia': 4 };

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function renderTudo() {
  const d = obterDadosCarro();
  renderGaragem(d);
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

function renderGaragem(d) {
  const wrap = document.getElementById('lista-garagem');
  if (!wrap) return;

  if (d.veiculos.length === 0) {
    wrap.innerHTML = '<p class="vazio-msg">Nenhum veículo cadastrado. Preencha os dados abaixo e clique em "Salvar veículo".</p>';
    return;
  }

  wrap.innerHTML = d.veiculos.map(v => {
    const ativo = v.id === d.veiculoAtivoId;
    const nManut = d.manutencoes.filter(m => m.veiculoId === v.id).length;
    const nAbast = d.abastecimentos.filter(a => a.veiculoId === v.id).length;
    const meta = [
      v.placa ? escaparHtml(v.placa) : null,
      v.ano ? 'Ano ' + escaparHtml(v.ano) : null,
      num(v.kmAtual || 0, 0) + ' km',
      `${nManut} manut. · ${nAbast} abast.`
    ].filter(Boolean).join(' · ');

    return `
      <div class="veiculo-card${ativo ? ' ativo' : ''}">
        <div class="registro-topo">
          <strong>${escaparHtml(v.nome)}</strong>
          ${ativo ? '<span class="tag-essencial">ativo</span>' : ''}
        </div>
        <p class="registro-meta">${meta}</p>
        <div class="acoes-form" style="margin-top: var(--espacamento-sm);">
          ${ativo ? '' : `<button class="btn btn-secondary" onclick="selecionarVeiculo('${v.id}')">Selecionar</button>`}
          <button class="btn-link-remover" onclick="removerVeiculo('${v.id}')">Remover</button>
        </div>
      </div>`;
  }).join('');
}

function renderVeiculo(d) {
  if (veiculoModoNovo) return; // não sobrescrever o que o usuário está digitando

  const v = veiculoAtivo(d);
  document.getElementById('v-nome').value = (v && v.nome) || '';
  document.getElementById('v-placa').value = (v && v.placa) || '';
  document.getElementById('v-ano').value = (v && v.ano) || '';
  document.getElementById('v-km').value = (v && v.kmAtual) || '';
  document.getElementById('v-km-data').value = (v && v.kmAtualData) || '';

  const titulo = document.getElementById('titulo-form-veiculo');
  if (titulo) titulo.textContent = v ? 'Dados do veículo ativo' : 'Cadastrar primeiro veículo';
  document.getElementById('btn-salvar-veiculo').textContent = 'Salvar veículo';
  document.getElementById('btn-cancelar-veiculo').style.display = 'none';
}

function renderResumo(d) {
  const v = veiculoAtivo(d);
  const manut = manutencoesAtivas(d);
  const abast = abastecimentosAtivos(d);
  const custos = calcularCustos(manut, abast, v);
  const consumo = calcularConsumo(abast);

  document.getElementById('r-km').textContent = num((v && v.kmAtual) || 0, 0) + ' km';
  document.getElementById('r-custo-km').textContent = custos.custoTotalKm > 0 ? moeda(custos.custoTotalKm) + '/km' : '—';
  document.getElementById('r-consumo').textContent = consumo ? num(consumo, 1) + ' km/l' : '—';
  document.getElementById('r-fundo').textContent = moeda(saldoFundo(fundoAtivo(d)));

  document.getElementById('detalhe-custos').innerHTML = custos.kmRodado > 0 ? `
    <div class="valor-linha"><span>Km rodados no período</span><strong>${num(custos.kmRodado, 0)} km</strong></div>
    <div class="valor-linha"><span>Gasto com manutenção</span><strong>${moeda(custos.totalManut)} (${moeda(custos.custoManutKm)}/km)</strong></div>
    <div class="valor-linha"><span>Gasto com combustível</span><strong>${moeda(custos.totalComb)} (${moeda(custos.custoCombKm)}/km)</strong></div>
    <div class="valor-linha"><span>Custo total por km</span><strong>${moeda(custos.custoTotalKm)}/km</strong></div>
  ` : '<p class="vazio-msg">Registre manutenções e abastecimentos com o km para calcular o custo por km.</p>';
}

// Intervalo do item em km equivalentes, para ordenar. Itens sem km (ex.: bateria,
// medida só em meses) usam uma estimativa de 12.000 km/ano.
function intervaloEmKm(item) {
  if (item.km > 0) return item.km;
  if (item.meses > 0) return item.meses / 12 * 12000;
  return Infinity;
}

function ordenarLinhasPlano(linhas) {
  const ordem = planoOrdenar;
  const arr = linhas.map((l, i) => ({ l, i })); // i preserva a ordem original (por prioridade) como desempate
  arr.sort((a, b) => {
    if (ordem === 'status') {
      const d = (ORDEM_STATUS[a.l.status] || 9) - (ORDEM_STATUS[b.l.status] || 9);
      if (d) return d;
    } else if (ordem === 'nome') {
      const d = a.l.item.nome.localeCompare(b.l.item.nome, 'pt-BR');
      if (d) return d;
    } else if (ordem === 'intervalo') {
      const d = intervaloEmKm(a.l.item) - intervaloEmKm(b.l.item);
      if (d) return d;
    }
    return a.i - b.i;
  });
  return arr.map(x => x.l);
}

function filtrarLinhasPlano(linhas) {
  if (planoFiltrar === 'essenciais') return linhas.filter(l => l.item.prioridade === 'essencial');
  if (planoFiltrar === 'atencao') return linhas.filter(l => l.status === 'atrasado' || l.status === 'proximo');
  return linhas;
}

function faixaPreco(item) {
  if (!item.custoMin && !item.custoMax) return '—';
  if (item.custoMin === item.custoMax) return moeda(item.custoMin);
  return moeda(item.custoMin) + ' – ' + moeda(item.custoMax);
}

function renderPlano(d) {
  const linhas = statusPlano(manutencoesAtivas(d), veiculoAtivo(d));
  const tbody = document.getElementById('plano-body');
  const visiveis = ordenarLinhasPlano(filtrarLinhasPlano(linhas));
  const selecionados = listaOficinaAtiva(d);

  if (visiveis.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="vazio-msg">Nenhum item para este filtro.</td></tr>';
  } else {
    tbody.innerHTML = visiveis.map(l => {
      const meta = PRIORIDADE_META[l.item.prioridade];
      const badge = meta
        ? ` <span class="tag-prio tag-prio-${l.item.prioridade}">${meta.rotulo}</span>`
        : '';
      const marcado = selecionados.indexOf(l.item.id) !== -1 ? ' checked' : '';
      return `
    <tr>
      <td class="col-check"><input type="checkbox" aria-label="Levar à oficina" onchange="alternarServicoOficina('${l.item.id}')"${marcado}></td>
      <td>${escaparHtml(l.item.nome)}${badge}</td>
      <td class="col-num">${l.item.km > 0 ? num(l.item.km, 0) + ' km' : '—'}${l.item.meses ? ' / ' + l.item.meses + ' m' : ''}</td>
      <td>${l.ultima || '—'}</td>
      <td>${escaparHtml(l.detalhe)}</td>
      <td><span class="pill pill-${l.status}">${ROTULO_STATUS[l.status]}</span></td>
    </tr>`;
    }).join('');
  }

  const atencao = linhas.filter(l => l.status === 'atrasado' || l.status === 'proximo');
  const box = document.getElementById('plano-alerta');
  if (atencao.length > 0) {
    box.hidden = false;
    box.innerHTML = `<strong>${atencao.length} item(ns) pedindo atenção:</strong> ` +
      atencao.map(l => escaparHtml(l.item.nome)).join(', ') + '.';
  } else {
    box.hidden = true;
  }

  renderListaOficina(d);
}

// ---------------------------------------------------------------------------
// Lista para a oficina — serviços marcados para a próxima visita
// ---------------------------------------------------------------------------
function alternarServicoOficina(itemId) {
  const d = obterDadosCarro();
  if (!d.veiculoAtivoId) return;
  const lista = d.listaOficina[d.veiculoAtivoId] || (d.listaOficina[d.veiculoAtivoId] = []);
  const i = lista.indexOf(itemId);
  if (i === -1) lista.push(itemId); else lista.splice(i, 1);
  salvarDadosCarro(d);
  renderPlano(d);
}

function limparListaOficina() {
  const d = obterDadosCarro();
  if (!d.veiculoAtivoId) return;
  d.listaOficina[d.veiculoAtivoId] = [];
  salvarDadosCarro(d);
  renderPlano(d);
}

// Itens marcados, na ordem do PLANO_PADRAO (mais essencial primeiro)
function servicosOficinaSelecionados(d) {
  const ids = listaOficinaAtiva(d);
  return PLANO_PADRAO.filter(p => ids.indexOf(p.id) !== -1);
}

function textoListaOficina(d) {
  const itens = servicosOficinaSelecionados(d);
  const v = veiculoAtivo(d);
  const linhas = [];
  linhas.push('🔧 *Serviços — plano preventivo*');
  if (v && (v.nome || v.placa)) {
    linhas.push([v.nome, v.placa].filter(Boolean).join(' · '));
  }
  if (v && v.kmAtual) linhas.push('Km atual: ' + num(v.kmAtual, 0));
  linhas.push('');
  let somaMin = 0, somaMax = 0;
  itens.forEach(p => {
    somaMin += p.custoMin || 0;
    somaMax += p.custoMax || 0;
    linhas.push('• ' + p.nome);
    linhas.push('   ref.: ' + faixaPreco(p));
  });
  linhas.push('');
  linhas.push('*Total estimado: ' + moeda(somaMin) + ' – ' + moeda(somaMax) + '*');
  linhas.push('_Faixa de referência (peça de linha + mão de obra). Confirmar no orçamento._');
  return linhas.join('\n');
}

function copiarListaOficina(botao) {
  const d = obterDadosCarro();
  if (servicosOficinaSelecionados(d).length === 0) return;
  const texto = textoListaOficina(d);
  const ok = () => {
    if (!botao) return;
    const orig = botao.textContent;
    botao.textContent = 'Copiado!';
    setTimeout(() => { botao.textContent = orig; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(ok).catch(() => window.prompt('Copie a lista:', texto));
  } else {
    window.prompt('Copie a lista:', texto);
  }
}

function renderListaOficina(d) {
  const box = document.getElementById('lista-oficina');
  if (!box) return;
  const itens = servicosOficinaSelecionados(d);

  if (itens.length === 0) {
    box.innerHTML = '<p class="lista-oficina-vazia">Marque os serviços na tabela acima para montar a lista que você vai levar à oficina.</p>';
    return;
  }

  let somaMin = 0, somaMax = 0;
  const linhas = itens.map(p => {
    somaMin += p.custoMin || 0;
    somaMax += p.custoMax || 0;
    return `<li><span>${escaparHtml(p.nome)}</span><span class="lo-preco">${faixaPreco(p)}</span></li>`;
  }).join('');

  box.innerHTML = `
    <h3>Vou fazer na oficina (${itens.length})</h3>
    <ul class="lista-oficina-itens">${linhas}</ul>
    <p class="lista-oficina-total"><span>Total estimado</span><strong>${moeda(somaMin)} – ${moeda(somaMax)}</strong></p>
    <p class="lista-oficina-nota">Faixa de referência (peça de linha + mão de obra, oficina independente). Peça 2–3 orçamentos.</p>
    <div class="acoes-form">
      <button class="btn btn-primary" onclick="copiarListaOficina(this)">Copiar lista</button>
      <button class="btn-link-remover" onclick="limparListaOficina()">Limpar</button>
    </div>`;
}

function renderListaManutencoes(d) {
  const lista = document.getElementById('lista-manutencoes');
  const total = document.getElementById('total-manutencoes');
  const manut = manutencoesAtivas(d);

  if (manut.length === 0) {
    lista.innerHTML = '<p class="vazio-msg">Nenhuma manutenção registrada.</p>';
    total.textContent = '';
    return;
  }
  const ordenadas = [...manut].sort((a, b) => new Date(b.data) - new Date(a.data));
  const somaTotal = manut.reduce((s, m) => s + m.valorPecas + m.valorMaoObra, 0);
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
  const abast = abastecimentosAtivos(d);

  if (abast.length === 0) {
    lista.innerHTML = '<p class="vazio-msg">Nenhum abastecimento registrado.</p>';
    return;
  }
  const ord = [...abast].sort((a, b) => b.km - a.km);
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
  const fundo = fundoAtivo(d);
  document.getElementById('f-aporte').value = fundo.aporteMensal || '';
  document.getElementById('f-saldo-inicial').value = fundo.saldoInicial || '';

  const saldo = saldoFundo(fundo);
  document.getElementById('f-saldo').textContent = moeda(saldo);

  const dica = document.getElementById('f-dica');
  if (fundo.aporteMensal > 0) {
    dica.textContent = `Aporte mensal: ${moeda(fundo.aporteMensal)}. Em 12 meses o fundo recebe ${moeda(fundo.aporteMensal * 12)}.`;
  } else {
    dica.textContent = 'Defina um aporte mensal para transformar manutenção em despesa planejada, não em dívida.';
  }

  const movs = (fundo.movimentos || []).slice().sort((a, b) => new Date(b.data) - new Date(a.data));
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
          <button class="btn-link-remover" onclick="iniciarEdicaoMovimentoFundo(${mv.id})">Editar</button>
          <button class="btn-link-remover" onclick="removerMovimentoFundo(${mv.id})">Remover</button>
        </div>
      `).join('');
}

// ---------------------------------------------------------------------------
window.addEventListener('load', function() {
  document.getElementById('m-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('a-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('a-cheio').checked = true;

  const selOrd = document.getElementById('plano-ordenar');
  const selFil = document.getElementById('plano-filtrar');
  if (selOrd) selOrd.addEventListener('change', function() {
    planoOrdenar = this.value;
    renderPlano(obterDadosCarro());
  });
  if (selFil) selFil.addEventListener('change', function() {
    planoFiltrar = this.value;
    renderPlano(obterDadosCarro());
  });

  renderTudo();
});
