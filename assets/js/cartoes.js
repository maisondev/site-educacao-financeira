let cartaoEmEdicaoId = null;

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_MINUSCULOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];


// Escapa texto do usuário antes de injetar via innerHTML (evita HTML injection)
function escaparTextoCartao(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

// Fallback: em paginas que carregam cartoes.js sem despesas-variaveis.js
// (ex.: cartoes.html), garante que a fatura seja lancada como despesa variavel.
// Quando despesas-variaveis.js tambem esta na pagina, a implementacao de la
// (declaracao de funcao) sobrescreve esta e prevalece.
if (typeof adicionarDespesaDeCartao !== 'function') {
  window.adicionarDespesaDeCartao = function (descricao, valor, data, ultimosDigitos) {
    const CHAVE = Store.CHAVES.DESPESAS_VARIAVEIS;
    let despesas = Store.ler(CHAVE, []);
    if (!Array.isArray(despesas)) despesas = [];

    const chaveDoCartao = (d) => {
      if (d['ultimosDígitos']) return 'd:' + d['ultimosDígitos'];
      const m = (d.descricao || '').match(/●●●●\s*(\d{3,4})/);
      if (m) return 'd:' + m[1];
      const nome = (d.descricao || '').split(' - ')[0]
        .replace(/\s*●●●●\s*\d+\s*$/, '').trim().toLowerCase();
      return 'n:' + (nome || 'cartao');
    };

    const obj = {
      id: Date.now() + Math.random(),
      categoria: 'cartao',
      descricao: descricao,
      valor: valor,
      data: data,
      competencia: (data || '').slice(0, 7),
      dataCriacao: new Date().toISOString()
    };
    if (ultimosDigitos) {
      obj['ultimosDígitos'] = ultimosDigitos;
    }

    const chave = chaveDoCartao(obj);
    const filtradas = despesas.filter(function (d) {
      return d.categoria !== 'cartao' || chaveDoCartao(d) !== chave;
    });
    filtradas.push(obj);
    Store.gravar(CHAVE, filtradas);
  };
}

// Primeiro nome, sem acento e minúsculo — usado para agrupar o mesmo titular
// mesmo quando o nome vem escrito de formas diferentes nas faturas.
function primeiroNomeNormalizado(nome) {
  const limpo = (nome || '').trim().toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return limpo.split(/\s+/)[0] || 'sem-titular';
}

function rotuloTitular(chave) {
  if (chave === 'sem-titular') return 'Sem titular';
  return chave.charAt(0).toUpperCase() + chave.slice(1);
}

function inicializarCartoes() {
  atualizarVisualizacao();
  sincronizarFaturasExistentes();

  const inputImportar = document.getElementById('input-importar-cartao');
  if (inputImportar) {
    inputImportar.addEventListener('change', (e) => {
      importarCartaoDeFatura(e.target.files[0]);
      e.target.value = '';
    });
  }
}

// --- Importar cartão a partir do manifesto gerado na análise de fatura ---
// Lê o cartao-<mes>-<ano>.json salvo na pasta da fatura (Google Drive) e
// cadastra/atualiza o cartão aqui, opcionalmente registrando a fatura do mês.

const CARTAO_MANIFESTO_TIPO = 'cartao-financas';
const CARTAO_MANIFESTO_VERSAO = 1;

function validarManifestoCartao(obj) {
  if (!obj || typeof obj !== 'object') return 'Arquivo não é um manifesto de cartão válido.';
  if (obj.tipo !== CARTAO_MANIFESTO_TIPO) return 'Este arquivo não é um manifesto de cartão (campo "tipo" diferente).';
  if (obj.versao !== CARTAO_MANIFESTO_VERSAO) {
    return `Manifesto na versão ${obj.versao || '?'}; este site lê a versão ${CARTAO_MANIFESTO_VERSAO}.`;
  }
  if (!obj.cartao || typeof obj.cartao !== 'object') return 'Manifesto sem a seção "cartao".';
  if (!/^\d{4}$/.test(String(obj.cartao.ultimos || ''))) return 'Manifesto sem os últimos 4 dígitos do cartão.';
  return null;
}

// dia "05" ou "05/08" -> mantém como está (formato aceito por datasPorMes)
function normalizarDiaMes(valor) {
  if (valor == null || valor === '') return '';
  return String(valor).trim();
}

function aplicarManifestoCartao(obj) {
  const m = obj.cartao;
  const bancoManifesto = m.banco || obterBancoPorNome(m.nome) || null;
  const cartoes = obterCartoes();

  let cartao = cartoes.find(c =>
    c.ultimos === String(m.ultimos) &&
    (!bancoManifesto || (obterBancoPorNome(c.nome) || null) === bancoManifesto)
  );

  const novo = !cartao;
  if (novo) {
    cartao = { id: Date.now(), dataCriacao: new Date().toISOString() };
    cartoes.push(cartao);
  }

  // Só sobrescreve com valores presentes no manifesto; mantém o resto.
  if (m.titular) cartao.titular = String(m.titular).trim();
  if (m.nome) cartao.nome = String(m.nome).trim();
  cartao.ultimos = String(m.ultimos);
  if (m.bandeira) cartao.bandeira = String(m.bandeira).toLowerCase();
  if (m.tipo) cartao.tipo = String(m.tipo).toLowerCase();
  if (m.limite != null && m.limite !== '') cartao.limite = Math.round(Number(m.limite) * 100) / 100;
  if (m.fechamento) cartao.fechamento = normalizarDiaMes(m.fechamento);
  if (m.vencimento) cartao.vencimento = normalizarDiaMes(m.vencimento);

  // Fatura do mês (opcional): registra em datasPorMes para aparecer o saldo
  // e ser lançada em Despesas Variáveis pela sincronização já existente.
  let faturaRegistrada = null;
  const f = obj.fatura;
  if (f && f.competencia && f.saldo != null && Number(f.saldo) > 0) {
    if (!cartao.datasPorMes) cartao.datasPorMes = [];
    const idx = cartao.datasPorMes.findIndex(d => d.mes === f.competencia);
    const existente = idx !== -1 ? cartao.datasPorMes[idx] : {};
    const entrada = {
      ...existente,
      mes: f.competencia,
      fechamento: normalizarDiaMes(f.fechamento || cartao.fechamento || ''),
      vencimento: normalizarDiaMes(f.vencimento || cartao.vencimento || ''),
      saldo: Math.round(Number(f.saldo) * 100) / 100
    };
    if (idx !== -1) {
      cartao.datasPorMes[idx] = entrada;
    } else {
      cartao.datasPorMes.push(entrada);
    }
    faturaRegistrada = entrada;

    if (cartao.limite) {
      if (!cartao.historicoUtilizacao) cartao.historicoUtilizacao = [];
      const percentual = (entrada.saldo / cartao.limite) * 100;
      const reg = { mes: f.competencia, percentual, saldo: entrada.saldo, data: new Date().toISOString() };
      const iHist = cartao.historicoUtilizacao.findIndex(h => h.mes === f.competencia);
      if (iHist !== -1) cartao.historicoUtilizacao[iHist] = reg;
      else cartao.historicoUtilizacao.push(reg);
    }
  }

  salvarCartoes(cartoes);
  return { novo, cartao, faturaRegistrada };
}

function importarCartaoDeFatura(arquivo) {
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = () => {
    let obj;
    try {
      obj = JSON.parse(leitor.result);
    } catch (e) {
      alert('Não foi possível ler o arquivo: JSON inválido.');
      return;
    }

    const erro = validarManifestoCartao(obj);
    if (erro) {
      alert('Manifesto de cartão não pôde ser importado.\n\n' + erro);
      return;
    }

    const m = obj.cartao;
    const linhas = [
      `${m.nome || 'Cartão'} ●●●● ${m.ultimos}`,
      m.titular ? `Titular: ${m.titular}` : null,
      m.limite != null && m.limite !== '' ? `Limite: ${formatarMoedaBrasileira(Number(m.limite))}` : null
    ];
    if (obj.fatura && obj.fatura.competencia && obj.fatura.saldo != null) {
      const [ano, mes] = String(obj.fatura.competencia).split('-');
      const nomeMes = formatarMesCompletoDeAnoMes(parseInt(ano), parseInt(mes));
      linhas.push(`Fatura ${nomeMes}: ${formatarMoedaBrasileira(Number(obj.fatura.saldo))} (será lançada em Despesas Variáveis)`);
    }

    if (!confirm('Importar este cartão?\n\n' + linhas.filter(Boolean).join('\n'))) return;

    let resultado;
    try {
      resultado = aplicarManifestoCartao(obj);
    } catch (e) {
      alert('Falha ao gravar o cartão: ' + e.message);
      return;
    }

    atualizarVisualizacao();
    sincronizarFaturasExistentes();

    const acao = resultado.novo ? 'cadastrado' : 'atualizado';
    alert(`Cartão ${acao} com sucesso.`);
  };
  leitor.onerror = () => alert('Não foi possível ler o arquivo selecionado.');
  leitor.readAsText(arquivo);
}

function obterAnoMesDeMesStr(mesStr) {
  const [ano, mes] = mesStr.split('-');
  return { ano: parseInt(ano), mes: parseInt(mes) };
}

function formatarMesCompletoDeAnoMes(ano, mes) {
  return new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function sincronizarFaturasExistentes() {
  const cartoes = obterCartoes();
  let houveMudancas = false;

  cartoes.forEach(cartao => {
    if (cartao.datasPorMes?.length) {
      cartao.datasPorMes.forEach(fatura => {
        if (fatura.saldo && fatura.saldo > 0 && !fatura.foiRegistradoComoDespesa) {
          const { ano, mes } = obterAnoMesDeMesStr(fatura.mes);
          const nomeMes = formatarMesCompletoDeAnoMes(ano, mes);
          const descricao = `${cartao.nome} - Fatura ${nomeMes}`;

          const vencimentoDia = fatura.vencimento.split('/')[0];
          const vencimentoMêsStr = fatura.vencimento.split('/')[1];
          const vencimentoMêsNum = vencimentoMêsStr ? parseInt(vencimentoMêsStr) : mes;
          const vencimentoAno = vencimentoMêsNum < mes ? ano + 1 : ano;
          const dataVencimento = `${vencimentoAno}-${String(vencimentoMêsNum).padStart(2, '0')}-${String(vencimentoDia).padStart(2, '0')}`;

          adicionarDespesaDeCartao(descricao, fatura.saldo, dataVencimento);
          fatura.foiRegistradoComoDespesa = true;
          houveMudancas = true;
        }
      });
    }
  });

  if (houveMudancas) {
    salvarCartoes(cartoes);
  }
}

function obterCartoes() {
  const dados = Store.ler(Store.CHAVES.CARTOES, []);
  return Array.isArray(dados) ? dados : [];
}

function salvarCartoes(cartoes) {
  Store.gravar(Store.CHAVES.CARTOES, cartoes);
}

function limparFormularioCartao() {
  const campos = ['input-cartao-id', 'input-cartao-titular', 'input-cartao-nome', 'input-cartao-ultimos', 'select-cartao-bandeira', 'select-cartao-tipo', 'input-cartao-limite', 'input-cartao-fechamento', 'input-cartao-vencimento', 'input-cartao-saldo-aberto'];
  campos.forEach(id => document.getElementById(id).value = '');
  limparCorCartao();
}

// Cor personalizada do cartão: o input color sempre tem um valor; usamos
// data-cor-definida para saber se o usuario realmente escolheu uma cor.
function limparCorCartao() {
  const campo = document.getElementById('input-cartao-cor');
  if (!campo) return;
  campo.value = '#4a154b';
  campo.removeAttribute('data-cor-definida');
}

document.addEventListener('input', function (e) {
  if (e.target && e.target.id === 'input-cartao-cor') {
    e.target.setAttribute('data-cor-definida', '1');
  }
});

function abrirModalCartao() {
  document.getElementById('modal-titulo').textContent = 'Novo Cartão';
  limparFormularioCartao();
  document.getElementById('btn-gerenciar-datas').setAttribute('hidden', '');
  document.getElementById('modal-cartao').removeAttribute('hidden');
  document.getElementById('input-cartao-titular').focus();
  cartaoEmEdicaoId = null;
}

function abrirModalCartaoEdicao(id) {
  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === id);

  if (!cartao) return;

  cartaoEmEdicaoId = id;
  document.getElementById('modal-titulo').textContent = 'Editar Cartão';
  document.getElementById('input-cartao-id').value = id;
  document.getElementById('input-cartao-titular').value = cartao.titular || '';
  document.getElementById('input-cartao-nome').value = cartao.nome;
  document.getElementById('input-cartao-ultimos').value = cartao.ultimos;
  document.getElementById('select-cartao-bandeira').value = cartao.bandeira || '';
  document.getElementById('select-cartao-tipo').value = cartao.tipo || '';
  document.getElementById('input-cartao-limite').value = cartao.limite ? formatarMoedaBrasileira(cartao.limite) : '';
  document.getElementById('input-cartao-fechamento').value = cartao.fechamento || '';
  document.getElementById('input-cartao-vencimento').value = cartao.vencimento || '';
  document.getElementById('input-cartao-saldo-aberto').value = cartao.saldoAberto ? formatarMoedaBrasileira(cartao.saldoAberto) : '';
  const campoCor = document.getElementById('input-cartao-cor');
  if (cartao.cor) {
    campoCor.value = cartao.cor;
    campoCor.setAttribute('data-cor-definida', '1');
  } else {
    limparCorCartao();
  }
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
    // Suportar formato legado (apenas dia) e novo formato (dia/mês)
    const fechamento = dataAtual.fechamento ? dataAtual.fechamento.toString().split('/') : [];
    document.getElementById('input-fechamento-dia').value = fechamento[0] || '';
    document.getElementById('input-fechamento-mes-select').value = fechamento[1] || '';

    const vencimento = dataAtual.vencimento ? dataAtual.vencimento.toString().split('/') : [];
    document.getElementById('input-vencimento-dia').value = vencimento[0] || '';
    document.getElementById('input-vencimento-mes-select').value = vencimento[1] || '';

    document.getElementById('input-saldo-mes').value = dataAtual.saldo ? formatarMoedaBrasileira(dataAtual.saldo) : '';
  } else {
    document.getElementById('input-fechamento-dia').value = '';
    document.getElementById('input-fechamento-mes-select').value = '';
    document.getElementById('input-vencimento-dia').value = '';
    document.getElementById('input-vencimento-mes-select').value = '';
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
    container.innerHTML = '<p style="font-size: 13px; color: var(--cor-texto-light); text-align: center;">Nenhum registro ainda</p>';
    return;
  }

  container.innerHTML = `<h4 style="font-size: 13px; margin: 0 0 8px 0;">Histórico:</h4>` + datas.map(d => {
    const { ano, mes } = obterAnoMesDeMesStr(d.mes);
    const nomeMes = formatarMesCompletoDeAnoMes(ano, mes);
    return `<div style="padding: 6px; background: var(--cor-cinza-leve); border-radius: 4px; margin-bottom: 4px; font-size: 12px; color: var(--cor-texto);">
      <strong>${nomeMes}:</strong> ${formatarDiaOuDiaMes(d.fechamento)} → ${formatarDiaOuDiaMes(d.vencimento)}${d.saldo ? ` / saldo ${formatarMoedaBrasileira(d.saldo)}` : ''}
    </div>`;
  }).join('');
}

function salvarDatasMes() {
  if (!cartaoEmEdicaoId) return;

  const mes = document.getElementById('select-mes-data').value;
  const fechamentoDia = document.getElementById('input-fechamento-dia').value;
  const fechamentoMes = document.getElementById('input-fechamento-mes-select').value;
  const vencimentoDia = document.getElementById('input-vencimento-dia').value;
  const vencimentoMes = document.getElementById('input-vencimento-mes-select').value;
  let saldo = parseValorBrasileiro(document.getElementById('input-saldo-mes').value);

  if (!mes) {
    alert('Por favor, selecione um mês');
    return;
  }

  if (!fechamentoDia || !vencimentoDia) {
    alert('Por favor, preencha os dias de fechamento e vencimento');
    return;
  }

  // Formatar como "dia/mês" (mês vazio = mesmo mês)
  const fechamento = fechamentoMes ? `${fechamentoDia}/${fechamentoMes}` : fechamentoDia;
  const vencimento = vencimentoMes ? `${vencimentoDia}/${vencimentoMes}` : vencimentoDia;

  saldo = saldo ? Math.round(saldo * 100) / 100 : null;

  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === parseInt(cartaoEmEdicaoId));
  if (!cartao) return;

  if (!cartao.datasPorMes) {
    cartao.datasPorMes = [];
  }

  const index = cartao.datasPorMes.findIndex(d => d.mes === mes);
  const existente = index !== -1 ? cartao.datasPorMes[index] : {};

  // Preserva campos já registrados do mês (ex.: foiPaga, foiRegistradoComoDespesa)
  const dataObj = { ...existente, mes, fechamento, vencimento };
  if (saldo) {
    dataObj.saldo = saldo;
  } else {
    delete dataObj.saldo;
  }

  // Registrar histórico de utilização mensal
  if (saldo && cartao.limite) {
    if (!cartao.historicoUtilizacao) {
      cartao.historicoUtilizacao = [];
    }
    const percentualUsado = (saldo / cartao.limite) * 100;
    const registroHist = { mes, percentual: percentualUsado, saldo, data: new Date().toISOString() };
    const idxHist = cartao.historicoUtilizacao.findIndex(h => h.mes === mes);
    if (idxHist !== -1) {
      cartao.historicoUtilizacao[idxHist] = registroHist;
    } else {
      cartao.historicoUtilizacao.push(registroHist);
    }
  }

  // Lança a fatura como despesa apenas uma vez por mês
  // (evita duplicata na recarga da página e ao reeditar o mesmo mês)
  let despesaLancada = false;
  if (saldo && saldo > 0 && !dataObj.foiRegistradoComoDespesa) {
    const { ano, mes: mesInt } = obterAnoMesDeMesStr(mes);
    const nomeMes = formatarMesCompletoDeAnoMes(ano, mesInt);
    const ultimosDígitos = cartao.ultimos ? ` ●●●● ${cartao.ultimos}` : '';
    const descricao = `${cartao.nome}${ultimosDígitos} - Fatura ${nomeMes}`;

    const vencimentoMêsNum = vencimentoMes ? parseInt(vencimentoMes) : mesInt;
    const vencimentoAno = vencimentoMêsNum < mesInt ? ano + 1 : ano;
    const dataVencimento = `${vencimentoAno}-${String(vencimentoMêsNum).padStart(2, '0')}-${String(vencimentoDia).padStart(2, '0')}`;

    adicionarDespesaDeCartao(descricao, saldo, dataVencimento, cartao.ultimos);
    dataObj.foiRegistradoComoDespesa = true;
    despesaLancada = true;
  }

  if (index !== -1) {
    cartao.datasPorMes[index] = dataObj;
  } else {
    cartao.datasPorMes.push(dataObj);
  }

  salvarCartoes(cartoes);
  renderizarHistoricoDatas();
  atualizarVisualizacao();

  if (despesaLancada) {
    alert(`Datas e saldo salvos! Despesa de ${formatarMoedaBrasileira(saldo)} adicionada em Despesas Variáveis.`);
  } else {
    alert('Datas e saldo salvos com sucesso!');
  }
}

function salvarCartao() {
  const id = document.getElementById('input-cartao-id').value;
  const titular = document.getElementById('input-cartao-titular').value.trim();
  const nome = document.getElementById('input-cartao-nome').value.trim();
  const ultimos = document.getElementById('input-cartao-ultimos').value.trim();
  const bandeira = document.getElementById('select-cartao-bandeira').value;
  const tipo = document.getElementById('select-cartao-tipo').value;
  const campoCor = document.getElementById('input-cartao-cor');
  const cor = campoCor.hasAttribute('data-cor-definida') ? campoCor.value : null;
  const fechamento = document.getElementById('input-cartao-fechamento').value.trim();
  const vencimento = document.getElementById('input-cartao-vencimento').value.trim();
  let limite = parseValorBrasileiro(document.getElementById('input-cartao-limite').value);
  let saldoAberto = parseValorBrasileiro(document.getElementById('input-cartao-saldo-aberto').value);

  if (!titular) {
    alert('Por favor, insira o titular do cartão');
    return;
  }

  if (!nome) {
    alert('Por favor, insira um nome/descrição do cartão');
    return;
  }

  if (!/^\d{4}$/.test(ultimos)) {
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
        titular,
        nome,
        ultimos,
        bandeira,
        tipo,
        cor,
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
      titular,
      nome,
      ultimos,
      bandeira,
      tipo,
      cor,
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

function obterSaldoMesAtual(cartao) {
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const datas = cartao.datasPorMes || [];
  const dataAtual = datas.find(d => d.mes === mesAtual);
  return dataAtual?.saldo || null;
}

function obterUltimaFaturaDisponivel(cartao) {
  const datas = cartao.datasPorMes || [];
  const historico = cartao.historicoUtilizacao || [];

  // Combinar por mês: datasPorMes é a fonte principal (traz foiPaga);
  // historicoUtilizacao só completa o saldo quando faltar.
  const porMes = {};
  historico.forEach(h => {
    porMes[h.mes] = { ...(porMes[h.mes] || {}), mes: h.mes, saldo: h.saldo };
  });
  datas.forEach(d => {
    porMes[d.mes] = { ...(porMes[d.mes] || {}), ...d };
  });

  const entradas = Object.values(porMes);
  if (entradas.length === 0) return null;

  entradas.sort((a, b) => parseInt(b.mes.replace('-', '')) - parseInt(a.mes.replace('-', '')));
  return entradas[0];
}

function obterSaldoExibicao(cartao) {
  const ultimaFatura = obterUltimaFaturaDisponivel(cartao);
  return ultimaFatura?.saldo || cartao.saldoAberto;
}

function formatarMesPtBr(mesStr) {
  const [ano, mes] = mesStr.split('-');
  return `${MESES_ABREV[parseInt(mes) - 1]} ${ano.slice(2)}`;
}

function atualizarVisualizacao() {
  const cartoes = obterCartoes();
  const container = document.getElementById('lista-cartoes');

  // Atualizar contador de cartões
  const contadorDiv = document.getElementById('contador-cartoes');
  if (contadorDiv) {
    contadorDiv.textContent = cartoes.length;
  }

  // Calcular resumo de saldos abertos (última fatura disponível ou saldoAberto)
  const cartoesComSaldo = cartoes.map(c => {
    const ultimaFatura = obterUltimaFaturaDisponivel(c);
    const saldo = ultimaFatura?.saldo ?? c.saldoAberto ?? 0;

    // Mostrar cartão se tem última fatura OU tem saldoAberto
    if (!ultimaFatura && !c.saldoAberto) return null;

    return {
      ...c,
      saldoVisivel: saldo,
      mesReferencia: ultimaFatura?.mes,
      ultimaFatura
    };
  }).filter(c => c !== null);

  // "Pago" vem sempre de datasPorMes (mesma fonte do checkbox). O objeto de
  // obterUltimaFaturaDisponivel pode ser a cópia vinda de historicoUtilizacao,
  // que não carrega o flag foiPaga.
  const faturaPaga = (c) => {
    const ref = c.mesReferencia;
    if (!ref) return false;
    return !!(c.datasPorMes || []).find(d => d.mes === ref)?.foiPaga;
  };

  const totalSaldosAbertos = cartoesComSaldo.reduce((sum, c) => {
    return sum + (faturaPaga(c) || !c.saldoVisivel ? 0 : c.saldoVisivel);
  }, 0);

  // Total devido agrupado por titular (ignora faturas já pagas).
  // Agrupa pelo primeiro nome normalizado — "Maison", "Maison Souza" e
  // "MAISON MARCEL MADRI ..." caem no mesmo grupo.
  const gruposTitular = {};
  cartoesComSaldo.forEach(c => {
    if (faturaPaga(c) || !c.saldoVisivel) return;
    const bruto = (c.titular || '').trim();
    const chave = primeiroNomeNormalizado(bruto);
    if (!gruposTitular[chave]) {
      gruposTitular[chave] = { label: rotuloTitular(chave), total: 0, itens: [] };
    }
    gruposTitular[chave].total += c.saldoVisivel;
    gruposTitular[chave].itens.push({ nome: c.nome, ultimos: c.ultimos, valor: c.saldoVisivel });
  });

  // Mostrar/esconder resumo
  const resumoDiv = document.getElementById('resumo-saldos');
  if (cartoesComSaldo.length > 0) {
    resumoDiv.style.display = 'block';

    // Agrupar por banco
    const cartoesPorBanco = {};
    cartoesComSaldo.forEach(c => {
      const banco = obterBancoPorNome(c.nome) || 'outros';
      if (!cartoesPorBanco[banco]) {
        cartoesPorBanco[banco] = [];
      }
      cartoesPorBanco[banco].push(c);
    });

    // Preencher lista de cartões com saldo agrupados por banco
    const listaDiv = document.getElementById('lista-saldos-por-cartao');
    listaDiv.innerHTML = Object.entries(cartoesPorBanco).map(([banco, cartoes]) => {
      const htmlCartoes = cartoes.map(c => {
        // Usar mês de referência da última fatura
        const mesRef_ = c.mesReferencia || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const [ano, mes] = mesRef_.split('-');
        const mesRef = `${MESES_ABREV[parseInt(mes) - 1]} ${ano.slice(2)}`;

        // Buscar status de pagamento da última fatura
        const datas = c.datasPorMes || [];
        const dataAtual = datas.find(d => d.mes === mesRef_);
        const pago = dataAtual && dataAtual.foiPaga;

        return `
        <div style="background: white; padding: var(--espacamento-md); border-radius: 6px; border-left: 4px solid var(--cor-primaria); position: relative; box-shadow: var(--sombra-sm);">
          <div style="position: absolute; top: 8px; right: 8px; display: flex; align-items: center; gap: 6px;">
            <input type="checkbox" id="pago-${c.id}" ${pago ? 'checked' : ''} onchange="marcarFaturaPaga(${c.id}, '${mesRef_}')" style="cursor: pointer; width: 18px; height: 18px;">
            <label for="pago-${c.id}" style="font-size: 11px; color: var(--cor-texto-light); cursor: pointer; font-weight: 500;">${pago ? 'Pago' : 'Pagar'}</label>
          </div>
          <div style="margin-bottom: 8px; padding-right: 60px;">
            <p style="margin: 0 0 2px 0; font-weight: bold; font-size: 14px; color: var(--cor-texto); ${pago ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escaparTextoCartao(c.nome)}</p>
            ${c.titular ? `<p style="margin: 0; font-size: 11px; color: var(--cor-texto-light);">Titular: ${escaparTextoCartao(c.titular)}</p>` : ''}
          </div>
          <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold; color: ${pago ? 'var(--cor-texto-light)' : 'var(--cor-primaria)'}; ${pago ? 'text-decoration: line-through;' : ''}">${formatarMoedaBrasileira(c.saldoVisivel)}</p>
          <p style="margin: 0; font-size: 11px; color: var(--cor-texto-light);">●●●● ${c.ultimos} • ${mesRef}</p>
        </div>
      `;
      }).join('');

      const nomeBanco = NOMES_BANCOS[banco] || banco;
      return `<div style="margin-bottom: var(--espacamento-lg);"><h3 style="margin: var(--espacamento-md) 0; color: var(--cor-primaria); font-size: 16px; display: flex; align-items: center; gap: 8px;">${nomeBanco}<span style="background: var(--cor-primaria); color: #fff; border-radius: 999px; padding: 1px 8px; font-size: 12px;">${cartoes.length}</span></h3><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--espacamento-md);">${htmlCartoes}</div></div>`;
    }).join('');

    document.getElementById('total-saldos-abertos').textContent = formatarMoedaBrasileira(totalSaldosAbertos);

    const titularDiv = document.getElementById('total-por-titular');
    const grupos = Object.values(gruposTitular).sort((a, b) => b.total - a.total);
    const mostrarPorTitular = grupos.length > 1 || (grupos.length === 1 && grupos[0].itens.length > 1);
    titularDiv.innerHTML = mostrarPorTitular
      ? grupos.map(g => `
        <div style="font-size: 13px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; gap: 8px; color: var(--cor-texto); font-weight: 600;">
            <span>${escaparTextoCartao(g.label)}</span>
            <span>${formatarMoedaBrasileira(g.total)}</span>
          </div>
          <div style="display: grid; gap: 2px; margin: 2px 0 0 12px; font-size: 12px; color: var(--cor-texto-light);">
            ${g.itens.sort((a, b) => b.valor - a.valor).map(it => `
              <div style="display: flex; justify-content: space-between; gap: 8px;">
                <span>${escaparTextoCartao(it.nome)}${it.ultimos ? ` ●●●● ${it.ultimos}` : ''}</span>
                <span>${formatarMoedaBrasileira(it.valor)}</span>
              </div>`).join('')}
          </div>
        </div>`).join('')
      : '';
  } else {
    resumoDiv.style.display = 'none';
  }

  if (cartoes.length === 0) {
    container.innerHTML = '<div class="lista-vazia">Nenhum cartão cadastrado</div>';
    return;
  }

  container.innerHTML = agruparCartoesPorBanco(cartoes);
}

const ORDEM_BANCOS = ['nubank', 'inter', 'bradesco', 'picpay', 'itau', 'santander', 'caixa', 'bb'];
const NOMES_BANCOS = {
  nubank: 'Nubank',
  inter: 'Inter',
  bradesco: 'Bradesco',
  picpay: 'PicPay',
  itau: 'Itaú',
  santander: 'Santander',
  caixa: 'Caixa',
  bb: 'Banco do Brasil',
  outros: 'Outros'
};

// Agrupa os cartões por banco e monta uma seção por grupo
function agruparCartoesPorBanco(cartoes) {
  const grupos = {};
  cartoes.forEach(cartao => {
    const chave = obterBancoPorNome(cartao.nome) || 'outros';
    (grupos[chave] = grupos[chave] || []).push(cartao);
  });

  const chavesConhecidas = ORDEM_BANCOS.filter(b => grupos[b]);
  const chavesExtras = Object.keys(grupos)
    .filter(k => !ORDEM_BANCOS.includes(k) && k !== 'outros')
    .sort();
  const chaves = [...chavesConhecidas, ...chavesExtras, ...(grupos.outros ? ['outros'] : [])];

  return chaves.map(chave => `
    <section class="grupo-banco">
      <h2 class="grupo-banco-titulo">
        ${NOMES_BANCOS[chave] || chave}
        <span class="grupo-banco-contagem">${grupos[chave].length}</span>
      </h2>
      <div class="cartoes-container">
        ${grupos[chave].map(montarCardCartao).join('')}
      </div>
    </section>
  `).join('');
}

function montarCardCartao(cartao) {
  const ultimaFatura = obterUltimaFaturaDisponivel(cartao);
  const saldoVisivel = ultimaFatura?.saldo ?? cartao.saldoAberto;
  const mesReferencia = ultimaFatura?.mes;
  const banco = obterBancoPorNome(cartao.nome);
  const databancoAttr = banco ? ` data-banco="${banco}"` : '';
  const corAttr = cartao.cor ? ` style="background: linear-gradient(135deg, ${cartao.cor} 0%, ${cartao.cor} 100%)"` : '';
  return `
    <div class="card-cartao"${databancoAttr}${corAttr}>
      <div class="card-cartao-botoes">
        <button class="btn-acao-cartao" onclick="exportarCartaoParaCalendario(${cartao.id})" title="Exportar para calendário" aria-label="Exportar para calendário">${icone('calendario')}</button>
        <button class="btn-acao-cartao" onclick="abrirModalCartaoEdicao(${cartao.id})" title="Editar cartão" aria-label="Editar cartão">${icone('lapis')}</button>
        <button class="btn-acao-cartao" onclick="removerCartao(${cartao.id})" title="Remover cartão" aria-label="Remover cartão">${icone('lixeira')}</button>
      </div>

      <div class="card-cartao-header">
        <h3 class="card-cartao-titulo">${escaparTextoCartao(cartao.nome)}</h3>
        ${cartao.titular ? `<div class="card-cartao-titular">Titular: ${escaparTextoCartao(cartao.titular)}</div>` : ''}
      </div>

      <div class="card-cartao-numero">●●●● ${cartao.ultimos}</div>

      ${cartao.bandeira || cartao.tipo ? `
      <div class="card-cartao-tags">
        ${cartao.bandeira ? `<span class="card-cartao-bandeira">${obterNomeBandeira(cartao.bandeira)}</span>` : ''}
        ${cartao.tipo ? `<span class="card-cartao-bandeira">${cartao.tipo === 'fisico' ? 'Físico' : 'Virtual'}</span>` : ''}
      </div>
      ` : ''}

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

      ${saldoVisivel ? `
      <div style="margin-top: var(--espacamento-sm); padding: var(--espacamento-sm); background: rgba(255,255,255,0.15); border-radius: 6px; border-top: 1px solid rgba(255,255,255,0.3);">
        <div style="font-size: 11px; opacity: 0.85; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; font-weight: 600;">
          ${mesReferencia ? `Fatura ${formatarMesPtBr(mesReferencia)}` : 'Saldo Aberto'}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <span style="font-size: 16px; font-weight: bold;">${formatarMoedaBrasileira(saldoVisivel)}</span>
          ${cartao.limite ? `<span style="font-size: 11px; opacity: 0.8;">${Math.round((saldoVisivel / cartao.limite) * 100)}%</span>` : ''}
        </div>
        ${cartao.limite ? `
        <div style="background: rgba(255,255,255,0.25); border-radius: 3px; height: 6px; overflow: hidden; margin-top: 4px;">
          <div style="background: rgba(255,255,255,0.95); height: 100%; width: ${Math.min((saldoVisivel / cartao.limite) * 100, 100)}%;"></div>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${cartao.historicoUtilizacao && cartao.historicoUtilizacao.length > 1 ? `
      <div class="historico-utilizacao-container">
        <div class="historico-titulo">Utilização Mensal</div>
        <div class="chart-barras-horizontal">
          ${cartao.historicoUtilizacao
            .sort((a, b) => a.mes.localeCompare(b.mes))
            .slice(-6)
            .map(h => {
              const classe = h.percentual > 80 ? 'critico' : h.percentual > 60 ? 'alerta' : '';
              const [ano, mes] = h.mes.split('-');
              const mesNome = MESES_ABREV[parseInt(mes) - 1];
              return `
                <div class="chart-barra-item">
                  <div class="chart-barra-label">${mesNome}</div>
                  <div class="chart-barra-wrapper">
                    <div class="chart-barra-fill ${classe}" style="width: ${Math.min(h.percentual, 100)}%">
                      ${h.percentual > 20 ? Math.round(h.percentual) + '%' : ''}
                    </div>
                  </div>
                  <div class="chart-barra-valor">${Math.round(h.percentual)}%</div>
                </div>
              `;
            }).join('')}
        </div>

        <div style="margin-top: var(--espacamento-lg); padding-top: var(--espacamento-md); border-top: 1px solid rgba(255,255,255,0.2);">
          <div class="historico-titulo">Histórico de Faturas</div>
          <div style="font-size: 12px; display: grid; gap: 6px;">
            ${cartao.historicoUtilizacao
              .sort((a, b) => b.mes.localeCompare(a.mes))
              .map(h => {
                const [ano, mes] = h.mes.split('-');
                const mesNome = MESES_ABREV[parseInt(mes) - 1];
                const statusPagamento = cartao.datasPorMes?.find(d => d.mes === h.mes)?.foiPaga;
                const statusColor = statusPagamento ? '#10b981' : h.percentual > 80 ? '#ef4444' : h.percentual > 60 ? '#fbbf24' : '#f59e0b';
                const statusLabel = statusPagamento ? 'Pago' : h.percentual > 80 ? 'Crítico' : h.percentual > 60 ? 'Alerta' : 'Pendente';
                return `
                  <div style="display: grid; grid-template-columns: 60px 1fr 80px 100px; gap: 8px; align-items: center; padding: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; border-left: 3px solid ${statusColor}; ${statusPagamento ? 'opacity: 0.6;' : ''}">
                    <div style="font-weight: 600; ${statusPagamento ? 'text-decoration: line-through;' : ''}">${mesNome} ${ano.slice(2)}</div>
                    <div>${formatarMoedaBrasileira(h.saldo)}</div>
                    <div style="text-align: center; color: ${statusColor}; font-weight: 600;">${Math.round(h.percentual)}%</div>
                    <div style="text-align: right; font-size: 11px; color: ${statusColor}; font-weight: 600;">${statusLabel}</div>
                  </div>
                `;
              }).join('')}
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

function formatarDiaOuDiaMes(valor) {
  if (!valor) return '—';
  const partes = valor.toString().split('/');
  const dia = partes[0];
  const mes = parseInt(partes[1]);
  return mes ? `${dia} de ${MESES_MINUSCULOS[mes - 1]}` : dia;
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

function obterBancoPorNome(nomeCartao) {
  const nome = (nomeCartao || '').toLowerCase();

  if (nome.includes('nubank')) return 'nubank';
  if (nome.includes('inter')) return 'inter';
  if (nome.includes('bradesco')) return 'bradesco';
  if (nome.includes('picpay')) return 'picpay';
  if (nome.includes('itau') || nome.includes('itaú')) return 'itau';
  if (nome.includes('santander')) return 'santander';
  if (nome.includes('caixa')) return 'caixa';
  if (nome.includes('banco do brasil') || nome.includes('bb ')) return 'bb';

  return null;
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
    const textoFechamento = formatarDiaOuDiaMes(fechamento);
    const textoVencimento = formatarDiaOuDiaMes(vencimento);
    return `${textoFechamento} → ${textoVencimento}`;
  }
  if (fechamento) {
    return `fecha ${formatarDiaOuDiaMes(fechamento)}`;
  }
  if (vencimento) {
    return `paga ${formatarDiaOuDiaMes(vencimento)}`;
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

  alert(`Arquivo de calendário gerado!\n\nImporte "${cartao.nome}.ics" no seu:\n- Google Calendar\n- Outlook\n- Apple Calendar\n\nA Alexa lerá seus lembretes!`);
}

function marcarFaturaPaga(cartaoId, mes) {
  const cartoes = obterCartoes();
  const cartao = cartoes.find(c => c.id === cartaoId);

  if (!cartao) return;

  if (!cartao.datasPorMes) {
    cartao.datasPorMes = [];
  }

  const dataIndex = cartao.datasPorMes.findIndex(d => d.mes === mes);

  if (dataIndex !== -1) {
    // Toggle estado de pagamento
    cartao.datasPorMes[dataIndex].foiPaga = !cartao.datasPorMes[dataIndex].foiPaga;
  } else {
    // Criar novo registro se não existir
    cartao.datasPorMes.push({ mes, foiPaga: true });
  }

  salvarCartoes(cartoes);
  atualizarVisualizacao();
}

// Fechar modais ao clicar fora
document.addEventListener('click', function(event) {
  if (event.target === document.getElementById('modal-cartao')) {
    fecharModalCartao();
  }
  if (event.target === document.getElementById('modal-datas-mes')) {
    fecharModalDatasMes();
  }
});

// Fechar modais com a tecla Esc
document.addEventListener('keydown', function(event) {
  if (event.key !== 'Escape') return;
  if (!document.getElementById('modal-datas-mes').hasAttribute('hidden')) {
    fecharModalDatasMes();
  } else if (!document.getElementById('modal-cartao').hasAttribute('hidden')) {
    fecharModalCartao();
  }
});

