"use server";

import { createClient } from "@/lib/supabase/server";

export interface CultureProjectionData {
  cultura_nome: string;
  sistema_nome: string;
  ciclo_nome: string;
  combination_title: string; // Ex: "PROJEÇÃO - MILHO SAFRINHA"
  section_title: string; // Ex: "SEGUNDA SAFRA - MILHO"
  tipo: 'cultura' | 'sementes' | 'consolidado'; // Novo campo para identificar o tipo
  projections_by_year: Record<string, {
    area_plantada?: number;
    produtividade?: number;
    unidade?: string;
    preco?: number;
    receita: number;
    custo_ha?: number;
    custo_total: number;
    ebitda: number;
    ebitda_percent: number;
  }>;
}

export interface ConsolidatedCultureProjections {
  projections: CultureProjectionData[];
  sementes: CultureProjectionData[]; // Nova seção para vendas de sementes
  consolidado: CultureProjectionData; // Nova seção para totais consolidados
  anos: string[];
}

export async function getCultureProjections(organizationId: string): Promise<ConsolidatedCultureProjections> {
  const supabase = await createClient();


  // Buscar todas as safras para mapear anos
  const { data: safras } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio");

  if (!safras) {
    return { 
      projections: [], 
      anos: [],
      sementes: [],
      consolidado: {
        cultura_nome: "TOTAL",
        sistema_nome: "",
        ciclo_nome: "",
        combination_title: "CONSOLIDAÇÃO GERAL",
        section_title: "TOTAIS",
        tipo: 'consolidado' as const,
        projections_by_year: {}
      }
    };
  }

  // Buscar áreas de plantio com JSONB multi-safra conforme schema
  const { data: areas, error: areasError } = await supabase
    .from("areas_plantio")
    .select(`
      id,
      areas_por_safra,
      culturas!inner(id, nome),
      sistemas!inner(id, nome),
      ciclos!inner(id, nome)
    `)
    .eq("organizacao_id", organizationId);

  if (areasError) throw areasError;

  // Buscar produtividades com JSONB multi-safra conforme schema
  const { data: produtividades, error: produtividadesError } = await supabase
    .from("produtividades")
    .select(`
      id,
      cultura_id,
      sistema_id,
      produtividades_por_safra,
      culturas!inner(id, nome),
      sistemas!inner(id, nome)
    `)
    .eq("organizacao_id", organizationId);

  if (produtividadesError) throw produtividadesError;

  // Buscar custos de produção com JSONB multi-safra conforme schema
  const { data: custos, error: custosError } = await supabase
    .from("custos_producao")
    .select(`
      id,
      cultura_id,
      sistema_id,
      custos_por_safra,
      culturas!inner(id, nome),
      sistemas!inner(id, nome)
    `)
    .eq("organizacao_id", organizationId);

  if (custosError) throw custosError;

  // Buscar preços de commodities conforme schema (incluindo MILHO_SAFRINHA)
  let precosCommodities = null;
  try {
    const { data: precosData, error: precosError } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (!precosError) {
      precosCommodities = precosData;
    }
  } catch (error) {
    console.error("Erro ao buscar preços de commodities:", error);
  }

  // Vendas de sementes removidas - módulo comercial descontinuado
  const vendasSementes: any[] = [];



  // Criar mapeamento de preços por commodity - usar precos_por_ano que contém os preços reais
  const precosMap = new Map<string, Record<string, number>>();
  precosCommodities?.forEach(preco => {
    // Usar precos_por_ano que contém os preços reais por safra ID
    if (preco.precos_por_ano) {
      precosMap.set(preco.commodity_type, preco.precos_por_ano);
    }
    // premissas_precos contém apenas metadados, não preços
    else if (preco.premissas_precos && typeof preco.premissas_precos === 'object' && 'precos' in preco.premissas_precos) {
      precosMap.set(preco.commodity_type, preco.premissas_precos.precos);
    }
  });

  const consolidated = new Map<string, CultureProjectionData>();
  const anosSet = new Set<string>();

  // Criar mapeamento de safra ID para nome
  const safraToYear = safras.reduce((acc, safra) => {
    acc[safra.id] = safra.nome;
    return acc;
  }, {} as Record<string, string>);

  areas?.forEach(area => {
    // Extract values safely with type checking
    const culturas = area.culturas as unknown as { id: string; nome: string };
    const sistemas = area.sistemas as unknown as { id: string; nome: string };
    const ciclos = area.ciclos as unknown as { id: string; nome: string };
    
    const culturaId = culturas.id;
    const sistemaId = sistemas.id;
    const culturaNome = culturas.nome;
    const sistemaNome = sistemas.nome;
    const cicloNome = ciclos.nome;

    // Encontrar produtividade correspondente (produtividades não têm ciclo_id)
    const produtividade = produtividades?.find(p => 
      p.cultura_id === culturaId &&
      p.sistema_id === sistemaId
    );

    // Encontrar custo correspondente
    const custo = custos?.find(c => 
      c.cultura_id === culturaId &&
      c.sistema_id === sistemaId
    );

    if (!produtividade || !custo) {
   
      return;
    }

    // Determinar o tipo de commodity para buscar preços
    let commodityType = "";
    let unidade = "Sc/ha";
    
    if (culturaNome.toLowerCase().includes("soja")) {
      commodityType = sistemaNome.toLowerCase().includes("irrigado") ? "SOJA_IRRIGADO" : "SOJA";
      unidade = "Sc/ha";
    } else if (culturaNome.toLowerCase().includes("milho")) {
      // Detectar se é Milho Safrinha ou Milho comum
      if (culturaNome.toLowerCase().includes("safrinha") || cicloNome.toLowerCase().includes("2")) {
        commodityType = "MILHO_SAFRINHA";
      } else {
        commodityType = "MILHO";
      }
      unidade = "Sc/ha";
    } else if (culturaNome.toLowerCase().includes("algodão")) {
      commodityType = "ALGODAO";
      unidade = "@/ha";
    } else if (culturaNome.toLowerCase().includes("arroz")) {
      commodityType = "ARROZ";
      unidade = "Sc/ha";
    } else if (culturaNome.toLowerCase().includes("sorgo")) {
      commodityType = "SORGO";
      unidade = "Sc/ha";
    } else if (culturaNome.toLowerCase().includes("feijão")) {
      commodityType = "FEIJAO";
      unidade = "Sc/ha";
    }

    const precosCommidity = precosMap.get(commodityType) || {};
    
    // Criar títulos formatados
    const culturaNomeUpper = culturaNome.toUpperCase();
    const cicloNomeUpper = cicloNome.toUpperCase();
    
    let combinationTitle = `PROJEÇÃO - ${culturaNomeUpper}`;
    if (culturaNomeUpper.includes('SAFRINHA')) {
      combinationTitle = `PROJEÇÃO - ${culturaNomeUpper}`;
    }
    
    let sectionTitle = `${culturaNomeUpper}`;
    if (cicloNomeUpper.includes('2')) {
      sectionTitle = `SEGUNDA SAFRA    ${culturaNomeUpper}`;
    } else if (cicloNomeUpper.includes('1')) {
      sectionTitle = `PRIMEIRA SAFRA    ${culturaNomeUpper}`;
    }
    
    // Processar dados por safra
    const projectionsByYear: Record<string, any> = {};
    
    safras.forEach(safra => {
      const safraId = safra.id;
      const anoNome = safra.nome;
      const areaSafra = area.areas_por_safra?.[safraId] || 0;
      const produtividadeSafra = produtividade.produtividades_por_safra?.[safraId] || 0;
      const custoSafra = custo.custos_por_safra?.[safraId] || 0;
      
   
      let precoSafra = precosCommidity[safraId] || 0;
      
      
      // Se não encontrou preço na tabela, usar valores padrão
      if (precoSafra === 0) {
        if (culturaNome.toLowerCase().includes("soja")) {
          precoSafra = 125;
        } else if (culturaNome.toLowerCase().includes("milho")) {
          // Usar preços específicos para Milho Safrinha vs Milho comum
          if (culturaNome.toLowerCase().includes("safrinha") || cicloNome.toLowerCase().includes("2")) {
            // Preços do Milho Safrinha conforme especificado
            if (anoNome === "2021/22") {
              precoSafra = 79;
            } else if (["2024/25", "2025/26", "2026/27", "2027/28", "2028/29", "2029/30"].includes(anoNome)) {
              precoSafra = 60;
            } else {
              precoSafra = 60; // padrão para anos não especificados
            }
          } else {
            precoSafra = 80; // Milho comum
          }
        } else if (culturaNome.toLowerCase().includes("algodão")) {
          precoSafra = 132;
        } else if (culturaNome.toLowerCase().includes("arroz")) {
          precoSafra = 125;
        } else if (culturaNome.toLowerCase().includes("sorgo")) {
          precoSafra = 50;
        } else if (culturaNome.toLowerCase().includes("feijão")) {
          precoSafra = 170;
        } else {
          precoSafra = 100; // preço genérico
        }
      } else {
      }

      const receita = areaSafra * produtividadeSafra * precoSafra;
      const custoTotal = areaSafra * custoSafra;
      const ebitda = receita - custoTotal;
      const ebitdaPercent = receita > 0 ? (ebitda / receita) * 100 : 0;

      anosSet.add(anoNome);

      projectionsByYear[anoNome] = {
        area_plantada: areaSafra,
        produtividade: produtividadeSafra,
        unidade,
        preco: precoSafra,
        receita,
        custo_ha: custoSafra,
        custo_total: custoTotal,
        ebitda,
        ebitda_percent: ebitdaPercent,
      };
    });

    const key = `${culturaNome}-${sistemaNome}-${cicloNome}`;
    consolidated.set(key, {
      cultura_nome: culturaNome,
      sistema_nome: sistemaNome,
      ciclo_nome: cicloNome,
      combination_title: combinationTitle,
      section_title: sectionTitle,
      tipo: 'cultura',
      projections_by_year: projectionsByYear,
    });
  });

  // Vendas de sementes removidas - módulo comercial descontinuado
  const sementesProjections: CultureProjectionData[] = [];

  // Calcular consolidação total
  const consolidadoProjections: Record<string, any> = {};
  const anos = Array.from(anosSet).sort();
  
  anos.forEach(ano => {
    let areaTotal = 0;
    let receitaTotal = 0;
    let custoTotal = 0;

    // Somar culturas
    consolidated.forEach(projection => {
      const data = projection.projections_by_year[ano];
      if (data) {
        areaTotal += data.area_plantada || 0;
        receitaTotal += data.receita || 0;
        custoTotal += data.custo_total || 0;
      }
    });

    // Vendas de sementes removidas - módulo comercial descontinuado

    const ebitda = receitaTotal - custoTotal;
    const ebitdaPercent = receitaTotal > 0 ? (ebitda / receitaTotal) * 100 : 0;

    consolidadoProjections[ano] = {
      area_plantada: areaTotal,
      receita: receitaTotal,
      custo_total: custoTotal,
      ebitda,
      ebitda_percent: ebitdaPercent,
    };
  });

  const consolidado: CultureProjectionData = {
    cultura_nome: "TOTAL",
    sistema_nome: "",
    ciclo_nome: "",
    combination_title: "CONSOLIDAÇÃO GERAL",
    section_title: "TOTAIS",
    tipo: 'consolidado',
    projections_by_year: consolidadoProjections,
  };


  return {
    projections: Array.from(consolidated.values()),
    sementes: sementesProjections,
    consolidado,
    anos,
  };
}