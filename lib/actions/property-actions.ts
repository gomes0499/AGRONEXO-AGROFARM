"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  Property, 
  PropertyFormValues, 
  Lease, 
  LeaseFormValues, 
  Improvement, 
  ImprovementFormValues 
} from "@/schemas/properties";
import { revalidatePath } from "next/cache";

// Funções para Propriedades
export async function getProperties(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedades")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome");
  
  if (error) {
    console.error("Erro ao buscar propriedades:", error);
    throw new Error("Não foi possível carregar as propriedades");
  }
  
  return data as Property[];
}

export async function getPropertyById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedades")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar propriedade:", error);
    throw new Error("Não foi possível carregar os detalhes da propriedade");
  }
  
  return data as Property;
}

export async function createProperty(
  organizationId: string, 
  values: PropertyFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedades")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar propriedade:", error);
    throw new Error("Não foi possível criar a propriedade");
  }
  
  revalidatePath("/dashboard/properties");
  
  return data as Property;
}

export async function updateProperty(
  id: string, 
  values: PropertyFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedades")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar propriedade:", error);
    throw new Error("Não foi possível atualizar a propriedade");
  }
  
  revalidatePath(`/dashboard/properties/${id}`);
  revalidatePath("/dashboard/properties");
  
  return data as Property;
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("propriedades")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir propriedade:", error);
    throw new Error("Não foi possível excluir a propriedade");
  }
  
  revalidatePath("/dashboard/properties");
  
  return true;
}

// Funções para Arrendamentos
export async function getLeases(organizationId: string, propertyId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("arrendamentos")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (propertyId) {
    query = query.eq("propriedade_id", propertyId);
  }
  
  const { data: leases, error } = await query.order("data_inicio", { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar arrendamentos:", error);
    throw new Error("Não foi possível carregar os arrendamentos");
  }
  
  // Buscar safras separadamente se necessário
  if (leases && leases.length > 0) {
    const safraIds = [...new Set(leases.map(l => l.safra_id).filter(Boolean))];
    
    if (safraIds.length > 0) {
      const { data: safras } = await supabase
        .from('safras')
        .select('id, nome, ano_inicio, ano_fim')
        .in('id', safraIds);
      
      // Mapear safras para os arrendamentos
      const safraMap = safras?.reduce((acc, safra) => {
        acc[safra.id] = safra;
        return acc;
      }, {} as Record<string, any>) || {};
      
      return leases.map(lease => ({
        ...lease,
        safra: lease.safra_id ? safraMap[lease.safra_id] : null
      })) as Lease[];
    }
  }
  
  return leases as Lease[] || [];
}

export async function getLeaseById(id: string) {
  const supabase = await createClient();
  
  const { data: lease, error } = await supabase
    .from("arrendamentos")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar arrendamento:", error);
    throw new Error("Não foi possível carregar os detalhes do arrendamento");
  }
  
  // Buscar safra separadamente se necessário
  if (lease && lease.safra_id) {
    const { data: safra } = await supabase
      .from('safras')
      .select('id, nome, ano_inicio, ano_fim')
      .eq('id', lease.safra_id)
      .single();
    
    return {
      ...lease,
      safra: safra || null
    } as Lease;
  }
  
  return {
    ...lease,
    safra: null
  } as Lease;
}

export async function createLease(
  organizationId: string, 
  propertyId: string,
  values: LeaseFormValues
) {
  const supabase = await createClient();
  
  console.log("createLease called with:", { organizationId, propertyId, values });
  
  // Garantir que custos_por_ano seja um objeto válido
  let custos;
  try {
    custos = typeof values.custos_por_ano === 'string' 
      ? JSON.parse(values.custos_por_ano) 
      : values.custos_por_ano || {};
  } catch (error) {
    console.warn("Erro ao parsear custos_por_ano, usando objeto vazio:", error);
    custos = {};
  }
  
  const insertData = {
    organizacao_id: organizationId,
    propriedade_id: propertyId,
    safra_id: values.safra_id,
    numero_arrendamento: values.numero_arrendamento,
    area_fazenda: values.area_fazenda,
    area_arrendada: values.area_arrendada,
    nome_fazenda: values.nome_fazenda,
    arrendantes: values.arrendantes,
    data_inicio: values.data_inicio,
    data_termino: values.data_termino,
    custo_hectare: values.custo_hectare,
    tipo_pagamento: values.tipo_pagamento,
    custos_por_ano: custos,
    ativo: values.ativo ?? true,
    observacoes: values.observacoes || null
  };
  
  console.log("Dados a serem inseridos:", insertData);
  
  const { data, error } = await supabase
    .from("arrendamentos")
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar arrendamento:", error);
    throw new Error(`Não foi possível criar o arrendamento: ${error.message}`);
  }
  
  console.log("Arrendamento criado com sucesso:", data);
  
  revalidatePath(`/dashboard/properties/${propertyId}`);
  
  return data as Lease;
}

export async function updateLease(
  id: string, 
  values: LeaseFormValues
) {
  const supabase = await createClient();
  
  const custos = typeof values.custos_por_ano === 'string' 
    ? JSON.parse(values.custos_por_ano) 
    : values.custos_por_ano;
  
  const updateData = {
    safra_id: values.safra_id,
    numero_arrendamento: values.numero_arrendamento,
    area_fazenda: values.area_fazenda,
    area_arrendada: values.area_arrendada,
    nome_fazenda: values.nome_fazenda,
    arrendantes: values.arrendantes,
    data_inicio: values.data_inicio,
    data_termino: values.data_termino,
    custo_hectare: values.custo_hectare,
    tipo_pagamento: values.tipo_pagamento,
    custos_por_ano: custos,
    ativo: values.ativo ?? true,
    observacoes: values.observacoes || null
  };
  
  const { data, error } = await supabase
    .from("arrendamentos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar arrendamento:", error);
    throw new Error("Não foi possível atualizar o arrendamento");
  }
  
  revalidatePath(`/dashboard/properties/${values.propriedade_id}`);
  
  return data as Lease;
}

export async function deleteLease(id: string, propertyId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("arrendamentos")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir arrendamento:", error);
    throw new Error("Não foi possível excluir o arrendamento");
  }
  
  revalidatePath(`/dashboard/properties/${propertyId}`);
  
  return true;
}

// Função para buscar safras
export async function getSafras(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio", { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar safras:", error);
    throw new Error("Não foi possível carregar as safras");
  }
  
  return data;
}

// Função para buscar safras por IDs específicos
export async function getSafrasByIds(organizationId: string, safraIds: string[]) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .in("id", safraIds);
  
  if (error) {
    console.error("Erro ao buscar safras por IDs:", error);
    throw new Error("Não foi possível carregar as safras");
  }
  
  return data;
}

// Funções para Benfeitorias
export async function getImprovements(organizationId: string, propertyId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("benfeitorias")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (propertyId) {
    query = query.eq("propriedade_id", propertyId);
  }
  
  const { data, error } = await query.order("descricao");
  
  if (error) {
    console.error("Erro ao buscar benfeitorias:", error);
    throw new Error("Não foi possível carregar as benfeitorias");
  }
  
  return data as Improvement[];
}

export async function getImprovementById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("benfeitorias")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar benfeitoria:", error);
    throw new Error("Não foi possível carregar os detalhes da benfeitoria");
  }
  
  return data as Improvement;
}

export async function createImprovement(
  organizationId: string, 
  values: ImprovementFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("benfeitorias")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar benfeitoria:", error);
    throw new Error("Não foi possível criar a benfeitoria");
  }
  
  revalidatePath(`/dashboard/properties/${values.propriedade_id}`);
  
  return data as Improvement;
}

export async function updateImprovement(
  id: string, 
  values: ImprovementFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("benfeitorias")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar benfeitoria:", error);
    throw new Error("Não foi possível atualizar a benfeitoria");
  }
  
  revalidatePath(`/dashboard/properties/${values.propriedade_id}`);
  
  return data as Improvement;
}

export async function deleteImprovement(id: string, propertyId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("benfeitorias")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir benfeitoria:", error);
    throw new Error("Não foi possível excluir a benfeitoria");
  }
  
  revalidatePath(`/dashboard/properties/${propertyId}`);
  
  return true;
}

// Função para calcular estatísticas de propriedades
export async function getPropertyStats(organizationId: string) {
  const supabase = await createClient();
  
  // Busca todas as propriedades ordenadas por nome
  const { data: properties, error: propertiesError } = await supabase
    .from("propriedades")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome");
  
  if (propertiesError) {
    console.error("Erro ao buscar propriedades para estatísticas:", propertiesError);
    throw new Error("Não foi possível calcular estatísticas de propriedades");
  }
  
  // Busca todos os arrendamentos
  const { data: leases, error: leasesError } = await supabase
    .from("arrendamentos")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (leasesError) {
    console.error("Erro ao buscar arrendamentos para estatísticas:", leasesError);
    throw new Error("Não foi possível calcular estatísticas de arrendamentos");
  }
  
  // Busca todas as benfeitorias
  const { data: improvements, error: improvementsError } = await supabase
    .from("benfeitorias")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (improvementsError) {
    console.error("Erro ao buscar benfeitorias para estatísticas:", improvementsError);
    throw new Error("Não foi possível calcular estatísticas de benfeitorias");
  }
  
  // Calcular estatísticas
  const totalProperties = properties.length;
  const totalArea = properties.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
  const totalCultivatedArea = properties.reduce((sum, prop) => sum + (prop.area_cultivada || 0), 0);
  const totalValue = properties.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0);
  const ownedProperties = properties.filter(p => p.tipo === "PROPRIO").length;
  const leasedProperties = properties.filter(p => p.tipo === "ARRENDADO").length;
  const totalLeases = leases.length;
  const leasedArea = leases.reduce((sum, lease) => sum + (lease.area_arrendada || 0), 0);
  const totalImprovements = improvements.length;
  const improvementsValue = improvements.reduce((sum, imp) => sum + (imp.valor || 0), 0);
  
  return {
    totalProperties,
    totalArea,
    totalCultivatedArea,
    totalValue,
    ownedProperties,
    leasedProperties,
    totalLeases,
    leasedArea,
    totalImprovements,
    improvementsValue
  };
}