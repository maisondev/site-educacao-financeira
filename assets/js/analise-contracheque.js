// Análise de Contracheque

const CHAVE_CONTRACHEQUES = 'contracheques_historico';

let contrachequeAtual = null;

// Ordenação da tabela do Histórico de Contracheques.
// campo: 'competencia' | 'totalBruto' | 'totalDescontos' | 'salarioLiquido'
let ordemHistorico = { campo: 'competencia', dir: 'desc' };

// Tabela progressiva mensal do IRRF vigente em 2026
const TABELA_IRRF_2026 = [
  { ate: 2428.80, aliquota: 0, deduzir: 0 },
  { ate: 2826.65, aliquota: 0.075, deduzir: 182.16 },
  { ate: 3751.05, aliquota: 0.15, deduzir: 394.16 },
  { ate: 4664.68, aliquota: 0.225, deduzir: 675.49 },
  { ate: Infinity, aliquota: 0.275, deduzir: 908.73 }
];
const DEDUCAO_POR_DEPENDENTE_IRRF = 189.59;

function calcularIRRFEsperado(baseCalculo) {
  if (baseCalculo <= 0) return 0;
  const faixa = TABELA_IRRF_2026.find(f => baseCalculo <= f.ate);
  const valor = baseCalculo * faixa.aliquota - faixa.deduzir;
  return Math.max(0, valor);
}

// Tabela progressiva mensal do INSS (CLT) vigente em 2026
const TABELA_INSS_2026 = [
  { ate: 1621.00, aliquota: 0.075, deduzir: 0 },
  { ate: 2902.84, aliquota: 0.09, deduzir: 24.32 },
  { ate: 4354.27, aliquota: 0.12, deduzir: 111.40 },
  { ate: 8475.55, aliquota: 0.14, deduzir: 198.49 }
];
const TETO_INSS_2026 = 8475.55 * 0.14 - 198.49;

function calcularINSSEsperado(baseCalculo) {
  if (baseCalculo <= 0) return 0;
  if (baseCalculo > TABELA_INSS_2026[TABELA_INSS_2026.length - 1].ate) return TETO_INSS_2026;
  const faixa = TABELA_INSS_2026.find(f => baseCalculo <= f.ate);
  return Math.max(0, baseCalculo * faixa.aliquota - faixa.deduzir);
}

// Use parseValorBrasileiro from formatacao.js instead
// It handles multiple formats: "R$ 1.234,56", "1.234,56", "1234,56", "1234.56"

document.addEventListener('DOMContentLoaded', function() {
  setupUpload();
  carregarHistorico();
  configurarInputsMoeda();
});

// Configurar inputs de moeda para aceitar múltiplos formatos
function configurarInputsMoeda() {
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('input-edicao') && !e.target.classList.contains('input-edicao-descricao')) {
      const valor = parseValorBrasileiro(e.target.value);
      e.target.value = valor.toFixed(2).replace('.', ',');
    }
  }, true);

  document.addEventListener('blur', function(e) {
    if (e.target.classList.contains('input-edicao') && !e.target.classList.contains('input-edicao-descricao')) {
      const valor = parseValorBrasileiro(e.target.value);
      e.target.value = valor.toFixed(2).replace('.', ',');
    }
  }, true);
}

function setupUpload() {
  const uploadArea = document.getElementById('upload-area');
  const input = document.getElementById('arquivo-pdf');

  uploadArea.addEventListener('click', () => input.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const arquivo = e.dataTransfer.files[0];
    if (arquivo && arquivo.type === 'application/pdf') {
      processarPDF(arquivo);
    } else {
      mostrarMensagem('Por favor, selecione um arquivo PDF válido', 'erro');
    }
  });

  input.addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
      processarPDF(arquivo);
    }
  });
}

async function processarPDF(arquivo) {
  mostrarMensagem('Processando PDF...', 'info');

  try {
    const texto = await lerPDF(arquivo);
    const dados = extrairDados(texto);

    if (dados) {
      contrachequeAtual = dados;
      salvarNoHistorico(dados);
      exibirDados(dados);
      carregarHistorico();
      mostrarMensagem('Contracheque processado com sucesso!', 'sucesso');
    } else {
      mostrarMensagem('Não foi possível extrair os dados. Verifique o formato do PDF.', 'erro');
    }
  } catch (erro) {
    console.error('Erro ao processar PDF:', erro);
    mostrarMensagem('Erro ao processar arquivo: ' + erro.message, 'erro');
  }
}

async function lerPDF(arquivo) {
  // Verificar se pdf.js está disponível
  if (typeof pdfjsLib !== 'undefined') {
    return await lerPDFComPDFJS(arquivo);
  } else {
    // Fallback: ler como array buffer e tentar extrair texto
    return await lerPDFSimples(arquivo);
  }
}

async function lerPDFComPDFJS(arquivo) {
  const arrayBuffer = await arquivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let texto = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    texto += textContent.items.map(item => item.str).join(' ') + '\n';
  }

  return texto;
}

async function lerPDFSimples(arquivo) {
  const arrayBuffer = await arquivo.arrayBuffer();
  const view = new Uint8Array(arrayBuffer);
  let texto = '';

  // Tentar extrair texto bruto do PDF (método básico)
  for (let i = 0; i < view.length - 1; i++) {
    const byte = view[i];
    if (byte >= 32 && byte <= 126) {
      texto += String.fromCharCode(byte);
    } else if (byte === 10 || byte === 13) {
      texto += '\n';
    }
  }

  return texto;
}

function extrairDados(texto) {
  try {
    console.log('Texto extraído:', texto.substring(0, 500)); // Debug
    const dados = {};
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);

    // Extrair competência/data
    const dataMatch = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dataMatch) {
      dados.competencia = `${dataMatch[1]}/${dataMatch[2]}/${dataMatch[3]}`;
      dados.data = new Date(`${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`);
    }

    // A ordem que o pdf.js entrega o texto varia conforme o PDF: às vezes
    // "VALOR REF DESCRIÇÃO CÓDIGO" (valor antes), às vezes "REF CÓDIGO DESCRIÇÃO VALOR"
    // (valor depois) — mas é sempre a MESMA ordem em todas as linhas de um mesmo PDF.
    // Tentar as duas direções por código individualmente é perigoso: no formato "depois",
    // a direção "antes" pode casar por acidente com o valor da linha ANTERIOR (que também
    // é um número decimal válido), empurrando valores errados de uma linha pra outra em cascata.
    // Por isso detectamos o formato UMA VEZ (usando o código 0002, cuja faixa de valor
    // 5000-50000 é grande o bastante pra não ter ambiguidade) e aplicamos só essa direção
    // pra todos os códigos do documento.
    const SEM_CRUZAR_DECIMAL = `(?:(?!\\d+,\\d{2})[\\s\\S]){0,120}?`;
    const construirRegexAntes = codigo => new RegExp(`([\\d.]+,\\d{2})\\s{0,3}[\\d.,]*\\s{0,3}${SEM_CRUZAR_DECIMAL}(?<!\\d)${codigo}(?!\\d)`, 'i');
    const construirRegexDepois = codigo => new RegExp(`(?<!\\d)${codigo}(?!\\d)${SEM_CRUZAR_DECIMAL}([\\d.]+,\\d{2})`, 'i');

    // Vencimentos e Descontos são colunas separadas da mesma tabela, e o pdf.js pode
    // extrair cada coluna com uma ordem diferente — por isso a detecção de formato é
    // feita uma vez para cada seção, não uma vez só pro documento inteiro.
    const detectarFormatoDepois = (codigoAncora, minAncora, maxAncora) => {
      const matchAntes = texto.match(construirRegexAntes(codigoAncora));
      const valorAntes = matchAntes ? parseValorBrasileiro(matchAntes[1]) : null;
      return !(valorAntes >= minAncora && valorAntes <= maxAncora);
    };

    // Vencimento CLT tem faixa bem larga e exclusiva (5000-50000) — âncora confiável.
    const formatoVencimentosDepois = detectarFormatoDepois('0002', 5000, 50000);
    // INSS costuma estar perto do teto de contribuição — faixa estreita como âncora.
    const formatoDescontosDepois = detectarFormatoDepois('5003', 800, 1200);

    const extrairPorCodigo = (codigo, minValor, maxValor, valorDepois) => {
      const regex = valorDepois ? construirRegexDepois(codigo) : construirRegexAntes(codigo);
      const match = texto.match(regex);
      if (match) {
        const valor = parseValorBrasileiro(match[1]);
        if (valor >= minValor && valor <= maxValor) {
          return valor;
        }
      }
      return null;
    };

    dados.vencimentos = [];
    const eventosVencimentos = [
      { codigo: '0002', descricao: 'Vencimento CLT', min: 5000, max: 50000 },
      { codigo: '0028', descricao: 'Gratificação Tempo de Serviço', min: 100, max: 10000 },
      { codigo: '0082', descricao: 'Hora Extra 50%', min: 10, max: 10000 },
      { codigo: '0083', descricao: 'Hora Extra 100%', min: 10, max: 10000 },
      { codigo: '1012', descricao: 'Auxílio Creche', min: 100, max: 10000 },
      { codigo: '1124', descricao: 'DSR Horas Extras', min: 10, max: 10000 }
    ];
    eventosVencimentos.forEach(({ codigo, descricao, min, max }) => {
      const valor = extrairPorCodigo(codigo, min, max, formatoVencimentosDepois);
      if (valor !== null) dados.vencimentos.push({ descricao, valor });
    });

    dados.descontos = [];
    const eventosDescontos = [
      { codigo: '5003', descricao: 'INSS', min: 100, max: 5000 },
      { codigo: '5004', descricao: 'IRRF', min: 100, max: 10000 },
      { codigo: '5318', descricao: 'Plano de Saúde - Titular', min: 50, max: 2000 },
      { codigo: '5616', descricao: 'Plano de Saúde - Dependente', min: 50, max: 3000 },
      { codigo: '5613', descricao: 'Plano Odontológico - Titular', min: 1, max: 200 },
      { codigo: '5615', descricao: 'Plano Odontológico - Dependente', min: 1, max: 200 },
      { codigo: '5748', descricao: 'Desconto Participação Refeição', min: 50, max: 1000 },
      { codigo: '5752', descricao: 'Desconto Alimentação Extra', min: 1, max: 500 }
    ];
    eventosDescontos.forEach(({ codigo, descricao, min, max }) => {
      const valor = extrairPorCodigo(codigo, min, max, formatoDescontosDepois);
      if (valor !== null) dados.descontos.push({ descricao, valor });
    });

    // Rodapé: o pdf.js não inverte célula a célula, e sim o BLOCO inteiro de valores
    // e o BLOCO inteiro de rótulos separadamente. Ordem real no texto acaba sendo:
    // [Líquido, Total Descontos, Total Ganhos, FGTS] (valores) seguido de
    // "Líquido ... Total de descontos ... Total de ganhos ... FGTS" (rótulos).
    const regexRodape = /([\d.]+,\d{2})\s{0,3}(?:R\$\s{0,3})?([\d.]+,\d{2})\s{0,3}(?:R\$\s{0,3})?([\d.]+,\d{2})\s{0,3}(?:R\$\s{0,3})?([\d.]+,\d{2})\s{0,3}L[ií]qu[ií]do[\s\S]{0,100}?Total\s+de\s+descontos[\s\S]{0,100}?Total\s+de\s+ganhos[\s\S]{0,60}?FGTS/i;
    const matchRodape = texto.match(regexRodape);

    if (matchRodape) {
      dados.salarioLiquido = parseValorBrasileiro(matchRodape[1]);
      dados.totalDescontos = parseValorBrasileiro(matchRodape[2]);
      dados.totalBruto = parseValorBrasileiro(matchRodape[3]);
      dados.fgts = parseValorBrasileiro(matchRodape[4]);
    } else {
      // Fallback: pelo menos tenta achar o FGTS isolado (não depende dos outros 3)
      const regexFgts = /([\d.]+,\d{2})\s{0,3}FGTS/i;
      const matchFgts = texto.match(regexFgts);
      dados.fgts = matchFgts ? parseValorBrasileiro(matchFgts[1]) : null;
    }

    console.log('Totais encontrados:', {
      totalBruto: dados.totalBruto,
      totalDescontos: dados.totalDescontos,
      salarioLiquido: dados.salarioLiquido,
      fgts: dados.fgts
    });

    // Debug: mostrar vencimentos e descontos extraídos
    console.log('Vencimentos extraídos:', dados.vencimentos);
    console.log('Descontos extraídos:', dados.descontos);

    // Se não achou o total de ganhos pelo rótulo do rodapé, soma os vencimentos identificados
    // (rótulo é preferido pois é sempre completo, mesmo que surjam códigos de evento não mapeados)
    if (!dados.totalBruto && dados.vencimentos && dados.vencimentos.length > 0) {
      dados.totalBruto = dados.vencimentos.reduce((sum, v) => sum + v.valor, 0);
      console.log('Total bruto calculado dos vencimentos:', dados.totalBruto);
    }

    // Se tem total de descontos do regex, usar. Senão, calcular dos descontos individuais
    if (!dados.totalDescontos && dados.descontos && dados.descontos.length > 0) {
      dados.totalDescontos = dados.descontos.reduce((sum, d) => sum + d.valor, 0);
      console.log('Total descontos calculado dos itens:', dados.totalDescontos);
    }

    // Se ainda não tem total de descontos, assumir que é 0 (dados incompletos)
    if (!dados.totalDescontos) {
      console.warn('Total de descontos não foi encontrado no PDF');
    }

    // Se não encontrou o líquido, calcular como bruto - descontos
    if (!dados.salarioLiquido && dados.totalBruto && dados.totalDescontos) {
      dados.salarioLiquido = dados.totalBruto - dados.totalDescontos;
      console.log('Líquido calculado como:', dados.salarioLiquido);
    }

    console.log('Dados extraídos finais:', dados); // Debug

    // Validar dados mínimos - precisa de pelo menos vencimentos ou descontos
    if ((!dados.vencimentos || dados.vencimentos.length === 0) &&
        (!dados.descontos || dados.descontos.length === 0)) {
      console.warn('Nenhum vencimento ou desconto encontrado');
      return null;
    }

    if (!dados.salarioLiquido || dados.salarioLiquido <= 0) {
      console.warn('Não foi possível calcular o salário líquido. Dados:', dados);
      return null;
    }

    return dados;
  } catch (erro) {
    console.error('Erro ao extrair dados:', erro);
    return null;
  }
}

function extrairValor(texto) {
  // Procura todos os números no formato monetário
  const matches = texto.match(/[\d.,]+/g);
  if (!matches) return null;

  // Filtra números que parecem valores monetários (maiores que 100)
  const valoresCandidatos = matches
    .map(m => {
      const valor = parseValorBrasileiro(m);
      return valor;
    })
    .filter(v => v >= 100); // Valores monetários costumam ser >= 100

  // Retorna o maior valor encontrado (geralmente o valor principal, não ref)
  if (valoresCandidatos.length > 0) {
    return Math.max(...valoresCandidatos);
  }
  return null;
}

function exibirDados(dados) {
  document.getElementById('secao-dados').removeAttribute('hidden');

  // Dados básicos
  document.getElementById('info-competencia').textContent = dados.competencia || 'Desconhecida';
  document.getElementById('valor-bruto').textContent = formatarMoeda(dados.totalBruto);
  document.getElementById('valor-descontos').textContent = formatarMoeda(dados.totalDescontos);
  document.getElementById('valor-liquido').textContent = formatarMoeda(dados.salarioLiquido);
  document.getElementById('valor-fgts').textContent = formatarMoeda(dados.fgts || 0);

  // Benefícios
  const beneficios = dados.vencimentos.filter(v => v.descricao !== 'Vencimento CLT');
  const totalBeneficios = beneficios.reduce((sum, v) => sum + v.valor, 0);
  const salarioBase = dados.vencimentos.find(v => v.descricao === 'Vencimento CLT')?.valor || 0;

  document.getElementById('valor-salario').textContent = formatarMoeda(salarioBase);
  document.getElementById('valor-beneficios').textContent = formatarMoeda(totalBeneficios);

  // Gráfico de composição de renda
  if (salarioBase > 0 || totalBeneficios > 0) {
    desenharGraficoRenda(salarioBase, beneficios);
  }

  // Gráfico de descontos
  if (dados.descontos.length > 0) {
    desenharGraficoDescontos(dados.descontos);
  }

  // Tabelas
  preencherTabelaVencimentos(dados.vencimentos);
  preencherTabelaDescontos(dados.descontos);

  atualizarConferencia();
}

function atualizarConferencia() {
  if (!contrachequeAtual) return;
  const dados = contrachequeAtual;

  // Base de incidência = todos os vencimentos, exceto Auxílio Creche (isento).
  // Vencimento CLT + Gratificação sozinhos não bastam: Hora Extra, DSR etc. também incidem.
  const baseIncidencia = dados.vencimentos
    .filter(v => v.descricao !== 'Auxílio Creche')
    .reduce((sum, v) => sum + v.valor, 0);

  const inssExtraido = dados.descontos.find(d => d.descricao === 'INSS')?.valor || 0;
  const irrfExtraido = dados.descontos.find(d => d.descricao === 'IRRF')?.valor || 0;

  const dependentes = parseInt(document.getElementById('input-dependentes-irrf').value, 10) || 0;
  const baseIRRF = baseIncidencia - inssExtraido - (dependentes * DEDUCAO_POR_DEPENDENTE_IRRF);
  const irrfEsperado = calcularIRRFEsperado(baseIRRF);
  const diferencaIRRF = irrfExtraido - irrfEsperado;
  const irrfOk = Math.abs(diferencaIRRF) <= 1;

  const inssEsperado = calcularINSSEsperado(baseIncidencia);
  const diferencaINSS = inssExtraido - inssEsperado;
  const inssOk = Math.abs(diferencaINSS) <= 1;

  const grid = document.getElementById('grid-conferencia');
  grid.innerHTML = `
    <div class="card-dado" style="border-left-color: ${irrfOk ? 'var(--cor-sucesso)' : 'var(--cor-erro)'};">
      <div class="card-dado-label">IRRF Esperado (tabela 2026)</div>
      <div class="card-dado-valor" style="font-size: 1.2rem;">${formatarMoeda(irrfEsperado)}</div>
      <div style="font-size: 0.85rem; margin-top: 0.3rem; color: ${irrfOk ? 'var(--cor-sucesso)' : 'var(--cor-erro)'};">
        ${irrfOk ? 'Bate com o valor extraído' : `Diferença de ${formatarMoeda(diferencaIRRF)} em relação ao extraído (${formatarMoeda(irrfExtraido)})`}
      </div>
    </div>
    <div class="card-dado" style="border-left-color: ${inssOk ? 'var(--cor-sucesso)' : 'var(--cor-erro)'};">
      <div class="card-dado-label">INSS Esperado (tabela 2026)</div>
      <div class="card-dado-valor" style="font-size: 1.2rem;">${formatarMoeda(inssEsperado)}</div>
      <div style="font-size: 0.85rem; margin-top: 0.3rem; color: ${inssOk ? 'var(--cor-sucesso)' : 'var(--cor-erro)'};">
        ${inssOk ? 'Bate com o valor extraído' : `Diferença de ${formatarMoeda(diferencaINSS)} em relação ao extraído (${formatarMoeda(inssExtraido)})`}
      </div>
    </div>
  `;
}

function desenharGraficoRenda(salarioBase, beneficios) {
  const svg = document.getElementById('grafico-renda');
  svg.innerHTML = '';

  const items = [{ descricao: 'Salário CLT', valor: salarioBase }];
  beneficios.forEach(b => items.push(b));

  const total = items.reduce((sum, item) => sum + item.valor, 0);
  const cores = ['#4a154b', '#1264a3', '#059669', '#d97706', '#7c3aed'];

  let anguloInicio = -90;
  const legenda = document.getElementById('legenda-renda');
  legenda.innerHTML = '';

  items.forEach((item, idx) => {
    const percentual = item.valor / total;
    const anguloSweep = percentual * 360;
    const raio = 80;
    const x = 100 + raio * Math.cos((anguloInicio + anguloSweep / 2) * Math.PI / 180);
    const y = 100 + raio * Math.sin((anguloInicio + anguloSweep / 2) * Math.PI / 180);

    desenharArco(svg, anguloInicio, anguloSweep, cores[idx % cores.length]);

    // Legenda
    const legItem = document.createElement('div');
    legItem.className = 'legenda-item';
    legItem.innerHTML = `
      <div class="legenda-cor" style="background: ${cores[idx % cores.length]}"></div>
      <span>${item.descricao}: ${formatarMoeda(item.valor)}</span>
    `;
    legenda.appendChild(legItem);

    anguloInicio += anguloSweep;
  });

  // Círculo central com o total
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', 100);
  circle.setAttribute('cy', 100);
  circle.setAttribute('r', 50);
  circle.setAttribute('fill', 'var(--cor-fundo-card)');
  circle.setAttribute('stroke', 'var(--cor-borda)');
  circle.setAttribute('stroke-width', 1);
  svg.appendChild(circle);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', 100);
  text.setAttribute('y', 100);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dy', '0.3em');
  text.setAttribute('font-weight', 'bold');
  text.setAttribute('font-size', '12');
  text.textContent = 'Total Bruto';
  svg.appendChild(text);

  const valor = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  valor.setAttribute('x', 100);
  valor.setAttribute('y', 115);
  valor.setAttribute('text-anchor', 'middle');
  valor.setAttribute('font-weight', 'bold');
  valor.setAttribute('font-size', '14');
  valor.setAttribute('fill', '#4a154b');
  valor.textContent = formatarMoeda(total);
  svg.appendChild(valor);
}

function desenharGraficoDescontos(descontos) {
  const svg = document.getElementById('grafico-descontos');
  svg.innerHTML = '';

  const total = descontos.reduce((sum, d) => sum + d.valor, 0);
  const cores = ['#dc2626', '#f97316', '#eab308', '#84cc16', '#22c55e'];

  let anguloInicio = -90;
  const legenda = document.getElementById('legenda-descontos');
  legenda.innerHTML = '';

  descontos.forEach((desconto, idx) => {
    const percentual = desconto.valor / total;
    const anguloSweep = percentual * 360;

    desenharArco(svg, anguloInicio, anguloSweep, cores[idx % cores.length]);

    // Legenda
    const legItem = document.createElement('div');
    legItem.className = 'legenda-item';
    legItem.innerHTML = `
      <div class="legenda-cor" style="background: ${cores[idx % cores.length]}"></div>
      <span>${desconto.descricao}: ${formatarMoeda(desconto.valor)}</span>
    `;
    legenda.appendChild(legItem);

    anguloInicio += anguloSweep;
  });

  // Círculo central
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', 100);
  circle.setAttribute('cy', 100);
  circle.setAttribute('r', 50);
  circle.setAttribute('fill', 'var(--cor-fundo-card)');
  circle.setAttribute('stroke', 'var(--cor-borda)');
  circle.setAttribute('stroke-width', 1);
  svg.appendChild(circle);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', 100);
  text.setAttribute('y', 100);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dy', '0.3em');
  text.setAttribute('font-weight', 'bold');
  text.setAttribute('font-size', '12');
  text.textContent = 'Total Descontos';
  svg.appendChild(text);

  const valor = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  valor.setAttribute('x', 100);
  valor.setAttribute('y', 115);
  valor.setAttribute('text-anchor', 'middle');
  valor.setAttribute('font-weight', 'bold');
  valor.setAttribute('font-size', '14');
  valor.setAttribute('fill', '#dc2626');
  valor.textContent = formatarMoeda(total);
  svg.appendChild(valor);
}

function desenharArco(svg, anguloInicio, anguloSweep, cor) {
  const raio = 80;
  const inicio = {
    x: 100 + raio * Math.cos(anguloInicio * Math.PI / 180),
    y: 100 + raio * Math.sin(anguloInicio * Math.PI / 180)
  };

  const fim = {
    x: 100 + raio * Math.cos((anguloInicio + anguloSweep) * Math.PI / 180),
    y: 100 + raio * Math.sin((anguloInicio + anguloSweep) * Math.PI / 180)
  };

  const largeArc = anguloSweep > 180 ? 1 : 0;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${inicio.x} ${inicio.y} A ${raio} ${raio} 0 ${largeArc} 1 ${fim.x} ${fim.y} L 100 100 Z`);
  path.setAttribute('fill', cor);
  path.setAttribute('stroke', 'var(--cor-fundo-card)');
  path.setAttribute('stroke-width', 2);
  svg.appendChild(path);
}

function preencherTabelaVencimentos(vencimentos) {
  const tbody = document.getElementById('tabela-vencimentos');
  const ordenados = [...vencimentos].sort((a, b) => b.valor - a.valor);
  const soma = vencimentos.reduce((sum, v) => sum + v.valor, 0);
  tbody.innerHTML = ordenados.map(v => `
    <tr>
      <td>${v.descricao}</td>
      <td>${formatarMoeda(v.valor)}</td>
    </tr>
  `).join('') + linhaSomatorio(soma);
}

function preencherTabelaDescontos(descontos) {
  const tbody = document.getElementById('tabela-descontos-detalhe');
  const ordenados = [...descontos].sort((a, b) => b.valor - a.valor);
  const soma = descontos.reduce((sum, d) => sum + d.valor, 0);
  tbody.innerHTML = ordenados.map(d => `
    <tr>
      <td>${d.descricao}</td>
      <td>${formatarMoeda(d.valor)}</td>
    </tr>
  `).join('') + linhaSomatorio(soma);
}

function linhaSomatorio(soma) {
  return `
    <tr style="font-weight: bold; border-top: 2px solid var(--cor-borda);">
      <td>Soma</td>
      <td>${formatarMoeda(soma)}</td>
    </tr>
  `;
}

// --- Edição manual dos valores extraídos ---

function entrarModoEdicao() {
  if (!contrachequeAtual) return;

  document.getElementById('btn-editar-valores').setAttribute('hidden', '');
  document.getElementById('btn-salvar-edicao').removeAttribute('hidden');
  document.getElementById('btn-cancelar-edicao').removeAttribute('hidden');
  document.getElementById('btn-add-vencimento').removeAttribute('hidden');
  document.getElementById('btn-add-desconto').removeAttribute('hidden');
  document.getElementById('th-acoes-vencimentos').removeAttribute('hidden');
  document.getElementById('th-acoes-descontos').removeAttribute('hidden');

  renderizarTabelaEdicao('tabela-vencimentos', contrachequeAtual.vencimentos);
  renderizarTabelaEdicao('tabela-descontos-detalhe', contrachequeAtual.descontos);

  const inputFgts = document.getElementById('input-fgts');
  inputFgts.value = (contrachequeAtual.fgts || 0).toFixed(2).replace('.', ',');
  document.getElementById('valor-fgts').setAttribute('hidden', '');
  inputFgts.removeAttribute('hidden');
}

function renderizarTabelaEdicao(idTabela, itens) {
  const tbody = document.getElementById(idTabela);
  const soma = itens.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
  tbody.innerHTML = itens.map((item, idx) => `
    <tr>
      <td><input type="text" class="input-edicao input-edicao-descricao" data-campo="descricao" data-idx="${idx}" value="${item.descricao}"></td>
      <td><input type="text" class="input-edicao" data-campo="valor" data-idx="${idx}" value="${item.valor.toFixed(2).replace('.', ',')}"></td>
      <td><button type="button" class="btn-remover-item" onclick="removerItemEdicao('${idTabela}', ${idx})">Remover</button></td>
    </tr>
  `).join('') + `
    <tr style="font-weight: bold; border-top: 2px solid var(--cor-borda);">
      <td>Soma</td>
      <td>${formatarMoeda(soma)}</td>
      <td></td>
    </tr>
  `;
}

function adicionarItem(tipo) {
  const idTabela = tipo === 'vencimentos' ? 'tabela-vencimentos' : 'tabela-descontos-detalhe';
  const itens = lerItensEdicao(idTabela);
  itens.push({ descricao: '', valor: 0 });
  renderizarTabelaEdicao(idTabela, itens);
}

function removerItemEdicao(idTabela, idx) {
  const itens = lerItensEdicao(idTabela);
  itens.splice(idx, 1);
  renderizarTabelaEdicao(idTabela, itens);
}

function lerItensEdicao(idTabela) {
  const tbody = document.getElementById(idTabela);
  const linhas = [...tbody.querySelectorAll('tr')].filter(tr => tr.querySelector('[data-campo="descricao"]'));
  return linhas.map(tr => {
    const descricao = tr.querySelector('[data-campo="descricao"]').value.trim();
    const valor = parseValorBrasileiro(tr.querySelector('[data-campo="valor"]').value) || 0;
    return { descricao, valor };
  });
}

function salvarEdicao() {
  if (!contrachequeAtual) return;

  const vencimentos = lerItensEdicao('tabela-vencimentos').filter(v => v.descricao && v.valor > 0);
  const descontos = lerItensEdicao('tabela-descontos-detalhe').filter(d => d.descricao && d.valor > 0);
  const fgts = parseValorBrasileiro(document.getElementById('input-fgts').value) || 0;

  contrachequeAtual.vencimentos = vencimentos;
  contrachequeAtual.descontos = descontos;
  contrachequeAtual.fgts = fgts;
  contrachequeAtual.totalBruto = vencimentos.reduce((sum, v) => sum + v.valor, 0);
  contrachequeAtual.totalDescontos = descontos.reduce((sum, d) => sum + d.valor, 0);
  contrachequeAtual.salarioLiquido = contrachequeAtual.totalBruto - contrachequeAtual.totalDescontos;

  salvarNoHistorico(contrachequeAtual);
  sairModoEdicao();
  exibirDados(contrachequeAtual);
  carregarHistorico();
  mostrarMensagem('Valores atualizados com sucesso!', 'sucesso');
}

function cancelarEdicao() {
  sairModoEdicao();
  if (contrachequeAtual) exibirDados(contrachequeAtual);
}

function sairModoEdicao() {
  document.getElementById('btn-editar-valores').removeAttribute('hidden');
  document.getElementById('btn-salvar-edicao').setAttribute('hidden', '');
  document.getElementById('btn-cancelar-edicao').setAttribute('hidden', '');
  document.getElementById('btn-add-vencimento').setAttribute('hidden', '');
  document.getElementById('btn-add-desconto').setAttribute('hidden', '');
  document.getElementById('th-acoes-vencimentos').setAttribute('hidden', '');
  document.getElementById('th-acoes-descontos').setAttribute('hidden', '');
  document.getElementById('valor-fgts').removeAttribute('hidden');
  document.getElementById('input-fgts').setAttribute('hidden', '');
}

// "DD/MM/AAAA" ou o campo data (Date/ISO) -> "AAAA-MM".
function competenciaISOdoContracheque(c) {
  if (c && c.data) {
    const d = new Date(c.data);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((c && c.competencia) || '');
  return m ? `${m[3]}-${m[2].padStart(2, '0')}` : null;
}

// Espelha o líquido de cada contracheque em renda_por_competencia, para o
// Saldo do Mês usar a renda real do mês (hora extra, 13º, falta) sem redigitar.
function sincronizarRendaPorCompetencia(historico) {
  if (typeof definirRendaDaCompetencia !== 'function') return;
  (historico || obterHistorico()).forEach(c => {
    const iso = competenciaISOdoContracheque(c);
    if (iso && Number(c.salarioLiquido) > 0) {
      definirRendaDaCompetencia(iso, c.salarioLiquido);
    }
  });
}

function salvarNoHistorico(dados) {
  const historico = obterHistorico();

  const index = historico.findIndex(c => c.competencia === dados.competencia);
  if (index !== -1) {
    historico[index] = dados;
  } else {
    historico.push(dados);
  }

  historico.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  try {
    localStorage.setItem(CHAVE_CONTRACHEQUES, JSON.stringify(historico));
  } catch (erro) {
    console.error('Erro ao salvar histórico:', erro);
  }

  sincronizarRendaPorCompetencia(historico);

  // O contracheque mais recente do histórico (por data) é quem define a renda
  // mensal centralizada usada em Despesas Fixas, Envelopes, etc.
  const maisRecente = historico[0];
  if (maisRecente && maisRecente.competencia === dados.competencia && dados.salarioLiquido > 0
      && typeof atualizarRendaMensal === 'function') {
    atualizarRendaMensal(dados.salarioLiquido, dados.competencia);
  }
}

function obterHistorico() {
  try {
    const dados = localStorage.getItem(CHAVE_CONTRACHEQUES);
    return dados ? JSON.parse(dados) : [];
  } catch (erro) {
    console.error('Erro ao carregar histórico:', erro);
    return [];
  }
}

function carregarHistorico() {
  const historico = obterHistorico();
  sincronizarRendaPorCompetencia(historico);

  if (historico.length === 0) {
    document.getElementById('secao-historico').setAttribute('hidden', '');
    return;
  }

  document.getElementById('secao-historico').removeAttribute('hidden');

  const tbody = document.getElementById('tabela-historico');

  // Calcular totais e médias (independe da ordem)
  const totalBruto = historico.reduce((sum, c) => sum + (c.totalBruto || 0), 0);
  const totalDescontos = historico.reduce((sum, c) => sum + (c.totalDescontos || 0), 0);
  const totalLiquido = historico.reduce((sum, c) => sum + (c.salarioLiquido || 0), 0);

  const meses = historico.length;
  const mediaBruto = totalBruto / meses;
  const mediaDescontos = totalDescontos / meses;
  const mediaLiquido = totalLiquido / meses;

  // Variação percentual de cada mês em relação ao mês anterior (sempre cronológico).
  const cronologico = [...historico].sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));
  const variacaoPorMes = {};
  cronologico.forEach((c, i) => {
    const anterior = cronologico[i - 1];
    const pct = (atual, prev) => (prev ? ((atual - prev) / prev) * 100 : null);
    variacaoPorMes[c.competencia] = anterior ? {
      bruto: pct(c.totalBruto || 0, anterior.totalBruto || 0),
      descontos: pct(c.totalDescontos || 0, anterior.totalDescontos || 0),
      liquido: pct(c.salarioLiquido || 0, anterior.salarioLiquido || 0)
    } : { bruto: null, descontos: null, liquido: null };
  });

  const ordenado = [...historico].sort((a, b) => {
    const cmp = compararHistorico(a, b, ordemHistorico.campo);
    return ordemHistorico.dir === 'asc' ? cmp : -cmp;
  });

  tbody.innerHTML = ordenado.map(contrato => {
    const v = variacaoPorMes[contrato.competencia] || {};
    return `
    <tr class="linha-historico" style="cursor: pointer;" onclick="verDetalheHistorico('${contrato.competencia}')" title="Clique para ver o detalhamento">
      <td>${contrato.competencia || 'Desconhecida'}</td>
      <td>${formatarMoeda(contrato.totalBruto || 0)}${formatarVariacao(v.bruto, true)}</td>
      <td>${formatarMoeda(contrato.totalDescontos || 0)}${formatarVariacao(v.descontos, false)}</td>
      <td><strong>${formatarMoeda(contrato.salarioLiquido || 0)}</strong>${formatarVariacao(v.liquido, true)}</td>
    </tr>
  `;
  }).join('') + `
    <tr style="font-weight: bold; border-top: 2px solid var(--cor-borda); background-color: var(--cor-fundo-hover);">
      <td>Total (${meses} ${meses === 1 ? 'mês' : 'meses'})</td>
      <td>${formatarMoeda(totalBruto)}</td>
      <td>${formatarMoeda(totalDescontos)}</td>
      <td>${formatarMoeda(totalLiquido)}</td>
    </tr>
    <tr style="font-weight: bold; background-color: var(--cor-fundo-hover);">
      <td>Média mensal</td>
      <td>${formatarMoeda(mediaBruto)}</td>
      <td>${formatarMoeda(mediaDescontos)}</td>
      <td>${formatarMoeda(mediaLiquido)}</td>
    </tr>
  `;

  atualizarSetasOrdenacao();
  desenharGraficoEvolucao(historico);
}

// Selo de variação percentual vs. o mês anterior. favoravelSeSobe define a cor:
// para bruto/líquido subir é bom (verde); para descontos subir é ruim (vermelho).
function formatarVariacao(pct, favoravelSeSobe) {
  if (pct === null || pct === undefined || !isFinite(pct)) return '';

  const neutro = Math.abs(pct) < 0.05;
  const seta = neutro ? '' : (pct > 0 ? '▲ ' : '▼ ');
  const sinal = pct > 0 ? '+' : '';
  const texto = `${sinal}${pct.toFixed(1).replace('.', ',')}%`;

  let cor = 'var(--cor-texto-leve)';
  if (!neutro) {
    const favoravel = (pct > 0) === favoravelSeSobe;
    cor = favoravel ? 'var(--cor-sucesso)' : 'var(--cor-erro)';
  }

  return `<span class="hist-var" style="color: ${cor};">${seta}${texto}</span>`;
}

// Comparador base (crescente) para as colunas do histórico.
function compararHistorico(a, b, campo) {
  if (campo === 'competencia') {
    return new Date(a.data || 0) - new Date(b.data || 0);
  }
  return (a[campo] || 0) - (b[campo] || 0);
}

// Clique no cabeçalho: alterna asc/desc na mesma coluna, ou começa em desc numa nova.
function ordenarHistorico(campo) {
  if (ordemHistorico.campo === campo) {
    ordemHistorico.dir = ordemHistorico.dir === 'asc' ? 'desc' : 'asc';
  } else {
    ordemHistorico.campo = campo;
    ordemHistorico.dir = 'desc';
  }
  carregarHistorico();
}

function atualizarSetasOrdenacao() {
  document.querySelectorAll('.tabela-historico .ord-seta').forEach(el => {
    el.textContent = el.dataset.col === ordemHistorico.campo
      ? (ordemHistorico.dir === 'asc' ? '▲' : '▼')
      : '';
  });
}

function desenharGraficoEvolucao(historico) {
  const svg = document.getElementById('grafico-evolucao');
  const legenda = document.getElementById('legenda-evolucao');
  svg.innerHTML = '';
  legenda.innerHTML = '';

  // Ordem cronológica (mais antigo primeiro) para ler a evolução da esquerda pra direita
  const ordenado = [...historico].sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));

  const series = [
    { chave: 'totalBruto', nome: 'Bruto', cor: '#1264a3' },
    { chave: 'totalDescontos', nome: 'Descontos', cor: '#dc2626' },
    { chave: 'salarioLiquido', nome: 'Líquido', cor: '#059669' }
  ];

  const maxValor = Math.max(1, ...ordenado.map(c => Math.max(
    c.totalBruto || 0, c.totalDescontos || 0, c.salarioLiquido || 0
  )));

  const margemEsquerda = 55, margemInferior = 30, margemSuperior = 15, margemDireita = 15;
  const largura = 600, altura = 260;
  const areaLargura = largura - margemEsquerda - margemDireita;
  const areaAltura = altura - margemInferior - margemSuperior;

  // Ponto X de cada mês: centralizado se só há 1 mês, senão distribuído ao longo do eixo
  const posX = idx => ordenado.length === 1
    ? margemEsquerda + areaLargura / 2
    : margemEsquerda + (idx / (ordenado.length - 1)) * areaLargura;
  const posY = valor => margemSuperior + areaAltura - (valor / maxValor) * areaAltura;

  // Linhas guia do eixo Y (0%, 50%, 100% do máximo)
  [0, 0.5, 1].forEach(frac => {
    const y = margemSuperior + areaAltura * (1 - frac);
    const linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    linha.setAttribute('x1', margemEsquerda);
    linha.setAttribute('x2', largura - margemDireita);
    linha.setAttribute('y1', y);
    linha.setAttribute('y2', y);
    linha.setAttribute('stroke', 'var(--cor-borda)');
    linha.setAttribute('stroke-width', 1);
    svg.appendChild(linha);

    const texto = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    texto.setAttribute('x', margemEsquerda - 8);
    texto.setAttribute('y', y + 4);
    texto.setAttribute('text-anchor', 'end');
    texto.setAttribute('font-size', '9');
    texto.setAttribute('fill', 'var(--cor-texto-leve)');
    texto.textContent = formatarMoeda(maxValor * frac).replace(',00', '');
    svg.appendChild(texto);
  });

  // Rótulos dos meses no eixo X
  ordenado.forEach((contrato, idx) => {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', posX(idx));
    label.setAttribute('y', altura - margemInferior + 14);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', 'var(--cor-texto-leve)');
    label.textContent = contrato.competencia || '';
    svg.appendChild(label);
  });

  // Uma linha (polyline) por série, com uma bolinha em cada mês
  series.forEach(serie => {
    const pontos = ordenado.map((contrato, idx) => `${posX(idx)},${posY(contrato[serie.chave] || 0)}`).join(' ');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', pontos);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', serie.cor);
    polyline.setAttribute('stroke-width', 2);
    polyline.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(polyline);

    ordenado.forEach((contrato, idx) => {
      const valor = contrato[serie.chave] || 0;
      const circulo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circulo.setAttribute('cx', posX(idx));
      circulo.setAttribute('cy', posY(valor));
      circulo.setAttribute('r', 4);
      circulo.setAttribute('fill', serie.cor);
      circulo.setAttribute('stroke', 'var(--cor-fundo-card)');
      circulo.setAttribute('stroke-width', 1.5);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${serie.nome} — ${contrato.competencia}: ${formatarMoeda(valor)}`;
      circulo.appendChild(title);

      svg.appendChild(circulo);
    });
  });

  legenda.innerHTML = series.map(s => `
    <div class="legenda-item">
      <div class="legenda-cor" style="background: ${s.cor}"></div>
      <span>${s.nome}</span>
    </div>
  `).join('');
}

function verDetalheHistorico(competencia) {
  const historico = obterHistorico();
  const contrato = historico.find(c => c.competencia === competencia);
  if (!contrato) return;

  contrachequeAtual = contrato;
  exibirDados(contrato);
  document.getElementById('secao-dados').scrollIntoView({ behavior: 'smooth' });
}

function confirmarLimparHistorico() {
  if (confirm('Tem certeza que quer apagar todo o histórico de contracheques?')) {
    localStorage.removeItem(CHAVE_CONTRACHEQUES);
    localStorage.removeItem('renda_por_competencia');
    document.getElementById('secao-historico').setAttribute('hidden', '');
    document.getElementById('secao-dados').setAttribute('hidden', '');
    document.getElementById('tabela-historico').innerHTML = '';
    mostrarMensagem('Histórico apagado', 'sucesso');
  }
}

function formatarMoeda(valor) {
  return parseFloat(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function mostrarMensagem(texto, tipo) {
  const container = document.getElementById('mensagem-upload');
  const classes = {
    sucesso: 'mensagem-sucesso',
    erro: 'mensagem-erro',
    info: 'mensagem-info'
  };

  container.innerHTML = `<div class="${classes[tipo] || classes.info}">${texto}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}
