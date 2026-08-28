// Camada única de acesso ao localStorage.
// Centraliza o catálogo de chaves e trata JSON corrompido e falta de espaço,
// para que nenhuma página quebre por causa de um dado malformado.

const Store = {
  // Catálogo único de nomes de chave. Use Store.CHAVES.X em vez de string solta.
  CHAVES: {
    RENDA: 'renda_mensal',
    RENDA_COMPETENCIA: 'renda_mensal_competencia',
    RECEITAS: 'receitas_lista',
    CONTRACHEQUES: 'contracheques_historico',
    RENDAS_EXTRAS: 'rendas_extras',
    DESPESAS_FIXAS: 'despesas_fixas',
    DESPESAS_VARIAVEIS: 'despesas_variaveis',
    DESPESAS_VARIAVEIS_COLAPSADAS: 'despesas_variaveis_colapsadas',
    ENVELOPES: 'envelopes_financeiros',
    METAS: 'metas_financeiras',
    DIVIDAS: 'dividas',
    CARRO: 'carro',
    INVESTIMENTOS: 'investimentos',
    FGTS: 'fgts',
    BALANCO: 'balanco_patrimonial',
    RESERVA: 'reserva_emergencia',
    CARTOES: 'cartoes',
    CARTOES_FINANCEIROS: 'cartoes_financeiros',
    CARTAO_CREDITO: 'cartao_credito',
    CARTOES_ADICIONAIS: 'cartoes_adicionais_dados',
    COMPRAS_PARCELADAS: 'compras_parceladas',
    HACKS_NUBANK: 'hacks_nubank_dados',
    CURSOS: 'cursos_lista',
    DESAPEGO: 'desapego_itens',
    ANALISE_FATURAS: 'analise_faturas',
    BACKUP_ULTIMA_DATA: 'backup_ultima_data',
    COMPETENCIA_SELECIONADA: 'competencia_selecionada',
    HISTORICO_MENSAL: 'historico_mensal'
  },

  // Lê e desserializa. Devolve `padrao` quando a chave não existe ou o
  // conteúdo está corrompido — a página segue funcionando com dados vazios.
  ler(chave, padrao = null) {
    let bruto;
    try {
      bruto = localStorage.getItem(chave);
    } catch (e) {
      console.error(`[storage] leitura de "${chave}" indisponível:`, e);
      return padrao;
    }
    if (bruto === null) return padrao;
    try {
      const valor = JSON.parse(bruto);
      return valor === null ? padrao : valor;
    } catch (e) {
      console.error(`[storage] conteúdo inválido em "${chave}", usando o padrão:`, e);
      return padrao;
    }
  },

  // Grava serializando. Devolve false (com aviso ao usuário) se o navegador
  // recusar a escrita — normalmente cota estourada ou modo privado.
  gravar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      console.error(`[storage] falha ao gravar "${chave}":`, e);
      const semEspaco = e && (e.name === 'QuotaExceededError' || e.code === 22);
      alert(semEspaco
        ? 'Não foi possível salvar: o armazenamento do navegador está cheio. Exporte um backup e remova registros antigos.'
        : 'Não foi possível salvar os dados neste navegador.');
      return false;
    }
  },

  remover(chave) {
    try {
      localStorage.removeItem(chave);
      return true;
    } catch (e) {
      console.error(`[storage] falha ao remover "${chave}":`, e);
      return false;
    }
  },

  // Texto puro, para valores que não são JSON (ex.: renda gravada como "5000").
  lerTexto(chave, padrao = null) {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto === null ? padrao : bruto;
    } catch (e) {
      console.error(`[storage] leitura de "${chave}" indisponível:`, e);
      return padrao;
    }
  }
};
