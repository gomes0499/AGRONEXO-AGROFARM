"use server";

import { createClient } from "@/lib/supabase/server";

export interface CultureAreaData {
  safra: string;
  total: number;
  [cultureName: string]: number | string; // Para permitir culturas dinâmicas
}

export interface ProductivityData {
  safra: string;
  [cultureName: string]: number | string; // Para permitir culturas dinâmicas
}

export interface RevenueData {
  safra: string;
  total: number;
  [cultureName: string]: number | string; // Para permitir culturas dinâmicas
}

export interface FinancialData {
  safra: string;
  receitaTotal: number;
  custoTotal: number;
  ebitda: number;
  lucroLiquido: number;
}

export async function getAreaPlantadaChart(
  organizationId: string,
  propertyIds?: string[]
): Promise<CultureAreaData[]> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras da organização
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }
    
    if (!safras || safras.length === 0) {
      return [];
    }
    
    // 2. Para cada safra, buscar áreas plantadas por cultura
    const chartData: CultureAreaData[] = [];
    
    for (const safra of safras) {
      // Buscar áreas de plantio desta safra
      let areasQuery = supabase
        .from("areas_plantio")
        .select(`
          area,
          cultura:cultura_id(id, nome),
          sistema:sistema_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safra.id);
      
      // Aplicar filtro de propriedades se fornecido
      if (propertyIds && propertyIds.length > 0) {
        areasQuery = areasQuery.in("propriedade_id", propertyIds);
      }
      
      const { data: areas, error: areasError } = await areasQuery;
      
      if (areasError) {
        console.error(`Erro ao buscar áreas da safra ${safra.nome}:`, areasError);
        continue;
      }
      
      // Agrupar por cultura
      const culturaMap = new Map<string, number>();
      let totalSafra = 0;
      
      areas?.forEach(area => {
        const culturaNome = area.cultura?.nome || 'Não Informado';
        const sistemaNome = area.sistema?.nome || '';
        
        // Criar chave única para cultura + sistema
        let chaveCompleta = culturaNome;
        if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
          chaveCompleta = `${culturaNome} ${sistemaNome}`;
        }
        
        const areaValue = area.area || 0;
        culturaMap.set(chaveCompleta, (culturaMap.get(chaveCompleta) || 0) + areaValue);
        totalSafra += areaValue;
      });
      
      // Criar objeto para esta safra
      const safraData: CultureAreaData = {
        safra: safra.nome,
        total: totalSafra,
      };
      
      // Adicionar cada cultura como propriedade
      culturaMap.forEach((area, cultura) => {
        // Normalizar nome da cultura para usar como chave
        const chaveNormalizada = cultura
          .toUpperCase()
          .replace(/\s+/g, '')
          .replace(/[ÃÁÀÂ]/g, 'A')
          .replace(/[ÕÓÒÔ]/g, 'O')
          .replace(/[ÇC]/g, 'C')
          .replace(/[ÉÈÊ]/g, 'E')
          .replace(/[ÍÌÎ]/g, 'I')
          .replace(/[ÚÙÛ]/g, 'U');
        
        safraData[chaveNormalizada] = area;
      });
      
      chartData.push(safraData);
    }
    
    return chartData;
    
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de área plantada:", error);
    return [];
  }
}

export async function getCulturaColors(organizationId: string): Promise<Record<string, string>> {
  // Paleta expandida baseada no tom da marca #1B124E
  const variacoesCores = [
    // Tons primários da marca (roxos escuros)
    '#1B124E', // Cor original da marca
    '#2D1F6B', // Roxo escuro
    '#3F2C88', // Roxo médio escuro
    '#5139A5', // Roxo médio
    
    // Tons secundários (roxos claros e lilás)
    '#6346C2', // Roxo claro
    '#7553DF', // Lilás escuro
    '#8760FC', // Lilás médio
    '#9A6DFF', // Lilás claro
    
    // Tons terciários (lavanda e rosa lilás)
    '#AC7AFF', // Lavanda escuro
    '#BE87FF', // Lavanda médio
    '#D094FF', // Lavanda claro
    '#E2A1FF', // Rosa lilás
    
    // Tons complementares (azuis derivados)
    '#1E3A8A', // Azul escuro
    '#3B82F6', // Azul médio
    '#60A5FA', // Azul claro
    '#93C5FD', // Azul muito claro
    
    // Tons análogos (violetas e magentas)
    '#7C3AED', // Violeta escuro
    '#A855F7', // Violeta médio
    '#C084FC', // Violeta claro
    '#E879F9', // Magenta claro
    
    // Tons neutros harmonizados
    '#475569', // Cinza azulado escuro
    '#64748B', // Cinza azulado médio
    '#94A3B8', // Cinza azulado claro
    '#CBD5E1', // Cinza azulado muito claro
    
    // Tons de destaque (verdes e amarelos suaves)
    '#059669', // Verde esmeralda
    '#10B981', // Verde médio
    '#34D399', // Verde claro
    '#6EE7B7', // Verde muito claro
    
    // Tons adicionais (laranjas e vermelhos suaves)
    '#EA580C', // Laranja escuro
    '#F97316', // Laranja médio
    '#FB923C', // Laranja claro
    '#FDD3A5', // Laranja muito claro
    
    // Tons finais (rosa e vermelho suaves)
    '#DC2626', // Vermelho escuro
    '#EF4444', // Vermelho médio
    '#F87171', // Vermelho claro
    '#FCA5A5', // Vermelho muito claro
  ];

  try {
    const supabase = await createClient();
    
    // Buscar todas as culturas únicas da organização
    const { data: culturas, error } = await supabase
      .from("culturas")
      .select("nome")
      .eq("organizacao_id", organizationId);
    
    if (error) {
      console.error("Erro ao buscar culturas:", error);
      // Retornar cores padrão mesmo em caso de erro
      return {
        'SOJA': variacoesCores[0],
        'MILHO': variacoesCores[1],
        'ALGODAO': variacoesCores[2],
        'ARROZ': variacoesCores[3],
      };
    }
    
    const resultado: Record<string, string> = {};
    let corIndex = 0;
    
    // Se não há culturas, usar cores padrão
    if (!culturas || culturas.length === 0) {
      return {
        'SOJA': variacoesCores[0],
        'MILHO': variacoesCores[1],
        'ALGODAO': variacoesCores[2],
        'ARROZ': variacoesCores[3],
      };
    }
    
    culturas.forEach(cultura => {
      const nomeNormalizado = cultura.nome.toUpperCase().replace(/\s+/g, '');
      const cor = variacoesCores[corIndex % variacoesCores.length];
      resultado[nomeNormalizado] = cor;
      corIndex++;
    });
    
    return resultado;
    
  } catch (error) {
    console.error("Erro ao buscar cores das culturas:", error);
    // Retornar cores padrão em caso de erro
    return {
      'SOJA': variacoesCores[0],
      'MILHO': variacoesCores[1], 
      'ALGODAO': variacoesCores[2],
      'ARROZ': variacoesCores[3],
    };
  }
}

export async function getProdutividadeChart(
  organizationId: string,
  propertyIds?: string[]
): Promise<ProductivityData[]> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras da organização
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }
    
    if (!safras || safras.length === 0) {
      return [];
    }
    
    // 2. Para cada safra, buscar produtividade por cultura
    const chartData: ProductivityData[] = [];
    
    for (const safra of safras) {
      // Buscar produtividades desta safra
      let produtividadeQuery = supabase
        .from("produtividades")
        .select(`
          produtividade,
          unidade,
          cultura:cultura_id(id, nome),
          sistema:sistema_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safra.id);
      
      const { data: produtividades, error: produtividadeError } = await produtividadeQuery;
      
      if (produtividadeError) {
        console.error(`Erro ao buscar produtividades da safra ${safra.nome}:`, produtividadeError);
        continue;
      }
      
      // Agrupar por cultura (média das produtividades)
      const culturaMap = new Map<string, { total: number; count: number }>();
      
      produtividades?.forEach(prod => {
        const culturaNome = prod.cultura?.nome || 'Não Informado';
        const sistemaNome = prod.sistema?.nome || '';
        
        // Criar chave única para cultura + sistema
        let chaveCompleta = culturaNome;
        if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
          chaveCompleta = `${culturaNome} ${sistemaNome}`;
        }
        
        const produtividadeValue = prod.produtividade || 0;
        const current = culturaMap.get(chaveCompleta) || { total: 0, count: 0 };
        culturaMap.set(chaveCompleta, {
          total: current.total + produtividadeValue,
          count: current.count + 1
        });
      });
      
      // Criar objeto para esta safra com médias
      const safraData: ProductivityData = {
        safra: safra.nome,
      };
      
      // Adicionar cada cultura como propriedade (média)
      culturaMap.forEach((data, cultura) => {
        // Normalizar nome da cultura para usar como chave
        const chaveNormalizada = cultura
          .toUpperCase()
          .replace(/\s+/g, '')
          .replace(/[ÃÁÀÂ]/g, 'A')
          .replace(/[ÕÓÒÔ]/g, 'O')
          .replace(/[ÇC]/g, 'C')
          .replace(/[ÉÈÊ]/g, 'E')
          .replace(/[ÍÌÎ]/g, 'I')
          .replace(/[ÚÙÛ]/g, 'U');
        
        const produtividadeMedia = data.count > 0 ? data.total / data.count : 0;
        safraData[chaveNormalizada] = Math.round(produtividadeMedia * 100) / 100; // Arredondar para 2 casas decimais
      });
      
      chartData.push(safraData);
    }
    
    return chartData;
    
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de produtividade:", error);
    return [];
  }
}

export async function getReceitaChart(
  organizationId: string,
  propertyIds?: string[]
): Promise<RevenueData[]> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras da organização
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }
    
    if (!safras || safras.length === 0) {
      return [];
    }
    
    // 2. Buscar preços de commodities (usar dados atuais)
    const { data: commodityPrices, error: commodityPricesError } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (commodityPricesError) {
      console.error("Erro ao buscar preços de commodities:", commodityPricesError);
    }
    
    // Mapear nomes de culturas para tipos de commodity (igual ao KPI)
    const culturaCommodityMap: Record<string, string[]> = {
      'SOJA': ['SOJA_SEQUEIRO', 'SOJA_IRRIGADO'],
      'MILHO': ['MILHO_SEQUEIRO', 'MILHO_IRRIGADO'],
      'ALGODAO': ['ALGODAO_SEQUEIRO', 'ALGODAO_IRRIGADO'],
      'ALGODÃO': ['ALGODAO_SEQUEIRO', 'ALGODAO_IRRIGADO']
    };
    
    // 3. Para cada safra, calcular receita por cultura
    const chartData: RevenueData[] = [];
    
    for (const safra of safras) {
      // Buscar áreas de plantio desta safra
      let areasQuery = supabase
        .from("areas_plantio")
        .select(`
          *,
          cultura:cultura_id(id, nome),
          sistema:sistema_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safra.id);
      
      // Aplicar filtro de propriedades se fornecido
      if (propertyIds && propertyIds.length > 0) {
        areasQuery = areasQuery.in("propriedade_id", propertyIds);
      }
      
      const { data: areas, error: areasError } = await areasQuery;
      
      if (areasError) {
        console.error(`Erro ao buscar áreas da safra ${safra.nome}:`, areasError);
        continue;
      }
      
      // Buscar produtividades desta safra
      const { data: produtividades, error: produtividadeError } = await supabase
        .from("produtividades")
        .select(`
          *,
          cultura:cultura_id(id, nome),
          sistema:sistema_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safra.id);
      
      if (produtividadeError) {
        console.error(`Erro ao buscar produtividades da safra ${safra.nome}:`, produtividadeError);
        continue;
      }
      
      // Agrupar áreas por cultura para cálculo (igual ao KPI)
      const areasPorCultura = new Map<string, {area: number, produtividade: number}>();
      
      // Processar áreas de plantio
      areas?.forEach(area => {
        const culturaNome = area.cultura?.nome?.toUpperCase() || 'SOJA';
        const sistemaNome = area.sistema?.nome || '';
        
        // Criar chave completa (cultura + sistema para diferenciação)
        let chaveCompleta = culturaNome;
        if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
          chaveCompleta = `${culturaNome} ${sistemaNome}`;
        }
        
        const areaValue = area.area || 0;
        
        // Buscar produtividade correspondente
        const produtividadeCorrespondente = produtividades?.find(p => 
          p.cultura_id === area.cultura_id && 
          p.sistema_id === area.sistema_id
        );
        
        const produtividadeValue = produtividadeCorrespondente?.produtividade || 68.5; // sc/ha padrão
        
        if (areasPorCultura.has(chaveCompleta)) {
          const existing = areasPorCultura.get(chaveCompleta)!;
          areasPorCultura.set(chaveCompleta, {
            area: existing.area + areaValue,
            produtividade: (existing.produtividade + produtividadeValue) / 2 // média simples
          });
        } else {
          areasPorCultura.set(chaveCompleta, {
            area: areaValue,
            produtividade: produtividadeValue
          });
        }
      });
      
      // Calcular receita por cultura
      const culturaReceita = new Map<string, number>();
      let totalSafra = 0;
      
      areasPorCultura.forEach((dados, chaveCompleta) => {
        const culturaNomeBase = chaveCompleta.split(' ')[0]; // SOJA, MILHO, etc.
        const commodityTypes = culturaCommodityMap[culturaNomeBase] || ['SOJA_SEQUEIRO'];
        
        // Buscar preço correspondente ao ano da safra (priorizar sequeiro, depois irrigado)
        let preco = 120; // Preço padrão R$/saca
        for (const commodityType of commodityTypes) {
          const commodityPrice = commodityPrices?.find(p => p.commodity_type === commodityType);
          if (commodityPrice) {
            // Usar preço baseado no ano da safra
            const anoSafra = safra.ano_inicio;
            let precoSafra = null;
            
            // Mapear ano da safra para campo de preço correspondente
            switch (anoSafra) {
              case 2020:
                precoSafra = commodityPrice.price_2020;
                break;
              case 2021:
                precoSafra = commodityPrice.price_2021;
                break;
              case 2022:
                precoSafra = commodityPrice.price_2022;
                break;
              case 2023:
                precoSafra = commodityPrice.price_2023;
                break;
              case 2024:
                precoSafra = commodityPrice.price_2024;
                break;
              case 2025:
                precoSafra = commodityPrice.price_2025;
                break;
              case 2026:
                precoSafra = commodityPrice.price_2026;
                break;
              case 2027:
                precoSafra = commodityPrice.price_2027;
                break;
              case 2028:
                precoSafra = commodityPrice.price_2028;
                break;
              case 2029:
                precoSafra = commodityPrice.price_2029;
                break;
              case 2030:
                precoSafra = commodityPrice.price_2030;
                break;
              default:
                // Para anos não mapeados, usar preço atual como fallback
                precoSafra = commodityPrice.current_price;
            }
            
            // Se temos preço para o ano específico, usar ele; senão usar current_price como fallback
            if (precoSafra !== null && precoSafra !== undefined && precoSafra > 0) {
              preco = precoSafra;
              break;
            } else if (commodityPrice.current_price) {
              preco = commodityPrice.current_price;
              break;
            }
          }
        }
        
        // Calcular produção e receita desta cultura
        const producaoCultura = dados.area * dados.produtividade; // sacas
        const receitaCultura = producaoCultura * preco; // R$
        
        // Normalizar chave para o gráfico
        const chaveNormalizada = chaveCompleta
          .toUpperCase()
          .replace(/\s+/g, '')
          .replace(/[ÃÁÀÂ]/g, 'A')
          .replace(/[ÕÓÒÔ]/g, 'O')
          .replace(/[ÇC]/g, 'C')
          .replace(/[ÉÈÊ]/g, 'E')
          .replace(/[ÍÌÎ]/g, 'I')
          .replace(/[ÚÙÛ]/g, 'U');
        
        culturaReceita.set(chaveNormalizada, receitaCultura);
        totalSafra += receitaCultura;
      });
      
      // Criar objeto para esta safra
      const safraData: RevenueData = {
        safra: safra.nome,
        total: totalSafra,
      };
      
      // Adicionar cada cultura como propriedade
      culturaReceita.forEach((receita, cultura) => {
        safraData[cultura] = Math.round(receita);
      });
      
      chartData.push(safraData);
    }
    
    return chartData;
    
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de receita:", error);
    return [];
  }
}

export async function getFinancialChart(
  organizationId: string,
  propertyIds?: string[]
): Promise<FinancialData[]> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras da organização
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }
    
    if (!safras || safras.length === 0) {
      return [];
    }
    
    // 2. Buscar preços de commodities (usar dados atuais)
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
    
    // 3. Para cada safra, calcular métricas financeiras
    const chartData: FinancialData[] = [];
    
    for (const safra of safras) {
      // Buscar áreas de plantio desta safra
      let areasQuery = supabase
        .from("areas_plantio")
        .select(`
          *,
          cultura:cultura_id(id, nome),
          sistema:sistema_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safra.id);
      
      // Aplicar filtro de propriedades se fornecido
      if (propertyIds && propertyIds.length > 0) {
        areasQuery = areasQuery.in("propriedade_id", propertyIds);
      }
      
      const { data: areas, error: areasError } = await areasQuery;
      
      if (areasError) {
        console.error(`Erro ao buscar áreas da safra ${safra.nome}:`, areasError);
        continue;
      }
      
      // Buscar produtividades desta safra
      const { data: produtividades, error: produtividadeError } = await supabase
        .from("produtividades")
        .select(`
          *,
          cultura:cultura_id(id, nome),
          sistema:sistema_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safra.id);
      
      if (produtividadeError) {
        console.error(`Erro ao buscar produtividades da safra ${safra.nome}:`, produtividadeError);
        continue;
      }
      
      // Buscar custos desta safra
      const { data: custos, error: custosError } = await supabase
        .from("custos_producao")
        .select(`
          *,
          cultura:cultura_id(id, nome),
          sistema:sistema_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safra.id);
      
      if (custosError) {
        console.error(`Erro ao buscar custos da safra ${safra.nome}:`, custosError);
        continue;
      }
      
      // Calcular área total plantada
      const areaTotal = areas?.reduce((sum, area) => sum + (area.area || 0), 0) || 0;
      
      // Agrupar áreas por cultura para cálculo de receita (igual aos outros gráficos)
      const areasPorCultura = new Map<string, {area: number, produtividade: number}>();
      
      // Processar áreas de plantio
      areas?.forEach(area => {
        const culturaNome = area.cultura?.nome?.toUpperCase() || 'SOJA';
        const sistemaNome = area.sistema?.nome || '';
        
        let chaveCompleta = culturaNome;
        if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
          chaveCompleta = `${culturaNome} ${sistemaNome}`;
        }
        
        const areaValue = area.area || 0;
        
        // Buscar produtividade correspondente
        const produtividadeCorrespondente = produtividades?.find(p => 
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
            // Usar preço baseado no ano da safra
            const anoSafra = safra.ano_inicio;
            let precoSafra = null;
            
            // Mapear ano da safra para campo de preço correspondente
            switch (anoSafra) {
              case 2020:
                precoSafra = commodityPrice.price_2020;
                break;
              case 2021:
                precoSafra = commodityPrice.price_2021;
                break;
              case 2022:
                precoSafra = commodityPrice.price_2022;
                break;
              case 2023:
                precoSafra = commodityPrice.price_2023;
                break;
              case 2024:
                precoSafra = commodityPrice.price_2024;
                break;
              case 2025:
                precoSafra = commodityPrice.price_2025;
                break;
              case 2026:
                precoSafra = commodityPrice.price_2026;
                break;
              case 2027:
                precoSafra = commodityPrice.price_2027;
                break;
              case 2028:
                precoSafra = commodityPrice.price_2028;
                break;
              case 2029:
                precoSafra = commodityPrice.price_2029;
                break;
              case 2030:
                precoSafra = commodityPrice.price_2030;
                break;
              default:
                // Para anos não mapeados, usar preço atual como fallback
                precoSafra = commodityPrice.current_price;
            }
            
            // Se temos preço para o ano específico, usar ele; senão usar current_price como fallback
            if (precoSafra !== null && precoSafra !== undefined && precoSafra > 0) {
              preco = precoSafra;
              break;
            } else if (commodityPrice.current_price) {
              preco = commodityPrice.current_price;
              break;
            }
          }
        }
        
        // Calcular receita desta cultura
        const producaoCultura = dados.area * dados.produtividade;
        const receitaCultura = producaoCultura * preco;
        receitaTotal += receitaCultura;
      });
      
      // Calcular custo total baseado nas áreas plantadas reais com seus custos específicos
      let custoTotal = 0;
      
      areas?.forEach(area => {
        const areaValue = area.area || 0;
        
        // Buscar custos específicos para esta combinação cultura/sistema/safra
        const custosEspecificos = custos?.filter(custo => {
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
      
      // Calcular EBITDA
      const ebitda = receitaTotal - custoTotal;
      
      // Calcular Lucro Líquido (temporariamente metade do EBITDA)
      const lucroLiquido = ebitda * 0.5;
      
      chartData.push({
        safra: safra.nome,
        receitaTotal: Math.round(receitaTotal),
        custoTotal: Math.round(custoTotal),
        ebitda: Math.round(ebitda),
        lucroLiquido: Math.round(lucroLiquido)
      });
    }
    
    return chartData;
    
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico financeiro:", error);
    return [];
  }
}