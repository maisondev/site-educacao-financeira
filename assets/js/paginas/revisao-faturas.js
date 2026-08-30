// Esteira de revisão de faturas
// Cada fatura fechada e analisada em analise-fatura.html gera aqui uma "revisão":
// um checklist fixo + tarefas automáticas (insights dos próprios dados) + tarefas
// livres. O objetivo é não só pagar a fatura, mas sair dela com 1 corte definido
// para o mês seguinte.
//
// A revisão guarda um SNAPSHOT dos números da fatura no momento em que é criada,
// então ela sobrevive mesmo que a análise daquele mês seja substituída por outro
// banco em analise-fatura.html (que só guarda uma análise por competência).
// Persistência: Store.CHAVES.REVISAO_FATURAS = { [competencia|banco]: { ...revisao } }

const RF_CHAVE = Store.CHAVES.REVISAO_FATURAS;
const RF_AF_CHAVE = Store.CHAVES.ANALISE_FATURAS;

// Rótulos das categorias da análise de fatura (espelha AF_CATEGORIAS).
const RF_CATEGORIAS = {
  mercado: 'Mercado / alimentação',
  casa: 'Casa e eletro',
  online: 'Compras online / marketplace',
  restaurante: 'Restaurantes / delivery',
  transporte: 'Transporte / combustível',
  saude: 'Saúde / farmácia',
  vestuario: 'Vestuário',
  educacao: 'Educação / livros',
  assinatura: 'Assinaturas',
  servicos: 'Serviços pessoais',
  lazer: 'Lazer / academia',
  pets: 'Pets',
  impostos: 'Impostos e taxas',
  outro: 'Outros'
};

// Um gasto só vira alerta se subiu mais que isto sobre a média E em reais.
const RF_LIMITE_PCT = 0.20;
const RF_LIMITE_REAIS = 30;

const RF_CHECKLIST_FIXO = [
  'Conferir todas as assinaturas da fatura — cancelar o que não usa mais',
  'Identificar o maior gasto do mês e avaliar se dá pra reduzir no próximo',
  'Revisar parcelamentos novos — quanto já está comprometido nos próximos meses',
  'Comparar o total com a fatura anterior: subiu ou caiu? Por quê?',
  'Definir 1 corte concreto para a próxima fatura'
];

// --- utilidades --------------------------------------------------------------

function rfId() {
  return 'rf-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function rfEscapar(texto) {
  const d = document.createElement('div');
  d.textContent = texto == null ? '' : String(texto);
  return d.innerHTML;
}

function rfFmt(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function rfChaveFatura(competencia, banco) {
  return competencia + '|' + (banco || 'Outro');
}

// Normaliza a descrição de uma assinatura para comparar entre meses.
function rfNormAssinatura(descricao) {
  return String(descricao || '')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\b\d{2,}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ').slice(0, 2).join(' ');
}

// --- leitura / escrita -----------------------------------------------------

function rfLerTodas() {
  const dados = Store.ler(RF_CHAVE, {});
  return dados && typeof dados === 'object' ? dados : {};
}

function rfGravarTodas(dados) {
  return Store.gravar(RF_CHAVE, dados);
}

function rfLerAnalises() {
  const dados = Store.ler(RF_AF_CHAVE, {});
  if (dados && typeof dados === 'object') return dados;
  // fallback: analise-fatura.js grava direto em localStorage sem Store
  try {
    const bruto = localStorage.getItem(RF_AF_CHAVE);
    const d = bruto ? JSON.parse(bruto) : {};
    return d && typeof d === 'object' ? d : {};
  } catch (e) {
    return {};
  }
}

// --- snapshot de uma análise de fatura ------------------------------------

function rfMontarSnapshot(reg) {
  const todos = (reg.lancamentos || []);
  const inclusos = new Set(
    reg.inclusos && reg.inclusos.length
      ? reg.inclusos
      : todos.map(l => l.cartao || '__sem__')
  );
  const lancs = todos.filter(l =>
    l.tipo !== 'pagamento' && inclusos.has(l.cartao || '__sem__')
  );

  const porCategoria = {};
  let total = 0;
  let encargos = 0;
  let maior = { descricao: '', valor: 0 };
  const assinaturas = [];
  const parcelamentosNovos = [];

  lancs.forEach(l => {
    const v = Number(l.valor) || 0;
    total += v;
    const cat = l.categoria || 'outro';
    porCategoria[cat] = (porCategoria[cat] || 0) + v;
    if (l.tipo === 'encargo') encargos += v;
    if (v > maior.valor) maior = { descricao: l.descricao || 'Lançamento', valor: v };
    if (l.categoria === 'assinatura') {
      assinaturas.push({ chave: rfNormAssinatura(l.descricao), descricao: l.descricao || '', valor: v });
    }
    if (l.parcelaAtual === 1 && l.parcelaTotal > 1) {
      parcelamentosNovos.push({
        descricao: l.descricao || 'Lançamento',
        valor: v,
        parcelas: l.parcelaTotal
      });
    }
  });

  return {
    total: total,
    qtdLancamentos: lancs.length,
    porCategoria: porCategoria,
    encargos: encargos,
    maior: maior,
    assinaturas: assinaturas,
    parcelamentosNovos: parcelamentosNovos
  };
}

// Snapshots das faturas anteriores (competência menor), do mesmo banco quando
// houver histórico; senão de qualquer banco. Até os 3 mais recentes.
function rfBaselineSnapshots(todas, competenciaAtual, banco) {
  const anteriores = Object.values(todas)
    .filter(r => r.snapshot && r.competencia < competenciaAtual)
    .sort((a, b) => b.competencia.localeCompare(a.competencia));
  const mesmoBanco = anteriores.filter(r => (r.banco || 'Outro') === (banco || 'Outro'));
  const base = mesmoBanco.length ? mesmoBanco : anteriores;
  return base.slice(0, 3).map(r => r.snapshot);
}

// --- geração das tarefas automáticas -------------------------------------

function rfTarefasAutomaticas(snapshot, baseline) {
  const tarefas = [];
  const add = (chave, texto) => tarefas.push({
    id: rfId(), tipo: 'insight', chave: chave, texto: texto, feito: false, auto: true
  });

  // 1. categorias acima da média dos meses anteriores
  if (baseline.length) {
    Object.keys(snapshot.porCategoria).forEach(cat => {
      const atual = snapshot.porCategoria[cat];
      const historico = baseline
        .map(s => s.porCategoria[cat] || 0)
        .filter(v => v > 0);
      if (!historico.length) return;
      const media = historico.reduce((s, v) => s + v, 0) / historico.length;
      if (media <= 0) return;
      const dif = atual - media;
      if (dif >= RF_LIMITE_REAIS && atual >= media * (1 + RF_LIMITE_PCT)) {
        const pct = Math.round((atual / media - 1) * 100);
        add('cat:' + cat, `${RF_CATEGORIAS[cat] || cat}: ${rfFmt(atual)} nesta fatura vs média de ${rfFmt(media)} (+${pct}%). Ver o que dá pra cortar.`);
      }
    });
  } else {
    tarefas.push({
      id: rfId(), tipo: 'insight', chave: 'primeira', auto: true, feito: false,
      texto: 'Primeira fatura registrada na esteira — as próximas vão comparar os gastos com esta.'
    });
  }

  // 2. assinaturas novas (não apareceram em nenhuma fatura anterior)
  const assinaturasConhecidas = new Set();
  baseline.forEach(s => (s.assinaturas || []).forEach(a => assinaturasConhecidas.add(a.chave)));
  const novas = [];
  const vistas = new Set();
  snapshot.assinaturas.forEach(a => {
    if (!a.chave || vistas.has(a.chave)) return;
    vistas.add(a.chave);
    if (baseline.length && !assinaturasConhecidas.has(a.chave)) novas.push(a);
  });
  novas.forEach(a => {
    add('assin:' + a.chave, `Assinatura nova: ${a.descricao} (${rfFmt(a.valor)}). Confirmar se vai manter.`);
  });

  // 3. parcelamentos novos
  if (snapshot.parcelamentosNovos.length) {
    const lista = snapshot.parcelamentosNovos
      .map(p => `${p.descricao} (${p.parcelas}x de ${rfFmt(p.valor)})`)
      .join('; ');
    add('parcelas', `${snapshot.parcelamentosNovos.length} parcelamento(s) novo(s) comprometendo os próximos meses: ${lista}.`);
  }

  // 4. juros / IOF / multa na fatura
  if (snapshot.encargos > 0) {
    add('encargos', `A fatura teve ${rfFmt(snapshot.encargos)} de juros/IOF/multa. Descobrir a origem e evitar no próximo mês.`);
  }

  return tarefas;
}

function rfChecklistFixo() {
  return RF_CHECKLIST_FIXO.map(texto => ({
    id: rfId(), tipo: 'checklist', texto: texto, feito: false, auto: true
  }));
}

// --- sincronização com a análise de faturas -----------------------------

function rfSincronizar(silencioso) {
  const analises = rfLerAnalises();
  const todas = rfLerTodas();
  let novas = 0;
  let atualizadas = 0;

  Object.keys(analises).forEach(comp => {
    const reg = analises[comp];
    if (!reg || !Array.isArray(reg.lancamentos)) return;
    const banco = reg.banco || 'Outro';
    const chave = rfChaveFatura(comp, banco);
    const snapshot = rfMontarSnapshot(reg);
    const baseline = rfBaselineSnapshots(todas, comp, banco);

    if (!todas[chave]) {
      todas[chave] = {
        competencia: comp,
        banco: banco,
        criadaEm: new Date().toISOString(),
        atualizadaEm: new Date().toISOString(),
        estado: 'a-revisar',
        snapshot: snapshot,
        tarefas: rfChecklistFixo().concat(rfTarefasAutomaticas(snapshot, baseline))
      };
      novas++;
    } else {
      // Revisão já existe: atualiza o snapshot e injeta apenas insights novos,
      // preservando o que já foi marcado como feito.
      const rev = todas[chave];
      rev.snapshot = snapshot;
      rev.atualizadaEm = new Date().toISOString();
      const chavesExistentes = new Set(
        rev.tarefas.filter(t => t.chave).map(t => t.chave)
      );
      const novosInsights = rfTarefasAutomaticas(snapshot, baseline)
        .filter(t => t.chave && !chavesExistentes.has(t.chave));
      if (novosInsights.length) {
        rev.tarefas = rev.tarefas.concat(novosInsights);
        atualizadas++;
      }
    }
  });

  rfGravarTodas(todas);
  rfRender();

  if (!silencioso) {
    let msg;
    if (novas) msg = `${novas} fatura(s) entraram na esteira.`;
    else if (atualizadas) msg = `${atualizadas} revisão(ões) ganharam novos pontos de atenção.`;
    else msg = 'Nenhuma fatura nova para revisar.';
    rfMostrarMsg(msg, 'ok');
  }
}

// --- ações sobre tarefas / revisões ------------------------------------

function rfComRevisao(chave, fn) {
  const todas = rfLerTodas();
  if (!todas[chave]) return;
  fn(todas[chave]);
  todas[chave].atualizadaEm = new Date().toISOString();
  rfGravarTodas(todas);
  rfRender();
}

function rfToggleTarefa(chave, tarefaId) {
  rfComRevisao(chave, rev => {
    const t = rev.tarefas.find(x => x.id === tarefaId);
    if (!t) return;
    t.feito = !t.feito;
    if (rev.estado === 'a-revisar' && rev.tarefas.some(x => x.feito)) {
      rev.estado = 'em-revisao';
    }
  });
}

function rfAdicionarTarefaLivre(chave) {
  const input = document.getElementById('rf-nova-' + chave);
  if (!input) return;
  const texto = input.value.trim();
  if (!texto) return;
  rfComRevisao(chave, rev => {
    rev.tarefas.push({ id: rfId(), tipo: 'livre', texto: texto, feito: false, auto: false });
    if (rev.estado === 'concluida') rev.estado = 'em-revisao';
  });
}

function rfRemoverTarefa(chave, tarefaId) {
  rfComRevisao(chave, rev => {
    rev.tarefas = rev.tarefas.filter(t => t.id !== tarefaId);
  });
}

function rfConcluirRevisao(chave) {
  const todas = rfLerTodas();
  const rev = todas[chave];
  if (!rev) return;
  const pendentes = rev.tarefas.filter(t => !t.feito).length;
  if (pendentes && !confirm(`Ainda há ${pendentes} tarefa(s) sem marcar. Concluir a revisão mesmo assim?`)) {
    return;
  }
  rfComRevisao(chave, r => { r.estado = 'concluida'; r.concluidaEm = new Date().toISOString(); });
}

function rfReabrirRevisao(chave) {
  rfComRevisao(chave, rev => {
    rev.estado = rev.tarefas.some(t => t.feito) ? 'em-revisao' : 'a-revisar';
    delete rev.concluidaEm;
  });
}

function rfExcluirRevisao(chave) {
  const todas = rfLerTodas();
  const rev = todas[chave];
  if (!rev) return;
  if (!confirm(`Remover a revisão de ${formatarCompetencia(rev.competencia)} — ${rev.banco}? A análise da fatura em si não é afetada.`)) {
    return;
  }
  delete todas[chave];
  rfGravarTodas(todas);
  rfRender();
}

// --- render --------------------------------------------------------------

let rfFiltroEstado = 'pendentes';

function rfMostrarMsg(texto, tipo) {
  const el = document.getElementById('rf-msg');
  if (!el) return;
  el.textContent = texto;
  el.className = 'rf-msg rf-msg-' + (tipo || 'ok');
  el.hidden = false;
  clearTimeout(rfMostrarMsg._t);
  rfMostrarMsg._t = setTimeout(() => { el.hidden = true; }, 4000);
}

function rfDefinirFiltro(valor) {
  rfFiltroEstado = valor;
  rfRender();
}

function rfProgresso(rev) {
  const total = rev.tarefas.length;
  const feitas = rev.tarefas.filter(t => t.feito).length;
  return { total, feitas, pct: total ? Math.round((feitas / total) * 100) : 0 };
}

function rfRotuloEstado(estado) {
  return { 'a-revisar': 'A revisar', 'em-revisao': 'Em revisão', 'concluida': 'Concluída' }[estado] || estado;
}

function rfRender() {
  const todas = rfLerTodas();
  const revisoes = Object.keys(todas)
    .map(chave => Object.assign({ chave }, todas[chave]))
    .sort((a, b) => b.competencia.localeCompare(a.competencia) || a.banco.localeCompare(b.banco));

  // resumo
  const cont = { 'a-revisar': 0, 'em-revisao': 0, 'concluida': 0 };
  revisoes.forEach(r => { cont[r.estado] = (cont[r.estado] || 0) + 1; });
  const resumo = document.getElementById('rf-resumo');
  if (resumo) {
    resumo.innerHTML = `
      <div class="rf-card-info${cont['a-revisar'] ? ' erro' : ''}">
        <p>A revisar</p><p class="valor">${cont['a-revisar']}</p>
      </div>
      <div class="rf-card-info${cont['em-revisao'] ? ' alerta' : ''}">
        <p>Em revisão</p><p class="valor">${cont['em-revisao']}</p>
      </div>
      <div class="rf-card-info sucesso">
        <p>Concluídas</p><p class="valor">${cont['concluida']}</p>
      </div>`;
  }

  const lista = document.getElementById('rf-lista');
  if (!lista) return;

  const visiveis = revisoes.filter(r => {
    if (rfFiltroEstado === 'todas') return true;
    if (rfFiltroEstado === 'concluidas') return r.estado === 'concluida';
    return r.estado !== 'concluida';
  });

  if (!revisoes.length) {
    lista.innerHTML = `<p class="rf-vazio">Nenhuma fatura na esteira ainda. Analise uma fatura em
      <a href="./analise-fatura.html">Análise de Fatura</a>, salve, e volte aqui para clicar em
      <strong>Sincronizar</strong>.</p>`;
    return;
  }
  if (!visiveis.length) {
    lista.innerHTML = '<p class="rf-vazio">Nada neste filtro.</p>';
    return;
  }

  lista.innerHTML = visiveis.map(rfRenderRevisao).join('');
}

function rfRenderRevisao(rev) {
  const prog = rfProgresso(rev);
  const s = rev.snapshot || {};
  const barraClasse = rev.estado === 'concluida' ? ' sucesso' : (prog.pct >= 60 ? '' : ' alerta');

  const grupos = [
    ['checklist', 'Checklist de revisão'],
    ['insight', 'Pontos de atenção desta fatura'],
    ['livre', 'Minhas pendências']
  ];

  const tarefasHtml = grupos.map(([tipo, titulo]) => {
    const itens = rev.tarefas.filter(t => t.tipo === tipo);
    if (!itens.length && tipo !== 'livre') return '';
    const linhas = itens.map(t => `
      <li class="rf-tarefa${t.feito ? ' feita' : ''}">
        <label>
          <input type="checkbox" ${t.feito ? 'checked' : ''}
            onchange="rfToggleTarefa('${rev.chave}', '${t.id}')">
          <span>${rfEscapar(t.texto)}</span>
        </label>
        ${t.auto ? '' : `<button type="button" class="rf-btn-x" title="Remover"
          onclick="rfRemoverTarefa('${rev.chave}', '${t.id}')">&times;</button>`}
      </li>`).join('');
    const addLivre = tipo === 'livre' ? `
      <li class="rf-add-livre">
        <input type="text" id="rf-nova-${rev.chave}" placeholder="Nova pendência para esta fatura"
          onkeydown="if(event.key==='Enter'){rfAdicionarTarefaLivre('${rev.chave}');}">
        <button type="button" onclick="rfAdicionarTarefaLivre('${rev.chave}')">Adicionar</button>
      </li>` : '';
    return `
      <div class="rf-grupo">
        <h4>${titulo}</h4>
        <ul class="rf-tarefas">${linhas || (tipo === 'livre' ? '' : '')}${addLivre}</ul>
      </div>`;
  }).join('');

  const acoes = rev.estado === 'concluida'
    ? `<button type="button" class="rf-btn-sec" onclick="rfReabrirRevisao('${rev.chave}')">Reabrir</button>`
    : `<button type="button" class="rf-btn-primary" onclick="rfConcluirRevisao('${rev.chave}')">Concluir revisão</button>`;

  return `
    <article class="rf-revisao rf-estado-${rev.estado}" data-chave="${rfEscapar(rev.chave)}">
      <header class="rf-rev-head">
        <div>
          <h3>${formatarCompetencia(rev.competencia)} — ${rfEscapar(rev.banco)}</h3>
          <p class="rf-rev-num">
            Total ${rfFmt(s.total || 0)} · ${s.qtdLancamentos || 0} lançamentos
            ${s.maior && s.maior.valor ? ` · maior: ${rfEscapar(s.maior.descricao)} (${rfFmt(s.maior.valor)})` : ''}
          </p>
        </div>
        <span class="rf-badge rf-badge-${rev.estado}">${rfRotuloEstado(rev.estado)}</span>
      </header>

      <div class="rf-barra">
        <div class="rf-barra-fill${barraClasse}" style="width:${prog.pct}%"></div>
      </div>
      <p class="rf-prog-txt">${prog.feitas} de ${prog.total} tarefas</p>

      ${tarefasHtml}

      <footer class="rf-rev-foot">
        ${acoes}
        <button type="button" class="rf-btn-x-txt" onclick="rfExcluirRevisao('${rev.chave}')">Remover da esteira</button>
      </footer>
    </article>`;
}

document.addEventListener('DOMContentLoaded', function () {
  const btnSync = document.getElementById('rf-sincronizar');
  if (btnSync) btnSync.addEventListener('click', () => rfSincronizar(false));

  document.querySelectorAll('[data-rf-filtro]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-rf-filtro]').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      rfDefinirFiltro(btn.getAttribute('data-rf-filtro'));
    });
  });

  rfSincronizar(true);

  // Deep-link vindo de "Meus Cartões": ?abrir=AAAA-MM|Banco rola até a revisão.
  const abrir = new URLSearchParams(location.search).get('abrir');
  if (abrir) {
    rfIrParaRevisao(abrir);
    history.replaceState(null, '', location.pathname);
  }
});

function rfIrParaRevisao(chave) {
  const seletor = '.rf-revisao[data-chave="' + chave.replace(/"/g, '\\"') + '"]';
  let el = document.querySelector(seletor);
  if (!el) {
    // Pode estar concluída e fora do filtro padrão — mostra todas e tenta de novo.
    rfFiltroEstado = 'todas';
    rfRender();
    el = document.querySelector(seletor);
  }
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.style.transition = 'box-shadow 0.3s';
  el.style.boxShadow = '0 0 0 3px var(--cor-secundaria)';
  setTimeout(() => { el.style.boxShadow = ''; }, 2500);
}
