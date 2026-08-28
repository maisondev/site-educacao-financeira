const CHAVE_DESPESAS_VARIAVEIS = 'despesas_variaveis';
const CHAVE_CATEGORIAS_COLAPSADAS = 'despesas_variaveis_colapsadas';

// Rótulos alinhados com o <select> de despesas-variaveis.html
const CATEGORIAS = {
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

let despesaVariavelEmEdicaoId = null;

// Escapa texto do usuário antes de injetar via innerHTML
function escaparTexto(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function dataDeHojeISO() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

function definirDataPadraoVariavel() {
  const inputData = document.getElementById('var-data');
  if (inputData && !inputData.value) {
    inputData.value = dataDeHojeISO();
  }
}

function obterCategoriasColapsadas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CATEGORIAS_COLAPSADAS)) || [];
  } catch (e) {
    return [];
  }
}

function definirCategoriasColapsadas(lista) {
  localStorage.setItem(CHAVE_CATEGORIAS_COLAPSADAS, JSON.stringify(lista));
}

function toggleCategoria(categoria) {
  const grupo = document.querySelector(`.categoria-grupo[data-categoria="${categoria}"]`);
  if (!grupo) return;
  const colapsado = grupo.classList.toggle('colapsado');
  const lista = obterCategoriasColapsadas().filter(c => c !== categoria);
  if (colapsado) lista.push(categoria);
  definirCategoriasColapsadas(lista);
}

function obterDespesasVariaveis() {
  try {
    const dados = localStorage.getItem(CHAVE_DESPESAS_VARIAVEIS);
    return dados ? JSON.parse(dados) : [];
  } catch (erro) {
    console.error('Erro ao carregar despesas variáveis:', erro);
    return [];
  }
}

function salvarDespesasVariaveis(despesas) {
  localStorage.setItem(CHAVE_DESPESAS_VARIAVEIS, JSON.stringify(despesas));
}

// Identifica de qual cartão é uma despesa (para manter só 1 fatura por cartão).
// Preferência: últimos dígitos (campo ou máscara na descrição) e, por fim, o nome.
function chaveCartaoDaDespesa(despesa) {
  if (despesa.ultimosDígitos) return 'd:' + String(despesa.ultimosDígitos);
  const mascara = (despesa.descricao || '').match(/●●●●\s*(\d{3,4})/);
  if (mascara) return 'd:' + mascara[1];
  const nome = (despesa.descricao || '')
    .split(' - ')[0]
    .replace(/\s*●●●●\s*\d+\s*$/, '')
    .trim()
    .toLowerCase();
  return 'n:' + (nome || 'cartao');
}

// Entre duas faturas do mesmo cartão, decide qual manter:
// vencimento mais recente; em empate (mesma fatura fragmentada), o maior valor.
function faturaPreferida(a, b) {
  const dataA = a.data || '';
  const dataB = b.data || '';
  if (dataA !== dataB) return dataA > dataB ? a : b;
  if ((a.valor || 0) !== (b.valor || 0)) return (a.valor || 0) > (b.valor || 0) ? a : b;
  return (a.dataCriacao || '') >= (b.dataCriacao || '') ? a : b;
}

// Fatura lançada automaticamente pela página de Cartões (tem os últimos dígitos
// ou o padrão "... - Fatura <mês>"). Lançamentos manuais de cartão não entram aqui.
function ehFaturaSincronizada(despesa) {
  return !!despesa.ultimosDígitos || / - Fatura /.test(despesa.descricao || '');
}

// Colapsa as faturas sincronizadas de cartão: só a última de cada cartão permanece.
// Lançamentos de cartão feitos/editados à mão são preservados como estão.
function colapsarFaturasDeCartao(despesas) {
  const ultimaPorCartao = {};
  const outras = [];

  despesas.forEach(d => {
    if (d.categoria !== 'cartao' || !ehFaturaSincronizada(d)) {
      outras.push(d);
      return;
    }
    const chave = chaveCartaoDaDespesa(d);
    ultimaPorCartao[chave] = ultimaPorCartao[chave]
      ? faturaPreferida(d, ultimaPorCartao[chave])
      : d;
  });

  return outras.concat(Object.values(ultimaPorCartao));
}

// Remove do localStorage as faturas de cartão duplicadas/antigas de uma vez.
function migrarFaturasDeCartao() {
  const despesas = obterDespesasVariaveis();
  const colapsadas = colapsarFaturasDeCartao(despesas);
  if (colapsadas.length !== despesas.length) {
    salvarDespesasVariaveis(colapsadas);
    console.log(`[despesas-variaveis] ${despesas.length - colapsadas.length} fatura(s) de cartão duplicada(s) removida(s)`);
  }
}

function adicionarDespesaDeCartao(descricao, valor, data, ultimosDígitos) {
  const obj = {
    id: Date.now() + Math.random(),
    categoria: 'cartao',
    descricao,
    valor,
    data,
    dataCriacao: new Date().toISOString()
  };
  if (ultimosDígitos) {
    obj.ultimosDígitos = ultimosDígitos;
  }

  // Uma despesa por cartão: substitui a fatura anterior do mesmo cartão
  const chave = chaveCartaoDaDespesa(obj);
  const despesas = obterDespesasVariaveis()
    .filter(d => d.categoria !== 'cartao' || chaveCartaoDaDespesa(d) !== chave);
  despesas.push(obj);
  salvarDespesasVariaveis(despesas);
}

function sincronizarUltimosDígitosCartão() {
  const despesas = obterDespesasVariaveis();
  const cartoes = obterCartoes();
  let atualizado = false;

  despesas.forEach(despesa => {
    if (despesa.categoria === 'cartao' && !despesa.ultimosDígitos) {
      const nomeCartao = despesa.descricao.split(' - ')[0];
      const cartao = cartoes.find(c => c.nome === nomeCartao);
      if (cartao && cartao.ultimos) {
        despesa.ultimosDígitos = cartao.ultimos;
        if (!despesa.descricao.includes('●●●●')) {
          despesa.descricao = `${cartao.nome} ●●●● ${cartao.ultimos} - ${despesa.descricao.split(' - ').slice(1).join(' - ')}`;
        }
        atualizado = true;
      }
    }
  });

  if (atualizado) {
    salvarDespesasVariaveis(despesas);
  }
}

function salvarDespesaVariavel() {
  const categoria = document.getElementById('var-categoria').value;
  const descricao = document.getElementById('var-descricao').value.trim();
  const valor = parseValorBrasileiro(document.getElementById('var-valor').value);
  const data = document.getElementById('var-data').value;

  if (!categoria) {
    alert('Por favor, selecione uma categoria');
    return;
  }

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  if (!data) {
    alert('Por favor, selecione a data');
    return;
  }

  const despesas = obterDespesasVariaveis();
  let idSalvo = despesaVariavelEmEdicaoId;

  if (despesaVariavelEmEdicaoId !== null) {
    const despesa = despesas.find(d => d.id === despesaVariavelEmEdicaoId);
    if (despesa) {
      despesa.categoria = categoria;
      despesa.descricao = descricao;
      despesa.valor = valor;
      despesa.data = data;
      // Deixou de ser cartão: descarta os últimos dígitos herdados da fatura
      if (categoria !== 'cartao') {
        delete despesa.ultimosDígitos;
      }
    }
  } else {
    idSalvo = Date.now();
    despesas.push({
      id: idSalvo,
      categoria,
      descricao,
      valor,
      data,
      dataCriacao: new Date().toISOString()
    });
  }

  salvarDespesasVariaveis(despesas);
  cancelarEdicaoVariavel();
  carregarDespesasVariaveis();
  destacarRegistro(idSalvo);
}

function editarDespesaVariavel(id) {
  const despesa = obterDespesasVariaveis().find(d => d.id === id);
  if (!despesa) return;

  despesaVariavelEmEdicaoId = id;
  document.getElementById('var-categoria').value = despesa.categoria;
  document.getElementById('var-descricao').value = despesa.descricao || '';
  document.getElementById('var-valor').value = formatarNumeroBrasileiro(despesa.valor);
  document.getElementById('var-data').value = despesa.data;

  document.getElementById('titulo-form-variavel').textContent = 'Editar Despesa Variável';
  document.getElementById('btn-salvar-variavel').textContent = 'Salvar Alterações';
  document.getElementById('aviso-edicao-variavel').classList.add('ativo');

  document.querySelector('.secao-variaveis').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('var-descricao').focus();
}

function cancelarEdicaoVariavel() {
  despesaVariavelEmEdicaoId = null;
  document.getElementById('titulo-form-variavel').textContent = 'Registrar Despesa Variável';
  document.getElementById('btn-salvar-variavel').textContent = 'Registrar Despesa';
  document.getElementById('aviso-edicao-variavel').classList.remove('ativo');

  document.getElementById('var-categoria').value = '';
  document.getElementById('var-descricao').value = '';
  document.getElementById('var-valor').value = '';
  document.getElementById('var-data').value = dataDeHojeISO();
}

function destacarRegistro(id) {
  const item = document.querySelector(`.registro-item[data-id="${id}"]`);
  if (!item) return;

  const grupo = item.closest('.categoria-grupo');
  if (grupo && grupo.classList.contains('colapsado')) {
    grupo.classList.remove('colapsado');
    definirCategoriasColapsadas(obterCategoriasColapsadas().filter(c => c !== grupo.dataset.categoria));
  }

  item.classList.remove('destaque');
  void item.offsetWidth; // reinicia a animação
  item.classList.add('destaque');
  item.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removerDespesaVariavel(id) {
  if (!confirm('Tem certeza que deseja remover esta despesa?')) return;

  if (id === despesaVariavelEmEdicaoId) {
    cancelarEdicaoVariavel();
  }

  const despesas = obterDespesasVariaveis().filter(d => d.id !== id);
  salvarDespesasVariaveis(despesas);
  carregarDespesasVariaveis();
}

function carregarDespesasVariaveis() {
  migrarFaturasDeCartao();

  const despesas = obterDespesasVariaveis();
  const container = document.getElementById('historico-container');

  // Calcular resumos
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  const despesasMesAtual = despesas.filter(d => (d.data || '').slice(0, 7) === mesAtual);
  const totalMesAtual = despesasMesAtual.reduce((sum, d) => sum + d.valor, 0);

  // Média mensal dos últimos 3 meses de calendário (atual + 2 anteriores),
  // dividida pelo número de meses que realmente têm lançamento (1 a 3).
  const chavesUltimos3Meses = [];
  for (let i = 0; i < 3; i++) {
    const m = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    chavesUltimos3Meses.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  const totaisPorMes = {};
  despesas.forEach(d => {
    const chave = (d.data || '').slice(0, 7);
    if (chavesUltimos3Meses.includes(chave)) {
      totaisPorMes[chave] = (totaisPorMes[chave] || 0) + d.valor;
    }
  });
  const mesesComLancamento = Object.keys(totaisPorMes).length;
  const media3Meses = mesesComLancamento > 0
    ? Object.values(totaisPorMes).reduce((sum, v) => sum + v, 0) / mesesComLancamento
    : 0;

  const totalGeral = despesas.reduce((sum, d) => sum + d.valor, 0);

  document.getElementById('total-mes-atual').textContent = formatarMoedaBrasileira(totalMesAtual);
  document.getElementById('media-3-meses').textContent = formatarMoedaBrasileira(media3Meses);
  document.getElementById('total-geral').textContent = formatarMoedaBrasileira(totalGeral);

  if (despesas.length === 0) {
    container.innerHTML = '<div class="lista-vazia"><p>Nenhuma despesa variável registrada ainda.</p></div>';
    return;
  }

  // Agrupar por categoria
  const agrupadas = {};
  despesas.forEach(d => {
    if (!agrupadas[d.categoria]) {
      agrupadas[d.categoria] = [];
    }
    agrupadas[d.categoria].push(d);
  });

  // Ordenar por categoria e depois por data (mais recente primeiro)
  const categoriasOrdenadas = Object.keys(agrupadas).sort();
  const colapsadas = obterCategoriasColapsadas();

  container.innerHTML = categoriasOrdenadas.map(categoria => {
    const despesasDaCategoria = agrupadas[categoria].sort((a, b) => new Date(b.data + 'T00:00:00') - new Date(a.data + 'T00:00:00'));
    const totalCategoria = despesasDaCategoria.reduce((sum, d) => sum + d.valor, 0);
    const mediaCategoria = totalCategoria / despesasDaCategoria.length;
    const rotulo = escaparTexto(CATEGORIAS[categoria] || categoria);
    const estaColapsada = colapsadas.includes(categoria);

    return `
      <div class="categoria-grupo${estaColapsada ? ' colapsado' : ''}" data-categoria="${categoria}">
        <div class="categoria-titulo" onclick="toggleCategoria('${categoria}')">
          <span><span class="categoria-chevron">▾</span>${rotulo}</span>
          <span class="categoria-media">Média: ${formatarMoedaBrasileira(mediaCategoria)}</span>
        </div>
        <div class="registros-categoria">
          ${despesasDaCategoria.map(d => {
            const nome = escaparTexto(d.descricao || CATEGORIAS[d.categoria] || d.categoria);
            return `
            <div class="registro-item" data-id="${d.id}">
              <div class="registro-info">
                <div>${nome}</div>
                <div class="registro-data">${new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
              </div>
              <div class="registro-valor">${formatarMoedaBrasileira(d.valor)}</div>
              <div class="registro-acoes">
                <button type="button" class="btn-editar" onclick="editarDespesaVariavel(${d.id})" aria-label="Editar despesa" title="Editar">${icone('lapis')}</button>
                <button type="button" class="btn-remover" onclick="removerDespesaVariavel(${d.id})" aria-label="Remover despesa" title="Remover">${icone('lixeira')}</button>
              </div>
            </div>`;
          }).join('')}
          <div style="margin-top: var(--espacamento-md); padding-top: var(--espacamento-md); border-top: 1px solid var(--cor-borda); font-weight: bold; display: flex; justify-content: space-between;">
            <span>Total ${rotulo}</span>
            <span>${formatarMoedaBrasileira(totalCategoria)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', carregarDespesasVariaveis);
