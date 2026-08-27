class GerenciadorEmprestimos {
  constructor() {
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
    const dadosSalvos = localStorage.getItem('emprestimos_dados');
    this.emprestimos = dadosSalvos ? JSON.parse(dadosSalvos) : [];
  }

  salvarDados() {
    localStorage.setItem('emprestimos_dados', JSON.stringify(this.emprestimos));
  }

  definirDataHoje() {
    const hoje = new Date().toISOString().split('T')[0];
    const inputData = document.getElementById('data-emprestimo');
    if (inputData && !inputData.value) {
      inputData.value = hoje;
    }
  }

  setupEventos() {
    // Formulário de novo empréstimo
    const form = document.getElementById('form-emprestimo');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.adicionarEmprestimo();
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

  adicionarEmprestimo() {
    const nome = document.getElementById('nome-pessoa').value.trim();
    const valor = parseFloat(document.getElementById('valor-emprestimo').value);
    const data = document.getElementById('data-emprestimo').value;
    const observacao = document.getElementById('observacao').value.trim();

    if (!nome || !valor || valor <= 0 || !data) {
      alert('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    const emprestimo = {
      id: Date.now(),
      pessoa: nome,
      valor: valor,
      data: data,
      observacao: observacao,
      status: 'ativo',
      dataPagamento: null
    };

    this.emprestimos.push(emprestimo);
    this.salvarDados();
    this.renderizar();
    this.atualizarResumo();

    // Limpar formulário
    document.getElementById('form-emprestimo').reset();
    this.definirDataHoje();

    alert(`Empréstimo de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${nome} registrado!`);
  }

  renderizar() {
    const listaEmprestimos = document.getElementById('lista-emprestimos');
    const filtroAtivo = document.querySelector('.btn-filtro.ativo')?.dataset.filtro || 'todos';

    listaEmprestimos.innerHTML = '';

    const emprestimosFiltrados = filtroAtivo === 'todos'
      ? this.emprestimos
      : this.emprestimos.filter(e => e.status === filtroAtivo);

    if (emprestimosFiltrados.length === 0) {
      listaEmprestimos.innerHTML = '<div class="lista-vazia">Nenhum empréstimo registrado com este filtro.</div>';
      return;
    }

    // Ordenar por data (mais recente primeiro)
    emprestimosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

    emprestimosFiltrados.forEach(emprestimo => {
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
          <button class="btn-acao btn-deletar" onclick="deletarEmprestimo(${emprestimo.id})">
            Deletar
          </button>
        </div>
      `;

      listaEmprestimos.appendChild(div);
    });
  }

  atualizarResumo() {
    const totalEmprestado = this.emprestimos.reduce((sum, e) => sum + e.valor, 0);
    const totalPendente = this.emprestimos
      .filter(e => e.status === 'ativo')
      .reduce((sum, e) => sum + e.valor, 0);
    const totalRecebido = this.emprestimos
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
    document.getElementById('quantidade-registros').textContent = this.emprestimos.length;
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
    const emprestimo = this.emprestimos.find(e => e.id === id);
    if (emprestimo) {
      emprestimo.status = 'pago';
      emprestimo.dataPagamento = new Date().toISOString().split('T')[0];
      this.salvarDados();
      this.renderizar();
      this.atualizarResumo();
    }
  }

  deletarEmprestimo(id) {
    const emprestimo = this.emprestimos.find(e => e.id === id);
    if (emprestimo && confirm(`Deletar empréstimo de ${emprestimo.pessoa}?`)) {
      this.emprestimos = this.emprestimos.filter(e => e.id !== id);
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
  window.gerenciadorEmprestimos = new GerenciadorEmprestimos();

  // Botão de confirmar pagamento no modal
  document.getElementById('btn-confirmar-pagamento').addEventListener('click', () => {
    if (idEmprestimoModal) {
      window.gerenciadorEmprestimos.marcarComoPago(idEmprestimoModal);
      fecharModal();
    }
  });

  // Funções globais para onclick dos botões
  window.abrirModalPagamento = abrirModalPagamento;
  window.fecharModal = fecharModal;
  window.deletarEmprestimo = (id) => {
    window.gerenciadorEmprestimos.deletarEmprestimo(id);
  };
});
