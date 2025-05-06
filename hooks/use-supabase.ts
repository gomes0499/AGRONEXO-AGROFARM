import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/supabase';

/**
 * Hook para utilizar o cliente Supabase em componentes React no lado do cliente
 * Inicializa o cliente apenas uma vez e o mantém até o componente ser desmontado
 */
export function useSupabase(): SupabaseClient<Database> {
  const [supabase] = useState(() => createClient());

  return supabase;
}