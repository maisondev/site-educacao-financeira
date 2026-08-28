// Funções para gerar lembretes de eventos importantes dos cartões

const CHAVE_CARTOES = 'cartoes';

function obterCartoes() {
  try {
    const cartoes = localStorage.getItem(CHAVE_CARTOES);
    return cartoes ? JSON.parse(cartoes) : [];
  } catch (e) {
    console.error('Erro ao obter cartões:', e);
    return [];
  }
}

function obterDespesasFixasLembrete() {
  try {
    const bruto = localStorage.getItem('despesas_fixas');
    const dados = bruto ? JSON.parse(bruto) : null;
    return dados && Array.isArray(dados.despesas) ? dados.despesas : [];
  } catch (e) {
    console.error('Erro ao obter despesas fixas:', e);
    return [];
  }
}

function gerarLembretesProximos30Dias() {
  const cartoes = obterCartoes();
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + 30);

  const lembretes = [];

  // Vencimento das despesas fixas
  const mesAtual = hoje.toISOString().slice(0, 7);
  obterDespesasFixasLembrete().forEach(despesa => {
    if (despesa.oculta || !despesa.vencimentoDia) return;

    const proximoVenc = calcularProximaDataDoMês(parseInt(despesa.vencimentoDia, 10), hoje);
    if (proximoVenc > dataLimite) return;

    const pago = typeof despesa.pagoEm === 'string' && despesa.pagoEm.slice(0, 7) === mesAtual;
    lembretes.push({
      data: proximoVenc,
      tipo: 'despesa-fixa',
      cartao: despesa.nome,
      dia: parseInt(despesa.vencimentoDia, 10),
      valor: despesa.valor,
      pago,
      pagoEm: pago ? despesa.pagoEm : null
    });
  });

  cartoes.forEach(cartao => {
    // Lembretes de fechamento
    if (cartao.fechamento) {
      const proximoFechamento = calcularProximaDataDoMês(parseInt(cartao.fechamento), hoje);
      if (proximoFechamento <= dataLimite) {
        lembretes.push({
          data: proximoFechamento,
          tipo: 'fechamento',
          cartao: cartao.nome,
          dia: parseInt(cartao.fechamento),
          ultimos: cartao.ultimos
        });
      }
    }

    // Lembretes de vencimento
    if (cartao.vencimento) {
      const proximoVencimento = calcularProximaDataDoMês(parseInt(cartao.vencimento), hoje);
      if (proximoVencimento <= dataLimite) {
        lembretes.push({
          data: proximoVencimento,
          tipo: 'vencimento',
          cartao: cartao.nome,
          dia: parseInt(cartao.vencimento),
          ultimos: cartao.ultimos
        });
      }
    }
  });

  return lembretes.sort((a, b) => a.data - b.data);
}

function calcularProximaDataDoMês(dia, dataAtual) {
  const proximaData = new Date(dataAtual);
  proximaData.setDate(dia);

  if (proximaData < dataAtual) {
    proximaData.setMonth(proximaData.getMonth() + 1);
  }

  return proximaData;
}

function formatarDataLembrete(data) {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function renderizarLembretes() {
  const container = document.getElementById('container-lembretes');
  if (!container) return;

  const lembretes = gerarLembretesProximos30Dias();

  if (lembretes.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: var(--espacamento-lg);">Nenhum evento nos próximos 30 dias</p>';
    return;
  }

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const html = lembretes.map(lembrete => {
    const ehHoje = lembrete.data.toDateString() === hoje.toDateString();
    const ehAmanha = lembrete.data.toDateString() === amanha.toDateString();

    let corFundo, corBorda, iconeHtml, label;
    if (lembrete.tipo === 'fechamento') {
      corFundo = '#e3f2fd'; corBorda = '#90caf9';
      iconeHtml = icone('prancheta', 14); label = 'Fechamento';
    } else if (lembrete.tipo === 'despesa-fixa') {
      corFundo = lembrete.pago ? '#e8f5e9' : '#f3e5f5';
      corBorda = lembrete.pago ? '#81c784' : '#ce93d8';
      iconeHtml = icone('calendario', 14); label = 'Despesa fixa';
    } else {
      corFundo = '#fff3e0'; corBorda = '#ffb74d';
      iconeHtml = icone('relogio', 14); label = 'Vencimento';
    }
    const dataTexto = ehHoje ? 'Hoje' : ehAmanha ? 'Amanhã' : formatarDataLembrete(lembrete.data);

    const linhaValor = lembrete.tipo === 'despesa-fixa' && typeof formatarMoedaBrasileira === 'function' && lembrete.valor != null
      ? ` • ${formatarMoedaBrasileira(lembrete.valor)}`
      : '';

    let selo = '';
    if (lembrete.tipo === 'despesa-fixa' && lembrete.pago) {
      selo = `<span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${icone('check', 12)} PAGO</span>`;
    } else if (ehHoje) {
      selo = '<span style="background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">HOJE</span>';
    } else if (ehAmanha) {
      selo = '<span style="background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">AMANHÃ</span>';
    }

    return `
      <div style="background: ${corFundo}; border-left: 4px solid ${corBorda}; padding: var(--espacamento-md); margin-bottom: var(--espacamento-md); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
            <strong>${iconeHtml} ${label}</strong>
          </div>
          <div style="font-size: 16px; font-weight: bold; color: #333;">
            ${lembrete.cartao}${lembrete.ultimos ? ` ●●●● ${lembrete.ultimos}` : ''}
          </div>
          <div style="font-size: 13px; color: #999; margin-top: 4px;">
            Dia ${lembrete.dia} • ${dataTexto}${linhaValor}
          </div>
        </div>
        <div style="text-align: right;">
          ${selo}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// Armazenar lembretes em cache global assim que o script carrega
let LEMBRETES_CACHE = null;

function obterLembretesCache() {
  if (LEMBRETES_CACHE === null) {
    LEMBRETES_CACHE = gerarLembretesProximos30Dias();
  }
  return LEMBRETES_CACHE;
}

// Renderizar ao carregar a página
document.addEventListener('DOMContentLoaded', renderizarLembretes);

// Pré-calcular lembretes imediatamente (sem aguardar DOMContentLoaded)
obterLembretesCache();
