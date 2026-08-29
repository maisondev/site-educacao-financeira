function inicializarReserva() {
  const dados = obterDados();
  const rendaCentralizada = obterRendaMensal();

  // Preferir renda centralizada (de Envelopes) como padrão
  if (rendaCentralizada) {
    document.getElementById('input-salario').value = formatarNumeroBrasileiro(rendaCentralizada);
  } else if (dados.salario && dados.salario > 0) {
    // Usar renda anterior apenas se não houver renda centralizada
    document.getElementById('input-salario').value = formatarNumeroBrasileiro(dados.salario);
  }

  // Mostrar resumo apenas se tiver configuração válida salva
  if (dados.salario && dados.salario > 0 && dados.meses && dados.meses > 0) {
    document.getElementById('resumo-container').removeAttribute('hidden');
    atualizarVisualizacao();
  }
}

// Guarda o id do aporte em edição (null quando é um novo aporte)
let aporteEditandoId = null;

function obterDados() {
  const parsed = Store.ler(Store.CHAVES.RESERVA, { salario: 0, meses: 0, aportes: [] })
    || { salario: 0, meses: 0, aportes: [] };
  if (!Array.isArray(parsed.aportes)) parsed.aportes = [];

  // Garantir que todo aporte tenha um id (aportes antigos podem não ter)
  let precisaSalvar = false;
  parsed.aportes.forEach((a, i) => {
    if (a.id === undefined || a.id === null) {
      a.id = Date.now() + i;
      precisaSalvar = true;
    }
  });
  if (precisaSalvar) {
    Store.gravar(Store.CHAVES.RESERVA, parsed);
  }

  return parsed;
}

function salvarDados(dados) {
  Store.gravar(Store.CHAVES.RESERVA, dados);
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
    const distrib = document.getElementById('distribuicao-local');
    if (distrib) distrib.setAttribute('hidden', '');
    return;
  }

  // Ordenar aportes por data (mais recentes primeiro)
  const aportesSorted = [...dados.aportes].sort((a, b) => new Date(b.data) - new Date(a.data));

  lista.innerHTML = aportesSorted.map((aporte) => `
    <div class="aporte-item">
      <div class="aporte-info">
        <h4>${aporte.descricao || 'Aporte'}</h4>
        <p class="aporte-data">${new Date(aporte.data).toLocaleDateString('pt-BR')}</p>
        ${aporte.onde ? `<span class="aporte-onde">${aporte.onde}</span>` : ''}
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="aporte-valor">${formatarMoeda(aporte.valor)}</span>
        <button class="btn-editar" onclick="editarAporte(${aporte.id})" title="Editar aporte">Editar</button>
        <button class="btn-remover" onclick="removerAporte(${aporte.id})" title="Remover aporte">×</button>
      </div>
    </div>
  `).join('');

  atualizarDistribuicaoPorLocal();
}

function atualizarDistribuicaoPorLocal() {
  const dados = obterDados();
  const container = document.getElementById('distribuicao-local');
  const lista = document.getElementById('lista-distribuicao');
  if (!container || !lista) return;

  const porLocal = {};
  dados.aportes.forEach(a => {
    const nome = (a.onde && a.onde.trim()) || 'Não informado';
    porLocal[nome] = (porLocal[nome] || 0) + a.valor;
  });

  const nomes = Object.keys(porLocal);
  const total = nomes.reduce((sum, n) => sum + porLocal[n], 0);

  // Só mostrar quando houver pelo menos um local informado
  const temLocalInformado = nomes.some(n => n !== 'Não informado');
  if (!temLocalInformado || total <= 0) {
    container.setAttribute('hidden', '');
    return;
  }

  container.removeAttribute('hidden');
  lista.innerHTML = nomes
    .sort((a, b) => porLocal[b] - porLocal[a])
    .map(nome => {
      const valor = porLocal[nome];
      const pct = Math.round((valor / total) * 100);
      return `
        <div class="distribuicao-linha">
          <span class="distribuicao-local-nome">${nome}</span>
          <span>
            <span class="distribuicao-local-valor">${formatarMoeda(valor)}</span>
            <span class="distribuicao-local-pct">${pct}%</span>
          </span>
        </div>
      `;
    }).join('');
}

function abrirModalAporte() {
  aporteEditandoId = null;
  document.getElementById('modal-aporte-titulo').textContent = 'Adicionar Aporte';
  document.getElementById('btn-salvar-aporte').textContent = 'Adicionar';

  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('input-aporte-data').value = hoje;
  document.getElementById('input-aporte-valor').value = '';
  document.getElementById('input-aporte-onde').value = '';
  document.getElementById('input-aporte-descricao').value = '';
  document.getElementById('modal-aporte').removeAttribute('hidden');
}

function editarAporte(id) {
  const dados = obterDados();
  const aporte = dados.aportes.find(a => a.id === id);
  if (!aporte) return;

  aporteEditandoId = id;
  document.getElementById('modal-aporte-titulo').textContent = 'Editar Aporte';
  document.getElementById('btn-salvar-aporte').textContent = 'Salvar';

  document.getElementById('input-aporte-data').value = aporte.data;
  document.getElementById('input-aporte-valor').value =
    typeof formatarNumeroBrasileiro === 'function'
      ? formatarNumeroBrasileiro(aporte.valor)
      : aporte.valor;
  document.getElementById('input-aporte-onde').value = aporte.onde || '';
  document.getElementById('input-aporte-descricao').value = aporte.descricao || '';
  document.getElementById('modal-aporte').removeAttribute('hidden');
}

function fecharModalAporte() {
  aporteEditandoId = null;
  document.getElementById('modal-aporte').setAttribute('hidden', '');
}

function salvarAporte() {
  const valorBruto = document.getElementById('input-aporte-valor').value;
  const valor = typeof parseValorBrasileiro === 'function'
    ? parseValorBrasileiro(valorBruto)
    : parseFloat(valorBruto);
  const data = document.getElementById('input-aporte-data').value;
  const onde = document.getElementById('input-aporte-onde').value.trim();
  const descricao = document.getElementById('input-aporte-descricao').value;

  if (!valor || isNaN(valor) || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  if (!data) {
    alert('Por favor, selecione uma data');
    return;
  }

  const valorArredondado = Math.round(valor * 100) / 100;
  const dados = obterDados();

  if (aporteEditandoId !== null) {
    const aporte = dados.aportes.find(a => a.id === aporteEditandoId);
    if (aporte) {
      aporte.valor = valorArredondado;
      aporte.data = data;
      aporte.onde = onde;
      aporte.descricao = descricao;
    }
  } else {
    dados.aportes.push({
      valor: valorArredondado,
      data,
      onde,
      descricao,
      id: Date.now()
    });
  }

  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalAporte();
}

function removerAporte(id) {
  if (confirm('Tem certeza que deseja remover este aporte?')) {
    const dados = obterDados();
    dados.aportes = dados.aportes.filter(a => a.id !== id);
    salvarDados(dados);
    atualizarVisualizacao();
  }
}

function limparDados() {
  if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
    Store.remover(Store.CHAVES.RESERVA);
    document.getElementById('input-salario').value = '';
    document.getElementById('select-meses').value = '';
    document.getElementById('resumo-container').setAttribute('hidden', '');
    document.getElementById('lista-aportes').innerHTML = `<div class="lista-vazia"><p>Nenhum aporte registrado.</p></div>`;
    document.getElementById('distribuicao-local').setAttribute('hidden', '');
  }
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
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
