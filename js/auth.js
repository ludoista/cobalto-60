// ================================================================
// Autenticação: sessão do usuário e os botões que dependem dela.
// ================================================================
import { supabaseClient } from './supabaseClient.js';
import { modalLogin, btnLogin, btnLogout, btnNovoEvento, btnGerenciarMaterias } from './dom.js';
import { estado } from './estado.js';

export async function verificarSessao() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const estaLogado = !!session;

  estado.usuarioAtualId = session?.user?.id || null;

  btnLogin.style.display = estaLogado ? 'none' : 'inline-block';
  btnLogout.style.display = estaLogado ? 'inline-block' : 'none';
  btnNovoEvento.style.display = estaLogado ? 'inline-block' : 'none';
  btnGerenciarMaterias.style.display = estaLogado ? 'inline-block' : 'none';
}

export function iniciarAuth() {
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
}
