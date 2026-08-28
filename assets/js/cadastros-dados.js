// Cadastros gerais: listas básicas que alimentam os selects do app
// (categorias de despesa, formas de pagamento, estabelecimentos).
// Persistem no localStorage sob a chave 'cadastros_gerais'.
// A página cadastros.html gerencia esses dados; as demais páginas só leem.

const CAD_CHAVE = 'cadastros_gerais';

// Padrões embutidos — sempre presentes, não podem ser removidos.
const CAD_CATEGORIAS_PADRAO = {
  agua: 'Água',
  luz: 'Luz / Energia Elétrica',
  gas: 'Gás',
  internet: 'Internet',
  telefone: 'Telefone / Celular',
  streaming: 'Streaming / Assinaturas',
  alimentacao: 'Alimentação',
  combustivel: 'Combustível',
  manutencao: 'Manutenção / Consertos',
  cartao: 'Cartão de Crédito',
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
    try {
      return JSON.parse(localStorage.getItem(CAD_CHAVE)) || {};
    } catch (e) {
      return {};
    }
  },

  gravar(dados) {
    localStorage.setItem(CAD_CHAVE, JSON.stringify(dados));
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
