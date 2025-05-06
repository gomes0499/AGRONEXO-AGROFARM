"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  Culture, CultureFormValues,
  System, SystemFormValues,
  Cycle, CycleFormValues,
  Harvest, HarvestFormValues,
  PlantingArea, PlantingAreaFormValues,
  Productivity, ProductivityFormValues,
  ProductionCost, ProductionCostFormValues,
  Livestock, LivestockFormValues,
  LivestockOperation, LivestockOperationFormValues
} from "@/schemas/production";
import { revalidatePath } from "next/cache";

// ==========================================
// Funções para Culturas (Cultures)
// ==========================================

export async function getCultures(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("culturas")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome");
  
  if (error) {
    console.error("Erro ao buscar culturas:", error);
    throw new Error("Não foi possível carregar as culturas");
  }
  
  return data as Culture[];
}

export async function getCultureById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("culturas")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar cultura:", error);
    throw new Error("Não foi possível carregar os detalhes da cultura");
  }
  
  return data as Culture;
}

export async function createCulture(
  organizationId: string, 
  values: CultureFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("culturas")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar cultura:", error);
    throw new Error("Não foi possível criar a cultura");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return data as Culture;
}

export async function updateCulture(
  id: string, 
  values: CultureFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("culturas")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar cultura:", error);
    throw new Error("Não foi possível atualizar a cultura");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return data as Culture;
}

export async function deleteCulture(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("culturas")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir cultura:", error);
    throw new Error("Não foi possível excluir a cultura");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return true;
}

// ==========================================
// Funções para Sistemas (Systems)
// ==========================================

export async function getSystems(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sistemas")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome");
  
  if (error) {
    console.error("Erro ao buscar sistemas:", error);
    throw new Error("Não foi possível carregar os sistemas");
  }
  
  return data as System[];
}

export async function getSystemById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sistemas")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar sistema:", error);
    throw new Error("Não foi possível carregar os detalhes do sistema");
  }
  
  return data as System;
}

export async function createSystem(
  organizationId: string, 
  values: SystemFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sistemas")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar sistema:", error);
    throw new Error("Não foi possível criar o sistema");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return data as System;
}

export async function updateSystem(
  id: string, 
  values: SystemFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sistemas")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar sistema:", error);
    throw new Error("Não foi possível atualizar o sistema");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return data as System;
}

export async function deleteSystem(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("sistemas")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir sistema:", error);
    throw new Error("Não foi possível excluir o sistema");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return true;
}

// ==========================================
// Funções para Ciclos (Cycles)
// ==========================================

export async function getCycles(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("ciclos")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome");
  
  if (error) {
    console.error("Erro ao buscar ciclos:", error);
    throw new Error("Não foi possível carregar os ciclos");
  }
  
  return data as Cycle[];
}

export async function getCycleById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("ciclos")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar ciclo:", error);
    throw new Error("Não foi possível carregar os detalhes do ciclo");
  }
  
  return data as Cycle;
}

export async function createCycle(
  organizationId: string, 
  values: CycleFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("ciclos")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar ciclo:", error);
    throw new Error("Não foi possível criar o ciclo");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return data as Cycle;
}

export async function updateCycle(
  id: string, 
  values: CycleFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("ciclos")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar ciclo:", error);
    throw new Error("Não foi possível atualizar o ciclo");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return data as Cycle;
}

export async function deleteCycle(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("ciclos")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir ciclo:", error);
    throw new Error("Não foi possível excluir o ciclo");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return true;
}

// ==========================================
// Funções para Safras (Harvests)
// ==========================================

export async function getHarvests(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio", { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar safras:", error);
    throw new Error("Não foi possível carregar as safras");
  }
  
  return data as Harvest[];
}

export async function getHarvestById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar safra:", error);
    throw new Error("Não foi possível carregar os detalhes da safra");
  }
  
  return data as Harvest;
}

export async function createHarvest(
  organizationId: string, 
  values: HarvestFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar safra:", error);
    throw new Error("Não foi possível criar a safra");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return data as Harvest;
}

export async function updateHarvest(
  id: string, 
  values: HarvestFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar safra:", error);
    throw new Error("Não foi possível atualizar a safra");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return data as Harvest;
}

export async function deleteHarvest(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("safras")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir safra:", error);
    throw new Error("Não foi possível excluir a safra");
  }
  
  revalidatePath("/dashboard/production/config");
  
  return true;
}

// ==========================================
// Funções para Áreas de Plantio (Planting Areas)
// ==========================================

export async function getPlantingAreas(organizationId: string, filters?: {
  propertyId?: string;
  harvestId?: string;
  cultureId?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from("areas_plantio")
    .select(`
      *,
      propriedades:propriedade_id(nome),
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      ciclos:ciclo_id(nome),
      safras:safra_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (filters?.propertyId) {
    query = query.eq("propriedade_id", filters.propertyId);
  }
  
  if (filters?.harvestId) {
    query = query.eq("safra_id", filters.harvestId);
  }
  
  if (filters?.cultureId) {
    query = query.eq("cultura_id", filters.cultureId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar áreas de plantio:", error);
    throw new Error("Não foi possível carregar as áreas de plantio");
  }
  
  return data;
}

export async function getPlantingAreaById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("areas_plantio")
    .select(`
      *,
      propriedades:propriedade_id(nome),
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      ciclos:ciclo_id(nome),
      safras:safra_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar área de plantio:", error);
    throw new Error("Não foi possível carregar os detalhes da área de plantio");
  }
  
  return data;
}

export async function createPlantingArea(
  organizationId: string, 
  values: PlantingAreaFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("areas_plantio")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar área de plantio:", error);
    throw new Error("Não foi possível criar a área de plantio");
  }
  
  revalidatePath("/dashboard/production/planting-areas");
  
  return data as PlantingArea;
}

export async function updatePlantingArea(
  id: string, 
  values: PlantingAreaFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("areas_plantio")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar área de plantio:", error);
    throw new Error("Não foi possível atualizar a área de plantio");
  }
  
  revalidatePath("/dashboard/production/planting-areas");
  
  return data as PlantingArea;
}

export async function deletePlantingArea(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("areas_plantio")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir área de plantio:", error);
    throw new Error("Não foi possível excluir a área de plantio");
  }
  
  revalidatePath("/dashboard/production/planting-areas");
  
  return true;
}

// ==========================================
// Funções para Produtividade (Productivity)
// ==========================================

export async function getProductivities(organizationId: string, filters?: {
  harvestId?: string;
  cultureId?: string;
  systemId?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from("produtividades")
    .select(`
      *,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      safras:safra_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (filters?.harvestId) {
    query = query.eq("safra_id", filters.harvestId);
  }
  
  if (filters?.cultureId) {
    query = query.eq("cultura_id", filters.cultureId);
  }
  
  if (filters?.systemId) {
    query = query.eq("sistema_id", filters.systemId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar produtividades:", error);
    throw new Error("Não foi possível carregar as produtividades");
  }
  
  return data;
}

export async function getProductivityById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("produtividades")
    .select(`
      *,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      safras:safra_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar produtividade:", error);
    throw new Error("Não foi possível carregar os detalhes da produtividade");
  }
  
  return data;
}

export async function createProductivity(
  organizationId: string, 
  values: ProductivityFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("produtividades")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar produtividade:", error);
    throw new Error("Não foi possível criar a produtividade");
  }
  
  revalidatePath("/dashboard/production/productivity");
  
  return data as Productivity;
}

export async function updateProductivity(
  id: string, 
  values: ProductivityFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("produtividades")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar produtividade:", error);
    throw new Error("Não foi possível atualizar a produtividade");
  }
  
  revalidatePath("/dashboard/production/productivity");
  
  return data as Productivity;
}

export async function deleteProductivity(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("produtividades")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir produtividade:", error);
    throw new Error("Não foi possível excluir a produtividade");
  }
  
  revalidatePath("/dashboard/production/productivity");
  
  return true;
}

// ==========================================
// Funções para Custos de Produção (Production Costs)
// ==========================================

export async function getProductionCosts(organizationId: string, filters?: {
  harvestId?: string;
  cultureId?: string;
  systemId?: string;
  category?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from("custos_producao")
    .select(`
      *,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      safras:safra_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (filters?.harvestId) {
    query = query.eq("safra_id", filters.harvestId);
  }
  
  if (filters?.cultureId) {
    query = query.eq("cultura_id", filters.cultureId);
  }
  
  if (filters?.systemId) {
    query = query.eq("sistema_id", filters.systemId);
  }
  
  if (filters?.category) {
    query = query.eq("categoria", filters.category);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar custos de produção:", error);
    throw new Error("Não foi possível carregar os custos de produção");
  }
  
  return data;
}

export async function getProductionCostById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("custos_producao")
    .select(`
      *,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      safras:safra_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar custo de produção:", error);
    throw new Error("Não foi possível carregar os detalhes do custo de produção");
  }
  
  return data;
}

export async function createProductionCost(
  organizationId: string, 
  values: ProductionCostFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("custos_producao")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar custo de produção:", error);
    throw new Error("Não foi possível criar o custo de produção");
  }
  
  revalidatePath("/dashboard/production/costs");
  
  return data as ProductionCost;
}

export async function updateProductionCost(
  id: string, 
  values: ProductionCostFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("custos_producao")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar custo de produção:", error);
    throw new Error("Não foi possível atualizar o custo de produção");
  }
  
  revalidatePath("/dashboard/production/costs");
  
  return data as ProductionCost;
}

export async function deleteProductionCost(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("custos_producao")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir custo de produção:", error);
    throw new Error("Não foi possível excluir o custo de produção");
  }
  
  revalidatePath("/dashboard/production/costs");
  
  return true;
}

// ==========================================
// Funções para Rebanho (Livestock)
// ==========================================

export async function getLivestock(organizationId: string, propertyId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("rebanhos")
    .select(`
      *,
      propriedades:propriedade_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (propertyId) {
    query = query.eq("propriedade_id", propertyId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar rebanho:", error);
    throw new Error("Não foi possível carregar o rebanho");
  }
  
  return data;
}

export async function getLivestockById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rebanhos")
    .select(`
      *,
      propriedades:propriedade_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar rebanho:", error);
    throw new Error("Não foi possível carregar os detalhes do rebanho");
  }
  
  return data;
}

export async function createLivestock(
  organizationId: string, 
  values: LivestockFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rebanhos")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar rebanho:", error);
    throw new Error("Não foi possível criar o rebanho");
  }
  
  revalidatePath("/dashboard/production/livestock");
  
  return data as Livestock;
}

export async function updateLivestock(
  id: string, 
  values: LivestockFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rebanhos")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar rebanho:", error);
    throw new Error("Não foi possível atualizar o rebanho");
  }
  
  revalidatePath("/dashboard/production/livestock");
  
  return data as Livestock;
}

export async function deleteLivestock(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("rebanhos")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir rebanho:", error);
    throw new Error("Não foi possível excluir o rebanho");
  }
  
  revalidatePath("/dashboard/production/livestock");
  
  return true;
}

// ==========================================
// Funções para Operações Pecuárias (Livestock Operations)
// ==========================================

export async function getLivestockOperations(organizationId: string, propertyId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("operacoes_pecuarias")
    .select(`
      *,
      propriedades:propriedade_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (propertyId) {
    query = query.eq("propriedade_id", propertyId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar operações pecuárias:", error);
    throw new Error("Não foi possível carregar as operações pecuárias");
  }
  
  return data;
}

export async function getLivestockOperationById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("operacoes_pecuarias")
    .select(`
      *,
      propriedades:propriedade_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar operação pecuária:", error);
    throw new Error("Não foi possível carregar os detalhes da operação pecuária");
  }
  
  return data;
}

export async function createLivestockOperation(
  organizationId: string, 
  values: LivestockOperationFormValues
) {
  const supabase = await createClient();
  
  const volume = typeof values.volume_abate_por_safra === 'string' 
    ? JSON.parse(values.volume_abate_por_safra) 
    : values.volume_abate_por_safra;
  
  const { data, error } = await supabase
    .from("operacoes_pecuarias")
    .insert({
      organizacao_id: organizationId,
      ...values,
      volume_abate_por_safra: volume
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar operação pecuária:", error);
    throw new Error("Não foi possível criar a operação pecuária");
  }
  
  revalidatePath("/dashboard/production/livestock-operations");
  
  return data as LivestockOperation;
}

export async function updateLivestockOperation(
  id: string, 
  values: LivestockOperationFormValues
) {
  const supabase = await createClient();
  
  const volume = typeof values.volume_abate_por_safra === 'string' 
    ? JSON.parse(values.volume_abate_por_safra) 
    : values.volume_abate_por_safra;
  
  const { data, error } = await supabase
    .from("operacoes_pecuarias")
    .update({
      ...values,
      volume_abate_por_safra: volume
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar operação pecuária:", error);
    throw new Error("Não foi possível atualizar a operação pecuária");
  }
  
  revalidatePath("/dashboard/production/livestock-operations");
  
  return data as LivestockOperation;
}

export async function deleteLivestockOperation(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("operacoes_pecuarias")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir operação pecuária:", error);
    throw new Error("Não foi possível excluir a operação pecuária");
  }
  
  revalidatePath("/dashboard/production/livestock-operations");
  
  return true;
}

// ==========================================
// Funções para cálculo de métricas e estatísticas
// ==========================================

export async function getProductionStats(organizationId: string, harvestId?: string) {
  const supabase = await createClient();

  // Busca todas as áreas de plantio
  let areasQuery = supabase
    .from("areas_plantio")
    .select(`
      *,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      ciclos:ciclo_id(nome),
      safras:safra_id(nome, ano_inicio, ano_fim)
    `)
    .eq("organizacao_id", organizationId);
  
  if (harvestId) {
    areasQuery = areasQuery.eq("safra_id", harvestId);
  }
  
  const { data: plantingAreas, error: areasError } = await areasQuery;
  
  if (areasError) {
    console.error("Erro ao buscar áreas de plantio para estatísticas:", areasError);
    throw new Error("Não foi possível calcular estatísticas de produção");
  }
  
  // Busca todas as produtividades
  let prodQuery = supabase
    .from("produtividades")
    .select(`
      *,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      safras:safra_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (harvestId) {
    prodQuery = prodQuery.eq("safra_id", harvestId);
  }
  
  const { data: productivities, error: prodError } = await prodQuery;
  
  if (prodError) {
    console.error("Erro ao buscar produtividades para estatísticas:", prodError);
    throw new Error("Não foi possível calcular estatísticas de produção");
  }
  
  // Busca todos os custos de produção
  let costsQuery = supabase
    .from("custos_producao")
    .select(`
      *,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      safras:safra_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (harvestId) {
    costsQuery = costsQuery.eq("safra_id", harvestId);
  }
  
  const { data: costs, error: costsError } = await costsQuery;
  
  if (costsError) {
    console.error("Erro ao buscar custos para estatísticas:", costsError);
    throw new Error("Não foi possível calcular estatísticas de produção");
  }
  
  // Calcular estatísticas básicas
  const totalPlantingArea = plantingAreas?.reduce((sum, area) => sum + (area.area || 0), 0) || 0;
  
  // Agregar áreas por cultura
  const areasByCulture = plantingAreas?.reduce((acc, area) => {
    const cultureName = area.culturas?.nome || 'Desconhecida';
    acc[cultureName] = (acc[cultureName] || 0) + (area.area || 0);
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Agregar áreas por sistema
  const areasBySystem = plantingAreas?.reduce((acc, area) => {
    const systemName = area.sistemas?.nome || 'Desconhecido';
    acc[systemName] = (acc[systemName] || 0) + (area.area || 0);
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Agregar áreas por ciclo
  const areasByCycle = plantingAreas?.reduce((acc, area) => {
    const cycleName = area.ciclos?.nome || 'Desconhecido';
    acc[cycleName] = (acc[cycleName] || 0) + (area.area || 0);
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Calcular produtividade média por cultura e sistema
  const prodByCultureAndSystem = productivities?.reduce((acc, prod) => {
    const key = `${prod.culturas?.nome || 'Desconhecida'}_${prod.sistemas?.nome || 'Desconhecido'}`;
    if (!acc[key]) {
      acc[key] = {
        cultura: prod.culturas?.nome || 'Desconhecida',
        sistema: prod.sistemas?.nome || 'Desconhecido',
        produtividade: prod.produtividade || 0,
        unidade: prod.unidade || 'sc/ha',
        count: 1
      };
    } else {
      acc[key].produtividade += prod.produtividade || 0;
      acc[key].count += 1;
    }
    return acc;
  }, {} as Record<string, { cultura: string, sistema: string, produtividade: number, unidade: string, count: number }>) || {};
  
  // Calcular média
  Object.keys(prodByCultureAndSystem).forEach(key => {
    prodByCultureAndSystem[key].produtividade /= prodByCultureAndSystem[key].count;
  });
  
  // Calcular total de custos por categoria
  const costsByCategory = costs?.reduce((acc, cost) => {
    const category = cost.categoria || 'OUTROS';
    acc[category] = (acc[category] || 0) + (cost.valor || 0);
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Calcular custos por cultura
  const costsByCulture = costs?.reduce((acc, cost) => {
    const cultureName = cost.culturas?.nome || 'Desconhecida';
    acc[cultureName] = (acc[cultureName] || 0) + (cost.valor || 0);
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Calcular custos por sistema
  const costsBySystem = costs?.reduce((acc, cost) => {
    const systemName = cost.sistemas?.nome || 'Desconhecido';
    acc[systemName] = (acc[systemName] || 0) + (cost.valor || 0);
    return acc;
  }, {} as Record<string, number>) || {};
  
  return {
    totalPlantingArea,
    areasByCulture,
    areasBySystem,
    areasByCycle,
    productivityByCultureAndSystem: Object.values(prodByCultureAndSystem),
    costsByCategory,
    costsByCulture,
    costsBySystem,
    totalCosts: Object.values(costsByCategory).reduce((sum, value) => sum + value, 0)
  };
}