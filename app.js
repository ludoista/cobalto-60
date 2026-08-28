// ================================================================
//  COBALTO-60 — app.js
//  Calendário acadêmico comunitário (UFPel)
//
//  Este arquivo é dividido em seções numeradas. Se você é um novo
//  contribuidor: leia na ordem, cada seção assume que a anterior
//  já rodou (ex: a seção 4 depende do cliente criado na seção 1).
// ================================================================

// ================================================================
// 1. CLIENTE SUPABASE
// ----------------------------------------------------------------
// `supabaseClient` é a NOSSA conexão com o projeto (não confundir
// com `window.supabase`, que é apenas a biblioteca/namespace global
// injetada pelo <script> do CDN).
// ================================================================
const SUPABASE_URL = 'https://mwgbwaecjwsagpjuitto.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Mq3dxeNkWorLhriiZsSM3A_NczYc06Q';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ================================================================
// 2. MAPA DE CORES POR TIPO DE EVENTO
// ----------------------------------------------------------------
// Fonte única de verdade para as cores. Se um novo "tipo" for
// criado no banco (ex: 'plantão'), basta adicionar uma linha aqui
// — nenhuma outra parte do código precisa mudar.
// ================================================================
const CORES_EVENTO = {
  prova: '#ef4444',    // vermelho — mesmo tom de --perigo no CSS
  trabalho: '#2563eb', // azul — mesmo tom de --cobalto no CSS
  feriado: '#10b981',  // verde — mesmo tom de --sucesso no CSS
};
const COR_PADRAO = '#64748b'; // cinza, usado se o tipo vier vazio/desconhecido

// ================================================================
// 3. REFERÊNCIAS DOS ELEMENTOS DA TELA
// ================================================================
const modalEvento = document.getElementById('modal-evento');
const modalLogin = document.getElementById('modal-login');
const btnNovoEvento = document.getElementById('btn-novo-evento');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const botoesFiltro = document.querySelectorAll('.btn-filtro');

// Estado em memória do calendário — preenchidos nas seções 5 e 6.
// Guardar isso globalmente evita ter que reconsultar o Supabase
// toda vez que o usuário clica num filtro.
let calendar = null;
let todosEventos = [];

// ================================================================
// 4. AUTENTICAÇÃO (SESSÃO E BOTÕES)
// ================================================================
async function verificarSessao() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const estaLogado = !!session;

  btnLogin.style.display = estaLogado ? 'none' : 'inline-block';
  btnLogout.style.display = estaLogado ? 'inline-block' : 'none';
  btnNovoEvento.style.display = estaLogado ? 'inline-block' : 'none';
}

// Reage automaticamente a login/logout (inclusive em outras abas)
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
// ================================================================
async function buscarEventos() {
  const { data, error } = await supabaseClient
    .from('eventos')
    .select('titulo, data, tipo, horario');

  if (error) {
    console.error('Erro ao buscar do banco:', error);
    return [];
  }

  return data.map(evento => {
    const inicio = evento.horario
      ? `${evento.data}T${evento.horario}`
      : evento.data;

    return {
      title: evento.titulo,
      start: inicio,
      color: CORES_EVENTO[evento.tipo] || COR_PADRAO,
      extendedProps: {
        tipo: evento.tipo,
        horario: evento.horario, // guardamos cru pra exibir no modal de detalhes
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

    // Formato da hora exibida (24h, sem "am/pm")
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },

    // --------------------------------------------------------
    // eventContent: substitui o HTML padrão do evento por um
    // customizado, que trunca o título com "..." em vez de
    // simplesmente deformar a caixinha ou cortar sem aviso.
    // --------------------------------------------------------
    eventContent: (arg) => {
      const horario = arg.event.extendedProps.horario;

      const wrapper = document.createElement('div');
      wrapper.classList.add('evento-conteudo');

      if (horario) {
        const spanHora = document.createElement('span');
        spanHora.classList.add('evento-horario');
        spanHora.innerText = horario.substring(0, 5); // "14:30:00" -> "14:30"
        wrapper.appendChild(spanHora);
      }

      const spanTitulo = document.createElement('span');
      spanTitulo.classList.add('evento-titulo');
      spanTitulo.innerText = arg.event.title;
      wrapper.appendChild(spanTitulo);

      return { domNodes: [wrapper] };
    },

    // --------------------------------------------------------
    // eventClick: abre o modal de detalhes com os dados do
    // evento clicado. Antes disso não existia handler nenhum,
    // por isso o clique não fazia nada.
    // --------------------------------------------------------
    eventClick: (info) => {
      abrirModalDetalhes(info.event);
    },
  });

  calendar.render();
  renderizarLegenda();
});

// ================================================================
// 6.5 MODAL DE DETALHES DO EVENTO
// ================================================================
const modalDetalhes = document.getElementById('modal-detalhes');

function abrirModalDetalhes(evento) {
  const { tipo, horario } = evento.extendedProps;

  document.getElementById('detalhes-titulo').innerText = evento.title;
  document.getElementById('detalhes-tipo').innerText =
    tipo.charAt(0).toUpperCase() + tipo.slice(1); // "prova" -> "Prova"
  document.getElementById('detalhes-data').innerText =
    evento.start.toLocaleDateString('pt-BR');

  const linhaHorario = document.getElementById('detalhes-horario-linha');
  if (horario) {
    linhaHorario.style.display = 'block';
    document.getElementById('detalhes-horario').innerText = horario.substring(0, 5);
  } else {
    linhaHorario.style.display = 'none';
  }

  modalDetalhes.style.display = 'block';
}

document.getElementById('btn-fechar-detalhes').onclick = () => {
  modalDetalhes.style.display = 'none';
};

// ================================================================
// 6.7 LEGENDA DE CORES
// ----------------------------------------------------------------
// Gerada dinamicamente a partir de CORES_EVENTO (seção 2), então
// se um tipo novo for adicionado ali, a legenda se atualiza sozinha.
// ================================================================
function renderizarLegenda() {
  const container = document.createElement('section');
  container.classList.add('legenda-container');

  const rotulos = { prova: 'Prova', trabalho: 'Trabalho', feriado: 'Feriado' };

  Object.entries(CORES_EVENTO).forEach(([tipo, cor]) => {
    const item = document.createElement('span');
    item.classList.add('legenda-item');
    item.innerHTML = `<span class="dot" style="background-color:${cor}"></span> ${rotulos[tipo] || tipo}`;
    container.appendChild(item);
  });

  // Insere a legenda logo antes dos filtros
  document.querySelector('.filtros-container').before(container);
}

// ================================================================
// 7. FILTROS INTERATIVOS (multi-seleção via checkbox)
// ----------------------------------------------------------------
// Lê todos os checkboxes marcados no momento e filtra os eventos
// que tenham `tipo` presente nessa lista. Se nenhum checkbox está
// marcado, o calendário simplesmente fica vazio (comportamento
// esperado, não é um bug).
// ================================================================
const checkboxesFiltro = document.querySelectorAll('.chk-filtro');

function aplicarFiltros() {
  const tiposAtivos = Array.from(checkboxesFiltro)
    .filter(chk => chk.checked)
    .map(chk => chk.dataset.tipo);

  const eventosFiltrados = todosEventos.filter(ev =>
    tiposAtivos.includes(ev.extendedProps.tipo)
  );

  calendar.removeAllEventSources();
  calendar.addEventSource(eventosFiltrados);
}

checkboxesFiltro.forEach(chk => {
  chk.addEventListener('change', aplicarFiltros);
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
  const horarioDigitado = document.getElementById('evento-horario').value; // pode vir vazio

  const btnSubmit = e.target.querySelector('button[type="submit"]');
  btnSubmit.innerText = "Salvando...";
  btnSubmit.disabled = true;

  const { error } = await supabaseClient
    .from('eventos')
    .insert([{
      titulo: tituloDigitado,
      tipo: tipoSelecionado,
      data: dataDigitada,
      // Campo 'time' no Postgres aceita NULL — se o campo ficou
      // vazio no form, mandamos null em vez de string vazia.
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
// 9. UTILIDADES GERAIS
// ================================================================
window.onclick = (event) => {
  if (event.target == modalEvento) modalEvento.style.display = 'none';
  if (event.target == modalLogin) modalLogin.style.display = 'none';
};
