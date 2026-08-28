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
    .select('id, titulo, data, tipo, horario, author_id');

  if (error) {
    console.error('Erro ao buscar do banco:', error);
    return [];
  }

  return data.map(evento => {
    const inicio = evento.horario
      ? `${evento.data}T${evento.horario}`
      : evento.data;

    return {
      id: String(evento.id), // FullCalendar trabalha melhor com id em string
      title: evento.titulo,
      start: inicio,
      color: CORES_EVENTO[evento.tipo] || COR_PADRAO,
      extendedProps: {
        tipo: evento.tipo,
        data: evento.data,       // guardado cru, útil pra pré-preencher o form de edição
        horario: evento.horario,
        author_id: evento.author_id,
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

    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },

    // Conteúdo customizado: ícone + horário + título truncado + badge "Seu"
    eventContent: (arg) => {
      const { tipo, horario, author_id } = arg.event.extendedProps;

      const wrapper = document.createElement('div');
      wrapper.classList.add('evento-conteudo');

      const spanIcone = document.createElement('span');
      spanIcone.classList.add('evento-icone');
      spanIcone.innerText = ICONES_EVENTO[tipo] || ICONE_PADRAO;
      wrapper.appendChild(spanIcone);

      if (horario) {
        const spanHora = document.createElement('span');
        spanHora.classList.add('evento-horario');
        spanHora.innerText = horario.substring(0, 5);
        wrapper.appendChild(spanHora);
      }

      const spanTitulo = document.createElement('span');
      spanTitulo.classList.add('evento-titulo');
      spanTitulo.innerText = arg.event.title;
      wrapper.appendChild(spanTitulo);

      if (author_id && author_id === usuarioAtualId) {
        const badge = document.createElement('span');
        badge.classList.add('evento-badge-dono');
        badge.innerText = 'Seu';
        wrapper.appendChild(badge);
      }

      return { domNodes: [wrapper] };
    },

    // --------------------------------------------------------
    // CORREÇÃO DO BUG DE CORES: forçamos a cor diretamente no
    // elemento renderizado (style inline), o que tem prioridade
    // sobre qualquer CSS que estivesse "empatando" e fazendo só
    // o último evento parecer colorido.
    // --------------------------------------------------------
    eventDidMount: (info) => {
      const cor = info.event.backgroundColor || COR_PADRAO;
      info.el.style.backgroundColor = cor;
      info.el.style.borderColor = cor;
    },

    eventClick: (info) => abrirModalDetalhes(info.event),
  });

  calendar.render();
});

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

  // Não precisamos enviar author_id manualmente — a coluna tem
  // DEFAULT auth.uid(), o próprio Supabase preenche com base no
  // usuário autenticado que está fazendo a requisição.
  const { error } = await supabaseClient
    .from('eventos')
    .insert([{
      titulo: tituloDigitado,
      tipo: tipoSelecionado,
      data: dataDigitada,
      horario: horarioDigitado || null,
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
  const { tipo, horario, author_id } = evento.extendedProps;
  const souODono = author_id && author_id === usuarioAtualId;

  // Preenche o modo visualização
  document.getElementById('detalhes-titulo').innerText = evento.title;
  document.getElementById('detalhes-tipo').innerText = tipo.charAt(0).toUpperCase() + tipo.slice(1);
  document.getElementById('detalhes-data').innerText = evento.start.toLocaleDateString('pt-BR');

  const linhaHorario = document.getElementById('detalhes-horario-linha');
  if (horario) {
    linhaHorario.style.display = 'block';
    document.getElementById('detalhes-horario').innerText = horario.substring(0, 5);
  } else {
    linhaHorario.style.display = 'none';
  }

  // Botões de Editar/Excluir só aparecem pro dono do evento
  acoesDono.style.display = souODono ? 'flex' : 'none';

  // Sempre abre no modo visualização, mesmo que já tenha editado antes
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

  const { error } = await supabaseClient
    .from('eventos')
    .update({
      titulo: document.getElementById('editar-titulo').value,
      tipo: document.getElementById('editar-tipo').value,
      data: document.getElementById('editar-data').value,
      horario: document.getElementById('editar-horario').value || null,
    })
    .eq('id', eventoSelecionadoId); // a RLS também garante que só o autor consegue

  if (error) {
    alert("Erro ao editar: " + error.message);
    btnSalvar.innerText = "Salvar Alterações";
    btnSalvar.disabled = false;
  } else {
    // Recarregamos a página pra garantir que o calendário reflita
    // exatamente o estado atual do banco. Uma otimização futura
    // seria atualizar o evento em memória sem reload.
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
