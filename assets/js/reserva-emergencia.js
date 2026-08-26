function inicializarReserva() {
  const dados = obterDados();
  const rendaCentralizada = obterRendaMensal();

  // Preferir renda centralizada (de Envelopes) como padrão
  if (rendaCentralizada) {
    document.getElementById('input-salario').value = rendaCentralizada;
    adicionarBotaoUsarRendaDefinida(rendaCentralizada);
  } else if (dados.salario && dados.salario > 0) {
    // Usar renda anterior apenas se não houver renda centralizada
    document.getElementById('input-salario').value = dados.salario;
  }

  // Mostrar resumo apenas se tiver configuração válida salva
  if (dados.salario && dados.salario > 0 && dados.meses && dados.meses > 0) {
    document.getElementById('resumo-container').removeAttribute('hidden');
    atualizarVisualizacao();
  }
}

function obterDados() {
  const dados = localStorage.getItem('reserva_emergencia');
  return dados ? JSON.parse(dados) : { salario: 0, meses: 0, aportes: [] };
}

function salvarDados(dados) {
  localStorage.setItem('reserva_emergencia', JSON.stringify(dados));
}

function atualizarConfiguracao() {
  let salario = parseValorBrasileiro(document.getElementById('input-salario').value);
  const meses = parseInt(document.getElementById('select-meses').value);

  if (!salario || isNaN(salario) || salario <= 0) {
    alert('Por favor, insira um salário válido (maior que 0)');
    return;
  }

  if (!meses || meses <= 0) {
    alert('Por favor, selecione uma quantidade de meses');
    return;
  }

  // Arredondar salário para 2 casas decimais
  salario = Math.round(salario * 100) / 100;

  // Atualizar renda centralizada também
  if (typeof atualizarRendaMensal === 'function') {
    atualizarRendaMensal(salario);
  }

  const dados = obterDados();
  dados.salario = salario;
  dados.meses = meses;

  salvarDados(dados);

  document.getElementById('resumo-container').removeAttribute('hidden');
  atualizarVisualizacao();
}

function atualizarVisualizacao() {
  const dados = obterDados();
  const meta = dados.salario * dados.meses;
  const totalAportes = dados.aportes.reduce((sum, a) => sum + a.valor, 0);
  const faltante = Math.max(0, meta - totalAportes);

  // Atualizar cards de informação
  document.getElementById('valor-meta').textContent = formatarMoeda(meta);
  document.getElementById('valor-atual').textContent = formatarMoeda(totalAportes);
  document.getElementById('valor-faltante').textContent = formatarMoeda(faltante);

  // Atualizar card de faltante
  const cardFaltante = document.getElementById('card-faltante');
  if (totalAportes >= meta) {
    cardFaltante.classList.add('sucesso');
    cardFaltante.classList.remove('alerta');
  } else if (totalAportes > 0) {
    cardFaltante.classList.add('alerta');
    cardFaltante.classList.remove('sucesso');
  }

  // Atualizar barra de progresso
  const percentual = meta > 0 ? (totalAportes / meta) * 100 : 0;
  const barraPorcentagem = Math.min(percentual, 100);

  document.getElementById('percentual-progresso').textContent = Math.round(percentual) + '%';

  const barra = document.getElementById('barra-fill');
  barra.style.width = barraPorcentagem + '%';

  if (percentual < 100) {
    barra.classList.remove('sucesso');
    if (percentual > 80) {
      barra.classList.add('alerta');
    } else {
      barra.classList.remove('alerta');
    }
  } else {
    barra.classList.add('sucesso');
    barra.classList.remove('alerta');
  }

  // Texto na barra
  if (barraPorcentagem > 10) {
    document.getElementById('texto-barra').textContent = Math.round(percentual) + '%';
  } else {
    document.getElementById('texto-barra').textContent = '';
  }

  // Calcular meses faltantes
  if (totalAportes < meta && dados.aportes.length > 0) {
    const mediaAporte = totalAportes / dados.aportes.length;
    if (mediaAporte > 0) {
      const mesesFaltantes = Math.ceil(faltante / mediaAporte);
      document.getElementById('meses-faltantes').textContent = mesesFaltantes + ' meses';

      // Calcular data estimada
      const dataEstimada = new Date();
      dataEstimada.setMonth(dataEstimada.getMonth() + mesesFaltantes);
      document.getElementById('data-estimada').textContent = dataEstimada.toLocaleDateString('pt-BR');
    }
  } else if (totalAportes >= meta) {
    document.getElementById('meses-faltantes').textContent = 'Concluído!';
    document.getElementById('data-estimada').textContent = 'Meta atingida';
  }

  // Exibir alerta se faltam aportes
  const alertaContainer = document.getElementById('alerta-container');
  alertaContainer.innerHTML = '';

  if (dados.aportes.length === 0 && dados.salario > 0) {
    alertaContainer.innerHTML = `
      <div class="alerta">
        <p>Você ainda não registrou nenhum aporte. Comece agora!</p>
      </div>
    `;
  }

  // Atualizar lista de aportes
  atualizarListaAportes();
}

function atualizarListaAportes() {
  const dados = obterDados();
  const lista = document.getElementById('lista-aportes');

  if (dados.aportes.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nenhum aporte registrado. Comece adicionando seu primeiro depósito!</p></div>`;
    return;
  }

  // Ordenar aportes por data (mais recentes primeiro)
  const aportesSorted = [...dados.aportes].sort((a, b) => new Date(b.data) - new Date(a.data));

  lista.innerHTML = aportesSorted.map((aporte, index) => `
    <div class="aporte-item">
      <div class="aporte-info">
        <h4>${aporte.descricao || 'Aporte'}</h4>
        <p class="aporte-data">${new Date(aporte.data).toLocaleDateString('pt-BR')}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <span class="aporte-valor">${formatarMoeda(aporte.valor)}</span>
        <button class="btn-remover" onclick="removerAporte(${index})" title="Remover aporte">×</button>
      </div>
    </div>
  `).join('');
}

function abrirModalAporte() {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('input-aporte-data').value = hoje;
  document.getElementById('input-aporte-valor').value = '';
  document.getElementById('input-aporte-descricao').value = '';
  document.getElementById('modal-aporte').removeAttribute('hidden');
}

function fecharModalAporte() {
  document.getElementById('modal-aporte').setAttribute('hidden', '');
}

function salvarAporte() {
  const valor = parseFloat(document.getElementById('input-aporte-valor').value);
  const data = document.getElementById('input-aporte-data').value;
  const descricao = document.getElementById('input-aporte-descricao').value;

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  if (!data) {
    alert('Por favor, selecione uma data');
    return;
  }

  const dados = obterDados();
  dados.aportes.push({
    valor,
    data,
    descricao,
    id: Date.now()
  });

  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalAporte();
}

function removerAporte(index) {
  if (confirm('Tem certeza que deseja remover este aporte?')) {
    const dados = obterDados();
    dados.aportes.splice(index, 1);
    salvarDados(dados);
    atualizarVisualizacao();
  }
}

function limparDados() {
  if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
    localStorage.removeItem('reserva_emergencia');
    document.getElementById('input-salario').value = '';
    document.getElementById('select-meses').value = '';
    document.getElementById('resumo-container').setAttribute('hidden', '');
    document.getElementById('lista-aportes').innerHTML = `<div class="lista-vazia"><p>Nenhum aporte registrado.</p></div>`;
  }
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

function adicionarBotaoUsarRendaDefinida(renda) {
  const inputSalario = document.getElementById('input-salario');
  if (!inputSalario) return;

  // Verificar se o botão já existe
  if (document.getElementById('btn-usar-renda')) return;

  const pai = inputSalario.parentElement;
  const botaoUsar = document.createElement('button');
  botaoUsar.id = 'btn-usar-renda';
  botaoUsar.type = 'button';
  botaoUsar.textContent = `Usar renda definida: ${formatarMoeda(renda)}`;
  botaoUsar.style.cssText = `
    margin-top: 8px;
    padding: 8px 12px;
    background-color: var(--cor-primaria);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
  `;

  botaoUsar.addEventListener('click', () => {
    document.getElementById('input-salario').value = renda;
  });

  pai.insertBefore(botaoUsar, inputSalario.nextSibling);
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
  const modal = document.getElementById('modal-aporte');
  if (event.target === modal) {
    fecharModalAporte();
  }
});

// Inicializar ao carregar a página
window.addEventListener('load', inicializarReserva);
