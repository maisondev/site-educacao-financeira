// Dashboard consolidado — funções de leitura de localStorage de múltiplas páginas

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function lerMetas() {
  return Store.ler(Store.CHAVES.METAS, []);
}

function lerEnvelopes() {
  return Store.ler(Store.CHAVES.ENVELOPES, []);
}

function lerCartoes() {
  return Store.ler(Store.CHAVES.CARTOES, []);
}

function lerDespesasFixas() {
  return Store.ler(Store.CHAVES.DESPESAS_FIXAS, null);
}

function lerDespesasVariaveis() {
  return Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []);
}

function lerReserva() {
  return Store.ler(Store.CHAVES.RESERVA, null);
}

function lerCursos() {
  return Store.ler(Store.CHAVES.CURSOS, []);
}

function obterSaldoMesAtual(cartao) {
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const datas = cartao.datasPorMes || [];
  const dataAtual = datas.find(d => d.mes === mesAtual);
  return dataAtual?.saldo || null;
}

function obterDespesasVariaveisMes() {
  const despesas = lerDespesasVariaveis();
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  return despesas.filter(d => {
    if (!d.data) return false;
    return d.data.startsWith(mesAtual);
  }).reduce((sum, d) => sum + (d.valor || 0), 0);
}

function criarCardVazio(titulo, descricao, linkHref, linkTexto) {
  return `
    <div class="card-dashboard vazio">
      <div class="card-header">
        <h3>${escaparHTML(titulo)}</h3>
      </div>
      <div class="card-body">
        <p>${escaparHTML(descricao)}</p>
        <a href="${linkHref}" class="btn btn-primary">${linkTexto}</a>
      </div>
    </div>
  `;
}

function criarCardRenda() {
  const renda = obterRendaMensal();

  if (!renda) {
    return criarCardVazio('Renda Mensal', 'Configure sua renda mensal em Despesas Fixas ou Reserva de Emergência.', './despesas-fixas.html', 'Configurar renda');
  }

  return `
    <div class="card-dashboard">
      <div class="card-header">
        <h3>Renda Mensal</h3>
      </div>
      <div class="card-body">
        <div class="card-stat">
          <div class="stat-valor">${formatarMoedaBrasileira(renda)}</div>
          <div class="stat-label">Sua renda mensal</div>
        </div>
      </div>
      <div class="card-footer">
        <a href="./despesas-fixas.html">Ver detalhes →</a>
      </div>
    </div>
  `;
}

function criarCardMetas() {
  const metas = lerMetas();

  if (metas.length === 0) {
    return criarCardVazio('Metas Financeiras', 'Defina seus objetivos de médio e longo prazo.', './metas.html', 'Adicionar meta');
  }

  const atingidas = metas.filter(m => m.valorAtual >= m.valorAlvo).length;
  const emProgresso = metas.length - atingidas;
  const progressoMedio = metas.reduce((sum, m) => sum + Math.min((m.valorAtual / m.valorAlvo) * 100, 100), 0) / metas.length;

  return `
    <div class="card-dashboard">
      <div class="card-header">
        <h3>Metas Financeiras</h3>
      </div>
      <div class="card-body">
        <div class="card-stats-row">
          <div class="card-stat-mini">
            <div class="stat-valor">${atingidas}</div>
            <div class="stat-label">Atingidas</div>
          </div>
          <div class="card-stat-mini">
            <div class="stat-valor">${emProgresso}</div>
            <div class="stat-label">Em progresso</div>
          </div>
        </div>
        <div class="progresso-container" style="margin-top: 12px;">
          <div class="progresso-barra">
            <div class="progresso-preenchido" style="width: ${Math.min(progressoMedio, 100)}%"></div>
          </div>
          <div class="progresso-label">${Math.round(progressoMedio)}% de progresso médio</div>
        </div>
      </div>
      <div class="card-footer">
        <a href="./metas.html">Ver detalhes →</a>
      </div>
    </div>
  `;
}

function criarCardEnvelopes() {
  const envelopes = lerEnvelopes();
  const renda = obterRendaMensal();

  if (envelopes.length === 0 || !renda) {
    return criarCardVazio('Envelopes', 'Aloque sua renda em categorias com teto fixo.', './envelopes.html', 'Configurar envelopes');
  }

  const totalGasto = envelopes.reduce((sum, env) => {
    const registros = env.registros || env.despesas || [];
    return sum + registros.reduce((s, r) => s + r.valor, 0);
  }, 0);

  const totalAlocado = (renda * envelopes.reduce((sum, env) => sum + env.percentual, 0)) / 100;
  const percentualUsado = (totalGasto / totalAlocado) * 100;

  let classeProgresso = '';
  if (percentualUsado > 100) {
    classeProgresso = 'erro';
  } else if (percentualUsado > 80) {
    classeProgresso = 'alerta';
  }

  return `
    <div class="card-dashboard">
      <div class="card-header">
        <h3>Envelopes</h3>
      </div>
      <div class="card-body">
        <div class="card-stats-row">
          <div class="card-stat-mini">
            <div class="stat-valor">${formatarMoedaBrasileira(totalGasto)}</div>
            <div class="stat-label">Gasto</div>
          </div>
          <div class="card-stat-mini">
            <div class="stat-valor">${formatarMoedaBrasileira(totalAlocado)}</div>
            <div class="stat-label">Alocado</div>
          </div>
        </div>
        <div class="progresso-container" style="margin-top: 12px;">
          <div class="progresso-barra">
            <div class="progresso-preenchido ${classeProgresso}" style="width: ${Math.min(percentualUsado, 100)}%"></div>
          </div>
          <div class="progresso-label">${Math.round(percentualUsado)}% utilizado</div>
        </div>
      </div>
      <div class="card-footer">
        <a href="./envelopes.html">Ver detalhes →</a>
      </div>
    </div>
  `;
}

function criarCardDespesasFixas() {
  const df = lerDespesasFixas();

  if (!df || !df.despesas || df.despesas.length === 0) {
    return criarCardVazio('Despesas Fixas', 'Registre suas despesas mensais recorrentes.', './despesas-fixas.html', 'Adicionar despesa');
  }

  const totalDespesas = df.despesas.reduce((sum, d) => sum + d.valor, 0);
  const percentual = df.salario ? (totalDespesas / df.salario) * 100 : 0;

  const mesAtual = new Date().toISOString().slice(0, 7);
  const pagas = df.despesas.filter(d => typeof d.pagoEm === 'string' && d.pagoEm.slice(0, 7) === mesAtual);
  const totalPago = pagas.reduce((sum, d) => sum + d.valor, 0);
  const faltaPagar = totalDespesas - totalPago;
  const pctPago = totalDespesas ? (totalPago / totalDespesas) * 100 : 0;

  return `
    <div class="card-dashboard">
      <div class="card-header">
        <h3>Despesas Fixas</h3>
      </div>
      <div class="card-body">
        <div class="card-stats-row">
          <div class="card-stat-mini">
            <div class="stat-valor">${formatarMoedaBrasileira(totalDespesas)}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="card-stat-mini">
            <div class="stat-valor">${Math.round(percentual)}%</div>
            <div class="stat-label">Da renda</div>
          </div>
        </div>
        <div class="progresso-container" style="margin-top: 12px;">
          <div class="progresso-barra">
            <div class="progresso-preenchido" style="width: ${Math.min(pctPago, 100)}%"></div>
          </div>
          <div class="progresso-label">
            ${pagas.length}/${df.despesas.length} pagas neste mês ·
            ${faltaPagar > 0 ? `falta ${formatarMoedaBrasileira(faltaPagar)}` : 'tudo pago'}
          </div>
        </div>
      </div>
      <div class="card-footer">
        <a href="./despesas-fixas.html">Ver detalhes →</a>
      </div>
    </div>
  `;
}

function criarCardDespesasVariaveis() {
  const despesas = lerDespesasVariaveis();

  if (despesas.length === 0) {
    return criarCardVazio('Despesas Variáveis', 'Registre suas despesas do mês (alimentos, transportes, etc).', './despesas-variaveis.html', 'Adicionar despesa');
  }

  const totalMes = obterDespesasVariaveisMes();

  return `
    <div class="card-dashboard">
      <div class="card-header">
        <h3>Despesas Variáveis</h3>
      </div>
      <div class="card-body">
        <div class="card-stat">
          <div class="stat-valor">${formatarMoedaBrasileira(totalMes)}</div>
          <div class="stat-label">Total neste mês</div>
        </div>
      </div>
      <div class="card-footer">
        <a href="./despesas-variaveis.html">Ver detalhes →</a>
      </div>
    </div>
  `;
}

function criarCardReserva() {
  const reserva = lerReserva();

  if (!reserva) {
    return criarCardVazio('Reserva de Emergência', 'Defina quantos meses de salário você quer guardado como colchão.', './reserva-emergencia.html', 'Configurar meta');
  }

  const totalAportes = reserva.aportes ? reserva.aportes.reduce((sum, a) => sum + a.valor, 0) : 0;
  const meta = reserva.salario * reserva.meses;
  const percentual = meta ? (totalAportes / meta) * 100 : 0;

  return `
    <div class="card-dashboard">
      <div class="card-header">
        <h3>Reserva de Emergência</h3>
      </div>
      <div class="card-body">
        <div class="card-stats-row">
          <div class="card-stat-mini">
            <div class="stat-valor">${formatarMoedaBrasileira(totalAportes)}</div>
            <div class="stat-label">Guardado</div>
          </div>
          <div class="card-stat-mini">
            <div class="stat-valor">${formatarMoedaBrasileira(meta)}</div>
            <div class="stat-label">Meta</div>
          </div>
        </div>
        <div class="progresso-container" style="margin-top: 12px;">
          <div class="progresso-barra">
            <div class="progresso-preenchido" style="width: ${Math.min(percentual, 100)}%"></div>
          </div>
          <div class="progresso-label">${Math.round(percentual)}% atingido</div>
        </div>
      </div>
      <div class="card-footer">
        <a href="./reserva-emergencia.html">Ver detalhes →</a>
      </div>
    </div>
  `;
}

function criarCardCartoes() {
  const cartoes = lerCartoes();

  if (cartoes.length === 0) {
    return criarCardVazio('Cartões de Crédito', 'Cadastre seus cartões e acompanhe saldos e vencimentos.', './cartoes.html', 'Adicionar cartão');
  }

  const totalSaldo = cartoes.reduce((sum, c) => {
    const saldoMes = obterSaldoMesAtual(c);
    const saldo = saldoMes || c.saldoAberto;
    return sum + (saldo || 0);
  }, 0);

  return `
    <div class="card-dashboard">
      <div class="card-header">
        <h3>Cartões de Crédito</h3>
      </div>
      <div class="card-body">
        <div class="card-stats-row">
          <div class="card-stat-mini">
            <div class="stat-valor">${cartoes.length}</div>
            <div class="stat-label">Cartões</div>
          </div>
          <div class="card-stat-mini">
            <div class="stat-valor">${formatarMoedaBrasileira(totalSaldo)}</div>
            <div class="stat-label">Saldo aberto</div>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <a href="./cartoes.html">Ver detalhes →</a>
      </div>
    </div>
  `;
}

function criarCardCursos() {
  const cursos = lerCursos();

  if (cursos.length === 0) {
    return criarCardVazio('Meus Cursos', 'Acompanhe os cursos de educação financeira que está fazendo.', './cursos.html', 'Adicionar curso');
  }

  const pendentes = cursos.filter(c => c.status === 'pendente').length;
  const andamento = cursos.filter(c => c.status === 'andamento').length;
  const concluidos = cursos.filter(c => c.status === 'concluido').length;

  return `
    <div class="card-dashboard">
      <div class="card-header">
        <h3>Meus Cursos</h3>
      </div>
      <div class="card-body">
        <div class="card-stats-row">
          <div class="card-stat-mini">
            <div class="stat-valor">${andamento}</div>
            <div class="stat-label">Em andamento</div>
          </div>
          <div class="card-stat-mini">
            <div class="stat-valor">${concluidos}</div>
            <div class="stat-label">Concluídos</div>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <a href="./cursos.html">Ver detalhes →</a>
      </div>
    </div>
  `;
}

function renderizarDashboard() {
  const container = document.getElementById('dashboard-grid');
  if (!container) return;

  // Verificar se há algum dado
  const temMetas = lerMetas().length > 0;
  const temEnvelopes = lerEnvelopes().length > 0;
  const temCartoes = lerCartoes().length > 0;
  const temDespesasFixas = lerDespesasFixas() !== null;
  const temDespesasVariaveis = lerDespesasVariaveis().length > 0;
  const temReserva = lerReserva() !== null;
  const temCursos = lerCursos().length > 0;

  const temAlgumDado = temMetas || temEnvelopes || temCartoes || temDespesasFixas || temDespesasVariaveis || temReserva || temCursos;

  if (!temAlgumDado) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--espacamento-xl);">
        <h2 style="color: var(--cor-texto-leve); margin-bottom: var(--espacamento-lg);">Bem-vindo ao Painel de Controle</h2>
        <p style="color: var(--cor-texto-leve); margin-bottom: var(--espacamento-xl);">
          Comece preenchendo seus dados. Aqui está a ordem recomendada:
        </p>
        <ol style="list-style: decimal; text-align: left; display: inline-block; margin-bottom: var(--espacamento-xl);">
          <li><a href="./cartoes.html">Cadastre seus cartões</a></li>
          <li><a href="./despesas-fixas.html">Registre suas despesas fixas</a></li>
          <li><a href="./reserva-emergencia.html">Configure a Reserva de Emergência</a></li>
          <li><a href="./envelopes.html">Aloque seu dinheiro em Envelopes</a></li>
          <li><a href="./metas.html">Crie suas Metas Financeiras</a></li>
          <li><a href="./despesas-variaveis.html">Registre despesas do mês</a></li>
          <li><a href="./cursos.html">Acompanhe seus cursos</a></li>
        </ol>
      </div>
    `;
    return;
  }

  const cards = [
    criarCardRenda(),
    criarCardMetas(),
    criarCardEnvelopes(),
    criarCardDespesasFixas(),
    criarCardDespesasVariaveis(),
    criarCardReserva(),
    criarCardCartoes(),
    criarCardCursos()
  ];

  container.innerHTML = cards.join('');
}

// Fecha o mês em foco: arquiva o resumo e zera os envelopes para o mês seguinte.
function confirmarFechamentoDoMes() {
  const competencia = competenciaSelecionada();
  const nome = formatarCompetencia(competencia);

  if (competenciaFechada(competencia)) {
    if (!confirm(`${nome} já está fechado. Reabrir para continuar lançando?`)) return;
    reabrirMes(competencia);
    atualizarPainel();
    return;
  }

  const confirmado = confirm(
    `Fechar ${nome}?

` +
    'O resumo do mês é arquivado e os envelopes voltam a zero. ' +
    'Nenhum lançamento é apagado, e dá para reabrir depois.'
  );
  if (!confirmado) return;

  if (fecharMes(competencia)) {
    atualizarPainel();
  }
}

// Redesenha tudo que depende do mês em foco.
function atualizarPainel() {
  if (typeof renderizarSeletorCompetencia === 'function') {
    renderizarSeletorCompetencia('container-competencia', atualizarPainel);
  }
  if (typeof renderizarSaldoDoMes === 'function') {
    renderizarSaldoDoMes();
  }
  if (typeof renderizarAlertas === 'function') {
    renderizarAlertas();
  }
  renderizarDashboard();

  const aviso = document.getElementById('cmp-aviso');
  if (aviso && typeof competenciaSelecionada === 'function') {
    const competencia = competenciaSelecionada();
    aviso.textContent = competencia === competenciaAtual()
      ? ''
      : `Você está vendo ${formatarCompetencia(competencia)}; os alertas continuam sobre o mês corrente.`;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof migrarCompetencias === 'function') {
    migrarCompetencias();
  }
  if (typeof renderizarLancamentoRapido === 'function') {
    renderizarLancamentoRapido();
  }

  atualizarPainel();

  if (typeof renderizarSecaoBackup === 'function') {
    renderizarSecaoBackup();
  }

  const botaoFechar = document.getElementById('btn-fechar-mes');
  if (botaoFechar) {
    botaoFechar.addEventListener('click', confirmarFechamentoDoMes);
  }
});
