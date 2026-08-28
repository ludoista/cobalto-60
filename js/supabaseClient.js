// ================================================================
// Cliente Supabase — única fonte de conexão com o banco.
// ================================================================
const SUPABASE_URL = 'https://mwgbwaecjwsagpjuitto.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Mq3dxeNkWorLhriiZsSM3A_NczYc06Q';

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
