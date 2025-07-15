"use server";

import { createClient } from "@/lib/supabase/server";

export interface FinancialHistoricalMetricData {
  safra: string;
  valor: number;
  safraId: string;
  ano: number;
  isProjetado: boolean;
}

export interface FinancialHistoricalMetricsResponse {
  data: FinancialHistoricalMetricData[];
  metricName: string;
  unit: string;
  currentValue: number;
  realizadoData: FinancialHistoricalMetricData[];
  projetadoData: FinancialHistoricalMetricData[];
  crescimentoRealizado: number;
  crescimentoProjetado: number;
  periodoRealizado: string;
  periodoProjetado: string;
}

export type FinancialMetricType = 'dividaReceita' | 'dividaEbitda' | 'dividaLiquidaReceita' | 'dividaLiquidaEbitda';

export async function getFinancialHistoricalMetricData(
  organizationId: string,
  metricType: FinancialMetricType,
  projectionId?: string
): Promise<FinancialHistoricalMetricsResponse> {
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
    const historicalData: FinancialHistoricalMetricData[] = [];
    const currentYear = new Date().getFullYear();

    // OTIMIZAÇÃO: Usar a função getDebtPosition que já busca todos os dados necessários de uma vez
    // em vez de fazer múltiplas chamadas separadas por safra
    try {
      const { getDebtPosition } = await import("./debt-position-actions");
      const debtPosition = await getDebtPosition(organizationId, projectionId);
      
      // Mapear safras para usar os dados pré-calculados de debtPosition
      for (const safra of safras) {
        let valor = 0;
        const isProjetado = safra.ano_inicio >= currentYear;
        const safraName = safra.nome;
        
        // Usar os dados pré-calculados do debtPosition para cada indicador
        switch (metricType) {
          case 'dividaReceita':
            valor = debtPosition.indicadores.indicadores_calculados.divida_receita[safraName] || 0;
            break;
          case 'dividaEbitda':
            valor = debtPosition.indicadores.indicadores_calculados.divida_ebitda[safraName] || 0;
            break;
          case 'dividaLiquidaReceita':
            valor = debtPosition.indicadores.indicadores_calculados.divida_liquida_receita[safraName] || 0;
            break;
          case 'dividaLiquidaEbitda':
            valor = debtPosition.indicadores.indicadores_calculados.divida_liquida_ebitda[safraName] || 0;
            break;
          default:
            valor = 0;
        }

        historicalData.push({
          safra: safraName,
          valor: valor,
          safraId: safra.id,
          ano: safra.ano_inicio,
          isProjetado: isProjetado
        });
      }
    } catch (err) {
      console.error("Erro ao usar getDebtPosition para métricas, usando fallback:", err);
      
      // Fallback para o método original caso a otimização falhe
      for (const safra of safras) {
        let valor = 0;
        const isProjetado = safra.ano_inicio >= currentYear;

        // Buscar dados necessários para calcular o indicador
        const dividaTotal = await getDividaTotal(supabase, organizationId, safra.id);
        const dividaLiquida = await getDividaLiquida(supabase, organizationId, safra.id);
        const receita = await getReceita(supabase, organizationId, safra.id);
        const ebitda = await getEbitda(supabase, organizationId, safra.id);

        // Calcular o valor do indicador baseado no tipo
        switch (metricType) {
          case 'dividaReceita':
            valor = receita > 0 ? dividaTotal / receita : 0;
            break;
          case 'dividaEbitda':
            // Calculate ratio even when EBITDA is negative to show true financial situation
            valor = ebitda !== 0 ? dividaTotal / ebitda : 0;
            break;
          case 'dividaLiquidaReceita':
            valor = receita > 0 ? dividaLiquida / receita : 0;
            break;
          case 'dividaLiquidaEbitda':
            // Calculate ratio even when EBITDA is negative to show true financial situation
            valor = ebitda !== 0 ? dividaLiquida / ebitda : 0;
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
    }

    // 3. Separar dados realizados e projetados
    const realizadoData = historicalData.filter(item => !item.isProjetado);
    const projetadoData = historicalData.filter(item => item.isProjetado);

    // 4. Calcular crescimento para cada período
    let crescimentoRealizado = 0;
    let crescimentoProjetado = 0;
    let periodoRealizado = "";
    let periodoProjetado = "";

    // Crescimento realizado - comparar primeira e última safra com dados válidos
    const realizadoComDados = realizadoData.filter(item => item.valor > 0);
    if (realizadoComDados.length >= 2) {
      const primeiraRealizada = realizadoComDados[0];
      const ultimaRealizada = realizadoComDados[realizadoComDados.length - 1];
      if (primeiraRealizada.valor > 0) {
        crescimentoRealizado = ((ultimaRealizada.valor - primeiraRealizada.valor) / primeiraRealizada.valor) * 100;
      }
      periodoRealizado = `${primeiraRealizada.safra} - ${ultimaRealizada.safra}`;
    }

    // Crescimento projetado
    const projetadoComDados = projetadoData.filter(item => item.valor > 0);
    if (projetadoComDados.length >= 2) {
      // Se há múltiplas projeções com dados, calcular entre primeira e última
      const primeiraProjetada = projetadoComDados[0];
      const ultimaProjetada = projetadoComDados[projetadoComDados.length - 1];
      if (primeiraProjetada.valor > 0) {
        crescimentoProjetado = ((ultimaProjetada.valor - primeiraProjetada.valor) / primeiraProjetada.valor) * 100;
      }
      periodoProjetado = `${primeiraProjetada.safra} - ${ultimaProjetada.safra}`;
    } else if (projetadoComDados.length >= 1 && realizadoComDados.length >= 1) {
      // Se há apenas uma projeção, comparar com o último dado realizado
      const lastRealizado = realizadoComDados[realizadoComDados.length - 1];
      const firstProjetado = projetadoComDados[0];
      if (lastRealizado.valor > 0) {
        crescimentoProjetado = ((firstProjetado.valor - lastRealizado.valor) / lastRealizado.valor) * 100;
      }
      periodoProjetado = `${lastRealizado.safra} - ${firstProjetado.safra}`;
    }

    // Valor atual - pegar o último valor válido (maior que 0)
    let currentValue = 0;
    // Procurar de trás para frente o último valor válido
    for (let i = historicalData.length - 1; i >= 0; i--) {
      if (historicalData[i].valor > 0) {
        currentValue = historicalData[i].valor;
        break;
      }
    }

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
    console.error("Erro ao buscar dados históricos do indicador financeiro:", error);
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

// Função para buscar dívida total por safra
async function getDividaTotal(
  supabase: any,
  organizationId: string,
  safraId: string
): Promise<number> {
  try {
    // Importar função de cálculo da posição de dívida
    const { getDebtPosition } = await import("./debt-position-actions");
    
    // Buscar posição de dívida completa
    const debtPosition = await getDebtPosition(organizationId);
    
    // Encontrar a safra correspondente pelo ID
    const { data: safras } = await supabase
      .from("safras")
      .select("id, nome")
      .eq("organizacao_id", organizationId);
    
    if (!safras || safras.length === 0) {
      return 0;
    }
    
    // Encontrar o nome da safra pelo ID
    const safraAtual = safras.find((s: any) => s.id === safraId);
    if (!safraAtual) {
      return 0;
    }
    
    // Buscar endividamento total na posição de dívida
    const totalDivida = debtPosition.indicadores.endividamento_total[safraAtual.nome] || 0;
    
    return totalDivida;
  } catch (error) {
    console.error("Erro ao buscar dívida total usando debt-position:", error);
    
    // Fallback para o método antigo caso haja erro
    // Buscar dívidas bancárias
    const { data: dividasBancarias } = await supabase
      .from("dividas_bancarias")
      .select("valores_por_ano")
      .eq("organizacao_id", organizationId);
    
    // Buscar dívidas de fornecedores
    const { data: dividasFornecedores } = await supabase
      .from("dividas_fornecedores")
      .select("valores_por_safra")
      .eq("organizacao_id", organizationId);
    
    // Buscar outras dívidas
    const { data: outrasDespesas } = await supabase
      .from("outras_despesas")
      .select("valores_por_safra")
      .eq("organizacao_id", organizationId);
    
    let totalDivida = 0;
    
    // Somar valores das dívidas bancárias para a safra específica
    if (dividasBancarias) {
      dividasBancarias.forEach((divida: any) => {
        let valores = divida.valores_por_ano;
        if (typeof valores === 'string') {
          try {
            valores = JSON.parse(valores);
          } catch (e) {
            valores = {};
          }
        }
        
        if (valores && typeof valores === 'object') {
          const valor = valores[safraId] || 0;
          totalDivida += valor;
        }
      });
    }
    
    // Somar valores das dívidas de fornecedores para a safra específica
    if (dividasFornecedores) {
      dividasFornecedores.forEach((divida: any) => {
        let valores = divida.valores_por_safra;
        if (typeof valores === 'string') {
          try {
            valores = JSON.parse(valores);
          } catch (e) {
            valores = {};
          }
        }
        
        if (valores && typeof valores === 'object') {
          const valor = valores[safraId] || 0;
          totalDivida += valor;
        }
      });
    }
    
    // Somar valores de outras despesas para a safra específica
    if (outrasDespesas) {
      outrasDespesas.forEach((despesa: any) => {
        let valores = despesa.valores_por_safra;
        if (typeof valores === 'string') {
          try {
            valores = JSON.parse(valores);
          } catch (e) {
            valores = {};
          }
        }
        
        if (valores && typeof valores === 'object') {
          const valor = valores[safraId] || 0;
          totalDivida += valor;
        }
      });
    }
    
    return totalDivida;
  }
}

// Função para buscar dívida líquida por safra
async function getDividaLiquida(
  supabase: any,
  organizationId: string,
  safraId: string
): Promise<number> {
  try {
    // Importar função de cálculo da posição de dívida
    const { getDebtPosition } = await import("./debt-position-actions");
    
    // Buscar posição de dívida completa
    const debtPosition = await getDebtPosition(organizationId);
    
    // Encontrar a safra correspondente pelo ID
    const { data: safras } = await supabase
      .from("safras")
      .select("id, nome")
      .eq("organizacao_id", organizationId);
    
    if (!safras || safras.length === 0) {
      return 0;
    }
    
    // Encontrar o nome da safra pelo ID
    const safraAtual = safras.find((s: any) => s.id === safraId);
    if (!safraAtual) {
      return 0;
    }
    
    // Buscar dívida líquida na posição de dívida
    const dividaLiquida = debtPosition.indicadores.divida_liquida[safraAtual.nome] || 0;
    
    return dividaLiquida;
  } catch (error) {
    console.error("Erro ao buscar dívida líquida usando debt-position:", error);
    
    // Fallback para o método antigo caso haja erro
    // Buscar dívida total
    const dividaTotal = await getDividaTotal(supabase, organizationId, safraId);
    
    // Buscar caixa e disponibilidades
    const { data: caixaDisponibilidades } = await supabase
      .from("caixa_disponibilidades")
      .select("valores_por_safra")
      .eq("organizacao_id", organizationId);
    
    let totalCaixa = 0;
    
    // Somar valores de caixa para a safra específica
    if (caixaDisponibilidades) {
      caixaDisponibilidades.forEach((caixa: any) => {
        let valores = caixa.valores_por_safra;
        if (typeof valores === 'string') {
          try {
            valores = JSON.parse(valores);
          } catch (e) {
            valores = {};
          }
        }
        
        if (valores && typeof valores === 'object') {
          const valor = valores[safraId] || 0;
          totalCaixa += valor;
        }
      });
    }
    
    // Dívida líquida = Dívida total - Caixa e disponibilidades
    return dividaTotal - totalCaixa;
  }
}

// Função para buscar receita por safra
async function getReceita(
  supabase: any,
  organizationId: string,
  safraId: string
): Promise<number> {
  try {
    // Importar função de cálculo da posição de dívida
    const { getDebtPosition } = await import("./debt-position-actions");
    
    // Buscar posição de dívida completa (que contém receitas)
    const debtPosition = await getDebtPosition(organizationId);
    
    // Encontrar a safra correspondente pelo ID
    const { data: safras } = await supabase
      .from("safras")
      .select("id, nome")
      .eq("organizacao_id", organizationId);
    
    if (!safras || safras.length === 0) {
      return 0;
    }
    
    // Encontrar o nome da safra pelo ID
    const safraAtual = safras.find((s: any) => s.id === safraId);
    if (!safraAtual) {
      return 0;
    }
    
    // Buscar receita na posição de dívida
    const receita = debtPosition.indicadores.receita_ano_safra[safraAtual.nome] || 0;
    
    return receita;
  } catch (error) {
    console.error("Erro ao buscar receita usando debt-position:", error);
    
    // Fallback para o método antigo caso haja erro
    // Buscar projeções de receita para a safra
    const { data: projecoes } = await supabase
      .from("culture_projections")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("safra_id", safraId);
    
    let totalReceita = 0;
    
    // Calcular receita total das projeções
    if (projecoes) {
      projecoes.forEach((projecao: any) => {
        const area = projecao.area || 0;
        const produtividade = projecao.produtividade || 0;
        const preco = projecao.preco || 0;
        
        if (area > 0 && produtividade > 0 && preco > 0) {
          const receita = area * produtividade * preco;
          totalReceita += receita;
        }
      });
    }
    
    // Se não há dados de projeção, tentar buscar dados de produção real
    if (totalReceita === 0) {
      // Buscar áreas de plantio
      const { data: areas } = await supabase
        .from("areas_plantio")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      // Buscar produtividades
      const { data: produtividades } = await supabase
        .from("produtividades")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      // Buscar preços de commodities
      const { data: precos } = await supabase
        .from("commodity_price_projections")
        .select("*")
        .eq("organizacao_id", organizationId);
      
      // Cálculo similar ao usado na função calculateReceita do módulo de produção
      // (lógica simplificada para esse exemplo)
      
      if (areas && produtividades && precos) {
        const areasPorCulturaSistema = new Map();
        
        areas.forEach((area: any) => {
          const areaValue = area.areas_por_safra?.[safraId] || 0;
          if (areaValue > 0) {
            const key = `${area.cultura_id}:${area.sistema_id}`;
            areasPorCulturaSistema.set(key, (areasPorCulturaSistema.get(key) || 0) + areaValue);
          }
        });
        
        const produtividadesPorCulturaSistema = new Map();
        
        produtividades.forEach((prod: any) => {
          const prodValue = prod.produtividades_por_safra?.[safraId] || 0;
          if (prodValue > 0) {
            const key = `${prod.cultura_id}:${prod.sistema_id}`;
            produtividadesPorCulturaSistema.set(key, prodValue);
          }
        });
        
        // Para cada combinação cultura/sistema com área e produtividade
        for (const [key, area] of areasPorCulturaSistema.entries()) {
          const produtividade = produtividadesPorCulturaSistema.get(key) || 0;
          if (produtividade > 0) {
            // Get the culture and system IDs from the key
            const [culturaId, sistemaId] = key.split(':');
            
            // Get culture and system names to determine commodity type
            const { data: cultura } = await supabase
              .from("culturas")
              .select("nome")
              .eq("id", culturaId)
              .single();
            
            const { data: sistema } = await supabase
              .from("sistemas")
              .select("nome")
              .eq("id", sistemaId)
              .single();
            
            if (cultura && sistema && precos) {
              const culturaNome = cultura.nome.toUpperCase();
              const sistemaNome = sistema.nome.toUpperCase();
              
              // Determine commodity type based on culture and system
              let commodityType = '';
              if (culturaNome.includes('SOJA')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'SOJA_IRRIGADO' : 'SOJA_SEQUEIRO';
              } else if (culturaNome.includes('MILHO')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'MILHO_IRRIGADO' : 'MILHO_SEQUEIRO';
              } else if (culturaNome.includes('ALGODÃO') || culturaNome.includes('ALGODAO')) {
                commodityType = sistemaNome.includes('IRRIGADO') ? 'ALGODAO_IRRIGADO' : 'ALGODAO_SEQUEIRO';
              }
              
              // Find the price for this commodity type
              let preco = 0;
              const commodityPrice = precos.find((p: any) => {
                const pricesBySafra = p.valores_por_safra || {};
                return pricesBySafra[safraId] && p.commodity_type === commodityType;
              });
              
              if (commodityPrice && commodityPrice.valores_por_safra) {
                preco = commodityPrice.valores_por_safra[safraId] || 0;
              }
              
              // If no specific price found, try to use legacy price fields
              if (preco === 0 && precos.length > 0) {
                const legacyPrice = precos[0];
                if (culturaNome.includes('SOJA') && legacyPrice.preco_soja_brl) {
                  preco = legacyPrice.preco_soja_brl;
                } else if (culturaNome.includes('MILHO') && legacyPrice.preco_milho) {
                  preco = legacyPrice.preco_milho;
                } else if ((culturaNome.includes('ALGODÃO') || culturaNome.includes('ALGODAO')) && legacyPrice.preco_algodao_bruto) {
                  preco = legacyPrice.preco_algodao_bruto;
                }
              }
              
              totalReceita += area * produtividade * preco;
            }
          }
        }
      }
    }
    
    return totalReceita;
  }
}

// Função para buscar EBITDA por safra
async function getEbitda(
  supabase: any,
  organizationId: string,
  safraId: string
): Promise<number> {
  try {
    // Importar função de cálculo da posição de dívida
    const { getDebtPosition } = await import("./debt-position-actions");
    
    // Buscar posição de dívida completa (que contém EBITDA)
    const debtPosition = await getDebtPosition(organizationId);
    
    // Encontrar a safra correspondente pelo ID
    const { data: safras } = await supabase
      .from("safras")
      .select("id, nome")
      .eq("organizacao_id", organizationId);
    
    if (!safras || safras.length === 0) {
      return 0;
    }
    
    // Encontrar o nome da safra pelo ID
    const safraAtual = safras.find((s: any) => s.id === safraId);
    if (!safraAtual) {
      return 0;
    }
    
    // Buscar EBITDA na posição de dívida
    const ebitda = debtPosition.indicadores.ebitda_ano_safra[safraAtual.nome] || 0;
    
    return ebitda;
  } catch (error) {
    console.error("Erro ao buscar EBITDA usando debt-position:", error);
    
    // Fallback para o método antigo caso haja erro
    // Buscar receita
    const receita = await getReceita(supabase, organizationId, safraId);
    
    // Buscar custos de produção
    const { data: custos } = await supabase
      .from("custos_producao")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    let totalCustos = 0;
    
    // Somar custos para a safra específica
    if (custos) {
      custos.forEach((custo: any) => {
        let custosPorSafra = custo.custos_por_safra;
        if (typeof custosPorSafra === 'string') {
          try {
            custosPorSafra = JSON.parse(custosPorSafra);
          } catch (e) {
            custosPorSafra = {};
          }
        }
        
        if (custosPorSafra && typeof custosPorSafra === 'object') {
          const valor = custosPorSafra[safraId] || 0;
          totalCustos += valor;
        }
      });
    }
    
    // Se os custos são muito baixos em relação à receita, estimar
    if (totalCustos < receita * 0.2 && receita > 0) {
      totalCustos = receita * 0.7; // Estimativa conservadora: 70% da receita são custos
    }
    
    // EBITDA = Receita - Custos
    return receita - totalCustos;
  }
}

// Funções auxiliares para metadados
function getMetricName(metricType: FinancialMetricType): string {
  const names: Record<FinancialMetricType, string> = {
    dividaReceita: 'Dívida/Receita',
    dividaEbitda: 'Dívida/EBITDA',
    dividaLiquidaReceita: 'Dívida Líquida/Receita',
    dividaLiquidaEbitda: 'Dívida Líquida/EBITDA'
  };
  return names[metricType];
}

function getMetricUnit(metricType: FinancialMetricType): string {
  return 'x'; // Todos os indicadores são expressos como múltiplos (ex: 3,5x)
}