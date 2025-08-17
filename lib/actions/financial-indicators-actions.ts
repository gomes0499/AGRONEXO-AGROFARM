"use server";

import { createClient } from "@/lib/supabase/server";

export interface FinancialIndicatorData {
  ano: string;
  dividaReceita: number | null;
  dividaEbitda: number | null;
  dividaLucroLiquido: number | null;
  ltv: number | null;
  ltvLiquido: number | null;
  liquidezCorrente: number | null;
}

export async function getFinancialIndicatorsChart(organizationId: string): Promise<FinancialIndicatorData[]> {
  const supabase = await createClient();
  
  try {
    // 1. Buscar safras de 2024 em diante
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .gte("ano_inicio", 2024)
      .order("ano_inicio", { ascending: true });

    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }

    if (!safras || safras.length === 0) {
      return [];
    }

    // 2. Buscar preços de commodities para cálculo de receita
    const { data: commodityPrices, error: commodityPricesError } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (commodityPricesError) {
      console.error("Erro ao buscar preços de commodities:", commodityPricesError);
    }

    // Mapear nomes de culturas para tipos de commodity
    const culturaCommodityMap: Record<string, string[]> = {
      'SOJA': ['SOJA_SEQUEIRO', 'SOJA_IRRIGADO'],
      'MILHO': ['MILHO_SEQUEIRO', 'MILHO_IRRIGADO'],
      'ALGODAO': ['ALGODAO_SEQUEIRO', 'ALGODAO_IRRIGADO'],
      'ALGODÃO': ['ALGODAO_SEQUEIRO', 'ALGODAO_IRRIGADO']
    };

    const indicatorsData: FinancialIndicatorData[] = [];

    for (const safra of safras) {
      const ano = safra.ano_inicio.toString();

      // 3. Calcular total de dívidas para o ano da safra
      const [bankDebts, tradingDebts, propertyDebts] = await Promise.all([
        supabase
          .from('dividas_bancarias')
          .select('fluxo_pagamento_anual')
          .eq('organizacao_id', organizationId),
        
        supabase
          .from('dividas_trading')
          .select('fluxo_pagamento_anual')
          .eq('organizacao_id', organizationId),
        
        supabase
          .from('dividas_imoveis')
          .select('fluxo_pagamento_anual')
          .eq('organizacao_id', organizationId)
      ]);

      let totalDividas = 0;
      
      // Somar TODAS as dívidas bancárias (todos os anos)
      bankDebts.data?.forEach(debt => {
        const fluxo = debt.fluxo_pagamento_anual || {};
        // Somar todos os anos do fluxo
        Object.values(fluxo).forEach((valor: any) => {
          totalDividas += valor || 0;
        });
      });
      
      // Somar TODAS as dívidas trading (todos os anos)
      tradingDebts.data?.forEach(debt => {
        const fluxo = debt.fluxo_pagamento_anual || {};
        // Somar todos os anos do fluxo
        Object.values(fluxo).forEach((valor: any) => {
          totalDividas += valor || 0;
        });
      });
      
      // Somar TODAS as dívidas de imóveis (todos os anos)
      propertyDebts.data?.forEach(debt => {
        const fluxo = debt.fluxo_pagamento_anual || {};
        // Somar todos os anos do fluxo
        Object.values(fluxo).forEach((valor: any) => {
          totalDividas += valor || 0;
        });
      });

      // 4. Calcular receita usando o mesmo método da aba de produção
      const [areas, produtividades, custos] = await Promise.all([
        supabase
          .from("areas_plantio")
          .select(`
            *,
            cultura:cultura_id(id, nome),
            sistema:sistema_id(id, nome)
          `)
          .eq("organizacao_id", organizationId)
          .eq("safra_id", safra.id),
        
        supabase
          .from("produtividades")
          .select(`
            *,
            cultura:cultura_id(id, nome),
            sistema:sistema_id(id, nome)
          `)
          .eq("organizacao_id", organizationId)
          .eq("safra_id", safra.id),
        
        supabase
          .from("custos_producao")
          .select(`
            *,
            cultura:cultura_id(id, nome),
            sistema:sistema_id(id, nome)
          `)
          .eq("organizacao_id", organizationId)
          .eq("safra_id", safra.id)
      ]);

      // Agrupar áreas por cultura para cálculo de receita
      const areasPorCultura = new Map<string, {area: number, produtividade: number}>();
      
      areas.data?.forEach(area => {
        const culturaNome = (area.cultura as any)?.nome?.toUpperCase() || 'SOJA';
        const sistemaNome = (area.sistema as any)?.nome || '';
        
        let chaveCompleta = culturaNome;
        if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
          chaveCompleta = `${culturaNome} ${sistemaNome}`;
        }
        
        const areaValue = area.area || 0;
        
        // Buscar produtividade correspondente
        const produtividadeCorrespondente = produtividades.data?.find(p => 
          p.cultura_id === area.cultura_id && 
          p.sistema_id === area.sistema_id
        );
        
        const produtividadeValue = produtividadeCorrespondente?.produtividade || 68.5;
        
        if (areasPorCultura.has(chaveCompleta)) {
          const existing = areasPorCultura.get(chaveCompleta)!;
          areasPorCultura.set(chaveCompleta, {
            area: existing.area + areaValue,
            produtividade: (existing.produtividade + produtividadeValue) / 2
          });
        } else {
          areasPorCultura.set(chaveCompleta, {
            area: areaValue,
            produtividade: produtividadeValue
          });
        }
      });

      // Calcular receita total
      let receitaTotal = 0;
      
      areasPorCultura.forEach((dados, chaveCompleta) => {
        const culturaNomeBase = chaveCompleta.split(' ')[0];
        const commodityTypes = culturaCommodityMap[culturaNomeBase] || ['SOJA_SEQUEIRO'];
        
        // Buscar preço correspondente ao ano da safra
        let preco = 120; // Preço padrão R$/saca
        for (const commodityType of commodityTypes) {
          const commodityPrice = commodityPrices?.find(p => p.commodity_type === commodityType);
          if (commodityPrice) {
            const anoSafra = safra.ano_inicio;
            let precoSafra = null;
            
            // Mapear ano da safra para campo de preço correspondente
            switch (anoSafra) {
              case 2024: precoSafra = commodityPrice.price_2024; break;
              case 2025: precoSafra = commodityPrice.price_2025; break;
              case 2026: precoSafra = commodityPrice.price_2026; break;
              case 2027: precoSafra = commodityPrice.price_2027; break;
              case 2028: precoSafra = commodityPrice.price_2028; break;
              case 2029: precoSafra = commodityPrice.price_2029; break;
              case 2030: precoSafra = commodityPrice.price_2030; break;
              default: precoSafra = commodityPrice.current_price;
            }
            
            if (precoSafra !== null && precoSafra !== undefined && precoSafra > 0) {
              preco = precoSafra;
              break;
            } else if (commodityPrice.current_price) {
              preco = commodityPrice.current_price;
              break;
            }
          }
        }
        
        const producaoCultura = dados.area * dados.produtividade;
        const receitaCultura = producaoCultura * preco;
        receitaTotal += receitaCultura;
      });

      // 5. Calcular custo total usando a mesma lógica da aba de produção
      let custoTotal = 0;
      
      areas.data?.forEach(area => {
        const areaValue = area.area || 0;
        
        const custosEspecificos = custos.data?.filter(custo => {
          return custo.cultura_id === area.cultura_id && 
                 custo.sistema_id === area.sistema_id &&
                 custo.safra_id === area.safra_id;
        }) || [];
        
        if (custosEspecificos.length > 0) {
          const custoPorHectare = custosEspecificos.reduce((sum, custo) => sum + (custo.valor || 0), 0);
          custoTotal += custoPorHectare * areaValue;
        }
      });

      // 6. Calcular EBITDA e Lucro Líquido usando a mesma lógica da aba de produção
      const ebitda = receitaTotal - custoTotal;
      const lucroLiquido = ebitda * 0.5; // 50% do EBITDA como na aba de produção

      // 7. Calcular indicadores
      const dividaReceita = receitaTotal > 0 ? totalDividas / receitaTotal : null;
      const dividaEbitda = ebitda > 0 ? totalDividas / ebitda : null;
      const dividaLucroLiquido = lucroLiquido > 0 ? totalDividas / lucroLiquido : null;

      // 8. Calcular LTV e LTV Líquido (valores decimais)
      // Para o gráfico, vamos buscar dos indicadores consolidados se disponível
      const { data: debtPosition } = await supabase.rpc('get_debt_position_data', {
        p_organization_id: organizationId
      });
      
      let ltv = null;
      let ltvLiquido = null;
      let liquidezCorrente = null;
      
      if (debtPosition && debtPosition.length > 0) {
        const indicators = debtPosition[0].indicadores;
        if (indicators.ltv && indicators.ltv[safra.id]) {
          ltv = indicators.ltv[safra.id] / 100; // Converter para decimal
        }
        if (indicators.ltv_liquido && indicators.ltv_liquido[safra.id]) {
          ltvLiquido = indicators.ltv_liquido[safra.id] / 100; // Converter para decimal
        }
        if (indicators.caixas_disponibilidades && indicators.caixas_disponibilidades[safra.id]) {
          const caixa = indicators.caixas_disponibilidades[safra.id];
          liquidezCorrente = totalDividas > 0 ? caixa / totalDividas : null;
        }
      }

      indicatorsData.push({
        ano,
        dividaReceita,
        dividaEbitda,
        dividaLucroLiquido,
        ltv,
        ltvLiquido,
        liquidezCorrente
      });
    }

    return indicatorsData.filter(item => 
      item.dividaReceita !== null || 
      item.dividaEbitda !== null || 
      item.dividaLucroLiquido !== null ||
      item.ltv !== null ||
      item.ltvLiquido !== null ||
      item.liquidezCorrente !== null
    );

  } catch (error) {
    console.error('Erro ao buscar indicadores financeiros:', error);
    return [];
  }
}

export async function getFinancialIndicatorsBenchmarks(): Promise<{
  dividaReceita: { ideal: number; aceitavel: number; critico: number };
  dividaEbitda: { ideal: number; aceitavel: number; critico: number };
  dividaLucroLiquido: { ideal: number; aceitavel: number; critico: number };
}> {
  // Benchmarks típicos para agronegócio
  return {
    dividaReceita: {
      ideal: 0.3,    // Até 30% da receita
      aceitavel: 0.5, // Até 50% da receita
      critico: 0.7    // Acima de 70% da receita
    },
    dividaEbitda: {
      ideal: 2.0,     // Até 2x o EBITDA
      aceitavel: 3.5, // Até 3.5x o EBITDA
      critico: 5.0    // Acima de 5x o EBITDA
    },
    dividaLucroLiquido: {
      ideal: 5.0,     // Até 5x o lucro líquido
      aceitavel: 8.0, // Até 8x o lucro líquido
      critico: 12.0   // Acima de 12x o lucro líquido
    }
  };
}