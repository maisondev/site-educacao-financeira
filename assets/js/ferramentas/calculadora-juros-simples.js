function calcularJuros(event) {
  event.preventDefault();

  let capital = parseValorBrasileiro(document.getElementById('capital').value);
  const taxa = parseFloat(document.getElementById('taxa').value) / 100;
  const tempo = parseFloat(document.getElementById('tempo').value);
  const periodo = document.getElementById('periodo').value;

  if (!capital || capital <= 0) {
    alert('Por favor, insira um capital válido');
    return;
  }

  if (!taxa || taxa < 0) {
    alert('Por favor, insira uma taxa válida');
    return;
  }

  if (!tempo || tempo <= 0) {
    alert('Por favor, insira um tempo válido');
    return;
  }

  if (!periodo) {
    alert('Por favor, selecione um período');
    return;
  }

  capital = Math.round(capital * 100) / 100;

  // Fórmula de juros simples: J = C × i × t
  const juros = capital * taxa * tempo;
  const montante = capital + juros;

  // Exibir resultados
  document.getElementById('resultado-capital').textContent = formatarMoedaBrasileira(capital);
  document.getElementById('resultado-taxa').textContent = (taxa * 100).toFixed(2) + '%';
  document.getElementById('resultado-juros').textContent = formatarMoedaBrasileira(juros);
  document.getElementById('resultado-montante').textContent = formatarMoedaBrasileira(montante);

  // Gerar tabela de progressão
  gerarTabelaProgressao(capital, taxa, tempo);

  // Mostrar resultado
  document.getElementById('resultado').classList.add('ativo');
}

function gerarTabelaProgressao(capital, taxa, tempo) {
  const corpoTabela = document.getElementById('corpo-tabela');
  corpoTabela.innerHTML = '';

  const tempoInt = Math.ceil(tempo);

  for (let t = 1; t <= tempoInt; t++) {
    const jurosAcumulados = capital * taxa * t;
    const montante = capital + jurosAcumulados;

    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${t}</td>
      <td>${formatarMoedaBrasileira(jurosAcumulados)}</td>
      <td>${formatarMoedaBrasileira(montante)}</td>
    `;

    corpoTabela.appendChild(linha);
  }

  // Adicionar linha final com tempo decimal se necessário
  if (tempo % 1 !== 0) {
    const jurosAcumulados = capital * taxa * tempo;
    const montante = capital + jurosAcumulados;

    const linha = document.createElement('tr');
    linha.style.fontWeight = 'bold';
    linha.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    linha.innerHTML = `
      <td>${tempo.toFixed(2)}</td>
      <td>${formatarMoedaBrasileira(jurosAcumulados)}</td>
      <td>${formatarMoedaBrasileira(montante)}</td>
    `;

    corpoTabela.appendChild(linha);
  }
}
