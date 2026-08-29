function gerarRelatorio() {
  atualizarDataRelatorio();
  gerarResumoGeral();
  gerarSecaoGastoPorCategoria();
  gerarSecaoDespesasFixas();
  gerarSecaoDividas();
  gerarSecaoReserva();
  gerarSecaoCartao();
}

function atualizarDataRelatorio() {
  const hoje = new Date();
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // O relatório é do mês em foco no seletor de competência, não do mês do calendário.
  const comp = typeof competenciaSelecionada === 'function' ? competenciaSelecionada() : null;
  let rotulo;
  if (comp && /^\d{4}-\d{2}$/.test(comp)) {
    const [ano, mes] = comp.split('-').map(Number);
    rotulo = `Relatório de ${meses[mes - 1]} de ${ano}`;
  } else {
    rotulo = `Relatório de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  }

  document.getElementById('mes-ano').textContent = rotulo;
  document.getElementById('data-geracao').textContent = hoje.toLocaleDateString('pt-BR');
}

function gerarResumoGeral() {
  const despesasFixas = obterDadosDespesasFixas();
  const dividas = obterDadosDividas();
  const reserva = obterDadosReserva();

  const totalDespesas = despesasFixas.despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalDividasAtivas = dividas.dividas
    .filter(d => (d.valorTotal - d.valorPago) > 0)
    .reduce((sum, d) => sum + (d.valorTotal - d.valorPago), 0);
  const disponivel = (despesasFixas.salario || 0) - totalDespesas;

  const html = `
    <div class="resumo-geral">
      <h2>Resumo Financeiro</h2>
      <div class="resumo-grid">
        <div class="resumo-item">
          <div class="resumo-item-label">Salário Líquido</div>
          <div class="resumo-item-valor">${formatarMoedaBrasileira(despesasFixas.salario || 0)}</div>
        </div>
        <div class="resumo-item">
          <div class="resumo-item-label">Despesas Fixas</div>
          <div class="resumo-item-valor">${formatarMoedaBrasileira(totalDespesas)}</div>
        </div>
        <div class="resumo-item">
          <div class="resumo-item-label">Disponível</div>
          <div class="resumo-item-valor">${formatarMoedaBrasileira(Math.max(0, disponivel))}</div>
        </div>
        <div class="resumo-item">
          <div class="resumo-item-label">Dívidas Ativas</div>
          <div class="resumo-item-valor">${formatarMoedaBrasileira(totalDividasAtivas)}</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('resumo-geral-container').innerHTML = html;
}

function gerarSecaoDespesasFixas() {
  const dados = obterDadosDespesasFixas();
  const container = document.getElementById('secao-despesas-fixas');

  if (!dados.salario || dados.despesas.length === 0) {
    container.innerHTML = `
      <div class="secao-relatorio">
        <h3>Despesas Fixas</h3>
        <div class="sem-dados">Nenhum dado registrado</div>
      </div>
    `;
    return;
  }

  const total = dados.despesas.reduce((sum, d) => sum + d.valor, 0);
  const percentual = dados.salario > 0 ? (total / dados.salario) * 100 : 0;
  const despesasOrdenadas = [...dados.despesas].sort((a, b) => b.valor - a.valor);

  let html = `
    <div class="secao-relatorio">
      <h3>Despesas Fixas Mensais</h3>

      <div class="item-relatorio destaque">
        <div class="item-relatorio-label">Total de Despesas</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(total)}</div>
      </div>

      <div class="item-relatorio">
        <div class="item-relatorio-label">Percentual do Salário</div>
        <div class="item-relatorio-valor">${percentual.toFixed(1)}%</div>
      </div>

      <div class="barra-simples">
        <div class="barra-simples-fill" style="width: ${Math.min(percentual, 100)}%"></div>
      </div>

      <div class="status-badge ${percentual > 50 ? 'status-alerta' : 'status-ok'}">
        ${percentual > 50 ? 'Acima do ideal (>50%)' : 'Dentro do esperado'}
      </div>

      <div style="margin-top: var(--espacamento-lg);">
        <strong>Principais despesas:</strong>
  `;

  despesasOrdenadas.slice(0, 5).forEach(despesa => {
    const pct = dados.salario > 0 ? (despesa.valor / dados.salario) * 100 : 0;
    html += `
      <div class="item-relatorio" style="margin-top: 8px;">
        <div class="item-relatorio-label">${despesa.nome}</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(despesa.valor)} (${pct.toFixed(1)}%)</div>
      </div>
    `;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

function gerarSecaoDividas() {
  const dados = obterDadosDividas();
  const container = document.getElementById('secao-dividas');

  if (dados.dividas.length === 0) {
    container.innerHTML = `
      <div class="secao-relatorio">
        <h3>Dívidas</h3>
        <div class="sem-dados">Nenhuma dívida registrada</div>
      </div>
    `;
    return;
  }

  const dividasAtivas = dados.dividas.filter(d => (d.valorTotal - d.valorPago) > 0);
  const dividasQuitadas = dados.dividas.filter(d => (d.valorTotal - d.valorPago) <= 0);

  const totalDivida = dividasAtivas.reduce((sum, d) => sum + d.valorTotal, 0);
  const totalPago = dividasAtivas.reduce((sum, d) => sum + d.valorPago, 0);
  const totalFaltante = dividasAtivas.reduce((sum, d) => sum + (d.valorTotal - d.valorPago), 0);

  let html = `
    <div class="secao-relatorio">
      <h3>Dívidas</h3>

      <div class="item-relatorio destaque">
        <div class="item-relatorio-label">Total a Pagar</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(totalFaltante)}</div>
      </div>

      <div class="item-relatorio">
        <div class="item-relatorio-label">Já Pago</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(totalPago)}</div>
      </div>

      <div class="item-relatorio">
        <div class="item-relatorio-label">Percentual Quitado</div>
        <div class="item-relatorio-valor">${totalDivida > 0 ? ((totalPago / totalDivida) * 100).toFixed(1) : 0}%</div>
      </div>

      <div class="barra-simples">
        <div class="barra-simples-fill" style="width: ${totalDivida > 0 ? (totalPago / totalDivida) * 100 : 0}%"></div>
      </div>

      <div class="status-badge ${totalFaltante > 0 ? 'status-alerta' : 'status-ok'}">
        ${totalFaltante > 0 ? 'Com dívidas ativas' : 'Livre de dívidas!'}
      </div>

      <div style="margin-top: var(--espacamento-lg);">
        <strong>Dívidas ativas: ${dividasAtivas.length}</strong>
        ${dividasQuitadas.length > 0 ? `<div style="margin-top: 8px; font-size: 13px; color: #666;">Quitadas: ${dividasQuitadas.length}</div>` : ''}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function gerarSecaoReserva() {
  const dados = obterDadosReserva();
  const container = document.getElementById('secao-reserva');

  if (!dados.salario || !dados.meses) {
    container.innerHTML = `
      <div class="secao-relatorio">
        <h3>Reserva de Emergência</h3>
        <div class="sem-dados">Nenhuma configuração de reserva</div>
      </div>
    `;
    return;
  }

  const meta = dados.salario * dados.meses;
  const totalAportes = dados.aportes.reduce((sum, a) => sum + a.valor, 0);
  const faltante = Math.max(0, meta - totalAportes);
  const percentual = meta > 0 ? (totalAportes / meta) * 100 : 0;

  let html = `
    <div class="secao-relatorio">
      <h3>Reserva de Emergência</h3>

      <div class="item-relatorio">
        <div class="item-relatorio-label">Meta</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(meta)}</div>
      </div>

      <div class="item-relatorio destaque">
        <div class="item-relatorio-label">Valor Atual</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(totalAportes)}</div>
      </div>

      <div class="item-relatorio">
        <div class="item-relatorio-label">Falta Reunir</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(faltante)}</div>
      </div>

      <div class="barra-simples">
        <div class="barra-simples-fill" style="width: ${Math.min(percentual, 100)}%"></div>
      </div>

      <div class="status-badge ${percentual >= 100 ? 'status-ok' : (percentual >= 50 ? 'status-aviso' : 'status-alerta')}">
        ${percentual.toFixed(1)}% da meta
      </div>

      <div style="margin-top: var(--espacamento-lg);">
        <strong>Meta: ${dados.meses} meses de salário</strong>
        <div style="margin-top: 4px; font-size: 13px; color: #666;">Aportes registrados: ${dados.aportes.length}</div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function gerarSecaoCartao() {
  const dados = obterDadosCartao();
  const container = document.getElementById('secao-cartao');

  if (!dados || !dados.cartoes || dados.cartoes.length === 0) {
    container.innerHTML = `
      <div class="secao-relatorio">
        <h3>Cartão de Crédito</h3>
        <div class="sem-dados">Nenhum cartão registrado</div>
      </div>
    `;
    return;
  }

  const totalFatura = dados.cartoes.reduce((sum, c) => sum + (c.saldo || 0), 0);

  let html = `
    <div class="secao-relatorio">
      <h3>Cartão de Crédito</h3>

      <div class="item-relatorio destaque">
        <div class="item-relatorio-label">Fatura Total</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(totalFatura)}</div>
      </div>

      <div style="margin-top: var(--espacamento-lg);">
        <strong>Cartões (${dados.cartoes.length}):</strong>
  `;

  dados.cartoes.forEach(cartao => {
    html += `
      <div class="item-relatorio" style="margin-top: 8px;">
        <div class="item-relatorio-label">${cartao.nome || 'Cartão'}</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(cartao.saldo || 0)}</div>
      </div>
    `;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

// --- Gasto por categoria no mês (fixas + variáveis + fatura) ------------------

// De/para da análise de fatura -> categoria unificada (espelha AF_PARA_CATEGORIA_DV).
const REL_FATURA_PARA_CATEGORIA = {
  mercado: 'alimentacao', restaurante: 'alimentacao', transporte: 'combustivel',
  assinatura: 'streaming', casa: 'manutencao', saude: 'saude', online: 'outro',
  vestuario: 'outro', educacao: 'educacao', servicos: 'cuidados', lazer: 'lazer',
  pets: 'pets', impostos: 'impostos', outro: 'outro'
};

function relNomeCategoria(chave) {
  if (typeof Cadastros !== 'undefined') {
    const mapa = Cadastros.categorias();
    if (mapa[chave]) return mapa[chave];
  }
  return chave ? chave.charAt(0).toUpperCase() + chave.slice(1) : 'Sem categoria';
}

function relSomarMapas() {
  const acc = {};
  for (let i = 0; i < arguments.length; i++) {
    const m = arguments[i] || {};
    Object.keys(m).forEach(k => { acc[k] = (acc[k] || 0) + m[k]; });
  }
  return acc;
}

function relGastosFixasPorCategoria() {
  const dados = obterDadosDespesasFixas();
  const acc = {};
  (dados.despesas || []).forEach(d => {
    const c = d.categoria || 'outro';
    acc[c] = (acc[c] || 0) + (Number(d.valor) || 0);
  });
  return acc;
}

function relGastosVariaveisPorCategoria(competencia) {
  const lista = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []);
  const acc = {};
  (Array.isArray(lista) ? lista : []).forEach(d => {
    const c = typeof competenciaDoRegistro === 'function'
      ? competenciaDoRegistro(d)
      : (d.competencia || d.data || '').slice(0, 7);
    if (c !== competencia) return;
    const cat = d.categoria || 'outro';
    acc[cat] = (acc[cat] || 0) + (Number(d.valor) || 0);
  });
  return acc;
}

function relGastosFaturaPorCategoria(competencia) {
  const todas = Store.ler(Store.CHAVES.ANALISE_FATURAS, {}) || {};
  const reg = todas[competencia];
  const acc = {};
  if (!reg || !Array.isArray(reg.lancamentos)) return acc;
  const inclusos = new Set(reg.inclusos && reg.inclusos.length
    ? reg.inclusos
    : reg.lancamentos.map(l => l.cartao || '__sem__'));
  reg.lancamentos.forEach(l => {
    if (l.tipo === 'pagamento') return;
    if (!inclusos.has(l.cartao || '__sem__')) return;
    const cat = REL_FATURA_PARA_CATEGORIA[l.categoria] || 'outro';
    acc[cat] = (acc[cat] || 0) + (Number(l.valor) || 0);
  });
  return acc;
}

function gerarSecaoGastoPorCategoria() {
  const container = document.getElementById('secao-gasto-categoria');
  if (!container) return;

  const comp = typeof competenciaSelecionada === 'function' ? competenciaSelecionada() : null;
  if (!comp) { container.innerHTML = ''; return; }
  const compAnterior = typeof competenciaSomarMeses === 'function'
    ? competenciaSomarMeses(comp, -1) : null;
  const rotuloComp = typeof formatarCompetencia === 'function' ? formatarCompetencia(comp) : comp;

  const fixas = relGastosFixasPorCategoria();
  const atual = relSomarMapas(fixas,
    relGastosVariaveisPorCategoria(comp), relGastosFaturaPorCategoria(comp));
  const anterior = compAnterior
    ? relSomarMapas(fixas,
        relGastosVariaveisPorCategoria(compAnterior), relGastosFaturaPorCategoria(compAnterior))
    : {};

  const chaves = Object.keys(atual).filter(k => atual[k] > 0.005).sort((a, b) => atual[b] - atual[a]);
  if (!chaves.length) {
    container.innerHTML = `
      <div class="secao-relatorio">
        <h3>Gasto por categoria no mês</h3>
        <div class="sem-dados">Nenhum gasto registrado em ${rotuloComp}</div>
      </div>`;
    return;
  }

  const totalMes = chaves.reduce((s, k) => s + atual[k], 0);
  const maior = atual[chaves[0]];

  const linhas = chaves.map(k => {
    const v = atual[k];
    const dif = v - (anterior[k] || 0);
    const pctBarra = maior > 0 ? (v / maior) * 100 : 0;
    let sinal = '—', classe = '';
    if (dif > 0.005) { sinal = `▲ ${formatarMoedaBrasileira(dif)}`; classe = 'rel-dif-sobe'; }
    else if (dif < -0.005) { sinal = `▼ ${formatarMoedaBrasileira(Math.abs(dif))}`; classe = 'rel-dif-desce'; }
    return `
      <div class="item-relatorio" style="margin-top: 10px;">
        <div class="item-relatorio-label">${relNomeCategoria(k)}</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(v)}
          <span class="rel-cat-dif ${classe}">${sinal}</span></div>
      </div>
      <div class="barra-simples"><div class="barra-simples-fill" style="width: ${pctBarra.toFixed(1)}%"></div></div>`;
  }).join('');

  container.innerHTML = `
    <div class="secao-relatorio">
      <h3>Gasto por categoria no mês</h3>
      <div class="item-relatorio destaque">
        <div class="item-relatorio-label">Total (fixas + variáveis + fatura) — ${rotuloComp}</div>
        <div class="item-relatorio-valor">${formatarMoedaBrasileira(totalMes)}</div>
      </div>
      ${compAnterior ? `<p style="font-size: 13px; color: #666; margin: 6px 0 0;">Variação vs. ${formatarCompetencia(compAnterior)}. As despesas fixas entram iguais nos dois meses.</p>` : ''}
      ${linhas}
    </div>`;
}

function imprimirRelatorio() {
  window.print();
}

function recarregarRelatorio() {
  gerarRelatorio();
  alert('Relatório atualizado!');
}

// Funções para obter dados de cada módulo
function obterDadosDespesasFixas() {
  return Store.ler(Store.CHAVES.DESPESAS_FIXAS, { salario: 0, despesas: [] });
}

function obterDadosDividas() {
  return Store.ler(Store.CHAVES.DIVIDAS, { dividas: [] });
}

function obterDadosReserva() {
  return Store.ler(Store.CHAVES.RESERVA, { salario: 0, meses: 0, aportes: [] });
}

function obterDadosCartao() {
  return Store.ler(Store.CHAVES.CARTAO_CREDITO, { cartoes: [] });
}
