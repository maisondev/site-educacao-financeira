// Gerenciar envelopes financeiros

const CHAVE_RENDA = 'renda_mensal';

const ENVELOPES_PADRAO = [
  // NECESSIDADES (50%) - Tudo que é obrigatório pra sobreviver
  { id: 'essenciais', nome: 'Essenciais', percentual: 50, cor: '#c53030', categoria: 'necessidades' },

  // DESEJOS (30%) - Tudo que você quer mas não precisa
  { id: 'lazer', nome: 'Lazer & Diversão', percentual: 20, cor: '#7c2d12', categoria: 'desejos' },
  { id: 'educacao', nome: 'Educação & Desenvolvimento', percentual: 10, cor: '#4f46e5', categoria: 'desejos' },

  // POUPANÇA (20%) - Futuro & Segurança
  { id: 'aposentadoria', nome: 'Aposentadoria', percentual: 10, cor: '#f59e0b', categoria: 'poupanca' },
  { id: 'metas-investimentos', nome: 'Metas & Investimentos', percentual: 10, cor: '#14b8a6', categoria: 'poupanca' }
];

let envelopeEmEdicao = null;

// Competência que a página está exibindo. Sem competencia.js carregado,
// cai num modo "mês único" que preserva o comportamento antigo.
function mesSelecionado() {
  return typeof competenciaSelecionada === 'function'
    ? competenciaSelecionada()
    : (new Date().toISOString().slice(0, 7));
}

// Só o mês corrente é editável: os envelopes guardam sempre o orçamento
// vigente. Meses fechados ficam só de leitura, a partir do histórico.
function mesEhEditavel() {
  if (typeof competenciaAtual !== 'function') return true;
  if (typeof competenciaFechada === 'function' && competenciaFechada(mesSelecionado())) return false;
  return mesSelecionado() === competenciaAtual();
}

function aoMudarMes() {
  carregarRenda();
  renderizarEnvelopes();
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof migrarCompetencias === 'function') migrarCompetencias();
  if (typeof renderizarSeletorCompetencia === 'function') {
    renderizarSeletorCompetencia('container-competencia', aoMudarMes);
  }
  carregarRenda();
  renderizarEnvelopes();

  // Fechar modal ao clicar fora
  const modal = document.getElementById('modal-despesa');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        fecharModalDespesa();
      }
    });
  }

  // Enter para salvar registro
  document.getElementById('registro-valor').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      salvarRegistro();
    }
  });
});

// Use parseValorBrasileiro from formatacao.js instead

function definirRenda() {
  const input = document.getElementById('input-renda');
  const renda = parseValorBrasileiro(input.value);

  if (!renda || renda <= 0) {
    alert('Por favor, insira um valor de renda válido');
    return;
  }

  // Usar sistema centralizado se disponível, senão usar localStorage direto
  if (typeof atualizarRendaMensal === 'function') {
    atualizarRendaMensal(renda);
  } else {
    localStorage.setItem(CHAVE_RENDA, renda.toString());
  }
  carregarRenda();
  renderizarEnvelopes();
}

function carregarRenda() {
  const renda = parseFloat(localStorage.getItem(CHAVE_RENDA) || '0');
  const rendaInfo = document.getElementById('renda-info');
  const valorRenda = document.getElementById('valor-renda');

  if (renda > 0) {
    valorRenda.textContent = renda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    rendaInfo.removeAttribute('hidden');
  } else {
    rendaInfo.setAttribute('hidden', '');
  }
}

function obterEnvelopes() {
  return Store.ler(
    Store.CHAVES.ENVELOPES,
    ENVELOPES_PADRAO.map(e => ({ ...e, registros: [] }))
  );
}

function salvarEnvelopes(envelopes) {
  Store.gravar(Store.CHAVES.ENVELOPES, envelopes);
}

// Retrato de um mês já fechado, montado a partir do histórico mensal.
function renderizarMesFechado(container, renda) {
  const historico = typeof Store !== 'undefined'
    ? Store.ler(Store.CHAVES.HISTORICO_MENSAL, {})
    : {};
  const registro = historico[mesSelecionado()];
  const envelopesSnapshot = (registro && registro.envelopes) || [];

  if (envelopesSnapshot.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--cor-texto-leve);">Nenhum envelope arquivado para este mês.</p>';
    return;
  }

  const cards = envelopesSnapshot.map(e => {
    const valorAlocado = (renda * (Number(e.percentual) || 0)) / 100;
    const totalGasto = Number(e.gasto) || 0;
    const sobra = valorAlocado - totalGasto;
    const percentualUsado = valorAlocado > 0 ? (totalGasto / valorAlocado) * 100 : 0;
    let classeProgresso = '';
    if (percentualUsado > 100) classeProgresso = 'erro';
    else if (percentualUsado > 80) classeProgresso = 'alerta';

    return `
      <div class="envelope">
        <div class="envelope-header">
          <div class="envelope-nome">
            <h3>${e.nome}</h3>
            <p class="envelope-percentual">${e.percentual}% da renda</p>
          </div>
        </div>
        <div class="envelope-valores">
          <div class="valor-linha"><span>Alocado:</span><strong>${valorAlocado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
          <div class="valor-linha"><span>Gasto:</span><strong class="valor-usado">${totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
          <div class="valor-linha"><span>Disponível:</span><strong>${sobra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
        </div>
        <div class="envelope-progresso">
          <div class="envelope-progresso-barra ${classeProgresso}" style="width: ${Math.min(percentualUsado, 100)}%"></div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="aviso-mes" style="grid-column: 1/-1;">Mês fechado &mdash; retrato arquivado, somente leitura.</div>
    <div class="grid-envelopes-grupo" style="grid-column: 1/-1;">${cards}</div>
  `;
}

function renderizarEnvelopes() {
  const renda = parseFloat(localStorage.getItem(CHAVE_RENDA) || '0');
  const envelopes = obterEnvelopes();
  const container = document.getElementById('grid-envelopes');

  if (renda <= 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--cor-texto-leve);">Defina sua renda mensal para começar</p>';
    return;
  }

  if (typeof competenciaFechada === 'function' && competenciaFechada(mesSelecionado())) {
    renderizarMesFechado(container, renda);
    return;
  }

  const avisoOutroMes = (typeof competenciaAtual === 'function' && mesSelecionado() !== competenciaAtual())
    ? '<div class="aviso-mes" style="grid-column: 1/-1;">Os envelopes mostram sempre o orçamento do mês corrente. Feche o mês para arquivar este retrato.</div>'
    : '';

  // Agrupar envelopes por categoria
  const grupos = {
    necessidades: { nome: '50% NECESSIDADES', envelopes: [] },
    desejos: { nome: '30% DESEJOS', envelopes: [] },
    poupanca: { nome: '20% POUPANÇA', envelopes: [] }
  };

  envelopes.forEach(e => {
    const categoria = e.categoria || 'desejos';
    grupos[categoria].envelopes.push(e);
  });

  let html = '';
  Object.entries(grupos).forEach(([chave, grupo]) => {
    if (grupo.envelopes.length > 0) {
      html += `
        <div class="secao-envelopes" style="grid-column: 1/-1;">
          <h3 style="color: var(--cor-texto-leve); font-size: 14px; font-weight: bold; text-transform: uppercase; margin: var(--espacamento-lg) 0 var(--espacamento-md) 0; border-bottom: 2px solid var(--cor-borda); padding-bottom: var(--espacamento-sm);">
            ${grupo.nome}
          </h3>
          <div class="grid-envelopes-grupo">
            ${grupo.envelopes.map(envelope => criarCardEnvelope(envelope, renda)).join('')}
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = avisoOutroMes + html;
}

function criarCardEnvelope(envelope, rendaTotal) {
  const valorAlocado = (rendaTotal * envelope.percentual) / 100;
  const registros = envelope.registros || envelope.despesas || [];
  const totalGasto = registros.reduce((sum, r) => sum + r.valor, 0);
  const percentualUsado = (totalGasto / valorAlocado) * 100;
  const sobra = valorAlocado - totalGasto;

  // Migrar despesas antigas para registros
  if (envelope.despesas && !envelope.registros) {
    envelope.registros = envelope.despesas.map(d => ({ ...d, tipo: 'variavel' }));
    delete envelope.despesas;
  }

  const editavel = mesEhEditavel();

  let classeProgresso = '';
  if (percentualUsado > 100) {
    classeProgresso = 'erro';
  } else if (percentualUsado > 80) {
    classeProgresso = 'alerta';
  }

  return `
    <div class="envelope">
      <div class="envelope-header">
        <div class="envelope-nome">
          <h3>${envelope.nome}</h3>
          <p class="envelope-percentual">${envelope.percentual}% da renda</p>
        </div>
      </div>

      <div class="envelope-valores">
        <div class="valor-linha">
          <span>Alocado:</span>
          <strong>${valorAlocado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
        <div class="valor-linha">
          <span>Gasto:</span>
          <strong class="valor-usado">${totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
        <div class="valor-linha">
          <span>Disponível:</span>
          <strong>${sobra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
      </div>

      <div class="envelope-progresso">
        <div class="envelope-progresso-barra ${classeProgresso}" style="width: ${Math.min(percentualUsado, 100)}%"></div>
      </div>

      <div class="lista-despesas">
        ${registros.map((r, idx) => {
          const tipoLabel = r.tipo === 'fixa' ? 'Despesa Fixa' : r.tipo === 'variavel' ? 'Despesa Var.' : 'Investimento';
          return `
          <div class="despesa-item tipo-${r.tipo}">
            <div class="despesa-descricao">
              <span class="despesa-tipo">${tipoLabel}</span>
              <span>${r.descricao}</span>
            </div>
            <span class="despesa-valor">${r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            ${editavel ? `<button class="btn-remover-despesa" onclick="removerRegistro('${envelope.id}', ${idx})">×</button>` : ''}
          </div>
        `}).join('')}
      </div>

      ${editavel ? `
      <div class="envelope-acoes">
        <button class="btn-adicionar" onclick="abrirModalDespesa('${envelope.id}', '${envelope.nome}')">+ Adicionar</button>
        <button class="btn-limpar" onclick="limparEnvelope('${envelope.id}')">Limpar Despesas</button>
      </div>` : ''}
    </div>
  `;
}

function abrirModalDespesa(envelopeId, envelopeNome) {
  envelopeEmEdicao = envelopeId;
  document.getElementById('modal-titulo').textContent = `Adicionar a ${envelopeNome}`;
  document.getElementById('registro-tipo').value = '';
  document.getElementById('registro-descricao').value = '';
  document.getElementById('registro-valor').value = '';
  document.getElementById('modal-despesa').removeAttribute('hidden');
  document.getElementById('registro-tipo').focus();
}

function fecharModalDespesa() {
  document.getElementById('modal-despesa').setAttribute('hidden', '');
  envelopeEmEdicao = null;
}

function salvarRegistro() {
  if (!envelopeEmEdicao) return;

  if (!mesEhEditavel()) {
    alert('Este mês está fechado ou não é o mês corrente. Só o mês atual aceita novos lançamentos.');
    fecharModalDespesa();
    return;
  }

  const tipo = document.getElementById('registro-tipo').value;
  const descricao = document.getElementById('registro-descricao').value.trim();
  const valor = normalizarValor(document.getElementById('registro-valor').value);

  if (!tipo) {
    alert('Por favor, selecione um tipo');
    return;
  }

  if (!descricao) {
    alert('Por favor, insira uma descrição');
    return;
  }

  if (!valor || valor <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  const envelopes = obterEnvelopes();
  const envelope = envelopes.find(e => e.id === envelopeEmEdicao);

  if (!envelope) return;

  if (!envelope.registros) {
    envelope.registros = [];
  }

  envelope.registros.push({ tipo, descricao, valor });
  salvarEnvelopes(envelopes);
  fecharModalDespesa();
  renderizarEnvelopes();
}

function removerRegistro(envelopeId, indice) {
  const envelopes = obterEnvelopes();
  const envelope = envelopes.find(e => e.id === envelopeId);

  if (envelope && envelope.registros) {
    envelope.registros.splice(indice, 1);
    salvarEnvelopes(envelopes);
    renderizarEnvelopes();
  }
}

function limparEnvelope(envelopeId) {
  const envelopes = obterEnvelopes();
  const envelope = envelopes.find(e => e.id === envelopeId);

  if (envelope) {
    const confirmar = confirm(`Tem certeza que quer limpar todos os registros de "${envelope.nome}"?`);
    if (confirmar) {
      envelope.registros = [];
      salvarEnvelopes(envelopes);
      renderizarEnvelopes();
    }
  }
}

// Fecha (ou reabre) o mês selecionado: arquiva o retrato e zera os envelopes
// para o mês seguinte. Reaproveita fecharMes/reabrirMes de competencia.js.
function confirmarFechamentoDoMesEnvelopes() {
  if (typeof fecharMes !== 'function' || typeof competenciaSelecionada !== 'function') {
    alert('Controle mensal indisponível nesta página.');
    return;
  }

  const competencia = competenciaSelecionada();
  const nome = formatarCompetencia(competencia);

  if (competenciaFechada(competencia)) {
    if (!confirm(`${nome} já está fechado. Reabrir para continuar lançando?`)) return;
    reabrirMes(competencia);
  } else {
    const confirmado = confirm(
      `Fechar ${nome}?\n\n` +
      'O retrato do mês é arquivado e os envelopes voltam a zero. ' +
      'Nenhum lançamento é apagado, e dá para reabrir depois.'
    );
    if (!confirmado) return;
    if (!fecharMes(competencia)) return;
  }

  if (typeof renderizarSeletorCompetencia === 'function') {
    renderizarSeletorCompetencia('container-competencia', aoMudarMes);
  }
  carregarRenda();
  renderizarEnvelopes();
}
