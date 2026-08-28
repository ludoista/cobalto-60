// ================================================================
// Ponto de entrada — importa os módulos e liga tudo.
// Se um dia precisar entender o fluxo geral do app, comece aqui.
// ================================================================
import { modalEvento, modalLogin, modalDetalhes, modalMaterias } from './dom.js';
import { estado } from './estado.js';
import { iniciarAuth } from './auth.js';
import { buscarEventos } from './eventosApi.js';
import { buscarMaterias } from './materiasApi.js';
import { inicializarCalendario } from './calendario.js';
import { iniciarFiltros, renderizarFiltroMaterias } from './filtros.js';
import { iniciarModalNovoEvento } from './modalNovoEvento.js';
import { abrirModalDetalhes, iniciarModalDetalhes } from './modalDetalhes.js';
import { iniciarModalMaterias } from './modalMaterias.js';

iniciarAuth();
iniciarFiltros();
iniciarModalNovoEvento();
iniciarModalDetalhes();
iniciarModalMaterias();

document.addEventListener('DOMContentLoaded', async () => {
  const calendarEl = document.getElementById('calendar');

  // Matérias carregam antes dos eventos: o filtro e os formulários
  // de evento dependem da lista já estar pronta.
  estado.materias = await buscarMaterias();
  renderizarFiltroMaterias();

  estado.todosEventos = await buscarEventos();
  estado.calendar = inicializarCalendario(calendarEl, estado.todosEventos, abrirModalDetalhes);
});

// Fecha qualquer modal aberto ao clicar fora do conteúdo.
window.onclick = (event) => {
  if (event.target == modalEvento) modalEvento.style.display = 'none';
  if (event.target == modalLogin) modalLogin.style.display = 'none';
  if (event.target == modalDetalhes) modalDetalhes.style.display = 'none';
  if (event.target == modalMaterias) modalMaterias.style.display = 'none';
};
