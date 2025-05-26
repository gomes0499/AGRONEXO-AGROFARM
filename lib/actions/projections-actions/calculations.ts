'use server';

import { createClient } from '@/lib/supabase/server';

export interface ProjectionFilters {
  propertyIds?: string[];
  cultureIds?: string[];
  systemIds?: string[];
  cycleIds?: string[];
  safraIds?: string[];
}

export interface ProductionCalculations {
  totalArea: number;
  averageProductivity: number;
  productivityUnit: string;
  totalProduction: number;
  averageCostPerHa: number;
  totalCost: number;
  averagePrice: number;
  totalRevenue: number;
  ebitda: number;
  ebitdaPercentage: number;
  sourcesUsed: {
    hasProductionData: boolean;
    hasPriceData: boolean;
    hasCostData: boolean;
  };
}

export async function getProductionCalculations(
  organizationId: string,
  filters: ProjectionFilters = {}
): Promise<ProductionCalculations> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar áreas de plantio baseadas nos filtros
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

    const totalArea = areas?.reduce((sum, area) => sum + (area.area || 0), 0) || 0;

    // Se não há áreas, retornar zeros
    if (!areas?.length || totalArea === 0) {
      return {
        totalArea: 0,
        averageProductivity: 0,
        productivityUnit: 'Sc/ha',
        totalProduction: 0,
        averageCostPerHa: 0,
        totalCost: 0,
        averagePrice: 0,
        totalRevenue: 0,
        ebitda: 0,
        ebitdaPercentage: 0,
        sourcesUsed: {
          hasProductionData: false,
          hasPriceData: false,
          hasCostData: false,
        },
      };
    }

    // 2. Buscar produtividades baseadas nos filtros
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

    // 3. Buscar custos baseados nos filtros
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

    // 4. Buscar preços do módulo de indicadores
    const { data: commodityPrices, error: pricesError } = await supabase
      .from('commodity_price_projections')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (pricesError) throw pricesError;

    // 5. Calcular métricas

    // Produtividade média ponderada por área
    let totalWeightedProductivity = 0;
    let totalAreaWithProductivity = 0;
    let productivityUnit = 'Sc/ha';

    areas.forEach(area => {
      const matchingProd = productivities?.find(p => 
        p.cultura_id === area.cultura_id && 
        p.sistema_id === area.sistema_id &&
        (!p.safra_id || p.safra_id === area.safra_id)
      );

      if (matchingProd && area.area) {
        totalWeightedProductivity += (matchingProd.produtividade || 0) * area.area;
        totalAreaWithProductivity += area.area;
        productivityUnit = matchingProd.unidade || 'Sc/ha';
      }
    });

    const averageProductivity = totalAreaWithProductivity > 0 
      ? totalWeightedProductivity / totalAreaWithProductivity 
      : 0;

    // Produção total
    const totalProduction = totalArea * averageProductivity;

    // Custo médio por hectare
    const totalCostValue = costs?.reduce((sum, cost) => sum + (cost.valor || 0), 0) || 0;
    const costsPerCombination = costs?.reduce((acc, cost) => {
      const key = `${cost.cultura_id}_${cost.sistema_id}_${cost.safra_id || 'all'}`;
      acc[key] = (acc[key] || 0) + (cost.valor || 0);
      return acc;
    }, {} as Record<string, number>) || {};

    let totalWeightedCost = 0;
    let totalAreaWithCost = 0;

    areas.forEach(area => {
      const keys = [
        `${area.cultura_id}_${area.sistema_id}_${area.safra_id}`,
        `${area.cultura_id}_${area.sistema_id}_all`,
      ];

      const matchingCost = keys.find(key => costsPerCombination[key]);
      if (matchingCost && area.area) {
        totalWeightedCost += costsPerCombination[matchingCost] * area.area;
        totalAreaWithCost += area.area;
      }
    });

    const averageCostPerHa = totalAreaWithCost > 0 
      ? totalWeightedCost / totalAreaWithCost 
      : 0;

    const totalCost = totalArea * averageCostPerHa;

    // Preço médio baseado nas culturas selecionadas (do módulo de indicadores)
    let averagePrice = 0;
    let totalWeightedPrice = 0;
    let totalAreaWithPrice = 0;

    if (commodityPrices && commodityPrices.length > 0) {
      // Para cada área, buscar o preço correspondente à cultura
      areas.forEach(area => {
        const culturaNome = area.culturas?.nome?.toUpperCase();
        let price = 0;

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

        if (price > 0 && area.area) {
          totalWeightedPrice += price * area.area;
          totalAreaWithPrice += area.area;
        }
      });

      // Calcular preço médio ponderado por área
      averagePrice = totalAreaWithPrice > 0 
        ? totalWeightedPrice / totalAreaWithPrice 
        : 50; // Fallback R$ 50/saca
    } else {
      // Fallback se não houver preços cadastrados
      averagePrice = 50; // R$ 50/saca como estimativa padrão
    }

    // Receita total
    const totalRevenue = totalProduction * averagePrice;

    // EBITDA
    const ebitda = totalRevenue - totalCost;
    const ebitdaPercentage = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

    return {
      totalArea,
      averageProductivity,
      productivityUnit,
      totalProduction,
      averageCostPerHa,
      totalCost,
      averagePrice,
      totalRevenue,
      ebitda,
      ebitdaPercentage,
      sourcesUsed: {
        hasProductionData: (productivities?.length || 0) > 0,
        hasPriceData: (commodityPrices?.length || 0) > 0,
        hasCostData: (costs?.length || 0) > 0,
      },
    };

  } catch (error) {
    console.error('Error calculating projections:', error);
    throw new Error('Erro ao calcular projeções');
  }
}