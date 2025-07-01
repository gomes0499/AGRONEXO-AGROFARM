"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ScenarioData {
  id?: string;
  organization_id: string;
  name: string;
  description?: string;
  is_baseline?: boolean;
  is_active?: boolean;
}

export interface HarvestScenarioData {
  id?: string;
  scenario_id: string;
  harvest_id: string;
  dollar_rate: number;
  area_multiplier: number;
  cost_multiplier: number;
  productivity_multiplier: number;
  notes?: string;
}

export async function createScenario(data: ScenarioData) {
  const supabase = await createClient();
  
  // Obter o usuário atual
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Usuário não autenticado" };
  }

  const { data: scenario, error } = await supabase
    .from("projection_scenarios")
    .insert({
      ...data,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar cenário:", error);
    return { error: "Erro ao criar cenário" };
  }

  revalidatePath("/dashboard");
  return { data: scenario };
}

export async function updateScenario(id: string, data: Partial<ScenarioData>) {
  const supabase = await createClient();

  const { data: scenario, error } = await supabase
    .from("projection_scenarios")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar cenário:", error);
    return { error: "Erro ao atualizar cenário" };
  }

  revalidatePath("/dashboard");
  return { data: scenario };
}

export async function deleteScenario(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projection_scenarios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar cenário:", error);
    return { error: "Erro ao deletar cenário" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getScenarios(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projection_scenarios")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar cenários:", error);
    return [];
  }

  return data || [];
}

export async function getScenarioById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projection_scenarios")
    .select(`
      *,
      harvest_data:projection_harvest_data(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar cenário:", error);
    return null;
  }

  return data;
}

export async function saveHarvestScenarioData(data: HarvestScenarioData) {
  const supabase = await createClient();

  // Tentar fazer upsert (insert ou update)
  const { data: result, error } = await supabase
    .from("projection_harvest_data")
    .upsert({
      ...data,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "scenario_id,harvest_id"
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar dados da safra:", error);
    return { error: "Erro ao salvar dados da safra" };
  }

  return { data: result };
}

export async function getHarvestScenarioData(scenarioId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projection_harvest_data")
    .select(`
      *,
      harvest:harvest_id(
        id,
        nome
      )
    `)
    .eq("scenario_id", scenarioId);

  if (error) {
    console.error("Erro ao buscar dados das safras:", error);
    return [];
  }

  return data || [];
}

export async function deleteHarvestScenarioData(scenarioId: string, harvestId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projection_harvest_data")
    .delete()
    .eq("scenario_id", scenarioId)
    .eq("harvest_id", harvestId);

  if (error) {
    console.error("Erro ao deletar dados da safra:", error);
    return { error: "Erro ao deletar dados da safra" };
  }

  return { success: true };
}