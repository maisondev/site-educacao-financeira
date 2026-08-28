const dadosPicpayAgosto2026 = {
  "cartoes_picpay": [
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Marden Souza",
      "ultimos_digitos": "0051",
      "fatura_agosto_2026": 100.00,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    },
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Raissa Prestes",
      "ultimos_digitos": "0085",
      "fatura_agosto_2026": 140.00,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    },
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Monica Souza",
      "ultimos_digitos": "0093",
      "fatura_agosto_2026": 190.21,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    },
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Maison M M Galvao Do",
      "ultimos_digitos": "8026",
      "fatura_agosto_2026": 118.52,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    },
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Socorro Galvao",
      "ultimos_digitos": "8034",
      "fatura_agosto_2026": 538.98,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    },
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Marden Souza",
      "ultimos_digitos": "8042",
      "fatura_agosto_2026": 2891.62,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    },
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Raissa Prestes",
      "ultimos_digitos": "8075",
      "fatura_agosto_2026": 462.46,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    },
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Monica Souza",
      "ultimos_digitos": "8083",
      "fatura_agosto_2026": 593.45,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    },
    {
      "nome": "PicPay Mastercard BLACK",
      "titular": "Maison Galvao",
      "ultimos_digitos": "8091",
      "fatura_agosto_2026": 7.95,
      "bandeira": "Mastercard",
      "vencimento": "10/08/2026"
    }
  ],
  "resumo": {
    "mes": "agosto/2026",
    "total_fatura": 5043.19,
    "quantidade_cartoes": 9,
    "data_vencimento": "10/08/2026"
  }
};

function auto_importarCartoesPicpay() {
  const cartoes = JSON.parse(localStorage.getItem('cartoes') || '[]');
  const jáImportados = cartoes.some(c => c.nome?.includes('PicPay'));

  if (!jáImportados && window.importarCartoesPicpay) {
    window.importarCartoesPicpay(dadosPicpayAgosto2026);
    console.log('✓ Cartões Picpay importados automaticamente');
  }
}

document.addEventListener('DOMContentLoaded', auto_importarCartoesPicpay);
