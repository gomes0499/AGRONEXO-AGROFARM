"use server";

import { createClient } from "@/lib/supabase/server";

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
}

export async function getProductionStats(
  organizationId: string,
  propertyIds?: string[],
  safraId?: string
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
    
    // 2. Buscar áreas de plantio com dados de cultura (filtradas por safra e propriedades)
    let plantingQuery = supabase
      .from("areas_plantio")
      .select(`
        *,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome),
        ciclo:ciclo_id(id, nome),
        safra:safra_id(id, nome, ano_inicio, ano_fim)
      `)
      .eq("organizacao_id", organizationId);
    
    // Filtrar por safra
    if (currentSafraId) {
      plantingQuery = plantingQuery.eq("safra_id", currentSafraId);
    }
    
    // Aplicar filtro de propriedades se fornecido
    if (propertyIds && propertyIds.length > 0) {
      plantingQuery = plantingQuery.in("propriedade_id", propertyIds);
    }
    
    const { data: areas, error: areasError } = await plantingQuery;
    
    if (areasError) {
      console.error("Erro ao buscar áreas de plantio:", areasError);
    }

    // 3. Buscar dados de produtividade com dados de cultura (filtrados por safra)
    let productivityQuery = supabase
      .from("produtividades")
      .select(`
        *,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome),
        safra:safra_id(id, nome, ano_inicio, ano_fim)
      `)
      .eq("organizacao_id", organizationId);
      
    // Filtrar por safra
    if (currentSafraId) {
      productivityQuery = productivityQuery.eq("safra_id", currentSafraId);
    }
    
    const { data: productivity, error: productivityError } = await productivityQuery;
    
    if (productivityError) {
      console.error("Erro ao buscar produtividade:", productivityError);
    }

    // 4. Buscar custos de produção (filtrados por safra)
    let costsQuery = supabase
      .from("custos_producao")
      .select(`
        *,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome),
        safra:safra_id(id, nome, ano_inicio, ano_fim)
      `)
      .eq("organizacao_id", organizationId);
      
    // Filtrar por safra
    if (currentSafraId) {
      costsQuery = costsQuery.eq("safra_id", currentSafraId);
    }
    
    const { data: costs, error: costsError } = await costsQuery;
    
    if (costsError) {
      console.error("Erro ao buscar custos:", costsError);
    }

    // 5. Buscar preços dos indicadores para cálculo de receita
    const { data: commodityPrices, error: commodityPricesError } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);
    
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
    
    // 7. Calcular estatísticas principais para a safra específica
    const areaPlantada = areas?.reduce((sum, area) => sum + (area.area || 0), 0) || 0;
    const totalCulturas = cultures?.length || 0;
    
    // Produtividade média
    const produtividadeMedia = productivity?.length > 0
      ? productivity.reduce((sum, prod) => sum + (prod.produtividade || 0), 0) / productivity.length
      : 0; // Zero se não houver dados
    
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
    
    // Agrupar áreas por cultura para cálculo mais preciso
    const areasPorCultura = new Map<string, {area: number, produtividade: number}>();
    
    // Processar áreas de plantio
    areas?.forEach(area => {
      const culturaNome = area.cultura?.nome?.toUpperCase() || 'SOJA';
      const areaValue = area.area || 0;
      
      // Buscar produtividade correspondente
      const produtividadeCorrespondente = productivity?.find(p => 
        p.cultura_id === area.cultura_id && 
        p.sistema_id === area.sistema_id
      );
      
      const produtividadeValue = produtividadeCorrespondente?.produtividade || 0; // Zero se não há produtividade
      
      if (areasPorCultura.has(culturaNome)) {
        const existing = areasPorCultura.get(culturaNome)!;
        areasPorCultura.set(culturaNome, {
          area: existing.area + areaValue,
          produtividade: (existing.produtividade + produtividadeValue) / 2 // média simples
        });
      } else {
        areasPorCultura.set(culturaNome, {
          area: areaValue,
          produtividade: produtividadeValue
        });
      }
    });
    
    // Calcular custo total baseado nas áreas plantadas reais com seus custos específicos
    let custoTotal = 0;
    
    areas?.forEach(area => {
      const culturaNome = area.cultura?.nome?.toUpperCase() || '';
      const areaValue = area.area || 0;
      
      // Buscar custos específicos para esta combinação cultura/sistema/safra
      const custosEspecificos = costs?.filter(custo => {
        return custo.cultura_id === area.cultura_id && 
               custo.sistema_id === area.sistema_id &&
               custo.safra_id === area.safra_id;
      }) || [];
      
      // Se há custos específicos para esta área, somar todos e multiplicar pela área
      if (custosEspecificos.length > 0) {
        const custoPorHectare = custosEspecificos.reduce((sum, custo) => sum + (custo.valor || 0), 0);
        custoTotal += custoPorHectare * areaValue;
      }
      // Se não há custos específicos, não adicionar nada (custo = 0)
    });
    
    // Calcular receita por cultura
    areasPorCultura.forEach((dados, culturaNome) => {
      const commodityTypes = culturaCommodityMap[culturaNome] || ['SOJA_SEQUEIRO'];
      
      // Buscar preço correspondente (priorizar sequeiro, depois irrigado)
      let preco = 0; // Zero se não há preço configurado
      for (const commodityType of commodityTypes) {
        const commodityPrice = commodityPrices?.find(p => p.commodity_type === commodityType);
        if (commodityPrice?.current_price) {
          preco = commodityPrice.current_price;
          break;
        }
      }
      
      // Calcular produção e receita desta cultura
      const producaoCultura = dados.area * dados.produtividade; // sacas
      const receitaCultura = producaoCultura * preco; // R$
      
      receitaTotal += receitaCultura;
      producaoTotalGlobal += producaoCultura;
    });
    
    // Se não houver dados específicos, manter receita como zero
    if (receitaTotal === 0 && areaPlantada > 0 && produtividadeMedia > 0) {
      const producaoTotal = areaPlantada * produtividadeMedia;
      const precoSoja = commodityPrices?.find(p => p.commodity_type === 'SOJA_SEQUEIRO')?.current_price || 
                        commodityPrices?.find(p => p.commodity_type === 'SOJA_IRRIGADO')?.current_price;
      
      if (precoSoja) {
        receitaTotal = producaoTotal * precoSoja;
        producaoTotalGlobal = producaoTotal;
      }
    }
    
    const receita = receitaTotal;
    
    // EBITDA
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
          
          // Buscar dados da safra anterior
          const [areasAnteriores, productivityAnterior, custsAnterior] = await Promise.all([
            supabase
              .from("areas_plantio")
              .select("area")
              .eq("organizacao_id", organizationId)
              .eq("safra_id", safraAnteriorId)
              .then(res => res.data || []),
            supabase
              .from("produtividades")
              .select("produtividade")
              .eq("organizacao_id", organizationId)
              .eq("safra_id", safraAnteriorId)
              .then(res => res.data || []),
            supabase
              .from("custos_producao")
              .select("valor")
              .eq("organizacao_id", organizationId)
              .eq("safra_id", safraAnteriorId)
              .then(res => res.data || [])
          ]);
          
          const areaAnterior = areasAnteriores.reduce((sum, area) => sum + (area.area || 0), 0);
          const produtividadeAnterior = productivityAnterior.length > 0
            ? productivityAnterior.reduce((sum, prod) => sum + (prod.produtividade || 0), 0) / productivityAnterior.length
            : 0;
          
          // Calcular custo total anterior usando a mesma lógica
          let custoTotalAnterior = 0;
          if (custsAnterior.length > 0 && areaAnterior > 0) {
            // Para simplificar, usar a média dos custos * área total
            // Em uma implementação mais completa, seria necessário buscar as áreas por cultura da safra anterior
            const custoPorHectareAnterior = custsAnterior.reduce((sum, cost) => sum + (cost.valor || 0), 0);
            custoTotalAnterior = custoPorHectareAnterior * areaAnterior;
          }
          
          // Calcular receita anterior (apenas se houver dados completos)
          let receitaAnterior = 0;
          if (areaAnterior > 0 && produtividadeAnterior > 0) {
            const producaoAnterior = areaAnterior * produtividadeAnterior;
            const precoReferencia = commodityPrices?.find(p => p.commodity_type === 'SOJA_SEQUEIRO')?.current_price;
            if (precoReferencia) {
              receitaAnterior = producaoAnterior * precoReferencia;
            }
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
    };
  }
}