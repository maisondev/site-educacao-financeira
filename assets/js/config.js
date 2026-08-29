// Configurações centralizadas do usuário
// Renda mensal é compartilhada entre todas as páginas

function obterRendaMensal() {
  const renda = localStorage.getItem('renda_mensal');
  return renda ? parseFloat(renda) : null;
}

function definirRendaMensal(valor) {
  if (valor && valor > 0) {
    localStorage.setItem('renda_mensal', valor.toString());
    return true;
  }
  return false;
}

// Mês/ano de referência do valor de renda atual (ex: competência do contracheque que o originou)
function obterRendaMensalCompetencia() {
  return localStorage.getItem('renda_mensal_competencia') || null;
}

function definirRendaMensalCompetencia(competencia) {
  if (competencia) {
    localStorage.setItem('renda_mensal_competencia', competencia);
  } else {
    localStorage.removeItem('renda_mensal_competencia');
  }
}

// Renda líquida real de cada competência (ex.: contracheque daquele mês).
// Estrutura: { "AAAA-MM": liquido }. Usada pelo Saldo do Mês para acertar
// meses de salário variável (hora extra, 13º, falta) sem redigitação.
function obterRendaPorCompetencia() {
  try {
    const bruto = localStorage.getItem('renda_por_competencia');
    const dados = bruto ? JSON.parse(bruto) : {};
    return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};
  } catch (e) {
    console.error('Erro ao ler renda por competência:', e);
    return {};
  }
}

function rendaDaCompetencia(competencia) {
  const valor = obterRendaPorCompetencia()[competencia];
  return Number(valor) > 0 ? Number(valor) : null;
}

function definirRendaDaCompetencia(competencia, valor) {
  if (!/^\d{4}-\d{2}$/.test(competencia || '')) return;
  const mapa = obterRendaPorCompetencia();
  if (Number(valor) > 0) {
    mapa[competencia] = Math.round(Number(valor) * 100) / 100;
  } else {
    delete mapa[competencia];
  }
  try {
    localStorage.setItem('renda_por_competencia', JSON.stringify(mapa));
  } catch (e) {
    console.error('Erro ao gravar renda por competência:', e);
  }
}

function atualizarRendaMensal(valor, competencia) {
  definirRendaMensal(valor);
  definirRendaMensalCompetencia(competencia || null);
  // Disparar evento para que outras páginas sejam notificadas
  window.dispatchEvent(new CustomEvent('rendaMensalAtualizada', { detail: { renda: valor, competencia: competencia || null } }));
}

function exibirConfiguradorRenda(callback) {
  const rendaAtual = obterRendaMensal();

  const html = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
      <div style="background: white; padding: 24px; border-radius: 8px; max-width: 400px; width: 90%;">
        <h2 style="margin-top: 0; margin-bottom: 16px; color: var(--cor-primaria);">Configurar Renda Mensal</h2>
        <p style="color: #666; margin-bottom: 16px;">Esta renda será usada em Reserva de Emergência, Envelopes e outras ferramentas.</p>

        <label style="display: block; font-weight: 500; margin-bottom: 8px;">Renda Mensal (R$)</label>
        <input type="number" id="temp-renda-input" min="0" step="0.01" value="${rendaAtual || ''}" placeholder="Ex: 3000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px; margin-bottom: 16px;">

        <div style="display: flex; gap: 8px;">
          <button id="temp-salvar-renda" style="flex: 1; padding: 10px; background: var(--cor-primaria); color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Salvar</button>
          <button id="temp-cancelar-renda" style="flex: 1; padding: 10px; background: #f0f0f0; color: #333; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; cursor: pointer;">Cancelar</button>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  const inputRenda = document.getElementById('temp-renda-input');
  const btnSalvar = document.getElementById('temp-salvar-renda');
  const btnCancelar = document.getElementById('temp-cancelar-renda');

  btnSalvar.addEventListener('click', () => {
    const valor = parseValorBrasileiro(inputRenda.value);
    if (valor && valor > 0) {
      atualizarRendaMensal(valor);
      container.remove();
      if (callback) callback(valor);
    } else {
      alert('Por favor, insira uma renda válida (ex: 3000,00 ou 3000.00)');
    }
  });

  btnCancelar.addEventListener('click', () => {
    container.remove();
  });

  inputRenda.focus();
  inputRenda.select();
}

// Adicionar listener global para atualizar renda em tempo real
window.addEventListener('rendaMensalAtualizada', (e) => {
  console.log('Renda mensal atualizada para: R$', e.detail.renda);
});
