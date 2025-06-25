"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function debugPropertiesQuery() {
  const supabase = await createClient();
  const session = await getSession();
  
  const debugInfo = {
    session: {
      hasSession: !!session,
      hasOrganizationId: !!session?.organizationId,
      organizationId: session?.organizationId || "N/A",
      userId: session?.userId || "N/A",
      role: session?.role || "N/A"
    },
    database: {
      propertiesCount: 0,
      organizationPropertiesCount: 0,
      error: null as any,
      sampleData: null as any
    }
  };
  
  try {
    // 1. Contar todas as propriedades
    const { count: totalCount, error: countError } = await supabase
      .from("propriedades")
      .select("*", { count: "exact", head: true });
      
    if (countError) {
      debugInfo.database.error = countError;
    } else {
      debugInfo.database.propertiesCount = totalCount || 0;
    }
    
    // 2. Se tiver organizationId, contar propriedades da organização
    if (session?.organizationId) {
      const { count: orgCount, error: orgCountError } = await supabase
        .from("propriedades")
        .select("*", { count: "exact", head: true })
        .eq("organizacao_id", session.organizationId);
        
      if (!orgCountError) {
        debugInfo.database.organizationPropertiesCount = orgCount || 0;
      }
      
      // 3. Buscar uma amostra de dados
      const { data: sampleData, error: sampleError } = await supabase
        .from("propriedades")
        .select("id, nome, organizacao_id, tipo")
        .eq("organizacao_id", session.organizationId)
        .limit(3);
        
      if (!sampleError && sampleData) {
        debugInfo.database.sampleData = sampleData;
      }
    }
    
    // 4. Verificar se RLS está habilitado
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc("check_rls_enabled", { table_name: "propriedades" })
      .single();
      
    if (!rlsError && rlsCheck) {
      debugInfo.database.rlsEnabled = rlsCheck;
    }
    
  } catch (error) {
    debugInfo.database.error = error;
  }
  
  return debugInfo;
}

// Função RPC para verificar RLS (precisa ser criada no Supabase)
// Esta SQL precisa ser executada diretamente no Supabase
/*
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
RETURNS boolean AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = table_name;
  
  RETURN COALESCE(rls_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/