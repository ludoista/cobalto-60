// ================================================================
// Referências centralizadas dos elementos da tela.
// Qualquer módulo que precise de um elemento importa daqui —
// evita repetir document.getElementById espalhado pelo código.
// ================================================================
export const modalEvento = document.getElementById('modal-evento');
export const modalLogin = document.getElementById('modal-login');
export const modalDetalhes = document.getElementById('modal-detalhes');
export const modalMaterias = document.getElementById('modal-materias');

export const btnNovoEvento = document.getElementById('btn-novo-evento');
export const btnLogin = document.getElementById('btn-login');
export const btnLogout = document.getElementById('btn-logout');
export const btnGerenciarMaterias = document.getElementById('btn-gerenciar-materias');

export const checkboxesFiltro = document.querySelectorAll('.chk-filtro');
export const inputBusca = document.getElementById('busca-evento');
export const filtroMateriasContainer = document.getElementById('filtro-materias');

export const painelVisualizacao = document.getElementById('detalhes-visualizacao');
export const formEdicao = document.getElementById('form-editar-evento');
export const acoesDono = document.getElementById('detalhes-acoes-dono');

export const eventoMateriasLista = document.getElementById('evento-materias-lista');
export const editarMateriasLista = document.getElementById('editar-materias-lista');
export const listaMateriasContainer = document.getElementById('lista-materias');
