const CHAVE_RECEITAS = 'receitas_lista';
const CHAVE_CONTRACHEQUES = 'contracheques_historico';

const ROTULOS_TIPO_RECEITA = {
  salario: 'Salário',
  ferias: 'Férias',
  decimo: '13º Salário',
  bonus: 'Bônus/PLR',
  diferenca_salarial: 'Diferença Salarial / ACT',
  restituicao: 'Restituição IR',
  venda: 'Venda',
  outro: 'Outro'
};

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function obterReceitas() {
  try {
    const dados = localStorage.getItem(CHAVE_RECEITAS);
    return dados ? JSON.parse(dados) : [];
  } catch (erro) {
    console.error('Erro ao carregar receitas:', erro);
    return [];
  }
}

function salvarReceitas(receitas) {
  localStorage.setItem(CHAVE_RECEITAS, JSON.stringify(receitas));
}

function importarSalarios() {
  try {
    const contracheques = JSON.parse(localStorage.getItem(CHAVE_CONTRACHEQUES) || '[]');
    const receitas = obterReceitas();
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();

    if (contracheques.length === 0) {
      alert('Nenhum contracheque registrado. Acesse "Análise de Contracheque" para adicionar.');
      return;
    }

    let importados = 0;
    const competenciasJaImportadas = new Set();

    // Verificar quais competências já foram importadas
    receitas.forEach(r => {
      if (r.tipo === 'salario' && r.metadata && r.metadata.competencia) {
        competenciasJaImportadas.add(r.metadata.competencia);
      }
    });

    // Importar contracheques do ano atual
    contracheques.forEach(ch => {
      const competencia = ch.competencia; // Formato: "DD/MM/YYYY"
      if (competencia && !competenciasJaImportadas.has(competencia) && ch.salarioLiquido > 0) {
        const [dia, mes, ano] = competencia.split('/');
        const dataReceita = `${ano}-${mes}-${dia}`;

        receitas.push({
          id: Date.now() + importados,
          nome: `Salário de ${MESES[parseInt(mes) - 1]}/${ano}`,
          tipo: 'salario',
          valor: ch.salarioLiquido,
          data: dataReceita,
          destino: 'Importado de Contracheque',
          dataCriacao: new Date().toISOString(),
          metadata: { competencia }
        });
        importados++;
      }
    });

    if (importados > 0) {
      salvarReceitas(receitas);
      renderizarReceitas();
      const msg = document.getElementById('msg-importacao');
      msg.innerHTML = `<span style="color: #2e7d32; font-weight: bold;">${icone('check', 14)} ${importados} salário(s) importado(s) com sucesso!</span>`;
      setTimeout(() => { msg.innerHTML = ''; }, 5000);
    } else {
      const msg = document.getElementById('msg-importacao');
      msg.innerHTML = '<span style="color: #f57c00;">ℹ Todos os salários já foram importados ou não há salários para importar.</span>';
      setTimeout(() => { msg.innerHTML = ''; }, 5000);
    }
  } catch (erro) {
    console.error('Erro ao importar salários:', erro);
    alert('Erro ao importar salários. Verifique o console.');
  }
}

function adicionarReceita() {
  const nome = document.getElementById('receita-nome').value.trim();
  const tipo = document.getElementById('receita-tipo').value;
  const valor = parseValorBrasileiro(document.getElementById('receita-valor').value);
  const data = document.getElementById('receita-data').value;
  const destino = document.getElementById('receita-destino').value.trim();

  if (!nome) {
    alert('Por favor, insira uma descrição');
    return;
  }

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  if (!data) {
    alert('Por favor, selecione a data do recebimento');
    return;
  }

  const receitas = obterReceitas();
  receitas.push({
    id: Date.now(),
    nome,
    tipo,
    valor,
    data,
    destino,
    dataCriacao: new Date().toISOString()
  });

  salvarReceitas(receitas);

  document.getElementById('receita-nome').value = '';
  document.getElementById('receita-valor').value = '';
  document.getElementById('receita-data').value = '';
  document.getElementById('receita-destino').value = '';

  renderizarReceitas();
}

function removerReceita(id) {
  if (!confirm('Tem certeza que deseja remover esta receita?')) return;
  const receitas = obterReceitas().filter(r => r.id !== id);
  salvarReceitas(receitas);
  renderizarReceitas();
}

function renderizarReceitas() {
  const receitas = obterReceitas();
  const lista = document.getElementById('lista-receitas');
  const filtroAnoSelect = document.getElementById('filtro-ano');
  const anoFiltro = filtroAnoSelect.value ? parseInt(filtroAnoSelect.value) : null;

  const hoje = new Date();

  // Calcular resumos
  const receitasFiltradas = anoFiltro
    ? receitas.filter(r => new Date(r.data).getFullYear() === anoFiltro)
    : receitas;

  const totalAno = receitas
    .filter(r => new Date(r.data).getFullYear() === hoje.getFullYear())
    .reduce((sum, r) => sum + r.valor, 0);
  const totalMes = receitas
    .filter(r => {
      const d = new Date(r.data);
      return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
    })
    .reduce((sum, r) => sum + r.valor, 0);

  document.getElementById('resumo-total-ano').textContent = formatarMoedaReceita(totalAno);
  document.getElementById('resumo-total-mes').textContent = formatarMoedaReceita(totalMes);
  document.getElementById('resumo-quantidade').textContent = receitas.length;

  // Preencher select de anos
  const anosUnicos = [...new Set(receitas.map(r => new Date(r.data).getFullYear()))].sort((a, b) => b - a);
  const opcoesAtual = filtroAnoSelect.innerHTML;
  if (!opcoesAtual.includes('2024') && anosUnicos.length > 0) {
    // Reconstruir opções de ano
    let novasOpcoes = '<option value="">Todos os anos</option>';
    anosUnicos.forEach(ano => {
      novasOpcoes += `<option value="${ano}">${ano}</option>`;
    });
    filtroAnoSelect.innerHTML = novasOpcoes;
    if (anoFiltro) filtroAnoSelect.value = anoFiltro;
  }

  if (receitasFiltradas.length === 0) {
    lista.innerHTML = '<div class="lista-vazia"><p>Nenhuma receita registrada.</p></div>';
    return;
  }

  // Agrupar por período (ano/mês)
  const agrupado = {};
  receitasFiltradas.forEach(r => {
    const data = new Date(r.data);
    const ano = data.getFullYear();
    const mes = data.getMonth();
    const chave = `${ano}-${mes}`;

    if (!agrupado[chave]) {
      agrupado[chave] = {
        ano,
        mes,
        receitas: [],
        total: 0
      };
    }

    agrupado[chave].receitas.push(r);
    agrupado[chave].total += r.valor;
  });

  // Ordenar períodos do mais recente ao mais antigo
  const periodos = Object.values(agrupado).sort((a, b) => {
    if (b.ano !== a.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });

  // Renderizar períodos
  lista.innerHTML = periodos.map(periodo => {
    const receitasPeriodo = [...periodo.receitas].sort((a, b) => new Date(b.data) - new Date(a.data));

    return `
      <div class="secao-periodo">
        <div class="periodo-titulo">
          <span>${MESES[periodo.mes]} de ${periodo.ano}</span>
          <span class="periodo-subtotal">${formatarMoedaReceita(periodo.total)}</span>
        </div>
        <div class="receitas-periodo">
          ${receitasPeriodo.map(r => `
            <div class="item-receita">
              <div>
                <div class="item-receita-titulo">
                  <span class="item-receita-tipo">${ROTULOS_TIPO_RECEITA[r.tipo] || r.tipo}</span>
                  ${escaparHtmlReceita(r.nome)}
                </div>
                <div class="item-receita-meta">
                  ${new Date(r.data).toLocaleDateString('pt-BR')}${r.destino ? ' &middot; ' + escaparHtmlReceita(r.destino) : ''}
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="item-receita-valor">${formatarMoedaReceita(r.valor)}</span>
                <button type="button" class="btn-remover-receita" onclick="removerReceita(${r.id})" title="Remover">&times;</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function formatarMoedaReceita(valor) {
  return parseFloat(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escaparHtmlReceita(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', renderizarReceitas);
