// Competência mensal: dá noção de tempo aos lançamentos.
// Todo lançamento novo carrega `competencia: "AAAA-MM"`; os antigos herdam a
// competência da própria data na migração, que é idempotente.

const CHAVE_COMPETENCIA_SELECIONADA = 'competencia_selecionada';
const CHAVE_HISTORICO_MENSAL = 'historico_mensal';

// Chaves cujos itens são lançamentos datados e ganham `competencia`.
const COMPETENCIA_FONTES = [
  { chave: 'despesas_variaveis', campoData: 'data' },
  { chave: 'receitas_lista', campoData: 'data' }
];

function competenciaAtual(hoje = new Date()) {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

function competenciaValida(valor) {
  return typeof valor === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
}

// Competência de um lançamento: a explícita, ou a deduzida da data.
function competenciaDoRegistro(registro, campoData = 'data') {
  if (competenciaValida(registro.competencia)) return registro.competencia;

  const origem = registro[campoData] || registro.dataCriacao;
  if (typeof origem !== 'string') return null;

  const deduzida = origem.slice(0, 7);
  return competenciaValida(deduzida) ? deduzida : null;
}

function competenciaSelecionada() {
  const guardada = Store.lerTexto(CHAVE_COMPETENCIA_SELECIONADA, null);
  return competenciaValida(guardada) ? guardada : competenciaAtual();
}

function definirCompetenciaSelecionada(competencia) {
  if (!competenciaValida(competencia)) return false;
  try {
    localStorage.setItem(CHAVE_COMPETENCIA_SELECIONADA, competencia);
    return true;
  } catch (e) {
    console.error('[competencia] não foi possível guardar a seleção:', e);
    return false;
  }
}

// "2026-08" → "agosto de 2026"
function formatarCompetencia(competencia) {
  if (!competenciaValida(competencia)) return '';
  return new Date(competencia + '-01T00:00:00')
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function competenciaSomarMeses(competencia, meses) {
  const [ano, mes] = competencia.split('-').map(Number);
  const data = new Date(ano, mes - 1 + meses, 1);
  return competenciaAtual(data);
}

// Preenche `competencia` onde falta. Roda a cada carregamento e só grava
// quando de fato mudou alguma coisa.
function migrarCompetencias() {
  let totalAjustado = 0;

  COMPETENCIA_FONTES.forEach(({ chave, campoData }) => {
    const registros = Store.ler(chave, []);
    if (!Array.isArray(registros) || registros.length === 0) return;

    let ajustados = 0;
    registros.forEach(registro => {
      if (competenciaValida(registro.competencia)) return;
      const deduzida = competenciaDoRegistro(registro, campoData);
      if (deduzida) {
        registro.competencia = deduzida;
        ajustados++;
      }
    });

    if (ajustados > 0) {
      Store.gravar(chave, registros);
      totalAjustado += ajustados;
    }
  });

  if (totalAjustado > 0) {
    console.log(`[competencia] ${totalAjustado} lançamento(s) receberam competência`);
  }
  return totalAjustado;
}

// Competências com algum lançamento, mais a atual e a selecionada, em ordem
// decrescente — é o que alimenta o seletor.
function competenciasDisponiveis() {
  const encontradas = new Set([competenciaAtual(), competenciaSelecionada()]);

  COMPETENCIA_FONTES.forEach(({ chave, campoData }) => {
    Store.ler(chave, []).forEach(registro => {
      const c = competenciaDoRegistro(registro, campoData);
      if (c) encontradas.add(c);
    });
  });

  Object.keys(Store.ler(CHAVE_HISTORICO_MENSAL, {})).forEach(c => {
    if (competenciaValida(c)) encontradas.add(c);
  });

  return Array.from(encontradas).sort().reverse();
}

function competenciaFechada(competencia) {
  return !!Store.ler(CHAVE_HISTORICO_MENSAL, {})[competencia];
}

// Congela o retrato do mês para consulta futura. Não apaga lançamento algum:
// só os envelopes são zerados, porque o orçamento recomeça no mês seguinte.
function fecharMes(competencia) {
  if (!competenciaValida(competencia)) return null;

  const historico = Store.ler(CHAVE_HISTORICO_MENSAL, {});
  const resumo = typeof calcularSaldoDoMes === 'function'
    ? calcularSaldoDoMes(competencia)
    : null;

  const envelopes = Store.ler(Store.CHAVES.ENVELOPES, []);
  historico[competencia] = {
    fechadoEm: new Date().toISOString(),
    resumo,
    envelopes: envelopes.map(e => ({
      nome: e.nome,
      percentual: e.percentual,
      gasto: (e.registros || []).reduce((total, r) => total + (Number(r.valor) || 0), 0)
    }))
  };

  if (!Store.gravar(CHAVE_HISTORICO_MENSAL, historico)) return null;

  // Envelopes recomeçam zerados no mês novo; o histórico acima guarda o gasto.
  if (envelopes.length > 0) {
    Store.gravar(Store.CHAVES.ENVELOPES, envelopes.map(e => ({ ...e, registros: [] })));
  }

  return historico[competencia];
}

function reabrirMes(competencia) {
  const historico = Store.ler(CHAVE_HISTORICO_MENSAL, {});
  if (!historico[competencia]) return false;
  delete historico[competencia];
  return Store.gravar(CHAVE_HISTORICO_MENSAL, historico);
}

// Seletor de mês reutilizável. `aoMudar` recebe a competência escolhida.
function renderizarSeletorCompetencia(containerId, aoMudar) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const selecionada = competenciaSelecionada();
  const opcoes = competenciasDisponiveis()
    .map(c => `<option value="${c}"${c === selecionada ? ' selected' : ''}>${formatarCompetencia(c)}</option>`)
    .join('');

  const fechada = competenciaFechada(selecionada);

  container.innerHTML = `
    <label class="cmp-label" for="cmp-select">Mês</label>
    <select id="cmp-select" class="cmp-select">${opcoes}</select>
    ${fechada ? '<span class="cmp-fechado">mês fechado</span>' : ''}
  `;

  document.getElementById('cmp-select').addEventListener('change', (e) => {
    definirCompetenciaSelecionada(e.target.value);
    renderizarSeletorCompetencia(containerId, aoMudar);
    if (typeof aoMudar === 'function') aoMudar(e.target.value);
  });
}
