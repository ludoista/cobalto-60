// ================================================================
// CRUD da tabela "materias" no Supabase.
// ================================================================
import { supabaseClient } from './supabaseClient.js';

export async function buscarMaterias() {
  const { data, error } = await supabaseClient
    .from('materias')
    .select('id, nome, cor')
    .order('nome');

  if (error) {
    console.error('Erro ao buscar matérias:', error);
    return [];
  }
  return data;
}

export async function criarMateria(nome, cor) {
  return supabaseClient.from('materias').insert([{ nome, cor }]);
}

export async function atualizarMateria(id, nome, cor) {
  return supabaseClient.from('materias').update({ nome, cor }).eq('id', id);
}

export async function excluirMateria(id) {
  return supabaseClient.from('materias').delete().eq('id', id);
}
