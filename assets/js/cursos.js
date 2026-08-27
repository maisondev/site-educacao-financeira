const CHAVE_CURSOS = 'cursos_lista';

let filtroAtualCursos = 'todos';

function obterCursos() {
  try {
    const dados = localStorage.getItem(CHAVE_CURSOS);
    return dados ? JSON.parse(dados) : [];
  } catch (erro) {
    console.error('Erro ao carregar cursos:', erro);
    return [];
  }
}

function salvarCursos(cursos) {
  localStorage.setItem(CHAVE_CURSOS, JSON.stringify(cursos));
}

function adicionarCurso() {
  const titulo = document.getElementById('input-curso-titulo').value.trim();
  const instituicao = document.getElementById('input-curso-instituicao').value.trim();
  const link = document.getElementById('input-curso-link').value.trim();
  const status = document.getElementById('select-curso-status').value;

  if (!titulo) {
    alert('Por favor, insira o nome do curso');
    return;
  }

  const cursos = obterCursos();
  cursos.push({
    id: Date.now(),
    titulo,
    instituicao,
    link,
    status,
    dataCriacao: new Date().toISOString()
  });

  salvarCursos(cursos);

  document.getElementById('input-curso-titulo').value = '';
  document.getElementById('input-curso-instituicao').value = '';
  document.getElementById('input-curso-link').value = '';
  document.getElementById('select-curso-status').value = 'pendente';

  renderizarCursos();
}

function alternarConclusao(id) {
  const cursos = obterCursos();
  const curso = cursos.find(c => c.id === id);
  if (!curso) return;

  curso.status = curso.status === 'concluido' ? 'pendente' : 'concluido';
  salvarCursos(cursos);
  renderizarCursos();
}

function removerCurso(id) {
  if (!confirm('Tem certeza que deseja remover este curso?')) return;
  const cursos = obterCursos().filter(c => c.id !== id);
  salvarCursos(cursos);
  renderizarCursos();
}

function filtrarCursos(filtro) {
  filtroAtualCursos = filtro;
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.toggle('ativo', btn.dataset.filtro === filtro);
  });
  renderizarCursos();
}

function rotuloStatus(status) {
  const rotulos = {
    pendente: 'Quero fazer',
    andamento: 'Em andamento',
    concluido: 'Concluído'
  };
  return rotulos[status] || status;
}

function renderizarCursos() {
  const cursos = obterCursos();
  const lista = document.getElementById('lista-cursos');

  document.getElementById('resumo-total').textContent = cursos.length;
  document.getElementById('resumo-concluidos').textContent = cursos.filter(c => c.status === 'concluido').length;
  document.getElementById('resumo-pendentes').textContent = cursos.filter(c => c.status !== 'concluido').length;

  const filtrados = filtroAtualCursos === 'todos'
    ? cursos
    : cursos.filter(c => c.status === filtroAtualCursos);

  if (filtrados.length === 0) {
    lista.innerHTML = `<div class="lista-vazia"><p>Nenhum curso encontrado. Adicione o primeiro acima!</p></div>`;
    return;
  }

  lista.innerHTML = filtrados.map(curso => `
    <div class="item-curso ${curso.status === 'concluido' ? 'concluido' : ''}">
      <input type="checkbox" ${curso.status === 'concluido' ? 'checked' : ''} onchange="alternarConclusao(${curso.id})">
      <div class="item-curso-info">
        <div class="item-curso-titulo">${escaparHtml(curso.titulo)}</div>
        <div class="item-curso-meta">
          ${curso.instituicao ? escaparHtml(curso.instituicao) + ' &middot; ' : ''}${rotuloStatus(curso.status)}
          ${curso.link ? ' &middot; <a class="item-curso-link" href="' + escaparHtml(curso.link) + '" target="_blank" rel="noopener noreferrer">Acessar curso</a>' : ''}
        </div>
      </div>
      <button type="button" class="btn-remover-curso" onclick="removerCurso(${curso.id})" title="Remover curso">&times;</button>
    </div>
  `).join('');
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', renderizarCursos);
