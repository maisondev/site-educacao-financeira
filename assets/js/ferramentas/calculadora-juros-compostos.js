document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('form-juros-compostos');
  if (!form) return;

  // Carregar renda salva e pré-preencher aporte mensal
  carregarRendaSalva();

  // Atualizar taxa mensal equivalente quando taxa anual muda
  const inputTaxaAnual = document.getElementById('taxa-anual');
  if (inputTaxaAnual) {
    inputTaxaAnual.addEventListener('input', atualizarTaxaMensalEquivalente);
    atualizarTaxaMensalEquivalente();
  }

  // Atualizar período em meses quando anos muda
  const inputPeriodoAnos = document.getElementById('periodo-anos');
  if (inputPeriodoAnos) {
    inputPeriodoAnos.addEventListener('input', atualizarPeriodoEmMeses);
    atualizarPeriodoEmMeses();
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const valorInicial = parseFloat(document.getElementById('valor-inicial').value) || 0;
    let aporteMensal = parseFloat(document.getElementById('aporte-mensal').value);

    // Se não inseriu aporte, usar 20% da renda salva
    if (isNaN(aporteMensal) || aporteMensal === '') {
      const rendaSalva = parseFloat(localStorage.getItem('renda_mensal') || '0');
      aporteMensal = (rendaSalva * 0.20);
    }

    // Converter taxa anual para mensal
    const taxaAnual = (parseFloat(document.getElementById('taxa-anual').value) || 0) / 100;
    const taxaMensal = Math.pow(1 + taxaAnual, 1/12) - 1;

    // Converter anos para meses
    const anos = parseFloat(document.getElementById('periodo-anos').value) || 0;
    const meses = Math.round(anos * 12);

    if (meses <= 0) {
      alert('Por favor, insira um período válido (maiores que 0)');
      return;
    }

    let montante = valorInicial;
    let totalAportado = valorInicial;

    for (let mes = 1; mes <= meses; mes++) {
      montante = montante * (1 + taxaMensal) + aporteMensal;
      totalAportado += aporteMensal;
    }

    const jurosGanhos = montante - totalAportado;

    document.getElementById('resultado-montante').textContent = formatarMoeda(montante);
    document.getElementById('resultado-aportado').textContent = formatarMoeda(totalAportado);
    document.getElementById('resultado-juros').textContent = formatarMoeda(jurosGanhos);

    document.getElementById('resultado-calculadora').hidden = false;
  });

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function carregarRendaSalva() {
    const rendaSalva = parseFloat(localStorage.getItem('renda_mensal') || '0');
    const inputAporte = document.getElementById('aporte-mensal');

    if (rendaSalva > 0) {
      const aportePadrao = (rendaSalva * 0.20).toFixed(2);
      inputAporte.placeholder = `Sugestão: R$ ${parseFloat(aportePadrao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }
  }

  function atualizarTaxaMensalEquivalente() {
    const taxaAnual = (parseFloat(document.getElementById('taxa-anual').value) || 0) / 100;
    const taxaMensal = Math.pow(1 + taxaAnual, 1/12) - 1;
    const taxaMensalPercentual = (taxaMensal * 100).toFixed(2);

    const elementoExibicao = document.getElementById('taxa-mensal-equivalente');
    if (elementoExibicao) {
      elementoExibicao.textContent = taxaMensalPercentual + '%';
    }
  }

  function atualizarPeriodoEmMeses() {
    const anos = parseFloat(document.getElementById('periodo-anos').value) || 0;
    const meses = Math.round(anos * 12);

    const elementoExibicao = document.getElementById('periodo-meses-equivalente');
    if (elementoExibicao) {
      elementoExibicao.textContent = meses + ' meses';
    }
  }
});
