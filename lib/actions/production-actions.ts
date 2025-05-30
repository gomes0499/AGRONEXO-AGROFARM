"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeProductivityData } from "@/lib/utils/production-helpers";

// ==========================================
// TYPES AND INTERFACES
// ==========================================

export interface PlantingArea {
  id: string;
  organizacao_id: string;
  propriedade_id: string;
  cultura_id: string;
  sistema_id: string;
  ciclo_id: string;
  areas_por_safra: Record<string, number>; // JSONB: { "safra_id": area_value }
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  propriedades?: { nome: string };
  culturas?: { nome: string };
  sistemas?: { nome: string };
  ciclos?: { nome: string };
}

export interface Productivity {
  id: string;
  organizacao_id: string;
  propriedade_id?: string;
  cultura_id: string;
  sistema_id: string;
  produtividades_por_safra: Record<string, number | { produtividade: number; unidade: string }>; // JSONB (hybrid format)
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  propriedades?: { nome: string };
  culturas?: { nome: string };
  sistemas?: { nome: string };
}

export interface ProductionCost {
  id: string;
  organizacao_id: string;
  propriedade_id?: string;
  cultura_id: string;
  sistema_id: string;
  categoria: string;
  custos_por_safra: Record<string, number>; // JSONB: { "safra_id": valor }
  descricao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  propriedades?: { nome: string };
  culturas?: { nome: string };
  sistemas?: { nome: string };
}

export interface Safra {
  id: string;
  organizacao_id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
  ativa: boolean;
}

export interface Culture {
  id: string;
  organizacao_id: string;
  nome: string;
  descricao?: string;
}

export interface System {
  id: string;
  organizacao_id: string;
  nome: string;
  descricao?: string;
}

export interface Cycle {
  id: string;
  organizacao_id: string;
  nome: string;
  descricao?: string;
}

export interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
}

// ==========================================
// CONFIGURATION FUNCTIONS
// ==========================================

export async function getSafras(organizationId: string) {
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
  
  return data as Safra[];
}

export async function createSafra(data: {
  organizacao_id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
  ativa?: boolean;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("safras")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar safra:", error);
    throw new Error("Não foi possível criar a safra");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updateSafra(id: string, data: {
  nome?: string;
  ano_inicio?: number;
  ano_fim?: number;
  ativa?: boolean;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("safras")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar safra:", error);
    throw new Error("Não foi possível atualizar a safra");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deleteSafra(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("safras")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar safra:", error);
    throw new Error("Não foi possível deletar a safra");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

// Aliases for backward compatibility (harvest = safra)
export async function createHarvest(organizationId: string, data: {
  nome: string;
  ano_inicio: number;
  ano_fim: number;
  ativa?: boolean;
}) {
  return createSafra({
    organizacao_id: organizationId,
    ...data
  });
}

export async function updateHarvest(id: string, data: {
  nome?: string;
  ano_inicio?: number;
  ano_fim?: number;
  ativa?: boolean;
}) {
  return updateSafra(id, data);
}

export async function deleteHarvest(id: string) {
  return deleteSafra(id);
}

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

export async function createCulture(organizationId: string, values: {
  nome: string;
  descricao?: string;
}) {
  const data = {
    organizacao_id: organizationId,
    ...values
  };
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("culturas")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar cultura:", error);
    throw new Error("Não foi possível criar a cultura");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updateCulture(id: string, data: {
  nome?: string;
  descricao?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("culturas")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar cultura:", error);
    throw new Error("Não foi possível atualizar a cultura");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deleteCulture(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("culturas")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar cultura:", error);
    throw new Error("Não foi possível deletar a cultura");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

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

export async function createSystem(organizationId: string, values: {
  nome: string;
  descricao?: string;
}) {
  const data = {
    organizacao_id: organizationId,
    ...values
  };
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("sistemas")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar sistema:", error);
    throw new Error("Não foi possível criar o sistema");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updateSystem(id: string, data: {
  nome?: string;
  descricao?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("sistemas")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar sistema:", error);
    throw new Error("Não foi possível atualizar o sistema");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deleteSystem(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("sistemas")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar sistema:", error);
    throw new Error("Não foi possível deletar o sistema");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

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

export async function createCycle(organizationId: string, values: {
  nome: string;
  descricao?: string;
}) {
  const data = {
    organizacao_id: organizationId,
    ...values
  };
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("ciclos")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar ciclo:", error);
    throw new Error("Não foi possível criar o ciclo");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updateCycle(id: string, data: {
  nome?: string;
  descricao?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("ciclos")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar ciclo:", error);
    throw new Error("Não foi possível atualizar o ciclo");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deleteCycle(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("ciclos")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar ciclo:", error);
    throw new Error("Não foi possível deletar o ciclo");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

export async function getProperties(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedades")
    .select("id, nome")
    .eq("organizacao_id", organizationId)
    .order("nome");
  
  if (error) {
    console.error("Erro ao buscar propriedades:", error);
    throw new Error("Não foi possível carregar as propriedades");
  }
  
  return data as Property[];
}

// ==========================================
// PLANTING AREAS FUNCTIONS
// ==========================================

export async function getPlantingAreas(organizationId: string, filters?: {
  propertyId?: string;
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
      ciclos:ciclo_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (filters?.propertyId) {
    query = query.eq("propriedade_id", filters.propertyId);
  }
  
  if (filters?.cultureId) {
    query = query.eq("cultura_id", filters.cultureId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar áreas de plantio:", error);
    throw new Error("Não foi possível carregar as áreas de plantio");
  }
  
  return data as PlantingArea[];
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
      ciclos:ciclo_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar área de plantio:", error);
    throw new Error("Não foi possível carregar a área de plantio");
  }
  
  return data as PlantingArea;
}

export async function createPlantingArea(data: {
  organizacao_id: string;
  propriedade_id: string;
  cultura_id: string;
  sistema_id: string;
  ciclo_id: string;
  areas_por_safra: Record<string, number>;
  observacoes?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("areas_plantio")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar área de plantio:", error);
    throw new Error("Não foi possível criar a área de plantio");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updatePlantingArea(id: string, data: {
  areas_por_safra?: Record<string, number>;
  observacoes?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("areas_plantio")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar área de plantio:", error);
    throw new Error("Não foi possível atualizar a área de plantio");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deletePlantingArea(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("areas_plantio")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar área de plantio:", error);
    throw new Error("Não foi possível deletar a área de plantio");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

// ==========================================
// PRODUCTIVITY FUNCTIONS
// ==========================================

export async function getProductivities(organizationId: string, filters?: {
  propertyId?: string;
  cultureId?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from("produtividades")
    .select(`
      *,
      propriedades:propriedade_id(nome),
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (filters?.propertyId) {
    query = query.eq("propriedade_id", filters.propertyId);
  }
  
  if (filters?.cultureId) {
    query = query.eq("cultura_id", filters.cultureId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar produtividades:", error);
    throw new Error("Não foi possível carregar as produtividades");
  }
  
  // Normalizar dados de produtividade para garantir formato consistente
  const normalizedData = data?.map(productivity => ({
    ...productivity,
    produtividades_por_safra: normalizeProductivityData(productivity.produtividades_por_safra)
  })) || [];
  
  return normalizedData as Productivity[];
}

export async function getProductivityById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("produtividades")
    .select(`
      *,
      propriedades:propriedade_id(nome),
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar produtividade:", error);
    throw new Error("Não foi possível carregar a produtividade");
  }
  
  // Normalizar dados de produtividade
  const normalizedData = {
    ...data,
    produtividades_por_safra: normalizeProductivityData(data.produtividades_por_safra)
  };
  
  return normalizedData as Productivity;
}

export async function createProductivity(data: {
  organizacao_id: string;
  propriedade_id?: string;
  cultura_id: string;
  sistema_id: string;
  produtividades_por_safra: Record<string, { produtividade: number; unidade: string }>;
  observacoes?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("produtividades")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar produtividade:", error);
    throw new Error("Não foi possível criar a produtividade");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updateProductivity(id: string, data: {
  produtividades_por_safra?: Record<string, { produtividade: number; unidade: string }>;
  observacoes?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("produtividades")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar produtividade:", error);
    throw new Error("Não foi possível atualizar a produtividade");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deleteProductivity(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("produtividades")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar produtividade:", error);
    throw new Error("Não foi possível deletar a produtividade");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

// ==========================================
// PRODUCTION COSTS FUNCTIONS
// ==========================================

export async function getProductionCosts(organizationId: string, filters?: {
  propertyId?: string;
  cultureId?: string;
  categoria?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from("custos_producao")
    .select(`
      *,
      propriedades:propriedade_id(nome),
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (filters?.propertyId) {
    query = query.eq("propriedade_id", filters.propertyId);
  }
  
  if (filters?.cultureId) {
    query = query.eq("cultura_id", filters.cultureId);
  }
  
  if (filters?.categoria) {
    query = query.eq("categoria", filters.categoria);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar custos de produção:", error);
    throw new Error("Não foi possível carregar os custos de produção");
  }
  
  return data as ProductionCost[];
}

export async function getProductionCostById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("custos_producao")
    .select(`
      *,
      propriedades:propriedade_id(nome),
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar custo de produção:", error);
    throw new Error("Não foi possível carregar o custo de produção");
  }
  
  return data as ProductionCost;
}

export async function createProductionCost(organizationId: string, values: {
  organizacao_id: string;
  propriedade_id?: string;
  cultura_id: string;
  sistema_id: string;
  categoria: string;
  custos_por_safra: Record<string, number>;
  descricao?: string;
  observacoes?: string;
}) {
  const data = values;
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("custos_producao")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar custo de produção:", error);
    throw new Error("Não foi possível criar o custo de produção");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updateProductionCost(id: string, data: {
  custos_por_safra?: Record<string, number>;
  descricao?: string;
  observacoes?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("custos_producao")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar custo de produção:", error);
    throw new Error("Não foi possível atualizar o custo de produção");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deleteProductionCost(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("custos_producao")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar custo de produção:", error);
    throw new Error("Não foi possível deletar o custo de produção");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

// ==========================================
// LIVESTOCK FUNCTIONS
// ==========================================

export interface Livestock {
  id: string;
  organizacao_id: string;
  tipo_animal: string;
  categoria: string;
  quantidade: number;
  preco_unitario: number;
  unidade_preco: string;
  numero_cabecas?: number;
  propriedade_id: string;
  created_at: string;
  updated_at: string;
  // Relationships
  propriedades?: { nome: string };
}

export async function getLivestock(organizationId: string, filters?: {
  propertyId?: string;
  tipoAnimal?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from("rebanhos")
    .select(`
      *,
      propriedades:propriedade_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (filters?.propertyId) {
    query = query.eq("propriedade_id", filters.propertyId);
  }
  
  if (filters?.tipoAnimal) {
    query = query.eq("tipo_animal", filters.tipoAnimal);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar rebanho:", error);
    throw new Error("Não foi possível carregar o rebanho");
  }
  
  return data as Livestock[];
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
    console.error("Erro ao buscar registro de rebanho:", error);
    throw new Error("Não foi possível carregar o registro de rebanho");
  }
  
  return data as Livestock;
}

export async function createLivestock(organizationId: string, values: {
  tipo_animal: string;
  categoria: string;
  quantidade: number;
  preco_unitario: number;
  unidade_preco: string;
  numero_cabecas?: number;
  propriedade_id: string;
}) {
  const data = {
    organizacao_id: organizationId,
    ...values
  };
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("rebanhos")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar registro de rebanho:", error);
    throw new Error("Não foi possível criar o registro de rebanho");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updateLivestock(id: string, data: {
  tipo_animal?: string;
  categoria?: string;
  quantidade?: number;
  preco_unitario?: number;
  unidade_preco?: string;
  numero_cabecas?: number;
  propriedade_id?: string;
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("rebanhos")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar registro de rebanho:", error);
    throw new Error("Não foi possível atualizar o registro de rebanho");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deleteLivestock(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("rebanhos")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar registro de rebanho:", error);
    throw new Error("Não foi possível deletar o registro de rebanho");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

// ==========================================
// LIVESTOCK OPERATIONS FUNCTIONS
// ==========================================

export interface LivestockOperation {
  id: string;
  organizacao_id: string;
  ciclo: string;
  origem: string;
  propriedade_id: string;
  volume_abate_por_safra: Record<string, number> | string;
  created_at: string;
  updated_at: string;
  // Relationships
  propriedades?: { nome: string };
}

export async function getLivestockOperations(organizationId: string, filters?: {
  propertyId?: string;
  ciclo?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from("vendas_pecuaria")
    .select(`
      *,
      propriedades:propriedade_id(nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (filters?.propertyId) {
    query = query.eq("propriedade_id", filters.propertyId);
  }
  
  if (filters?.ciclo) {
    query = query.eq("ciclo", filters.ciclo);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar operações pecuárias:", error);
    throw new Error("Não foi possível carregar as operações pecuárias");
  }
  
  return data as LivestockOperation[];
}

export async function getLivestockOperationById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("vendas_pecuaria")
    .select(`
      *,
      propriedades:propriedade_id(nome)
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar operação pecuária:", error);
    throw new Error("Não foi possível carregar a operação pecuária");
  }
  
  return data as LivestockOperation;
}

export async function createLivestockOperation(data: {
  organizacao_id: string;
  ciclo: string;
  origem: string;
  propriedade_id: string;
  volume_abate_por_safra: Record<string, number> | string;
}) {
  const supabase = await createClient();
  
  // Processar volume_abate_por_safra para garantir que seja um JSONB válido
  const processedData = {
    ...data,
    volume_abate_por_safra: typeof data.volume_abate_por_safra === 'string' 
      ? data.volume_abate_por_safra 
      : JSON.stringify(data.volume_abate_por_safra)
  };
  
  const { data: result, error } = await supabase
    .from("vendas_pecuaria")
    .insert(processedData)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar operação pecuária:", error);
    throw new Error("Não foi possível criar a operação pecuária");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function updateLivestockOperation(id: string, data: {
  ciclo?: string;
  origem?: string;
  propriedade_id?: string;
  volume_abate_por_safra?: Record<string, number> | string;
}) {
  const supabase = await createClient();
  
  // Processar volume_abate_por_safra para garantir que seja um JSONB válido
  const processedData = { ...data };
  if (processedData.volume_abate_por_safra && typeof processedData.volume_abate_por_safra !== 'string') {
    processedData.volume_abate_por_safra = JSON.stringify(processedData.volume_abate_por_safra);
  }
  
  const { data: result, error } = await supabase
    .from("vendas_pecuaria")
    .update({
      ...processedData,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar operação pecuária:", error);
    throw new Error("Não foi possível atualizar a operação pecuária");
  }
  
  revalidatePath("/dashboard/production");
  return result;
}

export async function deleteLivestockOperation(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("vendas_pecuaria")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar operação pecuária:", error);
    throw new Error("Não foi possível deletar a operação pecuária");
  }
  
  revalidatePath("/dashboard/production");
  return true;
}

// ==========================================
// UNIFIED DATA FUNCTIONS
// ==========================================

export async function getProductionDataUnified(organizationId: string) {
  const [safras, cultures, systems, cycles, properties] = await Promise.all([
    getSafras(organizationId),
    getCultures(organizationId),
    getSystems(organizationId),
    getCycles(organizationId),
    getProperties(organizationId),
  ]);

  return {
    safras,
    cultures,
    systems,
    cycles,
    properties,
  };
}

export async function getPlantingAreasUnified(organizationId: string) {
  const [plantingAreas, safras] = await Promise.all([
    getPlantingAreas(organizationId),
    getSafras(organizationId),
  ]);

  return {
    plantingAreas,
    safras,
  };
}

export async function getProductivitiesUnified(organizationId: string) {
  const [productivities, safras] = await Promise.all([
    getProductivities(organizationId),
    getSafras(organizationId),
  ]);

  return {
    productivities,
    safras,
  };
}

// MultiSafraProductivity form function
export async function createMultiSafraProductivities(
  organizationId: string,
  data: {
    propriedade_id: string;
    cultura_id: string;
    sistema_id: string;
    produtividades_por_safra: Record<string, { produtividade: number; unidade: string }>;
    observacoes?: string;
  }
) {
  const supabase = await createClient();
  
  const completeData = {
    organizacao_id: organizationId,
    propriedade_id: data.propriedade_id,
    cultura_id: data.cultura_id,
    sistema_id: data.sistema_id,
    produtividades_por_safra: data.produtividades_por_safra,
    observacoes: data.observacoes
  };
  
  const { data: result, error } = await supabase
    .from("produtividades")
    .insert(completeData)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar produtividades múltiplas:", error);
    throw new Error("Não foi possível criar as produtividades");
  }
  
  revalidatePath("/dashboard/production");
  return result as Productivity;
}

// MultiSafraProductionCost form function
export async function createMultiSafraProductionCosts(
  organizationId: string,
  data: {
    propriedade_id: string;
    cultura_id: string;
    sistema_id: string;
    categoria: string;
    custos_por_safra: Record<string, number>;
    descricao?: string;
    observacoes?: string;
  }
) {
  const supabase = await createClient();
  
  const completeData = {
    organizacao_id: organizationId,
    propriedade_id: data.propriedade_id,
    cultura_id: data.cultura_id,
    sistema_id: data.sistema_id,
    categoria: data.categoria,
    custos_por_safra: data.custos_por_safra,
    descricao: data.descricao,
    observacoes: data.observacoes
  };
  
  const { data: result, error } = await supabase
    .from("custos_producao")
    .insert(completeData)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar custos múltiplos:", error);
    throw new Error("Não foi possível criar os custos");
  }
  
  revalidatePath("/dashboard/production");
  return result as ProductionCost;
}

export async function getProductionCostsUnified(organizationId: string) {
  const [productionCosts, safras] = await Promise.all([
    getProductionCosts(organizationId),
    getSafras(organizationId),
  ]);

  return {
    productionCosts,
    safras,
  };
}

// MultiSafraPlantingArea form function
export async function createMultiSafraPlantingAreas(
  organizationId: string,
  data: {
    propriedade_id: string;
    cultura_id: string;
    sistema_id: string;
    ciclo_id: string;
    areas_por_safra: Record<string, number>;
    observacoes?: string;
  }
) {
  const supabase = await createClient();
  
  const completeData = {
    organizacao_id: organizationId,
    propriedade_id: data.propriedade_id,
    cultura_id: data.cultura_id,
    sistema_id: data.sistema_id,
    ciclo_id: data.ciclo_id,
    areas_por_safra: data.areas_por_safra,
    observacoes: data.observacoes
  };
  
  const { data: result, error } = await supabase
    .from("areas_plantio")
    .insert(completeData)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar áreas de plantio múltiplas:", error);
    throw new Error("Não foi possível criar as áreas de plantio");
  }
  
  revalidatePath("/dashboard/production");
  return result as PlantingArea;
}

export async function getLivestockDataUnified(organizationId: string) {
  const [livestock, properties] = await Promise.all([
    getLivestock(organizationId),
    getProperties(organizationId),
  ]);

  return {
    livestock,
    properties,
  };
}

export async function getLivestockOperationsDataUnified(organizationId: string) {
  const [operations, properties, safras] = await Promise.all([
    getLivestockOperations(organizationId),
    getProperties(organizationId),
    getSafras(organizationId),
  ]);

  return {
    operations,
    properties,
    safras,
  };
}