// Gerenciar envelopes financeiros

const CHAVE_STORAGE = 'envelopes_financeiros';
const CHAVE_RENDA = 'renda_mensal';

const ENVELOPES_PADRAO = [
  { id: 'essenciais', nome: 'Essenciais', percentual: 55, cor: '#2d7e3c' },
  { id: 'educacao', nome: 'Educação', percentual: 5, cor: '#4f46e5' },
  { id: 'aposentadoria', nome: 'Aposentadoria', percentual: 10, cor: '#f59e0b' },
  { id: 'metas-1', nome: 'Metas Nível 1', percentual: 5, cor: '#8b5cf6' },
  { id: 'metas-2', nome: 'Metas Nível 2', percentual: 5, cor: '#06b6d4' },
  { id: 'metas-3', nome: 'Metas Nível 3', percentual: 5, cor: '#ec4899' },
  { id: 'metas-4', nome: 'Metas Nível 4', percentual: 5, cor: '#14b8a6' }
];

let envelopeEmEdicao = null;

document.addEventListener('DOMContentLoaded', function() {
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
  try {
    const dados = localStorage.getItem(CHAVE_STORAGE);
    if (!dados) {
      return ENVELOPES_PADRAO.map(e => ({ ...e, registros: [] }));
    }
    return JSON.parse(dados);
  } catch (e) {
    return ENVELOPES_PADRAO.map(e => ({ ...e, registros: [] }));
  }
}

function salvarEnvelopes(envelopes) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(envelopes));
  } catch (e) {
    console.error('Erro ao salvar envelopes:', e);
    alert('Não foi possível salvar os dados.');
  }
}

function renderizarEnvelopes() {
  const renda = parseFloat(localStorage.getItem(CHAVE_RENDA) || '0');
  const envelopes = obterEnvelopes();
  const container = document.getElementById('grid-envelopes');

  if (renda <= 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--cor-texto-leve);">Defina sua renda mensal para começar</p>';
    return;
  }

  container.innerHTML = envelopes.map(envelope => criarCardEnvelope(envelope, renda)).join('');
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
            <button class="btn-remover-despesa" onclick="removerRegistro('${envelope.id}', ${idx})">×</button>
          </div>
        `}).join('')}
      </div>

      <div class="envelope-acoes">
        <button class="btn-adicionar" onclick="abrirModalDespesa('${envelope.id}', '${envelope.nome}')">+ Adicionar</button>
        <button class="btn-limpar" onclick="limparEnvelope('${envelope.id}')">Limpar Despesas</button>
      </div>
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
