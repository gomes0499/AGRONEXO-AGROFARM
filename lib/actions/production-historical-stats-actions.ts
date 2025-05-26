"use server";

import { createClient } from "@/lib/supabase/server";

export interface HistoricalMetricData {
  safra: string;
  valor: number;
  safraId: string;
  ano: number;
  isProjetado: boolean;
}

export interface HistoricalMetricsResponse {
  data: HistoricalMetricData[];
  metricName: string;
  unit: string;
  currentValue: number;
  realizadoData: HistoricalMetricData[];
  projetadoData: HistoricalMetricData[];
  crescimentoRealizado: number;
  crescimentoProjetado: number;
  periodoRealizado: string;
  periodoProjetado: string;
}

export type MetricType = 'area' | 'produtividade' | 'receita' | 'ebitda';

export async function getHistoricalMetricData(
  organizationId: string,
  metricType: MetricType,
  propertyIds?: string[]
): Promise<HistoricalMetricsResponse> {
  try {
    const supabase = await createClient();

    // 1. Buscar todas as safras da organização ordenadas por ano
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });

    if (safrasError) {
      throw new Error(`Erro ao buscar safras: ${safrasError.message}`);
    }

    if (!safras || safras.length === 0) {
      return {
        data: [],
        metricName: getMetricName(metricType),
        unit: getMetricUnit(metricType),
        currentValue: 0,
        realizadoData: [],
        projetadoData: [],
        crescimentoRealizado: 0,
        crescimentoProjetado: 0,
        periodoRealizado: "",
        periodoProjetado: ""
      };
    }

    // 2. Buscar dados históricos para cada safra baseado no tipo de métrica
    const historicalData: HistoricalMetricData[] = [];
    const currentYear = new Date().getFullYear();

    for (const safra of safras) {
      let valor = 0;
      const isProjetado = safra.ano_inicio >= currentYear;

      switch (metricType) {
        case 'area':
          valor = await calculateAreaPlantada(supabase, organizationId, safra.id, propertyIds);
          break;
        case 'produtividade':
          valor = await calculateProdutividadeMedia(supabase, organizationId, safra.id);
          break;
        case 'receita':
          valor = await calculateReceita(supabase, organizationId, safra.id, propertyIds);
          break;
        case 'ebitda':
          valor = await calculateEbitda(supabase, organizationId, safra.id, propertyIds);
          break;
        default:
          valor = 0;
      }

      historicalData.push({
        safra: safra.nome,
        valor: valor,
        safraId: safra.id,
        ano: safra.ano_inicio,
        isProjetado: isProjetado
      });
    }

    // 3. Separar dados realizados e projetados
    const realizadoData = historicalData.filter(item => !item.isProjetado);
    const projetadoData = historicalData.filter(item => item.isProjetado);

    // 4. Calcular crescimento para cada período
    let crescimentoRealizado = 0;
    let crescimentoProjetado = 0;
    let periodoRealizado = "";
    let periodoProjetado = "";

    // Crescimento realizado YoY (última vs penúltima safra)
    if (realizadoData.length >= 2) {
      const penultimaRealizada = realizadoData[realizadoData.length - 2];
      const ultimaRealizada = realizadoData[realizadoData.length - 1];
      if (penultimaRealizada.valor > 0) {
        crescimentoRealizado = ((ultimaRealizada.valor - penultimaRealizada.valor) / penultimaRealizada.valor) * 100;
      }
      periodoRealizado = `${penultimaRealizada.safra} vs ${ultimaRealizada.safra}`;
    }

    // Crescimento projetado (última realizada vs primeira projetada, ou YoY entre projetadas)
    if (projetadoData.length >= 2) {
      // Se há múltiplas projeções, calcular YoY entre as duas primeiras
      const primeiraProjetada = projetadoData[0];
      const segundaProjetada = projetadoData[1];
      if (primeiraProjetada.valor > 0) {
        crescimentoProjetado = ((segundaProjetada.valor - primeiraProjetada.valor) / primeiraProjetada.valor) * 100;
      }
      periodoProjetado = `${primeiraProjetada.safra} vs ${segundaProjetada.safra}`;
    } else if (projetadoData.length >= 1 && realizadoData.length >= 1) {
      // Se há apenas uma projeção, comparar com o último dado realizado
      const lastRealizado = realizadoData[realizadoData.length - 1];
      const firstProjetado = projetadoData[0];
      if (lastRealizado.valor > 0) {
        crescimentoProjetado = ((firstProjetado.valor - lastRealizado.valor) / lastRealizado.valor) * 100;
      }
      periodoProjetado = `${lastRealizado.safra} vs ${firstProjetado.safra}`;
    }

    const currentValue = historicalData[historicalData.length - 1]?.valor || 0;

    return {
      data: historicalData,
      metricName: getMetricName(metricType),
      unit: getMetricUnit(metricType),
      currentValue: currentValue,
      realizadoData: realizadoData,
      projetadoData: projetadoData,
      crescimentoRealizado: crescimentoRealizado,
      crescimentoProjetado: crescimentoProjetado,
      periodoRealizado: periodoRealizado,
      periodoProjetado: periodoProjetado
    };

  } catch (error) {
    console.error("Erro ao buscar dados históricos da métrica:", error);
    return {
      data: [],
      metricName: getMetricName(metricType),
      unit: getMetricUnit(metricType),
      currentValue: 0,
      realizadoData: [],
      projetadoData: [],
      crescimentoRealizado: 0,
      crescimentoProjetado: 0,
      periodoRealizado: "",
      periodoProjetado: ""
    };
  }
}

// Função auxiliar para calcular área plantada
async function calculateAreaPlantada(
  supabase: any,
  organizationId: string,
  safraId: string,
  propertyIds?: string[]
): Promise<number> {
  let query = supabase
    .from("areas_plantio")
    .select("area")
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);

  if (propertyIds && propertyIds.length > 0) {
    query = query.in("propriedade_id", propertyIds);
  }

  const { data, error } = await query;
  
  if (error || !data) return 0;
  
  return data.reduce((sum, area) => sum + (area.area || 0), 0);
}

// Função auxiliar para calcular produtividade média
async function calculateProdutividadeMedia(
  supabase: any,
  organizationId: string,
  safraId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("produtividades")
    .select("produtividade")
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);

  if (error || !data || data.length === 0) return 0;

  const total = data.reduce((sum, prod) => sum + (prod.produtividade || 0), 0);
  return total / data.length;
}

// Função auxiliar para calcular receita
async function calculateReceita(
  supabase: any,
  organizationId: string,
  safraId: string,
  propertyIds?: string[]
): Promise<number> {
  // Buscar áreas de plantio
  let areasQuery = supabase
    .from("areas_plantio")
    .select(`
      *,
      cultura:cultura_id(id, nome),
      sistema:sistema_id(id, nome)
    `)
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);

  if (propertyIds && propertyIds.length > 0) {
    areasQuery = areasQuery.in("propriedade_id", propertyIds);
  }

  const { data: areas } = await areasQuery;

  // Buscar produtividades
  const { data: productivity } = await supabase
    .from("produtividades")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);

  // Buscar preços
  const { data: commodityPrices } = await supabase
    .from("commodity_price_projections")
    .select("*")
    .eq("organizacao_id", organizationId);

  if (!areas || !productivity || !commodityPrices) return 0;

  // Mapear nomes de culturas para tipos de commodity
  const culturaCommodityMap: Record<string, string[]> = {
    'SOJA': ['SOJA_SEQUEIRO', 'SOJA_IRRIGADO'],
    'MILHO': ['MILHO_SEQUEIRO', 'MILHO_IRRIGADO'],
    'ALGODAO': ['ALGODAO_SEQUEIRO', 'ALGODAO_IRRIGADO'],
    'ALGODÃO': ['ALGODAO_SEQUEIRO', 'ALGODAO_IRRIGADO']
  };

  let receitaTotal = 0;

  // Agrupar áreas por cultura
  const areasPorCultura = new Map<string, {area: number, produtividade: number}>();
  
  areas.forEach(area => {
    const culturaNome = area.cultura?.nome?.toUpperCase() || 'SOJA';
    const areaValue = area.area || 0;
    
    const produtividadeCorrespondente = productivity.find(p => 
      p.cultura_id === area.cultura_id && 
      p.sistema_id === area.sistema_id
    );
    
    const produtividadeValue = produtividadeCorrespondente?.produtividade || 0;
    
    if (areasPorCultura.has(culturaNome)) {
      const existing = areasPorCultura.get(culturaNome)!;
      areasPorCultura.set(culturaNome, {
        area: existing.area + areaValue,
        produtividade: (existing.produtividade + produtividadeValue) / 2
      });
    } else {
      areasPorCultura.set(culturaNome, {
        area: areaValue,
        produtividade: produtividadeValue
      });
    }
  });

  // Calcular receita por cultura
  areasPorCultura.forEach((dados, culturaNome) => {
    const commodityTypes = culturaCommodityMap[culturaNome] || ['SOJA_SEQUEIRO'];
    
    let preco = 0;
    for (const commodityType of commodityTypes) {
      const commodityPrice = commodityPrices.find(p => p.commodity_type === commodityType);
      if (commodityPrice?.current_price) {
        preco = commodityPrice.current_price;
        break;
      }
    }
    
    const producaoCultura = dados.area * dados.produtividade;
    const receitaCultura = producaoCultura * preco;
    
    receitaTotal += receitaCultura;
  });

  return receitaTotal;
}

// Função auxiliar para calcular EBITDA
async function calculateEbitda(
  supabase: any,
  organizationId: string,
  safraId: string,
  propertyIds?: string[]
): Promise<number> {
  // Calcular receita
  const receita = await calculateReceita(supabase, organizationId, safraId, propertyIds);

  // Buscar custos
  const { data: costs } = await supabase
    .from("custos_producao")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);

  // Buscar áreas para calcular custo total
  let areasQuery = supabase
    .from("areas_plantio")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);

  if (propertyIds && propertyIds.length > 0) {
    areasQuery = areasQuery.in("propriedade_id", propertyIds);
  }

  const { data: areas } = await areasQuery;

  if (!costs || !areas) return receita;

  let custoTotal = 0;
  
  areas.forEach(area => {
    const areaValue = area.area || 0;
    
    const custosEspecificos = costs.filter(custo => {
      return custo.cultura_id === area.cultura_id && 
             custo.sistema_id === area.sistema_id;
    });
    
    if (custosEspecificos.length > 0) {
      const custoPorHectare = custosEspecificos.reduce((sum, custo) => sum + (custo.valor || 0), 0);
      custoTotal += custoPorHectare * areaValue;
    }
  });

  return receita - custoTotal;
}

// Funções auxiliares para metadados
function getMetricName(metricType: MetricType): string {
  const names: Record<MetricType, string> = {
    area: 'Área Plantada',
    produtividade: 'Produtividade Média',
    receita: 'Receita Operacional',
    ebitda: 'EBITDA'
  };
  return names[metricType];
}

function getMetricUnit(metricType: MetricType): string {
  const units: Record<MetricType, string> = {
    area: 'ha',
    produtividade: 'sc/ha',
    receita: 'R$',
    ebitda: 'R$'
  };
  return units[metricType];
}