// Saldo projetado do mês: consolida receitas e todas as saídas previstas
// para responder "sobra ou falta dinheiro este mês?".

function smCompetenciaAtual(hoje = new Date()) {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

// "AAAA-MM-DD" ou "AAAA-MM" pertencem à competência?
function smNaCompetencia(data, competencia) {
  return typeof data === 'string' && data.slice(0, 7) === competencia;
}

function smSomar(lista, campo) {
  return lista.reduce((total, item) => total + (Number(item[campo]) || 0), 0);
}

// Receitas lançadas no mês; sem lançamentos, cai para a renda mensal configurada.
function smReceitasDoMes(competencia) {
  const receitas = Store.ler(Store.CHAVES.RECEITAS, [])
    .filter(r => smNaCompetencia(r.data, competencia));

  if (receitas.length > 0) return smSomar(receitas, 'valor');

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
    .filter(d => smNaCompetencia(d.data, competencia))
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

// Dívidas entram no mês do vencimento, pelo que ainda falta pagar.
function smDividasDoMes(competencia) {
  const dados = Store.ler(Store.CHAVES.DIVIDAS, { dividas: [] });
  const lista = Array.isArray(dados) ? dados : (dados.dividas || []);
  return lista.reduce((total, d) => {
    if (!smNaCompetencia(d.vencimento, competencia)) return total;
    const faltante = (Number(d.valorTotal) || 0) - (Number(d.valorPago) || 0);
    return total + Math.max(faltante, 0);
  }, 0);
}

function smReservaAtual() {
  const reserva = Store.ler(Store.CHAVES.RESERVA, null);
  if (!reserva) return 0;
  if (Array.isArray(reserva.aportes)) return smSomar(reserva.aportes, 'valor');
  return Number(reserva.valorAtual) || 0;
}

function calcularSaldoDoMes(competencia = smCompetenciaAtual()) {
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
    taxaPoupanca: receitas > 0 ? (saldo / receitas) * 100 : null,
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

  if (r.taxaPoupanca !== null) {
    const estado = r.taxaPoupanca >= 20 ? 'bom' : (r.taxaPoupanca >= 0 ? 'atencao' : 'ruim');
    itens.push(smIndicador('Taxa de poupança', `${r.taxaPoupanca.toFixed(0)}%`, estado));
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
