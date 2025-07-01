"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeProductivityData } from "@/lib/utils/production-helpers";

// ==========================================
// TYPES AND INTERFACES
// ==========================================

export interface Sistema {
  id: string;
  nome: string;
  organizacao_id: string;
}

export interface PlantingArea {
  id: string;
  organizacao_id: string;
  propriedade_id?: string;
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
  ciclo_id: string;
  produtividades_por_safra: Record<string, number | { produtividade: number; unidade: string }>; // JSONB (hybrid format)
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  propriedades?: { nome: string };
  culturas?: { nome: string };
  sistemas?: { nome: string };
  ciclos?: { nome: string };
}

export interface ProductionCost {
  id: string;
  organizacao_id: string;
  propriedade_id?: string;
  cultura_id: string;
  sistema_id: string;
  ciclo_id: string;
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
  ciclos?: { nome: string };
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
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar safras:", error);
      // Retornar array vazio em vez de lançar erro
      return [];
    }
    
    return data as Safra[];
  } catch (err) {
    console.error("Erro ao buscar safras:", err);
    // Retornar array vazio em caso de erro de conexão
    return [];
  }
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

export async function getSistemas(organizationId: string) {
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
  
  return data as Sistema[];
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
  propriedade_id?: string;
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
  
  try {
    // Verificar se estamos lidando com uma projeção
    const { data: projectionRecord, error: fetchError } = await supabase
      .from("areas_plantio_projections")
      .select("id")
      .eq("id", id)
      .single();

    const isProjection = !fetchError && projectionRecord;
    const tableName = isProjection ? "areas_plantio_projections" : "areas_plantio";

    const { data: result, error } = await supabase
      .from(tableName)
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
  } catch (error) {
    console.error("Erro ao processar atualização de área de plantio:", error);
    throw new Error("Não foi possível atualizar a área de plantio");
  }
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
      sistemas:sistema_id(nome),
      ciclos:ciclo_id(nome)
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
  ciclo_id: string;
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
  
  try {
    // Primeiro, verificar se estamos lidando com uma projeção
    const { data: productivityRecord, error: fetchError } = await supabase
      .from("produtividades_projections")
      .select("id")
      .eq("id", id)
      .single();

    const isProjection = !fetchError && productivityRecord;
    const tableName = isProjection ? "produtividades_projections" : "produtividades";

    // Preparar dados de acordo com a estrutura da tabela
    let updateData: any = { ...data };
    
    if (data.produtividades_por_safra) {
      if (isProjection) {
        // Para tabela de projeções: apenas números simples + unidade separada
        const formattedProductivities: Record<string, number> = {};
        let commonUnit = "sc/ha"; // Unidade padrão
        
        Object.entries(data.produtividades_por_safra).forEach(([safraId, value]) => {
          if (value && value.produtividade !== undefined) {
            const produtividade = Number(value.produtividade);
            const unidade = value.unidade || "sc/ha";
            formattedProductivities[safraId] = produtividade; // Apenas o número
            commonUnit = unidade; // Usar a última unidade encontrada como unidade comum
          }
        });
        
        updateData = {
          produtividades_por_safra: formattedProductivities,
          unidade: commonUnit, // Campo separado para a tabela de projeções
          observacoes: data.observacoes
        };
      } else {
        // Para tabela original: formato tradicional com objetos
        const formattedProductivities: Record<string, { produtividade: number; unidade: string }> = {};
        
        Object.entries(data.produtividades_por_safra).forEach(([safraId, value]) => {
          if (value && value.produtividade !== undefined) {
            const produtividade = Number(value.produtividade);
            const unidade = value.unidade || "sc/ha";
            formattedProductivities[safraId] = { produtividade, unidade };
          }
        });
        
        updateData = {
          produtividades_por_safra: formattedProductivities,
          observacoes: data.observacoes
        };
      }
    }

    const { data: result, error } = await supabase
      .from(tableName)
      .update({
        ...updateData,
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
  } catch (error) {
    console.error("Erro ao processar atualização de produtividade:", error);
    throw new Error("Não foi possível atualizar a produtividade");
  }
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
      sistemas:sistema_id(nome),
      ciclos:ciclos!custos_producao_ciclo_id_fkey(nome)
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
      sistemas:sistema_id(nome),
      ciclos:ciclos!custos_producao_ciclo_id_fkey(nome)
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
  ciclo_id: string;
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
  
  try {
    // Verificar se estamos lidando com uma projeção
    const { data: projectionRecord, error: fetchError } = await supabase
      .from("custos_producao_projections")
      .select("id")
      .eq("id", id)
      .single();

    const isProjection = !fetchError && projectionRecord;
    const tableName = isProjection ? "custos_producao_projections" : "custos_producao";

    const { data: result, error } = await supabase
      .from(tableName)
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
  } catch (error) {
    console.error("Erro ao processar atualização de custo de produção:", error);
    throw new Error("Não foi possível atualizar o custo de produção");
  }
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
    .from("operacoes_pecuarias")
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
    .from("operacoes_pecuarias")
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
    // Para JSONB no PostgreSQL, enviamos o objeto diretamente sem JSON.stringify
    volume_abate_por_safra: typeof data.volume_abate_por_safra === 'string' 
      ? JSON.parse(data.volume_abate_por_safra) 
      : data.volume_abate_por_safra
  };
  
  const { data: result, error } = await supabase
    .from("operacoes_pecuarias")
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
  // Para JSONB no PostgreSQL, enviamos o objeto diretamente sem JSON.stringify
  if (processedData.volume_abate_por_safra) {
    processedData.volume_abate_por_safra = typeof processedData.volume_abate_por_safra === 'string' 
      ? JSON.parse(processedData.volume_abate_por_safra) 
      : processedData.volume_abate_por_safra;
  }
  
  const { data: result, error } = await supabase
    .from("operacoes_pecuarias")
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
    .from("operacoes_pecuarias")
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
  try {
    const [safras, cultures, systems, cycles, properties] = await Promise.all([
      getSafras(organizationId),
      getCultures(organizationId),
      getSystems(organizationId),
      getCycles(organizationId),
      getProperties(organizationId),
    ]);

    return {
      safras: safras || [],
      cultures: cultures || [],
      systems: systems || [],
      cycles: cycles || [],
      properties: properties || [],
    };
  } catch (error) {
    console.error("Erro ao carregar dados de produção unificados:", error);
    // Retornar estrutura vazia em caso de erro
    return {
      safras: [],
      cultures: [],
      systems: [],
      cycles: [],
      properties: [],
    };
  }
}

export async function getPlantingAreasUnified(organizationId: string, projectionId?: string) {
  const [plantingAreas, safras] = await Promise.all([
    projectionId ? getPlantingAreasFromProjection(organizationId, projectionId) : getPlantingAreas(organizationId),
    getSafras(organizationId),
  ]);

  return {
    plantingAreas,
    safras,
  };
}

// Nova função para buscar áreas de plantio de uma projeção
export async function getPlantingAreasFromProjection(organizationId: string, projectionId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("areas_plantio_projections")
    .select(`
      *,
      propriedades:propriedade_id(id, nome),
      culturas:cultura_id(id, nome),
      sistemas:sistema_id(id, nome),
      ciclos:ciclo_id(id, nome)
    `)
    .eq("organizacao_id", organizationId)
    .eq("projection_id", projectionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar áreas de plantio da projeção:", error);
    return [];
  }

  return data || [];
}

export async function getProductivitiesUnified(organizationId: string, projectionId?: string) {
  const [productivities, safras] = await Promise.all([
    projectionId ? getProductivitiesFromProjection(organizationId, projectionId) : getProductivities(organizationId),
    getSafras(organizationId),
  ]);

  return {
    productivities,
    safras,
  };
}

// Nova função para buscar produtividades de uma projeção
export async function getProductivitiesFromProjection(organizationId: string, projectionId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("produtividades_projections")
    .select(`
      *,
      culturas:cultura_id(id, nome),
      sistemas:sistema_id(id, nome)
    `)
    .eq("organizacao_id", organizationId)
    .eq("projection_id", projectionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar produtividades da projeção:", error);
    return [];
  }

  return data || [];
}

// MultiSafraProductivity form function
export async function createMultiSafraProductivities(
  organizationId: string,
  data: {
    propriedade_id: string;
    cultura_id: string;
    sistema_id: string;
    ciclo_id: string;
    produtividades_por_safra: Record<string, { produtividade: number; unidade: string }>;
    observacoes?: string;
  }
) {
  const supabase = await createClient();
  
  try {
    // Vamos usar uma abordagem mais simples: vamos converter as produtividades complexas
    // para valores numéricos simples, para evitar o erro de tipo do PostgreSQL
    
    // Criamos um objeto com valores numéricos simples
    const numericProductivities: Record<string, number> = {};
    
    // Processar cada entrada para extrair apenas o valor numérico
    Object.entries(data.produtividades_por_safra).forEach(([safraId, value]) => {
      if (value && value.produtividade > 0) {
        // Armazenar apenas o valor numérico de produtividade
        numericProductivities[safraId] = Number(value.produtividade);
      }
    });
    
    // Verificar se temos alguma produtividade válida
    if (Object.keys(numericProductivities).length === 0) {
      throw new Error("Nenhuma produtividade válida informada");
    }
    
    // Preparar os dados para inserção com formato simplificado
    const completeData = {
      organizacao_id: organizationId,
      propriedade_id: data.propriedade_id || null,
      cultura_id: data.cultura_id,
      sistema_id: data.sistema_id,
      ciclo_id: data.ciclo_id,
      // Usar apenas números para evitar o erro de tipo JSONB
      produtividades_por_safra: numericProductivities,
      observacoes: data.observacoes || null
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
    
    // Se chegamos aqui, a inserção foi bem-sucedida
    revalidatePath("/dashboard/production");
    return result as Productivity;
    
  } catch (error) {
    console.error("Erro ao processar produtividades múltiplas:", error);
    throw new Error("Não foi possível criar as produtividades");
  }
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
  
  try {
    // Garantir que os custos estejam no formato numérico correto
    const formattedCosts: Record<string, number> = {};
    
    Object.entries(data.custos_por_safra).forEach(([safraId, value]) => {
      // Converter para número e garantir que seja um valor válido
      formattedCosts[safraId] = Number(value);
    });
    
    const completeData = {
      organizacao_id: organizationId,
      propriedade_id: data.propriedade_id,
      cultura_id: data.cultura_id,
      sistema_id: data.sistema_id,
      categoria: data.categoria,
      custos_por_safra: formattedCosts,
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
  } catch (error) {
    console.error("Erro ao processar custos múltiplos:", error);
    throw new Error("Não foi possível criar os custos");
  }
}

export async function getProductionCostsUnified(organizationId: string, projectionId?: string) {
  const [productionCosts, safras] = await Promise.all([
    projectionId ? getProductionCostsFromProjection(organizationId, projectionId) : getProductionCosts(organizationId),
    getSafras(organizationId),
  ]);

  return {
    productionCosts,
    safras,
  };
}

// Nova função para buscar custos de produção de uma projeção
export async function getProductionCostsFromProjection(organizationId: string, projectionId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("custos_producao_projections")
    .select(`
      *,
      culturas:cultura_id(id, nome),
      sistemas:sistema_id(id, nome)
    `)
    .eq("organizacao_id", organizationId)
    .eq("projection_id", projectionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar custos de produção da projeção:", error);
    return [];
  }

  return data || [];
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
    propriedade_id: data.propriedade_id || null, // Convert empty string to null
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