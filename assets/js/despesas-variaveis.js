const CHAVE_DESPESAS_VARIAVEIS = 'despesas_variaveis';

const CATEGORIAS = {
  agua: 'Água',
  luz: 'Luz / Energia',
  gas: 'Gás',
  internet: 'Internet',
  telefone: 'Telefone',
  streaming: 'Streaming',
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  cartao: 'Cartão',
  outro: 'Outro'
};

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

function adicionarDespesaDeCartao(descricao, valor, data, ultimosDígitos) {
  const despesas = obterDespesasVariaveis();
  const obj = {
    id: Date.now(),
    categoria: 'cartao',
    descricao,
    valor,
    data,
    dataCriacao: new Date().toISOString()
  };
  if (ultimosDígitos) {
    obj.ultimosDígitos = ultimosDígitos;
  }
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

function adicionarDespesaVariavel() {
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
  despesas.push({
    id: Date.now(),
    categoria,
    descricao,
    valor,
    data,
    dataCriacao: new Date().toISOString()
  });

  salvarDespesasVariaveis(despesas);

  document.getElementById('var-categoria').value = '';
  document.getElementById('var-descricao').value = '';
  document.getElementById('var-valor').value = '';
  document.getElementById('var-data').value = '';

  carregarDespesasVariaveis();
  alert('Despesa registrada com sucesso!');
}

function removerDespesaVariavel(id) {
  if (!confirm('Tem certeza que deseja remover esta despesa?')) return;

  const despesas = obterDespesasVariaveis().filter(d => d.id !== id);
  salvarDespesasVariaveis(despesas);
  carregarDespesasVariaveis();
}

function carregarDespesasVariaveis() {
  const despesas = obterDespesasVariaveis();
  const container = document.getElementById('historico-container');

  // Calcular resumos
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  const despesasMesAtual = despesas.filter(d => {
    const [ano, mes] = d.data.split('-');
    return `${ano}-${mes}` === mesAtual;
  });
  const totalMesAtual = despesasMesAtual.reduce((sum, d) => sum + d.valor, 0);

  // Média dos últimos 3 meses
  const ultimo3Meses = despesas.filter(d => {
    const dataDespesa = new Date(d.data);
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 3);
    return dataDespesa >= dataLimite;
  });
  const media3Meses = ultimo3Meses.length > 0 ? ultimo3Meses.reduce((sum, d) => sum + d.valor, 0) / 3 : 0;

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

  container.innerHTML = categoriasOrdenadas.map(categoria => {
    const despesasDaCategoria = agrupadas[categoria].sort((a, b) => new Date(b.data) - new Date(a.data));
    const totalCategoria = despesasDaCategoria.reduce((sum, d) => sum + d.valor, 0);
    const mediaCategoria = totalCategoria / despesasDaCategoria.length;

    return `
      <div class="categoria-grupo">
        <div class="categoria-titulo">
          <span>${CATEGORIAS[categoria] || categoria}</span>
          <span class="categoria-media">Média: ${formatarMoedaBrasileira(mediaCategoria)}</span>
        </div>
        <div class="registros-categoria">
          ${despesasDaCategoria.map(d => `
            <div class="registro-item">
              <div class="registro-info">
                <div>${d.descricao || CATEGORIAS[d.categoria]}</div>
                <div class="registro-data">${new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
              </div>
              <div class="registro-valor">${formatarMoedaBrasileira(d.valor)}</div>
              <button type="button" class="btn-remover" onclick="removerDespesaVariavel(${d.id})" title="Remover">×</button>
            </div>
          `).join('')}
          <div style="margin-top: var(--espacamento-md); padding-top: var(--espacamento-md); border-top: 1px solid var(--cor-borda); font-weight: bold; display: flex; justify-content: space-between;">
            <span>Total ${CATEGORIAS[categoria]}</span>
            <span>${formatarMoedaBrasileira(totalCategoria)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', carregarDespesasVariaveis);
