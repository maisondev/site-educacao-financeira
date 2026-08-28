// Gráficos em SVG puro — sem biblioteca, sem CDN.
// Três formas, escolhidas pelo trabalho que cada dado precisa fazer:
// saldo mensal (acima/abaixo de zero) → colunas divergentes;
// gasto por categoria (magnitude ordenada) → barras horizontais;
// patrimônio líquido (tendência de uma série) → linha.

// Paleta validada: azul e vermelho como par divergente (ΔE 21.6 sob protanopia),
// e o azul como rampa sequencial para magnitude.
const GRAF_CORES = {
  positivo: '#2a78d6',
  negativo: '#e34948',
  sequencial: ['#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#6da7ec', '#86b6ef', '#9ec5f4'],
  linha: '#2a78d6',
  grade: '#e6e6e6',
  texto: '#52514e',
  superficie: '#ffffff'
};

// Espelha os rótulos de despesas-variaveis.js, que não é carregado aqui.
const GRAF_CATEGORIAS = {
  agua: 'Água',
  luz: 'Luz / Energia Elétrica',
  gas: 'Gás',
  internet: 'Internet',
  telefone: 'Telefone / Celular',
  streaming: 'Streaming / Assinaturas',
  combustivel: 'Combustível',
  manutencao: 'Manutenção / Consertos',
  cartao: 'Cartão de Crédito',
  outro: 'Outro'
};

const GRAF_MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function grafEscapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function grafRotuloMes(competencia) {
  const [ano, mes] = competencia.split('-').map(Number);
  return `${GRAF_MESES_CURTOS[mes - 1]}/${String(ano).slice(2)}`;
}

// Valor curto para caber junto da marca: "R$ 1,2 mil", "R$ 15,3 mil".
function grafValorCurto(valor) {
  const absoluto = Math.abs(valor);
  const sinal = valor < 0 ? '−' : '';
  if (absoluto >= 1000) return `${sinal}R$ ${(absoluto / 1000).toFixed(1).replace('.', ',')} mil`;
  return `${sinal}R$ ${absoluto.toFixed(0)}`;
}

// Tabela equivalente ao gráfico: a mesma informação sem depender de cor.
function grafTabela(colunas, linhas) {
  const cabecalho = colunas.map(c => `<th>${grafEscapar(c)}</th>`).join('');
  const corpo = linhas
    .map(l => `<tr>${l.map(c => `<td>${grafEscapar(c)}</td>`).join('')}</tr>`)
    .join('');
  return `
    <details class="graf-tabela">
      <summary>Ver os números</summary>
      <table>
        <thead><tr>${cabecalho}</tr></thead>
        <tbody>${corpo}</tbody>
      </table>
    </details>
  `;
}

function grafVazio(mensagem) {
  return `<p class="graf-vazio">${grafEscapar(mensagem)}</p>`;
}

// --- Gráfico 1: saldo mensal ---------------------------------------------
// Colunas a partir da linha do zero: azul quando sobra, vermelho quando falta.

function grafSerieSaldoMensal(meses = 12) {
  if (typeof calcularSaldoDoMes !== 'function' || typeof competenciaSomarMeses !== 'function') return [];

  const atual = typeof competenciaSelecionada === 'function' ? competenciaSelecionada() : null;
  if (!atual) return [];

  const serie = [];
  for (let i = meses - 1; i >= 0; i--) {
    const competencia = competenciaSomarMeses(atual, -i);
    const r = calcularSaldoDoMes(competencia);
    serie.push({ competencia, saldo: r.saldo, receitas: r.receitas, saidas: r.saidas });
  }
  // Meses anteriores ao primeiro lançamento não dizem nada: corta o vazio inicial.
  const primeiro = serie.findIndex(p => p.receitas > 0 || p.saidas > 0);
  return primeiro === -1 ? [] : serie.slice(primeiro);
}

function grafSaldoMensal(serie) {
  if (serie.length === 0) {
    return grafVazio('Ainda não há lançamentos suficientes para desenhar a evolução do saldo.');
  }

  const largura = 720;
  const altura = 260;
  const margem = { topo: 24, direita: 16, base: 34, esquerda: 64 };
  const areaL = largura - margem.esquerda - margem.direita;
  const areaA = altura - margem.topo - margem.base;

  const valores = serie.map(p => p.saldo);
  const maximo = Math.max(...valores, 0);
  const minimo = Math.min(...valores, 0);
  const amplitude = (maximo - minimo) || 1;
  const y = valor => margem.topo + ((maximo - valor) / amplitude) * areaA;
  const yZero = y(0);

  const banda = areaL / serie.length;
  const larguraBarra = Math.min(24, banda - 10);

  const colunas = serie.map((p, i) => {
    const centro = margem.esquerda + banda * i + banda / 2;
    const x = centro - larguraBarra / 2;
    const topo = p.saldo >= 0 ? y(p.saldo) : yZero;
    const alturaBarra = Math.max(Math.abs(y(p.saldo) - yZero), 1);
    const cor = p.saldo >= 0 ? GRAF_CORES.positivo : GRAF_CORES.negativo;
    // Canto arredondado só na ponta dos dados; o lado do zero fica reto.
    const raio = Math.min(4, alturaBarra);
    const caminho = p.saldo >= 0
      ? `M${x},${topo + alturaBarra} L${x},${topo + raio} Q${x},${topo} ${x + raio},${topo} L${x + larguraBarra - raio},${topo} Q${x + larguraBarra},${topo} ${x + larguraBarra},${topo + raio} L${x + larguraBarra},${topo + alturaBarra} Z`
      : `M${x},${topo} L${x},${topo + alturaBarra - raio} Q${x},${topo + alturaBarra} ${x + raio},${topo + alturaBarra} L${x + larguraBarra - raio},${topo + alturaBarra} Q${x + larguraBarra},${topo + alturaBarra} ${x + larguraBarra},${topo + alturaBarra - raio} L${x + larguraBarra},${topo} Z`;

    return `
      <path d="${caminho}" fill="${cor}" class="graf-marca"
        data-titulo="${grafEscapar(grafRotuloMes(p.competencia))}"
        data-valor="${grafEscapar(formatarMoedaBrasileira(p.saldo))}"
        data-extra="${grafEscapar(`entradas ${formatarMoedaBrasileira(p.receitas)} · saídas ${formatarMoedaBrasileira(p.saidas)}`)}"></path>
      <text x="${centro}" y="${altura - 12}" class="graf-eixo" text-anchor="middle">${grafRotuloMes(p.competencia)}</text>
    `;
  }).join('');

  // Rótulo direto só no último mês — é o que a leitura procura primeiro.
  const ultimo = serie[serie.length - 1];
  const centroUltimo = margem.esquerda + banda * (serie.length - 1) + banda / 2;
  // No saldo negativo o rótulo vai acima da linha do zero: abaixo da barra ele
  // colidiria com o nome do mês e com o rótulo do eixo.
  const yRotulo = ultimo.saldo >= 0 ? y(ultimo.saldo) - 8 : yZero - 8;

  return `
    <svg viewBox="0 0 ${largura} ${altura}" class="graf-svg" role="img"
         aria-label="Saldo mensal dos últimos ${serie.length} meses">
      <line x1="${margem.esquerda}" y1="${yZero}" x2="${largura - margem.direita}" y2="${yZero}"
            stroke="${GRAF_CORES.grade}" stroke-width="1"></line>
      <text x="${margem.esquerda - 8}" y="${yZero + 4}" class="graf-eixo" text-anchor="end">R$ 0</text>
      <text x="${margem.esquerda - 8}" y="${y(maximo) + 4}" class="graf-eixo" text-anchor="end">${grafValorCurto(maximo)}</text>
      ${minimo < 0 ? `<text x="${margem.esquerda - 8}" y="${y(minimo) + 4}" class="graf-eixo" text-anchor="end">${grafValorCurto(minimo)}</text>` : ''}
      ${colunas}
      <text x="${centroUltimo}" y="${yRotulo}" class="graf-rotulo" text-anchor="middle">${grafValorCurto(ultimo.saldo)}</text>
    </svg>
    ${grafTabela(['Mês', 'Entradas', 'Saídas', 'Saldo'], serie.map(p => [
      grafRotuloMes(p.competencia),
      formatarMoedaBrasileira(p.receitas),
      formatarMoedaBrasileira(p.saidas),
      formatarMoedaBrasileira(p.saldo)
    ]))}
  `;
}

// --- Gráfico 2: gasto por categoria --------------------------------------
// Barras horizontais ordenadas: nomes longos cabem e a ordem já é a leitura.

function grafSerieCategorias(competencia) {
  const rotulos = typeof CATEGORIAS !== 'undefined' ? CATEGORIAS : GRAF_CATEGORIAS;
  const totais = {};

  Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []).forEach(d => {
    const mes = typeof competenciaDoRegistro === 'function'
      ? competenciaDoRegistro(d)
      : (d.competencia || d.data || '').slice(0, 7);
    if (mes !== competencia) return;
    const nome = rotulos[d.categoria] || d.categoria || 'Outro';
    totais[nome] = (totais[nome] || 0) + (Number(d.valor) || 0);
  });

  return Object.keys(totais)
    .map(nome => ({ nome, valor: totais[nome] }))
    .sort((a, b) => b.valor - a.valor);
}

function grafCategorias(serie, competencia) {
  if (serie.length === 0) {
    return grafVazio(`Nenhuma despesa variável lançada em ${formatarCompetencia(competencia)}.`);
  }

  const largura = 720;
  const alturaLinha = 34;
  const margem = { topo: 8, direita: 96, base: 8, esquerda: 168 };
  const altura = margem.topo + serie.length * alturaLinha + margem.base;
  const areaL = largura - margem.esquerda - margem.direita;

  const maximo = Math.max(...serie.map(s => s.valor));
  const total = serie.reduce((soma, s) => soma + s.valor, 0);

  const barras = serie.map((s, i) => {
    const y = margem.topo + i * alturaLinha + (alturaLinha - 20) / 2;
    const comprimento = Math.max((s.valor / maximo) * areaL, 2);
    // Mais escuro = maior: a rampa segue a ordem, não a identidade.
    const cor = GRAF_CORES.sequencial[Math.min(i, GRAF_CORES.sequencial.length - 1)];
    const raio = Math.min(4, comprimento);

    return `
      <text x="${margem.esquerda - 10}" y="${y + 14}" class="graf-eixo" text-anchor="end">${grafEscapar(s.nome)}</text>
      <path d="M${margem.esquerda},${y} L${margem.esquerda + comprimento - raio},${y} Q${margem.esquerda + comprimento},${y} ${margem.esquerda + comprimento},${y + raio} L${margem.esquerda + comprimento},${y + 20 - raio} Q${margem.esquerda + comprimento},${y + 20} ${margem.esquerda + comprimento - raio},${y + 20} L${margem.esquerda},${y + 20} Z"
            fill="${cor}" class="graf-marca"
            data-titulo="${grafEscapar(s.nome)}"
            data-valor="${grafEscapar(formatarMoedaBrasileira(s.valor))}"
            data-extra="${((s.valor / total) * 100).toFixed(0)}% do mês"></path>
      <text x="${margem.esquerda + comprimento + 10}" y="${y + 14}" class="graf-rotulo">${grafValorCurto(s.valor)}</text>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${largura} ${altura}" class="graf-svg" role="img"
         aria-label="Gasto por categoria em ${formatarCompetencia(competencia)}">
      ${barras}
    </svg>
    ${grafTabela(['Categoria', 'Valor', '% do mês'], serie.map(s => [
      s.nome,
      formatarMoedaBrasileira(s.valor),
      `${((s.valor / total) * 100).toFixed(0)}%`
    ]))}
  `;
}

// --- Gráfico 3: patrimônio líquido ---------------------------------------
// Uma série ao longo do tempo: linha, com o ponto atual sempre no fim.

function grafPatrimonioAtual() {
  const dados = Store.ler(Store.CHAVES.BALANCO, null);
  if (!dados) return null;
  const ativos = (dados.ativos || []).reduce((s, a) => s + (Number(a.valor) || 0), 0);
  const passivos = (dados.passivos || []).reduce((s, p) => s + (Number(p.valor) || 0), 0);
  if (ativos === 0 && passivos === 0) return null;
  return ativos - passivos;
}

function grafSeriePatrimonio() {
  const historico = Store.ler(Store.CHAVES.HISTORICO_MENSAL, {});
  const pontos = Object.keys(historico)
    .filter(c => typeof historico[c].patrimonio === 'number')
    .sort()
    .map(c => ({ competencia: c, valor: historico[c].patrimonio }));

  const atual = grafPatrimonioAtual();
  const hoje = typeof competenciaAtual === 'function' ? competenciaAtual() : null;
  if (atual !== null && hoje && !pontos.some(p => p.competencia === hoje)) {
    pontos.push({ competencia: hoje, valor: atual, agora: true });
  }
  return pontos;
}

function grafPatrimonio(serie) {
  if (serie.length < 2) {
    return grafVazio(
      'A evolução do patrimônio aparece conforme os meses forem fechados no painel — ' +
      'cada fechamento guarda o patrimônio líquido daquele mês.'
    );
  }

  const largura = 720;
  const altura = 240;
  const margem = { topo: 24, direita: 96, base: 34, esquerda: 64 };
  const areaL = largura - margem.esquerda - margem.direita;
  const areaA = altura - margem.topo - margem.base;

  const valores = serie.map(p => p.valor);
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores, 0);
  const amplitude = (maximo - minimo) || 1;

  const x = i => margem.esquerda + (serie.length === 1 ? 0 : (i / (serie.length - 1)) * areaL);
  const y = valor => margem.topo + ((maximo - valor) / amplitude) * areaA;

  const caminho = serie.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.valor)}`).join(' ');
  const areaFill = `${caminho} L${x(serie.length - 1)},${y(minimo)} L${x(0)},${y(minimo)} Z`;

  const pontos = serie.map((p, i) => `
    <circle cx="${x(i)}" cy="${y(p.valor)}" r="4" fill="${GRAF_CORES.linha}"
            stroke="${GRAF_CORES.superficie}" stroke-width="2" class="graf-marca"
            data-titulo="${grafEscapar(grafRotuloMes(p.competencia))}"
            data-valor="${grafEscapar(formatarMoedaBrasileira(p.valor))}"
            data-extra="${p.agora ? 'situação de hoje' : 'mês fechado'}"></circle>
  `).join('');

  const ultimo = serie[serie.length - 1];

  return `
    <svg viewBox="0 0 ${largura} ${altura}" class="graf-svg" role="img"
         aria-label="Evolução do patrimônio líquido">
      <line x1="${margem.esquerda}" y1="${y(minimo)}" x2="${largura - margem.direita}" y2="${y(minimo)}"
            stroke="${GRAF_CORES.grade}" stroke-width="1"></line>
      <path d="${areaFill}" fill="${GRAF_CORES.linha}" fill-opacity="0.1"></path>
      <path d="${caminho}" fill="none" stroke="${GRAF_CORES.linha}" stroke-width="2"
            stroke-linejoin="round" stroke-linecap="round"></path>
      ${pontos}
      <text x="${x(serie.length - 1) + 10}" y="${y(ultimo.valor) + 4}" class="graf-rotulo">${grafValorCurto(ultimo.valor)}</text>
      <text x="${margem.esquerda}" y="${altura - 12}" class="graf-eixo">${grafRotuloMes(serie[0].competencia)}</text>
      <text x="${largura - margem.direita}" y="${altura - 12}" class="graf-eixo" text-anchor="end">${grafRotuloMes(ultimo.competencia)}</text>
    </svg>
    ${grafTabela(['Mês', 'Patrimônio líquido'], serie.map(p => [
      grafRotuloMes(p.competencia),
      formatarMoedaBrasileira(p.valor)
    ]))}
  `;
}

// --- Camada de hover ------------------------------------------------------
// Uma única caixa reaproveitada por todas as marcas da página.

function grafAtivarTooltip(container) {
  let caixa = document.getElementById('graf-tooltip');
  if (!caixa) {
    caixa = document.createElement('div');
    caixa.id = 'graf-tooltip';
    caixa.className = 'graf-tooltip';
    caixa.hidden = true;
    document.body.appendChild(caixa);
  }

  container.querySelectorAll('.graf-marca').forEach(marca => {
    marca.addEventListener('mouseenter', () => {
      caixa.innerHTML =
        `<strong>${grafEscapar(marca.dataset.titulo)}</strong>` +
        `<span>${grafEscapar(marca.dataset.valor)}</span>` +
        (marca.dataset.extra ? `<span class="graf-tooltip-extra">${grafEscapar(marca.dataset.extra)}</span>` : '');
      caixa.hidden = false;
    });
    marca.addEventListener('mousemove', (e) => {
      caixa.style.left = `${e.clientX + 14}px`;
      caixa.style.top = `${e.clientY + 14}px`;
    });
    marca.addEventListener('mouseleave', () => {
      caixa.hidden = true;
    });
  });
}

function renderizarGraficos() {
  const container = document.getElementById('container-graficos');
  if (!container) return;

  const competencia = typeof competenciaSelecionada === 'function'
    ? competenciaSelecionada()
    : null;

  container.innerHTML = `
    <section class="graf-bloco">
      <h3>Saldo por mês</h3>
      <p class="graf-legenda">
        Quanto sobrou ou faltou em cada mês.
        <span class="graf-chave"><span class="graf-swatch" style="background:${GRAF_CORES.positivo}"></span>sobrou</span>
        <span class="graf-chave"><span class="graf-swatch" style="background:${GRAF_CORES.negativo}"></span>faltou</span>
      </p>
      ${grafSaldoMensal(grafSerieSaldoMensal())}
    </section>

    <section class="graf-bloco">
      <h3>Gasto por categoria — ${grafEscapar(formatarCompetencia(competencia))}</h3>
      <p class="graf-legenda">Despesas variáveis do mês, da maior para a menor.</p>
      ${grafCategorias(grafSerieCategorias(competencia), competencia)}
    </section>

    <section class="graf-bloco">
      <h3>Patrimônio líquido</h3>
      <p class="graf-legenda">Ativos menos passivos, mês a mês.</p>
      ${grafPatrimonio(grafSeriePatrimonio())}
    </section>
  `;

  grafAtivarTooltip(container);
}
