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

function obterDados() {
  const dados = localStorage.getItem('despesas_fixas');
  return dados ? JSON.parse(dados) : { salario: 0, despesas: [] };
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

  valor = Math.round(valor * 100) / 100;

  const dados = obterDados();

  if (despesaEmEdicaoId !== null) {
    const despesa = dados.despesas.find(d => d.id === despesaEmEdicaoId);
    if (despesa) {
      despesa.nome = nome;
      despesa.categoria = categoria;
      despesa.valor = valor;
    }
  } else {
    dados.despesas.push({
      id: Date.now(),
      nome,
      categoria,
      valor,
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

  const totalDespesas = dados.despesas.reduce((sum, d) => sum + d.valor, 0);
  const disponivel = dados.salario - totalDespesas;
  const percentual = dados.salario > 0 ? (totalDespesas / dados.salario) * 100 : 0;

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

  atualizarListaDespesas();
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

    return `
      <div class="despesa-item">
        <div class="despesa-info">
          <h3>${escaparTexto(despesa.nome)}</h3>
          <p class="despesa-categoria">${obterNomeCategoria(despesa.categoria)}</p>
        </div>
        <div class="despesa-valor">
          <div class="despesa-valor-principal">${formatarMoedaBrasileira(despesa.valor)}</div>
          <div class="despesa-percentual">${percentualDespesa.toFixed(1)}% do salário</div>
        </div>
        <div class="despesa-acoes">
          <button class="btn-editar" onclick="abrirModalDespesaEdicao(${despesa.id})" title="Editar despesa">✎</button>
          <button class="btn-remover" onclick="removerDespesa(${despesa.id})" title="Remover despesa">×</button>
        </div>
      </div>
    `;
  }).join('');
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

// Inicializar ao carregar
window.addEventListener('load', inicializarDespesasFixas);
