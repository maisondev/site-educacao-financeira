// Gerenciar compras parceladas e fluxo de caixa futuro

const CHAVE_COMPRAS = 'compras_parceladas';

document.addEventListener('DOMContentLoaded', function() {
  renderizarTabela();
  renderizarCalendario();

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

  const compra = {
    id: Date.now(),
    descricao,
    cartao: cartao || 'Não informado',
    valorTotal,
    numParcelas,
    dataInicio,
    dataCriacao: new Date().toISOString()
  };

  const compras = obterCompras();
  compras.push(compra);
  salvarCompras(compras);

  // Sincronizar com envelopes
  sincronizarComEnvelopes();

  // Limpar formulário
  document.getElementById('input-descricao').value = '';
  document.getElementById('input-cartao').value = '';
  document.getElementById('input-valor-total').value = '';
  document.getElementById('input-parcelas').value = '';

  renderizarTabela();
  renderizarCalendario();
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
        <td><button class="btn-remover" onclick="removerCompra(${compra.id})">Remover</button></td>
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
