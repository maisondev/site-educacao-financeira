// Análise de Fatura de Cartão
// Lê o PDF (ou texto) de uma fatura fechada, categoriza os lançamentos e
// permite filtrar por cartão. Tudo roda no navegador; nada é enviado a servidor.
// Persistência: localStorage['analise_faturas'] = { ["AAAA-MM|Banco[|Apelido]"]: { ...analise } }
// Uma análise por banco por mês; com "apelido" (opcional) dá pra guardar várias
// faturas do mesmo banco no mesmo mês (ex.: um cartão por pessoa). Sem apelido,
// reanalisar o mesmo banco/mês sobrescreve só aquela entrada.

const AF_STORAGE_KEY = 'analise_faturas';
const AF_SEM_CARTAO = '__sem__';

// Chave de um registro de análise: competência + banco (+ apelido, quando houver).
function afChave(competencia, banco, apelido) {
  const base = `${competencia}|${banco || 'Outro'}`;
  const ap = String(apelido || '').trim();
  return ap ? `${base}|${ap}` : base;
}

// Converte chaves antigas (só "AAAA-MM") para "AAAA-MM|Banco". Retorna true se mudou algo.
function afMigrarChaves(dados) {
  let mudou = false;
  Object.keys(dados).forEach(k => {
    if (!/^\d{4}-\d{2}$/.test(k)) return;
    const reg = dados[k] || {};
    const nova = afChave(reg.competencia || k, reg.banco);
    if (nova === k || dados[nova]) return;
    dados[nova] = reg;
    delete dados[k];
    mudou = true;
  });
  return mudou;
}

// Chave das regras aprendidas de categorização (trecho da descrição -> categoria AF).
const AF_REGRAS_KEY = (typeof Store !== 'undefined' && Store.CHAVES.REGRAS_CATEGORIZACAO)
  || 'regras_categorizacao';

// De/para: categoria da análise de fatura -> categoria do vocabulário único
// (CAD_CATEGORIAS_PADRAO, usado por despesas-variaveis.html e relatórios).
// Espelha REL_FATURA_PARA_CATEGORIA em relatorios.js — manter os dois iguais.
// Só "online" e "vestuário" não têm equivalente direto e caem em "outro".
const AF_PARA_CATEGORIA_DV = {
  mercado: 'alimentacao',
  restaurante: 'alimentacao',
  transporte: 'combustivel',
  assinatura: 'streaming',
  casa: 'manutencao',
  saude: 'saude',
  online: 'outro',
  vestuario: 'outro',
  educacao: 'educacao',
  servicos: 'cuidados',
  lazer: 'lazer',
  pets: 'pets',
  impostos: 'impostos',
  outro: 'outro'
};

// --- Categorias (chave -> rótulo + cor da barra) --------------------------------
const AF_CATEGORIAS = {
  mercado:     { nome: 'Mercado / alimentação',      cor: '#4a154b' },
  casa:        { nome: 'Casa e eletro',              cor: '#1264a3' },
  online:      { nome: 'Compras online / marketplace', cor: '#2d7e3c' },
  restaurante: { nome: 'Restaurantes / delivery',    cor: '#c88c00' },
  transporte:  { nome: 'Transporte / combustível',   cor: '#a63030' },
  saude:       { nome: 'Saúde / farmácia',           cor: '#0f766e' },
  vestuario:   { nome: 'Vestuário',                  cor: '#7c3aed' },
  educacao:    { nome: 'Educação / livros',          cor: '#b45309' },
  assinatura:  { nome: 'Assinaturas',                cor: '#6d28d9' },
  servicos:    { nome: 'Serviços pessoais',          cor: '#be185d' },
  lazer:       { nome: 'Lazer / academia',           cor: '#0369a1' },
  pets:        { nome: 'Pets',                       cor: '#65a30d' },
  impostos:    { nome: 'Impostos e taxas',           cor: '#696969' },
  outro:       { nome: 'Outros',                     cor: '#374151' }
};

// Ordem importa: a primeira regra que casar vence.
const AF_REGRAS = [
  ['assinatura', /ANTHROPIC|CLAUDE|OPENAI|CHATGPT|NETFLIX|SPOTIFY|DEEZER|YOUTUBE ?PREMIUM|DISNEY|\bHBO\b|PARAMOUNT|PRIME ?VIDEO|AMAZON ?PRIME|APPLE\.COM|ITUNES\.COM|ICLOUD|GOOGLE ?(ONE|STORAGE|\*|WORKSPACE)|GITHUB|\bNOTION\b|\bFIGMA\b|\bCANVA\b|MICROSOFT|OFFICE ?365|\bADOBE\b|DROPBOX|\bLINKEDIN\b|GLOBOPLAY|CRUNCHYROLL|\bTWITCH\b|\bMEDIUM\b|SUBSTACK|PATREON|MELI\+|SUBSCR|\bSUB\b/],
  ['mercado', /ASSAI|ATACAD|ATACADAO|CARREFOUR|\bBIG\b|SUPER ?DB|\bSUPERDB\b|SUPERMERC|MERCADINHO|HORTIFRUTI|SACOLAO|PAO ?DE ?ACUCAR|\bPRIX\b|\bMAKRO\b|GBARBOSA|BOMPRECO|\bCOMPER\b|DIST.*CARNES|\bCARNES\b|ACOUGUE|FRIGORIFICO|\bHIPER\b|NACIONAL SUP/],
  ['restaurante', /IFOOD|RESTAURANTE|LANCHONETE|HAMBURG|\bBURGER\b|MCDONALD|\bBK\b|\bKFC\b|SUBWAY|\bPIZZA|CHURRASC|CANTINA|\bBAR \b|BOTECO|CAFETERIA|\bCAFE\b|SORVETE|OUTBACK|HABIBS|GIRAFFAS|DIVINO FOGAO|SPOLETO/],
  ['casa', /\bBEMOL\b|MAGAZINE ?LUIZA|\bMAGALU\b|CASAS ?BAHIA|PONTOFRIO|\bLEROY\b|TELHANORTE|\bC&C\b|\bCOMEPI\b|FERRAGENS|MADEIREIRA|MATERIAL ?DE ?CONST|\bMOVEIS\b|\bELETRO\b|\bHAVAN\b|TOK ?STOK|\bMOBLY\b|CAMICADO|\bMADESA\b/],
  ['online', /AMAZON|\bAMZN\b|MKTPLC|MARKETPLACE|MERCADOLIVRE|MERCADO ?LIVRE|MERCADOLIV|\bSHOPEE\b|ALIEXPRESS|\bSHEIN\b|\bEBAY\b|SUBMARINO|AMERICANAS|SHOPTIME|\bKABUM\b|\bPICHAU\b|ALL ?IMPORT/],
  ['transporte', /\bUBER\b|\b99\b|99APP|\b99 ?POP\b|CABIFY|INDRIVE|\bPOSTO\b|IPIRANGA|\bSHELL\b|BR ?MANIA|PETROBRAS|COMBUSTIVEL|\bGASOLINA\b|ETANOL|ESTACIONAMENTO|ZONA ?AZUL|\bPEDAGIO\b|SEM ?PARAR|CONECTCAR|\bVELOE\b|PASSAGEM|\bLATAM\b|\bGOL \b|AZUL LINHAS|\bBUSER\b|\bBLABLACAR\b/],
  ['saude', /DROGA|DROGARIA|DROGASIL|FARMACIA|\bFARMA\b|\bRAIA\b|\bPACHECO\b|\bPANVEL\b|PAGUE ?MENOS|\bNISSEI\b|RD ?SAUDE|SAO ?JOAO|ULTRAFARMA|\bCLINICA\b|LABORAT|HOSPITAL|HAPVIDA|\bUNIMED\b|\bODONTO\b|\bDENTAL\b|PSICOL|FISIOTERAP|\bOTICA\b|\bOPTICA\b/],
  ['vestuario', /\bMODAS\b|\bRENNER\b|RIACHUELO|\bC&A\b|\bCEA\b|\bZARA\b|\bHERING\b|\bMALWEE\b|CALCADOS|\bMODA \b|LOJAS ?MARISA|\bMARISA\b|PERNAMBUCANAS|CENTAURO|\bNIKE\b|\bADIDAS\b|NETSHOES|\bDAFITI\b|YOUCOM|\bLEADER\b/],
  ['educacao', /\bUDEMY\b|\bALURA\b|COURSERA|\bEDX\b|ROCKETSEAT|\bESCOLA\b|\bCOLEGIO\b|FACULDADE|UNIVERS|\bCURSO\b|LIVRARIA|SARAIVA|\bCULTURA\b|\bKINDLE\b|DUOLINGO|\bBABBEL\b/],
  ['pets', /\bPETZ\b|\bCOBASI\b|PETSHOP|PET ?SHOP|PETLOVE|AGROPET|VETERINAR|\bPETCARE\b/],
  ['lazer', /\bCINEMA\b|CINEMARK|KINOPLEX|\bUCI \b|\bINGRESSO\b|\bSYMPLA\b|EVENTIM|\bSTEAM\b|PLAYSTATION|\bPSN\b|\bXBOX\b|NINTENDO|EPIC ?GAMES|\bRIOT\b|BLIZZARD|\bCLUBE\b|ACADEMIA|SMART ?FIT|BIO ?RITMO|\bGYM\b|CROSSFIT/],
  ['servicos', /JIM\.COM|CABELELE|CABELEIRE|BARBEAR|BARBER|\bSALAO\b|MANICURE|ESTETICA|\bSPA\b|LAVANDERIA|CHAVEIRO|CORREIOS|\bSEDEX\b/],
  ['impostos', /\bIOF\b|\bJUROS\b|\bMULTA\b|\bENCARGO\b|ANUIDADE|\bTARIFA\b|\bMORA\b/]
];

const AF_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Cidades reconhecidas no fim da descrição (Bradesco escreve o nome da loja em MAIÚSCULAS,
// então só separamos a cidade quando ela bate com esta lista).
const AF_CIDADES = new Set([
  'MANAUS', 'SAO PAULO', 'SÃO PAULO', 'RIO DE JANEIRO', 'BRASILIA', 'BRASÍLIA',
  'ARARANGUA', 'ARARANGUÁ', 'BELO HORIZONTE', 'CURITIBA', 'PORTO ALEGRE', 'SALVADOR',
  'RECIFE', 'FORTALEZA', 'GOIANIA', 'GOIÂNIA', 'CAMPINAS', 'GUARULHOS', 'OSASCO',
  'SANTO ANDRE', 'SANTO ANDRÉ', 'SAO BERNARDO', 'BARUERI', 'NITEROI', 'NITERÓI',
  'CACHOEIRINHA', 'CAMPO GRANDE', 'BELEM', 'BELÉM', 'FLORIANOPOLIS', 'FLORIANÓPOLIS',
  'VITORIA', 'VITÓRIA', 'NATAL', 'JOAO PESSOA', 'MACEIO', 'MACEIÓ', 'TERESINA',
  'SAO JOSE DOS CAMPOS', 'RIBEIRAO PRETO', 'SOROCABA', 'JUNDIAI', 'CONTAGEM'
]);

// Estado em memória da análise aberta
let afEstado = null; // { banco, competencia, lancamentos:[...], inclusos:Set, salva:bool }

// Ordenação das tabelas de "Gastos por categoria" (col: 'data' | 'valor').
let afOrdemItens = { col: 'valor', dir: 'desc' };

function afChaveData(d) {
  const m = /^(\d{2})\/(\d{2})$/.exec(d || '');
  return m ? parseInt(m[2], 10) * 100 + parseInt(m[1], 10) : 0;
}

function afCompararItens(a, b) {
  const dir = afOrdemItens.dir === 'asc' ? 1 : -1;
  if (afOrdemItens.col === 'data') {
    return (afChaveData(a.data) - afChaveData(b.data)) * dir || (b.valor - a.valor);
  }
  return (a.valor - b.valor) * dir || (afChaveData(b.data) - afChaveData(a.data));
}

function afSetaOrdem(col) {
  if (afOrdemItens.col !== col) return '';
  return afOrdemItens.dir === 'asc' ? ' ▲' : ' ▼';
}

function afOrdenarItens(col) {
  if (afOrdemItens.col === col) {
    afOrdemItens.dir = afOrdemItens.dir === 'asc' ? 'desc' : 'asc';
  } else {
    afOrdemItens = { col: col, dir: col === 'data' ? 'asc' : 'desc' };
  }
  afRenderCategorias();
}

// --- utilidades ---------------------------------------------------------------
function afGerarId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function afEscapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

function afFmt(valor) {
  return typeof formatarMoedaBrasileira === 'function'
    ? formatarMoedaBrasileira(valor)
    : 'R$ ' + Number(valor || 0).toFixed(2);
}

function afParseBR(str) {
  return typeof parseValorBrasileiro === 'function' ? parseValorBrasileiro(str) : parseFloat(str) || 0;
}

function afMesAtualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function afFormatarCompetencia(iso) {
  const m = /^(\d{4})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '—';
  const mes = AF_MESES[parseInt(m[2], 10) - 1] || m[2];
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)}/${m[1]}`;
}

function afMostrarMsg(texto, tipo) {
  const cls = 'af-msg ' + (tipo === 'erro' ? 'af-erro' : 'af-ok');
  // Mostra a mensagem no topo (contexto de upload) e junto dos botões de ação,
  // porque quem clica em "Salvar análise" costuma estar com a página rolada para baixo.
  ['af-msg', 'af-msg-acoes'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    el.className = cls;
    el.hidden = false;
  });
  // Traz para a tela a cópia que estiver mais perto de onde o usuário está.
  const perto = [document.getElementById('af-msg-acoes'), document.getElementById('af-msg')]
    .filter(el => el && el.offsetParent !== null)
    .map(el => ({ el, dist: Math.abs(el.getBoundingClientRect().top - window.innerHeight / 2) }))
    .sort((a, b) => a.dist - b.dist)[0];
  if (perto) perto.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- extração de texto do PDF ----------------------------------------------------
async function afExtrairTextoPDF(arrayBuffer) {
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('Leitor de PDF não carregou. Use a opção de colar o texto.');
  }
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const linhas = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const conteudo = await page.getTextContent();
    let ultimaY = null;
    let atual = '';
    for (const item of conteudo.items) {
      const y = Math.round(item.transform[5]);
      if (ultimaY === null || Math.abs(y - ultimaY) <= 2) {
        atual += (atual && !atual.endsWith(' ') && item.str && !item.str.startsWith(' ') ? ' ' : '') + item.str;
      } else {
        if (atual.trim()) linhas.push(atual.trim());
        atual = item.str;
      }
      ultimaY = y;
    }
    if (atual.trim()) linhas.push(atual.trim());
  }
  return linhas.join('\n');
}

// --- parser da fatura ----------------------------------------------------------
function afParsearFatura(textoBruto) {
  let linhas = String(textoBruto || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Se veio tudo grudado numa linha só, quebra antes de cada "DD/MM " ou "DD/MM\t"
  if (linhas.length < 3 && linhas[0]) {
    linhas = linhas[0].split(/(?=\b\d{2}\/\d{2}\s)/).map(l => l.trim()).filter(Boolean);
  }

  const reData = /^(\d{2})\/(\d{2})(?!\/)/;
  const reValor = /-?\d{1,3}(?:\.\d{3})*,\d{2}/g;

  // competência: mês/ano do vencimento (pode estar em linha separada do rótulo)
  let competencia = null;
  const mVenc = String(textoBruto || '').match(/Vencimento[\s\S]{0,40}?(\d{2})\/(\d{2})\/(\d{4})/i);
  if (mVenc) competencia = `${mVenc[3]}-${mVenc[2]}`;

  const lancamentos = [];
  let cartaoAtual = '';
  let titularAtual = '';
  let linhaAnterior = '';

  for (const linha of linhas) {
    // cabeçalho de cartão: "<Titular> Cartão NNNN XXXX XXXX NNNN" (Itaú/Nubank/Bradesco)
    // ou, em duas linhas, "<TITULAR>" seguido de "Picpay Card final NNNN" (PicPay).
    if ((/Cart[aã]o/i.test(linha) || /\bCard\b/i.test(linha)) && !reData.test(linha)) {
      if (/N[uú]mero do Cart[aã]o/i.test(linha)) { linhaAnterior = linha; continue; } // rótulo da página, não define titular
      const trecho = linha.match(/(?:Cart[aã]o|Card)(?:\s+final)?[ :]+([\dX ]*\d{4})/i);
      if (trecho) {
        const grupos = trecho[1].match(/\d{4}/g);
        if (grupos && grupos.length) {
          cartaoAtual = grupos[grupos.length - 1];
          const posTermo = linha.search(/Cart[aã]o|Card/i);
          const antes = linha.slice(0, posTermo).trim();
          const anteriorTrim = linhaAnterior.trim();
          if (antes.split(/\s+/).filter(Boolean).length >= 2 && !/n[uú]mero/i.test(antes)) {
            titularAtual = antes;
          } else if (/^[A-ZÀ-Ú][A-ZÀ-Ú .]{3,}$/.test(anteriorTrim) && anteriorTrim.split(/\s+/).filter(Boolean).length >= 2) {
            // titular numa linha própria, acima do cabeçalho do cartão (layout PicPay)
            titularAtual = anteriorTrim;
          }
          linhaAnterior = linha;
          continue;
        }
      }
    }

    if (/^Total\s+(para|d[ao])\b/i.test(linha)) { linhaAnterior = linha; continue; }

    const mData = linha.match(reData);
    if (!mData) { linhaAnterior = linha; continue; }

    let resto = linha.replace(reData, '').trim();
    linhaAnterior = linha;
    if (!resto || !/[A-Za-zÀ-ÿ]/.test(resto)) continue; // data solta / código de barras, sem descrição

    const valores = resto.match(reValor);
    if (!valores || !valores.length) continue;
    const valorStr = valores[valores.length - 1]; // último valor da linha = R$
    const valor = afParseBR(valorStr);
    if (!valor) continue;

    // recorta a descrição: se há 2+ valores (compra internacional: US$ + domínio + R$),
    // corta no primeiro valor; senão, corta no último.
    let semValor;
    if (valores.length >= 2) {
      semValor = resto.slice(0, resto.indexOf(valores[0])).trim();
    } else {
      semValor = resto.slice(0, resto.lastIndexOf(valorStr)).trim();
    }
    semValor = semValor.replace(/^-\s*|\s*-\s*$/g, '').replace(/\bUS\$?\b/gi, '').trim();

    // parcela: NN/NN (ex "03/03" ou grudado "LJ01/02")
    let parcelaAtual = null;
    let parcelaTotal = null;
    // conserta parcela partida pelo layout do PDF ("10/1 2" -> "10/12")
    semValor = semValor.replace(/(\d{1,2})\/(\d)\s(\d)(?=\s|$)/, '$1/$2$3');
    const mParc = semValor.match(/(\d{1,2})\s*\/\s*(\d{2})(?!\d)/);
    if (mParc) {
      const a = parseInt(mParc[1], 10);
      const b = parseInt(mParc[2], 10);
      if (b >= 2 && b <= 48 && a >= 1 && a <= b) {
        parcelaAtual = a;
        parcelaTotal = b;
        semValor = semValor.replace(mParc[0], ' ').replace(/\s{2,}/g, ' ').trim();
      }
    }

    // cidade: só separa se os últimos 1-3 tokens baterem com a lista conhecida
    let cidade = '';
    const toks = semValor.split(/\s+/).filter(Boolean);
    for (let n = Math.min(3, toks.length - 1); n >= 1; n--) {
      const cand = toks.slice(toks.length - n).join(' ').toUpperCase().replace(/[.,]/g, '').trim();
      if (AF_CIDADES.has(cand)) {
        cidade = toks.slice(toks.length - n).join(' ');
        toks.length -= n;
        break;
      }
    }

    let descricao = toks.join(' ').replace(/\s{2,}/g, ' ').trim();
    if (!descricao) descricao = 'Lançamento';

    const dU = descricao.toUpperCase();
    let tipo = 'compra';
    if (/PAG(AMENT|TO|\.)|\bPGTO\b|DEB\s*EM\s*C\/?C|DEB\.?\s*CONTA|CR[EÉ]DITO RECEBIDO/.test(dU)) {
      tipo = 'pagamento';
    } else if (/^IOF|\bIOF\b|\bJUROS\b|\bMULTA\b|\bENCARGO|ANUIDADE|\bTARIFA\b/.test(dU)) {
      tipo = 'encargo';
    }

    lancamentos.push({
      id: afGerarId(),
      data: `${mData[1]}/${mData[2]}`,
      descricao: descricao,
      cidade: cidade,
      cartao: cartaoAtual,
      titular: titularAtual,
      parcelaAtual: parcelaAtual,
      parcelaTotal: parcelaTotal,
      valor: Math.abs(valor),
      tipo: tipo
    });
  }

  return { competencia, lancamentos };
}

// Regras aprendidas: { "TRECHO EM MAIUSCULAS": "categoriaAF" }
function afLerRegras() {
  if (typeof Store !== 'undefined') {
    const r = Store.ler(AF_REGRAS_KEY, {});
    return r && typeof r === 'object' ? r : {};
  }
  try {
    return JSON.parse(localStorage.getItem(AF_REGRAS_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function afGravarRegras(regras) {
  if (typeof Store !== 'undefined') return Store.gravar(AF_REGRAS_KEY, regras);
  try {
    localStorage.setItem(AF_REGRAS_KEY, JSON.stringify(regras));
  } catch (e) {
    console.error('Não foi possível salvar as regras de categorização:', e);
  }
}

// Guarda a correção manual como regra: descrição inteira (em maiúsculas) -> categoria.
function afAprenderRegra(descricao, categoria) {
  const trecho = String(descricao || '').toUpperCase().trim();
  if (!trecho || !AF_CATEGORIAS[categoria]) return;
  const regras = afLerRegras();
  if (regras[trecho] === categoria) return;
  regras[trecho] = categoria;
  afGravarRegras(regras);
}

function afCategoriaPorRegra(lanc) {
  const alvo = `${lanc.descricao} ${lanc.cidade}`.toUpperCase();
  const regras = afLerRegras();
  for (const trecho of Object.keys(regras)) {
    if (trecho && alvo.includes(trecho) && AF_CATEGORIAS[regras[trecho]]) {
      return regras[trecho];
    }
  }
  return null;
}

function afCategorizar(lanc) {
  if (lanc.tipo === 'encargo') return 'impostos';
  const aprendida = afCategoriaPorRegra(lanc);
  if (aprendida) return aprendida;
  const alvo = `${lanc.descricao} ${lanc.cidade}`.toUpperCase();
  for (const [chave, re] of AF_REGRAS) {
    if (re.test(alvo)) return chave;
  }
  return 'outro';
}

function afEhRecorrente(lanc, categoria) {
  return categoria === 'assinatura';
}

// --- importação de CSV categorizado ------------------------------------------
// Lê o CSV gerado na análise assistida (colunas
// Data;Descricao;Cidade;Cartao;Categoria;Parcela;Recorrente;Valor) e monta os
// lançamentos já categorizados, sem passar pelo parser de PDF.

// Rótulo da coluna "Categoria" do CSV -> chave de AF_CATEGORIAS.
function afCategoriaDeRotulo(rotulo) {
  const bruto = String(rotulo || '').trim();
  if (!bruto) return 'outro';
  if (AF_CATEGORIAS[bruto]) return bruto;
  const norm = bruto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const chave of Object.keys(AF_CATEGORIAS)) {
    const nomeNorm = AF_CATEGORIAS[chave].nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (norm === nomeNorm) return chave;
  }
  const heuristica = [
    [/mercado|aliment/, 'mercado'],
    [/restaurante|lanche|delivery|ifood/, 'restaurante'],
    [/assinatura/, 'assinatura'],
    [/lazer|entreten/, 'lazer'],
    [/educ/, 'educacao'],
    [/online|marketplace/, 'online'],
    [/casa|eletro/, 'casa'],
    [/transporte|combustiv|carro/, 'transporte'],
    [/saude|farmacia/, 'saude'],
    [/cuidados pessoais|servico/, 'servicos'],
    [/vestuario/, 'vestuario'],
    [/\bpet/, 'pets'],
    [/imposto|taxa|\biof\b|juros|multa/, 'impostos']
  ];
  for (const [re, chave] of heuristica) {
    if (re.test(norm)) return chave;
  }
  return 'outro';
}

function afParsearCSV(textoBruto) {
  const linhas = String(textoBruto || '')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  if (!linhas.length) return { lancamentos: [] };

  const sep = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ';' : ',';
  const inicio = (/data/i.test(linhas[0]) && /valor/i.test(linhas[0])) ? 1 : 0;

  const lancamentos = [];
  for (let i = inicio; i < linhas.length; i++) {
    const campos = linhas[i].split(sep).map(c => c.trim());
    if (campos.length < 8) continue;
    const data = campos[0];
    const descricao = campos[1];
    const cidade = campos[2];
    const cartao = campos[3];
    const rotuloCat = campos[4];
    const parcela = campos[5];
    const recorrente = campos[6];
    const valorStr = campos[7];

    if (/^total$/i.test(rotuloCat)) continue;
    if (!/^\d{1,2}\/\d{1,2}/.test(data)) continue;
    const valor = afParseBR(valorStr);
    if (!valor) continue;

    let parcelaAtual = null;
    let parcelaTotal = null;
    const mParc = /(\d{1,2})\s*\/\s*(\d{1,2})/.exec(parcela || '');
    if (mParc) {
      parcelaAtual = parseInt(mParc[1], 10);
      parcelaTotal = parseInt(mParc[2], 10);
    }

    const categoria = afCategoriaDeRotulo(rotuloCat);
    lancamentos.push({
      id: afGerarId(),
      data: data.replace(/^(\d)\//, '0$1/').replace(/^(\d{2})\/(\d)$/, '$1/0$2'),
      descricao: descricao || 'Lançamento',
      cidade: cidade && cidade !== '-' ? cidade : '',
      cartao: cartao && cartao !== '-' ? cartao : '',
      titular: '',
      parcelaAtual: parcelaAtual,
      parcelaTotal: parcelaTotal,
      valor: valor,
      tipo: categoria === 'impostos' && valor > 0 ? 'encargo' : 'compra',
      categoria: categoria,
      recorrente: /^s/i.test(recorrente || '')
    });
  }
  return { lancamentos };
}

// --- construção do estado ------------------------------------------------------
function afMontarEstado(banco, parsed, preCategorizado) {
  const lancamentos = parsed.lancamentos.map(l => {
    if (preCategorizado && l.categoria && AF_CATEGORIAS[l.categoria]) {
      return Object.assign({ recorrente: false }, l);
    }
    const categoria = afCategorizar(l);
    return Object.assign({}, l, {
      categoria: categoria,
      recorrente: afEhRecorrente(l, categoria)
    });
  });

  const cartoes = new Set();
  lancamentos.forEach(l => cartoes.add(l.cartao || AF_SEM_CARTAO));

  const campoApelido = document.getElementById('af-apelido');
  return {
    banco: banco,
    apelido: campoApelido ? campoApelido.value.trim() : '',
    competencia: parsed.competencia || afMesAtualISO(),
    lancamentos: lancamentos,
    inclusos: cartoes, // todos marcados por padrão
    salva: false
  };
}

function afLancamentosIncluidos() {
  if (!afEstado) return [];
  return afEstado.lancamentos.filter(l =>
    l.tipo !== 'pagamento' && afEstado.inclusos.has(l.cartao || AF_SEM_CARTAO)
  );
}

// --- persistência ------------------------------------------------------------
function afLerTodas() {
  try {
    const bruto = localStorage.getItem(AF_STORAGE_KEY);
    const dados = bruto ? JSON.parse(bruto) : {};
    if (!dados || typeof dados !== 'object') return {};
    if (afMigrarChaves(dados)) {
      try { afGravarTodas(dados); } catch (e) { /* segue com a versão migrada em memória */ }
    }
    return dados;
  } catch (e) {
    console.error('Erro ao ler análises salvas:', e);
    return {};
  }
}

function afGravarTodas(dados) {
  localStorage.setItem(AF_STORAGE_KEY, JSON.stringify(dados));
}

function afSalvarAnalise() {
  if (!afEstado) {
    afMostrarMsg('Analise uma fatura antes de salvar.', 'erro');
    return;
  }
  const campoComp = document.getElementById('af-comp');
  const comp = (campoComp && campoComp.value) || afEstado.competencia;
  if (!/^\d{4}-\d{2}$/.test(comp || '')) {
    afMostrarMsg('Informe a competência (mês da fatura) antes de salvar.', 'erro');
    return;
  }
  afEstado.competencia = comp;
  afEstado.salva = true;

  // o seletor é a fonte da verdade do emissor no momento de salvar
  const selBanco = document.getElementById('af-banco');
  if (selBanco && selBanco.value) afEstado.banco = selBanco.value;
  const campoApelido = document.getElementById('af-apelido');
  afEstado.apelido = campoApelido ? campoApelido.value.trim() : (afEstado.apelido || '');

  const todas = afLerTodas();
  const chave = afChave(comp, afEstado.banco, afEstado.apelido);
  afEstado.chave = chave;
  delete todas[comp]; // remove eventual chave antiga (só competência) desta mesma fatura
  todas[chave] = {
    banco: afEstado.banco,
    apelido: afEstado.apelido || '',
    competencia: comp,
    dataImportacao: new Date().toISOString(),
    inclusos: Array.from(afEstado.inclusos),
    lancamentos: afEstado.lancamentos
  };
  try {
    afGravarTodas(todas);
  } catch (e) {
    console.error('Não foi possível salvar a análise:', e);
    const semEspaco = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
    afMostrarMsg(
      semEspaco
        ? 'Sem espaço no navegador para salvar. Faça um backup e limpe análises antigas no histórico.'
        : 'Não foi possível salvar a análise no navegador. Veja o console para detalhes.',
      'erro'
    );
    return;
  }
  const rotuloBanco = `${afEstado.banco || 'fatura'}${afEstado.apelido ? ` (${afEstado.apelido})` : ''}`;
  afMostrarMsg(`Análise de ${rotuloBanco} — ${afFormatarCompetencia(comp)} salva no navegador.`, 'ok');
  afRenderizarHistorico();
}

function afAutoSalvarSeSalva() {
  if (afEstado && afEstado.salva) {
    const todas = afLerTodas();
    const chave = afEstado.chave || afChave(afEstado.competencia, afEstado.banco, afEstado.apelido);
    if (todas[chave]) {
      todas[chave].inclusos = Array.from(afEstado.inclusos);
      todas[chave].lancamentos = afEstado.lancamentos;
      afGravarTodas(todas);
    }
  }
}

function afAbrirAnalise(chave) {
  const todas = afLerTodas();
  // aceita a chave completa ("AAAA-MM|Banco[|Apelido]") ou, para links vindos de
  // "Meus Cartões", só "AAAA-MM|Banco" ou até só a competência — nesses casos
  // abre a 1ª análise que casar (competência e, quando informado, banco).
  let reg = todas[chave];
  let chaveReal = chave;
  if (!reg) {
    const partes = String(chave || '').split('|');
    const comp = partes[0];
    const banco = partes[1];
    if (/^\d{4}-\d{2}$/.test(comp || '')) {
      chaveReal = Object.keys(todas).find(k => {
        const r = todas[k];
        if ((r.competencia || k.split('|')[0]) !== comp) return false;
        return !banco || (r.banco || 'Outro') === banco;
      });
      reg = chaveReal ? todas[chaveReal] : null;
    }
  }
  if (!reg) return;
  afEstado = {
    banco: reg.banco || 'Outro',
    apelido: reg.apelido || (String(chaveReal || '').split('|')[2] || ''),
    competencia: reg.competencia || (chaveReal || '').split('|')[0],
    chave: chaveReal,
    lancamentos: (reg.lancamentos || []).map(l => Object.assign({ recorrente: false }, l)),
    inclusos: new Set(reg.inclusos && reg.inclusos.length
      ? reg.inclusos
      : (reg.lancamentos || []).map(l => l.cartao || AF_SEM_CARTAO)),
    salva: true
  };
  const selBanco = document.getElementById('af-banco');
  if (selBanco) selBanco.value = afEstado.banco;
  const campoApelido = document.getElementById('af-apelido');
  if (campoApelido) campoApelido.value = afEstado.apelido;
  afRenderResultado();
  document.getElementById('af-resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function afExcluirAnalise(chave) {
  const todas = afLerTodas();
  const reg = todas[chave];
  if (!reg) return;
  const rotulo = `${reg.banco || 'fatura'} — ${afFormatarCompetencia(reg.competencia || chave.split('|')[0])}`;
  if (!confirm(`Excluir a análise de ${rotulo}?`)) return;
  delete todas[chave];
  afGravarTodas(todas);
  afRenderizarHistorico();
}

// --- render: resultado -------------------------------------------------------
function afRenderResultado() {
  if (!afEstado) return;
  document.getElementById('af-resultado').hidden = false;
  document.getElementById('af-comp').value = afEstado.competencia;
  const campoApelido = document.getElementById('af-apelido');
  if (campoApelido) campoApelido.value = afEstado.apelido || '';

  afRenderFiltroCartoes();
  afRenderTiles();
  afRenderCategorias();
  afRenderPorCartao();
  afRenderPagamentos();
}

function afResumoPorCartao() {
  const mapa = new Map();
  afEstado.lancamentos.forEach(l => {
    if (l.tipo === 'pagamento') return;
    const chave = l.cartao || AF_SEM_CARTAO;
    if (!mapa.has(chave)) mapa.set(chave, { total: 0, qtd: 0, titular: l.titular || '' });
    const reg = mapa.get(chave);
    reg.total += l.valor;
    reg.qtd += 1;
    if (!reg.titular && l.titular) reg.titular = l.titular;
  });
  return mapa;
}

function afRenderFiltroCartoes() {
  const cont = document.getElementById('af-cartoes-filtro');
  const mapa = afResumoPorCartao();
  if (!mapa.size) {
    cont.innerHTML = '<span class="af-vazio">Nenhum cartão identificado.</span>';
    return;
  }
  const linhas = [];
  mapa.forEach((reg, chave) => {
    const marcado = afEstado.inclusos.has(chave) ? 'checked' : '';
    const rotulo = chave === AF_SEM_CARTAO
      ? 'Sem cartão / ajustes'
      : `final ${afEscapar(chave)}${reg.titular ? ' · ' + afEscapar(afPrimeiroNome(reg.titular)) : ''}`;
    linhas.push(`
      <label class="af-cartao-check">
        <input type="checkbox" data-cartao="${afEscapar(chave)}" ${marcado} onchange="afToggleCartao(this)">
        <span>${rotulo}</span>
        <span class="af-cartao-soma">${afFmt(reg.total)}</span>
      </label>
    `);
  });
  cont.innerHTML = linhas.join('');
}

function afPrimeiroNome(nome) {
  const p = String(nome || '').trim().split(/\s+/);
  return p.slice(0, 2).join(' ');
}

function afToggleCartao(chk) {
  const chave = chk.getAttribute('data-cartao');
  if (chk.checked) afEstado.inclusos.add(chave);
  else afEstado.inclusos.delete(chave);
  afAutoSalvarSeSalva();
  afRenderTiles();
  afRenderCategorias();
  afRenderPorCartao();
}

function afRenderTiles() {
  const inc = afLancamentosIncluidos();
  const total = inc.reduce((s, l) => s + l.valor, 0);
  const recorrente = inc.filter(l => l.recorrente).reduce((s, l) => s + l.valor, 0);
  const variavel = total - recorrente;
  const futuras = inc.reduce((s, l) => {
    if (l.parcelaAtual && l.parcelaTotal && l.parcelaTotal > l.parcelaAtual) {
      return s + (l.parcelaTotal - l.parcelaAtual) * l.valor;
    }
    return s;
  }, 0);

  const tiles = [
    { k: 'Total selecionado', v: afFmt(total), n: `${inc.length} lançamento${inc.length === 1 ? '' : 's'}`, destaque: true },
    { k: 'Despesa fixa / recorrente', v: afFmt(recorrente), n: 'assinaturas' },
    { k: 'Gasto variável', v: afFmt(variavel), n: 'compras e parcelas' },
    { k: 'Parcelas futuras (estim.)', v: '~' + afFmt(futuras), n: 'próximas faturas' }
  ];

  document.getElementById('af-tiles').innerHTML = tiles.map(t => `
    <div class="af-tile ${t.destaque ? 'af-tile-destaque' : ''}">
      <div class="af-tile-k">${t.k}</div>
      <div class="af-tile-v">${t.v}</div>
      <div class="af-tile-n">${t.n}</div>
    </div>
  `).join('');
}

function afOpcoesCategoria(selecionada) {
  return Object.keys(AF_CATEGORIAS).map(chave =>
    `<option value="${chave}" ${chave === selecionada ? 'selected' : ''}>${AF_CATEGORIAS[chave].nome}</option>`
  ).join('');
}

function afRenderCategorias() {
  const cont = document.getElementById('af-categorias');
  const inc = afLancamentosIncluidos();

  if (!inc.length) {
    cont.innerHTML = '<p class="af-vazio">Nenhum lançamento nos cartões selecionados.</p>';
    return;
  }

  const total = inc.reduce((s, l) => s + l.valor, 0);
  const grupos = {};
  inc.forEach(l => {
    (grupos[l.categoria] = grupos[l.categoria] || []).push(l);
  });

  const ordenadas = Object.keys(grupos).sort((a, b) => {
    const sa = grupos[a].reduce((s, l) => s + l.valor, 0);
    const sb = grupos[b].reduce((s, l) => s + l.valor, 0);
    return sb - sa;
  });

  const maiorSoma = ordenadas.reduce((m, c) => {
    const s = grupos[c].reduce((a, l) => a + l.valor, 0);
    return Math.max(m, s);
  }, 0);

  cont.innerHTML = ordenadas.map(chave => {
    const itens = grupos[chave].slice().sort(afCompararItens);
    const soma = itens.reduce((s, l) => s + l.valor, 0);
    const pct = total > 0 ? (soma / total) * 100 : 0;
    const larguraBarra = maiorSoma > 0 ? (soma / maiorSoma) * 100 : 0;
    const cor = (AF_CATEGORIAS[chave] || AF_CATEGORIAS.outro).cor;
    const nome = (AF_CATEGORIAS[chave] || AF_CATEGORIAS.outro).nome;

    const linhasItens = itens.map(l => {
      const cartaoTxt = l.cartao ? `final ${afEscapar(l.cartao)}` : 'sem cartão';
      const cidadeTxt = l.cidade ? afEscapar(l.cidade) + ' · ' : '';
      const parcelaTxt = l.parcelaAtual && l.parcelaTotal
        ? `${l.parcelaAtual}/${l.parcelaTotal}`
        : '—';
      return `
        <tr>
          <td>${afEscapar(l.data)}</td>
          <td>
            <span class="af-desc-loja">${afEscapar(l.descricao)}</span><br>
            <span class="af-desc-cidade">${cidadeTxt}${cartaoTxt}</span>
          </td>
          <td>${parcelaTxt}</td>
          <td>
            <select data-id="${l.id}" onchange="afAlterarCategoria(this)">${afOpcoesCategoria(l.categoria)}</select>
          </td>
          <td>
            <label class="af-rec-check">
              <input type="checkbox" data-id="${l.id}" ${l.recorrente ? 'checked' : ''} onchange="afAlterarRecorrente(this)"> fixa
            </label>
          </td>
          <td class="af-valor">${afFmt(l.valor)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="af-cat">
        <div class="af-cat-head">
          <div class="af-cat-top">
            <span class="af-cat-nome">${nome}</span>
            <span class="af-cat-fig">${afFmt(soma)}<span class="af-cat-pct">${pct.toFixed(1)}%</span></span>
          </div>
          <div class="af-cat-barra"><i style="width:${larguraBarra.toFixed(1)}%;background:${cor};"></i></div>
        </div>
        <div class="af-tabela-wrap">
          <table class="af-tabela">
            <thead>
              <tr>
                <th class="af-th-ord" onclick="afOrdenarItens('data')" title="Ordenar por data">Data${afSetaOrdem('data')}</th>
                <th>Descrição</th>
                <th>Parcela</th>
                <th>Categoria</th>
                <th>Recorrente</th>
                <th class="af-valor af-th-ord" onclick="afOrdenarItens('valor')" title="Ordenar por valor">Valor${afSetaOrdem('valor')}</th>
              </tr>
            </thead>
            <tbody>${linhasItens}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function afRenderPorCartao() {
  const cont = document.getElementById('af-por-cartao');
  const mapa = afResumoPorCartao();
  const linhas = [];
  mapa.forEach((reg, chave) => {
    if (!afEstado.inclusos.has(chave)) return;
    const rotulo = chave === AF_SEM_CARTAO ? 'Sem cartão / ajustes' : `Cartão final ${afEscapar(chave)}`;
    linhas.push(`<div>${rotulo}<strong>${afFmt(reg.total)}</strong></div>`);
  });
  cont.innerHTML = linhas.length ? linhas.join('') : '<p class="af-vazio">Nenhum cartão selecionado.</p>';
}

function afRenderPagamentos() {
  const el = document.getElementById('af-pagamentos');
  const pagamentos = afEstado.lancamentos.filter(l => l.tipo === 'pagamento');
  if (!pagamentos.length) {
    el.hidden = true;
    return;
  }
  const soma = pagamentos.reduce((s, l) => s + l.valor, 0);
  el.hidden = false;
  el.textContent = `Pagamentos / créditos na fatura: ${afFmt(soma)} (não contam como gasto e ficam de fora dos totais acima).`;
}

function afAlterarCategoria(sel) {
  const lanc = afEstado.lancamentos.find(l => l.id === sel.getAttribute('data-id'));
  if (!lanc) return;
  lanc.categoria = sel.value;
  lanc.recorrente = afEhRecorrente(lanc, sel.value) || lanc.recorrente;
  afAprenderRegra(lanc.descricao, sel.value);
  afAutoSalvarSeSalva();
  afRenderTiles();
  afRenderCategorias();
}

function afAlterarRecorrente(chk) {
  const lanc = afEstado.lancamentos.find(l => l.id === chk.getAttribute('data-id'));
  if (!lanc) return;
  lanc.recorrente = chk.checked;
  afAutoSalvarSeSalva();
  afRenderTiles();
}

// --- render: histórico -------------------------------------------------------
function afRenderizarHistorico() {
  const todas = afLerTodas();
  // ordena por competência (desc) e, dentro do mês, por banco (asc)
  const chaves = Object.keys(todas).sort((a, b) => {
    const ca = todas[a].competencia || a.split('|')[0];
    const cb = todas[b].competencia || b.split('|')[0];
    if (ca !== cb) return cb.localeCompare(ca);
    const ba = todas[a].banco || '';
    const bb = todas[b].banco || '';
    if (ba !== bb) return ba.localeCompare(bb);
    return (todas[a].apelido || '').localeCompare(todas[b].apelido || '');
  });
  const secao = document.getElementById('af-historico-secao');
  const cont = document.getElementById('af-historico');

  if (!chaves.length) {
    secao.hidden = true;
    return;
  }
  secao.hidden = false;

  cont.innerHTML = chaves.map(chave => {
    const reg = todas[chave];
    const comp = reg.competencia || chave.split('|')[0];
    const lancs = (reg.lancamentos || []).filter(l => l.tipo !== 'pagamento');
    const inclusos = new Set(reg.inclusos && reg.inclusos.length ? reg.inclusos : lancs.map(l => l.cartao || AF_SEM_CARTAO));
    const total = lancs
      .filter(l => inclusos.has(l.cartao || AF_SEM_CARTAO))
      .reduce((s, l) => s + (l.valor || 0), 0);
    const chaveJs = chave.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
      <div class="af-hist-item">
        <div class="af-hist-info">
          <strong>${afFormatarCompetencia(comp)}</strong> — ${afEscapar(reg.banco || '')}${reg.apelido ? ' · ' + afEscapar(reg.apelido) : ''}<br>
          <span>${afFmt(total)} · ${lancs.length} lançamento${lancs.length === 1 ? '' : 's'}</span>
        </div>
        <div class="af-hist-acoes">
          <button type="button" class="af-btn-mini" onclick="afAbrirAnalise('${chaveJs}')">Abrir</button>
          <button type="button" class="af-btn-mini af-btn-perigo" onclick="afExcluirAnalise('${chaveJs}')">Excluir</button>
        </div>
      </div>
    `;
  }).join('');
}

// --- CSV --------------------------------------------------------------------
function afBaixarCSV() {
  if (!afEstado) return;
  const inc = afLancamentosIncluidos();
  const cab = ['Data', 'Descricao', 'Cidade', 'Cartao', 'Titular', 'Categoria', 'Parcela', 'Recorrente', 'Valor'];
  const linhas = inc.map(l => [
    l.data,
    (l.descricao || '').replace(/;/g, ','),
    (l.cidade || '').replace(/;/g, ','),
    l.cartao || '',
    afPrimeiroNome(l.titular || '').replace(/;/g, ','),
    (AF_CATEGORIAS[l.categoria] || AF_CATEGORIAS.outro).nome,
    l.parcelaAtual && l.parcelaTotal ? `${l.parcelaAtual}/${l.parcelaTotal}` : '',
    l.recorrente ? 'Sim' : 'Nao',
    String(l.valor.toFixed(2)).replace('.', ',')
  ].join(';'));

  const total = inc.reduce((s, l) => s + l.valor, 0);
  linhas.push(['', '', '', '', '', 'TOTAL', '', '', String(total.toFixed(2)).replace('.', ',')].join(';'));

  const conteudo = '﻿' + cab.join(';') + '\n' + linhas.join('\n') + '\n';
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fatura-${(afEstado.banco || 'cartao').toLowerCase()}-${afEstado.competencia}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- lançar em Despesas Variáveis --------------------------------------------

// Identidade de um lançamento para deduplicar reimportações da mesma fatura.
function afHashLanc(l) {
  return [
    l.cartao || '',
    l.data || '',
    Number(l.valor || 0).toFixed(2),
    (l.descricao || '').toUpperCase().replace(/\s+/g, ' ').trim()
  ].join('|');
}

// "DD/MM" (sem ano) + competência da fatura -> data ISO "AAAA-MM-DD".
// Se o mês da compra for significativamente anterior ao da competência,
// é compra do ano anterior (ex.: compra de dezembro na fatura de janeiro).
function afDataISOde(l, comp) {
  const m = /^(\d{2})\/(\d{2})$/.exec(l.data || '');
  const c = /^(\d{4})-(\d{2})$/.exec(comp || '');
  if (!m || !c) return `${comp || afMesAtualISO()}-01`;
  let ano = parseInt(c[1], 10);
  const mesComp = parseInt(c[2], 10);
  const mesTransacao = parseInt(m[2], 10);
  // Só decrementar se mês anterior for muito distante (extrato multi-mês típico)
  // ou se for padrão dezembro -> janeiro
  if ((mesComp <= 3 && mesTransacao > 9) || (mesTransacao > mesComp + 2)) {
    ano -= 1;
  }
  return `${ano}-${m[2]}-${m[1]}`;
}

function afLancarEmDespesas() {
  if (!afEstado) return;
  if (typeof Store === 'undefined') {
    afMostrarMsg('Módulo de armazenamento não carregou. Recarregue a página.', 'erro');
    return;
  }

  const comp = document.getElementById('af-comp').value || afEstado.competencia;
  if (!/^\d{4}-\d{2}$/.test(comp)) {
    afMostrarMsg('Defina a competência (mês da fatura) antes de lançar.', 'erro');
    return;
  }

  const incluidos = afLancamentosIncluidos();
  if (!incluidos.length) {
    afMostrarMsg('Nenhum lançamento nos cartões selecionados para lançar.', 'erro');
    return;
  }

  const despesas = Store.ler(Store.CHAVES.DESPESAS_VARIAVEIS, []);
  const compras = Store.ler(Store.CHAVES.COMPRAS_PARCELADAS, []);
  let listaDespesas = Array.isArray(despesas) ? despesas : [];
  const listaCompras = Array.isArray(compras) ? compras : [];

  // A fatura pode já ter entrado nas despesas variáveis pela página Cartões
  // (linha única com o total, origem 'fatura-cartao'). Se lançarmos o
  // detalhamento por categoria por cima, o valor conta em dobro no saldo
  // projetado. Regra: o valor da fatura entra uma única vez.
  const finaisIncluidos = new Set(incluidos.map(l => l.cartao).filter(Boolean));
  const faturaJaLancadaPeloCartao = listaDespesas.filter(d =>
    d.origem === 'fatura-cartao'
    && (d.competencia === comp || String(d.origemFatura || '').endsWith('|' + comp))
    && (finaisIncluidos.size === 0 || !d.ultimosDígitos || finaisIncluidos.has(d.ultimosDígitos))
  );
  if (faturaJaLancadaPeloCartao.length) {
    const ok = confirm(
      'Esta fatura já está nas despesas variáveis como uma linha única, lançada pela página Cartões.\n\n'
      + 'Aqui o lançamento é só o detalhamento por categoria — se continuar sem remover a linha única, '
      + 'o valor da fatura conta em dobro no saldo projetado.\n\n'
      + 'OK = substituir a linha única pelo detalhamento por categoria.\n'
      + 'Cancelar = não lançar nada agora.'
    );
    if (!ok) {
      afMostrarMsg('Nada lançado. A fatura continua como linha única vinda da página Cartões.', 'ok');
      return;
    }
    const remover = new Set(faturaJaLancadaPeloCartao.map(d => d.id));
    listaDespesas = listaDespesas.filter(d => !remover.has(d.id));
  }

  const jaLancadas = new Set(
    listaDespesas.filter(d => d.origem === 'fatura' && d.origemHash).map(d => d.origemHash)
  );
  const jaParceladas = new Set(
    listaCompras.filter(c => c.origem === 'fatura' && c.origemHash).map(c => c.origemHash)
  );

  let nDespesas = 0;
  let nParcelas = 0;
  let nDuplicadas = 0;

  incluidos.forEach(l => {
    const hash = afHashLanc(l);
    const ehParcela = l.parcelaAtual && l.parcelaTotal && l.parcelaTotal > 1;

    if (ehParcela) {
      if (jaParceladas.has(hash)) { nDuplicadas++; return; }
      const inicio = typeof competenciaSomarMeses === 'function'
        ? competenciaSomarMeses(comp, -(l.parcelaAtual - 1))
        : comp;
      listaCompras.push({
        id: Date.now() + Math.random(),
        descricao: l.descricao + (l.cartao ? ` (final ${l.cartao})` : ''),
        cartao: l.cartao ? `Final ${l.cartao}` : 'Cartão de crédito',
        valorTotal: Math.round(l.valor * l.parcelaTotal * 100) / 100,
        numParcelas: l.parcelaTotal,
        dataInicio: inicio,
        origem: 'fatura',
        origemHash: hash,
        dataCriacao: new Date().toISOString()
      });
      jaParceladas.add(hash);
      nParcelas++;
    } else {
      if (jaLancadas.has(hash)) { nDuplicadas++; return; }
      listaDespesas.push({
        id: Date.now() + Math.random(),
        categoria: AF_PARA_CATEGORIA_DV[l.categoria] || 'outro',
        descricao: l.descricao + (l.cartao ? ` · final ${l.cartao}` : ''),
        valor: Math.round(l.valor * 100) / 100,
        data: afDataISOde(l, comp),
        competencia: comp,
        origem: 'fatura',
        origemHash: hash,
        dataCriacao: new Date().toISOString()
      });
      jaLancadas.add(hash);
      nDespesas++;
    }
  });

  // Grava também quando só removemos a linha única da fatura (substituição),
  // mesmo que nenhum lançamento novo por categoria tenha sido criado.
  if ((nDespesas || faturaJaLancadaPeloCartao.length) && !Store.gravar(Store.CHAVES.DESPESAS_VARIAVEIS, listaDespesas)) return;
  if (nParcelas && !Store.gravar(Store.CHAVES.COMPRAS_PARCELADAS, listaCompras)) return;

  if (!nDespesas && !nParcelas) {
    const extra = faturaJaLancadaPeloCartao.length
      ? ' A linha única da fatura vinda da página Cartões foi removida.'
      : '';
    afMostrarMsg('Tudo desta fatura já tinha sido lançado antes — nada novo a fazer.' + extra, 'ok');
    return;
  }

  const partes = [];
  if (nDespesas) partes.push(`${nDespesas} despesa${nDespesas === 1 ? '' : 's'} variáve${nDespesas === 1 ? 'l' : 'is'}`);
  if (nParcelas) partes.push(`${nParcelas} compra${nParcelas === 1 ? '' : 's'} parcelada${nParcelas === 1 ? '' : 's'}`);
  let msg = `Lançado: ${partes.join(' e ')} na competência ${afFormatarCompetencia(comp)}.`;
  if (nDuplicadas) msg += ` ${nDuplicadas} já existia${nDuplicadas === 1 ? '' : 'm'} e foi${nDuplicadas === 1 ? '' : 'ram'} ignorada${nDuplicadas === 1 ? '' : 's'}.`;
  if (faturaJaLancadaPeloCartao.length) msg += ' A linha única da fatura (vinda da página Cartões) foi substituída por este detalhamento.';
  afMostrarMsg(msg, 'ok');
}

// --- fluxo de importação ----------------------------------------------------

// Reconhece o emissor pelo texto da fatura. Retorna o value exato do <select id="af-banco">
// ou null quando não há marca clara (mantém o que o usuário escolheu).
function afDetectarBanco(texto) {
  const t = ' ' + String(texto || '').toLowerCase().replace(/\s+/g, ' ') + ' ';
  const regras = [
    ['Caixa', /cart(õ|o)es caixa|caixa econ(ô|o)mica/],
    ['Nubank', /nubank|nu pagamentos|nu financeira/],
    ['Inter', /banco inter|inter\.co|bancointer\.com/],
    ['Bradesco', /bradesco/],
    ['Itaú', /ita(ú|u) unibanco|ita(ú|u) uniclass|cart(ã|a)o ita(ú|u)| itau /],
    ['Santander', /santander/],
    ['Banco do Brasil', /banco do brasil|ourocard/]
  ];
  const achou = regras.find(([, re]) => re.test(t));
  return achou ? achou[0] : null;
}

function afProcessarTexto(texto) {
  const selBanco = document.getElementById('af-banco');
  const detectado = afDetectarBanco(texto);
  if (detectado && selBanco && Array.from(selBanco.options).some(o => o.value === detectado)) {
    selBanco.value = detectado;
  }
  const banco = selBanco ? selBanco.value : 'Outro';
  const parsed = afParsearFatura(texto);
  if (!parsed.lancamentos.length) {
    afMostrarMsg('Não consegui identificar lançamentos. Cole a seção "Lançamentos" da fatura (com data, descrição e valor em cada linha).', 'erro');
    return;
  }
  afEstado = afMontarEstado(banco, parsed);
  const nInternacionais = parsed.lancamentos.length;
  afMostrarMsg(`${nInternacionais} lançamento${nInternacionais === 1 ? '' : 's'} importado${nInternacionais === 1 ? '' : 's'}. Confira as categorias e os cartões abaixo.`, 'ok');
  afRenderResultado();
  document.getElementById('af-resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Competência (AAAA-MM) a partir do nome do arquivo, ex.: "Nubank_2026-09-06-categorizado.csv".
function afCompetenciaDoNome(nome) {
  const m = /(\d{4})-(\d{2})(?:-\d{2})?/.exec(String(nome || ''));
  return m ? `${m[1]}-${m[2]}` : null;
}

async function afProcessarCSV(file) {
  if (!file) return;
  if (!/\.csv$/i.test(file.name) && !/csv/i.test(file.type || '')) {
    afMostrarMsg('Envie um arquivo .csv.', 'erro');
    return;
  }
  afMostrarMsg('Lendo o CSV...', 'ok');
  try {
    const texto = await file.text();
    const parsed = afParsearCSV(texto);
    if (!parsed.lancamentos.length) {
      afMostrarMsg('Não achei lançamentos no CSV. Esperado o cabeçalho Data;Descricao;Cidade;Cartao;Categoria;Parcela;Recorrente;Valor.', 'erro');
      return;
    }

    // banco: usa o do nome do arquivo, se reconhecido; senão mantém o do seletor
    const selBanco = document.getElementById('af-banco');
    const nomeUp = file.name.toLowerCase();
    if (selBanco) {
      const achou = Array.from(selBanco.options).find(o => nomeUp.includes(o.value.toLowerCase()));
      if (achou) selBanco.value = achou.value;
    }
    const banco = selBanco ? selBanco.value : 'Outro';

    afEstado = afMontarEstado(banco, parsed, true);
    const comp = afCompetenciaDoNome(file.name);
    if (comp) afEstado.competencia = comp;

    const n = parsed.lancamentos.length;
    afMostrarMsg(`${n} lançamento${n === 1 ? '' : 's'} importado${n === 1 ? '' : 's'} do CSV. Confira as categorias e os cartões abaixo.`, 'ok');
    afRenderResultado();
    document.getElementById('af-resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    console.error(e);
    afMostrarMsg('Falha ao ler o CSV: ' + e.message, 'erro');
  }
}

async function afProcessarArquivo(file) {
  if (!file) return;
  if (!/pdf$/i.test(file.name) && file.type !== 'application/pdf') {
    afMostrarMsg('Envie um arquivo PDF.', 'erro');
    return;
  }
  afMostrarMsg('Lendo o PDF...', 'ok');
  try {
    const buffer = await file.arrayBuffer();
    const texto = await afExtrairTextoPDF(buffer);
    afProcessarTexto(texto);
    const ta = document.getElementById('af-texto');
    if (ta && !ta.value) ta.value = texto;
  } catch (e) {
    console.error(e);
    afMostrarMsg('Falha ao ler o PDF: ' + e.message, 'erro');
  }
}

// --- inicialização --------------------------------------------------------
function inicializarAnaliseFatura() {
  const upload = document.getElementById('af-upload');
  const inputArquivo = document.getElementById('af-arquivo');

  upload.addEventListener('click', () => inputArquivo.click());
  upload.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputArquivo.click();
    }
  });
  upload.addEventListener('dragover', (e) => {
    e.preventDefault();
    upload.classList.add('af-dragover');
  });
  upload.addEventListener('dragleave', () => upload.classList.remove('af-dragover'));
  upload.addEventListener('drop', (e) => {
    e.preventDefault();
    upload.classList.remove('af-dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      afProcessarArquivo(e.dataTransfer.files[0]);
    }
  });

  inputArquivo.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) afProcessarArquivo(e.target.files[0]);
  });

  const btnCSV = document.getElementById('af-importar-csv');
  const inputCSV = document.getElementById('af-arquivo-csv');
  if (btnCSV && inputCSV) {
    btnCSV.addEventListener('click', () => inputCSV.click());
    inputCSV.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) afProcessarCSV(e.target.files[0]);
      e.target.value = '';
    });
  }

  document.getElementById('af-analisar-texto').addEventListener('click', () => {
    const texto = document.getElementById('af-texto').value.trim();
    if (!texto) {
      afMostrarMsg('Cole o texto da fatura antes de analisar.', 'erro');
      return;
    }
    afProcessarTexto(texto);
  });

  document.getElementById('af-salvar').addEventListener('click', afSalvarAnalise);
  document.getElementById('af-csv').addEventListener('click', afBaixarCSV);
  const btnLancar = document.getElementById('af-lancar');
  if (btnLancar) btnLancar.addEventListener('click', afLancarEmDespesas);
  document.getElementById('af-comp').addEventListener('change', (e) => {
    if (afEstado) afEstado.competencia = e.target.value;
  });
  document.getElementById('af-banco').addEventListener('change', (e) => {
    if (afEstado) afEstado.banco = e.target.value;
  });
  const campoApelido = document.getElementById('af-apelido');
  if (campoApelido) {
    campoApelido.addEventListener('input', (e) => {
      if (afEstado) afEstado.apelido = e.target.value.trim();
    });
  }

  afRenderizarHistorico();

  // Deep-link vindo de "Meus Cartões": ?abrir=AAAA-MM|Banco (ou só AAAA-MM, links antigos).
  const abrir = new URLSearchParams(location.search).get('abrir');
  if (abrir) {
    const todas = afLerTodas();
    const existe = todas[abrir] ||
      Object.keys(todas).some(k => (todas[k].competencia || k.split('|')[0]) === abrir);
    if (existe) {
      afAbrirAnalise(abrir);
      history.replaceState(null, '', location.pathname);
    }
  }
}
