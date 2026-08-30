// Gerenciar metas financeiras com localStorage

const TEXTO_PRAZO = { curto: 'Curto prazo', medio: 'Médio prazo', longo: 'Longo prazo' };
const ORDEM_PRAZO = { curto: 0, medio: 1, longo: 2 };
const MS_DIA = 86400000;
const DIAS_MES = 30.44;
const METAS_BACKUP_VERSAO = 1;

// Estado só da interface — não é persistido.
let ordenacaoAtual = 'valor-alvo';
let filtroPrazo = 'todos';
let mostrarConcluidas = false;

document.addEventListener('DOMContentLoaded', function () {
  renderizarMetas();

  const formNova = document.getElementById('formulario-nova-meta');
  if (formNova) formNova.addEventListener('submit', adicionarMeta);

  const formEdicao = document.getElementById('formulario-edicao');
  if (formEdicao) formEdicao.addEventListener('submit', salvarEdicao);

  const formAporte = document.getElementById('formulario-aporte');
  if (formAporte) formAporte.addEventListener('submit', salvarAporte);

  // Fechar qualquer modal ao clicar no fundo ou apertar Esc.
  document.querySelectorAll('.modal').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) fecharModais();
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharModais();
  });

  const selOrdenar = document.getElementById('ordenar-metas');
  if (selOrdenar) selOrdenar.addEventListener('change', function (e) {
    ordenacaoAtual = e.target.value;
    renderizarMetas();
  });

  const selFiltro = document.getElementById('filtrar-prazo');
  if (selFiltro) selFiltro.addEventListener('change', function (e) {
    filtroPrazo = e.target.value;
    renderizarMetas();
  });

  const btnExportar = document.getElementById('btn-exportar-metas');
  if (btnExportar) btnExportar.addEventListener('click', exportarMetas);

  const inputImportar = document.getElementById('input-importar-metas');
  const btnImportar = document.getElementById('btn-importar-metas');
  if (btnImportar && inputImportar) {
    btnImportar.addEventListener('click', function () { inputImportar.click(); });
    inputImportar.addEventListener('change', function (e) {
      importarMetas(e.target.files[0]);
      e.target.value = '';
    });
  }
});

// --- Acesso ao armazenamento --------------------------------------------------

function obterMetas() {
  return Store.ler(Store.CHAVES.METAS, []);
}

function salvarMetas(metas) {
  return Store.gravar(Store.CHAVES.METAS, metas);
}

// --- Cálculos ---------------------------------------------------------------

function numero(valor) {
  const n = Number(valor);
  return isNaN(n) ? 0 : n;
}

function aportesDe(meta) {
  return Array.isArray(meta.aportes) ? meta.aportes : [];
}

function progressoPct(meta) {
  const alvo = numero(meta.valorAlvo);
  return alvo > 0 ? (numero(meta.valorAtual) / alvo) * 100 : 0;
}

function estaConcluida(meta) {
  const alvo = numero(meta.valorAlvo);
  return alvo > 0 && numero(meta.valorAtual) >= alvo;
}

function classeBarra(pct) {
  if (pct >= 100) return 'barra-completa';
  if (pct >= 67) return 'barra-alta';
  if (pct >= 34) return 'barra-media';
  return 'barra-baixa';
}

function formatarBRL(valor) {
  return 'R$ ' + numero(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hojeMeiaNoite() {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate());
}

function dataHojeISO() {
  const h = new Date();
  return h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
}

function parseDataISO(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function formatarData(iso) {
  const d = parseDataISO(iso);
  return d ? d.toLocaleDateString('pt-BR') : '';
}

// Projeção de prazo: dias restantes, quanto guardar por mês e, se já houver
// aportes suficientes, a previsão de conclusão no ritmo atual.
function calcularProjecao(meta) {
  const alvo = numero(meta.valorAlvo);
  const falta = Math.max(0, alvo - numero(meta.valorAtual));
  const concluida = estaConcluida(meta);
  const dataLimite = parseDataISO(meta.data);

  const res = { falta: falta, concluida: concluida, diasRestantes: null, porMes: null, atrasada: false, ritmo: null };

  if (dataLimite && !concluida) {
    const dias = Math.round((dataLimite - hojeMeiaNoite()) / MS_DIA);
    res.diasRestantes = dias;
    if (dias < 0) {
      res.atrasada = true;
    } else if (falta > 0) {
      const meses = dias / DIAS_MES;
      res.porMes = meses >= 0.5 ? falta / meses : falta;
    }
  }

  const aportesComData = aportesDe(meta)
    .map(function (a) { return parseDataISO(a.data); })
    .filter(Boolean)
    .sort(function (x, y) { return x - y; });

  if (!concluida && falta > 0 && aportesComData.length >= 2) {
    const meses = Math.max((aportesComData[aportesComData.length - 1] - aportesComData[0]) / (MS_DIA * DIAS_MES), 0.03);
    const somaAportes = aportesDe(meta).reduce(function (s, a) { return s + numero(a.valor); }, 0);
    const ritmoMensal = somaAportes / meses;
    if (ritmoMensal > 0) {
      const previsao = new Date();
      previsao.setMonth(previsao.getMonth() + Math.ceil(falta / ritmoMensal));
      res.ritmo = { mensal: ritmoMensal, previsao: previsao };
    }
  }

  return res;
}

// --- Renderização ---------------------------------------------------------

function renderizarMetas() {
  const metas = obterMetas();
  const containerAtivas = document.getElementById('lista-metas');
  const controles = document.getElementById('controles-metas');
  const secaoConcluidas = document.getElementById('secao-concluidas');

  renderizarResumo(metas);
  if (controles) controles.hidden = metas.length === 0;

  if (metas.length === 0) {
    containerAtivas.innerHTML = '<div class="lista-vazia"><p>Nenhuma meta adicionada ainda. Crie sua primeira meta acima!</p></div>';
    if (secaoConcluidas) secaoConcluidas.hidden = true;
    return;
  }

  let ativas = metas.filter(function (m) { return !estaConcluida(m); });
  const concluidas = metas.filter(estaConcluida);

  if (filtroPrazo !== 'todos') {
    ativas = ativas.filter(function (m) { return m.prazo === filtroPrazo; });
  }

  ordenarMetas(ativas);
  ordenarMetas(concluidas);

  containerAtivas.innerHTML = ativas.length > 0
    ? ativas.map(criarCardMeta).join('')
    : '<div class="lista-vazia"><p>Nenhuma meta ativa com esse filtro.</p></div>';

  if (secaoConcluidas) {
    if (concluidas.length === 0) {
      secaoConcluidas.hidden = true;
    } else {
      secaoConcluidas.hidden = false;
      document.getElementById('contador-concluidas').textContent = concluidas.length;
      const listaConcluidas = document.getElementById('lista-concluidas');
      listaConcluidas.innerHTML = concluidas.map(criarCardMeta).join('');
      listaConcluidas.hidden = !mostrarConcluidas;
      document.getElementById('btn-toggle-concluidas').textContent = mostrarConcluidas ? 'Ocultar' : 'Mostrar';
    }
  }
}

function ordenarMetas(lista) {
  const criterios = {
    'valor-alvo': function (a, b) { return numero(b.valorAlvo) - numero(a.valorAlvo); },
    'progresso': function (a, b) { return progressoPct(b) - progressoPct(a); },
    'data-limite': function (a, b) {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return a.data.localeCompare(b.data);
    },
    'recente': function (a, b) { return String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || '')); },
    'prazo': function (a, b) {
      const oa = ORDEM_PRAZO[a.prazo] === undefined ? 9 : ORDEM_PRAZO[a.prazo];
      const ob = ORDEM_PRAZO[b.prazo] === undefined ? 9 : ORDEM_PRAZO[b.prazo];
      return oa - ob;
    }
  };
  lista.sort(criterios[ordenacaoAtual] || criterios['valor-alvo']);
}

function renderizarResumo(metas) {
  const container = document.getElementById('resumo-metas');
  if (!container) return;

  if (metas.length === 0) {
    container.innerHTML = '';
    return;
  }

  const totalAlvo = metas.reduce(function (s, m) { return s + numero(m.valorAlvo); }, 0);
  const totalAtual = metas.reduce(function (s, m) { return s + numero(m.valorAtual); }, 0);
  const totalFalta = metas.reduce(function (s, m) {
    return s + Math.max(0, numero(m.valorAlvo) - numero(m.valorAtual));
  }, 0);
  const concluidas = metas.filter(estaConcluida).length;
  const progressoGeral = totalAlvo > 0 ? Math.min(100, (totalAtual / totalAlvo) * 100) : 0;

  container.innerHTML =
    '<div class="resumo-grid">' +
      '<div class="resumo-item">' +
        '<span class="resumo-label">Metas</span>' +
        '<strong class="resumo-valor">' + metas.length + '</strong>' +
        '<span class="resumo-sub">' + concluidas + ' concluída(s)</span>' +
      '</div>' +
      '<div class="resumo-item">' +
        '<span class="resumo-label">Já guardado</span>' +
        '<strong class="resumo-valor">' + formatarBRL(totalAtual) + '</strong>' +
        '<span class="resumo-sub">de ' + formatarBRL(totalAlvo) + '</span>' +
      '</div>' +
      '<div class="resumo-item">' +
        '<span class="resumo-label">Falta juntar</span>' +
        '<strong class="resumo-valor">' + formatarBRL(totalFalta) + '</strong>' +
      '</div>' +
      '<div class="resumo-item">' +
        '<span class="resumo-label">Progresso geral</span>' +
        '<strong class="resumo-valor">' + progressoGeral.toFixed(0) + '%</strong>' +
        '<div class="meta-progresso"><div class="meta-progresso-barra ' + classeBarra(progressoGeral) + '" style="width:' + progressoGeral + '%"></div></div>' +
      '</div>' +
    '</div>';
}

function blocoProjecao(meta) {
  const p = calcularProjecao(meta);
  if (p.concluida) return '';

  const partes = [];

  if (p.atrasada) {
    partes.push('<span class="proj-alerta">' + icone('relogio', 13) + 'Prazo vencido há ' + Math.abs(p.diasRestantes) + ' dia(s)</span>');
  } else if (p.diasRestantes !== null) {
    partes.push('<span>' + icone('relogio', 13) + 'Faltam ' + p.diasRestantes + ' dia(s)</span>');
    if (p.porMes !== null) {
      partes.push('<span>Guarde <strong>' + formatarBRL(p.porMes) + '/mês</strong> para bater o prazo</span>');
    }
  }

  if (p.ritmo) {
    const quando = p.ritmo.previsao.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    partes.push('<span>No ritmo atual (' + formatarBRL(p.ritmo.mensal) + '/mês), conclui em ' + quando + '</span>');
  }

  return partes.length ? '<div class="meta-projecao">' + partes.join('') + '</div>' : '';
}

function blocoHistorico(meta) {
  const aportes = aportesDe(meta).slice().sort(function (a, b) {
    return String(b.data || '').localeCompare(String(a.data || ''));
  });
  if (aportes.length === 0) return '';

  const itens = aportes.map(function (a) {
    return '<li>' +
      '<span>' + (formatarData(a.data) || 'sem data') + '</span>' +
      '<span>' + formatarBRL(a.valor) + '</span>' +
      '<span class="aporte-nota">' + (a.nota ? escaparHTML(a.nota) : '') + '</span>' +
      '<button class="btn-remover-aporte" onclick="removerAporte(' + meta.id + ', ' + a.id + ')" aria-label="Remover aporte">' + icone('x', 13) + '</button>' +
    '</li>';
  }).join('');

  return '<details class="meta-historico">' +
    '<summary>Histórico de aportes (' + aportes.length + ')</summary>' +
    '<ul class="lista-aportes">' + itens + '</ul>' +
  '</details>';
}

function criarCardMeta(meta) {
  const progresso = progressoPct(meta);
  const progressoLimitado = Math.min(progresso, 100);
  const concluida = estaConcluida(meta);
  const textoPrazo = TEXTO_PRAZO[meta.prazo] || '';

  return '' +
    '<div class="card-meta' + (concluida ? ' card-meta-concluida' : '') + '">' +
      '<div class="meta-info">' +
        '<h3>' + escaparHTML(meta.titulo) + '</h3>' +
        '<span class="meta-nivel nivel-' + meta.prazo + '">' + textoPrazo + '</span>' +
        (meta.descricao ? '<p class="meta-descricao">' + escaparHTML(meta.descricao) + '</p>' : '') +
        '<div class="meta-status">' +
          '<div><strong>' + formatarBRL(meta.valorAtual) + '</strong> de ' + formatarBRL(meta.valorAlvo) + '</div>' +
          '<div>' + progressoLimitado.toFixed(0) + '%</div>' +
          (concluida ? '<div class="meta-atingida">' + icone('check', 14) + ' Atingida!</div>' : '') +
        '</div>' +
        '<div class="meta-progresso">' +
          '<div class="meta-progresso-barra ' + classeBarra(progresso) + '" style="width: ' + progressoLimitado + '%"></div>' +
        '</div>' +
        blocoProjecao(meta) +
        (meta.data ? '<p class="meta-descricao">Prazo: ' + formatarData(meta.data) + '</p>' : '') +
        blocoHistorico(meta) +
      '</div>' +
      '<div class="meta-acoes">' +
        '<button class="btn-aporte" onclick="abrirAporte(' + meta.id + ')">+ Aporte</button>' +
        '<button class="btn-editar" onclick="abrirEdicao(' + meta.id + ')">Editar</button>' +
        '<button class="btn-deletar" onclick="deletarMeta(' + meta.id + ')">Deletar</button>' +
      '</div>' +
    '</div>';
}

// --- Adicionar / editar meta -------------------------------------------------

function adicionarMeta(event) {
  if (event) event.preventDefault();

  const titulo = document.getElementById('meta-titulo').value.trim();
  const descricao = document.getElementById('meta-descricao').value.trim();
  const valorAlvo = parseFloat(document.getElementById('meta-valor-alvo').value);
  const valorAtual = parseFloat(document.getElementById('meta-valor-atual').value);
  const prazo = document.getElementById('meta-prazo').value;
  const data = document.getElementById('meta-data').value;

  const erros = [];
  if (!titulo) erros.push({ campo: 'meta-titulo', msg: 'Dê um título para a meta.' });
  if (!valorAlvo || valorAlvo <= 0) erros.push({ campo: 'meta-valor-alvo', msg: 'Informe um valor alvo maior que zero.' });
  if (!prazo) erros.push({ campo: 'meta-prazo', msg: 'Selecione um prazo.' });
  if (mostrarErros('formulario-nova-meta', erros)) return;

  const meta = {
    id: Date.now(),
    titulo: titulo,
    descricao: descricao,
    valorAlvo: valorAlvo,
    valorAtual: valorAtual > 0 ? valorAtual : 0,
    prazo: prazo,
    data: data || null,
    dataCriacao: new Date().toISOString(),
    aportes: []
  };

  const metas = obterMetas();
  metas.push(meta);
  if (!salvarMetas(metas)) return;

  limparFormulario();
  renderizarMetas();
  mostrarToast('Meta adicionada.', 'sucesso');
}

function abrirEdicao(id) {
  const meta = obterMetas().find(function (m) { return m.id === id; });
  if (!meta) return;

  document.getElementById('edit-meta-id').value = meta.id;
  document.getElementById('edit-titulo').value = meta.titulo;
  document.getElementById('edit-descricao').value = meta.descricao || '';
  document.getElementById('edit-valor-alvo').value = meta.valorAlvo;
  document.getElementById('edit-valor-atual').value = meta.valorAtual;
  document.getElementById('edit-prazo').value = meta.prazo;
  document.getElementById('edit-data').value = meta.data || '';

  limparErros('formulario-edicao');
  abrirModal('modal-edicao');
  document.getElementById('edit-titulo').focus();
}

function salvarEdicao(event) {
  event.preventDefault();

  const metaId = parseInt(document.getElementById('edit-meta-id').value, 10);
  const titulo = document.getElementById('edit-titulo').value.trim();
  const descricao = document.getElementById('edit-descricao').value.trim();
  const valorAlvo = parseFloat(document.getElementById('edit-valor-alvo').value);
  const valorAtual = parseFloat(document.getElementById('edit-valor-atual').value);
  const prazo = document.getElementById('edit-prazo').value;
  const data = document.getElementById('edit-data').value;

  const erros = [];
  if (!titulo) erros.push({ campo: 'edit-titulo', msg: 'Dê um título para a meta.' });
  if (!valorAlvo || valorAlvo <= 0) erros.push({ campo: 'edit-valor-alvo', msg: 'Informe um valor alvo maior que zero.' });
  if (isNaN(valorAtual) || valorAtual < 0) erros.push({ campo: 'edit-valor-atual', msg: 'O valor guardado não pode ser negativo.' });
  if (!prazo) erros.push({ campo: 'edit-prazo', msg: 'Selecione um prazo.' });
  if (mostrarErros('formulario-edicao', erros)) return;

  const metas = obterMetas();
  const meta = metas.find(function (m) { return m.id === metaId; });
  if (!meta) return;

  meta.titulo = titulo;
  meta.descricao = descricao;
  meta.valorAlvo = valorAlvo;
  meta.valorAtual = valorAtual;
  meta.prazo = prazo;
  meta.data = data || null;

  if (!salvarMetas(metas)) return;
  fecharModais();
  renderizarMetas();
  mostrarToast('Meta atualizada.', 'sucesso');
}

function deletarMeta(id) {
  const meta = obterMetas().find(function (m) { return m.id === id; });
  if (!meta) return;

  confirmar('Deletar a meta "' + meta.titulo + '"? Esta ação não pode ser desfeita.', function () {
    const metas = obterMetas().filter(function (m) { return m.id !== id; });
    salvarMetas(metas);
    renderizarMetas();
    mostrarToast('Meta deletada.', 'sucesso');
  });
}

function limparFormulario() {
  document.getElementById('meta-titulo').value = '';
  document.getElementById('meta-descricao').value = '';
  document.getElementById('meta-valor-alvo').value = '';
  document.getElementById('meta-valor-atual').value = '0';
  document.getElementById('meta-prazo').value = '';
  document.getElementById('meta-data').value = '';
  limparErros('formulario-nova-meta');
  document.getElementById('meta-titulo').focus();
}

// --- Aportes --------------------------------------------------------------

function abrirAporte(id) {
  const meta = obterMetas().find(function (m) { return m.id === id; });
  if (!meta) return;

  document.getElementById('aporte-meta-id').value = meta.id;
  document.getElementById('aporte-meta-titulo').textContent = meta.titulo;
  document.getElementById('aporte-valor').value = '';
  document.getElementById('aporte-data').value = dataHojeISO();
  document.getElementById('aporte-nota').value = '';

  limparErros('formulario-aporte');
  abrirModal('modal-aporte');
  document.getElementById('aporte-valor').focus();
}

function salvarAporte(event) {
  event.preventDefault();

  const metaId = parseInt(document.getElementById('aporte-meta-id').value, 10);
  const valor = parseFloat(document.getElementById('aporte-valor').value);
  const data = document.getElementById('aporte-data').value;
  const nota = document.getElementById('aporte-nota').value.trim();

  const erros = [];
  if (!valor || valor <= 0) erros.push({ campo: 'aporte-valor', msg: 'Informe um valor maior que zero.' });
  if (!data) erros.push({ campo: 'aporte-data', msg: 'Informe a data do aporte.' });
  if (mostrarErros('formulario-aporte', erros)) return;

  const metas = obterMetas();
  const meta = metas.find(function (m) { return m.id === metaId; });
  if (!meta) return;

  if (!Array.isArray(meta.aportes)) meta.aportes = [];
  meta.aportes.push({ id: Date.now(), valor: valor, data: data, nota: nota || null });
  meta.valorAtual = numero(meta.valorAtual) + valor;

  if (!salvarMetas(metas)) return;
  fecharModais();
  renderizarMetas();
  mostrarToast('Aporte de ' + formatarBRL(valor) + ' registrado.', 'sucesso');
}

function removerAporte(metaId, aporteId) {
  confirmar('Remover este aporte? O valor será descontado do total guardado.', function () {
    const metas = obterMetas();
    const meta = metas.find(function (m) { return m.id === metaId; });
    if (!meta || !Array.isArray(meta.aportes)) return;

    const aporte = meta.aportes.find(function (a) { return a.id === aporteId; });
    if (!aporte) return;

    meta.aportes = meta.aportes.filter(function (a) { return a.id !== aporteId; });
    meta.valorAtual = Math.max(0, numero(meta.valorAtual) - numero(aporte.valor));

    salvarMetas(metas);
    renderizarMetas();
    mostrarToast('Aporte removido.', 'sucesso');
  });
}

function toggleConcluidas() {
  mostrarConcluidas = !mostrarConcluidas;
  renderizarMetas();
}

// --- Backup (só das metas) --------------------------------------------------

function exportarMetas() {
  const metas = obterMetas();
  if (metas.length === 0) {
    mostrarToast('Não há metas para exportar.', 'aviso');
    return;
  }

  const backup = {
    tipo: 'metas-financeiras',
    versao: METAS_BACKUP_VERSAO,
    geradoEm: new Date().toISOString(),
    metas: metas
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'metas-backup-' + dataHojeISO() + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  mostrarToast('Backup das metas exportado.', 'sucesso');
}

function importarMetas(arquivo) {
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = function () {
    let obj;
    try {
      obj = JSON.parse(leitor.result);
    } catch (e) {
      mostrarToast('Arquivo inválido: não é um JSON.', 'erro');
      return;
    }

    const lista = Array.isArray(obj) ? obj : (obj && obj.metas);
    if (!Array.isArray(lista)) {
      mostrarToast('O arquivo não contém uma lista de metas.', 'erro');
      return;
    }

    const validas = lista.filter(function (m) {
      return m && typeof m.titulo === 'string' && typeof m.valorAlvo === 'number';
    });
    if (validas.length === 0) {
      mostrarToast('Nenhuma meta válida encontrada no arquivo.', 'erro');
      return;
    }

    confirmar('Importar ' + validas.length + ' meta(s)? As metas atuais deste navegador serão substituídas.', function () {
      const normalizadas = validas.map(normalizarMetaImportada);
      salvarMetas(normalizadas);
      ordenacaoAtual = 'valor-alvo';
      filtroPrazo = 'todos';
      const selOrdenar = document.getElementById('ordenar-metas');
      const selFiltro = document.getElementById('filtrar-prazo');
      if (selOrdenar) selOrdenar.value = ordenacaoAtual;
      if (selFiltro) selFiltro.value = filtroPrazo;
      renderizarMetas();
      mostrarToast(normalizadas.length + ' meta(s) importada(s).', 'sucesso');
    });
  };
  leitor.onerror = function () { mostrarToast('Não foi possível ler o arquivo selecionado.', 'erro'); };
  leitor.readAsText(arquivo);
}

function idUnico() {
  return Date.now() + Math.floor(Math.random() * 100000);
}

function normalizarMetaImportada(m) {
  return {
    id: typeof m.id === 'number' ? m.id : idUnico(),
    titulo: String(m.titulo),
    descricao: typeof m.descricao === 'string' ? m.descricao : '',
    valorAlvo: numero(m.valorAlvo),
    valorAtual: numero(m.valorAtual),
    prazo: ORDEM_PRAZO[m.prazo] === undefined ? 'curto' : m.prazo,
    data: m.data || null,
    dataCriacao: m.dataCriacao || new Date().toISOString(),
    aportes: Array.isArray(m.aportes)
      ? m.aportes
          .filter(function (a) { return a && typeof a.valor === 'number'; })
          .map(function (a) {
            return {
              id: typeof a.id === 'number' ? a.id : idUnico(),
              valor: numero(a.valor),
              data: a.data || null,
              nota: typeof a.nota === 'string' ? a.nota : null
            };
          })
      : []
  };
}

// --- Modais, validação inline e toast --------------------------------------

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.hidden = false;
}

function fecharModais() {
  document.querySelectorAll('.modal').forEach(function (m) { m.hidden = true; });
  ['formulario-edicao', 'formulario-aporte'].forEach(function (fid) {
    const form = document.getElementById(fid);
    if (form) {
      form.reset();
      limparErros(fid);
    }
  });
}

// Confirmação sem popup do navegador. Recria o botão OK a cada chamada para
// não acumular ouvintes de confirmações anteriores.
function confirmar(mensagem, aoConfirmar) {
  const modal = document.getElementById('modal-confirmar');
  if (!modal) {
    if (window.confirm(mensagem)) aoConfirmar();
    return;
  }

  document.getElementById('confirmar-mensagem').textContent = mensagem;

  const btnOk = document.getElementById('confirmar-ok');
  const novo = btnOk.cloneNode(true);
  btnOk.parentNode.replaceChild(novo, btnOk);
  novo.addEventListener('click', function () {
    fecharModais();
    aoConfirmar();
  });

  abrirModal('modal-confirmar');
  novo.focus();
}

function limparErros(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.campo-invalido').forEach(function (el) { el.classList.remove('campo-invalido'); });
  const box = form.querySelector('.form-erros');
  if (box) {
    box.innerHTML = '';
    box.hidden = true;
  }
}

function mostrarErros(formId, erros) {
  limparErros(formId);
  if (!erros || erros.length === 0) return false;

  const form = document.getElementById(formId);
  erros.forEach(function (e) {
    const campo = document.getElementById(e.campo);
    if (campo) campo.classList.add('campo-invalido');
  });

  const box = form.querySelector('.form-erros');
  if (box) {
    box.innerHTML = erros.map(function (e) { return '<li>' + escaparHTML(e.msg) + '</li>'; }).join('');
    box.hidden = false;
  }

  const primeiro = document.getElementById(erros[0].campo);
  if (primeiro) primeiro.focus();
  return true;
}

function mostrarToast(mensagem, tipo) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'toast toast-' + (tipo || 'info');
  el.textContent = mensagem;
  container.appendChild(el);

  requestAnimationFrame(function () { el.classList.add('toast-visivel'); });
  setTimeout(function () {
    el.classList.remove('toast-visivel');
    setTimeout(function () { el.remove(); }, 300);
  }, 3000);
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
