// Biblioteca de ícones do sistema.
// Padrão único: SVG de traço monocromático (24x24), stroke-width 2, currentColor.
// Uso em JS:   icone('calendario')  ->  string com <svg>
// Uso em HTML: <svg class="icone" ...>  copiando o mesmo traçado.

const ICONES = {
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  lapis: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  lixeira: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  prancheta: '<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>',
  sino: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lampada: '<path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A5 5 0 1 0 7.5 8a5 5 0 0 0 1.5 3.5c.76.76 1.23 1.52 1.41 2.5"/>',
  'seta-externa': '<path d="M7 17 17 7M8 7h9v9"/>',
};

// Retorna a string SVG de um ícone. tamanho em px (largura = altura).
function icone(nome, tamanho = 16) {
  const conteudo = ICONES[nome] || '';
  return `<svg class="icone" viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${conteudo}</svg>`;
}
