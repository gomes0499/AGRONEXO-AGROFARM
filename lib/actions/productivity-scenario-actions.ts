"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProductivityScenario {
  id: string;
  organizacao_id: string;
  nome: string;
  descricao?: string;
  cor: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductivityScenarioData {
  id?: string;
  scenario_id: string;
  produtividade_id: string;
  safra_id: string;
  produtividade: number;
  unidade: string;
}

// Get all productivity scenarios for an organization
export async function getProductivityScenarios(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("productivity_scenarios")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching productivity scenarios:", error);
    throw new Error("Falha ao buscar cenários de produtividade");
  }

  return data as ProductivityScenario[];
}

// Create a new productivity scenario
export async function createProductivityScenario(
  organizationId: string,
  data: {
    nome: string;
    descricao?: string;
    cor?: string;
  }
) {
  const supabase = await createClient();
  
  const { data: scenario, error } = await supabase
    .from("productivity_scenarios")
    .insert({
      organizacao_id: organizationId,
      nome: data.nome,
      descricao: data.descricao,
      cor: data.cor || '#6366f1'
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating productivity scenario:", error);
    throw new Error("Falha ao criar cenário de produtividade");
  }

  revalidatePath("/dashboard/production");
  return scenario as ProductivityScenario;
}

// Update a productivity scenario
export async function updateProductivityScenario(
  scenarioId: string,
  data: {
    nome?: string;
    descricao?: string;
    cor?: string;
    is_active?: boolean;
  }
) {
  const supabase = await createClient();
  
  const { data: scenario, error } = await supabase
    .from("productivity_scenarios")
    .update(data)
    .eq("id", scenarioId)
    .select()
    .single();

  if (error) {
    console.error("Error updating productivity scenario:", error);
    throw new Error("Falha ao atualizar cenário de produtividade");
  }

  revalidatePath("/dashboard/production");
  return scenario as ProductivityScenario;
}

// Delete a productivity scenario
export async function deleteProductivityScenario(scenarioId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("productivity_scenarios")
    .delete()
    .eq("id", scenarioId);

  if (error) {
    console.error("Error deleting productivity scenario:", error);
    throw new Error("Falha ao excluir cenário de produtividade");
  }

  revalidatePath("/dashboard/production");
}

// Get scenario data for a specific productivity
export async function getProductivityScenarioData(
  scenarioId: string,
  produtividadeId?: string
) {
  const supabase = await createClient();
  
  let query = supabase
    .from("productivity_scenario_data")
    .select("*")
    .eq("scenario_id", scenarioId);
    
  if (produtividadeId) {
    query = query.eq("produtividade_id", produtividadeId);
  }
  
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching scenario data:", error);
    throw new Error("Falha ao buscar dados do cenário");
  }

  return data as ProductivityScenarioData[];
}

// Save scenario data (bulk upsert)
export async function saveProductivityScenarioData(
  scenarioId: string,
  data: Array<{
    produtividade_id: string;
    safra_id: string;
    produtividade: number;
    unidade: string;
  }>
) {
  const supabase = await createClient();
  
  // Prepare data with scenario_id
  const dataToInsert = data.map(item => ({
    ...item,
    scenario_id: scenarioId
  }));
  
  const { error } = await supabase
    .from("productivity_scenario_data")
    .upsert(dataToInsert, {
      onConflict: "scenario_id,produtividade_id,safra_id"
    });

  if (error) {
    console.error("Error saving scenario data:", error);
    throw new Error("Falha ao salvar dados do cenário");
  }

  revalidatePath("/dashboard/production");
}

// Copy base data to a scenario
export async function copyBaseDataToScenario(
  scenarioId: string,
  produtividadeId: string,
  baseData: Record<string, { produtividade: number; unidade: string }>
) {
  const supabase = await createClient();
  
  // Prepare data for insertion
  const dataToInsert = Object.entries(baseData)
    .filter(([safraId, data]) => data.produtividade > 0)
    .map(([safraId, data]) => ({
      scenario_id: scenarioId,
      produtividade_id: produtividadeId,
      safra_id: safraId,
      produtividade: data.produtividade,
      unidade: data.unidade
    }));
  
  if (dataToInsert.length === 0) {
    return;
  }
  
  const { error } = await supabase
    .from("productivity_scenario_data")
    .upsert(dataToInsert, {
      onConflict: "scenario_id,produtividade_id,safra_id"
    });

  if (error) {
    console.error("Error copying base data to scenario:", error);
    throw new Error("Falha ao copiar dados base para o cenário");
  }

  revalidatePath("/dashboard/production");
}

// Get scenario data with productivity details
export async function getProductivityScenarioDataWithDetails(
  scenarioId: string,
  organizationId: string
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("productivity_scenario_data")
    .select(`
      *,
      produtividade:produtividade_id (
        id,
        cultura:cultura_id (id, nome),
        sistema:sistema_id (id, nome),
        propriedade:propriedade_id (id, nome)
      )
    `)
    .eq("scenario_id", scenarioId);

  if (error) {
    console.error("Error fetching scenario data with details:", error);
    throw new Error("Falha ao buscar dados detalhados do cenário");
  }

  return data;
}