"use server";

import { createClient } from "@/lib/supabase/server";

export interface Projection {
  id: string;
  nome: string;
  descricao?: string;
  organizacao_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectionsData {
  projections: Projection[];
  currentOrganizationId?: string;
}

export async function getProjectionsData(): Promise<ProjectionsData> {
  const supabase = await createClient();
  
  try {
    // Get current user to find organization
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { projections: [] };
    }

    // Get user's current organization
    let organizationId = user.user_metadata?.organizacao_atual;
    
    if (!organizationId) {
      // If no current organization, get first organization
      const { data: associations } = await supabase
        .from("associacoes")
        .select("organizacao_id")
        .eq("usuario_id", user.id)
        .limit(1);
      
      organizationId = associations?.[0]?.organizacao_id;
    }

    if (!organizationId) {
      return { projections: [] };
    }

    // Fetch projections for the organization
    const { data: projections, error } = await supabase
      .from("projections_scenarios")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar projeções:", error);
      throw error;
    }

    return {
      projections: projections || [],
      currentOrganizationId: organizationId
    };
  } catch (error) {
    console.error("Erro ao carregar dados de projeções:", error);
    return {
      projections: []
    };
  }
}