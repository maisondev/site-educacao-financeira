// Gerenciar compras parceladas e fluxo de caixa futuro

const CHAVE_COMPRAS = 'compras_parceladas';

let compraEditandoId = null;

document.addEventListener('DOMContentLoaded', function() {
  renderizarTabela();
  renderizarCalendario();
  renderizarProjecao12Meses();

  // Pré-preencher data de hoje
  const dataInicio = document.getElementById('input-data-inicio');
  const hoje = new Date();
  const mesProximo = new Date(hoje.getFullYear(), hoje.getMonth() + 1);
  dataInicio.value = `${mesProximo.getFullYear()}-${String(mesProximo.getMonth() + 1).padStart(2, '0')}`;
});

function obterCompras() {
  try {
    const dados = localStorage.getItem(CHAVE_COMPRAS);
    return dados ? JSON.parse(dados) : [];
  } catch (e) {
    console.error('Erro ao carregar compras:', e);
    return [];
  }
}

function salvarCompras(compras) {
  try {
    localStorage.setItem(CHAVE_COMPRAS, JSON.stringify(compras));
  } catch (e) {
    console.error('Erro ao salvar compras:', e);
    alert('Não foi possível salvar a compra.');
  }
}

function adicionarCompra() {
  const descricao = document.getElementById('input-descricao').value.trim();
  const cartao = document.getElementById('input-cartao').value.trim();
  const valorTotal = parseFloat(document.getElementById('input-valor-total').value);
  const numParcelas = parseInt(document.getElementById('input-parcelas').value);
  const dataInicio = document.getElementById('input-data-inicio').value;

  if (!descricao) {
    alert('Por favor, insira a descrição da compra');
    return;
  }

  if (!valorTotal || valorTotal <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  if (!numParcelas || numParcelas < 1) {
    alert('Por favor, insira o número de parcelas');
    return;
  }

  if (!dataInicio) {
    alert('Por favor, selecione o mês da primeira parcela');
    return;
  }

  const compras = obterCompras();

  if (compraEditandoId !== null) {
    const compra = compras.find(c => c.id === compraEditandoId);
    if (compra) {
      compra.descricao = descricao;
      compra.cartao = cartao || 'Não informado';
      compra.valorTotal = valorTotal;
      compra.numParcelas = numParcelas;
      compra.dataInicio = dataInicio;
    }
  } else {
    compras.push({
      id: Date.now(),
      descricao,
      cartao: cartao || 'Não informado',
      valorTotal,
      numParcelas,
      dataInicio,
      dataCriacao: new Date().toISOString()
    });
  }

  salvarCompras(compras);

  // Sincronizar com envelopes
  sincronizarComEnvelopes();

  cancelarEdicaoCompra();

  renderizarTabela();
  renderizarCalendario();
  renderizarProjecao12Meses();
}

function iniciarEdicaoCompra(id) {
  const compra = obterCompras().find(c => c.id === id);
  if (!compra) return;

  compraEditandoId = id;
  document.getElementById('input-descricao').value = compra.descricao || '';
  document.getElementById('input-cartao').value = compra.cartao === 'Não informado' ? '' : (compra.cartao || '');
  document.getElementById('input-valor-total').value = compra.valorTotal;
  document.getElementById('input-parcelas').value = compra.numParcelas;
  document.getElementById('input-data-inicio').value = compra.dataInicio;

  const titulo = document.getElementById('titulo-form-compra');
  if (titulo) titulo.textContent = 'Editar Compra Parcelada';
  const btn = document.getElementById('btn-salvar-compra');
  if (btn) btn.textContent = 'Salvar alterações';
  const btnCancelar = document.getElementById('btn-cancelar-compra');
  if (btnCancelar) btnCancelar.style.display = '';

  document.querySelector('.secao-adicionar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelarEdicaoCompra() {
  compraEditandoId = null;
  document.getElementById('input-descricao').value = '';
  document.getElementById('input-cartao').value = '';
  document.getElementById('input-valor-total').value = '';
  document.getElementById('input-parcelas').value = '';

  const titulo = document.getElementById('titulo-form-compra');
  if (titulo) titulo.textContent = 'Registrar Nova Compra Parcelada';
  const btn = document.getElementById('btn-salvar-compra');
  if (btn) btn.textContent = 'Registrar Compra Parcelada';
  const btnCancelar = document.getElementById('btn-cancelar-compra');
  if (btnCancelar) btnCancelar.style.display = 'none';
}

function removerCompra(id) {
  const confirmar = confirm('Tem certeza que quer remover esta compra parcelada?');
  if (!confirmar) return;

  let compras = obterCompras();
  compras = compras.filter(c => c.id !== id);
  salvarCompras(compras);

  // Sincronizar com envelopes
  sincronizarComEnvelopes();

  renderizarTabela();
  renderizarCalendario();
  renderizarProjecao12Meses();
}

function renderizarTabela() {
  const compras = obterCompras();
  const container = document.getElementById('tabela-container');

  if (compras.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--cor-texto-leve);">Nenhuma compra parcelada registrada ainda.</p>';
    return;
  }

  let html = `
    <table class="tabela-compras">
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Cartão/Forma</th>
          <th>Valor Total</th>
          <th>Parcelas</th>
          <th>1ª Parcela</th>
          <th>Valor/Parcela</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
  `;

  compras.forEach(compra => {
    const valorParcela = (compra.valorTotal / compra.numParcelas).toFixed(2);
    const dataParts = compra.dataInicio.split('-');
    const dataFormatada = `${dataParts[1]}/${dataParts[0]}`;

    html += `
      <tr>
        <td>${compra.descricao}</td>
        <td>${compra.cartao}</td>
        <td class="valor-destaque">${compra.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td>${compra.numParcelas}x</td>
        <td>${dataFormatada}</td>
        <td>${parseFloat(valorParcela).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td>
          <button class="btn-remover" onclick="iniciarEdicaoCompra(${compra.id})" style="background: var(--cor-secundaria, #1264a3);">Editar</button>
          <button class="btn-remover" onclick="removerCompra(${compra.id})">Remover</button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

function renderizarCalendario() {
  const compras = obterCompras();
  const container = document.getElementById('calendario-container');

  // Gerar próximos 12 meses
  const hoje = new Date();
  const meses = [];

  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() + i);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const mesAno = `${ano}-${mes}`;

    // Calcular parcelas para este mês
    const parcelas = [];
    let totalMes = 0;

    compras.forEach(compra => {
      const [anoInicio, mesInicio] = compra.dataInicio.split('-');
      const mesIniciNum = parseInt(mesInicio);
      const anoIniciNum = parseInt(anoInicio);

      // Calcular qual é o mês da compra
      const dataPrimeiraParcela = new Date(anoIniciNum, mesIniciNum - 1);

      // Verificar cada parcela
      for (let j = 0; j < compra.numParcelas; j++) {
        const dataParcela = new Date(dataPrimeiraParcela.getFullYear(), dataPrimeiraParcela.getMonth() + j);
        const mesParcelaAno = `${dataParcela.getFullYear()}-${String(dataParcela.getMonth() + 1).padStart(2, '0')}`;

        if (mesParcelaAno === mesAno) {
          const valorParcela = compra.valorTotal / compra.numParcelas;
          parcelas.push({
            descricao: compra.descricao,
            valor: valorParcela,
            numeroParcela: j + 1
          });
          totalMes += valorParcela;
        }
      }
    });

    meses.push({ mesAno, mesFormatado: formatarMesAno(mesAno), parcelas, totalMes });
  }

  // Renderizar cards
  let html = '';

  meses.forEach(mes => {
    if (mes.parcelas.length === 0) {
      html += `
        <div class="mes-card">
          <div class="mes-nome">${mes.mesFormatado}</div>
          <div class="mes-sem-parcelas">Sem parcelas neste mês</div>
        </div>
      `;
    } else {
      html += `
        <div class="mes-card">
          <div class="mes-nome">${mes.mesFormatado}</div>
          <div class="mes-parcelas">
      `;

      mes.parcelas.forEach(parcela => {
        html += `
          <div class="parcela-item">
            <span class="parcela-descricao">${parcela.descricao} (${parcela.numeroParcela})</span>
            <span class="parcela-valor">${parcela.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        `;
      });

      html += `
          </div>
          <div class="mes-total">
            <span>Total:</span>
            <span>${mes.totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html || '<p style="text-align: center; color: var(--cor-texto-leve);">Carregando calendário...</p>';
}

function formatarMesAno(mesAno) {
  const [ano, mes] = mesAno.split('-');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[parseInt(mes) - 1]} ${ano}`;
}

function sincronizarComDespesasFixas() {
  // Adicionar parcelas do mês atual como despesas fixas
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  // Verificar se despesas-fixas.js está carregado
  if (typeof obterDados === 'undefined' || typeof salvarDados === 'undefined') {
    console.warn('Funções de despesas fixas não disponíveis. Pulando sincronização.');
    return;
  }

  const compras = obterCompras();
  const dados = JSON.parse(localStorage.getItem('despesas_fixas') || '{"salario":0,"despesas":[]}');

  // Remover despesas antigas de parcelas (identificadas por "Parcela" no nome)
  dados.despesas = dados.despesas.filter(d => !d.nome.includes('Parcela'));

  // Adicionar novas parcelas do mês atual
  compras.forEach(compra => {
    const [anoInicio, mesInicio] = compra.dataInicio.split('-');
    const mesIniciNum = parseInt(mesInicio);
    const anoIniciNum = parseInt(anoInicio);

    const dataPrimeiraParcela = new Date(anoIniciNum, mesIniciNum - 1);

    // Verificar cada parcela
    for (let j = 0; j < compra.numParcelas; j++) {
      const dataParcela = new Date(dataPrimeiraParcela.getFullYear(), dataPrimeiraParcela.getMonth() + j);
      const mesParcelaAno = `${dataParcela.getFullYear()}-${String(dataParcela.getMonth() + 1).padStart(2, '0')}`;

      // Adicionar apenas se for do mês atual
      if (mesParcelaAno === mesAtual) {
        const valorParcela = compra.valorTotal / compra.numParcelas;
        dados.despesas.push({
          id: Date.now() + Math.random(), // ID único
          nome: `Parcela ${j + 1}/${compra.numParcelas} - ${compra.descricao}`,
          categoria: 'outro',
          valor: Math.round(valorParcela * 100) / 100,
          dataCriacao: new Date().toISOString(),
          origem: 'compra_parcelada'
        });
      }
    }
  });

  // Salvar dados atualizados
  localStorage.setItem('despesas_fixas', JSON.stringify(dados));

  // Atualizar visualização se despesas-fixas.js estiver carregado
  if (typeof atualizarVisualizacao === 'function') {
    atualizarVisualizacao();
  }
}

// --- Projeção de caixa dos próximos 12 meses --------------------------------
// Reaproveita calcularSaldoDoMes (saldo-mes.js), o mesmo cálculo do card
// "Saldo do mês" do Painel: receitas − despesas fixas − variáveis − faturas −
// parcelas − dívidas + ajustes, mês a mês, e acumula o saldo ao longo do ano.

function fcfMoeda(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderizarProjecao12Meses() {
  const container = document.getElementById('projecao-container');
  if (!container) return;

  if (typeof calcularSaldoDoMes !== 'function' || typeof competenciaSomarMeses !== 'function') {
    container.innerHTML = '<p style="color: var(--cor-texto-leve);">Projeção indisponível: recarregue a página.</p>';
    return;
  }

  const base = typeof competenciaAtual === 'function'
    ? competenciaAtual()
    : new Date().toISOString().slice(0, 7);

  let acumulado = 0;
  let primeiroNegativo = null;
  const linhas = [];

  for (let i = 0; i < 12; i++) {
    const comp = competenciaSomarMeses(base, i);
    const r = calcularSaldoDoMes(comp);
    acumulado += r.saldo;

    const mesNeg = r.saldo < -0.005;
    const acumNeg = acumulado < -0.005;
    if (primeiroNegativo === null && (mesNeg || acumNeg)) primeiroNegativo = comp;

    linhas.push(`
      <tr${mesNeg || acumNeg ? ' class="fcf-linha-alerta"' : ''}>
        <td>${formatarMesAno(comp)}</td>
        <td class="fcf-num">${fcfMoeda(r.receitas)}</td>
        <td class="fcf-num">− ${fcfMoeda(r.saidas)}</td>
        <td class="fcf-num${mesNeg ? ' fcf-neg' : ''}">${fcfMoeda(r.saldo)}</td>
        <td class="fcf-num${acumNeg ? ' fcf-neg' : ''}"><strong>${fcfMoeda(acumulado)}</strong></td>
      </tr>`);
  }

  const aviso = primeiroNegativo
    ? `<div class="fcf-aviso">Primeiro mês no vermelho: <strong>${formatarMesAno(primeiroNegativo)}</strong>. É até aí que dá para antecipar a decisão.</div>`
    : `<div class="fcf-aviso fcf-aviso-ok">Nenhum mês projetado fica negativo nos próximos 12 meses.</div>`;

  container.innerHTML = `
    ${aviso}
    <div class="fcf-tabela-wrap">
      <table class="fcf-tabela">
        <thead>
          <tr>
            <th>Mês</th>
            <th class="fcf-num">Receitas</th>
            <th class="fcf-num">Saídas</th>
            <th class="fcf-num">Saldo do mês</th>
            <th class="fcf-num">Acumulado</th>
          </tr>
        </thead>
        <tbody>${linhas.join('')}</tbody>
      </table>
    </div>
    <p class="fcf-nota">
      Inclui receitas (contracheque/renda da competência + rendas extras + ajustes), despesas fixas,
      despesas variáveis lançadas, faturas de cartão que vencem no mês, parcelas de compras parceladas
      e parcelas/vencimentos de dívidas — o mesmo cálculo do card "Saldo do mês" do Painel.
    </p>`;
}
