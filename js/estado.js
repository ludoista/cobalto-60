// ================================================================
// Estado compartilhado entre módulos.
// Um objeto (em vez de "let" soltos) porque objetos mantêm a
// mesma referência quando importados em vários lugares — cada
// módulo enxerga as alterações feitas pelos outros.
// ================================================================
export const estado = {
  calendar: null,
  todosEventos: [],
  materias: [],
  // ids (string) das matérias marcadas no filtro + 'nenhuma' pra
  // representar eventos sem matéria associada.
  filtroMateriasAtivas: new Set(),
  usuarioAtualId: null,
  eventoSelecionadoId: null,
};
