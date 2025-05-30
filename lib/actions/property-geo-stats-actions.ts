"use server";

import { createClient } from "@/lib/supabase/server";

export interface StatePropertyData {
  estado: string;
  nomeEstado: string;
  totalPropriedades: number;
  areaTotal: number;
  areaCultivada: number;
  valorTotal: number;
  propriedadesProprias: number;
  propriedadesArrendadas: number;
  percentualArea: number;
  percentualValor: number;
  color: string;
}

export interface PropertyGeoStats {
  estadosData: StatePropertyData[];
  totalGeral: {
    propriedades: number;
    area: number;
    valor: number;
  };
}

// Mapeamento de siglas para nomes completos dos estados
const ESTADOS_NOMES: Record<string, string> = {
  'AC': 'Acre',
  'AL': 'Alagoas', 
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins'
};

// Cores para diferentes estados (usando tons da paleta roxa da aplicação)
const CORES_ESTADOS = [
  '#1B124E', // Roxo escuro primário
  '#3F2C88', // Roxo médio
  '#5139A5', // Roxo principal
  '#6346C2', // Roxo claro
  '#7553DF', // Roxo mais claro
  '#8760FC', // Lavanda escuro
  '#9A6DFF', // Lavanda médio
  '#AC7AFF', // Lavanda claro
  '#BE87FF', // Lilás
  '#D094FF', // Rosa lilás
  '#E2A1FF', // Rosa claro
];

export async function getPropertyGeoStats(
  organizationId: string, 
  propertyIds?: string[]
): Promise<PropertyGeoStats> {
  try {
    const supabase = await createClient();
    
    // Construir query base
    let query = supabase
      .from("propriedades")
      .select(`
        *,
        benfeitorias(valor)
      `)
      .eq("organizacao_id", organizationId);
    
    // Aplicar filtro de propriedades se fornecido
    if (propertyIds && propertyIds.length > 0) {
      query = query.in("id", propertyIds);
    }
    
    const { data: properties, error } = await query;
    
    if (error) throw error;
    
    if (!properties || properties.length === 0) {
      return {
        estadosData: [],
        totalGeral: { propriedades: 0, area: 0, valor: 0 }
      };
    }
    
    // Agrupar dados por estado
    const estadosMap = new Map<string, {
      totalPropriedades: number;
      areaTotal: number;
      areaCultivada: number;
      valorTotal: number;
      propriedadesProprias: number;
      propriedadesArrendadas: number;
    }>();
    
    let totalGeralPropriedades = 0;
    let totalGeralArea = 0;
    let totalGeralValor = 0;
    
    properties.forEach((property) => {
      const estado = property.estado?.toUpperCase() || 'N/A';
      
      // Calcular valor total (propriedade + benfeitorias)
      const valorBenfeitorias = property.benfeitorias?.reduce(
        (sum: number, benf: any) => sum + (benf.valor || 0), 
        0
      ) || 0;
      const valorTotal = (property.valor_atual || 0) + valorBenfeitorias;
      
      const areaTotal = property.area_total || 0;
      const areaCultivada = property.area_cultivada || 0;
      
      // Acumular totais gerais
      totalGeralPropriedades++;
      totalGeralArea += areaTotal;
      totalGeralValor += valorTotal;
      
      // Agrupar por estado
      if (!estadosMap.has(estado)) {
        estadosMap.set(estado, {
          totalPropriedades: 0,
          areaTotal: 0,
          areaCultivada: 0,
          valorTotal: 0,
          propriedadesProprias: 0,
          propriedadesArrendadas: 0,
        });
      }
      
      const estadoData = estadosMap.get(estado)!;
      estadoData.totalPropriedades++;
      estadoData.areaTotal += areaTotal;
      estadoData.areaCultivada += areaCultivada;
      estadoData.valorTotal += valorTotal;
      
      if (property.tipo === 'PROPRIO') {
        estadoData.propriedadesProprias++;
      } else if (property.tipo === 'ARRENDADO') {
        estadoData.propriedadesArrendadas++;
      }
    });
    
    // Converter Map para array e calcular percentuais
    const estadosData: StatePropertyData[] = Array.from(estadosMap.entries())
      .map(([estado, data], index) => ({
        estado,
        nomeEstado: ESTADOS_NOMES[estado] || estado,
        ...data,
        percentualArea: totalGeralArea > 0 ? (data.areaTotal / totalGeralArea) * 100 : 0,
        percentualValor: totalGeralValor > 0 ? (data.valorTotal / totalGeralValor) * 100 : 0,
        color: CORES_ESTADOS[index % CORES_ESTADOS.length],
      }))
      .sort((a, b) => b.areaTotal - a.areaTotal); // Ordenar por área (maior primeiro)
    
    return {
      estadosData,
      totalGeral: {
        propriedades: totalGeralPropriedades,
        area: totalGeralArea,
        valor: totalGeralValor,
      }
    };
    
  } catch (error) {
    console.error("Erro ao buscar estatísticas geográficas:", error);
    throw new Error("Não foi possível carregar as estatísticas por estado");
  }
}