const LIVROS = [
  {
    titulo: 'O Investidor Inteligente',
    autor: 'Benjamin Graham',
    ano: 1949,
    corCapa: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
    resumo: 'O livro que revolucionou o investimento. Graham ensina como investir com segurança, analisando fundamentais e encontrando o valor real das empresas.',
    ensinamentos: [
      'Diferença entre investidor e especulador',
      'Importância da análise fundamentalista',
      'Margem de segurança em investimentos',
      'Diversificação reduz riscos',
      'Estude empresas antes de investir',
      'Emoção é inimiga do lucro'
    ],
    citacao: 'O objetivo do investidor é descobrir e explorar discrepâncias entre preço e valor.'
  },
  {
    titulo: 'O Homem Mais Rico da Babilônia',
    autor: 'George S. Clason',
    ano: 1926,
    corCapa: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    resumo: 'Histórias clássicas de Babilônia que ensinam princípios de riqueza. Mostra como economizar, investir e construir riqueza ao longo do tempo.',
    ensinamentos: [
      'Poupar parte da sua renda (10%) é essencial',
      'Seu dinheiro deve trabalhar para você',
      'Evite dívidas desnecessárias',
      'Invista em você mesmo',
      'Conhecimento é a melhor segurança',
      'Riqueza vem da economia consistente'
    ],
    citacao: 'Uma parte de tudo que você ganha é sua para guardar.'
  },
  {
    titulo: 'Pai Rico, Pai Pobre',
    autor: 'Robert Kiyosaki',
    ano: 1997,
    corCapa: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    resumo: 'Compara a mentalidade de um pai rico (empreendedor) com um pai pobre (funcionário). Essencial para entender a diferença entre renda ativa e passiva.',
    ensinamentos: [
      'Diferença entre ativos e passivos',
      'Riqueza não vem só de salário',
      'Educação financeira é crucial',
      'Invista em imóveis e negócios',
      'Trabalhe para aprender, não só ganhar',
      'Dinheiro é um jogo de números'
    ],
    citacao: 'É mais importante quanto dinheiro você guarda do que quanto você ganha.'
  },
  {
    titulo: 'A Psicologia do Dinheiro',
    autor: 'Morgan Housel',
    ano: 2020,
    corCapa: 'linear-gradient(135deg, #2C5282 0%, #1A365D 100%)',
    resumo: 'Explora como psicologia humana afeta decisões financeiras. Mostra que sucesso financeiro é mais sobre comportamento que sobre técnica.',
    ensinamentos: [
      'Sorte e risco são parte do jogo',
      'Humildade nas decisões financeiras',
      'Paciência é ferramenta poderosa',
      'Saiba quando é suficiente',
      'Controle as emoções nos mercados',
      'Relacionamentos valem mais que dinheiro'
    ],
    citacao: 'O objetivo do investimento não é maximizar retornos, é maximizar felicidade.'
  },
  {
    titulo: 'Hábitos Atômicos',
    autor: 'James Clear',
    ano: 2018,
    corCapa: 'linear-gradient(135deg, #1B4965 0%, #0D2A3D 100%)',
    resumo: 'Pequenas mudanças geram grandes resultados. Mostra como construir hábitos financeiros positivos que se compõem ao longo do tempo.',
    ensinamentos: [
      'Pequenos hábitos geram resultados enormes',
      'Mude seu sistema, não apenas objetivos',
      'Identidade é mais forte que motivação',
      'Comece muito pequeno',
      'Acompanhamento cria responsabilidade',
      'Ambiente influencia comportamento'
    ],
    citacao: 'Você não sobe para o nível de seus objetivos, você cai para o nível de seus sistemas.'
  },
  {
    titulo: 'O Poder do Hábito',
    autor: 'Charles Duhigg',
    ano: 2012,
    corCapa: 'linear-gradient(135deg, #9B59B6 0%, #6C3483 100%)',
    resumo: 'Desvenda a ciência por trás dos hábitos. Ensina como mudanças pequenas podem gerar transformações maiores na vida financeira e pessoal.',
    ensinamentos: [
      'Hábitos controlam 40% das ações',
      'Loop: deixa-gatilho-rotina-recompensa',
      'Identifique seus gatilhos de gasto',
      'Substitua maus hábitos por bons',
      'Acreditar na mudança é essencial',
      'Hábitos se propagam em grupos'
    ],
    citacao: 'Mudanças de hábito ocorrem quando pessoas acreditam serem capazes de mudança.'
  },
  {
    titulo: 'Principles',
    autor: 'Ray Dalio',
    ano: 2017,
    corCapa: 'linear-gradient(135deg, #1F4788 0%, #0F2847 100%)',
    resumo: 'Radiografia dos princípios que guiaram o sucesso de um bilionário. Ensina como criar princípios pessoais para tomar melhores decisões.',
    ensinamentos: [
      'Crie seus próprios princípios',
      'Radical transparency',
      'Radical honesty',
      'Entenda como os sistemas funcionam',
      'Erro é aprendizado',
      'Evolua ou morra'
    ],
    citacao: 'Dor + Reflexão = Progresso.'
  },
  {
    titulo: 'Liberte-se do Dinheiro',
    autor: 'Tony Robbins',
    ano: 2014,
    corCapa: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
    resumo: 'Estratégias práticas de um guru motivacional para dominar finanças. Foco em psicologia, investimento e criação de riqueza duradoura.',
    ensinamentos: [
      'Decisão precede ação',
      'Saiba qual é sua situação real',
      'Automatize sua riqueza',
      'Diversifique investimentos',
      'Educação é arma',
      'Generosidade multiplica riqueza'
    ],
    citacao: 'Se você está em controle de suas finanças, você tem liberdade.'
  }
];

function carregarLivros() {
  mostrarLivros(LIVROS);
}

function mostrarLivros(livros) {
  const container = document.getElementById('lista-livros');

  container.innerHTML = livros.map(livro => `
    <div class="card-livro">
      <div class="livro-capa" style="background: ${livro.corCapa};">
        <div class="livro-capa-conteudo">
          <h3 class="livro-capa-titulo">${livro.titulo}</h3>
          <p class="livro-capa-autor">${livro.autor}</p>
        </div>
      </div>

      <div class="livro-conteudo">
        <span class="livro-ano">${livro.ano}</span>

        <p class="livro-resumo">${livro.resumo}</p>

        <div class="livro-secao">
          <h4>Grandes Ensinamentos</h4>
          <ul class="livro-lista">
            ${livro.ensinamentos.map(e => `<li>${e}</li>`).join('')}
          </ul>
        </div>

        <div class="livro-citacao">
          <p>"${livro.citacao}"</p>
          <div class="livro-citacao-autor">— ${livro.autor}</div>
        </div>
      </div>
    </div>
  `).join('');
}
