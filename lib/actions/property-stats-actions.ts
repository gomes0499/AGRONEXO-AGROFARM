"use server";

import { createClient } from "@/lib/supabase/server";

export interface PropertyStatsData {
  totalFazendas: number;
  areaTotal: number;
  valorPatrimonial: number;
  areaCultivavel: number;
  utilizacaoPercentual: number;
  // Dados para cálculo YoY (ano sobre ano)
  crescimentoArea?: number;
  crescimentoValor?: number;
  propriedadesProprias: number;
  propriedadesArrendadas: number;
  // Dados específicos para breakdown de ownership
  totalPropriedadesProprias: number;
  totalPropriedadesArrendadas: number;
  areaPropriedadesProprias: number;
  areaPropriedadesArrendadas: number;
}

export async function getPropertyStats(
  organizationId: string, 
  propertyIds?: string[]
): Promise<PropertyStatsData> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar propriedades (filtradas se fornecido)
    let propertiesQuery = supabase
      .from("propriedades")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    // Aplicar filtro de propriedades se fornecido
    if (propertyIds && propertyIds.length > 0) {
      propertiesQuery = propertiesQuery.in("id", propertyIds);
    }
    
    const { data: properties, error: propertiesError } = await propertiesQuery;
    
    if (propertiesError) throw propertiesError;
    
    // 2. Buscar benfeitorias para somar ao valor patrimonial (filtradas por propriedades)
    let improvementsQuery = supabase
      .from("benfeitorias")
      .select("valor, propriedade_id")
      .eq("organizacao_id", organizationId);
    
    // Aplicar filtro de propriedades se fornecido
    if (propertyIds && propertyIds.length > 0) {
      improvementsQuery = improvementsQuery.in("propriedade_id", propertyIds);
    }
    
    const { data: improvements, error: improvementsError } = await improvementsQuery;
    
    if (improvementsError) throw improvementsError;
    
    // 3. Calcular estatísticas principais
    const totalFazendas = properties?.length || 0;
    const areaTotal = properties?.reduce((sum, prop) => sum + (prop.area_total || 0), 0) || 0;
    const areaCultivavel = properties?.reduce((sum, prop) => sum + (prop.area_cultivada || 0), 0) || 0;
    
    // Valor patrimonial = valor das propriedades + valor das benfeitorias
    const valorPropriedades = properties?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;
    const valorBenfeitorias = improvements?.reduce((sum, imp) => sum + (imp.valor || 0), 0) || 0;
    const valorPatrimonial = valorPropriedades + valorBenfeitorias;
    
    // Percentual de utilização
    const utilizacaoPercentual = areaTotal > 0 ? (areaCultivavel / areaTotal) * 100 : 0;
    
    // Contagem por tipo
    const propriedadesProprias = properties?.filter(p => p.tipo === "PROPRIO").length || 0;
    const propriedadesArrendadas = properties?.filter(p => p.tipo === "ARRENDADO").length || 0;
    
    // Dados específicos para breakdown de ownership
    const propriasProprias = properties?.filter(p => p.tipo === "PROPRIO") || [];
    const propriasArrendadas = properties?.filter(p => p.tipo === "ARRENDADO") || [];
    
    const totalPropriedadesProprias = propriasProprias.length;
    const totalPropriedadesArrendadas = propriasArrendadas.length;
    const areaPropriedadesProprias = propriasProprias.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    const areaPropriedadesArrendadas = propriasArrendadas.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    
    // TODO: Implementar cálculo YoY (necessita dados históricos)
    // Por ora, usar valores simulados baseados em crescimento típico do agronegócio
    const crescimentoArea = 2.3; // 2.3% ao ano (crescimento médio do setor)
    const crescimentoValor = 15.2; // 15.2% ao ano (valorização de terras)
    
    return {
      totalFazendas,
      areaTotal,
      valorPatrimonial,
      areaCultivavel,
      utilizacaoPercentual,
      crescimentoArea,
      crescimentoValor,
      propriedadesProprias,
      propriedadesArrendadas,
      totalPropriedadesProprias,
      totalPropriedadesArrendadas,
      areaPropriedadesProprias,
      areaPropriedadesArrendadas,
    };
    
  } catch (error) {
    console.error("Erro ao buscar estatísticas de propriedades:", error);
    throw new Error("Não foi possível carregar as estatísticas de propriedades");
  }
}

