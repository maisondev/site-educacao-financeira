let cartaoEmEdicaoId = null;

function inicializarCartoes() {
  atualizarVisualizacao();
}

function obterCartoes() {
  const dados = localStorage.getItem('cartoes');
  return dados ? JSON.parse(dados) : [];
}

function salvarCartoes(cartoes) {
  localStorage.setItem('cartoes', JSON.stringify(cartoes));
}

function abrirModalCartao() {
  document.getElementById('modal-titulo').textContent = 'Novo Cartão';
  document.getElementById('input-cartao-id').value = '';
  document.getElementById('input-cartao-nome').value = '';
  document.getElementById('input-cartao-ultimos').value = '';
  document.getElementById('select-cartao-bandeira').value = '';
  document.getElementById('input-cartao-limite').value = '';
  document.getElementById('input-cartao-fechamento').value = '';
  document.getElementById('input-cartao-vencimento').value = '';
  document.getElementById('input-cartao-saldo-aberto').value = '';
  document.getElementById('modal-cartao').removeAttribute('hidden');
  document.getElementById('input-cartao-nome').focus();
}

function abrirModalCartaoEdicao(id) {
  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === id);

  if (!cartao) return;

  cartaoEmEdicaoId = id;

  document.getElementById('modal-titulo').textContent = 'Editar Cartão';
  document.getElementById('input-cartao-id').value = id;
  document.getElementById('input-cartao-nome').value = cartao.nome;
  document.getElementById('input-cartao-ultimos').value = cartao.ultimos;
  document.getElementById('select-cartao-bandeira').value = cartao.bandeira || '';
  document.getElementById('input-cartao-limite').value = cartao.limite ? formatarMoedaBrasileira(cartao.limite) : '';
  document.getElementById('input-cartao-fechamento').value = cartao.fechamento || '';
  document.getElementById('input-cartao-vencimento').value = cartao.vencimento || '';
  document.getElementById('input-cartao-saldo-aberto').value = cartao.saldoAberto ? formatarMoedaBrasileira(cartao.saldoAberto) : '';
  document.getElementById('btn-gerenciar-datas').removeAttribute('hidden');
  document.getElementById('modal-cartao').removeAttribute('hidden');
  document.getElementById('input-cartao-nome').focus();
}

function fecharModalCartao() {
  document.getElementById('modal-cartao').setAttribute('hidden', '');
  cartaoEmEdicaoId = null;
  document.getElementById('btn-gerenciar-datas').setAttribute('hidden', '');
}

// --- Gerenciamento de datas por mês ---

function abrirModalDatasMes() {
  if (!cartaoEmEdicaoId) return;

  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === parseInt(cartaoEmEdicaoId));
  if (!cartao) return;

  document.getElementById('nome-cartao-datas').textContent = cartao.nome;

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  document.getElementById('select-mes-data').value = mesAtual;

  const datas = cartao.datasPorMes || [];
  const dataAtual = datas.find(d => d.mes === mesAtual);

  if (dataAtual) {
    document.getElementById('input-fechamento-mes').value = dataAtual.fechamento || '';
    document.getElementById('input-vencimento-mes').value = dataAtual.vencimento || '';
    document.getElementById('input-saldo-mes').value = dataAtual.saldo ? formatarMoedaBrasileira(dataAtual.saldo) : '';
  } else {
    document.getElementById('input-fechamento-mes').value = '';
    document.getElementById('input-vencimento-mes').value = '';
    document.getElementById('input-saldo-mes').value = '';
  }

  renderizarHistoricoDatas();
  document.getElementById('modal-datas-mes').removeAttribute('hidden');
}

function fecharModalDatasMes() {
  document.getElementById('modal-datas-mes').setAttribute('hidden', '');
}

function renderizarHistoricoDatas() {
  if (!cartaoEmEdicaoId) return;

  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === parseInt(cartaoEmEdicaoId));
  if (!cartao) return;

  const datas = (cartao.datasPorMes || []).sort((a, b) => b.mes.localeCompare(a.mes));
  const container = document.getElementById('historico-datas-mes');

  if (datas.length === 0) {
    container.innerHTML = '<p style="font-size: 13px; color: #999; text-align: center;">Nenhum registro ainda</p>';
    return;
  }

  container.innerHTML = `<h4 style="font-size: 13px; margin: 0 0 8px 0;">Histórico:</h4>` + datas.map(d => {
    const [ano, mes] = d.mes.split('-');
    const nomeMes = new Date(ano, parseInt(mes) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `<div style="padding: 6px; background: #f5f5f5; border-radius: 4px; margin-bottom: 4px; font-size: 12px;">
      <strong>${nomeMes}:</strong> fecha ${d.fechamento} / vence ${d.vencimento}${d.saldo ? ` / gasto ${formatarMoedaBrasileira(d.saldo)}` : ''}
    </div>`;
  }).join('');
}

function salvarDatasMes() {
  if (!cartaoEmEdicaoId) return;

  const mes = document.getElementById('select-mes-data').value;
  const fechamento = document.getElementById('input-fechamento-mes').value;
  const vencimento = document.getElementById('input-vencimento-mes').value;
  let saldo = parseValorBrasileiro(document.getElementById('input-saldo-mes').value);

  if (!mes) {
    alert('Por favor, selecione um mês');
    return;
  }

  if (!fechamento || !vencimento) {
    alert('Por favor, preencha os dias de fechamento e vencimento');
    return;
  }

  saldo = saldo ? Math.round(saldo * 100) / 100 : null;

  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === parseInt(cartaoEmEdicaoId));
  if (!cartao) return;

  if (!cartao.datasPorMes) {
    cartao.datasPorMes = [];
  }

  const index = cartao.datasPorMes.findIndex(d => d.mes === mes);
  const dataObj = { mes, fechamento, vencimento };
  if (saldo) dataObj.saldo = saldo;

  if (index !== -1) {
    cartao.datasPorMes[index] = dataObj;
  } else {
    cartao.datasPorMes.push(dataObj);
  }

  salvarCartoes(cartoes);
  renderizarHistoricoDatas();
  atualizarVisualizacao();
  alert('Datas e saldo salvo com sucesso!');
}

function salvarCartao() {
  const id = document.getElementById('input-cartao-id').value;
  const nome = document.getElementById('input-cartao-nome').value.trim();
  const ultimos = document.getElementById('input-cartao-ultimos').value.trim();
  const bandeira = document.getElementById('select-cartao-bandeira').value;
  const fechamento = document.getElementById('input-cartao-fechamento').value.trim();
  const vencimento = document.getElementById('input-cartao-vencimento').value.trim();
  let limite = parseValorBrasileiro(document.getElementById('input-cartao-limite').value);
  let saldoAberto = parseValorBrasileiro(document.getElementById('input-cartao-saldo-aberto').value);

  if (!nome) {
    alert('Por favor, insira um nome/descrição do cartão');
    return;
  }

  if (!ultimos || ultimos.length !== 4 || isNaN(ultimos)) {
    alert('Por favor, insira os últimos 4 dígitos (apenas números)');
    return;
  }

  if (limite && limite <= 0) {
    alert('Limite deve ser um valor válido ou deixar em branco');
    return;
  }

  if (saldoAberto && saldoAberto < 0) {
    alert('Saldo da fatura não pode ser negativo');
    return;
  }

  limite = limite ? Math.round(limite * 100) / 100 : null;
  saldoAberto = saldoAberto ? Math.round(saldoAberto * 100) / 100 : null;

  const cartoes = obterCartoes();

  if (id) {
    // Edição
    const index = cartoes.findIndex(c => c.id === parseInt(id));
    if (index > -1) {
      cartoes[index] = {
        ...cartoes[index],
        nome,
        ultimos,
        bandeira,
        limite,
        fechamento,
        vencimento,
        saldoAberto
      };
    }
  } else {
    // Novo
    cartoes.push({
      id: Date.now(),
      nome,
      ultimos,
      bandeira,
      limite,
      fechamento,
      vencimento,
      saldoAberto,
      dataCriacao: new Date().toISOString()
    });
  }

  salvarCartoes(cartoes);
  atualizarVisualizacao();
  fecharModalCartao();
}

function removerCartao(id) {
  if (confirm('Tem certeza que deseja remover este cartão?')) {
    const cartoes = obterCartoes();
    const index = cartoes.findIndex(c => c.id === id);
    if (index > -1) {
      cartoes.splice(index, 1);
      salvarCartoes(cartoes);
      atualizarVisualizacao();
    }
  }
}

function atualizarVisualizacao() {
  const cartoes = obterCartoes();
  const container = document.getElementById('lista-cartoes');

  // Calcular resumo de saldos abertos
  const cartoesComSaldo = cartoes.filter(c => c.saldoAberto && c.saldoAberto > 0);
  const totalSaldosAbertos = cartoesComSaldo.reduce((sum, c) => sum + (c.saldoAberto || 0), 0);

  // Mostrar/esconder resumo
  const resumoDiv = document.getElementById('resumo-saldos');
  if (cartoesComSaldo.length > 0) {
    resumoDiv.style.display = 'block';
    document.getElementById('total-saldos-abertos').textContent = formatarMoedaBrasileira(totalSaldosAbertos);
    document.getElementById('quantidade-cartoes-saldo').textContent = cartoesComSaldo.length;
  } else {
    resumoDiv.style.display = 'none';
  }

  if (cartoes.length === 0) {
    container.innerHTML = '<div class="lista-vazia">Nenhum cartão cadastrado</div>';
    return;
  }

  container.innerHTML = cartoes.map(cartao => `
    <div class="card-cartao">
      <div class="card-cartao-botoes">
        <button class="btn-acao-cartao" onclick="exportarCartaoParaCalendario(${cartao.id})" title="Exportar para calendário">📅</button>
        <button class="btn-acao-cartao" onclick="abrirModalCartaoEdicao(${cartao.id})" title="Editar cartão">✎</button>
        <button class="btn-acao-cartao" onclick="removerCartao(${cartao.id})" title="Remover cartão">×</button>
      </div>

      <div class="card-cartao-header">
        <h3 class="card-cartao-titulo">${cartao.nome}</h3>
        ${cartao.bandeira ? `<span class="card-cartao-bandeira">${obterNomeBandeira(cartao.bandeira)}</span>` : ''}
      </div>

      <div class="card-cartao-numero">●●●● ${cartao.ultimos}</div>

      <div class="card-cartao-info">
        <div class="card-cartao-info-item">
          <span class="card-cartao-label">Limite</span>
          <span>${cartao.limite ? formatarMoedaBrasileira(cartao.limite) : '—'}</span>
        </div>
        <div class="card-cartao-info-item">
          <span class="card-cartao-label">Ciclo</span>
          <span>${gerarTextoCiclo(cartao)}</span>
        </div>
      </div>

      ${cartao.saldoAberto ? `
      <div style="margin-top: var(--espacamento-sm); padding-top: var(--espacamento-sm); border-top: 1px solid rgba(255,255,255,0.2);">
        <div style="font-size: 10px; opacity: 0.7; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">Fatura Aberta</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px;">
          <span>${formatarMoedaBrasileira(cartao.saldoAberto)}</span>
          ${cartao.limite ? `<span>${Math.round((cartao.saldoAberto / cartao.limite) * 100)}%</span>` : ''}
        </div>
        ${cartao.limite ? `
        <div style="background: rgba(255,255,255,0.25); border-radius: 3px; height: 5px; overflow: hidden;">
          <div style="background: rgba(255,255,255,0.95); height: 100%; width: ${Math.min((cartao.saldoAberto / cartao.limite) * 100, 100)}%;"></div>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
  `).join('');
}

function obterNomeBandeira(bandeira) {
  const nomes = {
    'visa': 'Visa',
    'mastercard': 'Mastercard',
    'elo': 'Elo',
    'amex': 'Amex',
    'hipercard': 'Hipercard',
    'outro': 'Outro'
  };
  return nomes[bandeira] || bandeira;
}

function gerarTextoCiclo(cartao) {
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  // Tentar encontrar datas específicas para este mês
  const datas = cartao.datasPorMes || [];
  const dataAtual = datas.find(d => d.mes === mesAtual);

  let fechamento, vencimento;

  if (dataAtual) {
    fechamento = dataAtual.fechamento;
    vencimento = dataAtual.vencimento;
  } else {
    fechamento = cartao.fechamento;
    vencimento = cartao.vencimento;
  }

  if (fechamento && vencimento) {
    return `fecha ${fechamento} / paga ${vencimento}`;
  }
  if (fechamento) {
    return `fecha ${fechamento}`;
  }
  if (vencimento) {
    return `paga ${vencimento}`;
  }
  return '—';
}

function exportarCartaoParaCalendario(cartaoId) {
  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === cartaoId);

  if (!cartao) {
    alert('Cartão não encontrado');
    return;
  }

  if (!cartao.fechamento || !cartao.vencimento) {
    alert('Por favor, preencha os dias de fechamento e vencimento do cartão antes de exportar');
    return;
  }

  const ano = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, '0');

  // Datas para os eventos
  const dataFechamento = `${ano}${mes}${String(cartao.fechamento).padStart(2, '0')}`;
  const dataVencimento = `${ano}${mes}${String(cartao.vencimento).padStart(2, '0')}`;

  // Timestamp atual em formato iCalendar
  const agora = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Gera IDs únicos para os eventos
  const idFechamento = `fechamento-${cartaoId}@educacao-financeira`;
  const idVencimento = `vencimento-${cartaoId}@educacao-financeira`;

  // Estrutura do arquivo iCalendar
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Educação Financeira//NONSGML v1.0//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Cartão - ${cartao.nome}
X-WR-TIMEZONE:America/Sao_Paulo
X-WR-CALDESC:Lembretes de fechamento e vencimento do cartão ${cartao.nome}
BEGIN:VEVENT
UID:${idFechamento}
DTSTAMP:${agora}
DTSTART:${dataFechamento}T120000Z
DTEND:${dataFechamento}T130000Z
RRULE:FREQ=MONTHLY;BYMONTHDAY=${cartao.fechamento}
SUMMARY:Fechamento - ${cartao.nome}
DESCRIPTION:Dia de fechamento do cartão ${cartao.nome}. Até este dia você pode adicionar despesas à próxima fatura.
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
UID:${idVencimento}
DTSTAMP:${agora}
DTSTART:${dataVencimento}T180000Z
DTEND:${dataVencimento}T190000Z
RRULE:FREQ=MONTHLY;BYMONTHDAY=${cartao.vencimento}
SUMMARY:Vencimento - ${cartao.nome}
DESCRIPTION:Dia de vencimento da fatura do cartão ${cartao.nome}. Faça o pagamento até este dia.
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  // Cria e faz download do arquivo
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `cartao-${cartao.nome.toLowerCase().replace(/\s+/g, '-')}.ics`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert(`Arquivo de calendário gerado! 📅\n\nImporte "${cartao.nome}.ics" no seu:\n• Google Calendar\n• Outlook\n• Apple Calendar\n\nA Alexa lerá seus lembretes!`);
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
  const modal = document.getElementById('modal-cartao');
  if (event.target === modal) {
    fecharModalCartao();
  }
});
