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

export async function getCultureProjections(organizationId: string, projectionId?: string): Promise<ConsolidatedCultureProjections> {
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
  const tableName = projectionId ? "areas_plantio_projections" : "areas_plantio";
  let areasQuery = supabase
    .from(tableName)
    .select(`
      id,
      areas_por_safra,
      culturas!inner(id, nome),
      sistemas!inner(id, nome),
      ciclos!inner(id, nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (projectionId) {
    areasQuery = areasQuery.eq("projection_id", projectionId);
  }
  
  const { data: areas, error: areasError } = await areasQuery;

  if (areasError) throw areasError;

  // Buscar produtividades com JSONB multi-safra conforme schema
  const prodTableName = projectionId ? "produtividades_projections" : "produtividades";
  let prodQuery = supabase
    .from(prodTableName)
    .select(`
      id,
      cultura_id,
      sistema_id,
      ciclo_id,
      produtividades_por_safra,
      culturas!inner(id, nome),
      sistemas!inner(id, nome),
      ciclos!inner(id, nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (projectionId) {
    prodQuery = prodQuery.eq("projection_id", projectionId);
  }
  
  const { data: produtividades, error: produtividadesError } = await prodQuery;

  if (produtividadesError) throw produtividadesError;

  // Buscar custos de produção com JSONB multi-safra conforme schema
  const custosTableName = projectionId ? "custos_producao_projections" : "custos_producao";
  let custosQuery = supabase
    .from(custosTableName)
    .select(`
      id,
      cultura_id,
      sistema_id,
      ciclo_id,
      categoria,
      custos_por_safra,
      culturas!inner(id, nome),
      sistemas!inner(id, nome),
      ciclos!inner(id, nome)
    `)
    .eq("organizacao_id", organizationId);
  
  if (projectionId) {
    custosQuery = custosQuery.eq("projection_id", projectionId);
  }
  
  const { data: custos, error: custosError } = await custosQuery;

  if (custosError) throw custosError;

  // Buscar preços de commodities conforme schema (incluindo MILHO_SAFRINHA)
  let precosCommodities = null;
  try {
    let precosQuery = supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      precosQuery = precosQuery.eq("projection_id", projectionId);
    } else {
      precosQuery = precosQuery.is("projection_id", null);
    }
    
    const { data: precosData, error: precosError } = await precosQuery;
    
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

    // Encontrar produtividade correspondente
    const produtividade = produtividades?.find(p => 
      p.cultura_id === culturaId &&
      p.sistema_id === sistemaId &&
      p.ciclo_id === ciclos.id
    );

    // Encontrar custo correspondente - custos são agregados por todas as categorias
    const custosRelacionados = custos?.filter(c => 
      c.cultura_id === culturaId &&
      c.sistema_id === sistemaId &&
      c.ciclo_id === ciclos.id
    ) || [];

    // Agregar custos de todas as categorias
    const custoAgregado: Record<string, number> = {};
    custosRelacionados.forEach(c => {
      Object.entries(c.custos_por_safra || {}).forEach(([safraId, valor]) => {
        custoAgregado[safraId] = (custoAgregado[safraId] || 0) + (Number(valor) || 0);
      });
    });

    if (!produtividade) {
      return;
    }
    
    // Se não há custos, usar zero
    if (custosRelacionados.length === 0) {
      safras.forEach(safra => {
        custoAgregado[safra.id] = 0;
      });
    }

    // Determinar o tipo de commodity para buscar preços
    let commodityType = "";
    let unidade = "Sc/ha";
    
    if (culturaNome.toLowerCase().includes("soja")) {
      // Para soja, sempre usar SOJA_SEQUEIRO ou SOJA_IRRIGADO baseado no sistema
      commodityType = sistemaNome.toLowerCase().includes("irrigado") ? "SOJA_IRRIGADO" : "SOJA_SEQUEIRO";
      unidade = "Sc/ha";
    } else if (culturaNome.toLowerCase().includes("milho")) {
      // Para milho, usar apenas MILHO_SEQUEIRO ou MILHO_IRRIGADO
      // A diferenciação entre 1ª safra e safrinha será feita pelos preços
      commodityType = sistemaNome.toLowerCase().includes("irrigado") ? "MILHO_IRRIGADO" : "MILHO_SEQUEIRO";
      unidade = "Sc/ha";
    } else if (culturaNome.toLowerCase().includes("algod")) {
      commodityType = sistemaNome.toLowerCase().includes("irrigado") ? "ALGODÃO_IRRIGADO" : "ALGODÃO_SEQUEIRO";
      unidade = "@/ha";
    } else if (culturaNome.toLowerCase().includes("arroz")) {
      commodityType = sistemaNome.toLowerCase().includes("irrigado") ? "ARROZ_IRRIGADO" : "ARROZ_SEQUEIRO";
      unidade = "Sc/ha";
    } else if (culturaNome.toLowerCase().includes("sorgo")) {
      commodityType = sistemaNome.toLowerCase().includes("irrigado") ? "SORGO_IRRIGADO" : "SORGO_SEQUEIRO";
      unidade = "Sc/ha";
    } else if (culturaNome.toLowerCase().includes("feijão")) {
      commodityType = sistemaNome.toLowerCase().includes("irrigado") ? "FEIJÃO_IRRIGADO" : "FEIJÃO_SEQUEIRO";
      unidade = "Sc/ha";
    }

    const precosCommidity = precosMap.get(commodityType) || {};
    
    // Criar títulos formatados
    const culturaNomeUpper = culturaNome.toUpperCase();
    const cicloNomeUpper = cicloNome.toUpperCase();
    
    // Determinar qual safra está sendo mostrada (1ª SAFRA, 2ª SAFRA, SAFRINHA, etc)
    let safraLabel = "";
    if (cicloNomeUpper.includes('SAFRINHA')) {
      safraLabel = "SAFRINHA";
    } else if (cicloNomeUpper.includes('2') || cicloNomeUpper.includes('SEGUNDA')) {
      safraLabel = "2ª SAFRA";
    } else if (cicloNomeUpper.includes('1') || cicloNomeUpper.includes('PRIMEIRA')) {
      safraLabel = "1ª SAFRA";
    } else if (cicloNomeUpper.includes('3') || cicloNomeUpper.includes('TERCEIRA')) {
      safraLabel = "3ª SAFRA";
    }
    
    // Adicionar sistema ao título
    const sistemaNomeUpper = sistemaNome.toUpperCase();
    
    let combinationTitle = `PROJEÇÃO - ${culturaNomeUpper} ${sistemaNomeUpper}`;
    if (safraLabel) {
      combinationTitle = `PROJEÇÃO - ${culturaNomeUpper} ${sistemaNomeUpper} - ${safraLabel}`;
    }
    if (culturaNomeUpper.includes('SAFRINHA')) {
      combinationTitle = `PROJEÇÃO - ${culturaNomeUpper} ${sistemaNomeUpper}`;
    }
    
    let sectionTitle = `${culturaNomeUpper}`;
    if (cicloNomeUpper.includes('SAFRINHA')) {
      sectionTitle = `SAFRINHA - ${culturaNomeUpper}`;
    } else if (cicloNomeUpper.includes('2')) {
      sectionTitle = `SEGUNDA SAFRA - ${culturaNomeUpper}`;
    } else if (cicloNomeUpper.includes('1')) {
      sectionTitle = `PRIMEIRA SAFRA - ${culturaNomeUpper}`;
    }
    
    // Processar dados por safra
    const projectionsByYear: Record<string, any> = {};
    
    safras.forEach(safra => {
      const safraId = safra.id;
      const anoNome = safra.nome;
      const areaSafra = area.areas_por_safra?.[safraId] || 0;
      
      // Lidar com formato híbrido de produtividade
      let produtividadeSafra = 0;
      const prodData = produtividade.produtividades_por_safra?.[safraId];
      if (typeof prodData === 'number') {
        produtividadeSafra = prodData;
      } else if (prodData && typeof prodData === 'object' && 'produtividade' in prodData) {
        produtividadeSafra = prodData.produtividade;
      }
      
      const custoSafra = custoAgregado[safraId] || 0;
      
   
      let precoSafra = precosCommidity[safraId] || 0;
      
      // Para milho, precisamos diferenciar entre 1ª safra, 2ª safra e safrinha
      if (culturaNome.toLowerCase().includes("milho") && precoSafra === 0) {
        if (cicloNome.toLowerCase().includes("safrinha")) {
          // Preços específicos para Milho Safrinha
          if (anoNome === "2021/22") {
            precoSafra = 79;
          } else if (["2024/25", "2025/26", "2026/27", "2027/28", "2028/29", "2029/30"].includes(anoNome)) {
            precoSafra = 60;
          }
        } else if (cicloNome.toLowerCase().includes("1")) {
          // Preços para Milho 1ª Safra
          if (anoNome === "2021/22") {
            precoSafra = 72;
          } else if (anoNome === "2022/23") {
            precoSafra = 49.40;
          } else if (anoNome === "2023/24") {
            precoSafra = 54;
          }
        }
        // Para 2ª Safra (que não é safrinha), usar os mesmos preços base
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