// ================================================================
// Modal "Gerenciar Matérias" — cadastrar, renomear e excluir as
// matérias/cadeiras usadas para marcar os eventos.
// ================================================================
import { modalMaterias, btnGerenciarMaterias, listaMateriasContainer } from './dom.js';
import { estado } from './estado.js';
import { buscarMaterias, criarMateria, atualizarMateria, excluirMateria } from './materiasApi.js';
import { renderizarFiltroMaterias } from './filtros.js';

async function recarregarMaterias() {
  estado.materias = await buscarMaterias();
  renderizarListaMaterias();
  renderizarFiltroMaterias();
}

function renderizarListaMaterias() {
  listaMateriasContainer.innerHTML = '';

  if (estado.materias.length === 0) {
    listaMateriasContainer.innerHTML = '<li class="materias-vazio">Nenhuma matéria cadastrada ainda.</li>';
    return;
  }

  estado.materias.forEach(materia => {
    const li = document.createElement('li');
    li.className = 'item-materia';
    li.innerHTML = `
      <span class="dot" style="background-color:${materia.cor}"></span>
      <span class="item-materia-nome">${materia.nome}</span>
      <button type="button" class="btn-icone btn-editar-materia" title="Renomear">✏️</button>
      <button type="button" class="btn-icone btn-excluir-materia" title="Excluir">🗑️</button>
    `;

    li.querySelector('.btn-editar-materia').onclick = async () => {
      const novoNome = prompt('Novo nome da matéria:', materia.nome);
      if (!novoNome || novoNome.trim() === '' || novoNome === materia.nome) return;

      const { error } = await atualizarMateria(materia.id, novoNome.trim(), materia.cor);
      if (error) alert("Erro ao renomear: " + error.message);
      else await recarregarMaterias();
    };

    li.querySelector('.btn-excluir-materia').onclick = async () => {
      const confirmar = confirm(`Excluir a matéria "${materia.nome}"? Ela será removida de todos os eventos vinculados a ela.`);
      if (!confirmar) return;

      const { error } = await excluirMateria(materia.id);
      if (error) alert("Erro ao excluir: " + error.message);
      else await recarregarMaterias();
    };

    listaMateriasContainer.appendChild(li);
  });
}

export function iniciarModalMaterias() {
  btnGerenciarMaterias.onclick = () => {
    modalMaterias.style.display = 'block';
    renderizarListaMaterias();
  };

  document.getElementById('btn-fechar-materias').onclick = () => modalMaterias.style.display = 'none';

  document.getElementById('form-nova-materia').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nomeInput = document.getElementById('materia-nome');
    const corInput = document.getElementById('materia-cor');

    const { error } = await criarMateria(nomeInput.value.trim(), corInput.value);

    if (error) {
      alert("Erro ao adicionar matéria: " + error.message);
    } else {
      nomeInput.value = '';
      await recarregarMaterias();
    }
  });
}
