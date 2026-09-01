// Central de alertas do dashboard: reúne o que exige ação nos próximos dias.
// Só entra aqui o que é acionável — o calendário completo continua nos lembretes.

const ALERTA_DIAS_CARTAO = 3;
const ALERTA_DIAS_DESPESA_FIXA = 3;
const ALERTA_DIAS_DIVIDA = 7;
const ALERTA_DIAS_META = 30;
const ALERTA_DIAS_BACKUP = 30;

// Severidades, da mais para a menos urgente.
const ALERTA_ORDEM = { critico: 0, atencao: 1, info: 2 };

function altHoje() {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate());
}

function altDiasAte(dataISO) {
  if (typeof dataISO !== 'string' || !dataISO) return null;
  const alvo = new Date(dataISO.slice(0, 10) + 'T00:00:00');
  if (isNaN(alvo.getTime())) return null;
  return Math.round((alvo - altHoje()) / 86400000);
}

// "hoje" / "amanhã" / "em 5 dias" / "há 3 dias"
function altPrazoEmTexto(dias) {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias > 1) return `em ${dias} dias`;
  if (dias === -1) return 'ontem';
  return `há ${Math.abs(dias)} dias`;
}

// `dias` = dias até o evento (negativo = venceu, 0 = hoje, null = sem data).
// É a chave primária de ordenação: o que é para hoje/já venceu vem antes.
function altAlerta(severidade, titulo, detalhe, href, rotuloLink, dias) {
  return { severidade, titulo, detalhe, href, rotuloLink, dias: dias == null ? null : dias };
}

// Próxima ocorrência de um dia do mês (o mesmo critério dos lembretes).
function altDiasAteDiaDoMes(dia) {
  const numero = parseInt(dia, 10);
  if (!numero) return null;
  const hoje = altHoje();
  let proxima = new Date(hoje.getFullYear(), hoje.getMonth(), numero);
  if (proxima < hoje) {
    proxima = new Date(hoje.getFullYear(), hoje.getMonth() + 1, numero);
  }
  return Math.round((proxima - hoje) / 86400000);
}

// Competência (AAAA-MM) em que cai uma data a `dias` de hoje.
function altCompetenciaEmDias(dias) {
  if (dias == null) return null;
  const d = altHoje();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// "jul/2026" — rótulo curto pro título do alerta.
function altCompCurta(competencia) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(competencia || ''));
  if (!m) return '';
  const ab = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${ab[Number(m[2]) - 1]}/${m[1]}`;
}

// "Fatura do Nubank (set/2026)" — nome do cartão com a competência no título.
function altNomeFaturaComMes(nome, competencia) {
  const curta = altCompCurta(competencia);
  return curta ? `${nome} (${curta})` : nome;
}

// Link pro modal de datas daquela fatura, quando o cartão tem 4 últimos.
function altHrefFatura(cartao, competencia) {
  return (cartao && cartao.ultimos && competencia)
    ? `./cartoes.html?fatura=${encodeURIComponent(cartao.ultimos + '|' + competencia)}`
    : './cartoes.html';
}

function altAlertasCartoes() {
  const alertas = [];

  Store.ler(Store.CHAVES.CARTOES, []).forEach(cartao => {
    const nome = cartao.nome || 'Cartão';
    const dias = altDiasAteDiaDoMes(cartao.vencimento);
    if (dias !== null && dias <= ALERTA_DIAS_CARTAO) {
      const comp = altCompetenciaEmDias(dias);
      alertas.push(altAlerta(
        dias <= 1 ? 'critico' : 'atencao',
        `Fatura do ${altNomeFaturaComMes(nome, comp)} vence ${altPrazoEmTexto(dias)}`,
        `dia ${parseInt(cartao.vencimento, 10)} de cada mês.`,
        altHrefFatura(cartao, comp),
        cartao.ultimos ? 'Abrir fatura' : 'Ver cartões',
        dias
      ));
    }

    const diasFechamento = altDiasAteDiaDoMes(cartao.fechamento);
    if (diasFechamento !== null && diasFechamento <= ALERTA_DIAS_CARTAO) {
      // Fatura que fecha agora vence no ciclo seguinte: competência = mês do
      // próximo vencimento depois desse fechamento.
      const diasVenc = altDiasAteDiaDoMes(cartao.vencimento);
      const compFecha = altCompetenciaEmDias(
        diasVenc != null && diasVenc >= diasFechamento ? diasVenc : diasFechamento + 20
      );
      alertas.push(altAlerta(
        'info',
        `Fatura do ${altNomeFaturaComMes(nome, compFecha)} fecha ${altPrazoEmTexto(diasFechamento)}`,
        'compras após o fechamento caem na fatura seguinte.',
        altHrefFatura(cartao, compFecha),
        cartao.ultimos ? 'Abrir fatura' : 'Ver cartões',
        diasFechamento
      ));
    }
  });

  return alertas;
}

// "05" ou "05/09" -> 5
function altDiaDoCampo(valor) {
  const m = String(valor || '').trim().match(/^(\d{1,2})/);
  return m ? parseInt(m[1], 10) : null;
}

// Última ocorrência do dia de fechamento em/antes do vencimento daquela fatura.
function altDataFechamento(vencimento, diaFechamento) {
  if (!diaFechamento) return null;
  let d = new Date(vencimento.getFullYear(), vencimento.getMonth(), diaFechamento);
  if (d > vencimento) {
    d = new Date(vencimento.getFullYear(), vencimento.getMonth() - 1, diaFechamento);
  }
  return d;
}

// Fatura que já fechou e ainda não foi paga, no intervalo entre o fechamento e
// alguns dias após o vencimento. Cobre a lacuna do alerta de vencimento
// (altAlertasCartoes só olha os 3 dias anteriores ao dia do vencimento e nunca
// enxerga uma fatura vencida).
function altAlertasFaturaFechada() {
  const alertas = [];
  const hoje = altHoje();

  Store.ler(Store.CHAVES.CARTOES, []).forEach(cartao => {
    const nome = cartao.nome || 'Cartão';

    (cartao.datasPorMes || []).forEach(entrada => {
      const saldo = Number(entrada.saldo) || 0;
      if (saldo <= 0 || entrada.foiPaga) return;

      const partes = String(entrada.mes || '').split('-').map(Number);
      const ano = partes[0];
      const mes = partes[1];
      const diaVenc = altDiaDoCampo(entrada.vencimento) || altDiaDoCampo(cartao.vencimento);
      if (!ano || !mes || !diaVenc) return;

      const dataVencimento = new Date(ano, mes - 1, diaVenc);
      const dias = Math.round((dataVencimento - hoje) / 86400000);

      // Entrada muito à frente: ainda não é assunto.
      if (dias > 45) return;

      // Só depois do fechamento.
      const diaFech = altDiaDoCampo(entrada.fechamento) || altDiaDoCampo(cartao.fechamento);
      const dataFechamento = altDataFechamento(dataVencimento, diaFech);
      if (dataFechamento && hoje < dataFechamento) return;

      // 0..3 dias para o vencimento já é coberto por altAlertasCartoes.
      if (dias >= 0 && dias <= ALERTA_DIAS_CARTAO) return;

      const jaSeparado = !!entrada.dinheiroSeparado;
      const detalheSeparado = jaSeparado
        ? (Number(entrada.valorSeparado) > 0
            ? `dinheiro separado (${formatarMoedaBrasileira(entrada.valorSeparado)})`
            : 'dinheiro já separado')
        : 'sem dinheiro separado ainda';

      const nomeMes = altNomeFaturaComMes(nome, entrada.mes);
      let severidade;
      let titulo;
      if (dias < 0) {
        // Só depois de vencer o alerta fala em "não está paga".
        severidade = 'critico';
        titulo = `Fatura do ${nomeMes} venceu ${altPrazoEmTexto(dias)} e não está paga`;
      } else {
        // Ainda vai vencer: alerta informativo, focado em provisionar o valor.
        severidade = jaSeparado ? 'info' : (dias <= 10 ? 'atencao' : 'info');
        titulo = jaSeparado
          ? `Fatura do ${nomeMes} fechada — dinheiro já separado`
          : `Fatura do ${nomeMes} fechada — provisionar pagamento`;
      }

      const quando = dias < 0
        ? `venceu ${altPrazoEmTexto(dias)}`
        : `vence ${altPrazoEmTexto(dias)}`;

      alertas.push(altAlerta(
        severidade,
        titulo,
        `${formatarMoedaBrasileira(saldo)} · ${quando} (dia ${diaVenc}) · ${detalheSeparado}.`,
        altHrefFatura(cartao, entrada.mes),
        cartao.ultimos ? 'Abrir fatura' : 'Ver cartões',
        dias
      ));
    });
  });

  return alertas;
}

function altAlertasDividas() {
  const lista = typeof smListaDividas === 'function' ? smListaDividas() : [];

  return lista.reduce((alertas, divida) => {
    const faltante = typeof smFaltanteDivida === 'function' ? smFaltanteDivida(divida) : 0;
    if (faltante <= 0) return alertas;

    // Parcelada vence todo mês num dia fixo; a de valor único tem data própria.
    const dias = divida.parcelado
      ? altDiasAteDiaDoMes(divida.diaVencimento)
      : altDiasAte(divida.vencimento);
    if (dias === null || dias > ALERTA_DIAS_DIVIDA) return alertas;

    const valor = divida.parcelado ? (Number(divida.valorParcela) || 0) : faltante;
    const rotulo = divida.parcelado ? 'Parcela' : 'Dívida';

    alertas.push(altAlerta(
      dias <= 2 ? 'critico' : 'atencao',
      dias < 0
        ? `${rotulo} de ${divida.credor} venceu ${altPrazoEmTexto(dias)}`
        : `${rotulo} de ${divida.credor} vence ${altPrazoEmTexto(dias)}`,
      divida.parcelado
        ? `${formatarMoedaBrasileira(valor)} por mês · faltam ${formatarMoedaBrasileira(faltante)}.`
        : `Falta pagar ${formatarMoedaBrasileira(faltante)}.`,
      './dividas.html',
      'Ver dívidas',
      dias
    ));
    return alertas;
  }, []);
}

function altAlertasDespesasFixas() {
  const dados = Store.ler(Store.CHAVES.DESPESAS_FIXAS, null);
  if (!dados || !Array.isArray(dados.despesas)) return [];

  const hoje = altHoje();
  const compDe = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;

  return dados.despesas.reduce((alertas, d) => {
    if (d.oculta || !d.vencimentoDia) return alertas;

    const dias = altDiasAteDiaDoMes(d.vencimentoDia);
    if (dias === null || dias > ALERTA_DIAS_DESPESA_FIXA) return alertas;

    // Competência em que cai o próximo vencimento pode não ser o mês do
    // calendário (ex.: dia 31, vencimento dia 1 -> cai no mês seguinte).
    // Marcar como paga em qualquer uma das duas competências limpa o alerta.
    const alvo = new Date(hoje);
    alvo.setDate(hoje.getDate() + dias);
    const comps = [compDe(hoje), compDe(alvo)];

    const estadoNoMes = (c) => {
      const reg = d.meses && d.meses[c];
      if (reg) return reg.status || null;
      return (typeof d.pagoEm === 'string' && d.pagoEm.slice(0, 7) === c) ? 'pago' : null;
    };
    const estados = comps.map(estadoNoMes);
    if (estados.includes('pago')) return alertas;
    const provisionada = estados.includes('reservado');

    alertas.push(altAlerta(
      dias <= 1 ? 'critico' : 'atencao',
      provisionada
        ? `${d.nome} vence ${altPrazoEmTexto(dias)} — provisionada, falta pagar`
        : `${d.nome} vence ${altPrazoEmTexto(dias)} e não está paga`,
      `${formatarMoedaBrasileira(d.valor || 0)} · dia ${parseInt(d.vencimentoDia, 10)} de cada mês.`,
      './despesas-fixas.html',
      'Ver despesas fixas',
      dias
    ));
    return alertas;
  }, []);
}

function altAlertasMetas() {
  return Store.ler(Store.CHAVES.METAS, []).reduce((alertas, meta) => {
    const alvo = Number(meta.valorAlvo) || 0;
    const atual = Number(meta.valorAtual) || 0;
    if (alvo <= 0 || atual >= alvo) return alertas;

    const dias = altDiasAte(meta.data);
    if (dias === null || dias > ALERTA_DIAS_META) return alertas;

    const faltante = alvo - atual;
    alertas.push(altAlerta(
      dias < 0 ? 'critico' : 'atencao',
      dias < 0
        ? `Meta "${meta.titulo}" passou do prazo ${altPrazoEmTexto(dias)}`
        : `Meta "${meta.titulo}" vence ${altPrazoEmTexto(dias)}`,
      `Faltam ${formatarMoedaBrasileira(faltante)} para os ${formatarMoedaBrasileira(alvo)}.`,
      './metas.html',
      'Ver metas',
      dias
    ));
    return alertas;
  }, []);
}

function altAlertasEnvelopes() {
  const renda = parseFloat(Store.lerTexto(Store.CHAVES.RENDA, '0')) || 0;
  if (renda <= 0) return [];

  return Store.ler(Store.CHAVES.ENVELOPES, []).reduce((alertas, envelope) => {
    const disponivel = renda * ((Number(envelope.percentual) || 0) / 100);
    if (disponivel <= 0) return alertas;

    const gasto = (envelope.registros || [])
      .reduce((total, r) => total + (Number(r.valor) || 0), 0);
    const uso = (gasto / disponivel) * 100;
    if (uso < 80) return alertas;

    alertas.push(altAlerta(
      uso >= 100 ? 'critico' : 'atencao',
      uso >= 100
        ? `Envelope "${envelope.nome}" estourou o limite`
        : `Envelope "${envelope.nome}" em ${uso.toFixed(0)}% do limite`,
      `${formatarMoedaBrasileira(gasto)} de ${formatarMoedaBrasileira(disponivel)}.`,
      './envelopes.html',
      'Ver envelopes'
    ));
    return alertas;
  }, []);
}

function altAlertasReserva() {
  const dados = Store.ler(Store.CHAVES.RESERVA, null);
  if (!dados) return [];

  const meta = (Number(dados.salario) || 0) * (Number(dados.meses) || 0);
  if (meta <= 0) return [];

  const atual = (dados.aportes || []).reduce((total, a) => total + (Number(a.valor) || 0), 0);
  if (atual >= meta) return [];

  const percentual = (atual / meta) * 100;
  return [altAlerta(
    percentual < 50 ? 'atencao' : 'info',
    `Reserva de emergência em ${percentual.toFixed(0)}% do alvo`,
    `${formatarMoedaBrasileira(atual)} de ${formatarMoedaBrasileira(meta)}.`,
    './reserva-emergencia.html',
    'Ver reserva'
  )];
}

// Gasto de supermercado do mês corrente vs. teto definido em mercado.html.
function altGastoMercado(competencia) {
  const dados = Store.ler(Store.CHAVES.MERCADO, null);
  if (!dados || !Array.isArray(dados.compras)) return null;
  const teto = Number(dados.tetoMensal) || 0;
  const gasto = dados.compras
    .filter(c => (c.data || '').slice(0, 7) === competencia)
    .reduce((s, c) => s + (c.itens || []).reduce((si, i) => si + (Number(i.valor) || 0), 0), 0);
  return { teto, gasto };
}

function altAlertasMercado() {
  const info = altGastoMercado(smCompetenciaAtual());
  if (!info || info.teto <= 0) return [];

  const uso = (info.gasto / info.teto) * 100;
  if (uso < 90) return [];

  return [altAlerta(
    uso >= 100 ? 'critico' : 'atencao',
    uso >= 100
      ? `Mercado estourou o teto do mês (${uso.toFixed(0)}%)`
      : `Mercado em ${uso.toFixed(0)}% do teto do mês`,
    `${formatarMoedaBrasileira(info.gasto)} de ${formatarMoedaBrasileira(info.teto)}.`,
    './mercado.html',
    'Ver mercado'
  )];
}

function altAlertasBackup() {
  const dias = typeof obterDiasDesdeUltimoBackup === 'function'
    ? obterDiasDesdeUltimoBackup()
    : null;

  if (dias === null) {
    return [altAlerta(
      'atencao',
      'Nenhum backup exportado neste navegador',
      'Todos os dados vivem só aqui: limpar o cache apaga o histórico.',
      null,
      null
    )];
  }

  if (dias >= ALERTA_DIAS_BACKUP) {
    return [altAlerta(
      'atencao',
      `Último backup há ${dias} dias`,
      'Exporte um arquivo novo para não perder os lançamentos recentes.',
      null,
      null
    )];
  }

  return [];
}

function altAlertasSaldo() {
  if (typeof calcularSaldoDoMes !== 'function') return [];

  // Alerta é sempre sobre o mês corrente, mesmo olhando outro no seletor.
  const r = calcularSaldoDoMes(smCompetenciaAtual());
  if (r.receitas === 0 || r.saldo >= 0) return [];

  return [altAlerta(
    'critico',
    `Saldo projetado do mês está negativo em ${formatarMoedaBrasileira(Math.abs(r.saldo))}`,
    `${formatarMoedaBrasileira(r.saidas)} de saídas para ${formatarMoedaBrasileira(r.receitas)} de receitas.`,
    '#container-saldo-mes',
    'Ver detalhamento do saldo do mês',
    0
  )];
}

function gerarAlertas() {
  return [].concat(
    altAlertasSaldo(),
    altAlertasCartoes(),
    altAlertasFaturaFechada(),
    altAlertasDespesasFixas(),
    altAlertasDividas(),
    altAlertasEnvelopes(),
    altAlertasMercado(),
    altAlertasMetas(),
    altAlertasReserva(),
    altAlertasBackup()
  ).sort((a, b) => {
    // 1º critério: prazo. O que vence antes (ou já venceu) sobe;
    // alertas sem data (reserva, backup, envelopes) ficam por último.
    const da = a.dias == null ? Infinity : a.dias;
    const db = b.dias == null ? Infinity : b.dias;
    if (da !== db) return da - db;
    // 2º critério: severidade, para desempatar no mesmo dia.
    return ALERTA_ORDEM[a.severidade] - ALERTA_ORDEM[b.severidade];
  });
}

function altEscapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function renderizarAlertas() {
  const container = document.getElementById('container-alertas');
  if (!container) return;

  const alertas = gerarAlertas();

  if (alertas.length === 0) {
    container.innerHTML = `
      <h2>Alertas</h2>
      <p class="alt-vazio">Nada exigindo atenção agora. Contas, metas e envelopes estão em dia.</p>
    `;
    return;
  }

  const itens = alertas.map(a => `
    <li class="alt-item alt-${a.severidade}">
      <div class="alt-texto">
        <strong>${altEscapar(a.titulo)}</strong>
        <span>${altEscapar(a.detalhe)}</span>
      </div>
      ${a.href ? `<a class="alt-link" href="${a.href}">${altEscapar(a.rotuloLink)} →</a>` : ''}
    </li>
  `).join('');

  container.innerHTML = `
    <h2>Alertas <span class="alt-contador">${alertas.length}</span></h2>
    <ul class="alt-lista">${itens}</ul>
  `;
}
