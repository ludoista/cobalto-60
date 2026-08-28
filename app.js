// ================================================================
//  COBALTO-60 — app.js
// ================================================================

// ================================================================
// 1. CLIENTE SUPABASE
// ================================================================
const SUPABASE_URL = 'https://mwgbwaecjwsagpjuitto.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Mq3dxeNkWorLhriiZsSM3A_NczYc06Q';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ================================================================
// 2. MAPAS DE APARÊNCIA POR TIPO DE EVENTO
// ----------------------------------------------------------------
// Fonte única de verdade. Adicionar um tipo novo = adicionar uma
// linha em cada um destes dois objetos, nada mais.
// ================================================================
const CORES_EVENTO = {
  prova: '#ef4444',
  trabalho: '#2563eb',
  feriado: '#10b981',
  evento: '#8b5cf6',
};
const ICONES_EVENTO = {
  prova: '📝',
  trabalho: '📄',
  feriado: '🎉',
  evento: '📌',
};
const COR_PADRAO = '#64748b';
const ICONE_PADRAO = '📌';

// ================================================================
// 3. REFERÊNCIAS DOS ELEMENTOS DA TELA
// ================================================================
const modalEvento = document.getElementById('modal-evento');
const modalLogin = document.getElementById('modal-login');
const modalDetalhes = document.getElementById('modal-detalhes');
const btnNovoEvento = document.getElementById('btn-novo-evento');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const checkboxesFiltro = document.querySelectorAll('.chk-filtro');
const inputBusca = document.getElementById('busca-evento');

let calendar = null;
let todosEventos = [];
let usuarioAtualId = null;   // id do usuário logado (ou null se anônimo)
let eventoSelecionadoId = null; // id do evento aberto no modal de detalhes

// ================================================================
// 4. AUTENTICAÇÃO (SESSÃO E BOTÕES)
// ================================================================
async function verificarSessao() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const estaLogado = !!session;

  usuarioAtualId = session?.user?.id || null;

  btnLogin.style.display = estaLogado ? 'none' : 'inline-block';
  btnLogout.style.display = estaLogado ? 'inline-block' : 'none';
  btnNovoEvento.style.display = estaLogado ? 'inline-block' : 'none';
}

supabaseClient.auth.onAuthStateChange(() => verificarSessao());
verificarSessao();

btnLogin.onclick = () => modalLogin.style.display = 'block';
document.getElementById('btn-fechar-login').onclick = () => modalLogin.style.display = 'none';

document.getElementById('acao-entrar').onclick = async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-senha').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) alert("Erro ao entrar: " + error.message);
  else { modalLogin.style.display = 'none'; window.location.reload(); }
};

document.getElementById('acao-cadastrar').onclick = async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-senha').value;
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) alert("Erro ao criar conta: " + error.message);
  else { modalLogin.style.display = 'none'; window.location.reload(); }
};

btnLogout.onclick = async () => {
  await supabaseClient.auth.signOut();
  window.location.reload();
};

// ================================================================
// 5. BUSCAR EVENTOS E TRADUZIR PARA O FORMATO DO FULLCALENDAR
// ----------------------------------------------------------------
// IMPORTANTE: agora selecionamos também 'id' e 'author_id' —
// sem o 'id' não é possível editar/excluir um evento específico
// depois, e sem 'author_id' não dá pra saber quem pode editar.
// ================================================================
async function buscarEventos() {
  const { data, error } = await supabaseClient
    .from('eventos')
    .select('id, titulo, data, tipo, horario, autor_nome');

  if (error) {
    console.error('Erro ao buscar do banco:', error);
    alert('Não foi possível carregar os eventos. Veja o console para detalhes técnicos.');
    return [];
  }

  return data.map(evento => {
    const inicio = evento.horario
      ? `${evento.data}T${evento.horario}`
      : evento.data;

    return {
      id: String(evento.id),
      title: evento.titulo,
      start: inicio,
      color: CORES_EVENTO[evento.tipo] || COR_PADRAO,
      extendedProps: {
        tipo: evento.tipo,
        data: evento.data,
        horario: evento.horario,
        autor_nome: evento.autor_nome,
      },
    };
  });
}

// ================================================================
// 6. INICIALIZAÇÃO DO CALENDÁRIO
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
  const calendarEl = document.getElementById('calendar');

  todosEventos = await buscarEventos();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    height: 'auto',
    dayMaxEvents: true,
    moreLinkClick: 'popover',
    events: todosEventos,

    // Adiciona o botão de troca entre Mês e Ano na barra superior
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

    eventContent: (arg) => {
          const evento = arg.event;
          const tipo = evento.extendedProps.tipo || 'evento';
          const horario = evento.extendedProps.horario;

          // 1. Pega o ícone (badge) correspondente ao tipo
          const icone = ICONES_EVENTO[tipo] || ICONE_PADRAO;

          // 2. Formata o horário, se existir (corta os segundos)
          const htmlHorario = horario
            ? `<span style="font-weight: 700; margin-right: 5px;">${horario.substring(0,5)}</span>`
            : '';

          // 3. Monta o HTML interno do evento (Ícone + Horário + Título)
          const html = `
            <div style="display: flex; align-items: center; width: 100%; padding: 2px 4px; color: white; font-size: 0.85em; overflow: hidden; white-space: nowrap;">
              <span style="margin-right: 5px; font-size: 1.1em;">${icone}</span>
              ${htmlHorario}
              <span style="text-overflow: ellipsis; overflow: hidden;">${evento.title}</span>
            </div>
          `;

          return { html: html };
        },

    // --------------------------------------------------------
    // CORREÇÃO DO BUG DE CORES: forçamos a cor diretamente no
    // elemento renderizado (style inline).
    // --------------------------------------------------------
    eventDidMount: (info) => {
      const cor = info.event.backgroundColor || COR_PADRAO;
      info.el.style.backgroundColor = cor;
      info.el.style.borderColor = cor;
    },

    eventClick: (info) => abrirModalDetalhes(info.event),
  }); // <-- O calendário é fechado UMA ÚNICA VEZ aqui.

  calendar.render();
}); // <-- O evento de carregar a página é fechado aqui.

// ================================================================
// 7. FILTROS + BUSCA POR TEXTO (combinados)
// ================================================================
function aplicarFiltros() {
  const tiposAtivos = Array.from(checkboxesFiltro)
    .filter(chk => chk.checked)
    .map(chk => chk.dataset.tipo);

  const termoBusca = inputBusca.value.trim().toLowerCase();

  const eventosFiltrados = todosEventos.filter(ev => {
    const tipoOk = tiposAtivos.includes(ev.extendedProps.tipo);
    const buscaOk = !termoBusca || ev.title.toLowerCase().includes(termoBusca);
    return tipoOk && buscaOk;
  });

  calendar.removeAllEventSources();
  calendar.addEventSource(eventosFiltrados);
}

checkboxesFiltro.forEach(chk => chk.addEventListener('change', aplicarFiltros));

// Debounce simples: espera 300ms sem digitar antes de filtrar,
// evita recalcular a cada tecla pressionada.
let debounceBusca;
inputBusca.addEventListener('input', () => {
  clearTimeout(debounceBusca);
  debounceBusca = setTimeout(aplicarFiltros, 300);
});

// ================================================================
// 8. CRIAR NOVO EVENTO NO BANCO
// ================================================================
btnNovoEvento.onclick = () => modalEvento.style.display = 'block';
document.getElementById('btn-fechar-modal').onclick = () => modalEvento.style.display = 'none';

document.getElementById('form-novo-evento').addEventListener('submit', async (e) => {
  e.preventDefault();

  const tituloDigitado = document.getElementById('evento-titulo').value;
  const tipoSelecionado = document.getElementById('evento-tipo').value;
  const dataDigitada = document.getElementById('evento-data').value;
  const horarioDigitado = document.getElementById('evento-horario').value;

  const btnSubmit = e.target.querySelector('button[type="submit"]');
  btnSubmit.innerText = "Salvando...";
  btnSubmit.disabled = true;

  // Pega o usuário logado pra extrair o apelido (parte antes do @).
  // Ex: "joao.silva@inf.ufpel.edu.br" -> "joao.silva"
  const { data: { user } } = await supabaseClient.auth.getUser();
  const apelido = user?.email?.split('@')[0] || 'anônimo';

  const { error } = await supabaseClient
    .from('eventos')
    .insert([{
      titulo: tituloDigitado,
      tipo: tipoSelecionado,
      data: dataDigitada,
      horario: horarioDigitado || null,
      autor_nome: apelido,
    }]);

  if (error) {
    alert("Erro ao salvar: " + error.message);
    btnSubmit.innerText = "Salvar no Calendário";
    btnSubmit.disabled = false;
  } else {
    window.location.reload();
  }
});

// ================================================================
// 9. MODAL DE DETALHES — VISUALIZAR, EDITAR E EXCLUIR
// ================================================================
const painelVisualizacao = document.getElementById('detalhes-visualizacao');
const formEdicao = document.getElementById('form-editar-evento');
const acoesDono = document.getElementById('detalhes-acoes-dono');

function abrirModalDetalhes(evento) {
  eventoSelecionadoId = evento.id;
  const { tipo, horario, autor_nome } = evento.extendedProps;

  document.getElementById('detalhes-titulo').innerText = evento.title;
  document.getElementById('detalhes-tipo').innerText = tipo.charAt(0).toUpperCase() + tipo.slice(1);
  document.getElementById('detalhes-data').innerText = evento.start.toLocaleDateString('pt-BR');
  document.getElementById('detalhes-autor').innerText = autor_nome || 'anônimo';

  const linhaHorario = document.getElementById('detalhes-horario-linha');
  if (horario) {
    linhaHorario.style.display = 'block';
    document.getElementById('detalhes-horario').innerText = horario.substring(0, 5);
  } else {
    linhaHorario.style.display = 'none';
  }

  acoesDono.style.display = usuarioAtualId ? 'flex' : 'none';

  painelVisualizacao.style.display = 'block';
  formEdicao.style.display = 'none';

  modalDetalhes.style.display = 'block';
}

document.getElementById('btn-fechar-detalhes').onclick = () => {
  modalDetalhes.style.display = 'none';
};

// --- Entrar em modo de edição ---
document.getElementById('btn-editar-evento').onclick = () => {
  const evento = calendar.getEventById(eventoSelecionadoId);
  const { tipo, data, horario } = evento.extendedProps;

  document.getElementById('editar-titulo').value = evento.title;
  document.getElementById('editar-tipo').value = tipo;
  document.getElementById('editar-data').value = data;
  document.getElementById('editar-horario').value = horario ? horario.substring(0, 5) : '';

  painelVisualizacao.style.display = 'none';
  formEdicao.style.display = 'block';
};

document.getElementById('btn-cancelar-edicao').onclick = () => {
  formEdicao.style.display = 'none';
  painelVisualizacao.style.display = 'block';
};

// --- Salvar edição ---
formEdicao.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnSalvar = e.target.querySelector('button[type="submit"]');
  btnSalvar.innerText = "Salvando...";
  btnSalvar.disabled = true;

  const { data: { user } } = await supabaseClient.auth.getUser();
  const apelido = user?.email?.split('@')[0] || 'anônimo';

  const { error } = await supabaseClient
    .from('eventos')
    .update({
      titulo: document.getElementById('editar-titulo').value,
      tipo: document.getElementById('editar-tipo').value,
      data: document.getElementById('editar-data').value,
      horario: document.getElementById('editar-horario').value || null,
      autor_nome: apelido, // sobrescreve com quem editou por último
    })
    .eq('id', eventoSelecionadoId);

  if (error) {
    alert("Erro ao editar: " + error.message);
    btnSalvar.innerText = "Salvar Alterações";
    btnSalvar.disabled = false;
  } else {
    window.location.reload();
  }
});

// --- Excluir evento ---
document.getElementById('btn-excluir-evento').onclick = async () => {
  const confirmar = confirm("Tem certeza que deseja excluir este evento? Essa ação não pode ser desfeita.");
  if (!confirmar) return;

  const { error } = await supabaseClient
    .from('eventos')
    .delete()
    .eq('id', eventoSelecionadoId);

  if (error) {
    alert("Erro ao excluir: " + error.message);
  } else {
    window.location.reload();
  }
};

// ================================================================
// 10. UTILIDADES GERAIS
// ================================================================
window.onclick = (event) => {
  if (event.target == modalEvento) modalEvento.style.display = 'none';
  if (event.target == modalLogin) modalLogin.style.display = 'none';
  if (event.target == modalDetalhes) modalDetalhes.style.display = 'none';
};
