// Backup de todos os dados financeiros guardados no localStorage.
// Exporta um único .json com todas as chaves e permite restaurar depois.

const BACKUP_VERSAO = 1;
const CHAVE_BACKUP_ULTIMA_DATA = 'backup_ultima_data';
const BACKUP_DIAS_ALERTA = 30;

// Catálogo das chaves usadas pelo site, vindo do Store quando disponível.
// A exportação varre também o que estiver no localStorage fora desta lista,
// então nada é esquecido se uma página nova criar a própria chave.
const BACKUP_CHAVES_CONHECIDAS = typeof Store !== 'undefined'
  ? Object.values(Store.CHAVES)
  : [];

// Chaves que não fazem parte dos dados do usuário e não entram no backup.
const BACKUP_CHAVES_IGNORADAS = [CHAVE_BACKUP_ULTIMA_DATA];

function backupListarChaves() {
  const chaves = new Set(BACKUP_CHAVES_CONHECIDAS);
  for (let i = 0; i < localStorage.length; i++) {
    chaves.add(localStorage.key(i));
  }
  return Array.from(chaves)
    .filter(chave => BACKUP_CHAVES_IGNORADAS.indexOf(chave) === -1)
    .filter(chave => localStorage.getItem(chave) !== null)
    .sort();
}

function backupDataHojeISO() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

// Conteúdo do backup: valores guardados como texto puro, exatamente como
// estão no localStorage — assim a restauração é fiel mesmo se o formato mudar.
function montarBackup() {
  const dados = {};
  backupListarChaves().forEach(chave => {
    dados[chave] = localStorage.getItem(chave);
  });
  return {
    versao: BACKUP_VERSAO,
    geradoEm: new Date().toISOString(),
    origem: location.origin + location.pathname,
    dados
  };
}

function exportarTudo() {
  const backup = montarBackup();
  const quantidade = Object.keys(backup.dados).length;

  if (quantidade === 0) {
    alert('Não há dados guardados neste navegador para exportar.');
    return;
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financas-backup-${backupDataHojeISO()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  localStorage.setItem(CHAVE_BACKUP_ULTIMA_DATA, backupDataHojeISO());
  renderizarSecaoBackup();
}

function validarBackup(objeto) {
  if (!objeto || typeof objeto !== 'object') return 'Arquivo não é um backup válido.';
  if (objeto.versao !== BACKUP_VERSAO) {
    return `Backup na versão ${objeto.versao || '?'}; este site lê a versão ${BACKUP_VERSAO}.`;
  }
  if (!objeto.dados || typeof objeto.dados !== 'object') return 'Backup sem a seção de dados.';
  const invalida = Object.keys(objeto.dados).find(chave => typeof objeto.dados[chave] !== 'string');
  if (invalida) return `Conteúdo inesperado na chave "${invalida}".`;
  return null;
}

// Restaura substituindo tudo: as chaves ausentes no arquivo são removidas,
// para que o navegador fique idêntico ao momento em que o backup foi gerado.
function aplicarBackup(objeto) {
  const chavesAtuais = backupListarChaves();
  chavesAtuais
    .filter(chave => !(chave in objeto.dados))
    .forEach(chave => localStorage.removeItem(chave));

  Object.keys(objeto.dados).forEach(chave => {
    localStorage.setItem(chave, objeto.dados[chave]);
  });
}

function importarTudo(arquivo) {
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = () => {
    let objeto;
    try {
      objeto = JSON.parse(leitor.result);
    } catch (e) {
      alert('Não foi possível ler o arquivo: JSON inválido.');
      return;
    }

    const erro = validarBackup(objeto);
    if (erro) {
      alert('Backup não pode ser restaurado.\n\n' + erro);
      return;
    }

    const quantidade = Object.keys(objeto.dados).length;
    const geradoEm = objeto.geradoEm ? new Date(objeto.geradoEm).toLocaleString('pt-BR') : 'data desconhecida';
    const confirmado = confirm(
      `Restaurar o backup de ${geradoEm} (${quantidade} conjunto(s) de dados)?\n\n` +
      'Todos os dados atuais deste navegador serão substituídos. Esta ação não pode ser desfeita.'
    );
    if (!confirmado) return;

    try {
      aplicarBackup(objeto);
    } catch (e) {
      alert('Falha ao gravar os dados restaurados: ' + e.message);
      return;
    }

    alert('Backup restaurado. A página será recarregada.');
    location.reload();
  };
  leitor.onerror = () => alert('Não foi possível ler o arquivo selecionado.');
  leitor.readAsText(arquivo);
}

function obterDiasDesdeUltimoBackup() {
  const ultima = localStorage.getItem(CHAVE_BACKUP_ULTIMA_DATA);
  if (!ultima) return null;
  const data = new Date(ultima + 'T00:00:00');
  if (isNaN(data.getTime())) return null;
  const hoje = new Date(backupDataHojeISO() + 'T00:00:00');
  return Math.round((hoje - data) / 86400000);
}

function renderizarSecaoBackup() {
  const container = document.getElementById('container-backup');
  if (!container) return;

  const dias = obterDiasDesdeUltimoBackup();
  const ultima = localStorage.getItem(CHAVE_BACKUP_ULTIMA_DATA);
  let aviso = '';

  if (dias === null) {
    aviso = '<p class="backup-aviso backup-aviso-atencao">Você ainda não exportou nenhum backup neste navegador.</p>';
  } else if (dias >= BACKUP_DIAS_ALERTA) {
    aviso = `<p class="backup-aviso backup-aviso-atencao">Último backup há ${dias} dia(s) — vale exportar de novo.</p>`;
  } else {
    const quando = new Date(ultima + 'T00:00:00').toLocaleDateString('pt-BR');
    aviso = `<p class="backup-aviso">Último backup em ${quando}.</p>`;
  }

  container.innerHTML = `
    <h2>Backup dos dados</h2>
    <p class="backup-descricao">
      Seus dados ficam só neste navegador. Limpar o cache, trocar de computador ou usar o celular
      significa começar do zero — exporte um arquivo de backup com frequência e guarde em local seguro.
    </p>
    ${aviso}
    <div class="backup-acoes">
      <button type="button" class="btn btn-primary" id="btn-exportar-backup">Exportar dados</button>
      <button type="button" class="btn btn-secondary" id="btn-importar-backup">Importar backup</button>
      <input type="file" id="input-importar-backup" accept="application/json,.json" hidden>
    </div>
  `;

  document.getElementById('btn-exportar-backup').addEventListener('click', exportarTudo);
  const input = document.getElementById('input-importar-backup');
  document.getElementById('btn-importar-backup').addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    importarTudo(e.target.files[0]);
    e.target.value = '';
  });
}
