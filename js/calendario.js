// ================================================================
// Inicialização e renderização do FullCalendar.
// ================================================================
import { ICONES_EVENTO, ICONE_PADRAO, COR_PADRAO } from './constantes.js';

// Cria e devolve a instância do FullCalendar já configurada.
// onEventoClicado é chamado quando o usuário clica em um evento.
export function inicializarCalendario(elemento, eventosIniciais, onEventoClicado) {
  const calendar = new FullCalendar.Calendar(elemento, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    height: 'auto',
    dayMaxEvents: true,
    moreLinkClick: 'popover',
    events: eventosIniciais,

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,multiMonthYear',
    },

    views: {
      multiMonthYear: {
        multiMonthMaxColumns: 2,
        multiMonthMinWidth: 300, // reduz o mínimo por mês, permite 2 colunas em telas mais estreitas
      },
    },

    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },

    eventContent: (arg) => ({ html: montarHtmlEvento(arg.event) }),

    // Correção do bug de cores: força a cor diretamente no elemento renderizado.
    eventDidMount: (info) => {
      const cor = info.event.backgroundColor || COR_PADRAO;
      info.el.style.backgroundColor = cor;
      info.el.style.borderColor = cor;
    },

    eventClick: (info) => onEventoClicado(info.event),
  });

  calendar.render();
  return calendar;
}

function montarHtmlEvento(evento) {
  const tipo = evento.extendedProps.tipo || 'evento';
  const horario = evento.extendedProps.horario;

  const icone = ICONES_EVENTO[tipo] || ICONE_PADRAO;
  const htmlHorario = horario
    ? `<span style="font-weight: 700; margin-right: 5px;">${horario.substring(0, 5)}</span>`
    : '';

  return `
    <div style="display: flex; align-items: center; width: 100%; padding: 2px 4px; color: white; font-size: 0.85em; overflow: hidden; white-space: nowrap;">
      <span style="margin-right: 5px; font-size: 1.1em;">${icone}</span>
      ${htmlHorario}
      <span style="text-overflow: ellipsis; overflow: hidden;">${evento.title}</span>
    </div>
  `;
}
