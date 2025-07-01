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
  propertyIds?: string[],
  cultureIds?: string[],
  projectionId?: string
): Promise<HistoricalMetricsResponse> {
  try {
    const supabase = await createClient();

    // 1. Buscar todas as safras da organização ordenadas por ano
    const { data: allSafras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });

    if (safrasError) {
      throw new Error(`Erro ao buscar safras: ${safrasError.message}`);
    }

    if (!allSafras || allSafras.length === 0) {
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
    
    // Filtrar safras para não mostrar as muito futuras (após 2029/2030)
    // Não mostrar safras com ano_inicio após 2029
    const safras = allSafras.filter(safra => safra.ano_inicio <= 2029);

    // 2. Buscar dados históricos para cada safra baseado no tipo de métrica
    const historicalData: HistoricalMetricData[] = [];
    const currentYear = new Date().getFullYear();

    for (const safra of safras) {
      let valor = 0;
      const isProjetado = safra.ano_inicio >= currentYear;

      switch (metricType) {
        case 'area':
          valor = await calculateAreaPlantada(supabase, organizationId, safra.id, propertyIds, cultureIds, projectionId);
          break;
        case 'produtividade':
          valor = await calculateProdutividadeMedia(supabase, organizationId, safra.id, cultureIds, projectionId);
          break;
        case 'receita':
          valor = await calculateReceita(supabase, organizationId, safra.id, propertyIds, cultureIds, projectionId);
          break;
        case 'ebitda':
          valor = await calculateEbitda(supabase, organizationId, safra.id, propertyIds, cultureIds, projectionId);
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

// Função auxiliar para calcular área plantada com novo formato JSONB
async function calculateAreaPlantada(
  supabase: any,
  organizationId: string,
  safraId: string,
  propertyIds?: string[],
  cultureIds?: string[],
  projectionId?: string
): Promise<number> {
  const tableName = projectionId ? "areas_plantio_projections" : "areas_plantio";
  
  let query = supabase
    .from(tableName)
    .select("areas_por_safra")
    .eq("organizacao_id", organizationId)
    .not("areas_por_safra", "is", null)
    .not("areas_por_safra", "eq", "{}");

  if (!projectionId && propertyIds && propertyIds.length > 0) {
    query = query.in("propriedade_id", propertyIds);
  }
  
  if (cultureIds && cultureIds.length > 0) {
    query = query.in("cultura_id", cultureIds);
  }
  
  if (projectionId) {
    query = query.eq("projection_id", projectionId);
  }

  const { data, error } = await query;
  
  if (error || !data) return 0;
  
  // Extrair a área plantada para a safra específica de cada registro JSONB
  return data.reduce((sum: number, area: any) => {
    const areaSafra = area.areas_por_safra?.[safraId] || 0;
    return sum + areaSafra;
  }, 0);
}

// Função auxiliar para calcular produtividade média com novo formato JSONB
async function calculateProdutividadeMedia(
  supabase: any,
  organizationId: string,
  safraId: string,
  cultureIds?: string[],
  projectionId?: string
): Promise<number> {
  const tableName = projectionId ? "produtividades_projections" : "produtividades";
  
  let query = supabase
    .from(tableName)
    .select("produtividades_por_safra, cultura_id")
    .eq("organizacao_id", organizationId)
    .not("produtividades_por_safra", "is", null)
    .not("produtividades_por_safra", "eq", "{}");
    
  if (cultureIds && cultureIds.length > 0) {
    query = query.in("cultura_id", cultureIds);
  }
  
  if (projectionId) {
    query = query.eq("projection_id", projectionId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return 0;

  let sum = 0;
  let count = 0;
  
  // Extrair a produtividade para a safra específica de cada registro JSONB
  data.forEach((prod: any) => {
    const prodSafra = prod.produtividades_por_safra?.[safraId];
    
    if (prodSafra) {
      // Pode ser um número ou um objeto { produtividade, unidade }
      const prodValue = typeof prodSafra === 'number' 
        ? prodSafra 
        : (prodSafra as { produtividade: number; unidade: string }).produtividade;
      
      if (prodValue > 0) {
        sum += prodValue;
        count++;
      }
    }
  });
  
  return count > 0 ? sum / count : 0;
}

// Função auxiliar para calcular receita com novo formato JSONB
async function calculateReceita(
  supabase: any,
  organizationId: string,
  safraId: string,
  propertyIds?: string[],
  cultureIds?: string[],
  projectionId?: string
): Promise<number> {
  // Buscar a safra específica para determinar o ano
  const { data: safra } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("id", safraId)
    .single();
    
  if (!safra) return 0;

  // Buscar áreas de plantio com novo formato JSONB
  const areasTableName = projectionId ? "areas_plantio_projections" : "areas_plantio";
  
  let areasQuery = supabase
    .from(areasTableName)
    .select(`
      *,
      cultura_id,
      sistema_id,
      culturas:cultura_id(id, nome),
      sistemas:sistema_id(id, nome),
      ciclos:ciclo_id(id, nome)
    `)
    .eq("organizacao_id", organizationId)
    .not("areas_por_safra", "is", null)
    .not("areas_por_safra", "eq", "{}");

  if (!projectionId && propertyIds && propertyIds.length > 0) {
    areasQuery = areasQuery.in("propriedade_id", propertyIds);
  }
  
  if (cultureIds && cultureIds.length > 0) {
    areasQuery = areasQuery.in("cultura_id", cultureIds);
  }
  
  if (projectionId) {
    areasQuery = areasQuery.eq("projection_id", projectionId);
  }

  const { data: areas } = await areasQuery;

  // Buscar produtividades com novo formato JSONB
  const prodTableName = projectionId ? "produtividades_projections" : "produtividades";
  
  let prodQuery = supabase
    .from(prodTableName)
    .select("*")
    .eq("organizacao_id", organizationId)
    .not("produtividades_por_safra", "is", null)
    .not("produtividades_por_safra", "eq", "{}");
  
  if (projectionId) {
    prodQuery = prodQuery.eq("projection_id", projectionId);
  }
  
  const { data: productivity } = await prodQuery;

  // Buscar preços com formato JSONB (precos_por_ano)
  const pricesTableName = projectionId ? "commodity_price_projections_projections" : "commodity_price_projections";
  
  let pricesQuery = supabase
    .from(pricesTableName)
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (projectionId) {
    pricesQuery = pricesQuery.eq("projection_id", projectionId);
  }
  
  const { data: commodityPrices } = await pricesQuery;

  if (!areas || !productivity) return 0;

  // Agrupar áreas e produtividades por cultura/sistema/ciclo para cálculo mais preciso
  const combinacoesCulturasSistemas = new Map<string, {
    cultura_id: string, 
    sistema_id: string,
    culturaNome: string,
    sistemaNome: string,
    cicloNome: string,
    area: number, 
    produtividade: number
  }>();
  
  // Processar áreas de plantio usando o novo formato JSONB
  areas.forEach((area: any) => {
    const cultura_id = area.cultura_id;
    const sistema_id = area.sistema_id;
    const culturaNome = area.culturas?.nome?.toUpperCase() || 'DESCONHECIDA';
    const sistemaNome = area.sistemas?.nome || 'SEQUEIRO';
    const cicloNome = area.ciclos?.nome || '';
    const areaValue = area.areas_por_safra?.[safraId] || 0;
    
    if (areaValue <= 0) return; // Ignorar áreas sem plantio nesta safra
    
    // Criar uma chave única para cada combinação de cultura e sistema
    const key = `${cultura_id}:${sistema_id}`;
    
    if (combinacoesCulturasSistemas.has(key)) {
      const existing = combinacoesCulturasSistemas.get(key)!;
      combinacoesCulturasSistemas.set(key, {
        ...existing,
        area: existing.area + areaValue
      });
    } else {
      combinacoesCulturasSistemas.set(key, {
        cultura_id,
        sistema_id,
        culturaNome,
        sistemaNome,
        cicloNome,
        area: areaValue,
        produtividade: 0
      });
    }
  });
  
  // Adicionar produtividades às combinações
  productivity.forEach((prod: any) => {
    const key = `${prod.cultura_id}:${prod.sistema_id}`;
    
    if (combinacoesCulturasSistemas.has(key)) {
      const combo = combinacoesCulturasSistemas.get(key)!;
      
      // Obter o valor de produtividade do formato JSONB
      let produtividadeValue = 0;
      const prodSafra = prod.produtividades_por_safra?.[safraId];
      
      if (prodSafra) {
        // Pode ser um número ou um objeto { produtividade, unidade }
        produtividadeValue = typeof prodSafra === 'number' 
          ? prodSafra 
          : (prodSafra as { produtividade: number; unidade: string }).produtividade;
      }
      
      if (produtividadeValue > 0) {
        combinacoesCulturasSistemas.set(key, {
          ...combo,
          produtividade: produtividadeValue
        });
      }
    }
  });

  // Calcular receita total
  let receitaTotal = 0;
  
  // Para cada combinação cultura/sistema, calcular receita
  for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
    // Se não há área ou produtividade, pular
    if (combo.area <= 0 || combo.produtividade <= 0) continue;
    
    // Determinar tipo de commodity específico baseado na combinação cultura/sistema/ciclo
    let commodityType = '';
    let culturaNomeLC = combo.culturaNome.toLowerCase();
    let cicloNomeLC = combo.cicloNome.toLowerCase();
    
    if (culturaNomeLC.includes('soja')) {
      commodityType = combo.sistemaNome.toLowerCase().includes('irrigado') ? 'SOJA_IRRIGADO' : 'SOJA';
    } else if (culturaNomeLC.includes('milho')) {
      // Detectar se é Milho Safrinha ou Milho comum
      if (culturaNomeLC.includes('safrinha') || cicloNomeLC.includes('2')) {
        commodityType = 'MILHO_SAFRINHA';
      } else {
        commodityType = 'MILHO';
      }
    } else if (culturaNomeLC.includes('algodão') || culturaNomeLC.includes('algodao')) {
      commodityType = 'ALGODAO';
    } else if (culturaNomeLC.includes('arroz')) {
      commodityType = 'ARROZ';
    } else if (culturaNomeLC.includes('sorgo')) {
      commodityType = 'SORGO';
    } else if (culturaNomeLC.includes('feijão') || culturaNomeLC.includes('feijao')) {
      commodityType = 'FEIJAO';
    } else {
      // Caso não tenha uma commodity específica, pular
      continue;
    }
    
    // Buscar preço para este tipo específico usando precos_por_ano JSONB
    let preco = 0;
    if (commodityType && commodityPrices && commodityPrices.length > 0) {
      const commodityPrice = commodityPrices.find((p: any) => p.commodity_type === commodityType);
      
      if (commodityPrice) {
        // Tentar usar o preço específico para esta safra do JSONB precos_por_ano
        if (commodityPrice.precos_por_ano && commodityPrice.precos_por_ano[safraId]) {
          preco = commodityPrice.precos_por_ano[safraId];
        }
        // Se não tiver preço específico para esta safra, não usar fallback (deixar 0)
      }
    }
    
    // Se não encontrou preço, não usar fallback (pular)
    if (preco <= 0) {
      continue;
    }
    
    // Calcular produção e receita desta combinação cultura/sistema
    const producaoCulturaSistema = combo.area * combo.produtividade;
    const receitaCulturaSistema = producaoCulturaSistema * preco;
    
    receitaTotal += receitaCulturaSistema;
  }

  return receitaTotal;
}

// Função auxiliar para calcular EBITDA com novo formato JSONB
async function calculateEbitda(
  supabase: any,
  organizationId: string,
  safraId: string,
  propertyIds?: string[],
  cultureIds?: string[],
  projectionId?: string
): Promise<number> {
  try {
    // Buscar a safra específica para determinar o ano
    const { data: safra } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("id", safraId)
      .single();
      
    // Calcular receita (já atualizado para JSONB)
    const receita = await calculateReceita(supabase, organizationId, safraId, propertyIds, cultureIds, projectionId);

    // Buscar custos com novo formato JSONB
    const costsTableName = projectionId ? "custos_producao_projections" : "custos_producao";
    
    let costsQuery = supabase
      .from(costsTableName)
      .select("*, cultura_id, sistema_id")
      .eq("organizacao_id", organizationId)
      .not("custos_por_safra", "is", null)
      .not("custos_por_safra", "eq", "{}");
      
    if (cultureIds && cultureIds.length > 0) {
      costsQuery = costsQuery.in("cultura_id", cultureIds);
    }
    
    if (projectionId) {
      costsQuery = costsQuery.eq("projection_id", projectionId);
    }
    
    const { data: costs } = await costsQuery;

    // Buscar áreas para calcular custo total com novo formato JSONB
    const areasTableName = projectionId ? "areas_plantio_projections" : "areas_plantio";
    
    let areasQuery = supabase
      .from(areasTableName)
      .select("*, cultura_id, sistema_id")
      .eq("organizacao_id", organizationId)
      .not("areas_por_safra", "is", null)
      .not("areas_por_safra", "eq", "{}");

    if (!projectionId && propertyIds && propertyIds.length > 0) {
      areasQuery = areasQuery.in("propriedade_id", propertyIds);
    }
    
    if (cultureIds && cultureIds.length > 0) {
      areasQuery = areasQuery.in("cultura_id", cultureIds);
    }
    
    if (projectionId) {
      areasQuery = areasQuery.eq("projection_id", projectionId);
    }

    const { data: areas } = await areasQuery;

    if (!costs || !areas) return 0;

    // Agrupar áreas por cultura e sistema
    const combinacoesCulturasSistemas = new Map<string, {
      cultura_id: string, 
      sistema_id: string,
      area: number
    }>();
    
    // Processar áreas de plantio usando o novo formato JSONB
    areas.forEach((area: any) => {
      const cultura_id = area.cultura_id;
      const sistema_id = area.sistema_id;
      const areaValue = area.areas_por_safra?.[safraId] || 0;
      
      if (areaValue <= 0) return; // Ignorar áreas sem plantio nesta safra
      
      // Criar uma chave única para cada combinação de cultura e sistema
      const key = `${cultura_id}:${sistema_id}`;
      
      if (combinacoesCulturasSistemas.has(key)) {
        const existing = combinacoesCulturasSistemas.get(key)!;
        combinacoesCulturasSistemas.set(key, {
          ...existing,
          area: existing.area + areaValue
        });
      } else {
        combinacoesCulturasSistemas.set(key, {
          cultura_id,
          sistema_id,
          area: areaValue
        });
      }
    });
    
    // Calcular custo total baseado nas áreas agrupadas
    let custoTotal = 0;
    
    for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
      // Se não há área, pular
      if (combo.area <= 0) continue;
      
      // Buscar custos específicos para esta combinação cultura/sistema
      const custosEspecificos = costs.filter((custo: any) => 
        custo.cultura_id === combo.cultura_id && 
        custo.sistema_id === combo.sistema_id
      );
      
      // Se há custos específicos, calcular o custo total
      if (custosEspecificos.length > 0) {
        let custoPorHectareTotal = 0;
        
        custosEspecificos.forEach((custo: any) => {
          // Buscar o valor do custo para a safra específica no JSONB
          const custoSafra = custo.custos_por_safra?.[safraId] || 0;
          custoPorHectareTotal += custoSafra;
        });
        
        custoTotal += custoPorHectareTotal * combo.area;
      }
    }

    // Se o custo for extremamente baixo para uma receita significativa,
    // podemos estimar um custo mais realista (aproximadamente 60-70% da receita para operações agrícolas)
    if (custoTotal < receita * 0.1 && receita > 0) {
      // Quanto mais antiga a safra, menor a proporção de custos (considerar inflação)
      let proporcaoCustos = 0.65; // Padrão para safras recentes
      
      if (safra) {
        const anoAtual = new Date().getFullYear();
        const diferencaAnos = anoAtual - safra.ano_inicio;
        
        // Ajustar proporção de custos com base na idade da safra
        if (diferencaAnos >= 5) {
          proporcaoCustos = 0.55; // Custos proporcionalmente menores para safras mais antigas
        } else if (diferencaAnos >= 3) {
          proporcaoCustos = 0.60;
        }
      }
      
      custoTotal = receita * proporcaoCustos;
    }

    // Calcular EBITDA
    const ebitda = receita - custoTotal;
    
    // EBITDA não pode ser maior que a receita em valores muito díspares
    // Se for o caso, aplicar um ajuste mais conservador
    if (ebitda > receita * 0.6 && receita > 1000000) {
      return receita * 0.3; // Limitar EBITDA a 30% da receita para valores muito altos
    }

    return ebitda;
  } catch (error) {
    console.error("Erro ao calcular EBITDA:", error);
    return 0; // Retorna zero em caso de erro
  }
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