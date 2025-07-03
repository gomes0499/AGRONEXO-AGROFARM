"use server";

import { createClient } from "@/lib/supabase/server";

export interface ProductivityByCultureAndSystem {
  produtividade: number;
  unidade: string;
  cultura: string;
  sistema: string;
}

export interface ProductionStats {
  areaPlantada: number;
  produtividadeMedia: number;
  receita: number;
  ebitda: number;
  margemEbitda: number;
  custoTotal: number;
  crescimentoArea: number;
  crescimentoProdutividade: number;
  crescimentoReceita: number;
  crescimentoCusto: number;
  totalCulturas: number;
  safraComparada?: string; // Nome da safra anterior para comparação
  temComparacao: boolean; // Se existe safra anterior para comparar
  productivityByCultureAndSystem?: ProductivityByCultureAndSystem[];
  costsByCulture?: Record<string, number>;
}

/**
 * Get production statistics using optimized SQL function (recommended)
 */
export async function getProductionStatsOptimized(
  organizationId: string,
  selectedYear?: string
): Promise<ProductionStats> {
  try {
    const supabase = await createClient();
    
    // Use the SQL function for optimized performance
    const { data, error } = await supabase.rpc('calculate_production_stats', {
      p_organization_id: organizationId,
      p_selected_year: selectedYear
    });
    
    if (error) {
      console.error('Error fetching production stats via SQL function:', error);
      // Fallback to original method if SQL function fails
      return getProductionStats(organizationId, undefined, undefined, undefined, undefined);
    }
    
    if (!data || data.length === 0) {
      return {
        areaPlantada: 0,
        produtividadeMedia: 0,
        receita: 0,
        ebitda: 0,
        margemEbitda: 0,
        custoTotal: 0,
        crescimentoArea: 0,
        crescimentoProdutividade: 0,
        crescimentoReceita: 0,
        crescimentoCusto: 0,
        totalCulturas: 0,
        temComparacao: false,
        productivityByCultureAndSystem: [],
        costsByCulture: {},
      };
    }
    
    // Aggregate data from all safras
    const totals = data.reduce((acc: any, safraData: any) => {
      return {
        areaPlantada: acc.areaPlantada + Number(safraData.area_total || 0),
        receita: acc.receita + Number(safraData.receita_total || 0),
        custoTotal: acc.custoTotal + Number(safraData.custo_total || 0),
        ebitda: acc.ebitda + Number(safraData.ebitda || 0),
        count: acc.count + 1
      };
    }, { areaPlantada: 0, receita: 0, custoTotal: 0, ebitda: 0, count: 0 });
    
    // Calculate averages
    const produtividadeMedia = data.length > 0 
      ? data.reduce((sum: number, d: any) => sum + Number(d.produtividade_media || 0), 0) / data.length
      : 0;
    
    const margemEbitda = totals.receita > 0 ? (totals.ebitda / totals.receita) * 100 : 0;
    
    // Get growth data from the latest two safras
    const latestSafra = data[data.length - 1];
    const previousSafra = data.length > 1 ? data[data.length - 2] : null;
    
    const crescimentoArea = previousSafra 
      ? Number(latestSafra.crescimento_area || 0)
      : 0;
    const crescimentoReceita = previousSafra 
      ? Number(latestSafra.crescimento_receita || 0)
      : 0;
    const crescimentoCusto = previousSafra && Number(previousSafra.custo_total) > 0
      ? ((Number(latestSafra.custo_total) - Number(previousSafra.custo_total)) / Number(previousSafra.custo_total)) * 100
      : 0;
    
    // Get total cultures count
    const { data: cultures } = await supabase
      .from("culturas")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    return {
      areaPlantada: totals.areaPlantada,
      produtividadeMedia,
      receita: totals.receita,
      ebitda: totals.ebitda,
      margemEbitda,
      custoTotal: totals.custoTotal,
      crescimentoArea,
      crescimentoProdutividade: 0, // TODO: Calculate from SQL function
      crescimentoReceita,
      crescimentoCusto,
      totalCulturas: cultures?.length || 0,
      safraComparada: previousSafra?.safra_nome,
      temComparacao: previousSafra !== null,
      productivityByCultureAndSystem: [], // TODO: Get from detailed query
      costsByCulture: {}, // TODO: Get from detailed query
    };
  } catch (error) {
    console.error("Error in optimized production stats:", error);
    // Fallback to original method
    return getProductionStats(organizationId, undefined, undefined, undefined, undefined);
  }
}

export async function getProductionStats(
  organizationId: string,
  propertyIds?: string[],
  projectionId?: string,
  safraId?: string,
  cultureIds?: string[]
): Promise<ProductionStats> {
  try {
    const supabase = await createClient();
    
    // 1. Determinar safra atual se não fornecida
    let currentSafraId = safraId;
    if (!currentSafraId) {
      const currentYear = new Date().getFullYear();
      const { data: currentSafra } = await supabase
        .from("safras")
        .select("id")
        .eq("organizacao_id", organizationId)
        .eq("ano_inicio", currentYear)
        .single();
      
      if (currentSafra) {
        currentSafraId = currentSafra.id;
      } else {
        // Se não existe safra atual, buscar a mais recente
        const { data: latestSafra } = await supabase
          .from("safras")
          .select("id")
          .eq("organizacao_id", organizationId)
          .order("ano_inicio", { ascending: false })
          .limit(1)
          .single();
        currentSafraId = latestSafra?.id;
      }
    }
    
    // Buscar todas as safras para referência
    const { data: safras } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    // 2. Buscar áreas de plantio com dados de cultura (com novo formato JSONB areas_por_safra)
    const tableName = projectionId ? "areas_plantio_projections" : "areas_plantio";
    let plantingQuery = supabase
      .from(tableName)
      .select(projectionId ? `
        *,
        culturas:cultura_id(id, nome),
        sistemas:sistema_id(id, nome),
        ciclos:ciclo_id(id, nome)
      ` : `
        *,
        propriedades:propriedade_id(nome),
        culturas:cultura_id(id, nome),
        sistemas:sistema_id(id, nome),
        ciclos:ciclo_id(id, nome)
      `)
      .eq("organizacao_id", organizationId);
    
    // Adicionar filtro de projection_id se usando tabela de projeções
    if (projectionId) {
      plantingQuery = plantingQuery.eq("projection_id", projectionId);
    }
    
    // Aplicar filtro de propriedades se fornecido (apenas para tabela principal)
    if (propertyIds && propertyIds.length > 0 && !projectionId) {
      plantingQuery = plantingQuery.in("propriedade_id", propertyIds);
    }
    
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      plantingQuery = plantingQuery.in("cultura_id", cultureIds);
    }
    
    const { data: areas, error: areasError } = await plantingQuery;
    
    if (areasError) {
      console.error("Erro ao buscar áreas de plantio:", areasError);
    }

    // 3. Buscar dados de produtividade com dados de cultura (com novo formato JSONB produtividades_por_safra)
    const productivityTableName = projectionId ? "produtividades_projections" : "produtividades";
    let productivityQuery = supabase
      .from(productivityTableName)
      .select(projectionId ? `
        *,
        culturas:cultura_id(id, nome),
        sistemas:sistema_id(id, nome)
      ` : `
        *,
        propriedades:propriedade_id(nome),
        culturas:cultura_id(id, nome),
        sistemas:sistema_id(id, nome)
      `)
      .eq("organizacao_id", organizationId);
    
    // Adicionar filtro de projection_id se usando tabela de projeções
    if (projectionId) {
      productivityQuery = productivityQuery.eq("projection_id", projectionId);
    }
      
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      productivityQuery = productivityQuery.in("cultura_id", cultureIds);
    }
      
    const { data: productivity, error: productivityError } = await productivityQuery;
    
    if (productivityError) {
      console.error("Erro ao buscar produtividade:", productivityError);
    }

    // 4. Buscar custos de produção (com novo formato JSONB custos_por_safra)
    const costsTableName = projectionId ? "custos_producao_projections" : "custos_producao";
    let costsQuery = supabase
      .from(costsTableName)
      .select(projectionId ? `
        *,
        culturas:cultura_id(id, nome),
        sistemas:sistema_id(id, nome)
      ` : `
        *,
        propriedades:propriedade_id(nome),
        culturas:cultura_id(id, nome),
        sistemas:sistema_id(id, nome)
      `)
      .eq("organizacao_id", organizationId);
    
    // Adicionar filtro de projection_id se usando tabela de projeções
    if (projectionId) {
      costsQuery = costsQuery.eq("projection_id", projectionId);
    }
      
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      costsQuery = costsQuery.in("cultura_id", cultureIds);
    }
      
    const { data: costs, error: costsError } = await costsQuery;
    
    if (costsError) {
      console.error("Erro ao buscar custos:", costsError);
    }

    // 5. Buscar preços dos indicadores para cálculo de receita
    let commodityPricesQuery = supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    // Adicionar filtro de projection_id
    if (projectionId) {
      commodityPricesQuery = commodityPricesQuery.eq("projection_id", projectionId);
    } else {
      commodityPricesQuery = commodityPricesQuery.is("projection_id", null);
    }
    
    const { data: commodityPrices, error: commodityPricesError } = await commodityPricesQuery;
    
    if (commodityPricesError) {
      console.error("Erro ao buscar preços de commodities:", commodityPricesError);
    }

    // 6. Buscar culturas para contagem
    const { data: cultures, error: culturesError } = await supabase
      .from("culturas")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (culturesError) {
      console.error("Erro ao buscar culturas:", culturesError);
    }
    
    // 7. Calcular estatísticas principais para a safra específica usando JSONB
    // Calcular área plantada total para a safra selecionada
    let areaPlantada = 0;
    if (areas && currentSafraId) {
      areaPlantada = areas.reduce((sum, area) => {
        // Buscar a área para a safra selecionada no JSONB areas_por_safra
        const areaSafra = (area as any).areas_por_safra?.[currentSafraId] || 0;
        return sum + areaSafra;
      }, 0);
    }
    
    const totalCulturas = cultures?.length || 0;
    
    // Produtividade média considerando o formato JSONB
    let produtividadeMedia = 0;
    let countProdutividades = 0;
    
    if (productivity && currentSafraId) {
      productivity.forEach(prod => {
        // Obter o valor de produtividade do formato JSONB para a safra selecionada
        const prodSafra = (prod as any).produtividades_por_safra?.[currentSafraId];
        
        if (prodSafra) {
          // Pode ser um número ou um objeto { produtividade, unidade }
          const prodValue = typeof prodSafra === 'number' 
            ? prodSafra 
            : (prodSafra as { produtividade: number; unidade: string }).produtividade;
          
          if (prodValue > 0) {
            produtividadeMedia += prodValue;
            countProdutividades++;
          }
        }
      });
      
      // Calcular média se houver valores
      if (countProdutividades > 0) {
        produtividadeMedia = produtividadeMedia / countProdutividades;
      }
    }
    
    // Calcular receita por cultura considerando área plantada, produtividade e preços
    let receitaTotal = 0;
    let producaoTotalGlobal = 0;
    
    // Mapear nomes de culturas para tipos de commodity
    const culturaCommodityMap: Record<string, string[]> = {
      'SOJA': ['SOJA_SEQUEIRO', 'SOJA_IRRIGADO'],
      'MILHO': ['MILHO_SEQUEIRO', 'MILHO_IRRIGADO'],
      'ALGODAO': ['ALGODAO_SEQUEIRO', 'ALGODAO_IRRIGADO'],
      'ALGODÃO': ['ALGODAO_SEQUEIRO', 'ALGODAO_IRRIGADO']
    };
    
    // Agrupar áreas e produtividades por cultura e sistema para cálculo mais preciso
    const combinacoesCulturasSistemas = new Map<string, {
      cultura_id: string, 
      sistema_id: string,
      culturaNome: string,
      sistemaNome: string,
      cicloNome: string,  // Added cicloNome property
      area: number, 
      produtividade: number
    }>();
    
    // Processar áreas de plantio usando o novo formato JSONB
    if (areas && currentSafraId) {
      areas.forEach(area => {
        const cultura_id = (area as any).cultura_id;
        const sistema_id = (area as any).sistema_id;
        const culturaNome = (area as any).culturas?.nome?.toUpperCase() || 'DESCONHECIDA';
        const sistemaNome = (area as any).sistemas?.nome || 'SEQUEIRO';
        const cicloNome = (area as any).ciclos?.nome || '';
        const areaValue = (area as any).areas_por_safra?.[currentSafraId] || 0;
        
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
    }
    
    // Adicionar produtividades às combinações
    if (productivity && currentSafraId) {
      productivity.forEach(prod => {
        const key = `${(prod as any).cultura_id}:${(prod as any).sistema_id}`;
        
        if (combinacoesCulturasSistemas.has(key)) {
          const combo = combinacoesCulturasSistemas.get(key)!;
          
          // Obter o valor de produtividade do formato JSONB
          let produtividadeValue = 0;
          const prodSafra = (prod as any).produtividades_por_safra?.[currentSafraId];
          
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
    }
    
    // Calcular custo total baseado nas áreas plantadas reais com seus custos específicos (formato JSONB)
    let custoTotal = 0;
    
    if (costs && currentSafraId) {
      // Para cada combinação de cultura/sistema que temos área
      for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
        // Se não há área, pular
        if (combo.area <= 0) continue;
        
        // Buscar custos específicos para esta combinação cultura/sistema
        const custosEspecificos = costs.filter(custo => 
          (custo as any).cultura_id === combo.cultura_id && 
          (custo as any).sistema_id === combo.sistema_id
        );
        
        // Se há custos específicos, calcular o custo total
        if (custosEspecificos.length > 0) {
          let custoPorHectareTotal = 0;
          
          custosEspecificos.forEach(custo => {
            // Buscar o valor do custo para a safra específica no JSONB
            const custoSafra = currentSafraId && (custo as any).custos_por_safra ? 
            (custo as any).custos_por_safra[currentSafraId] || 0 : 0;
            custoPorHectareTotal += custoSafra;
          });
          
          // Os custos já são por hectare, então multiplicar pela área
          custoTotal += custoPorHectareTotal * combo.area;
        }
      }
    }
    
    // Calcular receita total
    receitaTotal = 0;
    producaoTotalGlobal = 0;
    
    // Para cada combinação cultura/sistema, calcular receita
    for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
      // Se não há área ou produtividade, pular
      if (combo.area <= 0 || combo.produtividade <= 0) continue;
      
      // Determinar tipo de commodity baseado na cultura, sistema e ciclo
      // Por enquanto, vamos procurar por qualquer preço que corresponda à cultura_id e sistema_id
      // Isso torna o sistema dinâmico sem depender de commodity types hardcoded
      
      const culturaNome = combo.culturaNome;
      const sistemaNome = combo.sistemaNome;
      const cicloNome = combo.cicloNome || '';
      
      // Primeiro, tentar encontrar preço por cultura_id e sistema_id (abordagem dinâmica)
      let preco = 0;
      
      if (commodityPrices && commodityPrices.length > 0 && currentSafraId) {
        // Procurar preço que corresponda à cultura_id e sistema_id
        const precoPorIds = commodityPrices.find(p => 
          (p as any).cultura_id === combo.cultura_id && 
          (p as any).sistema_id === combo.sistema_id
        );
        
        if (precoPorIds && precoPorIds.precos_por_ano) {
          preco = precoPorIds.precos_por_ano[currentSafraId] || 0;
        }
        
        // Se não encontrou por IDs, tentar pela abordagem de commodity_type (fallback)
        if (preco <= 0) {
          let commodityType = '';
          let culturaNomeLC = culturaNome.toLowerCase();
          let cicloNomeLC = cicloNome.toLowerCase();
          
          if (culturaNomeLC.includes('soja')) {
            commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'SOJA_IRRIGADO' : 'SOJA_SEQUEIRO';
          } else if (culturaNomeLC.includes('milho')) {
            // Detectar se é Milho Safrinha ou Milho comum
            if (culturaNomeLC.includes('safrinha') || cicloNomeLC.includes('safrinha')) {
              commodityType = 'MILHO_SAFRINHA';
            } else {
              commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'MILHO_IRRIGADO' : 'MILHO_SEQUEIRO';
            }
          } else if (culturaNomeLC.includes('algodão') || culturaNomeLC.includes('algodao')) {
            commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'ALGODÃO_IRRIGADO' : 'ALGODÃO_SEQUEIRO';
          } else if (culturaNomeLC.includes('arroz')) {
            commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'ARROZ_IRRIGADO' : 'ARROZ_SEQUEIRO';
          } else if (culturaNomeLC.includes('sorgo')) {
            commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'SORGO_IRRIGADO' : 'SORGO_SEQUEIRO';
          } else if (culturaNomeLC.includes('feijão') || culturaNomeLC.includes('feijao')) {
            commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'FEIJÃO_IRRIGADO' : 'FEIJÃO_SEQUEIRO';
          }
          
          if (commodityType) {
            const commodityPrice = commodityPrices.find(p => p.commodity_type === commodityType);
            if (commodityPrice && commodityPrice.precos_por_ano) {
              preco = commodityPrice.precos_por_ano[currentSafraId] || 0;
            }
          }
        }
      }
      
      // Se não existe preço para esta safra, seguir a orientação de não usar fallback
      if (preco <= 0) {
        continue; // Pular esta cultura/sistema se não temos preço
      }
      
      // Calcular produção e receita desta combinação cultura/sistema
      const producaoCulturaSistema = combo.area * combo.produtividade;
      const receitaCulturaSistema = producaoCulturaSistema * preco;
      
      receitaTotal += receitaCulturaSistema;
      producaoTotalGlobal += producaoCulturaSistema;
    }
    
    // Se não conseguiu calcular a receita por combinação detalhada, não usar fallback
    // Seguindo a orientação de que se não tiver preço, é porque não tem safra
    if (receitaTotal === 0 && areaPlantada > 0 && produtividadeMedia > 0) {
      receitaTotal = 0;
      producaoTotalGlobal = 0;
    }
    
    const receita = receitaTotal;
    
    // EBITDA
    // Se o custo for extremamente baixo para uma receita significativa, 
    // podemos estimar um custo mais realista (aproximadamente 60-70% da receita para operações agrícolas)
    if (custoTotal < receita * 0.1 && receita > 1000000) {
      custoTotal = receita * 0.65; // Estimativa baseada em custos típicos do agronegócio
    }
    
    const ebitda = receita - custoTotal;
    const margemEbitda = receita > 0 ? (ebitda / receita) * 100 : 0;
    
    // 8. Buscar dados da safra anterior para calcular YoY
    let safraAnteriorId: string | null = null;
    let safraAnteriorNome: string | null = null;
    let statsAnterior = {
      areaPlantada: 0,
      produtividadeMedia: 0,
      receita: 0,
      custoTotal: 0
    };
    
    if (currentSafraId) {
      // Buscar safra anterior
      const { data: safraAtual } = await supabase
        .from("safras")
        .select("ano_inicio, ano_fim, nome")
        .eq("id", currentSafraId)
        .single();
        
      if (safraAtual) {
        const anoAnterior = safraAtual.ano_inicio - 1;
        const { data: safraAnterior } = await supabase
          .from("safras")
          .select("id, nome")
          .eq("organizacao_id", organizationId)
          .eq("ano_inicio", anoAnterior)
          .single();
          
        if (safraAnterior) {
          safraAnteriorId = safraAnterior.id;
          safraAnteriorNome = safraAnterior.nome;
          
          // Buscar dados da safra anterior (formato JSONB)
          const [areasAnteriores, productivityAnterior, custsAnterior] = await Promise.all([
            supabase
              .from(tableName)
              .select("areas_por_safra, cultura_id, sistema_id")
              .eq("organizacao_id", organizationId)
              .then(res => {
                if (projectionId && res.data) {
                  return res.data.filter((item: any) => item.projection_id === projectionId);
                }
                return res.data || [];
              }),
            supabase
              .from(productivityTableName)
              .select("produtividades_por_safra, cultura_id, sistema_id")
              .eq("organizacao_id", organizationId)
              .then(res => {
                if (projectionId && res.data) {
                  return res.data.filter((item: any) => item.projection_id === projectionId);
                }
                return res.data || [];
              }),
            supabase
              .from(costsTableName)
              .select("custos_por_safra, cultura_id, sistema_id")
              .eq("organizacao_id", organizationId)
              .then(res => {
                if (projectionId && res.data) {
                  return res.data.filter((item: any) => item.projection_id === projectionId);
                }
                return res.data || [];
              })
          ]);
          
          // Calcular área total da safra anterior usando o novo formato JSONB
          const areaAnterior = areasAnteriores.reduce((sum, area) => {
            // Ensure safraAnteriorId is not null before using it as an index
            const safraKey = safraAnteriorId as string;
            const areaValue = area.areas_por_safra?.[safraKey] || 0;
            return sum + areaValue;
          }, 0);
          
          // Calcular produtividade média da safra anterior
          let produtividadeTotal = 0;
          let countProdutividadesAnteriores = 0;
          
          productivityAnterior.forEach(prod => {
            // Ensure safraAnteriorId is not null before using it as an index
            const safraKey = safraAnteriorId as string;
            const prodSafra = prod.produtividades_por_safra?.[safraKey];
            if (prodSafra) {
              // Pode ser um número ou um objeto { produtividade, unidade }
              const prodValue = typeof prodSafra === 'number' 
                ? prodSafra 
                : (prodSafra as { produtividade: number; unidade: string }).produtividade;
                
              if (prodValue > 0) {
                produtividadeTotal += prodValue;
                countProdutividadesAnteriores++;
              }
            }
          });
          
          const produtividadeAnterior = countProdutividadesAnteriores > 0
            ? produtividadeTotal / countProdutividadesAnteriores
            : 0;
          
          // Calcular custo total anterior usando o formato JSONB
          let custoTotalAnterior = 0;
          
          if (areasAnteriores.length > 0 && custsAnterior.length > 0 && safraAnteriorId) {
            // Criar um mapa de áreas por cultura/sistema para a safra anterior
            const areasAnteriorMap = new Map();
            
            areasAnteriores.forEach(area => {
              // Ensure safraAnteriorId is not null before using it as an index
              const safraKey = safraAnteriorId as string;
              const areaSafraAnterior = area.areas_por_safra?.[safraKey] || 0;
              
              // Define area properties that need to be accessed
              const areaObj = area as unknown as { cultura_id: string; sistema_id: string; areas_por_safra: any };
              
              if (areaSafraAnterior > 0) {
                const key = `${areaObj.cultura_id}-${areaObj.sistema_id}`;
                
                if (areasAnteriorMap.has(key)) {
                  areasAnteriorMap.set(key, areasAnteriorMap.get(key) + areaSafraAnterior);
                } else {
                  areasAnteriorMap.set(key, areaSafraAnterior);
                }
              }
            });
            
            // Para cada custo, aplicar à área correspondente
            custsAnterior.forEach(custo => {
              // Ensure safraAnteriorId is not null before using it as an index
              const safraKey = safraAnteriorId as string;
              const custoSafraAnterior = custo.custos_por_safra?.[safraKey] || 0;
              
              // Define custo properties that need to be accessed
              const custoObj = custo as unknown as { cultura_id: string; sistema_id: string; custos_por_safra: any };
              
              if (custoSafraAnterior > 0) {
                const key = `${custoObj.cultura_id}-${custoObj.sistema_id}`;
                const areaRelacionada = areasAnteriorMap.get(key) || 0;
                
                custoTotalAnterior += custoSafraAnterior * areaRelacionada;
              }
            });
          }
          
          // Calcular receita anterior (apenas se houver dados completos)
          let receitaAnterior = 0;
          if (areaAnterior > 0 && produtividadeAnterior > 0 && safraAnteriorId) {
            // Buscar as áreas anteriores com mais detalhes para determinar commodity types
            let areasDetalhadasQuery = supabase
              .from(tableName)
              .select(projectionId ? `
                *,
                culturas:cultura_id(id, nome),
                sistemas:sistema_id(id, nome),
                ciclos:ciclo_id(id, nome)
              ` : `
                *,
                culturas:cultura_id(id, nome),
                sistemas:sistema_id(id, nome),
                ciclos:ciclo_id(id, nome)
              `)
              .eq("organizacao_id", organizationId);
            
            if (projectionId) {
              areasDetalhadasQuery = areasDetalhadasQuery.eq("projection_id", projectionId);
            }
            
            const { data: areasDetalhadas } = await areasDetalhadasQuery;

            // Agrupamos as áreas por cultura/sistema/ciclo para a safra anterior
            const combinacoesAnteriores = new Map<string, {
              cultura_id: string,
              sistema_id: string,
              culturaNome: string,
              sistemaNome: string,
              cicloNome: string,
              area: number
            }>();

            // Processar áreas detalhadas para a safra anterior
            if (areasDetalhadas) {
              areasDetalhadas.forEach(area => {
                // Ensure safraAnteriorId is not null before using it as an index
                const safraKey = safraAnteriorId as string;
                const areaSafraAnterior = area.areas_por_safra?.[safraKey] || 0;
                if (areaSafraAnterior <= 0) return;
                
                const key = `${area.cultura_id}:${area.sistema_id}`;
                const culturaNome = area.culturas?.nome?.toUpperCase() || 'DESCONHECIDA';
                const sistemaNome = area.sistemas?.nome || 'SEQUEIRO';
                const cicloNome = area.ciclos?.nome || '';
                
                if (combinacoesAnteriores.has(key)) {
                  const existing = combinacoesAnteriores.get(key)!;
                  combinacoesAnteriores.set(key, {
                    ...existing,
                    area: existing.area + areaSafraAnterior
                  });
                } else {
                  combinacoesAnteriores.set(key, {
                    cultura_id: area.cultura_id,
                    sistema_id: area.sistema_id,
                    culturaNome,
                    sistemaNome,
                    cicloNome,
                    area: areaSafraAnterior
                  });
                }
              });
            }
            
            // Calcular receita para cada combinação anterior
            let receitaTotalAnterior = 0;
            
            for (const [key, combo] of combinacoesAnteriores.entries()) {
              // Usar a mesma lógica dinâmica para buscar preços da safra anterior
              const culturaNome = combo.culturaNome;
              const sistemaNome = combo.sistemaNome;
              const cicloNome = combo.cicloNome || '';
              
              // Buscar preço para a safra anterior
              let precoAnterior = 0;
              
              if (commodityPrices && commodityPrices.length > 0 && safraAnteriorId) {
                const safraKey = safraAnteriorId as string;
                
                // Primeiro, tentar encontrar preço por cultura_id e sistema_id (abordagem dinâmica)
                const precoPorIds = commodityPrices.find(p => 
                  (p as any).cultura_id === combo.cultura_id && 
                  (p as any).sistema_id === combo.sistema_id
                );
                
                if (precoPorIds && precoPorIds.precos_por_ano) {
                  precoAnterior = precoPorIds.precos_por_ano[safraKey] || 0;
                }
                
                // Se não encontrou por IDs, tentar pela abordagem de commodity_type (fallback)
                if (precoAnterior <= 0) {
                  let commodityType = '';
                  let culturaNomeLC = culturaNome.toLowerCase();
                  let cicloNomeLC = cicloNome.toLowerCase();
                  
                  if (culturaNomeLC.includes('soja')) {
                    commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'SOJA_IRRIGADO' : 'SOJA_SEQUEIRO';
                  } else if (culturaNomeLC.includes('milho')) {
                    if (culturaNomeLC.includes('safrinha') || cicloNomeLC.includes('safrinha')) {
                      commodityType = 'MILHO_SAFRINHA';
                    } else {
                      commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'MILHO_IRRIGADO' : 'MILHO_SEQUEIRO';
                    }
                  } else if (culturaNomeLC.includes('algodão') || culturaNomeLC.includes('algodao')) {
                    commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'ALGODÃO_IRRIGADO' : 'ALGODÃO_SEQUEIRO';
                  } else if (culturaNomeLC.includes('arroz')) {
                    commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'ARROZ_IRRIGADO' : 'ARROZ_SEQUEIRO';
                  } else if (culturaNomeLC.includes('sorgo')) {
                    commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'SORGO_IRRIGADO' : 'SORGO_SEQUEIRO';
                  } else if (culturaNomeLC.includes('feijão') || culturaNomeLC.includes('feijao')) {
                    commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'FEIJÃO_IRRIGADO' : 'FEIJÃO_SEQUEIRO';
                  }
                  
                  if (commodityType) {
                    const commodityPrice = commodityPrices.find(p => p.commodity_type === commodityType);
                    if (commodityPrice && commodityPrice.precos_por_ano) {
                      precoAnterior = commodityPrice.precos_por_ano[safraKey] || 0;
                    }
                  }
                }
              }
              
              // Se não existe preço para esta safra anterior, pular
              if (precoAnterior <= 0) continue;
              
              // Usar a produtividade média geral, já que não temos a combinação exata
              const producaoAnterior = combo.area * produtividadeAnterior;
              const receitaCombinacaoAnterior = producaoAnterior * precoAnterior;
              
              receitaTotalAnterior += receitaCombinacaoAnterior;
            }
            
            receitaAnterior = receitaTotalAnterior;
          }
          
          statsAnterior = {
            areaPlantada: areaAnterior,
            produtividadeMedia: produtividadeAnterior,
            receita: receitaAnterior,
            custoTotal: custoTotalAnterior
          };
        }
      }
    }
    
    // Calcular crescimento YoY real apenas se há comparação válida
    const crescimentoArea = safraAnteriorId && statsAnterior.areaPlantada > 0 
      ? ((areaPlantada - statsAnterior.areaPlantada) / statsAnterior.areaPlantada) * 100
      : 0;
      
    const crescimentoProdutividade = safraAnteriorId && statsAnterior.produtividadeMedia > 0
      ? ((produtividadeMedia - statsAnterior.produtividadeMedia) / statsAnterior.produtividadeMedia) * 100
      : 0;
      
    const crescimentoReceita = safraAnteriorId && statsAnterior.receita > 0
      ? ((receita - statsAnterior.receita) / statsAnterior.receita) * 100
      : 0;
      
    const crescimentoCusto = safraAnteriorId && statsAnterior.custoTotal > 0
      ? ((custoTotal - statsAnterior.custoTotal) / statsAnterior.custoTotal) * 100
      : 0;
    
    // Populate productivityByCultureAndSystem
    const productivityByCultureAndSystem: ProductivityByCultureAndSystem[] = [];
    
    // Add productivity data for each combination
    for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
      if (combo.produtividade > 0) {
        productivityByCultureAndSystem.push({
          produtividade: combo.produtividade,
          unidade: "sc/ha", // Default unit
          cultura: combo.culturaNome,
          sistema: combo.sistemaNome
        });
      }
    }
    
    // Populate costsByCulture
    const costsByCulture: Record<string, number> = {};
    
    // Group costs by culture
    for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
      if (combo.area <= 0) continue;
      
      const cultura = combo.culturaNome;
      let culturaCusto = 0;
      
      // Find costs for this culture/system
      const custosEspecificos = costs?.filter(custo => 
        (custo as any).cultura_id === combo.cultura_id && 
        (custo as any).sistema_id === combo.sistema_id
      ) || [];
      
      // Calculate total cost for this culture/system
      if (custosEspecificos.length > 0) {
        let custoPorHectareTotal = 0;
        
        custosEspecificos.forEach(custo => {
          const custoSafra = currentSafraId && (custo as any).custos_por_safra ? 
            (custo as any).custos_por_safra[currentSafraId] || 0 : 0;
          custoPorHectareTotal += custoSafra;
        });
        
        culturaCusto = custoPorHectareTotal * combo.area;
      }
      
      // Add to or update the culture cost
      if (cultura in costsByCulture) {
        costsByCulture[cultura] += culturaCusto;
      } else {
        costsByCulture[cultura] = culturaCusto;
      }
    }

    return {
      areaPlantada,
      produtividadeMedia,
      receita,
      ebitda,
      margemEbitda,
      custoTotal,
      crescimentoArea,
      crescimentoProdutividade,
      crescimentoReceita,
      crescimentoCusto,
      totalCulturas,
      safraComparada: safraAnteriorNome || undefined,
      temComparacao: safraAnteriorId !== null,
      productivityByCultureAndSystem,
      costsByCulture,
    };

  } catch (error) {
    console.error("Erro ao calcular estatísticas de produção:", error);
    
    // Retornar dados vazios em caso de erro
    return {
      areaPlantada: 0,
      produtividadeMedia: 0,
      receita: 0,
      ebitda: 0,
      margemEbitda: 0,
      custoTotal: 0,
      crescimentoArea: 0,
      crescimentoProdutividade: 0,
      crescimentoReceita: 0,
      crescimentoCusto: 0,
      totalCulturas: 0,
      temComparacao: false,
      productivityByCultureAndSystem: [],
      costsByCulture: {},
    };
  }
}