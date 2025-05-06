import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase';


// Supabase URL e anon key são definidas em variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Verificação para garantir que as variáveis foram definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key devem ser definidas nas variáveis de ambiente.');
}

// Exporta a função para criar cliente Supabase com tipagem correta
export const createSupabaseClient = () => 
  createClient<Database>(supabaseUrl, supabaseAnonKey);