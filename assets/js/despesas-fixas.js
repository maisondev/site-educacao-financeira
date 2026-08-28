let despesaEmEdicaoId = null;

// Escapa texto do usuário antes de injetar via innerHTML
function escaparTexto(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function inicializarDespesasFixas() {
  const dados = obterDados();
  const rendaCentralizada = obterRendaMensal();

  // Pré-preencher com renda centralizada
  if (rendaCentralizada) {
    document.getElementById('input-salario').value = formatarNumeroBrasileiro(rendaCentralizada);
    exibirSalario();
  } else if (dados.salario && dados.salario > 0) {
    document.getElementById('input-salario').value = formatarNumeroBrasileiro(dados.salario);
    exibirSalario();
  }

  if (dados.salario && dados.salario > 0) {
    document.getElementById('resumo-container').removeAttribute('hidden');
    atualizarVisualizacao();
  }
}

function gerarId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function obterDados() {
  let dados;
  try {
    const bruto = localStorage.getItem('despesas_fixas');
    dados = bruto ? JSON.parse(bruto) : null;
  } catch (erro) {
    console.error('Erro ao carregar despesas fixas (dados ignorados):', erro);
    dados = null;
  }

  if (!dados || typeof dados !== 'object') {
    dados = { salario: 0, despesas: [] };
  }
  if (!Array.isArray(dados.despesas)) {
    dados.despesas = [];
  }

  // Normaliza ids para string (compatibilidade com dados antigos que usavam Date.now())
  dados.despesas.forEach(d => {
    d.id = d.id != null ? String(d.id) : gerarId();
  });

  return dados;
}

// Dias até o próximo vencimento (considera virada de mês)
function diasAteVencimento(dia) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  let alvo = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
  if (alvo < hoje) {
    alvo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
  }
  return Math.round((alvo - hoje) / 86400000);
}

// Data de hoje no formato YYYY-MM-DD (horário local)
function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Formata YYYY-MM-DD para dd/mm/aaaa
function formatarDataBR(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function salvarDados(dados) {
  localStorage.setItem('despesas_fixas', JSON.stringify(dados));
}

function definirSalario() {
  let salario = parseValorBrasileiro(document.getElementById('input-salario').value);

  if (!salario || isNaN(salario) || salario <= 0) {
    alert('Por favor, insira um salário válido (maior que 0)');
    return;
  }

  // Arredondar para 2 casas decimais
  salario = Math.round(salario * 100) / 100;

  // Atualizar renda centralizada também
  if (typeof atualizarRendaMensal === 'function') {
    atualizarRendaMensal(salario);
  }

  const dados = obterDados();
  dados.salario = salario;
  salvarDados(dados);

  exibirSalario();
  document.getElementById('resumo-container').removeAttribute('hidden');
  atualizarVisualizacao();
}

function exibirSalario() {
  const dados = obterDados();
  const salarioInfo = document.getElementById('salario-info');
  const valorSalario = document.getElementById('valor-salario');
  const competenciaEl = document.getElementById('competencia-salario');

  if (dados.salario > 0) {
    valorSalario.textContent = formatarMoedaBrasileira(dados.salario);
    salarioInfo.removeAttribute('hidden');

    const competencia = typeof obterRendaMensalCompetencia === 'function' ? obterRendaMensalCompetencia() : null;
    if (competencia) {
      competenciaEl.textContent = `Referente ao contracheque de ${competencia}`;
      competenciaEl.removeAttribute('hidden');
    } else {
      competenciaEl.setAttribute('hidden', '');
    }
  }
}

function abrirModalDespesa() {
  despesaEmEdicaoId = null;
  document.getElementById('modal-despesa-titulo').textContent = 'Adicionar Despesa Fixa';
  document.getElementById('btn-salvar-despesa').textContent = 'Adicionar';
  document.getElementById('input-nome').value = '';
  document.getElementById('select-categoria').value = '';
  document.getElementById('input-valor').value = '';
  document.getElementById('input-vencimento-dia').value = '';
  document.getElementById('modal-despesa').removeAttribute('hidden');
  document.getElementById('input-nome').focus();
}

function abrirModalDespesaEdicao(id) {
  const dados = obterDados();
  const despesa = dados.despesas.find(d => d.id === id);
  if (!despesa) return;

  despesaEmEdicaoId = id;
  document.getElementById('modal-despesa-titulo').textContent = 'Editar Despesa Fixa';
  document.getElementById('btn-salvar-despesa').textContent = 'Salvar';
  document.getElementById('input-nome').value = despesa.nome;
  document.getElementById('select-categoria').value = despesa.categoria;
  document.getElementById('input-valor').value = formatarNumeroBrasileiro(despesa.valor);
  document.getElementById('input-vencimento-dia').value = despesa.vencimentoDia || '';
  document.getElementById('modal-despesa').removeAttribute('hidden');
  document.getElementById('input-nome').focus();
}

function fecharModalDespesa() {
  document.getElementById('modal-despesa').setAttribute('hidden', '');
  despesaEmEdicaoId = null;
}

function salvarDespesa() {
  const nome = document.getElementById('input-nome').value.trim();
  const categoria = document.getElementById('select-categoria').value;
  let valor = parseValorBrasileiro(document.getElementById('input-valor').value);
  const vencimentoDia = parseInt(document.getElementById('input-vencimento-dia').value, 10);

  if (!nome) {
    alert('Por favor, insira um nome para a despesa');
    return;
  }

  if (!categoria) {
    alert('Por favor, selecione uma categoria');
    return;
  }

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido (maior que 0)');
    return;
  }

  if (!vencimentoDia || vencimentoDia < 1 || vencimentoDia > 31) {
    alert('Por favor, insira o dia de vencimento (entre 1 e 31)');
    return;
  }

  valor = Math.round(valor * 100) / 100;

  const dados = obterDados();

  if (despesaEmEdicaoId !== null) {
    const despesa = dados.despesas.find(d => d.id === despesaEmEdicaoId);
    if (despesa) {
      despesa.nome = nome;
      despesa.categoria = categoria;
      despesa.valor = valor;
      despesa.vencimentoDia = vencimentoDia;
    }
  } else {
    dados.despesas.push({
      id: gerarId(),
      nome,
      categoria,
      valor,
      vencimentoDia,
      dataCriacao: new Date().toISOString()
    });
  }

  salvarDados(dados);
  atualizarVisualizacao();
  fecharModalDespesa();
}

function atualizarVisualizacao() {
  const dados = obterDados();

  if (!dados.salario || dados.salario <= 0) {
    document.getElementById('resumo-container').setAttribute('hidden', '');
    return;
  }

  // Despesas ocultas ficam de fora do cálculo (para simular o impacto delas no total)
  const despesasNoCalculo = dados.despesas.filter(d => !d.oculta);
  const despesasOcultas = dados.despesas.filter(d => d.oculta);

  const totalDespesas = despesasNoCalculo.reduce((sum, d) => sum + d.valor, 0);
  const totalOcultas = despesasOcultas.reduce((sum, d) => sum + d.valor, 0);
  const disponivel = dados.salario - totalDespesas;
  const percentual = dados.salario > 0 ? (totalDespesas / dados.salario) * 100 : 0;
  const percentualComOcultas = dados.salario > 0
    ? ((totalDespesas + totalOcultas) / dados.salario) * 100
    : 0;

  // Atualizar cards
  document.getElementById('valor-total-despesas').textContent = formatarMoedaBrasileira(totalDespesas);
  document.getElementById('valor-disponivel').textContent = formatarMoedaBrasileira(disponivel);
  document.getElementById('percentual-despesas').textContent = percentual.toFixed(1) + '%';

  // Atualizar cor do card de percentual
  const cardPercentual = document.getElementById('card-percentual');
  if (percentual > 50) {
    cardPercentual.classList.add('alerta');
    cardPercentual.classList.remove('sucesso');
  } else {
    cardPercentual.classList.add('sucesso');
    cardPercentual.classList.remove('alerta');
  }

  // Atualizar barra de progresso
  const barraPorcentagem = Math.min(percentual, 100);
  const barra = document.getElementById('barra-fill');
  barra.style.width = barraPorcentagem + '%';

  if (percentual > 100) {
    barra.classList.add('erro');
    barra.classList.remove('alerta');
  } else if (percentual > 50) {
    barra.classList.add('alerta');
    barra.classList.remove('erro');
  } else {
    barra.classList.remove('alerta', 'erro');
  }

  // Texto na barra
  if (barraPorcentagem > 10) {
    document.getElementById('texto-barra').textContent = percentual.toFixed(1) + '%';
  } else {
    document.getElementById('texto-barra').textContent = '';
  }

  document.getElementById('progresso-percentual').textContent = percentual.toFixed(1) + '%';

  // Status
  const statusElement = document.getElementById('status-percentual');
  if (percentual > 100) {
    statusElement.textContent = 'CRÍTICO - Despesas maiores que salário!';
  } else if (percentual > 50) {
    statusElement.textContent = 'ALERTA - Acima do ideal (50%)';
  } else {
    statusElement.textContent = 'Dentro do esperado';
  }

  // Alerta
  const alertaContainer = document.getElementById('alerta-container');
  alertaContainer.innerHTML = '';

  if (percentual > 50) {
    const mensagem = percentual > 100
      ? 'Suas despesas fixas EXCEDEM seu salário! Você está perdendo dinheiro todo mês.'
      : 'Suas despesas fixas ultrapassam 50% do salário. Considere reduzi-las.';

    alertaContainer.innerHTML = `
      <div class="alerta-percentual">
        <p><strong>${percentual.toFixed(1)}%</strong> do seu salário está comprometido com despesas fixas</p>
        <p>${mensagem}</p>
      </div>
    `;
  }

  // Info sobre despesas fora do cálculo
  const infoOcultas = document.getElementById('info-ocultas');
  if (despesasOcultas.length > 0) {
    const plural = despesasOcultas.length > 1 ? 's' : '';
    const diferenca = percentualComOcultas - percentual;
    infoOcultas.innerHTML = `
      ${despesasOcultas.length} despesa${plural} fora do cálculo (${formatarMoedaBrasileira(totalOcultas)}).
      Com ela${plural}, o comprometimento seria <strong>${percentualComOcultas.toFixed(1)}%</strong>
      (+${diferenca.toFixed(1)} p.p.).
    `;
    infoOcultas.removeAttribute('hidden');
  } else {
    infoOcultas.setAttribute('hidden', '');
  }

  atualizarResumoCategorias(despesasNoCalculo, totalDespesas);
  atualizarListaDespesas();
}

function marcarPagoDespesa(id) {
  const dados = obterDados();
  const despesa = dados.despesas.find(d => d.id === id);
  if (!despesa) return;

  if (despesa.pagoEm) {
    despesa.pagoEm = null;
  } else {
    const padrao = hojeISO();
    const entrada = prompt('Data do pagamento (dd/mm/aaaa):', formatarDataBR(padrao));
    if (entrada === null) return;

    const texto = entrada.trim();
    let iso = padrao;
    if (texto) {
      const m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!m) {
        alert('Data inválida. Use o formato dd/mm/aaaa.');
        return;
      }
      iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    despesa.pagoEm = iso;
  }

  salvarDados(dados);
  atualizarVisualizacao();
}

function toggleOcultarDespesa(id) {
  const dados = obterDados();
  const despesa = dados.despesas.find(d => d.id === id);
  if (!despesa) return;
  despesa.oculta = !despesa.oculta;
  salvarDados(dados);
  atualizarVisualizacao();
}

function atualizarListaDespesas() {
  const dados = obterDados();
  const lista = document.getElementById('lista-despesas');

  if (dados.despesas.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nenhuma despesa registrada.</p></div>`;
    return;
  }

  // Ordenar por valor (maior primeiro)
  const despesasOrdenadas = [...dados.despesas].sort((a, b) => b.valor - a.valor);

  lista.innerHTML = despesasOrdenadas.map((despesa) => {
    const percentualDespesa = dados.salario > 0 ? (despesa.valor / dados.salario) * 100 : 0;
    const oculta = !!despesa.oculta;
    const acaoOcultar = oculta ? 'Incluir no cálculo' : 'Tirar do cálculo';

    let vencimentoHtml = '';
    if (despesa.vencimentoDia) {
      const dias = diasAteVencimento(despesa.vencimentoDia);
      let sufixo = '';
      if (dias === 0) sufixo = ' · hoje';
      else if (dias === 1) sufixo = ' · amanhã';
      else if (dias <= 5) sufixo = ` · em ${dias} dias`;
      const urgente = dias <= 5;
      vencimentoHtml = `<p class="despesa-vencimento${urgente ? ' urgente' : ''}">${icone('calendario')} Vence dia ${despesa.vencimentoDia}${sufixo}</p>`;
    }

    const pago = !!despesa.pagoEm;
    const pagoHtml = pago
      ? `<p class="despesa-pago">${icone('check')} Pago em ${formatarDataBR(despesa.pagoEm)}</p>`
      : '';
    const acaoPagar = pago ? 'Desmarcar pagamento' : 'Marcar como pago';

    return `
      <div class="despesa-item${oculta ? ' oculta' : ''}${pago ? ' pago' : ''}">
        <div class="despesa-info">
          <h3>${escaparTexto(despesa.nome)}${oculta ? ' <span class="despesa-badge-oculta">fora do cálculo</span>' : ''}</h3>
          <p class="despesa-categoria">${obterNomeCategoria(despesa.categoria)}</p>
          ${vencimentoHtml}
          ${pagoHtml}
        </div>
        <div class="despesa-valor">
          <div class="despesa-valor-principal">${formatarMoedaBrasileira(despesa.valor)}</div>
          <div class="despesa-percentual">${percentualDespesa.toFixed(1)}% do salário</div>
        </div>
        <div class="despesa-acoes">
          <button class="btn-pagar${pago ? ' ativo' : ''}" onclick="marcarPagoDespesa('${despesa.id}')" title="${acaoPagar}" aria-label="${acaoPagar}">${icone('check')}</button>
          <button class="btn-ocultar${oculta ? ' ativo' : ''}" onclick="toggleOcultarDespesa('${despesa.id}')" title="${acaoOcultar}" aria-label="${acaoOcultar}">${icone(oculta ? 'olho-fechado' : 'olho')}</button>
          <button class="btn-editar" onclick="abrirModalDespesaEdicao('${despesa.id}')" title="Editar despesa" aria-label="Editar despesa">${icone('lapis')}</button>
          <button class="btn-remover" onclick="removerDespesa('${despesa.id}')" title="Remover despesa" aria-label="Remover despesa">${icone('lixeira')}</button>
        </div>
      </div>
    `;
  }).join('');
}

function atualizarResumoCategorias(despesasNoCalculo, totalDespesas) {
  const container = document.getElementById('resumo-categorias');
  if (!container) return;

  if (despesasNoCalculo.length === 0) {
    container.setAttribute('hidden', '');
    container.innerHTML = '';
    return;
  }

  const porCategoria = {};
  despesasNoCalculo.forEach(d => {
    porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor;
  });

  const linhas = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, total]) => {
      const pct = totalDespesas > 0 ? (total / totalDespesas) * 100 : 0;
      return `
        <div class="cat-linha">
          <span class="cat-nome">${obterNomeCategoria(categoria)}</span>
          <span class="cat-valor">${formatarMoedaBrasileira(total)} <em>(${pct.toFixed(0)}%)</em></span>
          <div class="cat-barra"><div class="cat-barra-fill" style="width: ${Math.min(pct, 100)}%"></div></div>
        </div>
      `;
    }).join('');

  container.innerHTML = `<h3>Por categoria</h3>${linhas}`;
  container.removeAttribute('hidden');
}

function removerDespesa(id) {
  if (confirm('Tem certeza que deseja remover esta despesa?')) {
    const dados = obterDados();
    dados.despesas = dados.despesas.filter(d => d.id !== id);
    salvarDados(dados);
    atualizarVisualizacao();
  }
}

function obterNomeCategoria(categoria) {
  const nomes = {
    'moradia': 'Moradia',
    'mercado': 'Mercado / Alimentação',
    'utilidades': 'Utilidades',
    'transporte': 'Transporte',
    'saude': 'Saúde',
    'educacao': 'Educação',
    'assinatura': 'Assinaturas',
    'seguros': 'Seguros',
    'financiamento': 'Empréstimos / Financiamentos',
    'cartao': 'Cartão de Crédito',
    'impostos': 'Impostos / Taxas',
    'pets': 'Pets',
    'cuidados': 'Cuidados Pessoais',
    'lazer': 'Lazer',
    'doacoes': 'Doações / Dízimo',
    'outro': 'Outro'
  };
  return nomes[categoria] || categoria;
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
  const modal = document.getElementById('modal-despesa');
  if (event.target === modal) {
    fecharModalDespesa();
  }
});

// Fechar modal com a tecla Esc
document.addEventListener('keydown', function(event) {
  if (event.key !== 'Escape') return;
  const modal = document.getElementById('modal-despesa');
  if (modal && !modal.hasAttribute('hidden')) {
    fecharModalDespesa();
  }
});

// Inicializar ao carregar
window.addEventListener('load', inicializarDespesasFixas);
