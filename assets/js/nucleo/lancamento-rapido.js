// Lançamento rápido: um único campo — "45,90 mercado" — cria a despesa
// variável do dia com a categoria sugerida pela descrição. Também permite
// informar estabelecimento, forma de pagamento e horário aproximado, listar
// os lançamentos por mês e dia, e editar/remover cada um.

// Mesmos valores do <select> de despesas-variaveis.html.
const LR_CATEGORIAS = {
  agua: 'Água',
  luz: 'Luz / Energia Elétrica',
  gas: 'Gás',
  internet: 'Internet',
  telefone: 'Telefone / Celular',
  streaming: 'Streaming / Assinaturas',
  alimentacao: 'Alimentação',
  combustivel: 'Combustível',
  manutencao: 'Manutenção / Consertos',
  cartao: 'Cartão de Crédito',
  outro: 'Outro'
};

// Formas de pagamento oferecidas no lançamento.
const LR_PAGAMENTOS = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto'
};

// Palavras que sugerem a categoria. Sem acento e em minúsculas — a descrição
// é normalizada antes da comparação.
const LR_PALAVRAS = [
  ['alimentacao', ['alimentacao', 'mercado', 'supermercado', 'feira', 'hortifruti', 'sacolao', 'acougue', 'padaria', 'quitanda', 'restaurante', 'lanche', 'lanchonete', 'almoco', 'janta', 'jantar', 'ifood', 'rappi', 'delivery', 'cafe', 'pizza', 'marmita', 'comida']],
  ['agua', ['agua', 'saneamento', 'cesan', 'sabesp']],
  ['luz', ['luz', 'energia', 'eletrica', 'edp', 'enel', 'cemig', 'light']],
  ['gas', ['gas', 'botijao', 'comgas']],
  ['internet', ['internet', 'wifi', 'banda larga', 'fibra', 'vivo fibra', 'net', 'claro net']],
  ['telefone', ['telefone', 'celular', 'recarga', 'chip', 'tim', 'vivo', 'claro', 'oi']],
  ['streaming', ['streaming', 'netflix', 'spotify', 'prime', 'disney', 'hbo', 'max', 'globoplay', 'youtube', 'assinatura', 'deezer']],
  ['combustivel', ['combustivel', 'gasolina', 'etanol', 'alcool', 'diesel', 'posto', 'abastecimento', 'uber', 'onibus', 'passagem']],
  ['manutencao', ['manutencao', 'conserto', 'reparo', 'oficina', 'mecanico', 'revisao', 'pneu', 'encanador', 'eletricista']],
  ['cartao', ['fatura', 'cartao']]
];

// Palavras que indicam compra de supermercado/feira — quando a descrição bate,
// o Lançamento rápido oferece detalhar a compra por categoria na Área do Mercado.
const LR_PALAVRAS_MERCADO = ['mercado', 'supermercado', 'atacado', 'atacadao', 'atacarejo', 'feira', 'hortifruti', 'sacolao', 'acougue', 'quitanda', 'mercearia'];

function lrPareceMercado(descricao) {
  const normalizada = lrNormalizar(descricao || '');
  return LR_PALAVRAS_MERCADO.some(p => new RegExp(`\\b${p}\\b`).test(normalizada));
}

let lrEditandoId = null;

// Mês (competência "AAAA-MM") que a lista está mostrando. Começa no mês vigente;
// para ver outros meses o usuário navega pelas setas.
let lrMesVisivel = null;

function lrCompetenciaAtual() {
  return typeof competenciaAtual === 'function'
    ? competenciaAtual()
    : lrDataDeHoje().slice(0, 7);
}

function lrMesVisivelResolve() {
  if (!/^\d{4}-\d{2}$/.test(lrMesVisivel || '')) {
    lrMesVisivel = lrCompetenciaAtual();
  }
  return lrMesVisivel;
}

// Competência de um lançamento (a explícita ou a deduzida da data);
// sem data válida, cai no mês vigente para não sumir da lista.
function lrCompetenciaDoItem(d) {
  if (typeof competenciaDoRegistro === 'function') {
    return competenciaDoRegistro(d, 'data') || lrCompetenciaAtual();
  }
  const bruto = (d.competencia || (d.data || '').slice(0, 7));
  return /^\d{4}-\d{2}$/.test(bruto) ? bruto : lrCompetenciaAtual();
}

function lrSomarMes(competencia, delta) {
  if (typeof competenciaSomarMeses === 'function') {
    return competenciaSomarMeses(competencia, delta);
  }
  const partes = competencia.split('-').map(Number);
  if (partes.length !== 2 || !partes[0] || !partes[1]) {
    return lrCompetenciaAtual();
  }
  const [ano, mes] = partes;
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Usa os cadastros gerais (categorias/formas de pagamento personalizadas)
// quando disponíveis; senão cai nos padrões locais.
function lrMapaCategorias() {
  return typeof Cadastros !== 'undefined' ? Cadastros.categorias() : LR_CATEGORIAS;
}

function lrMapaPagamentos() {
  return typeof Cadastros !== 'undefined' ? Cadastros.formasPagamento() : LR_PAGAMENTOS;
}

function lrNormalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function lrSugerirCategoria(descricao) {
  const normalizada = lrNormalizar(descricao);
  const encontrada = LR_PALAVRAS.find(([, palavras]) =>
    palavras.some(p => new RegExp(`\\b${p}\\b`).test(normalizada))
  );
  return encontrada ? encontrada[0] : 'outro';
}

// Separa valor e descrição, em qualquer ordem: "45,90 mercado",
// "mercado 45,90", "R$ 45,90 mercado", "mercado R$ 45.90".
function lrInterpretar(texto) {
  const entrada = (texto || '').trim();
  if (!entrada) return null;

  const padrao = /(?:r\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?/i;
  const inicio = entrada.match(new RegExp('^\\s*(' + padrao.source + ')\\s+(.+)$', 'i'));
  const fim = entrada.match(new RegExp('^(.+?)\\s+(' + padrao.source + ')\\s*$', 'i'));

  let bruto;
  let descricao;

  if (inicio) {
    bruto = inicio[1];
    descricao = inicio[2];
  } else if (fim) {
    bruto = fim[2];
    descricao = fim[1];
  } else {
    return null;
  }

  const valor = parseValorBrasileiro(bruto);
  descricao = descricao.trim();
  if (!valor || valor <= 0 || !descricao) return null;

  return {
    valor: Math.round(valor * 100) / 100,
    descricao,
    categoria: lrSugerirCategoria(descricao)
  };
}

function lrDataDeHoje() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

function lrHoraAgora() {
  const h = new Date();
  return `${String(h.getHours()).padStart(2, '0')}:${String(h.getMinutes()).padStart(2, '0')}`;
}

function lrCriarDespesa(interpretacao, extras) {
  const dados = extras || {};
  const data = dados.data || lrDataDeHoje();
  const despesas = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []);
  const despesa = {
    id: Date.now(),
    categoria: dados.categoria || interpretacao.categoria,
    descricao: interpretacao.descricao,
    estabelecimento: (dados.estabelecimento || '').trim(),
    formaPagamento: dados.formaPagamento || '',
    hora: dados.hora || '',
    valor: interpretacao.valor,
    data,
    competencia: data.slice(0, 7),
    dataCriacao: new Date().toISOString()
  };
  despesas.push(despesa);
  return Store.gravar(Store.CHAVES.DESPESAS_VARIAVEIS, despesas) ? despesa : null;
}

function lrRemoverDespesa(id) {
  const despesas = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, [])
    .filter(d => d.id !== id);
  Store.gravar(Store.CHAVES.DESPESAS_VARIAVEIS, despesas);
}

function lrAtualizarDespesa(id, patch) {
  const despesas = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []);
  const despesa = despesas.find(d => d.id === id);
  if (!despesa) return false;
  Object.assign(despesa, patch);
  if (patch.data) despesa.competencia = patch.data.slice(0, 7);
  return Store.gravar(Store.CHAVES.DESPESAS_VARIAVEIS, despesas);
}

function lrEscapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function lrMostrarMensagem(html, estado) {
  const alvo = document.getElementById('lr-mensagem');
  if (!alvo) return;
  alvo.className = `lr-mensagem lr-mensagem-${estado}`;
  alvo.innerHTML = html;
}

// Recalcula o que mudou com o lançamento, sem recarregar a página.
function lrAtualizarDashboard() {
  if (typeof renderizarSaldoDoMes === 'function') renderizarSaldoDoMes();
  if (typeof renderizarAlertas === 'function') renderizarAlertas();
  if (typeof renderizarDashboard === 'function') renderizarDashboard();
  lrRenderLista();
}

function lrPreencherDatalistEstabelecimentos() {
  const dl = document.getElementById('lr-estabelecimentos');
  if (!dl || typeof Cadastros === 'undefined') return;
  dl.innerHTML = Cadastros.estabelecimentos()
    .map(nome => `<option value="${lrEscapar(nome)}"></option>`)
    .join('');
}

function lrOpcoesCategoria(selecionada) {
  const mapa = lrMapaCategorias();
  return Object.keys(mapa)
    .map(chave => `<option value="${chave}"${chave === selecionada ? ' selected' : ''}>${mapa[chave]}</option>`)
    .join('');
}

function lrOpcoesPagamento(selecionada) {
  const mapa = lrMapaPagamentos();
  return `<option value="">Forma de pagamento</option>` + Object.keys(mapa)
    .map(chave => `<option value="${chave}"${chave === selecionada ? ' selected' : ''}>${mapa[chave]}</option>`)
    .join('');
}

function lrLancar() {
  const campo = document.getElementById('lr-entrada');
  const seletor = document.getElementById('lr-categoria');
  const estabel = document.getElementById('lr-estabelecimento');
  const pagamento = document.getElementById('lr-pagamento');
  const hora = document.getElementById('lr-hora');
  if (!campo) return;

  const interpretacao = lrInterpretar(campo.value);
  if (!interpretacao) {
    lrMostrarMensagem(
      'Não entendi. Escreva o valor e a descrição, por exemplo: <strong>45,90 mercado</strong>.',
      'erro'
    );
    return;
  }

  const categoria = seletor && seletor.value ? seletor.value : interpretacao.categoria;
  const despesa = lrCriarDespesa(interpretacao, {
    categoria,
    estabelecimento: estabel ? estabel.value : '',
    formaPagamento: pagamento ? pagamento.value : '',
    hora: hora ? hora.value : ''
  });
  if (!despesa) return;

  // O lançamento entra hoje: garante que a lista mostre o mês dele.
  lrMesVisivel = despesa.competencia || lrCompetenciaAtual();

  campo.value = '';
  if (seletor) seletor.value = '';
  if (estabel) estabel.value = '';
  if (pagamento) pagamento.value = '';
  if (hora) hora.value = lrHoraAgora();

  const mapaCat = lrMapaCategorias();
  const mapaPag = lrMapaPagamentos();
  const detalhes = [
    lrEscapar(mapaCat[despesa.categoria] || despesa.categoria),
    despesa.estabelecimento ? lrEscapar(despesa.estabelecimento) : '',
    despesa.formaPagamento ? lrEscapar(mapaPag[despesa.formaPagamento] || despesa.formaPagamento) : ''
  ].filter(Boolean).join(' · ');

  // Oferece salvar um estabelecimento ainda não cadastrado.
  const podeCadastrarEstab = despesa.estabelecimento &&
    typeof Cadastros !== 'undefined' &&
    !Cadastros.temEstabelecimento(despesa.estabelecimento);
  const botaoCadastrar = podeCadastrarEstab
    ? ` <button type="button" class="lr-desfazer lr-salvar-estab" data-nome="${lrEscapar(despesa.estabelecimento)}">Salvar "${lrEscapar(despesa.estabelecimento)}" nos cadastros</button>`
    : '';

  // Compra de mercado: oferece detalhar por categoria na Área do Mercado.
  // O valor já entrou nas despesas variáveis aqui, então lá o registro é só
  // para análise (o checkbox de lançar despesa vem desligado).
  const linkMercado = lrPareceMercado(despesa.descricao)
    ? ` <a class="lr-desfazer lr-detalhar-mercado" href="mercado.html?novaCompra=1` +
      `&valor=${encodeURIComponent(formatarNumeroBrasileiro(despesa.valor))}` +
      `&data=${encodeURIComponent(despesa.data)}` +
      `&estab=${encodeURIComponent(despesa.estabelecimento || '')}` +
      `&desc=${encodeURIComponent(despesa.descricao)}">Detalhar por categoria no Mercado</a>`
    : '';

  lrMostrarMensagem(
    `Lançado ${formatarMoedaBrasileira(despesa.valor)} — ${detalhes} ` +
    `(${lrEscapar(despesa.descricao)}). <button type="button" class="lr-desfazer" data-id="${despesa.id}">Desfazer</button>${botaoCadastrar}${linkMercado}`,
    'sucesso'
  );

  const botao = document.querySelector('#lr-mensagem button.lr-desfazer:not(.lr-salvar-estab)');
  if (botao) {
    botao.addEventListener('click', () => {
      lrRemoverDespesa(despesa.id);
      lrMostrarMensagem('Lançamento desfeito.', 'neutro');
      lrAtualizarDashboard();
    });
  }

  const botaoEstab = document.querySelector('#lr-mensagem .lr-salvar-estab');
  if (botaoEstab) {
    botaoEstab.addEventListener('click', () => {
      Cadastros.adicionarEstabelecimento(botaoEstab.dataset.nome);
      lrPreencherDatalistEstabelecimentos();
      botaoEstab.textContent = 'Estabelecimento salvo';
      botaoEstab.disabled = true;
    });
  }

  lrAtualizarDashboard();
  campo.focus();
}

// Mostra ao vivo a categoria que será usada, deixando o usuário sobrescrever.
function lrAtualizarSugestao() {
  const campo = document.getElementById('lr-entrada');
  const seletor = document.getElementById('lr-categoria');
  const dica = document.getElementById('lr-sugestao');
  if (!campo || !dica) return;

  const interpretacao = lrInterpretar(campo.value);
  if (!interpretacao) {
    dica.textContent = '';
    return;
  }

  const manual = seletor && seletor.value;
  const categoria = manual || interpretacao.categoria;
  dica.textContent = `${formatarMoedaBrasileira(interpretacao.valor)} · ${lrMapaCategorias()[categoria] || categoria}` +
    (manual ? '' : ' (sugerida)');
}

// ----- Lista de lançamentos por mês e dia -----

const LR_LIMITE_LISTA = 120;

function lrRotuloMes(chave) {
  const partes = chave.split('-').map(Number);
  if (partes.length !== 2 || !partes[0] || !partes[1]) {
    return 'Inválido';
  }
  const [ano, mes] = partes;
  const rotulo = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}

function lrRotuloDia(dataISO) {
  const d = new Date(dataISO + 'T00:00:00');
  const txt = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  return txt.replace('.', '');
}

function lrTagsDespesa(d) {
  const mapaCat = lrMapaCategorias();
  const mapaPag = lrMapaPagamentos();
  return [
    mapaCat[d.categoria] || d.categoria,
    d.estabelecimento || '',
    d.formaPagamento ? (mapaPag[d.formaPagamento] || d.formaPagamento) : ''
  ].filter(Boolean).map(lrEscapar).join(' · ');
}

function lrItemHTML(d) {
  if (d.id === lrEditandoId) return lrItemEdicaoHTML(d);
  const hora = d.hora ? `<span class="lr-item-hora">${lrEscapar(d.hora)}</span>` : '<span class="lr-item-hora lr-item-hora-vazia">--:--</span>';
  return `
    <div class="lr-item" data-id="${d.id}">
      ${hora}
      <div class="lr-item-principal">
        <div class="lr-item-desc">${lrEscapar(d.descricao || '(sem descrição)')}</div>
        <div class="lr-item-tags">${lrTagsDespesa(d)}</div>
      </div>
      <div class="lr-item-valor">${formatarMoedaBrasileira(d.valor)}</div>
      <div class="lr-item-acoes">
        <button type="button" class="lr-mini-btn" data-acao="editar" data-id="${d.id}" title="Editar" aria-label="Editar lançamento">${typeof icone === 'function' ? icone('lapis') : '✎'}</button>
        <button type="button" class="lr-mini-btn" data-acao="remover" data-id="${d.id}" title="Remover" aria-label="Remover lançamento">${typeof icone === 'function' ? icone('lixeira') : '🗑'}</button>
      </div>
    </div>`;
}

function lrItemEdicaoHTML(d) {
  return `
    <div class="lr-item lr-edicao" data-id="${d.id}">
      <div class="lr-edicao-campos">
        <input type="text" class="lr-ed-valor" value="${formatarNumeroBrasileiro(d.valor)}" inputmode="decimal" aria-label="Valor">
        <input type="text" class="lr-ed-descricao" value="${lrEscapar(d.descricao || '')}" placeholder="Descrição" aria-label="Descrição">
        <input type="text" class="lr-ed-estabelecimento" list="lr-estabelecimentos" value="${lrEscapar(d.estabelecimento || '')}" placeholder="Estabelecimento" aria-label="Estabelecimento">
        <select class="lr-ed-categoria" aria-label="Categoria">${lrOpcoesCategoria(d.categoria)}</select>
        <select class="lr-ed-pagamento" aria-label="Forma de pagamento">${lrOpcoesPagamento(d.formaPagamento)}</select>
        <input type="date" class="lr-ed-data" value="${lrEscapar(d.data || '')}" aria-label="Data">
        <input type="time" class="lr-ed-hora" value="${lrEscapar(d.hora || '')}" aria-label="Horário aproximado">
      </div>
      <div class="lr-edicao-acoes">
        <button type="button" class="btn btn-primary lr-ed-salvar" data-id="${d.id}">Salvar</button>
        <button type="button" class="btn btn-secondary lr-ed-cancelar">Cancelar</button>
      </div>
    </div>`;
}

function lrNavMesHTML(mesVisivel, totalMes) {
  const ehAtual = mesVisivel === lrCompetenciaAtual();
  const rotulo = lrRotuloMes(mesVisivel);
  return `
    <div class="lr-nav-mes">
      <button type="button" class="lr-nav-mes-seta" data-nav="-1" title="Mês anterior" aria-label="Mês anterior">&lsaquo;</button>
      <span class="lr-nav-mes-rotulo">${rotulo}</span>
      <button type="button" class="lr-nav-mes-seta" data-nav="1" title="Próximo mês" aria-label="Próximo mês">&rsaquo;</button>
      ${ehAtual ? '' : '<button type="button" class="lr-nav-mes-hoje" data-nav="hoje">Mês atual</button>'}
      <span class="lr-nav-mes-total">${formatarMoedaBrasileira(totalMes)}</span>
    </div>`;
}

function lrRenderLista() {
  const alvo = document.getElementById('lr-lista');
  if (!alvo) return;

  const mesVisivel = lrMesVisivelResolve();

  const doMes = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, [])
    .filter(d => lrCompetenciaDoItem(d) === mesVisivel)
    .sort((a, b) => {
      if ((a.data || '') !== (b.data || '')) return (b.data || '').localeCompare(a.data || '');
      if ((a.hora || '') !== (b.hora || '')) return (b.hora || '').localeCompare(a.hora || '');
      return (b.dataCriacao || '').localeCompare(a.dataCriacao || '');
    });

  const totalMes = doMes.reduce((s, d) => s + (d.valor || 0), 0);
  const navHTML = lrNavMesHTML(mesVisivel, totalMes);

  if (doMes.length === 0) {
    alvo.innerHTML = navHTML + '<p class="lr-vazia">Nenhum lançamento neste mês.</p>';
    return;
  }

  const lista = doMes.slice(0, LR_LIMITE_LISTA);
  const oculto = doMes.length - lista.length;

  // Agrupa por dia dentro do mês visível.
  const dias = [];
  const mapaDia = {};
  lista.forEach(d => {
    const chaveDia = d.data || 'sem-data';
    if (!mapaDia[chaveDia]) {
      mapaDia[chaveDia] = { chave: chaveDia, itens: [] };
      dias.push(mapaDia[chaveDia]);
    }
    mapaDia[chaveDia].itens.push(d);
  });

  alvo.innerHTML = navHTML + `
    <div class="lr-mes">
      ${dias.map(dia => `
        <div class="lr-dia">
          <div class="lr-dia-label">${dia.chave === 'sem-data' ? 'Sem data' : lrRotuloDia(dia.chave)}</div>
          ${dia.itens.map(lrItemHTML).join('')}
        </div>
      `).join('')}
    </div>
  ` + (oculto > 0
    ? `<p class="lr-vazia">Mostrando os ${LR_LIMITE_LISTA} mais recentes do mês (${oculto} ocultos).</p>`
    : '');
}

function lrEditarItem(id) {
  lrEditandoId = id;
  lrRenderLista();
  const campo = document.querySelector(`.lr-edicao[data-id="${id}"] .lr-ed-descricao`);
  if (campo) campo.focus();
}

function lrCancelarEdicao() {
  lrEditandoId = null;
  lrRenderLista();
}

function lrSalvarEdicao(id) {
  const raiz = document.querySelector(`.lr-edicao[data-id="${id}"]`);
  if (!raiz) return;

  const valor = parseValorBrasileiro(raiz.querySelector('.lr-ed-valor').value);
  const descricao = raiz.querySelector('.lr-ed-descricao').value.trim();
  const estabelecimento = raiz.querySelector('.lr-ed-estabelecimento').value.trim();
  const categoria = raiz.querySelector('.lr-ed-categoria').value;
  const formaPagamento = raiz.querySelector('.lr-ed-pagamento').value;
  const data = raiz.querySelector('.lr-ed-data').value;
  const hora = raiz.querySelector('.lr-ed-hora').value;

  if (!valor || valor <= 0) {
    lrMostrarMensagem('Informe um valor válido para salvar a edição.', 'erro');
    return;
  }
  if (!data) {
    lrMostrarMensagem('Informe a data do lançamento.', 'erro');
    return;
  }

  lrAtualizarDespesa(id, {
    valor: Math.round(valor * 100) / 100,
    descricao,
    estabelecimento,
    categoria,
    formaPagamento,
    data,
    hora
  });

  lrEditandoId = null;
  // Se a data mudou de mês, segue o lançamento até lá.
  if (/^\d{4}-\d{2}/.test(data)) lrMesVisivel = data.slice(0, 7);
  lrMostrarMensagem('Lançamento atualizado.', 'sucesso');
  lrAtualizarDashboard();
}

function lrTratarCliqueLista(e) {
  const botao = e.target.closest('button');
  if (!botao) return;

  if (botao.classList.contains('lr-ed-salvar')) {
    lrSalvarEdicao(Number(botao.dataset.id));
    return;
  }
  if (botao.classList.contains('lr-ed-cancelar')) {
    lrCancelarEdicao();
    return;
  }

  const nav = botao.dataset.nav;
  if (nav) {
    if (nav === 'hoje') {
      lrMesVisivel = lrCompetenciaAtual();
    } else {
      lrMesVisivel = lrSomarMes(lrMesVisivelResolve(), Number(nav));
    }
    lrEditandoId = null;
    lrRenderLista();
    return;
  }

  const acao = botao.dataset.acao;
  if (!acao) return;
  const id = Number(botao.dataset.id);

  if (acao === 'editar') {
    lrEditarItem(id);
  } else if (acao === 'remover') {
    if (!confirm('Remover este lançamento?')) return;
    lrRemoverDespesa(id);
    if (lrEditandoId === id) lrEditandoId = null;
    lrMostrarMensagem('Lançamento removido.', 'neutro');
    lrAtualizarDashboard();
  }
}

function renderizarLancamentoRapido() {
  const container = document.getElementById('container-lancamento-rapido');
  if (!container) return;

  container.innerHTML = `
    <h2>Lançamento rápido</h2>
    <p class="lr-descricao">
      Escreva o valor e o que foi, como <strong>45,90 mercado</strong>. A despesa entra hoje,
      nas despesas variáveis, com a categoria sugerida pela descrição. Estabelecimento, forma
      de pagamento e horário são opcionais.
    </p>
    <div class="lr-linha">
      <input type="text" id="lr-entrada" class="lr-entrada" placeholder="45,90 mercado" autocomplete="off">
      <select id="lr-categoria" class="lr-categoria">
        <option value="">Categoria automática</option>
        ${lrOpcoesCategoria(null)}
      </select>
    </div>
    <div class="lr-linha">
      <input type="text" id="lr-estabelecimento" class="lr-estabelecimento" list="lr-estabelecimentos" placeholder="Estabelecimento (opcional)" autocomplete="off">
      <datalist id="lr-estabelecimentos"></datalist>
      <select id="lr-pagamento" class="lr-pagamento">
        ${lrOpcoesPagamento(null)}
      </select>
      <input type="time" id="lr-hora" class="lr-hora" value="${lrHoraAgora()}" aria-label="Horário aproximado da compra">
      <button type="button" class="btn btn-primary" id="lr-botao">Lançar</button>
    </div>
    <div id="lr-sugestao" class="lr-sugestao"></div>
    <div id="lr-mensagem"></div>
    <div id="lr-lista" class="lr-lista"></div>
  `;

  lrPreencherDatalistEstabelecimentos();

  const campo = document.getElementById('lr-entrada');
  campo.addEventListener('input', lrAtualizarSugestao);
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lrLancar();
    }
  });
  document.getElementById('lr-categoria').addEventListener('change', lrAtualizarSugestao);
  document.getElementById('lr-botao').addEventListener('click', lrLancar);
  document.getElementById('lr-estabelecimento').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lrLancar();
    }
  });

  const lista = document.getElementById('lr-lista');
  lista.addEventListener('click', lrTratarCliqueLista);
  lista.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.closest('.lr-edicao')) {
      e.preventDefault();
      const raiz = e.target.closest('.lr-edicao');
      lrSalvarEdicao(Number(raiz.dataset.id));
    }
  });

  lrRenderLista();
}
