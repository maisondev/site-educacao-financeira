class GerenciadorCartoesAdicionais {
  constructor() {
    this.editandoId = null;
    this.inicializar();
  }

  inicializar() {
    this.carregarDados();
    this.setupEventos();
    this.renderizar();
    this.atualizarResumo();
    this.definirDataHoje();
  }

  carregarDados() {
    const dadosSalvos = localStorage.getItem('cartoes_adicionais_dados');
    this.cartoes = dadosSalvos ? JSON.parse(dadosSalvos) : [];
  }

  salvarDados() {
    localStorage.setItem('cartoes_adicionais_dados', JSON.stringify(this.cartoes));
  }

  definirDataHoje() {
    const hoje = new Date().toISOString().split('T')[0];
    const inputData = document.getElementById('data-emprestimo');
    if (inputData && !inputData.value) {
      inputData.value = hoje;
    }
  }

  setupEventos() {
    // Formulário de novo cartão
    const form = document.getElementById('form-cartao');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.adicionarCartao();
      });
    }

    // Filtros
    document.querySelectorAll('.btn-filtro').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        this.renderizar();
      });
    });
  }

  adicionarCartao() {
    const nome = document.getElementById('nome-titular').value.trim();
    const valor = parseFloat(document.getElementById('valor-saldo').value);
    const data = document.getElementById('data-cartao').value;
    const observacao = document.getElementById('observacao').value.trim();

    if (!nome || !valor || valor < 0 || !data) {
      alert('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    if (this.editandoId !== null) {
      const cartao = this.cartoes.find(c => c.id === this.editandoId);
      if (cartao) {
        cartao.pessoa = nome;
        cartao.valor = valor;
        cartao.data = data;
        cartao.observacao = observacao;
      }
      this.salvarDados();
      this.renderizar();
      this.atualizarResumo();
      this.cancelarEdicao();
      return;
    }

    const cartao = {
      id: Date.now(),
      pessoa: nome,
      valor: valor,
      data: data,
      observacao: observacao,
      status: 'ativo',
      dataPagamento: null
    };

    this.cartoes.push(cartao);
    this.salvarDados();
    this.renderizar();
    this.atualizarResumo();

    // Limpar formulário
    document.getElementById('form-cartao').reset();
    this.definirDataHoje();

    // Mostrar mensagem de sucesso
    console.log(`Cartão de ${nome} com saldo R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado!`);
  }

  iniciarEdicao(id) {
    const cartao = this.cartoes.find(c => c.id === id);
    if (!cartao) return;

    this.editandoId = id;
    document.getElementById('nome-titular').value = cartao.pessoa || '';
    document.getElementById('valor-saldo').value = cartao.valor;
    document.getElementById('data-cartao').value = cartao.data || '';
    document.getElementById('observacao').value = cartao.observacao || '';

    document.getElementById('titulo-form-cartao').textContent = 'Editar Cartão Adicional';
    document.getElementById('btn-salvar-cartao').textContent = 'Salvar alterações';
    document.getElementById('btn-cancelar-cartao').style.display = '';
    document.getElementById('titulo-form-cartao').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelarEdicao() {
    this.editandoId = null;
    document.getElementById('form-cartao').reset();
    this.definirDataHoje();
    document.getElementById('titulo-form-cartao').textContent = 'Novo Cartão Adicional';
    document.getElementById('btn-salvar-cartao').textContent = 'Registrar Cartão';
    document.getElementById('btn-cancelar-cartao').style.display = 'none';
  }

  renderizar() {
    const listaEmprestimos = document.getElementById('lista-emprestimos');
    const filtroAtivo = document.querySelector('.btn-filtro.ativo')?.dataset.filtro || 'todos';

    listaEmprestimos.innerHTML = '';

    const cartoesFiltrados = filtroAtivo === 'todos'
      ? this.cartoes
      : this.cartoes.filter(e => e.status === filtroAtivo);

    if (cartoesFiltrados.length === 0) {
      listaEmprestimos.innerHTML = '<div class="lista-vazia">Nenhum cartão adicional registrado com este filtro.</div>';
      return;
    }

    // Ordenar por data (mais recente primeiro)
    cartoesFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

    cartoesFiltrados.forEach(cartao => {
      const emprestimo = cartao;
      const div = document.createElement('div');
      div.className = `emprestimo-item ${emprestimo.status === 'pago' ? 'pago' : ''}`;

      const dataBr = this.formatarData(emprestimo.data);
      const dataPagamentoBr = emprestimo.dataPagamento
        ? this.formatarData(emprestimo.dataPagamento)
        : '-';

      const valorFormatado = emprestimo.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

      div.innerHTML = `
        <div class="emprestimo-header">
          <div>
            <div class="emprestimo-pessoa ${emprestimo.status === 'pago' ? 'pago' : ''}">
              ${emprestimo.pessoa}
            </div>
            <span class="badge-status badge-${emprestimo.status}">
              ${emprestimo.status === 'ativo' ? 'Pendente' : 'Recebido'}
            </span>
          </div>
          <div class="emprestimo-valor">${valorFormatado}</div>
        </div>

        <div class="emprestimo-meta">
          <div class="emprestimo-meta-item">
            <span class="emprestimo-meta-label">Data do empréstimo</span>
            ${dataBr}
          </div>
          <div class="emprestimo-meta-item">
            <span class="emprestimo-meta-label">Data do pagamento</span>
            ${dataPagamentoBr}
          </div>
        </div>

        ${emprestimo.observacao ? `
          <div class="emprestimo-observacao">
            ${this.escaparHTML(emprestimo.observacao)}
          </div>
        ` : ''}

        <div class="emprestimo-acoes">
          ${emprestimo.status === 'ativo' ? `
            <button class="btn-acao btn-pagar" onclick="abrirModalPagamento(${emprestimo.id})">
              Marcar como Pago
            </button>
          ` : ''}
          <button class="btn-acao btn-pagar" onclick="editarCartaoAdicional(${emprestimo.id})">
            Editar
          </button>
          <button class="btn-acao btn-deletar" onclick="deletarEmprestimo(${emprestimo.id})">
            Deletar
          </button>
        </div>
      `;

      listaEmprestimos.appendChild(div);
    });
  }

  atualizarResumo() {
    const totalEmprestado = this.cartoes.reduce((sum, e) => sum + e.valor, 0);
    const totalPendente = this.cartoes
      .filter(e => e.status === 'ativo')
      .reduce((sum, e) => sum + e.valor, 0);
    const totalRecebido = this.cartoes
      .filter(e => e.status === 'pago')
      .reduce((sum, e) => sum + e.valor, 0);

    const formatarMoeda = (valor) => {
      return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    };

    document.getElementById('total-emprestado').textContent = formatarMoeda(totalEmprestado);
    document.getElementById('total-pendente').textContent = formatarMoeda(totalPendente);
    document.getElementById('total-recebido').textContent = formatarMoeda(totalRecebido);
    document.getElementById('quantidade-registros').textContent = this.cartoes.length;
  }

  formatarData(data) {
    const opcoes = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', opcoes);
  }

  escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  marcarComoPago(id) {
    const cartao = this.cartoes.find(e => e.id === id);
    if (cartao) {
      cartao.status = 'pago';
      cartao.dataPagamento = new Date().toISOString().split('T')[0];
      this.salvarDados();
      this.renderizar();
      this.atualizarResumo();
    }
  }

  deletarCartao(id) {
    const cartao = this.cartoes.find(e => e.id === id);
    if (cartao && confirm(`Deletar cartão de ${cartao.pessoa}?`)) {
      this.cartoes = this.cartoes.filter(e => e.id !== id);
      this.salvarDados();
      this.renderizar();
      this.atualizarResumo();
    }
  }
}

// Variável global para modal
let idEmprestimoModal = null;

function abrirModalPagamento(id) {
  idEmprestimoModal = id;
  const emprestimo = window.gerenciadorEmprestimos.emprestimos.find(e => e.id === id);

  if (emprestimo) {
    document.getElementById('modal-pessoa').textContent = emprestimo.pessoa;
    document.getElementById('modal-valor').textContent = emprestimo.valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const hoje = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    document.getElementById('modal-data').textContent = hoje;

    document.getElementById('modal-pagamento').classList.add('ativo');
  }
}

function fecharModal() {
  document.getElementById('modal-pagamento').classList.remove('ativo');
  idEmprestimoModal = null;
}

// Documento pronto
document.addEventListener('DOMContentLoaded', () => {
  window.gerenciadorCartoesAdicionais = new GerenciadorCartoesAdicionais();

  // Botão de confirmar pagamento no modal
  document.getElementById('btn-confirmar-pagamento').addEventListener('click', () => {
    if (idEmprestimoModal) {
      window.gerenciadorCartoesAdicionais.marcarComoPago(idEmprestimoModal);
      fecharModal();
    }
  });

  // Funções globais para onclick dos botões
  window.abrirModalPagamento = abrirModalPagamento;
  window.fecharModal = fecharModal;
  window.deletarEmprestimo = (id) => {
    window.gerenciadorCartoesAdicionais.deletarCartao(id);
  };
  window.editarCartaoAdicional = (id) => {
    window.gerenciadorCartoesAdicionais.iniciarEdicao(id);
  };
});
