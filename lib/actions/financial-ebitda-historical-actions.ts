"use server";

import { createClient } from "@/lib/supabase/server";

export interface EbitdaHistoricalData {
  safra: string;
  valor: number;
  safraId: string;
  ano: number;
  isProjetado: boolean;
}

export interface EbitdaHistoricalResponse {
  data: EbitdaHistoricalData[];
  metricName: string;
  unit: string;
  currentValue: number;
  realizadoData: EbitdaHistoricalData[];
  projetadoData: EbitdaHistoricalData[];
  crescimentoRealizado: number;
  crescimentoProjetado: number;
  periodoRealizado: string;
  periodoProjetado: string;
}

export async function getEbitdaHistoricalData(
  organizationId: string,
  projectionId?: string
): Promise<EbitdaHistoricalResponse> {
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
        metricName: "EBITDA",
        unit: "R$ mil",
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
    const safras = allSafras.filter(safra => safra.ano_inicio <= 2029);

    // 2. Buscar dados de produção para calcular EBITDA
    const historicalData: EbitdaHistoricalData[] = [];
    const currentYear = new Date().getFullYear();

    for (const safra of safras) {
      const isProjetado = safra.ano_inicio >= currentYear;
      
      // Calcular receita total para a safra
      let receitaTotal = 0;
      
      // Buscar áreas de plantio
      const { data: areas } = await supabase
        .from("areas_plantio")
        .select("*, culturas!inner(nome), sistemas!inner(nome)")
        .eq("organizacao_id", organizationId);
      
      // Buscar produtividades
      const { data: produtividades } = await supabase
        .from("produtividades")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      // Buscar preços
      const { data: precos } = await supabase
        .from("commodity_price_projections")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      if (areas && produtividades && precos) {
        // Calcular receita por cultura/sistema
        for (const area of areas) {
          const areaValue = area.areas_por_safra?.[safra.id] || 0;
          if (areaValue > 0) {
            // Encontrar produtividade correspondente
            const prod = produtividades.find(p => 
              p.cultura_id === area.cultura_id && 
              p.sistema_id === area.sistema_id
            );
            
            const prodValue = prod?.produtividades_por_safra?.[safra.id] || 0;
            
            if (prodValue > 0) {
              // Determinar commodity type
              const culturaNome = area.culturas.nome.toUpperCase();
              const sistemaNome = area.sistemas.nome.toUpperCase();
              
              let commodityType = '';
              if (culturaNome.includes('SOJA')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'SOJA_IRRIGADO' : 'SOJA_SEQUEIRO';
              } else if (culturaNome.includes('MILHO')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'MILHO_IRRIGADO' : 'MILHO_SEQUEIRO';
              } else if (culturaNome.includes('ALGODÃO') || culturaNome.includes('ALGODAO')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'ALGODAO_IRRIGADO' : 'ALGODAO_SEQUEIRO';
              }
              
              // Buscar preço correspondente
              const commodityPrice = precos.find(p => p.commodity_type === commodityType);
              let preco = 0;
              
              if (commodityPrice?.valores_por_safra) {
                preco = commodityPrice.valores_por_safra[safra.id] || commodityPrice.current_price || 0;
              }
              
              // Calcular receita desta combinação
              receitaTotal += areaValue * prodValue * preco;
            }
          }
        }
      }
      
      // Buscar custos de produção
      const { data: custos } = await supabase
        .from("custos_producao")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      let custoTotal = 0;
      if (custos) {
        custos.forEach(custo => {
          const custoValue = custo.custos_por_safra?.[safra.id] || 0;
          custoTotal += custoValue;
        });
      }
      
      // Buscar outras despesas
      const { data: outrasDespesas } = await supabase
        .from("outras_despesas")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      let despesasTotal = 0;
      if (outrasDespesas) {
        outrasDespesas.forEach(despesa => {
          const despesaValue = despesa.valores_por_safra?.[safra.id] || 0;
          despesasTotal += despesaValue;
        });
      }
      
      // Calcular EBITDA
      const ebitda = receitaTotal - custoTotal - despesasTotal;
      
      historicalData.push({
        safra: safra.nome,
        valor: ebitda / 1000000, // Converter para milhões
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
      if (penultimaRealizada.valor !== 0) {
        crescimentoRealizado = ((ultimaRealizada.valor - penultimaRealizada.valor) / Math.abs(penultimaRealizada.valor)) * 100;
      }
      periodoRealizado = `${penultimaRealizada.safra} vs ${ultimaRealizada.safra}`;
    }

    // Crescimento projetado
    if (projetadoData.length >= 2) {
      const primeiraProjetada = projetadoData[0];
      const segundaProjetada = projetadoData[1];
      if (primeiraProjetada.valor !== 0) {
        crescimentoProjetado = ((segundaProjetada.valor - primeiraProjetada.valor) / Math.abs(primeiraProjetada.valor)) * 100;
      }
      periodoProjetado = `${primeiraProjetada.safra} vs ${segundaProjetada.safra}`;
    } else if (projetadoData.length >= 1 && realizadoData.length >= 1) {
      const lastRealizado = realizadoData[realizadoData.length - 1];
      const firstProjetado = projetadoData[0];
      if (lastRealizado.valor !== 0) {
        crescimentoProjetado = ((firstProjetado.valor - lastRealizado.valor) / Math.abs(lastRealizado.valor)) * 100;
      }
      periodoProjetado = `${lastRealizado.safra} vs ${firstProjetado.safra}`;
    }

    const currentValue = historicalData[historicalData.length - 1]?.valor || 0;

    return {
      data: historicalData,
      metricName: "EBITDA",
      unit: "R$ mil",
      currentValue: currentValue,
      realizadoData: realizadoData,
      projetadoData: projetadoData,
      crescimentoRealizado: crescimentoRealizado,
      crescimentoProjetado: crescimentoProjetado,
      periodoRealizado: periodoRealizado,
      periodoProjetado: periodoProjetado
    };

  } catch (error) {
    console.error("Erro ao buscar dados históricos de EBITDA:", error);
    return {
      data: [],
      metricName: "EBITDA",
      unit: "R$ mil",
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

export async function getReceitaHistoricalData(
  organizationId: string,
  projectionId?: string
): Promise<EbitdaHistoricalResponse> {
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
        metricName: "Receita",
        unit: "R$ mil",
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
    const safras = allSafras.filter(safra => safra.ano_inicio <= 2029);

    // 2. Buscar dados de produção para calcular receita
    const historicalData: EbitdaHistoricalData[] = [];
    const currentYear = new Date().getFullYear();

    for (const safra of safras) {
      const isProjetado = safra.ano_inicio >= currentYear;
      
      // Calcular receita total para a safra
      let receitaTotal = 0;
      
      // Buscar áreas de plantio
      const { data: areas } = await supabase
        .from("areas_plantio")
        .select("*, culturas!inner(nome), sistemas!inner(nome)")
        .eq("organizacao_id", organizationId);
      
      // Buscar produtividades
      const { data: produtividades } = await supabase
        .from("produtividades")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      // Buscar preços
      const { data: precos } = await supabase
        .from("commodity_price_projections")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      if (areas && produtividades && precos) {
        // Calcular receita por cultura/sistema
        for (const area of areas) {
          const areaValue = area.areas_por_safra?.[safra.id] || 0;
          if (areaValue > 0) {
            // Encontrar produtividade correspondente
            const prod = produtividades.find(p => 
              p.cultura_id === area.cultura_id && 
              p.sistema_id === area.sistema_id
            );
            
            const prodValue = prod?.produtividades_por_safra?.[safra.id] || 0;
            
            if (prodValue > 0) {
              // Determinar commodity type
              const culturaNome = area.culturas.nome.toUpperCase();
              const sistemaNome = area.sistemas.nome.toUpperCase();
              
              let commodityType = '';
              if (culturaNome.includes('SOJA')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'SOJA_IRRIGADO' : 'SOJA_SEQUEIRO';
              } else if (culturaNome.includes('MILHO')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'MILHO_IRRIGADO' : 'MILHO_SEQUEIRO';
              } else if (culturaNome.includes('ALGODÃO') || culturaNome.includes('ALGODAO')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'ALGODAO_IRRIGADO' : 'ALGODAO_SEQUEIRO';
              }
              
              // Buscar preço correspondente
              const commodityPrice = precos.find(p => p.commodity_type === commodityType);
              let preco = 0;
              
              if (commodityPrice?.valores_por_safra) {
                preco = commodityPrice.valores_por_safra[safra.id] || commodityPrice.current_price || 0;
              }
              
              // Calcular receita desta combinação
              receitaTotal += areaValue * prodValue * preco;
            }
          }
        }
      }
      
      historicalData.push({
        safra: safra.nome,
        valor: receitaTotal / 1000000, // Converter para milhões
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
      if (penultimaRealizada.valor !== 0) {
        crescimentoRealizado = ((ultimaRealizada.valor - penultimaRealizada.valor) / Math.abs(penultimaRealizada.valor)) * 100;
      }
      periodoRealizado = `${penultimaRealizada.safra} vs ${ultimaRealizada.safra}`;
    }

    // Crescimento projetado
    if (projetadoData.length >= 2) {
      const primeiraProjetada = projetadoData[0];
      const segundaProjetada = projetadoData[1];
      if (primeiraProjetada.valor !== 0) {
        crescimentoProjetado = ((segundaProjetada.valor - primeiraProjetada.valor) / Math.abs(primeiraProjetada.valor)) * 100;
      }
      periodoProjetado = `${primeiraProjetada.safra} vs ${segundaProjetada.safra}`;
    } else if (projetadoData.length >= 1 && realizadoData.length >= 1) {
      const lastRealizado = realizadoData[realizadoData.length - 1];
      const firstProjetado = projetadoData[0];
      if (lastRealizado.valor !== 0) {
        crescimentoProjetado = ((firstProjetado.valor - lastRealizado.valor) / Math.abs(lastRealizado.valor)) * 100;
      }
      periodoProjetado = `${lastRealizado.safra} vs ${firstProjetado.safra}`;
    }

    const currentValue = historicalData[historicalData.length - 1]?.valor || 0;

    return {
      data: historicalData,
      metricName: "Receita",
      unit: "R$ mil",
      currentValue: currentValue,
      realizadoData: realizadoData,
      projetadoData: projetadoData,
      crescimentoRealizado: crescimentoRealizado,
      crescimentoProjetado: crescimentoProjetado,
      periodoRealizado: periodoRealizado,
      periodoProjetado: periodoProjetado
    };

  } catch (error) {
    console.error("Erro ao buscar dados históricos de receita:", error);
    return {
      data: [],
      metricName: "Receita",
      unit: "R$ mil",
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