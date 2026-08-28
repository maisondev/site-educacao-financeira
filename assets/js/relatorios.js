function gerarRelatorio() {
  atualizarDataRelatorio();
  gerarResumoGeral();
  gerarSecaoDespesasFixas();
  gerarSecaoDividas();
  gerarSecaoReserva();
  gerarSecaoCartao();
}

function atualizarDataRelatorio() {
  const hoje = new Date();
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  document.getElementById('mes-ano').textContent = `Relatório de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
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
