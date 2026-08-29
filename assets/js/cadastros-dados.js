// Cadastros gerais: listas básicas que alimentam os selects do app
// (categorias de despesa, formas de pagamento, estabelecimentos).
// Persistem no localStorage sob a chave 'cadastros_gerais'.
// A página cadastros.html gerencia esses dados; as demais páginas só leem.

const CAD_CHAVE = (typeof Store !== 'undefined' && Store.CHAVES)
  ? Store.CHAVES.CADASTROS : 'cadastros_gerais';

// Padrões embutidos — sempre presentes, não podem ser removidos.
// Vocabulário único consumido por despesas fixas, despesas variáveis e relatórios.
// As chaves antigas de cada página continuam aqui para não órfãos registros já salvos.
const CAD_CATEGORIAS_PADRAO = {
  moradia: 'Moradia (Aluguel / Financiamento)',
  agua: 'Água',
  luz: 'Luz / Energia Elétrica',
  gas: 'Gás',
  internet: 'Internet',
  telefone: 'Telefone / Celular',
  streaming: 'Streaming / Assinaturas',
  assinatura: 'Assinaturas',
  alimentacao: 'Alimentação',
  mercado: 'Mercado / Alimentação',
  transporte: 'Transporte',
  combustivel: 'Combustível',
  manutencao: 'Manutenção / Consertos',
  saude: 'Saúde',
  educacao: 'Educação',
  lazer: 'Lazer',
  cuidados: 'Cuidados Pessoais',
  pets: 'Pets',
  seguros: 'Seguros',
  financiamento: 'Empréstimos / Financiamentos',
  dividas: 'Dívidas',
  cartao: 'Cartão de Crédito',
  impostos: 'Impostos / Taxas',
  investimentos: 'Investimentos',
  doacoes: 'Doações / Dízimo',
  outro: 'Outro'
};

const CAD_PAGAMENTOS_PADRAO = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto'
};

const Cadastros = {
  ler() {
    return Store.ler(CAD_CHAVE, {}) || {};
  },

  gravar(dados) {
    Store.gravar(CAD_CHAVE, dados);
  },

  // Transforma um rótulo em chave: "Pet / Animais" -> "pet-animais"
  gerarChave(rotulo) {
    return (rotulo || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || ('item-' + Date.now());
  },

  _mapaMesclado(padrao, listaExtra) {
    const mapa = Object.assign({}, padrao);
    (listaExtra || []).forEach(c => {
      if (c && c.chave) mapa[c.chave] = c.rotulo || c.chave;
    });
    return mapa;
  },

  categorias() {
    return this._mapaMesclado(CAD_CATEGORIAS_PADRAO, this.ler().categorias);
  },

  categoriasCustom() {
    return this.ler().categorias || [];
  },

  formasPagamento() {
    return this._mapaMesclado(CAD_PAGAMENTOS_PADRAO, this.ler().formasPagamento);
  },

  formasPagamentoCustom() {
    return this.ler().formasPagamento || [];
  },

  estabelecimentos() {
    return (this.ler().estabelecimentos || [])
      .slice()
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  },

  temEstabelecimento(nome) {
    const alvo = (nome || '').trim().toLowerCase();
    if (!alvo) return true;
    return (this.ler().estabelecimentos || []).some(e => e.toLowerCase() === alvo);
  },

  adicionarEstabelecimento(nome) {
    const limpo = (nome || '').trim();
    if (!limpo || this.temEstabelecimento(limpo)) return false;
    const dados = this.ler();
    dados.estabelecimentos = dados.estabelecimentos || [];
    dados.estabelecimentos.push(limpo);
    this.gravar(dados);
    return true;
  },

  ehPadraoCategoria(chave) {
    return Object.prototype.hasOwnProperty.call(CAD_CATEGORIAS_PADRAO, chave);
  },

  ehPadraoPagamento(chave) {
    return Object.prototype.hasOwnProperty.call(CAD_PAGAMENTOS_PADRAO, chave);
  }
};
