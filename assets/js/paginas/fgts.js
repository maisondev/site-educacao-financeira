// Acompanhamento de FGTS.
// Modelo: uma ou mais CONTAS vinculadas (cada emprego/código de estabelecimento
// gera uma conta própria na Caixa). Para cada conta o usuario registra SNAPSHOTS
// periodicos do saldo, tirados do extrato (app FGTS ou site da Caixa).
//
// Estrutura em localStorage (chave 'fgts'):
// {
//   contas: [
//     {
//       id, apelido, numeroConta, empregador, admissao,
//       modalidadeSaque: 'rescisao' | 'aniversario',
//       depositoMensal, ativa,
//       snapshots: [ { id, data, saldo, valorRescisorio } ]
//     }
//   ]
// }

const CHAVE_FGTS = (typeof Store !== 'undefined' && Store.CHAVES && Store.CHAVES.FGTS)
  ? Store.CHAVES.FGTS
  : 'fgts';

const MODALIDADE_SAQUE = {
  rescisao: 'Saque-rescisão (padrão)',
  aniversario: 'Saque-aniversário'
};

// Taxa legal do FGTS: 3% a.a. + TR. Usada só para a projeção informativa.
// A distribuição anual de resultados do fundo e a TR ficam de fora — por isso
// a projeção é conservadora (tende a subir mais na prática).
const TAXA_ANUAL_FGTS = 0.03;

let contaEmEdicao = null;   // id da conta no formulário (ou null = nova)
let snapshotContaAlvo = null;  // id da conta no modal de snapshot
let snapshotEmEdicao = null;   // id do snapshot em edição (ou null)

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function moeda(id) {
  const bruto = document.getElementById(id).value;
  return typeof parseValorBrasileiro === 'function'
    ? (parseValorBrasileiro(bruto) || 0)
    : (parseFloat(bruto) || 0);
}

function preencherMoeda(id, valor) {
  const el = document.getElementById(id);
  if (!valor) { el.value = ''; return; }
  el.value = typeof formatarNumeroBrasileiro === 'function'
    ? formatarNumeroBrasileiro(valor)
    : valor;
}

// ---------------------------------------------------------------------------
// Persistência
// ---------------------------------------------------------------------------
function obterDados() {
  let parsed;
  if (typeof Store !== 'undefined') {
    parsed = Store.ler(CHAVE_FGTS, { contas: [] });
  } else {
    try { parsed = JSON.parse(localStorage.getItem(CHAVE_FGTS)) || { contas: [] }; }
    catch (e) { parsed = { contas: [] }; }
  }
  if (!parsed || !Array.isArray(parsed.contas)) parsed = { contas: [] };
  parsed.contas.forEach(c => { if (!Array.isArray(c.snapshots)) c.snapshots = []; });
  return parsed;
}

function salvarDados(dados) {
  if (typeof Store !== 'undefined') return Store.gravar(CHAVE_FGTS, dados);
  localStorage.setItem(CHAVE_FGTS, JSON.stringify(dados));
  return true;
}

// ---------------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------------
function snapshotsOrdenados(conta) {
  return [...conta.snapshots].sort((a, b) => new Date(a.data) - new Date(b.data));
}

function ultimoSnapshot(conta) {
  const ord = snapshotsOrdenados(conta);
  return ord.length ? ord[ord.length - 1] : null;
}

function penultimoSnapshot(conta) {
  const ord = snapshotsOrdenados(conta);
  return ord.length > 1 ? ord[ord.length - 2] : null;
}

function metricasConta(conta) {
  const ult = ultimoSnapshot(conta);
  const pen = penultimoSnapshot(conta);
  const saldo = ult ? ult.saldo : 0;
  const saldoAnterior = pen ? pen.saldo : null;
  const variacao = saldoAnterior != null ? saldo - saldoAnterior : null;
  // Valor rescisório: usa o informado; se ausente, estima saldo + multa de 40%.
  const rescisorio = ult && ult.valorRescisorio ? ult.valorRescisorio : saldo * 1.4;
  return { saldo, saldoAnterior, variacao, rescisorio, dataSaldo: ult ? ult.data : null };
}

function projecao12Meses(conta, m) {
  const dep = conta.depositoMensal || 0;
  let saldo = m.saldo;
  const jm = Math.pow(1 + TAXA_ANUAL_FGTS, 1 / 12) - 1;
  for (let i = 0; i < 12; i++) {
    saldo = saldo * (1 + jm) + dep;
  }
  return saldo;
}

// ---------------------------------------------------------------------------
// Formulário de conta
// ---------------------------------------------------------------------------
function lerFormularioConta() {
  return {
    apelido: document.getElementById('input-apelido').value.trim(),
    empregador: document.getElementById('input-empregador').value.trim(),
    numeroConta: document.getElementById('input-numero-conta').value.trim(),
    admissao: document.getElementById('input-admissao').value,
    modalidadeSaque: document.getElementById('select-modalidade').value,
    depositoMensal: moeda('input-deposito-mensal'),
    ativa: document.getElementById('check-ativa').checked
  };
}

function limparFormularioConta() {
  ['input-apelido', 'input-empregador', 'input-numero-conta', 'input-admissao',
   'input-deposito-mensal'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('select-modalidade').value = 'rescisao';
  document.getElementById('check-ativa').checked = true;
  contaEmEdicao = null;
  document.getElementById('titulo-form-conta').textContent = 'Adicionar conta de FGTS';
  document.getElementById('btn-salvar-conta').textContent = 'Adicionar conta';
}

function salvarConta() {
  const f = lerFormularioConta();
  if (!f.apelido) { alert('Dê um nome para identificar a conta (ex.: empregador ou nº da conta).'); return; }

  const dados = obterDados();
  if (contaEmEdicao !== null) {
    const c = dados.contas.find(x => x.id === contaEmEdicao);
    if (c) Object.assign(c, f);
  } else {
    dados.contas.push({ id: Date.now(), ...f, snapshots: [] });
  }
  salvarDados(dados);
  limparFormularioConta();
  atualizarVisualizacao();
}

function editarConta(id) {
  const c = obterDados().contas.find(x => x.id === id);
  if (!c) return;
  document.getElementById('input-apelido').value = c.apelido || '';
  document.getElementById('input-empregador').value = c.empregador || '';
  document.getElementById('input-numero-conta').value = c.numeroConta || '';
  document.getElementById('input-admissao').value = c.admissao || '';
  document.getElementById('select-modalidade').value = c.modalidadeSaque || 'rescisao';
  preencherMoeda('input-deposito-mensal', c.depositoMensal);
  document.getElementById('check-ativa').checked = c.ativa !== false;
  contaEmEdicao = id;
  document.getElementById('titulo-form-conta').textContent = 'Editar conta de FGTS';
  document.getElementById('btn-salvar-conta').textContent = 'Salvar alterações';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function removerConta(id) {
  if (!confirm('Remover esta conta e todo o seu histórico de saldos?')) return;
  const dados = obterDados();
  dados.contas = dados.contas.filter(c => c.id !== id);
  salvarDados(dados);
  if (contaEmEdicao === id) limparFormularioConta();
  atualizarVisualizacao();
}

// ---------------------------------------------------------------------------
// Modal de snapshot
// ---------------------------------------------------------------------------
function abrirModalSnapshot(contaId, snapId) {
  snapshotContaAlvo = contaId;
  snapshotEmEdicao = snapId || null;
  const conta = obterDados().contas.find(c => c.id === contaId);
  const snap = snapId && conta ? conta.snapshots.find(s => s.id === snapId) : null;

  document.getElementById('modal-snapshot-titulo').textContent =
    snap ? 'Editar registro de saldo' : 'Registrar saldo do extrato';
  document.getElementById('input-snap-data').value =
    snap ? snap.data : new Date().toISOString().split('T')[0];
  preencherMoeda('input-snap-saldo', snap ? snap.saldo : 0);
  preencherMoeda('input-snap-rescisorio', snap ? snap.valorRescisorio : 0);
  document.getElementById('modal-snapshot').removeAttribute('hidden');
  document.getElementById('input-snap-saldo').focus();
}

function fecharModalSnapshot() {
  snapshotContaAlvo = null;
  snapshotEmEdicao = null;
  document.getElementById('modal-snapshot').setAttribute('hidden', '');
}

function salvarSnapshot() {
  if (snapshotContaAlvo === null) return;
  const data = document.getElementById('input-snap-data').value;
  const saldo = moeda('input-snap-saldo');
  const valorRescisorio = moeda('input-snap-rescisorio');
  if (!data) { alert('Informe a data do extrato.'); return; }
  if (!saldo || saldo <= 0) { alert('Informe o saldo do extrato.'); return; }

  const dados = obterDados();
  const conta = dados.contas.find(c => c.id === snapshotContaAlvo);
  if (!conta) return;

  if (snapshotEmEdicao !== null) {
    const s = conta.snapshots.find(x => x.id === snapshotEmEdicao);
    if (s) { s.data = data; s.saldo = saldo; s.valorRescisorio = valorRescisorio; }
  } else {
    conta.snapshots.push({ id: Date.now(), data, saldo, valorRescisorio });
  }
  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalSnapshot();
}

function removerSnapshot(contaId, snapId) {
  if (!confirm('Remover este registro de saldo?')) return;
  const dados = obterDados();
  const conta = dados.contas.find(c => c.id === contaId);
  if (!conta) return;
  conta.snapshots = conta.snapshots.filter(s => s.id !== snapId);
  salvarDados(dados);
  atualizarVisualizacao();
}

// ---------------------------------------------------------------------------
// Visualização
// ---------------------------------------------------------------------------
function inicializarFgts() {
  limparFormularioConta();
  atualizarVisualizacao();
}

function atualizarVisualizacao() {
  const dados = obterDados();
  const temContas = dados.contas.length > 0;
  document.getElementById('resumo-container').hidden = !temContas;
  document.getElementById('sem-contas').hidden = temContas;

  let saldoTotal = 0;
  let rescisorioTotal = 0;
  let temSnapshot = false;

  dados.contas.forEach(c => {
    const m = metricasConta(c);
    if (m.dataSaldo) temSnapshot = true;
    saldoTotal += m.saldo;
    rescisorioTotal += m.rescisorio;
  });

  document.getElementById('valor-saldo-total').textContent = formatarMoeda(saldoTotal);
  document.getElementById('valor-rescisorio-total').textContent = formatarMoeda(rescisorioTotal);
  document.getElementById('valor-multa-total').textContent =
    formatarMoeda(Math.max(0, rescisorioTotal - saldoTotal));

  const obsResumo = document.getElementById('resumo-obs');
  if (temContas && !temSnapshot) {
    obsResumo.textContent = 'Cadastre um registro de saldo em cada conta para ver os totais.';
  } else {
    obsResumo.textContent = 'Saldo somado dos últimos registros de cada conta. O valor rescisório inclui a multa de 40% (informada no extrato ou estimada).';
  }

  renderContas(dados);
}

function renderContas(dados) {
  const container = document.getElementById('lista-contas');
  if (dados.contas.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = dados.contas.map(conta => {
    const m = metricasConta(conta);
    const ord = snapshotsOrdenados(conta).slice().reverse();
    const maxSaldo = Math.max(...ord.map(s => s.saldo), 1);

    const linhaVar = m.variacao != null
      ? `<span class="fgts-var ${m.variacao >= 0 ? 'pos' : 'neg'}">${m.variacao >= 0 ? '+' : '−'}${formatarMoeda(Math.abs(m.variacao))} desde o registro anterior</span>`
      : '';

    const projecao = (conta.depositoMensal && conta.ativa !== false && m.saldo > 0)
      ? `<div class="valor-linha"><span>Projeção em 12 meses (3% a.a. + depósitos)</span><strong>${formatarMoeda(projecao12Meses(conta, m))}</strong></div>`
      : '';

    const historico = ord.length === 0
      ? `<p class="lista-vazia">Nenhum saldo registrado ainda.</p>`
      : ord.map(s => `
          <div class="fgts-snap">
            <div class="fgts-snap-topo">
              <span class="fgts-snap-data">${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
              <span class="fgts-snap-valor">${formatarMoeda(s.saldo)}</span>
            </div>
            <div class="fgts-bar"><div class="fgts-bar-fill" style="width:${Math.round((s.saldo / maxSaldo) * 100)}%"></div></div>
            <div class="fgts-snap-rodape">
              ${s.valorRescisorio ? `<span>rescisório: ${formatarMoeda(s.valorRescisorio)}</span>` : '<span></span>'}
              <span>
                <button class="btn-editar" onclick="abrirModalSnapshot(${conta.id}, ${s.id})">Editar</button>
                <button class="btn-remover" onclick="removerSnapshot(${conta.id}, ${s.id})" title="Remover">×</button>
              </span>
            </div>
          </div>
        `).join('');

    return `
      <div class="fgts-conta ${conta.ativa === false ? 'inativa' : ''}">
        <div class="fgts-conta-header">
          <div>
            <h3>${escaparHtml(conta.apelido)}</h3>
            <p class="fgts-conta-sub">
              ${conta.empregador ? escaparHtml(conta.empregador) + ' · ' : ''}
              ${conta.numeroConta ? 'conta ' + escaparHtml(conta.numeroConta) : 'sem nº de conta'}
              ${conta.ativa === false ? ' · <em>sem depósitos novos</em>' : ''}
            </p>
          </div>
          <span class="fgts-conta-saldo">${formatarMoeda(m.saldo)}</span>
        </div>

        <div class="divida-valores">
          ${m.dataSaldo ? `<div class="valor-linha"><span>Último registro</span><strong>${new Date(m.dataSaldo + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></div>` : ''}
          <div class="valor-linha"><span>Valor para fins rescisórios</span><strong>${formatarMoeda(m.rescisorio)}</strong></div>
          ${conta.admissao ? `<div class="valor-linha"><span>Admissão</span><strong>${new Date(conta.admissao + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></div>` : ''}
          <div class="valor-linha"><span>Modalidade de saque</span><strong>${MODALIDADE_SAQUE[conta.modalidadeSaque] || MODALIDADE_SAQUE.rescisao}</strong></div>
          ${conta.depositoMensal ? `<div class="valor-linha"><span>Depósito mensal médio</span><strong>${formatarMoeda(conta.depositoMensal)}</strong></div>` : ''}
          ${projecao}
        </div>
        ${linhaVar ? `<p style="text-align:right;margin:0 0 var(--espacamento-md);">${linhaVar}</p>` : ''}

        <div class="fgts-historico">
          <div class="fgts-historico-head">
            <h4>Histórico de saldos</h4>
            <button class="btn-pagar" onclick="abrirModalSnapshot(${conta.id})">+ Registrar saldo</button>
          </div>
          ${historico}
        </div>

        <div class="divida-acoes">
          <button class="btn-editar" onclick="editarConta(${conta.id})">Editar conta</button>
          <button class="btn-deletar" onclick="removerConta(${conta.id})">Remover conta</button>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('click', function(event) {
  const modal = document.getElementById('modal-snapshot');
  if (event.target === modal) fecharModalSnapshot();
});

window.addEventListener('load', inicializarFgts);
