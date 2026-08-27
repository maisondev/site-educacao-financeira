const HACKS = [
  {
    id: 1,
    titulo: "Revisar extrato e classificar despesas",
    descricao: "Abra seu extrato e organize por categoria (alimentação, transporte, etc). Isso ajuda a entender padrões de gasto.",
    categoria: "otimizacao",
    economia: 0
  },
  {
    id: 2,
    titulo: "Verificar reembolsos e pendências",
    descricao: "O Nubank às vezes processa reembolsos automaticamente. Veja se há algum pendente na aba 'Atividade'.",
    categoria: "economia",
    economia: 50
  },
  {
    id: 3,
    titulo: "Ativar Cashback em uma categoria",
    descricao: "Se você tem programa de Cashback, ative em uma categoria que mais gasta (alimentação, combustível, etc).",
    categoria: "beneficio",
    economia: 100
  },
  {
    id: 4,
    titulo: "Revisar limite de crédito",
    descricao: "Veja se seu limite aumentou automaticamente. O Nubank oferece aumentos periódicos sem solicitação.",
    categoria: "otimizacao",
    economia: 0
  },
  {
    id: 5,
    titulo: "Configurar metas de economia",
    descricao: "Use a funcionalidade de 'Guardar' no app para separar valor mensal. Cria uma meta visível.",
    categoria: "otimizacao",
    economia: 0
  },
  {
    id: 6,
    titulo: "Verificar programas de desconto",
    descricao: "Na aba 'Ofertas' do app, há descontos em parceiros (cinema, restaurante, viagem). Guarde os que usa.",
    categoria: "beneficio",
    economia: 150
  },
  {
    id: 7,
    titulo: "Fazer uma transferência entre contas próprias via Pix",
    descricao: "Se tem conta em outro banco, teste uma transferência Pix do Nubank. É instantâneo e sem taxa.",
    categoria: "otimizacao",
    economia: 0
  },
  {
    id: 8,
    titulo: "Revisar relatório mensal de gastos",
    descricao: "Acesse o resumo visual de despesas por categoria. Identifique onde pode cortar sem sacrifício.",
    categoria: "otimizacao",
    economia: 0
  },
  {
    id: 9,
    titulo: "Atualizar dados cadastrais",
    descricao: "Verifique se telefone, email e endereço estão corretos. Importante para segurança e para receber ofertas.",
    categoria: "seguranca",
    economia: 0
  },
  {
    id: 10,
    titulo: "Desativar débitos recorrentes não usados",
    descricao: "Procure por assinaturas/subscriptions ativas e cancele as que não usa mais (apps, serviços, etc).",
    categoria: "economia",
    economia: 200
  },
  {
    id: 11,
    titulo: "Verificar programa de pontos/fidelização",
    descricao: "Alguns cartões Nubank geram pontos. Veja se tem saldo não resgatado e o que pode trocar.",
    categoria: "beneficio",
    economia: 80
  },
  {
    id: 12,
    titulo: "Revisar segurança (2FA e permissões)",
    descricao: "Verifique se 2FA está ativo e revise quais apps tem acesso à sua conta Nubank.",
    categoria: "seguranca",
    economia: 0
  },
  {
    id: 13,
    titulo: "Verificar saldo de investimentos",
    descricao: "Se tem dinheiro parado em conta corrente, considere investir em Tesouro Direto via Nubank (rentabilidade).",
    categoria: "economia",
    economia: 300
  },
  {
    id: 14,
    titulo: "Revisar histórico de transações por fraude",
    descricao: "Varra o extrato procurando por transações que não reconhece. Relatado logo ao Nubank se houver dúvida.",
    categoria: "seguranca",
    economia: 0
  },
  {
    id: 15,
    titulo: "Configurar alertas de gastos",
    descricao: "Ative notificações para alertá-lo quando gastos ultrapassam um limite. Controle sem surpresa.",
    categoria: "otimizacao",
    economia: 0
  },
  {
    id: 16,
    titulo: "Usar programa de indicação",
    descricao: "O Nubank oferece bônus por indicação. Indique a um amigo e ganhe cashback (ambos ganham).",
    categoria: "beneficio",
    economia: 100
  },
  {
    id: 17,
    titulo: "Solicitar aumento de limite",
    descricao: "Mesmo que não tenha chegado aumento automático, você pode solicitar. Melhor limite = mais segurança de emergência.",
    categoria: "otimizacao",
    economia: 0
  },
  {
    id: 18,
    titulo: "Verificar juros de empréstimo pessoal",
    descricao: "Se tem dívida em outro lugar, veja se consegue taxa melhor no Nubank (comparar taxas de juros).",
    categoria: "economia",
    economia: 500
  },
  {
    id: 19,
    titulo: "Revisar contatos de emergência",
    descricao: "Mantenha atualizados os telefones de emergência na sua conta. Importante em caso de bloqueio.",
    categoria: "seguranca",
    economia: 0
  },
  {
    id: 20,
    titulo: "Carregar saldo em cartão pré-pago (se aplicável)",
    descricao: "O Nubank oferece opção de cartão pré-pago para controle de gastos. Considere usar para categoria específica.",
    categoria: "otimizacao",
    economia: 0
  }
];

class ChecklistNubank {
  constructor() {
    this.mesAtual = new Date().getMonth();
    this.anoAtual = new Date().getFullYear();
    this.inicializar();
  }

  inicializar() {
    this.carregarDados();
    this.verificarMudancaMes();
    this.renderizar();
    this.setupEventos();
    this.atualizarResumo();
  }

  carregarDados() {
    const dadosSalvos = localStorage.getItem('hacks_nubank_dados');

    if (dadosSalvos) {
      this.dados = JSON.parse(dadosSalvos);
    } else {
      this.dados = {
        mes: this.mesAtual,
        ano: this.anoAtual,
        completados: {}
      };
      this.salvarDados();
    }
  }

  verificarMudancaMes() {
    if (this.dados.mes !== this.mesAtual || this.dados.ano !== this.anoAtual) {
      this.dados.mes = this.mesAtual;
      this.dados.ano = this.anoAtual;
      this.dados.completados = {};
      this.salvarDados();
    }
  }

  salvarDados() {
    localStorage.setItem('hacks_nubank_dados', JSON.stringify(this.dados));
  }

  renderizar() {
    const listaHacks = document.getElementById('lista-hacks');
    const filtroAtivo = document.querySelector('.btn-filtro.ativo')?.dataset.filtro || 'todos';

    listaHacks.innerHTML = '';

    const hacksFiltrados = filtroAtivo === 'todos'
      ? HACKS
      : HACKS.filter(h => h.categoria === filtroAtivo);

    hacksFiltrados.forEach(hack => {
      const completado = this.dados.completados[hack.id] || false;

      const div = document.createElement('div');
      div.className = `hack-item ${completado ? 'completado' : ''}`;
      div.innerHTML = `
        <input
          type="checkbox"
          class="hack-checkbox"
          data-id="${hack.id}"
          ${completado ? 'checked' : ''}
        >
        <div class="hack-conteudo">
          <div class="hack-titulo">${hack.titulo}</div>
          <div class="hack-descricao">${hack.descricao}</div>
          ${hack.economia > 0 ? `<div class="badge-categoria badge-economia">Potencial: R$ ${hack.economia}/mês</div>` : ''}
          <div class="badge-categoria badge-${hack.categoria}">
            ${this.getLabelCategoria(hack.categoria)}
          </div>
        </div>
      `;

      div.querySelector('.hack-checkbox').addEventListener('change', (e) => {
        this.toggleHack(hack.id, e.target.checked);
      });

      listaHacks.appendChild(div);
    });
  }

  toggleHack(id, completado) {
    this.dados.completados[id] = completado;
    this.salvarDados();
    this.atualizarResumo();
    this.renderizar();
  }

  atualizarResumo() {
    const completados = Object.values(this.dados.completados).filter(v => v).length;
    const total = HACKS.length;
    const percentual = Math.round((completados / total) * 100);

    // Calcular economia
    const economia = HACKS
      .filter(h => this.dados.completados[h.id])
      .reduce((sum, h) => sum + h.economia, 0);

    // Contar segurança
    const seguranca = HACKS
      .filter(h => h.categoria === 'seguranca' && this.dados.completados[h.id])
      .length;

    // Atualizar UI
    document.getElementById('contador-progresso').textContent = `${completados}/${total}`;
    document.getElementById('barra-fill').style.width = `${percentual}%`;
    document.getElementById('mes-info').textContent = this.getMesInfo();
    document.getElementById('total-economia').textContent = `R$ ${economia}`;
    document.getElementById('total-seguranca').textContent = seguranca;
    document.getElementById('percentual-completado').textContent = `${percentual}%`;
  }

  getMesInfo() {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `Mês de ${meses[this.mesAtual]}`;
  }

  getLabelCategoria(categoria) {
    const labels = {
      'seguranca': 'Segurança',
      'economia': 'Economia',
      'otimizacao': 'Otimização',
      'beneficio': 'Benefício'
    };
    return labels[categoria] || categoria;
  }

  setupEventos() {
    // Filtros
    document.querySelectorAll('.btn-filtro').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        this.renderizar();
      });
    });

    // Reset de mês
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Tem certeza que deseja zerar o checklist para começar um novo mês?')) {
        this.dados.completados = {};
        this.salvarDados();
        this.atualizarResumo();
        this.renderizar();
      }
    });
  }
}

// Iniciar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new ChecklistNubank();
});
