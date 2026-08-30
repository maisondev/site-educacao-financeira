// Funções para formatação de moeda brasileira

// Converter string em formato brasileiro para número
// "1.234,56" → 1234.56
// Aceita múltiplos formatos: "R$ 1.234,56", "1.234,56", "1234,56", "1234.56"
function parseValorBrasileiro(valor) {
  if (!valor) return 0;

  if (typeof valor === 'number') {
    return valor;
  }

  let limpo = valor.toString().trim();

  // Remover espaços
  limpo = limpo.replace(/\s/g, '');

  // Se começa com R$, remover
  limpo = limpo.replace(/^R\$\s*/, '');

  // Se contém vírgula, assume formato brasileiro (a vírgula é a casa decimal)
  if (limpo.includes(',')) {
    // Formato brasileiro: 1.234,56 ou 1234,56
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (limpo.includes('.')) {
    // Contém ponto mas não vírgula: determina se é separador de milhares ou decimal
    const partes = limpo.split('.');
    const digitsAposPonto = partes[partes.length - 1].length;

    // Se tem múltiplos pontos, assume: separadores de milhares + decimal (último ponto)
    // Se tem 1 ponto e 2-3 dígitos após: pode ser decimal (1234.56) ou separador (1.234)
    // Se tem 1 ponto e 4+ dígitos após: é separador de milhares (6.033.76 exportado como 6.03376)
    if (partes.length > 2 || digitsAposPonto > 3) {
      // Múltiplos pontos ou muitos dígitos após: assume separador de milhares
      limpo = limpo.replace(/\./g, '');
    } else if (partes.length === 2 && digitsAposPonto === 2) {
      // 1 ponto com 2 dígitos após: é decimal (1234.56)
      // Mantém como está
    } else if (partes.length === 2 && digitsAposPonto === 3) {
      // 1 ponto com 3 dígitos: ambíguo
      // Heurística: se primeira parte tem >3 chars, é separador de milhares; senão, é decimal
      if (partes[0].length > 3) {
        // Tipo 1.234 (separador) → remove ponto
        limpo = limpo.replace(/\./g, '');
      }
      // Senão mantém (tipo 12.345 como decimal, que é raro mas possível)
    }
  }

  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : numero;
}

// Formatar número para moeda brasileira
// 1234.56 → "R$ 1.234,56"
function formatarMoedaBrasileira(valor) {
  if (!valor && valor !== 0) return 'R$ 0,00';

  const numero = typeof valor === 'string' ? parseValorBrasileiro(valor) : valor;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
}

// Formatar apenas o número com pontos e vírgulas (sem R$)
// 1234.56 → "1.234,56"
function formatarNumeroBrasileiro(valor) {
  if (!valor && valor !== 0) return '0,00';

  const numero = typeof valor === 'string' ? parseValorBrasileiro(valor) : valor;

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
}

// Configurar input para aceitar entrada em formato brasileiro
function configurarInputMoedaBrasileira(elementoId) {
  const input = document.getElementById(elementoId);
  if (!input) return;

  // Permitir digitação com vírgula e ponto
  input.addEventListener('blur', function() {
    const valor = parseValorBrasileiro(this.value);
    if (valor > 0) {
      this.value = valor; // Armazena como número puro
    }
  });

  // Mostrar hint de formatação
  input.addEventListener('focus', function() {
    if (!this.placeholder) {
      this.placeholder = 'Ex: 1.000,00 ou 1000,00';
    }
  });
}

// Aplicar formatação a múltiplos inputs de uma vez
function configurarInputsMoedaBrasileira(seletores) {
  if (typeof seletores === 'string') {
    configurarInputMoedaBrasileira(seletores);
  } else if (Array.isArray(seletores)) {
    seletores.forEach(id => configurarInputMoedaBrasileira(id));
  }
}

// Aplicar máscara enquanto digita (em tempo real)
function aplicarMascaraMoedaBrasileira(input) {
  input.addEventListener('input', function() {
    let valor = this.value.replace(/\D/g, ''); // Remove tudo que não é número

    if (valor.length === 0) {
      this.value = '';
      return;
    }

    // Garantir 2 casas decimais
    if (valor.length === 1) {
      valor = '0.0' + valor;
    } else if (valor.length === 2) {
      valor = '0.' + valor;
    } else {
      valor = valor.slice(0, -2) + '.' + valor.slice(-2);
    }

    const numero = parseFloat(valor);
    this.value = formatarNumeroBrasileiro(numero);
  });
}

// Configurar todos os inputs de moeda da página automaticamente
function configurarTodosCamposMoeda() {
  // Campos de moeda são type="text" (a máscara insere "." e "," que type="number" rejeita)
  const inputs = document.querySelectorAll('input[data-moeda]');
  inputs.forEach(input => {
    aplicarMascaraMoedaBrasileira(input);
  });
}
