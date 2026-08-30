const PENSADORES = [
  {
    nome: 'Warren Buffett',
    periodo: '1930 - Presente',
    iniciais: 'WB',
    corAvatar: '#E74C3C',
    area: 'Value Investing',
    descricao: 'Um dos investidores mais bem-sucedidos de todos os tempos. Criou a Berkshire Hathaway e é conhecido por sua filosofia de comprar ações de empresas com fundamentais sólidos por preços abaixo do valor real.',
    principios: [
      'Invista em empresas que você entende',
      'Compre com desconto (margin of safety)',
      'Pense como dono, não como especulador',
      'Mantenha a disciplina e paciência',
      'Evite seguir a multidão',
      'Leia muito para aprender continuamente',
      'Reinvista os lucros'
    ],
    citacao: 'O segredo do sucesso é fazer coisas simples melhor que os outros.',
    citacaoAutor: 'Warren Buffett'
  },
  {
    nome: 'Benjamin Graham',
    periodo: '1894 - 1976',
    iniciais: 'BG',
    corAvatar: '#8B4513',
    area: 'Análise Fundamentalista',
    descricao: 'Criador da análise fundamentalista e mentor de Warren Buffett. Escreveu "O Investidor Inteligente", considerado a bíblia do investimento. Revolucionou a forma como as pessoas pensam sobre mercado de ações.',
    principios: [
      'Analise os fundamentais da empresa',
      'Procure pela "margem de segurança"',
      'Entenda a diferença entre preço e valor',
      'Seja um "investidor" não um "especulador"',
      'Diversifique seu portfólio',
      'Evite emocionalismo nas decisões',
      'Estude o histórico financeiro da empresa'
    ],
    citacao: 'O risco vem de não saber o que você está fazendo.',
    citacaoAutor: 'Benjamin Graham'
  },
  {
    nome: 'Charlie Munger',
    periodo: '1924 - Presente',
    iniciais: 'CM',
    corAvatar: '#9B59B6',
    area: 'Pensamento Multidisciplinar',
    descricao: 'Vice-presidente da Berkshire Hathaway e parceiro de Warren Buffett. Conhecido por seu pensamento ético e abordagem multidisciplinar que combina psicologia, história e economia.',
    principios: [
      'Estude múltiplas disciplinas',
      'Evite vieses mentais',
      'Invista com franqueza moral',
      'Foque em poucos investimentos de qualidade',
      'Aprenda com seus erros',
      'Admire a excelência em qualquer lugar',
      'Seja excepcionalmente paciente'
    ],
    citacao: 'O segredo para uma vida bem-sucedida é conhecer qual é o seu jogo e depois ficar com ele.',
    citacaoAutor: 'Charlie Munger'
  },
  {
    nome: 'Ray Dalio',
    periodo: '1949 - Presente',
    iniciais: 'RD',
    corAvatar: '#3498DB',
    area: 'Princípios & Sistemas',
    descricao: 'Fundador do Bridgewater Associates. Criador da filosofia dos "Princípios" que aplicam conceitos científicos e racionais aos negócios e vida pessoal. Autor do livro "Principles".',
    principios: [
      'Crie princípios claros e siga-os',
      'Busque a verdade radical',
      'Transparência total nas organizações',
      'Entenda como os sistemas funcionam',
      'Saiba quem você é (autoconhecimento)',
      'Questione suas suposições',
      'Adapte-se às mudanças'
    ],
    citacao: 'Os princípios são as chaves para lidar eficazmente com a realidade.',
    citacaoAutor: 'Ray Dalio'
  },
  {
    nome: 'George Soros',
    periodo: '1930 - Presente',
    iniciais: 'GS',
    corAvatar: '#2ECC71',
    area: 'Trading & Reflexividade',
    descricao: 'Investidor e especulador de sucesso conhecido pela estratégia de "reflexividade" - compreender como os participantes do mercado influenciam os preços. Filantropo dedicado.',
    principios: [
      'Entenda a reflexividade dos mercados',
      'Questione suas próprias convicções',
      'Administre o risco conscientemente',
      'Seja adaptável a mudanças',
      'Use a informação como vantagem',
      'Reconheça quando está errado',
      'Contribua para a sociedade'
    ],
    citacao: 'Quanto mais longe a realidade se afasta do que as pessoas acreditam, maior é o potencial de lucro.',
    citacaoAutor: 'George Soros'
  },
  {
    nome: 'Peter Lynch',
    periodo: '1944 - Presente',
    iniciais: 'PL',
    corAvatar: '#F39C12',
    area: 'Gestão de Fundos',
    descricao: 'Gerenciou o Fundo Magellan e obteve retornos extraordinários. Defende que investidores comuns podem ter sucesso investigando empresas locais que conhecem.',
    principios: [
      'Invista em empresas que você usa',
      'Faça sua própria pesquisa',
      'Tenha paciência com bons investimentos',
      'Divida seus investimentos por tipo',
      'Não venda por pânico',
      'Acompanhe regularmente suas ações',
      'Mantenha lista de empresas interessantes'
    ],
    citacao: 'Você tem vantagem se fizer lição de casa que a maioria dos investidores profissionais não faz.',
    citacaoAutor: 'Peter Lynch'
  },
  {
    nome: 'Robert Kiyosaki',
    periodo: '1956 - Presente',
    iniciais: 'RK',
    corAvatar: '#E67E22',
    area: 'Educação Financeira',
    descricao: 'Autor de "Pai Rico, Pai Pobre". Promove a importância da educação financeira e investimento imobiliário como caminho para liberdade financeira.',
    principios: [
      'Educação financeira é essencial',
      'Diferença entre ativo e passivo',
      'Compre ativos, não passivos',
      'Invista em imóveis',
      'Crie fluxo de caixa positivo',
      'Trabalhe para aprender, não só ganhar',
      'Empreendedorismo é caminho para riqueza'
    ],
    citacao: 'Não é quanto dinheiro você ganha. É quanto dinheiro você mantém.',
    citacaoAutor: 'Robert Kiyosaki'
  },
  {
    nome: 'Naval Ravikant',
    periodo: '1974 - Presente',
    iniciais: 'NR',
    corAvatar: '#1ABC9C',
    area: 'Riqueza & Filosofia',
    descricao: 'Empreendedor e investidor. Criador do conceito "Como Ficar Rico Sem Sorte". Defende riqueza como resultado de longo prazo e sabedoria pessoal.',
    principios: [
      'Riqueza é acumular ativos',
      'Renda é troca de tempo por dinheiro',
      'Conhecimento específico é poder',
      'Saúde é riqueza',
      'Leia obsessivamente',
      'Escolha seus amigos com cuidado',
      'Foco em longo prazo, não ganho rápido'
    ],
    citacao: 'A verdade é que você não fica rico pela renda. Você fica rico através do patrimônio.',
    citacaoAutor: 'Naval Ravikant'
  }
];

function carregarPensadores() {
  mostrarPensadores(PENSADORES);
}

function mostrarPensadores(pensadores) {
  const container = document.getElementById('lista-pensadores');

  container.innerHTML = pensadores.map(pensador => `
    <div class="card-pensador">
      <div class="pensador-header">
        <div class="pensador-avatar" style="background-color: ${pensador.corAvatar};">
          ${pensador.iniciais}
        </div>
        <h2 class="pensador-nome">${pensador.nome}</h2>
        <p class="pensador-periodo">${pensador.periodo}</p>
      </div>

      <div class="pensador-conteudo">
        <span class="pensador-area">${pensador.area}</span>

        <p class="pensador-descricao">${pensador.descricao}</p>

        <div class="pensador-secao">
          <h3>Principais Princípios</h3>
          <ul class="pensador-lista">
            ${pensador.principios.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>

        <div class="pensador-citacao">
          <p>"${pensador.citacao}"</p>
          <div class="pensador-citacao-autor">— ${pensador.citacaoAutor}</div>
        </div>
      </div>
    </div>
  `).join('');
}
