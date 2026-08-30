let dividaEmEdicao = null;   // índice da dívida sendo editada no formulário (ou null)
let pagamentoAlvo = null;    // índice da dívida no modal de pagamento

const TIPOS_DIVIDA = {
  'cartao': 'Cartão de Crédito (rotativo)',
  'parcelamento': 'Parcelamento sem juros',
  'consignado': 'Empréstimo consignado / FGTS',
  'emprestimo': 'Empréstimo pessoal',
  'financiamento': 'Financiamento',
  'cheque-especial': 'Cheque especial',
  'amigo': 'Empréstimo com amigo',
  'outro': 'Outro'
};

// Natureza sugerida por tipo. Onerosa = tem juros e corrói patrimônio.
// Curto prazo = obrigação do mês, sem juros se paga na data.
const NATUREZA_PADRAO = {
  'cartao': 'onerosa',
  'parcelamento': 'curto-prazo',
  'consignado': 'onerosa',
  'emprestimo': 'onerosa',
  'financiamento': 'onerosa',
  'cheque-especial': 'onerosa',
  'amigo': 'curto-prazo',
  'outro': 'curto-prazo'
};

// ---------------------------------------------------------------------------
// Dívidas fixas (seed) — registros reais do dono do site, embutidos no código.
// Cada uma tem id fixo. Uma vez semeada, fica marcada em `seedsAplicados` e
// não volta se o usuário editar ou deletar.
// ---------------------------------------------------------------------------
const SEEDS_DIVIDAS = [
  {
    id: 20250928001,
    credor: 'Nubank (Nu Financeira S.A.)',
    tipo: 'consignado',
    natureza: 'onerosa',
    taxa: 1.66,
    debitoAutomatico: true,
    parcelado: true,
    numParcelas: 2,
    valorParcela: 2376.98,
    parcelasPagas: 0,
    diaVencimento: 1,
    saldoDevedor: 3463.48,
    observacoes: 'Emprestimo Saque-Aniversario FGTS. Contrato 0139367810901469775693848100453159712012 - '
      + 'Emitido 28/09/2025 - Liberado R$ 3.346,66 - IOF R$ 116,82 - CET 1,844% a.m. / 24,509% a.a. - '
      + 'Pagamento anual no 1o dia util do mes do aniversario - Total a pagar R$ 4.753,95.'
  }
];

function semearDividasFixas() {
  const dados = obterDados();
  const aplicados = Array.isArray(dados.seedsAplicados) ? dados.seedsAplicados : [];
  let mudou = false;

  SEEDS_DIVIDAS.forEach(seed => {
    if (aplicados.includes(seed.id)) return;
    if (!dados.dividas.some(d => d.id === seed.id)) {
      dados.dividas.push({
        ...seed,
        valorPago: undefined,
        dataCriacao: new Date().toISOString(),
        pagamentos: []
      });
    }
    aplicados.push(seed.id);
    mudou = true;
  });

  if (mudou) {
    dados.seedsAplicados = aplicados;
    salvarDados(dados);
  }
}

// ---------------------------------------------------------------------------
// Upsert de dívidas vindas de fora (ex.: Registrato/SCR). Esta função é a
// dona do schema de dívida — quem importa não monta o objeto à mão.
// `lista`: [{ origem, origemId, credor, tipo, natureza?, valorTotal,
//            observacoes?, vencimento?, taxa?, debitoAutomatico? }]
// Casa por (origem + origemId). Não mexe em `vencimento` se o usuário já o
// ajustou à mão (`vencimentoAjustadoManualmente`). Devolve { novas, atualizadas }.
// ---------------------------------------------------------------------------
function upsertDividasExternas(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return { novas: 0, atualizadas: 0 };

  const dados = obterDados();
  let novas = 0;
  let atualizadas = 0;

  lista.forEach((ext, i) => {
    if (!ext || !ext.origem || !ext.origemId) return;
    const valorTotal = Math.round((Number(ext.valorTotal) || 0) * 100) / 100;
    const existente = dados.dividas.find(d => d.origem === ext.origem && d.origemId === ext.origemId);

    if (existente) {
      existente.credor = ext.credor || existente.credor;
      existente.tipo = ext.tipo || existente.tipo;
      existente.natureza = ext.natureza || existente.natureza;
      existente.valorTotal = valorTotal;
      if (ext.observacoes != null) existente.observacoes = ext.observacoes;
      if (!existente.vencimentoAjustadoManualmente) existente.vencimento = ext.vencimento || '';
      atualizadas++;
    } else {
      dados.dividas.push({
        id: Date.now() + i,
        origem: ext.origem,
        origemId: ext.origemId,
        credor: ext.credor || 'Credor não informado',
        tipo: ext.tipo || 'outro',
        natureza: ext.natureza || (NATUREZA_PADRAO[ext.tipo] || 'onerosa'),
        taxa: Number(ext.taxa) || 0,
        debitoAutomatico: !!ext.debitoAutomatico,
        observacoes: ext.observacoes || '',
        parcelado: false,
        valorTotal,
        vencimento: ext.vencimento || '',
        valorPago: 0,
        dataCriacao: new Date().toISOString(),
        pagamentos: []
      });
      novas++;
    }
  });

  if (novas || atualizadas) salvarDados(dados);
  return { novas, atualizadas };
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

function obterDados() {
  const parsed = Store.ler(Store.CHAVES.DIVIDAS, { dividas: [] }) || { dividas: [] };
  if (!Array.isArray(parsed.dividas)) parsed.dividas = [];
  return parsed;
}

function salvarDados(dados) {
  Store.gravar(Store.CHAVES.DIVIDAS, dados);
}

// ---------------------------------------------------------------------------
// Métricas derivadas de uma dívida (unifica modo parcelado e valor único)
// ---------------------------------------------------------------------------
function metricasDivida(d) {
  if (d.parcelado) {
    const numParcelas = d.numParcelas || 0;
    const valorParcela = d.valorParcela || 0;
    const parcelasPagas = Math.min(d.parcelasPagas || 0, numParcelas);
    const parcelasRestantes = Math.max(0, numParcelas - parcelasPagas);

    const totalAPagar = numParcelas * valorParcela;
    const pago = parcelasPagas * valorParcela;
    const faltante = parcelasRestantes * valorParcela;
    const saldoDevedor = (d.saldoDevedor && d.saldoDevedor > 0) ? d.saldoDevedor : faltante;
    const jurosAPagar = Math.max(0, faltante - saldoDevedor);

    return {
      parcelado: true,
      totalAPagar, pago, faltante, saldoDevedor, jurosAPagar,
      parcelasPagas, parcelasRestantes, numParcelas, valorParcela,
      parcelaMensal: valorParcela,
      quitada: parcelasRestantes === 0 && numParcelas > 0,
      percentual: numParcelas > 0 ? (parcelasPagas / numParcelas) * 100 : 0
    };
  }

  const totalAPagar = d.valorTotal || 0;
  const pago = d.valorPago || 0;
  const faltante = Math.max(0, totalAPagar - pago);
  return {
    parcelado: false,
    totalAPagar, pago, faltante,
    saldoDevedor: faltante,
    jurosAPagar: 0,
    parcelaMensal: 0,
    quitada: faltante <= 0 && totalAPagar > 0,
    percentual: totalAPagar > 0 ? (pago / totalAPagar) * 100 : 0
  };
}

function dataQuitacaoPrevista(d, m) {
  if (d.parcelado) {
    if (m.parcelasRestantes === 0) return null;
    const dia = d.diaVencimento || 1;
    const base = new Date();
    base.setDate(dia);
    base.setMonth(base.getMonth() + m.parcelasRestantes);
    return base;
  }
  return d.vencimento ? new Date(d.vencimento + 'T00:00:00') : null;
}

// ---------------------------------------------------------------------------
// Formulário
// ---------------------------------------------------------------------------
function sugerirNatureza() {
  const tipo = document.getElementById('select-tipo').value;
  const selNatureza = document.getElementById('select-natureza');
  if (tipo && NATUREZA_PADRAO[tipo] && !selNatureza.dataset.tocado) {
    selNatureza.value = NATUREZA_PADRAO[tipo];
  }
}

function alternarCamposParcela() {
  const parcelado = document.getElementById('check-parcelado').checked;
  document.getElementById('campos-parcelado').hidden = !parcelado;
  document.getElementById('campos-valor-unico').hidden = parcelado;
}

function lerFormulario() {
  const parcelado = document.getElementById('check-parcelado').checked;
  const base = {
    credor: document.getElementById('input-credor').value.trim(),
    tipo: document.getElementById('select-tipo').value,
    natureza: document.getElementById('select-natureza').value,
    taxa: parseFloat(document.getElementById('input-taxa').value) || 0,
    debitoAutomatico: document.getElementById('check-debito-auto').checked,
    observacoes: document.getElementById('input-observacoes').value.trim(),
    parcelado
  };

  if (parcelado) {
    base.numParcelas = parseInt(document.getElementById('input-num-parcelas').value, 10) || 0;
    base.valorParcela = parseFloat(document.getElementById('input-valor-parcela').value) || 0;
    base.parcelasPagas = parseInt(document.getElementById('input-parcelas-pagas').value, 10) || 0;
    base.diaVencimento = parseInt(document.getElementById('input-dia-vencimento').value, 10) || 1;
    base.saldoDevedor = parseFloat(document.getElementById('input-saldo-devedor').value) || 0;
  } else {
    base.valorTotal = parseFloat(document.getElementById('input-valor-total').value) || 0;
    base.vencimento = document.getElementById('input-vencimento').value;
  }
  return base;
}

function validarFormulario(f) {
  if (!f.credor || !f.tipo || !f.natureza) return 'Preencha credor, tipo e natureza.';
  if (f.parcelado) {
    if (f.numParcelas <= 0) return 'Informe o número de parcelas.';
    if (f.valorParcela <= 0) return 'Informe o valor da parcela.';
    if (f.parcelasPagas < 0 || f.parcelasPagas > f.numParcelas) return 'Parcelas pagas fora do intervalo.';
    if (f.diaVencimento < 1 || f.diaVencimento > 31) return 'Dia de vencimento inválido.';
  } else {
    if (f.valorTotal <= 0) return 'Informe o valor total.';
    if (!f.vencimento) return 'Informe a data de vencimento.';
  }
  return null;
}

function adicionarDivida() {
  const f = lerFormulario();
  const erro = validarFormulario(f);
  if (erro) { alert(erro); return; }

  const dados = obterDados();

  if (dividaEmEdicao !== null) {
    const original = dados.dividas[dividaEmEdicao];
    dados.dividas[dividaEmEdicao] = {
      ...original,
      ...f,
      valorPago: f.parcelado ? undefined : (original.valorPago || 0),
      pagamentos: original.pagamentos || []
    };
  } else {
    dados.dividas.push({
      id: Date.now(),
      ...f,
      valorPago: f.parcelado ? undefined : 0,
      dataCriacao: new Date().toISOString(),
      pagamentos: []
    });
  }

  salvarDados(dados);
  limparFormulario();
  document.getElementById('resumo-container').removeAttribute('hidden');
  atualizarVisualizacao();
}

function editarDivida(index) {
  const d = obterDados().dividas[index];
  if (!d) return;

  document.getElementById('input-credor').value = d.credor || '';
  document.getElementById('select-tipo').value = d.tipo || '';
  const selNatureza = document.getElementById('select-natureza');
  selNatureza.value = d.natureza || 'onerosa';
  selNatureza.dataset.tocado = '1';
  document.getElementById('input-taxa').value = d.taxa || '';
  document.getElementById('check-debito-auto').checked = !!d.debitoAutomatico;
  document.getElementById('input-observacoes').value = d.observacoes || '';
  document.getElementById('check-parcelado').checked = !!d.parcelado;
  alternarCamposParcela();

  if (d.parcelado) {
    document.getElementById('input-num-parcelas').value = d.numParcelas || '';
    document.getElementById('input-valor-parcela').value = d.valorParcela || '';
    document.getElementById('input-parcelas-pagas').value = d.parcelasPagas || 0;
    document.getElementById('input-dia-vencimento').value = d.diaVencimento || '';
    document.getElementById('input-saldo-devedor').value = d.saldoDevedor || '';
  } else {
    document.getElementById('input-valor-total').value = d.valorTotal || '';
    document.getElementById('input-vencimento').value = d.vencimento || '';
  }

  dividaEmEdicao = index;
  document.getElementById('titulo-formulario').textContent = 'Editar Dívida';
  document.getElementById('btn-salvar-divida').textContent = 'Salvar Alterações';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparFormulario() {
  ['input-credor', 'input-taxa', 'input-observacoes', 'input-valor-total',
   'input-vencimento', 'input-num-parcelas', 'input-valor-parcela',
   'input-dia-vencimento', 'input-saldo-devedor'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('input-parcelas-pagas').value = '0';
  document.getElementById('select-tipo').value = '';
  const selNatureza = document.getElementById('select-natureza');
  selNatureza.value = 'onerosa';
  delete selNatureza.dataset.tocado;
  document.getElementById('check-debito-auto').checked = false;
  document.getElementById('check-parcelado').checked = false;
  alternarCamposParcela();

  dividaEmEdicao = null;
  document.getElementById('titulo-formulario').textContent = 'Adicionar Nova Dívida';
  document.getElementById('btn-salvar-divida').textContent = 'Adicionar Dívida';
}

// ---------------------------------------------------------------------------
// Visualização
// ---------------------------------------------------------------------------
function inicializarDividas() {
  // dividas.js pode ser carregado só pela API (ex.: Registrato) em páginas sem a UI.
  if (!document.getElementById('resumo-container')) return;
  semearDividasFixas();
  const dados = obterDados();
  if (dados.dividas.length > 0) {
    document.getElementById('resumo-container').removeAttribute('hidden');
    atualizarVisualizacao();
  }
  renderFaturasCartao();
}

function atualizarVisualizacao() {
  const dados = obterDados();
  if (dados.dividas.length === 0) {
    document.getElementById('resumo-container').setAttribute('hidden', '');
    return;
  }

  const grupos = { 'onerosa': [], 'curto-prazo': [] };
  dados.dividas.forEach((d, i) => {
    const m = metricasDivida(d);
    const nat = d.natureza === 'curto-prazo' ? 'curto-prazo' : 'onerosa';
    grupos[nat].push({ d, m, index: i });
  });

  preencherResumoGrupo('onerosa', grupos['onerosa']);
  preencherResumoGrupo('curto', grupos['curto-prazo']);

  // Comprometimento mensal: soma das parcelas das dívidas onerosas ativas
  const comprometimento = grupos['onerosa']
    .filter(x => !x.m.quitada)
    .reduce((s, x) => s + x.m.parcelaMensal, 0);
  const elComp = document.getElementById('valor-comprometimento');
  elComp.textContent = formatarMoeda(comprometimento);

  const renda = parseFloat((Store.lerTexto(Store.CHAVES.RENDA, '') || '').replace(',', '.'));
  const elCompPct = document.getElementById('comprometimento-pct');
  if (renda > 0 && comprometimento > 0) {
    const pct = (comprometimento / renda) * 100;
    elCompPct.textContent = `${pct.toFixed(1)}% da renda` + (pct > 30 ? ' — acima do recomendado (30%)' : '');
    elCompPct.style.color = pct > 30 ? 'var(--cor-vermelho)' : 'var(--cor-texto-leve)';
  } else {
    elCompPct.textContent = 'parcelas mensais das dívidas onerosas';
    elCompPct.style.color = 'var(--cor-texto-leve)';
  }

  renderLista('lista-onerosas', grupos['onerosa']);
  renderLista('lista-curto-prazo', grupos['curto-prazo']);
  verificarAlerta(dados);
  atualizarSimulador();
}

function preencherResumoGrupo(prefixo, itens) {
  const total = itens.reduce((s, x) => s + x.m.totalAPagar, 0);
  const pago = itens.reduce((s, x) => s + x.m.pago, 0);
  const falta = itens.reduce((s, x) => s + x.m.faltante, 0);
  document.getElementById(`${prefixo}-total`).textContent = formatarMoeda(total);
  document.getElementById(`${prefixo}-pago`).textContent = formatarMoeda(pago);
  document.getElementById(`${prefixo}-falta`).textContent = formatarMoeda(falta);
}

function renderLista(elId, itens) {
  const lista = document.getElementById(elId);
  if (itens.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nada por aqui.</p></div>`;
    return;
  }

  lista.innerHTML = itens.map(({ d, m, index }) => {
    const dataQuit = dataQuitacaoPrevista(d, m);
    const linhaParcelas = m.parcelado
      ? `<div class="valor-linha"><span>Parcelas</span><strong>${m.parcelasPagas} / ${m.numParcelas} pagas (${formatarMoeda(m.valorParcela)}/mês)</strong></div>`
      : '';
    const linhaSaldo = (m.parcelado && m.jurosAPagar > 0)
      ? `<div class="valor-linha"><span>Saldo devedor hoje</span><strong>${formatarMoeda(m.saldoDevedor)}</strong></div>
         <div class="valor-linha"><span>Juros embutidos a pagar</span><strong>${formatarMoeda(m.jurosAPagar)}</strong></div>`
      : '';

    return `
      <div class="divida-card ${m.quitada ? 'quitada' : ''}">
        <div class="divida-header">
          <div class="divida-titulo">
            <h3>${escaparHtml(d.credor)}</h3>
            <p class="divida-credor">${escaparHtml(TIPOS_DIVIDA[d.tipo] || d.tipo)}${d.debitoAutomatico ? ' · débito automático' : ''}</p>
          </div>
          <span class="divida-status ${m.quitada ? 'quitada' : ''}">${m.quitada ? 'Quitada' : 'Ativa'}</span>
        </div>

        <div class="divida-valores">
          <div class="valor-linha"><span>Total a pagar</span><strong>${formatarMoeda(m.totalAPagar)}</strong></div>
          <div class="valor-linha"><span>Já pago</span><strong>${formatarMoeda(m.pago)}</strong></div>
          ${linhaParcelas}
          ${linhaSaldo}
          ${d.taxa > 0 ? `<div class="valor-linha"><span>Taxa de juros</span><strong>${d.taxa}% a.m</strong></div>` : ''}
          <div class="valor-linha"><span>Falta pagar</span><strong>${formatarMoeda(m.faltante)}</strong></div>
        </div>

        <div class="divida-progresso">
          <div class="divida-progresso-barra" style="width: ${Math.min(100, m.percentual)}%"></div>
        </div>

        <div style="text-align: right; font-size: 13px; color: var(--cor-texto-leve); margin-bottom: var(--espacamento-md);">
          ${dataQuit ? (m.quitada ? '' : `Quitação prevista: ${dataQuit.toLocaleDateString('pt-BR')}`) : ''}
        </div>

        <div class="divida-acoes">
          ${!m.quitada && !m.parcelado ? `<button class="btn-pagar" onclick="abrirModalPagamento(${index})">Registrar Pagamento</button>` : ''}
          ${!m.quitada && m.parcelado ? `<button class="btn-pagar" onclick="pagarParcela(${index})">Pagar Parcela</button>` : ''}
          <button class="btn-editar" onclick="editarDivida(${index})">Editar</button>
          <button class="btn-deletar" onclick="deletarDivida(${index})">${m.quitada ? 'Remover' : 'Deletar'}</button>
        </div>
      </div>
    `;
  }).join('');
}

function verificarAlerta(dados) {
  const container = document.getElementById('alerta-container');
  container.innerHTML = '';
  const hoje = new Date();
  const limite = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const vencendo = dados.dividas.filter(d => {
    if (d.debitoAutomatico) return false;
    const m = metricasDivida(d);
    if (m.quitada) return false;
    const dataQuit = d.parcelado ? proximoVencimentoParcela(d) : (d.vencimento ? new Date(d.vencimento + 'T00:00:00') : null);
    return dataQuit && dataQuit > hoje && dataQuit <= limite;
  });

  if (vencendo.length > 0) {
    container.innerHTML = `<div class="alerta"><p>Atenção: ${vencendo.length} pagamento(s) vencendo nos próximos 7 dias.</p></div>`;
  }

  const algumaAtiva = dados.dividas.some(d => !metricasDivida(d).quitada);
  if (dados.dividas.length > 0 && !algumaAtiva) {
    container.innerHTML = `<div class="sucesso"><p>Parabéns! Todas as dívidas registradas estão quitadas.</p></div>`;
  }
}

function proximoVencimentoParcela(d) {
  const dia = d.diaVencimento || 1;
  const hoje = new Date();
  let venc = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
  if (venc < hoje) venc = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
  return venc;
}

// ---------------------------------------------------------------------------
// Pagamentos
// ---------------------------------------------------------------------------
function pagarParcela(index) {
  const dados = obterDados();
  const d = dados.dividas[index];
  if (!d || !d.parcelado) return;
  if ((d.parcelasPagas || 0) >= d.numParcelas) return;
  d.parcelasPagas = (d.parcelasPagas || 0) + 1;
  if (d.saldoDevedor && d.saldoDevedor > 0) {
    d.saldoDevedor = Math.max(0, d.saldoDevedor - d.valorParcela);
  }
  salvarDados(dados);
  atualizarVisualizacao();
}

function abrirModalPagamento(index) {
  pagamentoAlvo = index;
  document.getElementById('input-data-pagamento').value = new Date().toISOString().split('T')[0];
  document.getElementById('input-valor-pagamento').value = '';
  document.getElementById('modal-pagamento').removeAttribute('hidden');
}

function fecharModalPagamento() {
  pagamentoAlvo = null;
  document.getElementById('modal-pagamento').setAttribute('hidden', '');
}

function salvarPagamento() {
  if (pagamentoAlvo === null) return;
  const valor = parseFloat(document.getElementById('input-valor-pagamento').value);
  const data = document.getElementById('input-data-pagamento').value;
  if (!valor || valor <= 0) { alert('Informe um valor válido.'); return; }
  if (!data) { alert('Selecione uma data.'); return; }

  const dados = obterDados();
  const d = dados.dividas[pagamentoAlvo];
  const novoPago = (d.valorPago || 0) + valor;
  if (novoPago > d.valorTotal) { alert('O pagamento não pode ser maior que o valor devido.'); return; }

  d.valorPago = novoPago;
  d.pagamentos = d.pagamentos || [];
  d.pagamentos.push({ valor, data });
  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalPagamento();
}

function deletarDivida(index) {
  if (!confirm('Tem certeza que deseja deletar esta dívida?')) return;
  const dados = obterDados();
  dados.dividas.splice(index, 1);
  salvarDados(dados);
  if (dividaEmEdicao === index) limparFormulario();
  atualizarVisualizacao();
}

// ---------------------------------------------------------------------------
// Faturas de cartão em aberto (somente leitura, vindas da página Cartões)
// ---------------------------------------------------------------------------
function renderFaturasCartao() {
  const container = document.getElementById('faturas-cartao-container');
  let cartoes = Store.ler(Store.CHAVES.CARTOES, []);
  if (!Array.isArray(cartoes)) cartoes = [];

  const abertas = [];
  cartoes.forEach(c => {
    const datas = Array.isArray(c.datasPorMes) ? c.datasPorMes : [];
    const comSaldo = datas.filter(f => f.saldo && f.saldo > 0 && !f.foiPaga);
    const ultima = comSaldo.sort((a, b) => (a.mes < b.mes ? 1 : -1))[0];
    if (ultima) abertas.push({ nome: c.nome, titular: c.titular, fatura: ultima });
  });

  if (abertas.length === 0) {
    container.hidden = true;
    return;
  }

  const total = abertas.reduce((s, x) => s + x.fatura.saldo, 0);
  container.hidden = false;
  container.innerHTML = `
    <h2>Faturas de cartão em aberto</h2>
    <p class="nota-faturas">
      Uma fatura fechada é obrigação do mês, não uma dívida onerosa. Ela é gerenciada na
      página <a href="./cartoes.html">Cartões</a> — não a cadastre aqui para não contar o valor duas vezes.
    </p>
    <div class="lista-dividas">
      ${abertas.map(x => `
        <div class="divida-card" style="border-left-color: var(--cor-secundaria);">
          <div class="divida-header">
            <div class="divida-titulo">
              <h3>${escaparHtml(x.nome)}</h3>
              <p class="divida-credor">${x.titular ? 'Titular: ' + escaparHtml(x.titular) + ' · ' : ''}fatura ${escaparHtml(x.fatura.mes || '')}</p>
            </div>
            <span class="divida-status" style="background-color:#e6f0fa;color:var(--cor-secundaria);">Em aberto</span>
          </div>
          <div class="divida-valores">
            <div class="valor-linha"><span>Saldo da fatura</span><strong>${formatarMoeda(x.fatura.saldo)}</strong></div>
            ${x.fatura.vencimento ? `<div class="valor-linha"><span>Vencimento</span><strong>${escaparHtml(x.fatura.vencimento)}</strong></div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    <p style="text-align:right;font-weight:bold;margin-top:var(--espacamento-md);">
      Total em faturas: ${formatarMoeda(total)}
    </p>
  `;
}

// ---------------------------------------------------------------------------
// Simulador: avalanche x bola de neve
// ---------------------------------------------------------------------------
function coletarDividasOnerosasParaSimulacao() {
  return obterDados().dividas
    .map(d => ({ d, m: metricasDivida(d) }))
    .filter(x => x.d.natureza !== 'curto-prazo' && !x.m.quitada && x.m.saldoDevedor > 0)
    .map(x => ({
      nome: x.d.credor,
      saldo: x.m.saldoDevedor,
      taxa: (x.d.taxa || 0) / 100,
      minimo: x.d.parcelado ? x.d.valorParcela : (x.d.pagamentoMinimo || 0)
    }));
}

function simularEstrategia(dividas, extra, comparador) {
  const items = dividas.map(d => ({ ...d }));
  const LIMITE = 600;
  let mes = 0;
  let jurosTotal = 0;

  while (items.some(i => i.saldo > 0.01) && mes < LIMITE) {
    mes++;
    items.forEach(i => {
      if (i.saldo > 0.01 && i.taxa > 0) {
        const j = i.saldo * i.taxa;
        i.saldo += j;
        jurosTotal += j;
      }
    });

    let orcamento = extra + items.reduce((s, i) => s + (i.saldo > 0.01 ? i.minimo : 0), 0);
    const ativos = items.filter(i => i.saldo > 0.01).sort(comparador);

    ativos.forEach(i => {
      const pag = Math.min(orcamento, i.minimo, i.saldo);
      if (pag > 0) { i.saldo -= pag; orcamento -= pag; }
    });
    for (const i of ativos) {
      if (orcamento <= 0.01) break;
      const pag = Math.min(orcamento, i.saldo);
      if (pag > 0) { i.saldo -= pag; orcamento -= pag; }
    }
  }

  return { meses: mes, jurosTotal, concluido: mes < LIMITE };
}

function atualizarSimulador() {
  const bloco = document.getElementById('simulador-container');
  const dividas = coletarDividasOnerosasParaSimulacao();
  if (dividas.length === 0) {
    bloco.hidden = true;
    return;
  }
  bloco.hidden = false;
}

function rodarSimulacao() {
  const extra = parseFloat(document.getElementById('input-valor-extra').value) || 0;
  const dividas = coletarDividasOnerosasParaSimulacao();
  const resultado = document.getElementById('simulador-resultado');

  if (dividas.length === 0) {
    resultado.innerHTML = '<p>Nenhuma dívida onerosa ativa para simular.</p>';
    return;
  }
  if (dividas.every(d => d.minimo === 0) && extra === 0) {
    resultado.innerHTML = '<p>Informe um valor extra mensal ou cadastre o valor da parcela nas dívidas.</p>';
    return;
  }

  const avalanche = simularEstrategia(dividas, extra, (a, b) => b.taxa - a.taxa);
  const bolaNeve = simularEstrategia(dividas, extra, (a, b) => a.saldo - b.saldo);

  const fmtMeses = r => r.concluido ? `${r.meses} ${r.meses === 1 ? 'mês' : 'meses'}` : 'mais de 50 anos';
  const economia = bolaNeve.jurosTotal - avalanche.jurosTotal;

  resultado.innerHTML = `
    <div class="resumo-dividas" style="grid-template-columns:1fr 1fr;">
      <div class="card-info">
        <p>Avalanche (maior juro primeiro)</p>
        <p class="valor" style="color:var(--cor-verde);">${fmtMeses(avalanche)}</p>
        <p style="font-size:13px;margin-top:4px;">Juros pagos: ${formatarMoeda(avalanche.jurosTotal)}</p>
      </div>
      <div class="card-info">
        <p>Bola de neve (menor saldo primeiro)</p>
        <p class="valor" style="color:var(--cor-secundaria);">${fmtMeses(bolaNeve)}</p>
        <p style="font-size:13px;margin-top:4px;">Juros pagos: ${formatarMoeda(bolaNeve.jurosTotal)}</p>
      </div>
    </div>
    <p style="margin-top:var(--espacamento-md);">
      A estratégia <strong>avalanche</strong> economiza <strong>${formatarMoeda(Math.max(0, economia))}</strong> em juros.
      A <strong>bola de neve</strong> quita a primeira dívida mais rápido, o que ajuda na motivação.
    </p>
  `;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

document.addEventListener('click', function(event) {
  const modal = document.getElementById('modal-pagamento');
  if (event.target === modal) fecharModalPagamento();
});

window.addEventListener('load', inicializarDividas);
