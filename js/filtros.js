// ================================================================
// Filtros por tipo + matéria + busca por texto (todos combinados).
// ================================================================
import { checkboxesFiltro, inputBusca, filtroMateriasContainer } from './dom.js';
import { estado } from './estado.js';

export function aplicarFiltros() {
  const tiposAtivos = Array.from(checkboxesFiltro)
    .filter(chk => chk.checked)
    .map(chk => chk.dataset.tipo);

  const termoBusca = inputBusca.value.trim().toLowerCase();

  const eventosFiltrados = estado.todosEventos.filter(ev => {
    const tipoOk = tiposAtivos.includes(ev.extendedProps.tipo);
    const buscaOk = !termoBusca || ev.title.toLowerCase().includes(termoBusca);
    return tipoOk && buscaOk && passaFiltroMateria(ev);
  });

  estado.calendar.removeAllEventSources();
  estado.calendar.addEventSource(eventosFiltrados);
}

function passaFiltroMateria(evento) {
  const materiasDoEvento = evento.extendedProps.materias || [];

  // Evento sem nenhuma matéria vinculada só aparece se a pill
  // "Sem matéria" estiver marcada.
  if (materiasDoEvento.length === 0) {
    return estado.filtroMateriasAtivas.has('nenhuma');
  }

  return materiasDoEvento.some(materia => estado.filtroMateriasAtivas.has(String(materia.id)));
}

// Gera as pills de matéria dinamicamente — não dá pra escrever
// isso direto no HTML porque a lista de matérias vem do banco.
// Chamado no carregamento inicial e sempre que uma matéria é
// criada/renomeada/excluída no modal de gerenciamento.
export function renderizarFiltroMaterias() {
  filtroMateriasContainer.innerHTML = '';

  const opcoes = [
    { id: 'nenhuma', nome: 'Sem matéria', cor: '#94a3b8' },
    ...estado.materias.map(m => ({ id: String(m.id), nome: m.nome, cor: m.cor })),
  ];

  opcoes.forEach(opcao => {
    if (!estado.filtroMateriasAtivas.has(opcao.id)) {
      estado.filtroMateriasAtivas.add(opcao.id); // pills novas começam marcadas
    }

    const label = document.createElement('label');
    label.className = 'filtro-pill';
    label.innerHTML = `
      <input type="checkbox" data-materia-id="${opcao.id}" checked>
      <span class="dot" style="background-color:${opcao.cor}"></span> ${opcao.nome}
    `;

    const checkbox = label.querySelector('input');
    checkbox.checked = estado.filtroMateriasAtivas.has(opcao.id);
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) estado.filtroMateriasAtivas.add(opcao.id);
      else estado.filtroMateriasAtivas.delete(opcao.id);
      aplicarFiltros();
    });

    filtroMateriasContainer.appendChild(label);
  });
}

export function iniciarFiltros() {
  checkboxesFiltro.forEach(chk => chk.addEventListener('change', aplicarFiltros));

  // Debounce simples: espera 300ms sem digitar antes de filtrar.
  let debounceBusca;
  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceBusca);
    debounceBusca = setTimeout(aplicarFiltros, 300);
  });
}
