// Análise de Contracheque

const CHAVE_CONTRACHEQUES = 'contracheques_historico';

let contrachequeAtual = null;

// Função auxiliar para normalizar valores
function normalizarValor(str) {
  // Aceita: "R$ 8.858,08", "8.858,08", "8858,08" ou "8858.08"
  if (!str) return 0;
  str = str.replace(/R\$\s?/g, '').trim();

  if (str.includes(',')) {
    // Formato brasileiro: 1.234,56 ou 1234,56
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  } else {
    // Formato internacional: 1234.56
    return parseFloat(str);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setupUpload();
  carregarHistorico();
});

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

    // Extrair vencimentos - abordagem: procurar número antes de cada palavra-chave
    dados.vencimentos = [];

    // Procura número (flexível com espaços) antes de palavra-chave
    const extrairPorPalavraChave = (texto, palavra, descricao, minValor, maxValor) => {
      // Procura: número com até 2 espaços antes da palavra
      const regex = new RegExp(`([\\d.]+,\\d{2})\\s{0,3}[\\d.,]*\\s{0,3}${palavra}`, 'i');
      const match = texto.match(regex);
      if (match) {
        const valor = normalizarValor(match[1]);
        if (valor >= minValor && valor <= maxValor) {
          return { descricao, valor };
        }
      }
      return null;
    };

    const vent = extrairPorPalavraChave(texto, 'Vencimento.*CLT', 'Vencimento CLT', 5000, 50000);
    if (vent) dados.vencimentos.push(vent);

    const grat = extrairPorPalavraChave(texto, 'Gratificação.*[Tt]empo', 'Gratificação Tempo de Serviço', 100, 10000);
    if (grat) dados.vencimentos.push(grat);

    const aux = extrairPorPalavraChave(texto, '[Aa]uxil.*[Cc]reche', 'Auxílio Creche', 100, 10000);
    if (aux) dados.vencimentos.push(aux);

    // Extrair descontos - mesmo padrão de vencimentos
    dados.descontos = [];

    // Procurar valores específicos por código - procura cada código individualmente
    const codigosDescontos = [
      { codigo: '5003', descricao: 'INSS', min: 800, max: 1500 },
      { codigo: '5004', descricao: 'IRRF', min: 1500, max: 3000 },
      { codigo: '5318', descricao: 'Plano de Saúde - Titular', min: 200, max: 600 },
      { codigo: '5616', descricao: 'Plano de Saúde - Dependente', min: 200, max: 800 },
      { codigo: '5613', descricao: 'Plano Odontológico - Titular', min: 1, max: 100 },
      { codigo: '5615', descricao: 'Plano Odontológico - Dependente', min: 1, max: 100 },
      { codigo: '5748', descricao: 'Desconto Refeição', min: 100, max: 500 },
      { codigo: '5752', descricao: 'Desconto Alimentação', min: 10, max: 200 }
    ];

    codigosDescontos.forEach(({ codigo, descricao, min, max }) => {
      // Procura: "CÓDIGO ... NÚMERO,NÚMERO" (com até 200 chars entre)
      const regex = new RegExp(`${codigo}[\\s\\S]{0,200}?([0-9.]+,[0-9]{2})`, 'i');
      const match = texto.match(regex);
      if (match) {
        const valor = normalizarValor(match[1]);
        if (valor >= min && valor <= max) {
          dados.descontos.push({ descricao, valor });
        }
      }
    });

    // Procurar valores na linha de totais (formato tabela final)
    // Padrão: "FGTS ... Total de ganhos ... Total de descontos ... Líquido"
    // Valores: "974,42  R$ 13.180,29  R$ 4.322,21  R$ 8.858,08"

    // Procura TODOS os números em formato ,XX no texto
    const todosNumeros = [...texto.matchAll(/([0-9.]+,[0-9]{2})/g)];

    if (todosNumeros.length >= 4) {
      // Os últimos 4 números provavelmente são: FGTS, Total Bruto, Total Descontos, Líquido
      const valores = todosNumeros.slice(-4).map(m => normalizarValor(m[1]));

      if (valores[0] > 500 && valores[0] < 2000) dados.fgts = valores[0];
      if (valores[1] > 5000 && valores[1] < 50000) dados.totalBruto = valores[1];
      if (valores[2] > 100 && valores[2] < 10000) dados.totalDescontos = valores[2];
      if (valores[3] > 1000 && valores[3] < 50000) dados.salarioLiquido = valores[3];
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

    // Calcular total bruto a partir dos vencimentos (mais confiável que regex)
    if (dados.vencimentos && dados.vencimentos.length > 0) {
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
      const valor = normalizarValor(m);
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
  tbody.innerHTML = vencimentos.map(v => `
    <tr>
      <td>${v.descricao}</td>
      <td>${formatarMoeda(v.valor)}</td>
    </tr>
  `).join('');
}

function preencherTabelaDescontos(descontos) {
  const tbody = document.getElementById('tabela-descontos-detalhe');
  tbody.innerHTML = descontos.map(d => `
    <tr>
      <td>${d.descricao}</td>
      <td>${formatarMoeda(d.valor)}</td>
    </tr>
  `).join('');
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

  if (historico.length === 0) {
    document.getElementById('secao-historico').setAttribute('hidden', '');
    return;
  }

  document.getElementById('secao-historico').removeAttribute('hidden');

  const tbody = document.getElementById('tabela-historico');
  tbody.innerHTML = historico.map(contrato => `
    <tr>
      <td>${contrato.competencia || 'Desconhecida'}</td>
      <td>${formatarMoeda(contrato.totalBruto || 0)}</td>
      <td>${formatarMoeda(contrato.totalDescontos || 0)}</td>
      <td><strong>${formatarMoeda(contrato.salarioLiquido || 0)}</strong></td>
    </tr>
  `).join('');
}

function confirmarLimparHistorico() {
  if (confirm('Tem certeza que quer apagar todo o histórico de contracheques?')) {
    localStorage.removeItem(CHAVE_CONTRACHEQUES);
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
