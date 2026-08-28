// Saldo projetado do mês: consolida receitas e todas as saídas previstas
// para responder "sobra ou falta dinheiro este mês?".

function smCompetenciaAtual(hoje = new Date()) {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

// "AAAA-MM-DD" ou "AAAA-MM" pertencem à competência?
function smNaCompetencia(data, competencia) {
  return typeof data === 'string' && data.slice(0, 7) === competencia;
}

// Um lançamento pertence ao mês pela competência explícita; sem ela, pela data.
function smRegistroNaCompetencia(registro, competencia, campoData = 'data') {
  if (typeof competenciaDoRegistro === 'function') {
    return competenciaDoRegistro(registro, campoData) === competencia;
  }
  return smNaCompetencia(registro[campoData], competencia);
}

// Mês em foco: o escolhido no seletor global, ou o mês corrente.
function smCompetenciaEmFoco() {
  return typeof competenciaSelecionada === 'function'
    ? competenciaSelecionada()
    : smCompetenciaAtual();
}

function smSomar(lista, campo) {
  return lista.reduce((total, item) => total + (Number(item[campo]) || 0), 0);
}

// Receitas lançadas no mês. Sem lançamentos, a renda configurada cobre o mês
// corrente e os futuros; para um mês passado ela seria histórico inventado,
// então o resultado é zero.
function smReceitasDoMes(competencia) {
  const receitas = Store.ler(Store.CHAVES.RECEITAS, [])
    .filter(r => smRegistroNaCompetencia(r, competencia));

  if (receitas.length > 0) return smSomar(receitas, 'valor');
  if (competencia < smCompetenciaAtual()) return 0;

  const renda = parseFloat(Store.lerTexto(Store.CHAVES.RENDA, '0'));
  return isNaN(renda) ? 0 : renda;
}

// Rendas extras ativas contam como entrada recorrente a partir do mês de início.
function smRendasExtrasDoMes(competencia) {
  return Store.ler(Store.CHAVES.RENDAS_EXTRAS, [])
    .filter(r => r.status === 'ativa')
    .filter(r => !r.dataInicio || r.dataInicio.slice(0, 7) <= competencia)
    .reduce((total, r) => total + (Number(r.mensal) || 0), 0);
}

function smDespesasFixasDoMes() {
  const dados = Store.ler(Store.CHAVES.DESPESAS_FIXAS, null);
  if (!dados || !Array.isArray(dados.despesas)) return 0;
  return smSomar(dados.despesas, 'valor');
}

// Fatura lançada automaticamente pela página de Cartões — contada a partir do
// cartão, não daqui, para a mesma fatura não entrar duas vezes.
function smEhFaturaSincronizada(despesa) {
  return !!despesa.ultimosDígitos || / - Fatura /.test(despesa.descricao || '');
}

function smDespesasVariaveisDoMes(competencia) {
  const despesas = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, [])
    .filter(d => smRegistroNaCompetencia(d, competencia))
    .filter(d => !(d.categoria === 'cartao' && smEhFaturaSincronizada(d)));
  return smSomar(despesas, 'valor');
}

// Vencimento em datasPorMes vem como "dia" ou "dia/mês", relativo ao mês da
// fatura. Devolve a competência em que a fatura efetivamente vence.
function smCompetenciaVencimentoFatura(fatura) {
  if (!fatura.mes) return null;
  const [ano, mes] = fatura.mes.split('-').map(Number);
  if (!ano || !mes) return null;

  const partes = String(fatura.vencimento || '').split('/');
  const mesVencimento = partes[1] ? parseInt(partes[1], 10) : mes;
  if (!mesVencimento) return null;

  // Vencimento em mês anterior ao da fatura significa virada de ano.
  const anoVencimento = mesVencimento < mes ? ano + 1 : ano;
  return `${anoVencimento}-${String(mesVencimento).padStart(2, '0')}`;
}

function smFaturasDoMes(competencia) {
  return Store.ler(Store.CHAVES.CARTOES, []).reduce((total, cartao) => {
    const faturas = (cartao.datasPorMes || [])
      .filter(f => Number(f.saldo) > 0)
      .filter(f => smCompetenciaVencimentoFatura(f) === competencia);
    return total + smSomar(faturas, 'saldo');
  }, 0);
}

function smParcelasDoMes(competencia) {
  return Store.ler(Store.CHAVES.COMPRAS_PARCELADAS, []).reduce((total, compra) => {
    const inicio = (compra.dataInicio || '').slice(0, 7);
    const parcelas = Number(compra.numParcelas) || 0;
    if (!inicio || parcelas < 1 || competencia < inicio) return total;

    const [anoI, mesI] = inicio.split('-').map(Number);
    const [anoC, mesC] = competencia.split('-').map(Number);
    const distancia = (anoC - anoI) * 12 + (mesC - mesI);
    if (distancia >= parcelas) return total;

    return total + (Number(compra.valorTotal) || 0) / parcelas;
  }, 0);
}

// Dívida parcelada compromete a parcela do mês enquanto houver parcelas;
// dívida em valor único entra inteira no mês do vencimento.
// Espelha metricasDivida() de dividas.js.
function smFaltanteDivida(d) {
  if (d.parcelado) {
    const numParcelas = Number(d.numParcelas) || 0;
    const pagas = Math.min(Number(d.parcelasPagas) || 0, numParcelas);
    return Math.max(0, numParcelas - pagas) * (Number(d.valorParcela) || 0);
  }
  return Math.max(0, (Number(d.valorTotal) || 0) - (Number(d.valorPago) || 0));
}

function smListaDividas() {
  const dados = Store.ler(Store.CHAVES.DIVIDAS, { dividas: [] });
  return Array.isArray(dados) ? dados : (dados.dividas || []);
}

function smDividasDoMes(competencia) {
  const mesAtual = smCompetenciaAtual();
  return smListaDividas().reduce((total, d) => {
    if (smFaltanteDivida(d) <= 0) return total;

    if (d.parcelado) {
      // Parcela só entra do mês corrente em diante — meses passados já foram pagos.
      return competencia >= mesAtual ? total + (Number(d.valorParcela) || 0) : total;
    }

    if (!smNaCompetencia(d.vencimento, competencia)) return total;
    return total + smFaltanteDivida(d);
  }, 0);
}

function smReservaAtual() {
  const reserva = Store.ler(Store.CHAVES.RESERVA, null);
  if (!reserva) return 0;
  if (Array.isArray(reserva.aportes)) return smSomar(reserva.aportes, 'valor');
  return Number(reserva.valorAtual) || 0;
}

function calcularSaldoDoMes(competencia = smCompetenciaEmFoco()) {
  const renda = smReceitasDoMes(competencia);
  const rendasExtras = smRendasExtrasDoMes(competencia);
  const despesasFixas = smDespesasFixasDoMes();
  const despesasVariaveis = smDespesasVariaveisDoMes(competencia);
  const faturas = smFaturasDoMes(competencia);
  const parcelas = smParcelasDoMes(competencia);
  const dividas = smDividasDoMes(competencia);

  const receitas = renda + rendasExtras;
  const saidas = despesasFixas + despesasVariaveis + faturas + parcelas + dividas;
  const saldo = receitas - saidas;

  return {
    competencia,
    renda,
    rendasExtras,
    receitas,
    despesasFixas,
    despesasVariaveis,
    faturas,
    parcelas,
    dividas,
    saidas,
    saldo,
    // Indicadores de saúde; null quando não há base para calcular.
    // Quanto da renda sobrou no mês (saldo / receitas). Evitamos "taxa de poupança"
    // para não confundir com a caderneta de poupança.
    taxaEconomia: receitas > 0 ? (saldo / receitas) * 100 : null,
    comprometimentoDividas: receitas > 0 ? (dividas / receitas) * 100 : null,
    mesesReserva: saidas > 0 ? smReservaAtual() / saidas : null
  };
}

function smLinha(rotulo, valor, sinal) {
  if (!valor) return '';
  return `
    <div class="sm-linha">
      <span class="sm-rotulo">${rotulo}</span>
      <span class="sm-valor">${sinal}${formatarMoedaBrasileira(valor)}</span>
    </div>
  `;
}

function smIndicador(rotulo, texto, estado) {
  return `
    <div class="sm-indicador sm-indicador-${estado}">
      <div class="sm-indicador-valor">${texto}</div>
      <div class="sm-indicador-label">${rotulo}</div>
    </div>
  `;
}

function smIndicadores(r) {
  const itens = [];

  if (r.taxaEconomia !== null) {
    const estado = r.taxaEconomia >= 20 ? 'bom' : (r.taxaEconomia >= 0 ? 'atencao' : 'ruim');
    itens.push(smIndicador('Taxa de economia', `${r.taxaEconomia.toFixed(0)}%`, estado));
  }

  if (r.comprometimentoDividas !== null) {
    const estado = r.comprometimentoDividas > 30 ? 'ruim' : (r.comprometimentoDividas > 0 ? 'atencao' : 'bom');
    itens.push(smIndicador('Renda comprometida com dívidas', `${r.comprometimentoDividas.toFixed(0)}%`, estado));
  }

  if (r.mesesReserva !== null) {
    const estado = r.mesesReserva >= 6 ? 'bom' : (r.mesesReserva >= 3 ? 'atencao' : 'ruim');
    itens.push(smIndicador('Meses de reserva', r.mesesReserva.toFixed(1), estado));
  }

  return itens.length ? `<div class="sm-indicadores">${itens.join('')}</div>` : '';
}

function renderizarSaldoDoMes() {
  const container = document.getElementById('container-saldo-mes');
  if (!container) return;

  const r = calcularSaldoDoMes();
  const nomeMes = new Date(r.competencia + '-01T00:00:00')
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  if (r.receitas === 0 && r.saidas === 0) {
    container.innerHTML = `
      <h2>Saldo do mês</h2>
      <p class="sm-vazio">
        Sem receitas ou despesas registradas para ${nomeMes}. Cadastre sua renda e suas despesas
        para ver aqui quanto sobra no mês.
      </p>
    `;
    return;
  }

  container.innerHTML = `
    <h2>Saldo projetado de ${nomeMes}</h2>
    <div class="sm-extrato">
      ${smLinha('Renda do mês', r.renda, '')}
      ${smLinha('Rendas extras', r.rendasExtras, '')}
      <div class="sm-linha sm-subtotal">
        <span class="sm-rotulo">Total de receitas</span>
        <span class="sm-valor">${formatarMoedaBrasileira(r.receitas)}</span>
      </div>
      ${smLinha('Despesas fixas', r.despesasFixas, '− ')}
      ${smLinha('Despesas variáveis lançadas', r.despesasVariaveis, '− ')}
      ${smLinha('Faturas de cartão que vencem no mês', r.faturas, '− ')}
      ${smLinha('Parcelas de compras parceladas', r.parcelas, '− ')}
      ${smLinha('Dívidas com vencimento no mês', r.dividas, '− ')}
      <div class="sm-linha sm-subtotal">
        <span class="sm-rotulo">Total de saídas</span>
        <span class="sm-valor">${formatarMoedaBrasileira(r.saidas)}</span>
      </div>
      <div class="sm-linha sm-total ${r.saldo >= 0 ? 'sm-positivo' : 'sm-negativo'}">
        <span class="sm-rotulo">Saldo do mês</span>
        <span class="sm-valor">${formatarMoedaBrasileira(r.saldo)}</span>
      </div>
    </div>
    ${smIndicadores(r)}
  `;
}
