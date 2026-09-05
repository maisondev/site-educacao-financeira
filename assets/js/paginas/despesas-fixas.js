let despesaEmEdicaoId = null;
let ordemDespesas = 'proximas';
let competenciaAtiva = null;

// Escapa texto do usuário antes de injetar via innerHTML
function escaparTexto(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

// Rótulos antigos desta página; ainda usados como fallback para registros salvos
// com chaves que não estão no catálogo de Cadastros Gerais.
const CATEGORIAS_FIXAS_LEGADO = {
  moradia: 'Moradia', mercado: 'Mercado / Alimentação', utilidades: 'Utilidades',
  transporte: 'Transporte', saude: 'Saúde', educacao: 'Educação',
  assinatura: 'Assinaturas', seguros: 'Seguros',
  financiamento: 'Empréstimos / Financiamentos', cartao: 'Cartão de Crédito',
  impostos: 'Impostos / Taxas', pets: 'Pets', cuidados: 'Cuidados Pessoais',
  lazer: 'Lazer', doacoes: 'Doações / Dízimo', outro: 'Outro'
};

// Monta o <select> de categoria a partir dos Cadastros Gerais (padrão + personalizadas).
function popularSelectCategoriasFixas() {
  const select = document.getElementById('select-categoria');
  if (!select) return;
  const mapa = Object.assign({}, CATEGORIAS_FIXAS_LEGADO,
    typeof Cadastros !== 'undefined' ? Cadastros.categorias() : {});
  // Preserva chaves antigas que já existam em registros salvos (ex.: "utilidades").
  (obterDados().despesas || []).forEach(d => {
    if (d.categoria && !mapa[d.categoria]) mapa[d.categoria] = obterNomeCategoria(d.categoria);
  });
  const atual = select.value;
  select.innerHTML = ['<option value="">Selecione</option>']
    .concat(Object.keys(mapa).map(c => `<option value="${c}">${escaparTexto(mapa[c])}</option>`))
    .join('');
  if (atual && mapa[atual]) select.value = atual;
}

function inicializarDespesasFixas() {
  // Sem a marcação da página (ex.: carregado só pelo verificacao.html), não há o
  // que inicializar — as funções puras deste arquivo seguem disponíveis.
  if (!document.getElementById('lista-despesas')) return;

  popularSelectCategoriasFixas();

  competenciaAtiva = (typeof competenciaSelecionada === 'function' && competenciaValida(competenciaSelecionada()))
    ? competenciaSelecionada()
    : competenciaAtual();
  renderizarSeletorMes();

  const dados = obterDados();
  const rendaCentralizada = obterRendaMensal();

  ordemDespesas = normalizarOrdem(dados.ordem);
  const selectOrdem = document.getElementById('select-ordem');
  if (selectOrdem) selectOrdem.value = ordemDespesas;

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

const CHAVE_DESPESAS_FIXAS = Store.CHAVES.DESPESAS_FIXAS;

function obterDados() {
  let dados = Store.ler(CHAVE_DESPESAS_FIXAS, null);

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

  // Migração idempotente: estado único (pagoEm / provisionada) -> estado por competência.
  // meses = { "AAAA-MM": { status: "reservado" | "pago", pagoEm?: "AAAA-MM-DD" } }
  let migrou = false;
  const registrosALimpar = [];
  dados.despesas.forEach(d => {
    if (!d.meses || typeof d.meses !== 'object') d.meses = {};
    if (d.pagoEm) {
      const c = String(d.pagoEm).slice(0, 7);
      if (competenciaValida(c) && !d.meses[c]) {
        d.meses[c] = { status: 'pago', pagoEm: d.pagoEm };
      }
      registrosALimpar.push(d);
      migrou = true;
    }
    if (d.provisionada) {
      const c = competenciaAtual();
      if (!d.meses[c]) d.meses[c] = { status: 'reservado' };
      registrosALimpar.push(d);
      migrou = true;
    }
  });
  if (migrou && Store.gravar(CHAVE_DESPESAS_FIXAS, dados)) {
    registrosALimpar.forEach(d => {
      delete d.pagoEm;
      delete d.provisionada;
    });
  }

  return dados;
}

// Estado de uma despesa num mês: "nada" | "reservado" | "pago"
function estadoMes(despesa, competencia) {
  const reg = despesa.meses && despesa.meses[competencia];
  return reg && reg.status ? reg.status : 'nada';
}

// Meses oferecidos no seletor: janela de -3 a +6 em torno do mês atual,
// mais qualquer competência que já tenha estado registrado em alguma despesa.
function competenciasParaSeletor() {
  const base = competenciaAtual();
  const set = new Set();
  if (competenciaValida(competenciaAtiva)) set.add(competenciaAtiva);
  for (let i = -3; i <= 6; i++) set.add(competenciaSomarMeses(base, i));
  (obterDados().despesas || []).forEach(d => {
    Object.keys(d.meses || {}).forEach(c => {
      if (competenciaValida(c)) set.add(c);
    });
  });
  return Array.from(set).sort();
}

function renderizarSeletorMes() {
  const container = document.getElementById('seletor-mes');
  if (!container) return;
  const opcoes = competenciasParaSeletor()
    .map(c => `<option value="${c}"${c === competenciaAtiva ? ' selected' : ''}>${escaparTexto(formatarCompetencia(c))}</option>`)
    .join('');
  container.innerHTML = `
    <label class="campo-ordenar" style="margin: 0">
      Mês de referência
      <select id="select-mes" onchange="mudarCompetenciaAtiva(this.value)">${opcoes}</select>
    </label>`;
}

function mudarCompetenciaAtiva(valor) {
  if (!competenciaValida(valor)) return;
  competenciaAtiva = valor;
  if (typeof definirCompetenciaSelecionada === 'function') definirCompetenciaSelecionada(valor);
  renderizarSeletorMes();
  atualizarVisualizacao();
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
  Store.gravar(CHAVE_DESPESAS_FIXAS, dados);
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
  document.getElementById('select-forma-pagamento').value = '';
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
  document.getElementById('select-forma-pagamento').value = despesa.formaPagamento || '';
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
  const formaPagamento = document.getElementById('select-forma-pagamento').value;

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
      despesa.formaPagamento = formaPagamento;
    }
  } else {
    dados.despesas.push({
      id: gerarId(),
      nome,
      categoria,
      valor,
      vencimentoDia,
      formaPagamento,
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

  atualizarPainelProvisionamento(despesasNoCalculo);
  atualizarResumoCategorias(despesasNoCalculo, totalDespesas);
  atualizarListaDespesas();
}

// Quanto das despesas fixas do mês selecionado já está pago ou reservado
function atualizarPainelProvisionamento(despesasNoCalculo) {
  const painel = document.getElementById('painel-provisionamento');
  if (!painel) return;

  if (despesasNoCalculo.length === 0) {
    painel.setAttribute('hidden', '');
    painel.innerHTML = '';
    return;
  }

  const comp = competenciaAtiva || competenciaAtual();
  const total = despesasNoCalculo.reduce((s, d) => s + d.valor, 0);

  let pago = 0, reservado = 0, nPendentes = 0;
  despesasNoCalculo.forEach(d => {
    const e = estadoMes(d, comp);
    if (e === 'pago') pago += d.valor;
    else if (e === 'reservado') reservado += d.valor;
    else nPendentes++;
  });

  const separado = pago + reservado;
  const falta = Math.max(total - separado, 0);
  const pct = total > 0 ? (separado / total) * 100 : 0;
  const completo = falta === 0;
  const rotuloMes = formatarCompetencia(comp);

  painel.innerHTML = `
    <div class="prov-cabecalho">
      <h3>Dinheiro separado para ${escaparTexto(rotuloMes)}</h3>
      <span class="prov-numeros">${formatarMoedaBrasileira(separado)} de ${formatarMoedaBrasileira(total)}</span>
    </div>
    <div class="prov-barra"><div class="prov-barra-fill${completo ? ' completo' : ''}" style="width: ${Math.min(pct, 100)}%"></div></div>
    <p class="prov-status">${completo
      ? `Mês coberto: <strong>${formatarMoedaBrasileira(pago)}</strong> pago e <strong>${formatarMoedaBrasileira(reservado)}</strong> reservado.`
      : `Pago ${formatarMoedaBrasileira(pago)} &middot; Reservado ${formatarMoedaBrasileira(reservado)} &middot; Falta separar <strong>${formatarMoedaBrasileira(falta)}</strong> (${nPendentes} despesa${nPendentes !== 1 ? 's' : ''}).`}</p>
    ${nPendentes > 0
      ? `<button type="button" class="btn-reservar-todas" onclick="reservarTodasPendentes()">Marcar as ${nPendentes} pendentes como reservadas</button>`
      : ''}
  `;
  painel.removeAttribute('hidden');
}

// Marca como "reservado" todas as despesas do mês que ainda estão sem estado
function reservarTodasPendentes() {
  const comp = competenciaAtiva || competenciaAtual();
  const dados = obterDados();
  dados.despesas.forEach(d => {
    if (d.oculta) return;
    if (!d.meses) d.meses = {};
    if (estadoMes(d, comp) === 'nada') d.meses[comp] = { status: 'reservado' };
  });
  salvarDados(dados);
  atualizarVisualizacao();
}

function marcarPagoDespesa(id) {
  const comp = competenciaAtiva || competenciaAtual();
  const dados = obterDados();
  const despesa = dados.despesas.find(d => d.id === id);
  if (!despesa) return;
  if (!despesa.meses) despesa.meses = {};

  if (estadoMes(despesa, comp) === 'pago') {
    delete despesa.meses[comp];
  } else {
    const padrao = hojeISO();
    const entrada = prompt(`Data do pagamento (dd/mm/aaaa) — ${formatarCompetencia(comp)}:`, formatarDataBR(padrao));
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
    despesa.meses[comp] = { status: 'pago', pagoEm: iso };
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

// Marca se o dinheiro dessa despesa já está separado para o mês selecionado
function toggleProvisionadaDespesa(id) {
  const comp = competenciaAtiva || competenciaAtual();
  const dados = obterDados();
  const despesa = dados.despesas.find(d => d.id === id);
  if (!despesa) return;
  if (!despesa.meses) despesa.meses = {};

  const e = estadoMes(despesa, comp);
  if (e === 'pago') return;
  if (e === 'reservado') delete despesa.meses[comp];
  else despesa.meses[comp] = { status: 'reservado' };

  salvarDados(dados);
  atualizarVisualizacao();
}

function normalizarOrdem(valor) {
  return ['proximas', 'vencimento', 'valor'].includes(valor) ? valor : 'proximas';
}

function alterarOrdemDespesas(valor) {
  ordemDespesas = normalizarOrdem(valor);
  const dados = obterDados();
  dados.ordem = ordemDespesas;
  salvarDados(dados);
  atualizarListaDespesas();
}

function atualizarListaDespesas() {
  const dados = obterDados();
  const lista = document.getElementById('lista-despesas');

  if (dados.despesas.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nenhuma despesa registrada.</p></div>`;
    return;
  }

  const despesasOrdenadas = [...dados.despesas].sort((a, b) => {
    // Despesas já pagas no mês selecionado saem do fluxo e vão para o fim da lista
    const pagoA = estadoMes(a, competenciaAtiva) === 'pago' ? 1 : 0;
    const pagoB = estadoMes(b, competenciaAtiva) === 'pago' ? 1 : 0;
    if (pagoA !== pagoB) return pagoA - pagoB;
    if (ordemDespesas === 'proximas') {
      const proxA = a.vencimentoDia ? diasAteVencimento(a.vencimentoDia) : Infinity;
      const proxB = b.vencimentoDia ? diasAteVencimento(b.vencimentoDia) : Infinity;
      if (proxA !== proxB) return proxA - proxB;
    } else if (ordemDespesas === 'vencimento') {
      const diaA = a.vencimentoDia || 99;
      const diaB = b.vencimentoDia || 99;
      if (diaA !== diaB) return diaA - diaB;
    }
    return b.valor - a.valor;
  });

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

    const nomeForma = obterNomeFormaPagamento(despesa.formaPagamento);
    const formaHtml = nomeForma
      ? `<p class="despesa-forma">${icone('carteira')} ${nomeForma}</p>`
      : '';

    const estado = estadoMes(despesa, competenciaAtiva);
    const regMes = despesa.meses && despesa.meses[competenciaAtiva];
    const rotuloMesAtivo = formatarCompetencia(competenciaAtiva);
    const pago = estado === 'pago';
    const pagoHtml = pago
      ? `<p class="despesa-pago">${icone('check')} Pago${regMes && regMes.pagoEm ? ' em ' + formatarDataBR(regMes.pagoEm) : ''} (${escaparTexto(rotuloMesAtivo)})</p>`
      : '';
    const acaoPagar = pago ? 'Desmarcar pagamento deste mês' : 'Marcar como pago neste mês';

    const provisionada = estado === 'reservado';
    const provisionadaHtml = provisionada
      ? `<p class="despesa-provisionada">${icone('carteira')} Reservado para ${escaparTexto(rotuloMesAtivo)}</p>`
      : '';
    const acaoProvisionar = provisionada ? 'Desmarcar dinheiro reservado' : 'Marcar dinheiro como reservado';

    return `
      <div class="despesa-item${oculta ? ' oculta' : ''}${pago ? ' pago' : ''}${provisionada ? ' provisionada' : ''}">
        <div class="despesa-info">
          <h3>${escaparTexto(despesa.nome)}${oculta ? ' <span class="despesa-badge-oculta">fora do cálculo</span>' : ''}</h3>
          <p class="despesa-categoria">${obterNomeCategoria(despesa.categoria)}</p>
          ${formaHtml}
          ${vencimentoHtml}
          ${provisionadaHtml}
          ${pagoHtml}
        </div>
        <div class="despesa-valor">
          <div class="despesa-valor-principal">${formatarMoedaBrasileira(despesa.valor)}</div>
          <div class="despesa-percentual">${percentualDespesa.toFixed(1)}% do salário</div>
        </div>
        <div class="despesa-acoes">
          <button class="btn-pagar${pago ? ' ativo' : ''}" onclick="marcarPagoDespesa('${despesa.id}')" title="${acaoPagar}" aria-label="${acaoPagar}">${icone('check')}</button>
          <button class="btn-provisionar${provisionada ? ' ativo' : ''}" onclick="toggleProvisionadaDespesa('${despesa.id}')" title="${acaoProvisionar}" aria-label="${acaoProvisionar}"${pago ? ' disabled' : ''}>${icone('carteira')}</button>
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
  if (typeof Cadastros !== 'undefined') {
    const mapa = Cadastros.categorias();
    if (mapa[categoria]) return mapa[categoria];
  }
  return CATEGORIAS_FIXAS_LEGADO[categoria] || categoria;
}

function obterNomeFormaPagamento(forma) {
  const nomes = {
    'debito-automatico': 'Débito automático',
    'debito': 'Débito',
    'pix': 'Pix',
    'cartao': 'Cartão de crédito',
    'boleto': 'Boleto',
    'dinheiro': 'Dinheiro'
  };
  return nomes[forma] || '';
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
