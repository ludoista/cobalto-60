// ================================================================
// Toda a comunicação com "eventos" (e seus vínculos com matérias)
// no Supabase vive aqui. Os outros módulos não sabem que o banco
// existe — só chamam estas funções.
// ================================================================
import { supabaseClient } from './supabaseClient.js';
import { CORES_EVENTO, COR_PADRAO } from './constantes.js';

// Busca todos os eventos, já com as matérias vinculadas, e traduz
// para o formato do FullCalendar.
export async function buscarEventos() {
  const { data, error } = await supabaseClient
    .from('eventos')
    .select(`
      id, titulo, data, tipo, horario, autor_nome, lugar,
      evento_materias ( materias ( id, nome, cor ) )
    `);

  if (error) {
    console.error('Erro ao buscar do banco:', error);
    alert('Não foi possível carregar os eventos. Veja o console para detalhes técnicos.');
    return [];
  }

  return data.map(evento => {
    const inicio = evento.horario
      ? `${evento.data}T${evento.horario}`
      : evento.data;

    const materias = (evento.evento_materias || [])
      .map(vinculo => vinculo.materias)
      .filter(Boolean);

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
        lugar: evento.lugar,
        materias,
      },
    };
  });
}

export async function criarEvento(dados, materiaIds = []) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const apelido = user?.email?.split('@')[0] || 'anônimo';

  const { data: eventoCriado, error } = await supabaseClient
    .from('eventos')
    .insert([{ ...dados, autor_nome: apelido }])
    .select('id')
    .single();

  if (error) return { error };
  return vincularMaterias(eventoCriado.id, materiaIds);
}

export async function atualizarEvento(id, dados, materiaIds = []) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const apelido = user?.email?.split('@')[0] || 'anônimo';

  const { error } = await supabaseClient
    .from('eventos')
    .update({ ...dados, autor_nome: apelido })
    .eq('id', id);

  if (error) return { error };

  // Substitui os vínculos existentes pelos novos — mais simples
  // que calcular a diferença entre a lista antiga e a nova.
  await supabaseClient.from('evento_materias').delete().eq('evento_id', id);
  return vincularMaterias(id, materiaIds);
}

async function vincularMaterias(eventoId, materiaIds) {
  if (materiaIds.length === 0) return { error: null };

  const linhas = materiaIds.map(materiaId => ({ evento_id: eventoId, materia_id: materiaId }));
  const { error } = await supabaseClient.from('evento_materias').insert(linhas);
  return { error };
}

export async function excluirEvento(id) {
  return supabaseClient.from('eventos').delete().eq('id', id);
}
