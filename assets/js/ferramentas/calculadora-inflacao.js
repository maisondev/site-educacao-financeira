function calcularInflacao(event) {
  event.preventDefault();

  const valorPassadoInput = document.getElementById('valor-passado').value;
  const taxaInflacao = parseFloat(document.getElementById('taxa-inflacao').value);
  const anoInicial = parseInt(document.getElementById('ano-inicial').value);
  const anoFinal = parseInt(document.getElementById('ano-final').value);

  if (!valorPassadoInput || taxaInflacao < 0 || anoInicial >= anoFinal) {
    alert('Por favor, preencha todos os campos corretamente.');
    return;
  }

  const valorPassado = parseValorBrasileiro(valorPassadoInput);
  const anos = anoFinal - anoInicial;
  const taxaDecimal = taxaInflacao / 100;

  const valorAtual = valorPassado * Math.pow(1 + taxaDecimal, anos);

  const percentualPerdaPoder = ((valorPassado / valorAtual) * 100 - 100) * -1;

  const resultadoContainer = document.getElementById('resultado');
  const comparacaoContainer = document.getElementById('comparacao');
  const perdaContainer = document.getElementById('perda');

  document.getElementById('resultado-valor-passado').textContent =
    formatarMoedaBrasileira(valorPassado);

  document.getElementById('resultado-valor-atual').textContent =
    formatarMoedaBrasileira(valorAtual);

  document.getElementById('comp-valor-original').textContent =
    formatarMoedaBrasileira(valorPassado);

  document.getElementById('comp-valor-hoje').textContent =
    formatarMoedaBrasileira(valorAtual);

  document.getElementById('comp-ano-inicial').textContent = anoInicial;
  document.getElementById('comp-ano-final').textContent = anoFinal;

  const diferencaValor = valorAtual - valorPassado;

  document.getElementById('perda-texto').innerHTML =
    `<strong>${formatarMoedaBrasileira(valorPassado)} em ${anoInicial}</strong> ` +
    `precisaria valer <strong>${formatarMoedaBrasileira(valorAtual)}</strong> ` +
    `em ${anoFinal} para manter o mesmo poder de compra.`;

  document.getElementById('perda-percentual').textContent =
    percentualPerdaPoder.toFixed(2) + '% de perda de poder de compra';

  resultadoContainer.classList.add('ativo');
  comparacaoContainer.style.display = 'grid';
  perdaContainer.style.display = 'block';

  window.scrollTo({ top: resultadoContainer.offsetTop - 100, behavior: 'smooth' });
}
