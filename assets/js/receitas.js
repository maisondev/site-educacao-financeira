// Gestão de receitas (extrato de tudo que entrou) — persistência em localStorage via Store.

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

// Tipos que se repetem ano a ano — usados no comparativo sazonal
const TIPOS_SAZONAIS = ['ferias', 'decimo', 'bonus', 'restituicao'];

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/* ------------------------------------------------------------------ *
 * Acesso a dados
 * ------------------------------------------------------------------ */

function obterReceitas() {
  return Store.ler(Store.CHAVES.RECEITAS, []);
}

function salvarReceitas(receitas) {
  return Store.gravar(Store.CHAVES.RECEITAS, receitas);
}

function gerarId() {
  return 'r-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// "2026-08-15" precisa virar uma data local, não UTC (evita o registro
// aparecer no mês anterior em fusos negativos).
function parseDataLocal(str) {
  if (typeof str === 'string') {
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(str);
}

function escaparHtmlReceita(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

function exibirMensagem(elementoId, tipo, texto) {
  const el = document.getElementById(elementoId);
  if (!el) return;
  el.innerHTML = `<div class="mensagem-${tipo}">${escaparHtmlReceita(texto)}</div>`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.innerHTML = ''; }, 5000);
}

/* ------------------------------------------------------------------ *
 * Importação de contracheques
 * ------------------------------------------------------------------ */

function importarSalarios() {
  const contracheques = Store.ler(Store.CHAVES.CONTRACHEQUES, []);
  const receitas = obterReceitas();

  if (contracheques.length === 0) {
    exibirMensagem('msg-importacao', 'aviso',
      'Nenhum contracheque registrado. Acesse "Análise de Contracheque" para adicionar.');
    return;
  }

  // Competências de salário que já existem aqui (por metadata ou pelo campo competencia)
  const competenciasExistentes = new Set();
  receitas.forEach(r => {
    if (r.tipo !== 'salario') return;
    if (r.metadata && r.metadata.competencia) competenciasExistentes.add(r.metadata.competencia);
    if (r.competencia) competenciasExistentes.add(r.competencia);
  });

  let importados = 0;
  contracheques.forEach(ch => {
    const competencia = ch.competencia; // "DD/MM/YYYY"
    const liquido = Number(ch.salarioLiquido) || 0;
    if (!competencia || liquido <= 0) return;

    const partes = competencia.split('/');
    if (partes.length !== 3) return;
    const [dia, mes, ano] = partes;
    const competenciaISO = `${ano}-${mes}`;

    if (competenciasExistentes.has(competencia) || competenciasExistentes.has(competenciaISO)) return;

    receitas.push({
      id: gerarId(),
      nome: `Salário de ${MESES[parseInt(mes, 10) - 1]}/${ano}`,
      tipo: 'salario',
      valor: liquido,
      data: `${ano}-${mes}-${dia}`,
      competencia: competenciaISO,
      destino: 'Importado de Contracheque',
      dataCriacao: new Date().toISOString(),
      metadata: { competencia }
    });
    competenciasExistentes.add(competencia);
    competenciasExistentes.add(competenciaISO);
    importados++;
  });

  if (importados === 0) {
    exibirMensagem('msg-importacao', 'info',
      'Todos os salários dos contracheques já estão registrados aqui.');
    return;
  }

  if (salvarReceitas(receitas)) {
    renderizarReceitas();
    exibirMensagem('msg-importacao', 'sucesso',
      `${importados} salário(s) importado(s) com sucesso.`);
  }
}

/* ------------------------------------------------------------------ *
 * Formulário: adicionar
 * ------------------------------------------------------------------ */

function lerFormulario(prefixo) {
  return {
    nome: document.getElementById(`${prefixo}-nome`).value.trim(),
    tipo: document.getElementById(`${prefixo}-tipo`).value,
    valor: parseValorBrasileiro(document.getElementById(`${prefixo}-valor`).value),
    data: document.getElementById(`${prefixo}-data`).value,
    destino: document.getElementById(`${prefixo}-destino`).value.trim()
  };
}

// Marca campos inválidos e devolve a primeira mensagem de erro (ou null).
function validarDados(dados, prefixo) {
  const marcar = (campo, invalido) => {
    document.getElementById(`${prefixo}-${campo}`).classList.toggle('campo-invalido', invalido);
  };
  marcar('nome', false); marcar('valor', false); marcar('data', false);

  if (!dados.nome) { marcar('nome', true); return 'Informe uma descrição.'; }
  if (!dados.valor || dados.valor <= 0) { marcar('valor', true); return 'Informe um valor válido.'; }
  if (!dados.data) { marcar('data', true); return 'Selecione a data do recebimento.'; }
  return null;
}

function adicionarReceita(evento) {
  if (evento) evento.preventDefault();

  const dados = lerFormulario('receita');
  const erro = validarDados(dados, 'receita');
  if (erro) {
    exibirMensagem('msg-receita', 'erro', erro);
    return;
  }

  const receitas = obterReceitas();
  receitas.push({
    id: gerarId(),
    nome: dados.nome,
    tipo: dados.tipo,
    valor: dados.valor,
    data: dados.data,
    competencia: dados.data.slice(0, 7),
    destino: dados.destino,
    dataCriacao: new Date().toISOString()
  });

  if (!salvarReceitas(receitas)) return;

  document.getElementById('form-receita').reset();
  document.getElementById('receita-nome').focus();
  renderizarReceitas();
  exibirMensagem('msg-receita', 'sucesso',
    `Receita registrada: ${dados.nome} — ${formatarMoedaBrasileira(dados.valor)}.`);
}

function removerReceita(id) {
  if (!confirm('Tem certeza que deseja remover esta receita?')) return;
  const receitas = obterReceitas().filter(r => String(r.id) !== String(id));
  if (salvarReceitas(receitas)) renderizarReceitas();
}

/* ------------------------------------------------------------------ *
 * Formulário: editar (modal)
 * ------------------------------------------------------------------ */

function abrirEdicao(id) {
  const receita = obterReceitas().find(r => String(r.id) === String(id));
  if (!receita) return;

  document.getElementById('edit-id').value = receita.id;
  document.getElementById('edit-nome').value = receita.nome || '';
  document.getElementById('edit-tipo').value = receita.tipo || 'outro';
  document.getElementById('edit-valor').value = formatarNumeroBrasileiro(receita.valor || 0);
  document.getElementById('edit-data').value = receita.data || '';
  document.getElementById('edit-destino').value = receita.destino || '';

  document.getElementById('modal-edicao').removeAttribute('hidden');
  document.getElementById('edit-nome').focus();
}

function fecharModalEdicao() {
  document.getElementById('modal-edicao').setAttribute('hidden', '');
}

function salvarEdicao(evento) {
  evento.preventDefault();

  const id = document.getElementById('edit-id').value;
  const dados = lerFormulario('edit');
  const erro = validarDados(dados, 'edit');
  if (erro) {
    alert(erro);
    return;
  }

  const receitas = obterReceitas();
  const receita = receitas.find(r => String(r.id) === String(id));
  if (!receita) return;

  receita.nome = dados.nome;
  receita.tipo = dados.tipo;
  receita.valor = dados.valor;
  receita.data = dados.data;
  receita.competencia = dados.data.slice(0, 7);
  receita.destino = dados.destino;

  if (!salvarReceitas(receitas)) return;
  fecharModalEdicao();
  renderizarReceitas();
}

/* ------------------------------------------------------------------ *
 * Exportação CSV
 * ------------------------------------------------------------------ */

function exportarReceitasCSV() {
  const anoFiltro = document.getElementById('filtro-ano').value;
  const receitas = obterReceitas()
    .filter(r => !anoFiltro || parseDataLocal(r.data).getFullYear() === Number(anoFiltro))
    .sort((a, b) => parseDataLocal(a.data) - parseDataLocal(b.data));

  if (receitas.length === 0) {
    alert('Nenhuma receita para exportar.');
    return;
  }

  const escapar = (v) => {
    const s = String(v == null ? '' : v);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const linhas = [['Data', 'Tipo', 'Descrição', 'Valor', 'Destino']];
  receitas.forEach(r => {
    linhas.push([
      parseDataLocal(r.data).toLocaleDateString('pt-BR'),
      ROTULOS_TIPO_RECEITA[r.tipo] || r.tipo,
      r.nome,
      formatarNumeroBrasileiro(r.valor),
      r.destino || ''
    ]);
  });

  const csv = '﻿' + linhas.map(l => l.map(escapar).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receitas-${anoFiltro || 'todos'}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function renderizarReceitas() {
  const receitas = obterReceitas();
  const lista = document.getElementById('lista-receitas');
  const filtroAnoSelect = document.getElementById('filtro-ano');
  const hoje = new Date();

  // --- Select de anos: sempre reconstruído, preservando a seleção atual ---
  const anoSelecionado = filtroAnoSelect.value;
  const anosUnicos = [...new Set(receitas.map(r => parseDataLocal(r.data).getFullYear()))]
    .sort((a, b) => b - a);
  filtroAnoSelect.innerHTML = '<option value="">Todos os anos</option>' +
    anosUnicos.map(ano => `<option value="${ano}">${ano}</option>`).join('');
  filtroAnoSelect.value = anosUnicos.includes(Number(anoSelecionado)) ? anoSelecionado : '';

  const anoFiltro = filtroAnoSelect.value ? Number(filtroAnoSelect.value) : null;
  const receitasFiltradas = anoFiltro
    ? receitas.filter(r => parseDataLocal(r.data).getFullYear() === anoFiltro)
    : receitas;

  // --- Cards de resumo (sempre relativos ao ano corrente) ---
  const doAnoAtual = receitas.filter(r => parseDataLocal(r.data).getFullYear() === hoje.getFullYear());
  const totalAno = doAnoAtual.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const totalMes = doAnoAtual
    .filter(r => parseDataLocal(r.data).getMonth() === hoje.getMonth())
    .reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const mesesDecorridos = hoje.getMonth() + 1;

  document.getElementById('resumo-total-ano').textContent = formatarMoedaBrasileira(totalAno);
  document.getElementById('resumo-total-mes').textContent = formatarMoedaBrasileira(totalMes);
  document.getElementById('resumo-media-mes').textContent = formatarMoedaBrasileira(totalAno / mesesDecorridos);
  document.getElementById('resumo-quantidade').textContent = receitas.length;

  renderizarGrafico(receitasFiltradas, anoFiltro || hoje.getFullYear());
  renderizarComparativoSazonal(receitas);

  // --- Lista agrupada por mês ---
  if (receitasFiltradas.length === 0) {
    lista.innerHTML = '<div class="lista-vazia"><p>Nenhuma receita registrada.</p></div>';
    return;
  }

  const agrupado = {};
  receitasFiltradas.forEach(r => {
    const data = parseDataLocal(r.data);
    const chave = `${data.getFullYear()}-${data.getMonth()}`;
    if (!agrupado[chave]) {
      agrupado[chave] = { ano: data.getFullYear(), mes: data.getMonth(), receitas: [], total: 0 };
    }
    agrupado[chave].receitas.push(r);
    agrupado[chave].total += Number(r.valor) || 0;
  });

  const periodos = Object.values(agrupado).sort((a, b) =>
    b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes);

  lista.innerHTML = periodos.map(periodo => {
    const itens = [...periodo.receitas].sort((a, b) => parseDataLocal(b.data) - parseDataLocal(a.data));
    return `
      <div class="secao-periodo">
        <div class="periodo-titulo">
          <span>${MESES[periodo.mes]} de ${periodo.ano}</span>
          <span class="periodo-subtotal">${formatarMoedaBrasileira(periodo.total)}</span>
        </div>
        <div class="receitas-periodo">
          ${itens.map(r => `
            <div class="item-receita">
              <div>
                <div class="item-receita-titulo">
                  <span class="item-receita-tipo">${ROTULOS_TIPO_RECEITA[r.tipo] || escaparHtmlReceita(r.tipo)}</span>
                  ${escaparHtmlReceita(r.nome)}
                </div>
                <div class="item-receita-meta">
                  ${parseDataLocal(r.data).toLocaleDateString('pt-BR')}${r.destino ? ' &middot; ' + escaparHtmlReceita(r.destino) : ''}
                </div>
              </div>
              <div class="item-receita-acoes">
                <span class="item-receita-valor">${formatarMoedaBrasileira(r.valor)}</span>
                <button type="button" class="btn-icone" onclick="abrirEdicao('${r.id}')" title="Editar" aria-label="Editar">${icone('lapis', 16)}</button>
                <button type="button" class="btn-icone remover" onclick="removerReceita('${r.id}')" title="Remover" aria-label="Remover">${icone('lixeira', 16)}</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderizarGrafico(receitas, ano) {
  const secao = document.getElementById('secao-grafico');
  const grafico = document.getElementById('grafico-mensal');
  const labels = document.getElementById('grafico-labels');

  const porMes = new Array(12).fill(0);
  receitas.forEach(r => {
    const d = parseDataLocal(r.data);
    if (d.getFullYear() === ano) porMes[d.getMonth()] += Number(r.valor) || 0;
  });

  const max = Math.max(...porMes);
  if (max === 0) {
    secao.setAttribute('hidden', '');
    return;
  }
  secao.removeAttribute('hidden');

  grafico.innerHTML = porMes.map((valor, i) => {
    const altura = valor > 0 ? Math.max(2, Math.round((valor / max) * 100)) : 0;
    const rotulo = valor > 0 ? formatarMoedaBrasileira(valor) : 'Sem receitas';
    let curto = '';
    if (valor >= 1000) curto = 'R$ ' + Math.round(valor / 1000) + 'k';
    else if (valor > 0) curto = 'R$ ' + Math.round(valor);
    return `
      <div class="grafico-coluna" title="${MESES[i]} de ${ano}: ${rotulo}">
        <span class="grafico-valor">${curto}</span>
        <div class="grafico-barra" style="height: ${altura}%"></div>
      </div>`;
  }).join('');

  labels.innerHTML = MESES_CURTOS.map(m => `<span>${m}</span>`).join('');
}

function renderizarComparativoSazonal(receitas) {
  const secao = document.getElementById('secao-sazonais');
  const tabela = document.getElementById('tabela-sazonais');

  const sazonais = receitas.filter(r => TIPOS_SAZONAIS.includes(r.tipo));
  const anos = [...new Set(sazonais.map(r => parseDataLocal(r.data).getFullYear()))].sort((a, b) => a - b);

  if (sazonais.length === 0 || anos.length === 0) {
    secao.setAttribute('hidden', '');
    return;
  }
  secao.removeAttribute('hidden');

  // matriz[tipo][ano] = soma
  const matriz = {};
  TIPOS_SAZONAIS.forEach(t => { matriz[t] = {}; });
  sazonais.forEach(r => {
    const ano = parseDataLocal(r.data).getFullYear();
    matriz[r.tipo][ano] = (matriz[r.tipo][ano] || 0) + (Number(r.valor) || 0);
  });

  const cabecalho = '<tr><th>Tipo</th>' + anos.map(a => `<th>${a}</th>`).join('') + '</tr>';

  const linhas = TIPOS_SAZONAIS
    .filter(tipo => anos.some(a => matriz[tipo][a]))
    .map(tipo => {
      const celulas = anos.map(a =>
        `<td>${matriz[tipo][a] ? formatarMoedaBrasileira(matriz[tipo][a]) : '—'}</td>`).join('');
      return `<tr><td>${ROTULOS_TIPO_RECEITA[tipo]}</td>${celulas}</tr>`;
    }).join('');

  const totais = anos.map(a => {
    const total = TIPOS_SAZONAIS.reduce((s, t) => s + (matriz[t][a] || 0), 0);
    return `<td><strong>${formatarMoedaBrasileira(total)}</strong></td>`;
  }).join('');
  const linhaTotal = `<tr><td><strong>Total sazonal</strong></td>${totais}</tr>`;

  tabela.innerHTML = cabecalho + linhas + linhaTotal;
}

/* ------------------------------------------------------------------ *
 * Bootstrap
 * ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', function() {
  renderizarReceitas();

  document.getElementById('form-receita').addEventListener('submit', adicionarReceita);
  document.getElementById('form-edicao').addEventListener('submit', salvarEdicao);

  const modal = document.getElementById('modal-edicao');
  modal.addEventListener('click', e => { if (e.target === modal) fecharModalEdicao(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) fecharModalEdicao();
  });
});
