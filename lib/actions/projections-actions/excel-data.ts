'use server';

import { createClient } from '@/lib/supabase/server';

export interface ProjectionFilters {
  propertyIds?: string[];
  cultureIds?: string[];
  systemIds?: string[];
  cycleIds?: string[];
  safraIds?: string[];
}

export interface YearlyProjectionData {
  safraId: string;
  safraName: string;
  anoInicio: number;
  anoFim: number;
  areaPlantada: number;
  produtividade: number;
  produtividadeUnit: string;
  preco: number;
  receita: number;
  custoHa: number;
  custoTotal: number;
  ebitda: number;
  ebitdaPercentage: number;
}

export interface DynamicProjectionData {
  title: string; // Título baseado nos filtros aplicados
  years: YearlyProjectionData[];
}

export async function getDynamicProjectionData(
  organizationId: string,
  filters: ProjectionFilters = {}
): Promise<DynamicProjectionData> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras disponíveis (filtradas se especificado)
    let safrasQuery = supabase
      .from('safras')
      .select('id, nome, ano_inicio, ano_fim')
      .eq('organizacao_id', organizationId)
      .order('ano_inicio', { ascending: true });

    if (filters.safraIds?.length) {
      safrasQuery = safrasQuery.in('id', filters.safraIds);
    }

    const { data: safras, error: safrasError } = await safrasQuery;
    if (safrasError) throw safrasError;

    if (!safras.length) {
      return {
        title: "Nenhuma safra encontrada",
        years: [],
      };
    }

    // 2. Buscar áreas de plantio baseadas nos filtros
    let areasQuery = supabase
      .from('areas_plantio')
      .select(`
        area,
        cultura_id,
        sistema_id,
        ciclo_id,
        safra_id,
        propriedade_id,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        ciclos:ciclo_id(nome),
        safras:safra_id(nome, ano_inicio, ano_fim),
        propriedades:propriedade_id(nome)
      `)
      .eq('organizacao_id', organizationId);

    // Aplicar filtros
    if (filters.propertyIds?.length) {
      areasQuery = areasQuery.in('propriedade_id', filters.propertyIds);
    }
    if (filters.cultureIds?.length) {
      areasQuery = areasQuery.in('cultura_id', filters.cultureIds);
    }
    if (filters.systemIds?.length) {
      areasQuery = areasQuery.in('sistema_id', filters.systemIds);
    }
    if (filters.cycleIds?.length) {
      areasQuery = areasQuery.in('ciclo_id', filters.cycleIds);
    }
    if (filters.safraIds?.length) {
      areasQuery = areasQuery.in('safra_id', filters.safraIds);
    }

    const { data: areas, error: areasError } = await areasQuery;
    if (areasError) throw areasError;

    // 3. Buscar produtividades
    let prodQuery = supabase
      .from('produtividades')
      .select('produtividade, unidade, cultura_id, sistema_id, safra_id')
      .eq('organizacao_id', organizationId);

    if (filters.cultureIds?.length) {
      prodQuery = prodQuery.in('cultura_id', filters.cultureIds);
    }
    if (filters.systemIds?.length) {
      prodQuery = prodQuery.in('sistema_id', filters.systemIds);
    }
    if (filters.safraIds?.length) {
      prodQuery = prodQuery.in('safra_id', filters.safraIds);
    }

    const { data: productivities, error: prodError } = await prodQuery;
    if (prodError) throw prodError;

    // 4. Buscar custos
    let costsQuery = supabase
      .from('custos_producao')
      .select('valor, categoria, cultura_id, sistema_id, safra_id')
      .eq('organizacao_id', organizationId);

    if (filters.cultureIds?.length) {
      costsQuery = costsQuery.in('cultura_id', filters.cultureIds);
    }
    if (filters.systemIds?.length) {
      costsQuery = costsQuery.in('sistema_id', filters.systemIds);
    }
    if (filters.safraIds?.length) {
      costsQuery = costsQuery.in('safra_id', filters.safraIds);
    }

    const { data: costs, error: costsError } = await costsQuery;
    if (costsError) throw costsError;

    // 5. Buscar preços do módulo de indicadores
    const { data: commodityPrices, error: pricesError } = await supabase
      .from('commodity_price_projections')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (pricesError) throw pricesError;

    // 6. Gerar título dinâmico baseado nos filtros
    const title = generateDynamicTitle(areas, filters);

    // 7. Calcular dados consolidados por safra
    const yearlyData: YearlyProjectionData[] = [];

    for (const safra of safras) {
      // Filtrar áreas para esta safra
      const areasForSafra = areas?.filter(a => a.safra_id === safra.id) || [];
      
      if (areasForSafra.length === 0) {
        // Adicionar linha zerada se não há dados para esta safra
        yearlyData.push({
          safraId: safra.id,
          safraName: safra.nome,
          anoInicio: safra.ano_inicio,
          anoFim: safra.ano_fim,
          areaPlantada: 0,
          produtividade: 0,
          produtividadeUnit: 'Sc/ha',
          preco: 0,
          receita: 0,
          custoHa: 0,
          custoTotal: 0,
          ebitda: 0,
          ebitdaPercentage: 0,
        });
        continue;
      }

      // Calcular totais para esta safra
      const totalArea = areasForSafra.reduce((sum, a) => sum + (a.area || 0), 0);

      // Calcular produtividade média ponderada
      let totalWeightedProd = 0;
      let totalAreaWithProd = 0;
      let prodUnit = 'Sc/ha';

      areasForSafra.forEach(area => {
        const prod = productivities?.find(p => 
          p.cultura_id === area.cultura_id && 
          p.sistema_id === area.sistema_id &&
          (p.safra_id === area.safra_id || !p.safra_id)
        );

        if (prod && area.area) {
          totalWeightedProd += (prod.produtividade || 0) * area.area;
          totalAreaWithProd += area.area;
          prodUnit = prod.unidade || 'Sc/ha';
        }
      });

      const avgProdutividade = totalAreaWithProd > 0 
        ? totalWeightedProd / totalAreaWithProd 
        : 0;

      // Calcular custo médio por hectare
      let totalWeightedCost = 0;
      let totalAreaWithCost = 0;

      areasForSafra.forEach(area => {
        const areaCosts = costs?.filter(c => 
          c.cultura_id === area.cultura_id && 
          c.sistema_id === area.sistema_id &&
          (c.safra_id === area.safra_id || !c.safra_id)
        ) || [];

        const totalCostForArea = areaCosts.reduce((sum, c) => sum + (c.valor || 0), 0);
        
        if (totalCostForArea > 0 && area.area) {
          totalWeightedCost += totalCostForArea * area.area;
          totalAreaWithCost += area.area;
        }
      });

      const avgCustoHa = totalAreaWithCost > 0 
        ? totalWeightedCost / totalAreaWithCost 
        : 0;

      // Calcular preço médio ponderado
      let totalWeightedPrice = 0;
      let totalAreaWithPrice = 0;

      areasForSafra.forEach(area => {
        const culturaNome = (area.culturas as any)?.nome?.toUpperCase();
        let price = 0;

        if (commodityPrices && commodityPrices.length > 0) {
          if (culturaNome?.includes('SOJA')) {
            const sojaPrice = commodityPrices.find((p) =>
              p.commodity_type?.toUpperCase().includes('SOJA')
            );
            price = sojaPrice?.current_price || sojaPrice?.price_2025 || 0;
          } else if (culturaNome?.includes('MILHO')) {
            const milhoPrice = commodityPrices.find((p) =>
              p.commodity_type?.toUpperCase().includes('MILHO')
            );
            price = milhoPrice?.current_price || milhoPrice?.price_2025 || 0;
          } else if (culturaNome?.includes('ALGODAO') || culturaNome?.includes('ALGODÃO')) {
            const algodaoPrice = commodityPrices.find((p) =>
              p.commodity_type?.toUpperCase().includes('ALGODAO')
            );
            price = algodaoPrice?.current_price || algodaoPrice?.price_2025 || 0;
          }
        }

        if (price === 0) {
          price = 50; // Fallback
        }

        if (area.area) {
          totalWeightedPrice += price * area.area;
          totalAreaWithPrice += area.area;
        }
      });

      const avgPreco = totalAreaWithPrice > 0 
        ? totalWeightedPrice / totalAreaWithPrice 
        : 50;

      // Cálculos finais
      const producaoTotal = totalArea * avgProdutividade;
      const receita = producaoTotal * avgPreco;
      const custoTotal = totalArea * avgCustoHa;
      const ebitda = receita - custoTotal;
      const ebitdaPercentage = receita > 0 ? (ebitda / receita) * 100 : 0;

      yearlyData.push({
        safraId: safra.id,
        safraName: safra.nome,
        anoInicio: safra.ano_inicio,
        anoFim: safra.ano_fim,
        areaPlantada: totalArea,
        produtividade: avgProdutividade,
        produtividadeUnit: prodUnit,
        preco: avgPreco,
        receita,
        custoHa: avgCustoHa,
        custoTotal,
        ebitda,
        ebitdaPercentage,
      });
    }

    return {
      title,
      years: yearlyData,
    };

  } catch (error) {
    console.error('Error fetching dynamic projection data:', error);
    throw new Error('Erro ao buscar dados de projeção');
  }
}

function generateDynamicTitle(areas: any[], filters: ProjectionFilters): string {
  if (!areas || areas.length === 0) {
    return "Dados Consolidados";
  }

  const parts: string[] = [];

  // Ciclos únicos
  const ciclos = [...new Set(areas.map(a => a.ciclos?.nome).filter(Boolean))];
  if (ciclos.length === 1) {
    parts.push(ciclos[0]);
  } else if (ciclos.length > 1) {
    parts.push(`${ciclos.length} Ciclos`);
  }

  // Culturas únicas
  const culturas = [...new Set(areas.map(a => a.culturas?.nome).filter(Boolean))];
  if (culturas.length === 1) {
    parts.push(culturas[0]);
  } else if (culturas.length > 1) {
    parts.push(`${culturas.length} Culturas`);
  }

  // Sistemas únicos
  const sistemas = [...new Set(areas.map(a => a.sistemas?.nome).filter(Boolean))];
  if (sistemas.length === 1) {
    parts.push(sistemas[0]);
  } else if (sistemas.length > 1) {
    parts.push(`${sistemas.length} Sistemas`);
  }

  // Propriedades únicas
  const propriedades = [...new Set(areas.map(a => a.propriedades?.nome).filter(Boolean))];
  if (propriedades.length === 1) {
    parts.push(propriedades[0]);
  } else if (propriedades.length > 1) {
    parts.push(`${propriedades.length} Propriedades`);
  }

  return parts.length > 0 ? parts.join(' - ') : "Dados Consolidados";
}