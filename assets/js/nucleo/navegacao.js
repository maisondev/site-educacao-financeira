// Estrutura centralizada da navegação — fonte única consumida por
// menu.js (menu do topo) e rodape.js (mapa do site no rodapé).
// Edite aqui para atualizar o menu e o rodapé de todas as páginas.
const MENU_ITEMS = [
  {
    label: 'Painel',
    href: './dashboard.html',
    submenu: null
  },
  {
    label: 'Início',
    href: './index.html',
    submenu: null
  },
  {
    label: 'Aprender',
    href: './temas/index.html',
    submenu: [
      { label: 'Roadmap de Estudos', href: './roadmap.html' },
      { label: 'Juros e Investimentos', href: './temas/juros-e-investimentos/index.html' },
      { label: 'Renda Fixa: onde deixar a reserva', href: './temas/juros-e-investimentos/renda-fixa-para-comecar.html' },
      { label: 'Orçamento Pessoal', href: './temas/orcamento-pessoal/index.html' },
      { label: 'Reserva de Emergência', href: './temas/reserva-de-emergencia/index.html' }
    ]
  },
  {
    label: 'Acompanhamento',
    href: './metas.html',
    submenu: [
      { label: 'Carro', href: './carro.html' },
      { label: 'Cartões', href: './cartoes.html' },
      { label: 'Cartão de Crédito (resumo)', href: './cartao.html' },
      { label: 'Despesas Fixas', href: './despesas-fixas.html' },
      { label: 'Despesas Variáveis', href: './despesas-variaveis.html' },
      { label: 'Desapego', href: './desapego.html' },
      { label: 'Dívidas', href: './dividas.html' },
      { label: 'Cartões Adicionais', href: './cartoes-adicionais.html' },
      { label: 'Parcelas de Cartão', href: './parcelas-cartao.html' },
      { label: 'Envelopes', href: './envelopes.html' },
      { label: 'FGTS', href: './fgts.html' },
      { label: 'Investimentos', href: './investimentos.html' },
      { label: 'Mercado', href: './mercado.html' },
      { label: 'Metas', href: './metas.html' },
      { label: 'Receitas', href: './receitas.html' },
      { label: 'Renda Extra', href: './renda-extra.html' },
      { label: 'Reserva de Emergência', href: './reserva-emergencia.html' }
    ]
  },
  {
    label: 'Análise',
    href: './relatorios.html',
    submenu: [
      { label: 'Balanço Patrimonial', href: './balanco-patrimonial.html' },
      { label: 'Contracheque', href: './analise-contracheque.html' },
      { label: 'Fatura de Cartão', href: './analise-fatura.html' },
      { label: 'Revisão de Faturas', href: './revisao-faturas.html' },
      { label: 'Relatórios', href: './relatorios.html' },
      { label: 'Saldo Projetado', href: './saldo-projetado.html' }
    ]
  },
  {
    label: 'Referência',
    href: './glossario.html',
    submenu: [
      { label: 'Grandes Livros', href: './livros.html' },
      { label: 'Grandes Máximas', href: './maximas.html' },
      { label: 'Grandes Nomes', href: './pensadores.html' },
      { label: 'Glossário', href: './glossario.html' },
      { label: 'Links Úteis', href: './links-uteis.html' },
      { label: 'Meus Cursos', href: './cursos.html' },
      { label: 'Cadastros Gerais', href: './cadastros.html' },
      { label: 'Registrato (BCB)', href: './registrato.html' },
      { label: 'Verificação (testes)', href: './verificacao.html' }
    ]
  },
  {
    label: 'Ferramentas',
    href: './ferramentas/calculadora-juros-compostos.html',
    submenu: [
      { label: 'Hacks Nubank', href: './hacks-nubank.html' },
      { label: 'Juros Compostos', href: './ferramentas/calculadora-juros-compostos.html' },
      { label: 'Juros Simples', href: './ferramentas/calculadora-juros-simples.html' },
      { label: 'Correção pela Inflação', href: './ferramentas/calculadora-inflacao.html' }
    ]
  }
];
