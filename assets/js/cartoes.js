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
  document.getElementById('modal-cartao').removeAttribute('hidden');
  document.getElementById('input-cartao-nome').focus();
}

function abrirModalCartaoEdicao(id) {
  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === id);

  if (!cartao) return;

  document.getElementById('modal-titulo').textContent = 'Editar Cartão';
  document.getElementById('input-cartao-id').value = id;
  document.getElementById('input-cartao-nome').value = cartao.nome;
  document.getElementById('input-cartao-ultimos').value = cartao.ultimos;
  document.getElementById('select-cartao-bandeira').value = cartao.bandeira || '';
  document.getElementById('input-cartao-limite').value = cartao.limite ? formatarMoedaBrasileira(cartao.limite) : '';
  document.getElementById('input-cartao-fechamento').value = cartao.fechamento || '';
  document.getElementById('input-cartao-vencimento').value = cartao.vencimento || '';
  document.getElementById('modal-cartao').removeAttribute('hidden');
  document.getElementById('input-cartao-nome').focus();
}

function fecharModalCartao() {
  document.getElementById('modal-cartao').setAttribute('hidden', '');
}

function salvarCartao() {
  const id = document.getElementById('input-cartao-id').value;
  const nome = document.getElementById('input-cartao-nome').value.trim();
  const ultimos = document.getElementById('input-cartao-ultimos').value.trim();
  const bandeira = document.getElementById('select-cartao-bandeira').value;
  const fechamento = document.getElementById('input-cartao-fechamento').value.trim();
  const vencimento = document.getElementById('input-cartao-vencimento').value.trim();
  let limite = parseValorBrasileiro(document.getElementById('input-cartao-limite').value);

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

  limite = limite ? Math.round(limite * 100) / 100 : null;

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
        vencimento
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
          <span>${gerarTextoCiclo(cartao.fechamento, cartao.vencimento)}</span>
        </div>
      </div>
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

function gerarTextoCiclo(fechamento, vencimento) {
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
