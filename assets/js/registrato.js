// Registrato (Banco Central): guarda as informações essenciais dos relatórios
// baixados no Registrato do BCB — Relacionamentos (CCS), Chaves Pix e
// Empréstimos e Financiamentos (SCR). Tudo fica só neste navegador,
// na chave 'registrato_bcb' do localStorage.

const REG_CHAVE = (typeof Store !== 'undefined' && Store.CHAVES)
  ? Store.CHAVES.REGISTRATO : 'registrato_bcb';

// Dados iniciais extraídos dos relatórios emitidos em 28/08/2026.
// Servem de ponto de partida — dá para editar, remover e adicionar linhas.
const REG_PADRAO = {
  emissao: '28/08/2026',
  referenciaScr: '07/2026',

  // CCS — relacionamentos ativos (banco/instituição, início, situação)
  relacionamentos: [
    { instituicao: 'Banco Bradesco', inicio: '04/07/2007', situacao: 'Ativo' },
    { instituicao: 'Banco Santander', inicio: '11/02/2011', situacao: 'Ativo' },
    { instituicao: 'Nu Pagamentos (IP)', inicio: '30/01/2018', situacao: 'Ativo' },
    { instituicao: 'Nu Financeira (CFI)', inicio: '29/08/2019', situacao: 'Ativo' },
    { instituicao: 'XP Investimentos CCTVM', inicio: '05/01/2020', situacao: 'Ativo' },
    { instituicao: 'Nu Investimentos CTVM', inicio: '01/02/2020', situacao: 'Ativo' },
    { instituicao: 'Banco Inter', inicio: '18/02/2020', situacao: 'Ativo' },
    { instituicao: 'Neon Pagamentos (IP)', inicio: '11/04/2020', situacao: 'Ativo' },
    { instituicao: 'PicPay', inicio: '13/04/2020', situacao: 'Ativo' },
    { instituicao: 'Banco BTG Pactual', inicio: '20/04/2020', situacao: 'Ativo' },
    { instituicao: 'Ativa Investimentos CCTVM', inicio: '29/04/2020', situacao: 'Ativo' },
    { instituicao: 'Genial Investimentos CVM', inicio: '04/05/2020', situacao: 'Ativo' },
    { instituicao: 'Nova Futura CTVM', inicio: '06/05/2020', situacao: 'Ativo' },
    { instituicao: 'Itaú Unibanco', inicio: '06/05/2020', situacao: 'Ativo' },
    { instituicao: 'Banco Sofisa', inicio: '13/05/2020', situacao: 'Ativo' },
    { instituicao: 'Banco BMG', inicio: '27/05/2020', situacao: 'Ativo' },
    { instituicao: 'Banco Pan', inicio: '06/07/2020', situacao: 'Ativo' },
    { instituicao: 'PagSeguro Internet (IP)', inicio: '20/07/2020', situacao: 'Ativo' },
    { instituicao: 'Caixa Econômica Federal', inicio: '23/07/2020', situacao: 'Ativo' },
    { instituicao: 'BTG Pactual CTVM', inicio: '24/07/2020', situacao: 'Ativo' },
    { instituicao: 'Banco C6', inicio: '11/08/2020', situacao: 'Ativo' },
    { instituicao: 'Mercado Pago (IP)', inicio: '12/08/2020', situacao: 'Ativo' },
    { instituicao: 'SumUp SCD', inicio: '04/12/2020', situacao: 'Ativo' },
    { instituicao: 'PagueVeloz (IP)', inicio: '19/12/2020', situacao: 'Ativo' },
    { instituicao: 'BancoSeguro', inicio: '19/03/2021', situacao: 'Ativo' },
    { instituicao: 'Banco Genial', inicio: '10/05/2021', situacao: 'Ativo' },
    { instituicao: 'C6 CTVM', inicio: '06/05/2022', situacao: 'Ativo' },
    { instituicao: 'Genial Institucional CCTVM', inicio: '28/08/2022', situacao: 'Ativo' },
    { instituicao: '99Pay (IP)', inicio: '13/04/2023', situacao: 'Ativo' },
    { instituicao: 'Banco XP', inicio: '28/09/2023', situacao: 'Ativo' },
    { instituicao: 'Banco Daycoval', inicio: '29/09/2023', situacao: 'Ativo' },
    { instituicao: 'Nikos Investimentos', inicio: '18/03/2024', situacao: 'Ativo' },
    { instituicao: 'Banco Digio', inicio: '20/05/2024', situacao: 'Ativo' },
    { instituicao: 'BTG Pactual PSF', inicio: '29/08/2024', situacao: 'Ativo' },
    { instituicao: 'Dock (IP)', inicio: '16/06/2025', situacao: 'Ativo' },
    { instituicao: 'PicPay Bank', inicio: '26/09/2025', situacao: 'Ativo' },
    { instituicao: 'Stone (IP)', inicio: '17/11/2025', situacao: 'Ativo' },
    { instituicao: 'RecargaPay (IP)', inicio: '25/12/2025', situacao: 'Ativo' }
  ],

  // Chaves Pix ativas (tipo da chave, instituição, tipo de conta)
  pix: [
    { tipo: 'CPF', instituicao: 'Nu Pagamentos', conta: 'Conta de pagamento' },
    { tipo: 'E-mail', instituicao: 'Banco Bradesco', conta: 'Conta corrente' },
    { tipo: 'Celular', instituicao: '99Pay', conta: 'Conta de pagamento' },
    { tipo: 'Aleatória', instituicao: 'RecargaPay', conta: 'Conta de pagamento' },
    { tipo: 'Aleatória', instituicao: 'Banco XP', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Dock (IP)', conta: 'Conta de pagamento' },
    { tipo: 'Aleatória', instituicao: '99Pay', conta: 'Conta de pagamento' },
    { tipo: 'Aleatória', instituicao: 'PagueVeloz', conta: 'Conta de pagamento' },
    { tipo: 'Aleatória', instituicao: 'Banco Genial', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Banco BTG Pactual', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Banco BMG', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Itaú Unibanco', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Neon Pagamentos', conta: 'Conta de pagamento' },
    { tipo: 'Aleatória', instituicao: 'Banco Inter', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Banco C6', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Banco Pan', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Mercado Pago', conta: 'Conta de pagamento' },
    { tipo: 'Aleatória', instituicao: 'PicPay', conta: 'Conta de pagamento' },
    { tipo: 'Aleatória', instituicao: 'Banco Santander', conta: 'Conta corrente' },
    { tipo: 'Aleatória', instituicao: 'Caixa Econômica Federal', conta: 'Conta poupança' },
    { tipo: 'Aleatória', instituicao: 'PagSeguro', conta: 'Conta de pagamento' }
  ],

  // SCR — dívidas e limites (mês de referência 07/2026)
  dividas: [
    { instituicao: 'Banco Bradesco', operacao: 'Cartão de crédito', emDia: 16245.30, vencida: 0, limite: 3754.70 },
    { instituicao: 'Banco Bradesco', operacao: 'Crédito pessoal', emDia: 0, vencida: 0, limite: 4800.00 },
    { instituicao: 'Banco Bradescard', operacao: 'Cartão de crédito', emDia: 0, vencida: 0, limite: 500.00 },
    { instituicao: 'Banco Digio', operacao: 'Cartão de crédito', emDia: 0, vencida: 0, limite: 3000.00 },
    { instituicao: 'Itaú Unibanco', operacao: 'Cartão de crédito', emDia: 5976.81, vencida: 0, limite: 6524.16 },
    { instituicao: 'Nu Pagamentos', operacao: 'Cartão de crédito', emDia: 14124.83, vencida: 0, limite: 5652.45 },
    { instituicao: 'Nu Financeira', operacao: 'Crédito pessoal (sem consignação)', emDia: 3765.96, vencida: 0, limite: 0 },
    { instituicao: 'Nu Financeira', operacao: 'Cartão de crédito', emDia: 5222.72, vencida: 0, limite: 0 },
    { instituicao: 'Banco Inter', operacao: 'Cartão de crédito', emDia: 7190.50, vencida: 0, limite: 9009.50 },
    { instituicao: 'Neon Pagamentos', operacao: 'Cartão de crédito', emDia: 0.05, vencida: 0, limite: 414.00 },
    { instituicao: 'PicPay Bank', operacao: 'Cartão de crédito', emDia: 11884.27, vencida: 0, limite: 596.00 },
    { instituicao: 'Caixa Econômica Federal', operacao: 'Cartão de crédito', emDia: 0, vencida: 0, limite: 5860.50 }
  ]
};

const REG_TIPOS_PIX = ['CPF', 'CNPJ', 'E-mail', 'Celular', 'Aleatória'];
const REG_TIPOS_CONTA = ['Conta corrente', 'Conta de pagamento', 'Conta poupança', 'Conta salário'];

function regLer() {
  const dados = Store.ler(REG_CHAVE, null);
  if (!dados) return null;
  dados.relacionamentos = dados.relacionamentos || [];
  dados.pix = dados.pix || [];
  dados.dividas = dados.dividas || [];
  return dados;
}

function regGravar(dados) {
  Store.gravar(REG_CHAVE, dados);
}

function regEstado() {
  return regLer() || JSON.parse(JSON.stringify(REG_PADRAO));
}

function regEscapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function regMoeda(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function regNumero(texto) {
  if (typeof texto === 'number') return texto;
  const limpo = String(texto || '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const n = parseFloat(limpo);
  return isNaN(n) ? 0 : n;
}

// ---------- Cabeçalho (datas do relatório) ----------

function regRenderCabecalho() {
  const d = regEstado();
  const emissao = document.getElementById('reg-emissao');
  const ref = document.getElementById('reg-referencia');
  if (emissao) emissao.value = d.emissao || '';
  if (ref) ref.value = d.referenciaScr || '';
}

function regSalvarCabecalho() {
  const d = regEstado();
  d.emissao = document.getElementById('reg-emissao').value.trim();
  d.referenciaScr = document.getElementById('reg-referencia').value.trim();
  regGravar(d);
}

// ---------- Relacionamentos (CCS) ----------

function regRenderRelacionamentos() {
  const alvo = document.getElementById('reg-relacionamentos');
  if (!alvo) return;
  const d = regEstado();

  if (d.relacionamentos.length === 0) {
    alvo.innerHTML = '<p class="reg-vazio">Nenhum relacionamento cadastrado.</p>';
    return;
  }

  const linhas = d.relacionamentos.map((r, i) => `
    <tr>
      <td><input type="text" value="${regEscapar(r.instituicao)}"
                 onchange="regEditar('relacionamentos', ${i}, 'instituicao', this.value)"></td>
      <td><input type="text" value="${regEscapar(r.inicio)}" class="reg-col-curta"
                 onchange="regEditar('relacionamentos', ${i}, 'inicio', this.value)"></td>
      <td><input type="text" value="${regEscapar(r.situacao)}" class="reg-col-curta"
                 onchange="regEditar('relacionamentos', ${i}, 'situacao', this.value)"></td>
      <td><button type="button" class="reg-btn-remover" onclick="regRemover('relacionamentos', ${i})">Remover</button></td>
    </tr>
  `).join('');

  alvo.innerHTML = `
    <table class="reg-tabela">
      <thead><tr><th>Instituição</th><th>Início</th><th>Situação</th><th></th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <p class="reg-ajuda">Ativos: ${d.relacionamentos.filter(r => /ativo/i.test(r.situacao)).length} de ${d.relacionamentos.length}. Em "Situação", use "Ativo" ou a data de encerramento.</p>
  `;
}

function regAddRelacionamento() {
  const d = regEstado();
  d.relacionamentos.push({
    instituicao: document.getElementById('reg-rel-inst').value.trim(),
    inicio: document.getElementById('reg-rel-inicio').value.trim(),
    situacao: document.getElementById('reg-rel-situacao').value.trim() || 'Ativo'
  });
  if (!d.relacionamentos[d.relacionamentos.length - 1].instituicao) return;
  regGravar(d);
  ['reg-rel-inst', 'reg-rel-inicio', 'reg-rel-situacao'].forEach(id => document.getElementById(id).value = '');
  regRenderRelacionamentos();
}

// ---------- Chaves Pix ----------

function regOpcoes(lista, atual) {
  return lista.map(o => `<option value="${o}"${o === atual ? ' selected' : ''}>${o}</option>`).join('');
}

function regRenderPix() {
  const alvo = document.getElementById('reg-pix');
  if (!alvo) return;
  const d = regEstado();

  if (d.pix.length === 0) {
    alvo.innerHTML = '<p class="reg-vazio">Nenhuma chave cadastrada.</p>';
    return;
  }

  const linhas = d.pix.map((p, i) => `
    <tr>
      <td><select onchange="regEditar('pix', ${i}, 'tipo', this.value)">${regOpcoes(REG_TIPOS_PIX, p.tipo)}</select></td>
      <td><input type="text" value="${regEscapar(p.instituicao)}"
                 onchange="regEditar('pix', ${i}, 'instituicao', this.value)"></td>
      <td><select onchange="regEditar('pix', ${i}, 'conta', this.value)">${regOpcoes(REG_TIPOS_CONTA, p.conta)}</select></td>
      <td><button type="button" class="reg-btn-remover" onclick="regRemover('pix', ${i})">Remover</button></td>
    </tr>
  `).join('');

  alvo.innerHTML = `
    <table class="reg-tabela">
      <thead><tr><th>Tipo da chave</th><th>Instituição</th><th>Tipo de conta</th><th></th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <p class="reg-ajuda">${d.pix.length} chave(s) ativa(s). Guarde só o tipo da chave — o valor em si (CPF, e-mail, celular) não fica salvo aqui.</p>
  `;
}

function regAddPix() {
  const d = regEstado();
  const inst = document.getElementById('reg-pix-inst').value.trim();
  if (!inst) return;
  d.pix.push({
    tipo: document.getElementById('reg-pix-tipo').value,
    instituicao: inst,
    conta: document.getElementById('reg-pix-conta').value
  });
  regGravar(d);
  document.getElementById('reg-pix-inst').value = '';
  regRenderPix();
}

// ---------- Dívidas e limites (SCR) ----------

// Ordenação da tabela de dívidas (só afeta a exibição/ordem gravada).
let regOrdemDividas = { campo: null, dir: 'desc' };

function regOrdenarDividas(campo) {
  const d = regEstado();
  if (regOrdemDividas.campo === campo) {
    regOrdemDividas.dir = regOrdemDividas.dir === 'desc' ? 'asc' : 'desc';
  } else {
    regOrdemDividas = { campo: campo, dir: 'desc' };
  }
  const fator = regOrdemDividas.dir === 'desc' ? -1 : 1;
  d.dividas.sort((a, b) => ((Number(a[campo]) || 0) - (Number(b[campo]) || 0)) * fator);
  regGravar(d);
  regRenderDividas();
}

function regSetaOrdem(campo) {
  if (regOrdemDividas.campo !== campo) return '';
  return regOrdemDividas.dir === 'desc' ? ' ▼' : ' ▲';
}

function regRenderDividas() {
  const alvo = document.getElementById('reg-dividas');
  if (!alvo) return;
  const d = regEstado();

  if (d.dividas.length === 0) {
    alvo.innerHTML = '<p class="reg-vazio">Nenhuma dívida cadastrada.</p>';
    return;
  }

  const totEmDia = d.dividas.reduce((s, x) => s + (Number(x.emDia) || 0), 0);
  const totVencida = d.dividas.reduce((s, x) => s + (Number(x.vencida) || 0), 0);
  const totLimite = d.dividas.reduce((s, x) => s + (Number(x.limite) || 0), 0);

  const linhas = d.dividas.map((x, i) => `
    <tr>
      <td><input type="text" value="${regEscapar(x.instituicao)}"
                 onchange="regEditar('dividas', ${i}, 'instituicao', this.value)"></td>
      <td><input type="text" value="${regEscapar(x.operacao)}"
                 onchange="regEditar('dividas', ${i}, 'operacao', this.value)"></td>
      <td><input type="text" inputmode="decimal" value="${regMoeda(x.emDia)}" class="reg-col-valor"
                 onchange="regEditarNum('dividas', ${i}, 'emDia', this)"></td>
      <td><input type="text" inputmode="decimal" value="${regMoeda(x.vencida)}" class="reg-col-valor"
                 onchange="regEditarNum('dividas', ${i}, 'vencida', this)"></td>
      <td><input type="text" inputmode="decimal" value="${regMoeda(x.limite)}" class="reg-col-valor"
                 onchange="regEditarNum('dividas', ${i}, 'limite', this)"></td>
      <td><button type="button" class="reg-btn-remover" onclick="regRemover('dividas', ${i})">Remover</button></td>
    </tr>
  `).join('');

  alvo.innerHTML = `
    <table class="reg-tabela">
      <thead><tr>
        <th>Instituição</th>
        <th>Operação</th>
        <th><button type="button" class="reg-th-ordenar" onclick="regOrdenarDividas('emDia')">Em dia${regSetaOrdem('emDia')}</button></th>
        <th><button type="button" class="reg-th-ordenar" onclick="regOrdenarDividas('vencida')">Vencida${regSetaOrdem('vencida')}</button></th>
        <th><button type="button" class="reg-th-ordenar" onclick="regOrdenarDividas('limite')">Limite disponível${regSetaOrdem('limite')}</button></th>
        <th></th>
      </tr></thead>
      <tbody>${linhas}</tbody>
      <tfoot>
        <tr>
          <th colspan="2">Totais</th>
          <th>${regMoeda(totEmDia)}</th>
          <th>${regMoeda(totVencida)}</th>
          <th>${regMoeda(totLimite)}</th>
          <th></th>
        </tr>
      </tfoot>
    </table>
    <p class="reg-ajuda">Dívida total (em dia + vencida): <strong>${regMoeda(totEmDia + totVencida)}</strong>. Mês de referência: ${regEscapar(d.referenciaScr || '—')}.</p>
  `;
}

function regAddDivida() {
  const d = regEstado();
  const inst = document.getElementById('reg-div-inst').value.trim();
  if (!inst) return;
  d.dividas.push({
    instituicao: inst,
    operacao: document.getElementById('reg-div-operacao').value.trim(),
    emDia: regNumero(document.getElementById('reg-div-emdia').value),
    vencida: regNumero(document.getElementById('reg-div-vencida').value),
    limite: regNumero(document.getElementById('reg-div-limite').value)
  });
  regGravar(d);
  ['reg-div-inst', 'reg-div-operacao', 'reg-div-emdia', 'reg-div-vencida', 'reg-div-limite']
    .forEach(id => document.getElementById(id).value = '');
  regRenderDividas();
}

// ---------- Ações genéricas ----------

function regEditar(lista, indice, campo, valor) {
  const d = regEstado();
  if (!d[lista] || !d[lista][indice]) return;
  d[lista][indice][campo] = valor.trim();
  regGravar(d);
  if (lista === 'dividas') regRenderDividas();
}

function regEditarNum(lista, indice, campo, input) {
  const d = regEstado();
  if (!d[lista] || !d[lista][indice]) return;
  d[lista][indice][campo] = regNumero(input.value);
  regGravar(d);
  regRenderDividas();
}

function regRemover(lista, indice) {
  const d = regEstado();
  if (!d[lista]) return;
  d[lista].splice(indice, 1);
  regGravar(d);
  if (lista === 'relacionamentos') regRenderRelacionamentos();
  else if (lista === 'pix') regRenderPix();
  else if (lista === 'dividas') regRenderDividas();
}

// ---------- Integração com o Acompanhador de Dívidas (dividas.html) ----------

function regTipoDivida(operacao) {
  if (/cart[aã]o/i.test(operacao)) return 'cartao';
  if (/consigna/i.test(operacao)) return 'consignado';
  if (/pessoal|empr[eé]stimo|cr[eé]dito pessoal/i.test(operacao)) return 'emprestimo';
  if (/financiamento/i.test(operacao)) return 'financiamento';
  return 'outro';
}

function regNaturezaDivida(tipo) {
  return (tipo === 'outro') ? 'curto-prazo' : 'onerosa';
}

function regEnviarParaDividas() {
  const d = regEstado();
  const pendentes = d.dividas.filter(x => ((Number(x.emDia) || 0) + (Number(x.vencida) || 0)) > 0);

  if (pendentes.length === 0) {
    alert('Nenhuma dívida com valor em dia ou vencido para enviar.');
    return;
  }

  const store = Store.ler(Store.CHAVES.DIVIDAS, { dividas: [] }) || { dividas: [] };
  if (!Array.isArray(store.dividas)) store.dividas = [];

  const ref = d.referenciaScr || '';
  let novas = 0, atualizadas = 0;

  pendentes.forEach(x => {
    const origemId = `${x.instituicao}|${x.operacao}`;
    const tipo = regTipoDivida(x.operacao);
    const valorTotal = Math.round(((Number(x.emDia) || 0) + (Number(x.vencida) || 0)) * 100) / 100;
    const existente = store.dividas.find(y => y.origem === 'registrato' && y.origemId === origemId);

    // O SCR traz o saldo devedor TOTAL da operação (inclui parcelas futuras
    // de compras no cartão), não uma obrigação do mês corrente. Por isso a
    // dívida entra sem data de vencimento — assim não é jogada inteira no
    // Saldo do Mês. Ajuste o vencimento manualmente na página de Dívidas se
    // souber a data real de quitação.
    const obs = `Importado do Registrato (SCR ${ref}). Saldo devedor total da `
      + `operação, incluindo parcelas futuras — não é uma dívida do mês.`;

    if (existente) {
      existente.credor = x.instituicao;
      existente.tipo = tipo;
      existente.valorTotal = valorTotal;
      existente.observacoes = obs;
      if (!existente.vencimentoAjustadoManualmente) existente.vencimento = '';
      atualizadas++;
    } else {
      store.dividas.push({
        id: Date.now() + novas,
        origem: 'registrato',
        origemId,
        credor: x.instituicao,
        tipo,
        natureza: regNaturezaDivida(tipo),
        taxa: 0,
        debitoAutomatico: false,
        observacoes: obs,
        parcelado: false,
        valorTotal,
        vencimento: '',
        valorPago: 0,
        dataCriacao: new Date().toISOString(),
        pagamentos: []
      });
      novas++;
    }
  });

  Store.gravar(Store.CHAVES.DIVIDAS, store);

  const msg = `Acompanhador de Dívidas atualizado: ${novas} nova(s), ${atualizadas} atualizada(s).\n\nAbrir o Acompanhador agora?`;
  if (confirm(msg)) location.href = './dividas.html';
}

function regRestaurarPadrao() {
  if (!confirm('Isto substitui tudo pelos dados iniciais dos relatórios de 28/08/2026. Continuar?')) return;
  regGravar(JSON.parse(JSON.stringify(REG_PADRAO)));
  regRenderTudo();
}

function regLimparTudo() {
  if (!confirm('Isto apaga todos os dados desta página neste navegador. Continuar?')) return;
  Store.remover(REG_CHAVE);
  regGravar({ emissao: '', referenciaScr: '', relacionamentos: [], pix: [], dividas: [] });
  regRenderTudo();
}

function regRenderTudo() {
  regRenderCabecalho();
  regRenderRelacionamentos();
  regRenderPix();
  regRenderDividas();
}

document.addEventListener('DOMContentLoaded', function () {
  // Na primeira visita, grava os dados iniciais para o usuário já ver algo.
  if (!regLer()) regGravar(JSON.parse(JSON.stringify(REG_PADRAO)));
  regRenderTudo();

  ['reg-emissao', 'reg-referencia'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', function () {
      regSalvarCabecalho();
      regRenderDividas();
    });
  });

  const mapa = {
    'reg-add-relacionamento': regAddRelacionamento,
    'reg-add-pix': regAddPix,
    'reg-add-divida': regAddDivida,
    'reg-enviar-dividas': regEnviarParaDividas,
    'reg-restaurar': regRestaurarPadrao,
    'reg-limpar': regLimparTudo
  };
  Object.keys(mapa).forEach(id => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', mapa[id]);
  });
});
