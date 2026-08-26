// Análise de Contracheque

const CHAVE_CONTRACHEQUES = 'contracheques_historico';

let contrachequeAtual = null;

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

    // Extrair vencimentos - sem depender de códigos específicos
    dados.vencimentos = [];

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];

      // Vencimento CLT
      if ((linha.includes('Vencimento') && linha.includes('CLT')) || linha.includes('0002')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.vencimentos.push({ descricao: 'Vencimento CLT', valor });
        }
      }

      // Gratificação
      if ((linha.includes('Gratificação') || linha.includes('gratificacao')) && linha.includes('0028')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.vencimentos.push({ descricao: 'Gratificação Tempo de Serviço', valor });
        }
      }

      // Auxílio Creche
      if ((linha.includes('Auxil') || linha.includes('auxil')) && (linha.includes('Creche') || linha.includes('creche')) && linha.includes('1012')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.vencimentos.push({ descricao: 'Auxílio Creche', valor });
        }
      }
    }

    // Extrair descontos
    dados.descontos = [];
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];

      if (linha.includes('INSS') && linha.includes('5003')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.descontos.push({ descricao: 'INSS', valor });
        }
      }
      if (linha.includes('IRRF') && linha.includes('5004')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.descontos.push({ descricao: 'IRRF', valor });
        }
      }
      if ((linha.includes('Plano') && linha.includes('Saude')) && linha.includes('5318')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.descontos.push({ descricao: 'Plano de Saúde - Titular', valor });
        }
      }
      if ((linha.includes('Plano') && linha.includes('Saude')) && linha.includes('5616')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.descontos.push({ descricao: 'Plano de Saúde - Dependente', valor });
        }
      }
      if ((linha.includes('Plano') && linha.includes('Odonto')) && linha.includes('5613')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.descontos.push({ descricao: 'Plano Odontológico - Titular', valor });
        }
      }
      if ((linha.includes('Plano') && linha.includes('Odonto')) && linha.includes('5615')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.descontos.push({ descricao: 'Plano Odontológico - Dependente', valor });
        }
      }
      if ((linha.includes('Refeição') || linha.includes('refeicao')) && linha.includes('5748')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.descontos.push({ descricao: 'Desconto Refeição', valor });
        }
      }
      if ((linha.includes('Alimentação') || linha.includes('alimentacao')) && linha.includes('5752')) {
        const valor = extrairValor(linha);
        if (valor && valor > 0) {
          dados.descontos.push({ descricao: 'Desconto Alimentação', valor });
        }
      }
    }

    // Extrair totais - procurar em toda a string junto
    // Procura padrões como "Total de ganhos (P+V) R$ 13.180,29"
    const totalBrutoMatch = texto.match(/Total\s+de\s+ganhos\s*[\(\w\+\)]*\s*([\d.,]+)/i) ||
                           texto.match(/P\+V\)\s*([\d.,]+)/i);
    if (totalBrutoMatch) {
      const valor = normalizarValor(totalBrutoMatch[1]);
      if (valor > 5000) dados.totalBruto = valor;
    }

    const totalDescMatch = texto.match(/Total\s+de\s+descontos\s*[\(\w\)]*\s*([\d.,]+)/i) ||
                          texto.match(/\(D\)\s*([\d.,]+)/i);
    if (totalDescMatch) {
      const valor = normalizarValor(totalDescMatch[1]);
      if (valor > 0) dados.totalDescontos = valor;
    }

    const liquídoMatch = texto.match(/Líquido\s*([\d.,]+)/i) ||
                        texto.match(/Líquid\w*\s*([\d.,]+)/i);
    if (liquídoMatch) {
      const valor = normalizarValor(liquídoMatch[1]);
      if (valor > 0) dados.salarioLiquido = valor;
    }

    const fgtsMatch = texto.match(/FGTS\s*([\d.,]+)/i);
    if (fgtsMatch) {
      dados.fgts = normalizarValor(fgtsMatch[1]);
    }

    console.log('Dados extraídos:', dados); // Debug

    // Se não encontrou o líquido, calcular como bruto - descontos
    if (!dados.salarioLiquido && dados.totalBruto && dados.totalDescontos) {
      dados.salarioLiquido = dados.totalBruto - dados.totalDescontos;
      console.log('Líquido calculado como:', dados.salarioLiquido);
    }

    // Validar dados mínimos
    if (!dados.salarioLiquido || dados.salarioLiquido <= 0) {
      console.warn('Não foi possível extrair o salário líquido. Dados:', dados);
      return null;
    }

    return dados;
  } catch (erro) {
    console.error('Erro ao extrair dados:', erro);
    return null;
  }
}

function extrairValor(texto) {
  // Encontra valores formatados como "R$ 1.234,56" ou "1234.56" ou "1234,56"
  const match = texto.match(/R?\$?\s*([\d.]+,\d{2}|[\d.]+)/);
  if (match) {
    const valor = match[1].replace(/\./g, '').replace(',', '.');
    return parseFloat(valor);
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
