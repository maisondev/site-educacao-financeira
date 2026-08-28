// Central de alertas do dashboard: reúne o que exige ação nos próximos dias.
// Só entra aqui o que é acionável — o calendário completo continua nos lembretes.

const ALERTA_DIAS_CARTAO = 3;
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

function altAlerta(severidade, titulo, detalhe, href, rotuloLink) {
  return { severidade, titulo, detalhe, href, rotuloLink };
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

function altAlertasCartoes() {
  const alertas = [];

  Store.ler(Store.CHAVES.CARTOES, []).forEach(cartao => {
    const nome = cartao.nome || 'Cartão';
    const dias = altDiasAteDiaDoMes(cartao.vencimento);
    if (dias !== null && dias <= ALERTA_DIAS_CARTAO) {
      alertas.push(altAlerta(
        dias <= 1 ? 'critico' : 'atencao',
        `Fatura do ${nome} vence ${altPrazoEmTexto(dias)}`,
        `Dia ${parseInt(cartao.vencimento, 10)} de cada mês.`,
        './cartoes.html',
        'Ver cartões'
      ));
    }

    const diasFechamento = altDiasAteDiaDoMes(cartao.fechamento);
    if (diasFechamento !== null && diasFechamento <= ALERTA_DIAS_CARTAO) {
      alertas.push(altAlerta(
        'info',
        `Fatura do ${nome} fecha ${altPrazoEmTexto(diasFechamento)}`,
        'Compras após o fechamento caem na fatura seguinte.',
        './cartoes.html',
        'Ver cartões'
      ));
    }
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
      'Ver dívidas'
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
      'Ver metas'
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

  const r = calcularSaldoDoMes();
  if (r.receitas === 0 || r.saldo >= 0) return [];

  return [altAlerta(
    'critico',
    `Saldo projetado do mês está negativo em ${formatarMoedaBrasileira(Math.abs(r.saldo))}`,
    `${formatarMoedaBrasileira(r.saidas)} de saídas para ${formatarMoedaBrasileira(r.receitas)} de receitas.`,
    null,
    null
  )];
}

function gerarAlertas() {
  return [].concat(
    altAlertasSaldo(),
    altAlertasCartoes(),
    altAlertasDividas(),
    altAlertasEnvelopes(),
    altAlertasMetas(),
    altAlertasReserva(),
    altAlertasBackup()
  ).sort((a, b) => ALERTA_ORDEM[a.severidade] - ALERTA_ORDEM[b.severidade]);
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
