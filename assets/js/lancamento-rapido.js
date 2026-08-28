// Lançamento rápido: um único campo — "45,90 mercado" — cria a despesa
// variável do dia com a categoria sugerida pela descrição.

// Mesmos valores do <select> de despesas-variaveis.html.
const LR_CATEGORIAS = {
  agua: 'Água',
  luz: 'Luz / Energia Elétrica',
  gas: 'Gás',
  internet: 'Internet',
  telefone: 'Telefone / Celular',
  streaming: 'Streaming / Assinaturas',
  combustivel: 'Combustível',
  manutencao: 'Manutenção / Consertos',
  cartao: 'Cartão de Crédito',
  outro: 'Outro'
};

// Palavras que sugerem a categoria. Sem acento e em minúsculas — a descrição
// é normalizada antes da comparação.
const LR_PALAVRAS = [
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

function lrNormalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

function lrCriarDespesa(interpretacao, categoria) {
  const despesas = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []);
  const despesa = {
    id: Date.now(),
    categoria: categoria || interpretacao.categoria,
    descricao: interpretacao.descricao,
    valor: interpretacao.valor,
    data: lrDataDeHoje(),
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
}

function lrLancar() {
  const campo = document.getElementById('lr-entrada');
  const seletor = document.getElementById('lr-categoria');
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
  const despesa = lrCriarDespesa(interpretacao, categoria);
  if (!despesa) return;

  campo.value = '';
  if (seletor) seletor.value = '';

  lrMostrarMensagem(
    `Lançado ${formatarMoedaBrasileira(despesa.valor)} em <strong>${lrEscapar(LR_CATEGORIAS[despesa.categoria])}</strong> ` +
    `(${lrEscapar(despesa.descricao)}). <button type="button" class="lr-desfazer" data-id="${despesa.id}">Desfazer</button>`,
    'sucesso'
  );

  const botao = document.querySelector('#lr-mensagem .lr-desfazer');
  if (botao) {
    botao.addEventListener('click', () => {
      lrRemoverDespesa(despesa.id);
      lrMostrarMensagem('Lançamento desfeito.', 'neutro');
      lrAtualizarDashboard();
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
  dica.textContent = `${formatarMoedaBrasileira(interpretacao.valor)} · ${LR_CATEGORIAS[categoria]}` +
    (manual ? '' : ' (sugerida)');
}

function renderizarLancamentoRapido() {
  const container = document.getElementById('container-lancamento-rapido');
  if (!container) return;

  const opcoes = Object.keys(LR_CATEGORIAS)
    .map(chave => `<option value="${chave}">${LR_CATEGORIAS[chave]}</option>`)
    .join('');

  container.innerHTML = `
    <h2>Lançamento rápido</h2>
    <p class="lr-descricao">
      Escreva o valor e o que foi, como <strong>45,90 mercado</strong>. A despesa entra hoje,
      nas despesas variáveis, com a categoria sugerida pela descrição.
    </p>
    <div class="lr-linha">
      <input type="text" id="lr-entrada" class="lr-entrada" placeholder="45,90 mercado" autocomplete="off">
      <select id="lr-categoria" class="lr-categoria">
        <option value="">Categoria automática</option>
        ${opcoes}
      </select>
      <button type="button" class="btn btn-primary" id="lr-botao">Lançar</button>
    </div>
    <div id="lr-sugestao" class="lr-sugestao"></div>
    <div id="lr-mensagem"></div>
  `;

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
}
