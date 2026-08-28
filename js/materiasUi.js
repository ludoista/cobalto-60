// ================================================================
// UI reaproveitada por quem lida com matérias: os formulários de
// evento (escolher matérias) e o modal de gerenciamento.
// ================================================================
import { estado } from './estado.js';

// Preenche um container com checkboxes de matéria.
// idsMarcados: array de ids (number) que devem vir pré-marcados.
export function renderizarChecklistMaterias(container, idsMarcados = []) {
  container.innerHTML = '';

  if (estado.materias.length === 0) {
    container.innerHTML = '<p class="materias-vazio">Nenhuma matéria cadastrada ainda. Use o botão "📚 Matérias" pra criar uma.</p>';
    return;
  }

  estado.materias.forEach(materia => {
    const marcado = idsMarcados.includes(materia.id);

    const label = document.createElement('label');
    label.className = 'materia-checkbox';
    label.innerHTML = `
      <input type="checkbox" value="${materia.id}" ${marcado ? 'checked' : ''}>
      <span class="dot" style="background-color:${materia.cor}"></span> ${materia.nome}
    `;
    container.appendChild(label);
  });
}

// Lê quais matérias estão marcadas num container preenchido acima.
export function lerMateriasSelecionadas(container) {
  return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
    .map(chk => Number(chk.value));
}
