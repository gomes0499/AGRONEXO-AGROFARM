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
  
  const { data, error } = await query.order("data_inicio", { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar arrendamentos:", error);
    throw new Error("Não foi possível carregar os arrendamentos");
  }
  
  return data as Lease[];
}

export async function getLeaseById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("arrendamentos")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar arrendamento:", error);
    throw new Error("Não foi possível carregar os detalhes do arrendamento");
  }
  
  return data as Lease;
}

export async function createLease(
  organizationId: string, 
  values: LeaseFormValues
) {
  const supabase = await createClient();
  
  const custos = typeof values.custos_projetados_anuais === 'string' 
    ? JSON.parse(values.custos_projetados_anuais) 
    : values.custos_projetados_anuais;
  
  const { data, error } = await supabase
    .from("arrendamentos")
    .insert({
      organizacao_id: organizationId,
      ...values,
      custos_projetados_anuais: custos
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar arrendamento:", error);
    throw new Error("Não foi possível criar o arrendamento");
  }
  
  revalidatePath(`/dashboard/properties/${values.propriedade_id}`);
  
  return data as Lease;
}

export async function updateLease(
  id: string, 
  values: LeaseFormValues
) {
  const supabase = await createClient();
  
  const custos = typeof values.custos_projetados_anuais === 'string' 
    ? JSON.parse(values.custos_projetados_anuais) 
    : values.custos_projetados_anuais;
  
  const { data, error } = await supabase
    .from("arrendamentos")
    .update({
      ...values,
      custos_projetados_anuais: custos
    })
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