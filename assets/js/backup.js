// Backup de todos os dados financeiros guardados no localStorage.
// Exporta um único .json com todas as chaves e permite restaurar depois.

const BACKUP_VERSAO = 1;
const CHAVE_BACKUP_ULTIMA_DATA = 'backup_ultima_data';
const CHAVE_BACKUP_AUTO_ULTIMA_DATA = 'backup_auto_ultima_data';
const BACKUP_DIAS_ALERTA = 30;

// Catálogo das chaves usadas pelo site, vindo do Store quando disponível.
// A exportação varre também o que estiver no localStorage fora desta lista,
// então nada é esquecido se uma página nova criar a própria chave.
const BACKUP_CHAVES_CONHECIDAS = typeof Store !== 'undefined'
  ? Object.values(Store.CHAVES)
  : [];

// Chaves que não fazem parte dos dados do usuário e não entram no backup.
const BACKUP_CHAVES_IGNORADAS = [CHAVE_BACKUP_ULTIMA_DATA, CHAVE_BACKUP_AUTO_ULTIMA_DATA];

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
    ${backupAutoDisponivel() ? '<div id="container-backup-auto" class="backup-auto">Verificando backup automático…</div>' : ''}
  `;

  document.getElementById('btn-exportar-backup').addEventListener('click', exportarTudo);
  const input = document.getElementById('input-importar-backup');
  document.getElementById('btn-importar-backup').addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    importarTudo(e.target.files[0]);
    e.target.value = '';
  });

  if (backupAutoDisponivel()) {
    inicializarBackupAutomatico().catch(e => console.error('[backup] auto:', e));
  }
}

// ---------------------------------------------------------------------------
// Backup automático diário para uma pasta escolhida pelo usuário.
//
// Usa a File System Access API (Chrome/Edge). O usuário escolhe a pasta uma
// única vez; o handle fica guardado no IndexedDB e, a cada abertura do
// dashboard, se o backup do dia ainda não foi gravado, o arquivo
// financas-backup-AAAA-MM-DD.json é salvo silenciosamente naquela pasta.
// ---------------------------------------------------------------------------

const BACKUP_IDB_NOME = 'financas-backup';
const BACKUP_IDB_STORE = 'handles';
const BACKUP_IDB_CHAVE = 'pasta';

function backupAutoDisponivel() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

function backupAbrirIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BACKUP_IDB_NOME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(BACKUP_IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function backupIDBOperacao(modo, fn) {
  return backupAbrirIDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_IDB_STORE, modo);
    const store = tx.objectStore(BACKUP_IDB_STORE);
    const req = fn(store);
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
  }));
}

function backupGuardarHandle(handle) {
  return backupIDBOperacao('readwrite', store => store.put(handle, BACKUP_IDB_CHAVE));
}

function backupLerHandle() {
  return backupIDBOperacao('readonly', store => store.get(BACKUP_IDB_CHAVE)).catch(() => null);
}

function backupLimparHandle() {
  return backupIDBOperacao('readwrite', store => store.delete(BACKUP_IDB_CHAVE));
}

// Confere a permissão de escrita no handle. Com solicitar=true pode exibir
// um pedido do navegador; com false apenas consulta o estado atual.
async function backupPermissaoOk(handle, solicitar) {
  if (!handle || !handle.queryPermission) return false;
  const opcoes = { mode: 'readwrite' };
  if ((await handle.queryPermission(opcoes)) === 'granted') return true;
  if (solicitar && (await handle.requestPermission(opcoes)) === 'granted') return true;
  return false;
}

async function backupGravarNaPasta(handle) {
  const backup = montarBackup();
  const nome = `financas-backup-${backupDataHojeISO()}.json`;
  const arquivo = await handle.getFileHandle(nome, { create: true });
  const stream = await arquivo.createWritable();
  await stream.write(JSON.stringify(backup, null, 2));
  await stream.close();

  const hoje = backupDataHojeISO();
  localStorage.setItem(CHAVE_BACKUP_AUTO_ULTIMA_DATA, hoje);
  localStorage.setItem(CHAVE_BACKUP_ULTIMA_DATA, hoje);
  return nome;
}

async function ativarBackupAutomatico() {
  let handle;
  try {
    handle = await window.showDirectoryPicker({ id: 'financas-backup', mode: 'readwrite' });
  } catch (e) {
    return; // usuário cancelou a escolha da pasta
  }
  if (!(await backupPermissaoOk(handle, true))) {
    alert('Sem permissão de escrita na pasta escolhida. O backup automático não foi ativado.');
    return;
  }
  await backupGuardarHandle(handle);
  try {
    await backupGravarNaPasta(handle);
  } catch (e) {
    alert('Pasta salva, mas falhou ao gravar o primeiro backup: ' + e.message);
  }
  renderizarSecaoBackup();
}

async function desativarBackupAutomatico() {
  await backupLimparHandle();
  localStorage.removeItem(CHAVE_BACKUP_AUTO_ULTIMA_DATA);
  renderizarSecaoBackup();
}

async function inicializarBackupAutomatico() {
  const container = document.getElementById('container-backup-auto');
  if (!container) return;

  const handle = await backupLerHandle();

  if (!handle) {
    container.innerHTML = `
      <p class="backup-aviso">
        Backup automático desligado. Escolha uma pasta (ex.: uma dentro do Google Drive)
        e o site grava um arquivo por dia lá, sem você precisar lembrar.
      </p>
      <button type="button" class="btn btn-secondary" id="btn-ativar-backup-auto">Ativar backup automático…</button>
    `;
    document.getElementById('btn-ativar-backup-auto')
      .addEventListener('click', () => ativarBackupAutomatico());
    return;
  }

  const temPermissao = await backupPermissaoOk(handle, false);
  const ultima = localStorage.getItem(CHAVE_BACKUP_AUTO_ULTIMA_DATA);
  const precisaHoje = ultima !== backupDataHojeISO();
  let status;

  if (temPermissao && precisaHoje) {
    try {
      const nome = await backupGravarNaPasta(handle);
      status = `<p class="backup-aviso">Backup automático gravado hoje: <code>${nome}</code> em <strong>${handle.name}</strong>.</p>`;
    } catch (e) {
      status = `<p class="backup-aviso backup-aviso-atencao">Falha ao gravar o backup de hoje na pasta <strong>${handle.name}</strong>: ${e.message}</p>`;
    }
  } else if (temPermissao) {
    status = `<p class="backup-aviso">Backup automático ativo na pasta <strong>${handle.name}</strong>. Já gravado hoje.</p>`;
  } else {
    status = `
      <p class="backup-aviso backup-aviso-atencao">
        Backup automático configurado para <strong>${handle.name}</strong>, mas o navegador
        precisa reconfirmar o acesso à pasta.
      </p>
      <button type="button" class="btn btn-secondary" id="btn-reautorizar-backup-auto">Reautorizar pasta</button>`;
  }

  container.innerHTML = `
    ${status}
    <button type="button" class="btn btn-secondary" id="btn-desativar-backup-auto">Desativar backup automático</button>
  `;

  const btnReautorizar = document.getElementById('btn-reautorizar-backup-auto');
  if (btnReautorizar) {
    btnReautorizar.addEventListener('click', async () => {
      if (await backupPermissaoOk(handle, true)) inicializarBackupAutomatico();
    });
  }
  document.getElementById('btn-desativar-backup-auto')
    .addEventListener('click', () => desativarBackupAutomatico());
}
