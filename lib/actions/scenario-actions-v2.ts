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
  dollar_rate_algodao?: number;
  dollar_rate_fechamento?: number;
  dollar_rate_soja?: number;
  notes?: string;
}

export interface CultureScenarioData {
  id?: string;
  scenario_id: string;
  harvest_id: string;
  culture_id: string;
  system_id: string;
  area_hectares: number;
  productivity: number;
  productivity_unit: string;
  production_cost_per_hectare: number;
  price_per_unit?: number;
}

// Funções existentes permanecem as mesmas
export async function createScenario(data: ScenarioData) {
  const supabase = await createClient();
  
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

  console.log("[getScenarios] Buscando cenários para organizationId:", organizationId);

  const { data, error } = await supabase
    .from("projection_scenarios")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar cenários:", error);
    return [];
  }

  console.log("[getScenarios] Cenários encontrados:", data?.length || 0);
  
  return data || [];
}

export async function getScenarioById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projection_scenarios")
    .select(`
      *,
      harvest_data:projection_harvest_data(*),
      culture_data:projection_culture_data(
        *,
        culture:culture_id(id, nome),
        system:system_id(id, nome)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar cenário:", error);
    return null;
  }

  return data;
}

// Nova função para salvar dados de safra (taxas de câmbio)
export async function saveHarvestDollarRate(data: HarvestScenarioData) {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("projection_harvest_data")
    .upsert({
      scenario_id: data.scenario_id,
      harvest_id: data.harvest_id,
      dollar_rate: data.dollar_rate,
      dollar_rate_algodao: data.dollar_rate_algodao,
      dollar_rate_fechamento: data.dollar_rate_fechamento,
      dollar_rate_soja: data.dollar_rate_soja,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "scenario_id,harvest_id"
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar taxa de dólar:", error);
    return { error: "Erro ao salvar taxa de dólar" };
  }

  return { data: result };
}

// Nova função para salvar dados de cultura
export async function saveCultureScenarioData(data: CultureScenarioData) {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("projection_culture_data")
    .upsert({
      ...data,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "scenario_id,harvest_id,culture_id,system_id"
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar dados da cultura:", error);
    return { error: "Erro ao salvar dados da cultura" };
  }

  return { data: result };
}

// Nova função para buscar dados de cultura por cenário
export async function getCultureScenarioData(scenarioId: string, harvestId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("projection_culture_data")
    .select(`
      *,
      culture:culture_id(id, nome),
      system:system_id(id, nome),
      harvest:harvest_id(id, nome)
    `)
    .eq("scenario_id", scenarioId);

  if (harvestId) {
    query = query.eq("harvest_id", harvestId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar dados das culturas:", error);
    return [];
  }

  return data || [];
}

// Nova função para deletar dados de cultura
export async function deleteCultureScenarioData(
  scenarioId: string, 
  harvestId: string, 
  cultureId: string,
  systemId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projection_culture_data")
    .delete()
    .eq("scenario_id", scenarioId)
    .eq("harvest_id", harvestId)
    .eq("culture_id", cultureId)
    .eq("system_id", systemId);

  if (error) {
    console.error("Erro ao deletar dados da cultura:", error);
    return { error: "Erro ao deletar dados da cultura" };
  }

  return { success: true };
}

// Função para buscar dados atuais de produção (para pré-popular formulário)
export async function getCurrentProductionData(
  organizationId: string,
  harvestId: string,
  cultureId: string,
  systemId: string
) {
  const supabase = await createClient();

  // Buscar área plantada
  const { data: areaData } = await supabase
    .from("areas_plantio")
    .select("areas_por_safra")
    .eq("organizacao_id", organizationId)
    .eq("cultura_id", cultureId)
    .eq("sistema_id", systemId)
    .single();

  // Buscar produtividade
  const { data: productivityData } = await supabase
    .from("produtividades")
    .select("produtividade, unidade")
    .eq("organizacao_id", organizationId)
    .eq("cultura_id", cultureId)
    .eq("sistema_id", systemId)
    .eq("safra_id", harvestId)
    .single();

  // Buscar custos de produção
  const { data: costData } = await supabase
    .from("custos_producao")
    .select("valor")
    .eq("organizacao_id", organizationId)
    .eq("cultura_id", cultureId)
    .eq("sistema_id", systemId)
    .eq("safra_id", harvestId);

  // Somar todos os custos
  const totalCost = costData?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;

  return {
    area_hectares: areaData?.areas_por_safra?.[harvestId] || 0,
    productivity: productivityData?.produtividade || 0,
    productivity_unit: productivityData?.unidade || "sc/ha",
    production_cost_per_hectare: totalCost,
  };
}