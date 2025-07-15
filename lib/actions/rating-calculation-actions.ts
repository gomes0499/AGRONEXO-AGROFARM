"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/auth";

// Helper function to get default weights for metrics
function getDefaultWeight(codigo: string): number {
  const weights: Record<string, number> = {
    'LTV': 15,
    'DIVIDA_EBITDA': 20,
    'MARGEM_EBITDA': 15,
    'LIQUIDEZ_CORRENTE': 10,
    'DIVIDA_FATURAMENTO': 20,
    'DIVIDA_PATRIMONIO_LIQUIDO': 15,
    'ENTENDIMENTO_FLUXO_DE_CAIXA': 5,
    'AREA_PROPRIA': 4,
    'CULTURAS_CORE': 4
  };
  return weights[codigo] || 10;
}

interface RatingCalculationData {
  modelId: string;
  safraId: string;
  metrics: {
    metricId: string;
    codigo: string;
    nome: string;
    tipo: 'QUANTITATIVE' | 'QUALITATIVE';
    valor: number;
    pontuacao: number;
    nivel: string;
    peso: number;
  }[];
  pontuacaoTotal: number;
  classificacao: string;
}

interface FinancialData {
  liquidezCorrente: number;
  dividaTotal: number;
  ebitda: number;
  faturamento: number;
  patrimonioLiquido: number;
  valorEmprestimos: number;
  valorAtivos: number;
  margemEbitda: number;
}

export async function calculateRating(
  organizationId: string,
  safraId: string,
  modelId?: string
): Promise<RatingCalculationData> {
  const supabase = await createClient();

  try {
    let ratingModel;
    if (modelId) {
      const { data, error } = await supabase
        .from("rating_models")
        .select("*")
        .eq("id", modelId)
        .single();
      
      if (error) throw error;
      ratingModel = data;
    } else {
      const { data, error } = await supabase
        .from("rating_models")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("is_default", true)
        .single();
      
      if (error) {
        // If no org default, try global default
        const { data: globalDefault, error: globalError } = await supabase
          .from("rating_models")
          .select("*")
          .is("organizacao_id", null)
          .eq("is_default", true)
          .single();
        
        if (globalError) {
          // Create a temporary in-memory model if no default exists
          ratingModel = {
            id: 'temporary-model',
            nome: 'Modelo Temporário',
            descricao: 'Modelo temporário para cálculo de rating',
            is_default: true,
            organizacao_id: null
          };
        } else {
          ratingModel = globalDefault;
        }
      } else {
        ratingModel = data;
      }
    }

    // 2. Get model metrics with thresholds
    let modelMetrics;
    
    if (ratingModel.id === 'temporary-model') {
      // Use hardcoded metrics for temporary model
      const { data: allMetrics, error: metricsError } = await supabase
        .from("rating_metrics")
        .select(`
          id,
          codigo,
          nome,
          tipo,
          categoria,
          unidade,
          formula,
          rating_metric_thresholds(
            nivel,
            valor_min,
            valor_max,
            pontuacao
          )
        `);
      
      if (metricsError) throw metricsError;
      
      // Create model metrics with default weights
      modelMetrics = allMetrics.map(metric => ({
        peso: getDefaultWeight(metric.codigo),
        rating_metric: metric
      }));
    } else {
      const { data, error: metricsError } = await supabase
        .from("rating_model_metrics")
        .select(`
          peso,
          rating_metric:rating_metrics!inner(
            id,
            codigo,
            nome,
            tipo,
            categoria,
            unidade,
            formula,
            rating_metric_thresholds(
              nivel,
              valor_min,
              valor_max,
              pontuacao
            )
          )
        `)
        .eq("rating_model_id", ratingModel.id);

      if (metricsError) throw metricsError;
      modelMetrics = data;
    }

    // 3. Get financial data for calculations
    const financialData = await getFinancialData(organizationId, safraId);
    
    // 3.1 Get optimized metrics including CULTURAS_CORE and AREA_PROPRIA
    const { calculateQuantitativeMetricsOptimized } = await import("./rating-metrics-calculations");
    const optimizedMetrics = await calculateQuantitativeMetricsOptimized(organizationId, safraId);

    // 4. Calculate each metric
    const calculatedMetrics = await Promise.all(
      modelMetrics.map(async (modelMetric) => {
        const metric = modelMetric.rating_metric;
        let valor = 0;
        
        // Check if metric is qualitative first
        if ((metric as any).tipo === 'QUALITATIVE') {
          // For ALL qualitative metrics, get from qualitative_metric_values
          // First try with safra_id
          let { data: qualValue } = await supabase
            .from("qualitative_metric_values")
            .select("valor")
            .eq("organizacao_id", organizationId)
            .eq("rating_metric_id", (metric as any).id)
            .eq("safra_id", safraId)
            .eq("is_current", true)
            .single();
          
          // If not found, try without safra_id (legacy data)
          if (!qualValue) {
            const { data: legacyValue } = await supabase
              .from("qualitative_metric_values")
              .select("valor")
              .eq("organizacao_id", organizationId)
              .eq("rating_metric_id", (metric as any).id)
              .is("safra_id", null)
              .eq("is_current", true)
              .single();
            
            qualValue = legacyValue;
          }
          
          valor = qualValue?.valor || 0; // Default to 0 if not set
          
          if (!qualValue) {
          }
        } else {
          // Calculate quantitative metric value based on code
          switch ((metric as any).codigo) {
            case 'LIQUIDEZ_CORRENTE':
              valor = financialData.liquidezCorrente;
              break;
            case 'DIVIDA_EBITDA':
              // Calculate ratio even when EBITDA is negative to show true financial situation
              valor = financialData.ebitda !== 0 ? financialData.dividaTotal / financialData.ebitda : (financialData.dividaTotal > 0 ? 999 : 0);
              break;
            case 'DIVIDA_FATURAMENTO':
              valor = financialData.faturamento > 0 ? financialData.dividaTotal / financialData.faturamento : 999;
              break;
            case 'DIVIDA_PATRIMONIO_LIQUIDO':
              valor = financialData.patrimonioLiquido > 0 ? financialData.dividaTotal / financialData.patrimonioLiquido : 999;
              break;
            case 'LTV':
              valor = financialData.valorAtivos > 0 ? (financialData.valorEmprestimos / financialData.valorAtivos) * 100 : 0;
              break;
            case 'MARGEM_EBITDA':
              valor = financialData.margemEbitda;
              break;
            case 'AREA_PROPRIA':
              valor = optimizedMetrics.AREA_PROPRIA || 0;
              break;
            case 'CULTURAS_CORE':
              valor = optimizedMetrics.CULTURAS_CORE || 0;
              break;
            default:
              // For custom metrics, try to execute the formula
              if ((metric as any).formula) {
                valor = await executeFormula((metric as any).formula, financialData);
              }
          }
        }

        // Find the appropriate threshold and calculate score
        const thresholds = (metric as any).rating_metric_thresholds || [];
        let pontuacao = 0;
        let nivel = 'CRITICO';

        for (const threshold of thresholds) {
          const min = threshold.valor_min || -Infinity;
          const max = threshold.valor_max || Infinity;
          
          if (valor >= min && valor < max) {
            pontuacao = threshold.pontuacao;
            nivel = threshold.nivel;
            break;
          }
        }

        return {
          metricId: (metric as any).id,
          codigo: (metric as any).codigo,
          nome: (metric as any).nome,
          tipo: (metric as any).tipo,
          valor,
          pontuacao,
          nivel,
          peso: modelMetric.peso
        };
      })
    );

    // 5. Calculate total score
    const totalPeso = calculatedMetrics.reduce((sum, m) => sum + m.peso, 0);
    const pontuacaoTotal = calculatedMetrics.reduce((sum, m) => sum + (m.pontuacao * m.peso), 0) / totalPeso;

    // 6. Determine classification
    let classificacao = 'D';
    if (pontuacaoTotal >= 90) classificacao = 'AAA';
    else if (pontuacaoTotal >= 85) classificacao = 'AA';
    else if (pontuacaoTotal >= 80) classificacao = 'A';
    else if (pontuacaoTotal >= 75) classificacao = 'BBB';
    else if (pontuacaoTotal >= 70) classificacao = 'BB';
    else if (pontuacaoTotal >= 65) classificacao = 'B';
    else if (pontuacaoTotal >= 60) classificacao = 'CCC';
    else if (pontuacaoTotal >= 55) classificacao = 'CC';
    else if (pontuacaoTotal >= 50) classificacao = 'C';

    return {
      modelId: ratingModel.id,
      safraId,
      metrics: calculatedMetrics,
      pontuacaoTotal,
      classificacao
    };

  } catch (error) {
    console.error("Erro ao calcular rating:", error);
    throw error;
  }
}

async function getFinancialData(organizationId: string, safraId: string): Promise<FinancialData> {
  const supabase = await createClient();

  // Import the same functions used by rating metrics calculations
  const { getDebtPosition } = await import("./debt-position-actions");
  const { getCultureProjections } = await import("./culture-projections-actions");
  
  // Get safra details
  const { data: safra } = await supabase
    .from("safras")
    .select("nome, ano_inicio, ano_fim")
    .eq("id", safraId)
    .single();

  if (!safra) {
    throw new Error("Safra não encontrada");
  }

  const safraName = safra.nome;
  const anoAtual = safra.ano_fim;

  // Use the same data sources as rating metrics calculations
  const debtPosition = await getDebtPosition(organizationId);
  const cultureProjections = await getCultureProjections(organizationId);


  // Get values for the specific safra using the same logic as rating metrics
  const dividaTotal = debtPosition.indicadores.endividamento_total[safraName] || 0;
  const dividaLiquida = debtPosition.indicadores.divida_liquida[safraName] || 0;
  const patrimonioLiquido = debtPosition.indicadores.patrimonio_liquido[safraName] || 0;
  const ltv = debtPosition.indicadores.ltv[safraName] || 0;
  const caixasDisponibilidades = debtPosition.indicadores.caixas_disponibilidades[safraName] || 0;
  
  // Get financial data from culture projections (same as rating metrics)
  let receita = 0;
  let ebitda = 0;
  let custoTotal = 0;
  
  if (cultureProjections.consolidado && 
      cultureProjections.consolidado.projections_by_year && 
      cultureProjections.consolidado.projections_by_year[safraName]) {
    receita = cultureProjections.consolidado.projections_by_year[safraName].receita || 0;
    custoTotal = cultureProjections.consolidado.projections_by_year[safraName].custo_total || 0;
    ebitda = cultureProjections.consolidado.projections_by_year[safraName].ebitda || 0;
  }

  // Buscar ativo biológico para liquidez corrente
  let ativoBiologico = 0;
  if (debtPosition.indicadores.ativo_biologico && debtPosition.indicadores.ativo_biologico[safraName]) {
    ativoBiologico = debtPosition.indicadores.ativo_biologico[safraName];
  }
  
  const ativosCirculantes = caixasDisponibilidades + ativoBiologico;
  const passivosCirculantes = dividaTotal; // Simplified for now
  
  // Calcular liquidez corrente sem valor padrão
  let liquidezCorrente = 0;
  if (passivosCirculantes > 0) {
    liquidezCorrente = ativosCirculantes / passivosCirculantes;
  } else if (ativosCirculantes > 0) {
    // Se há ativos mas não há passivos, liquidez é extremamente alta
    liquidezCorrente = 999.99;
  } else {
    // Sem ativos nem passivos
    liquidezCorrente = 0;
  }

  const margemEbitda = receita > 0 ? (ebitda / receita) * 100 : 0;

  // Get asset values for LTV calculation
  const { data: properties } = await supabase
    .from("propriedades")
    .select("valor_atual")
    .eq("organizacao_id", organizationId);

  const valorPropriedades = properties?.reduce((sum, p) => sum + (p.valor_atual || 0), 0) || 0;

  const { data: equipment } = await supabase
    .from("maquinas_equipamentos")
    .select("valor_aquisicao")
    .eq("organizacao_id", organizationId);

  const valorEquipamentos = equipment?.reduce((sum, e) => sum + (e.valor_aquisicao || 0), 0) || 0;

  const valorAtivos = valorPropriedades + valorEquipamentos + ativosCirculantes;

  return {
    liquidezCorrente,
    dividaTotal,
    ebitda,
    faturamento: receita, // Use receita from culture projections
    patrimonioLiquido,
    valorEmprestimos: dividaTotal, // Simplified
    valorAtivos,
    margemEbitda
  };
}

async function executeFormula(formula: string, data: FinancialData): Promise<number> {
  // Simple formula execution (in production, use a safe expression evaluator)
  try {
    // Replace variables in formula with actual values
    let processedFormula = formula;
    Object.entries(data).forEach(([key, value]) => {
      processedFormula = processedFormula.replace(new RegExp(key, 'g'), value.toString());
    });

    // For now, return 0 for custom formulas
    // In production, implement a safe expression evaluator
    return 0;
  } catch (error) {
    console.error("Erro ao executar fórmula:", error);
    return 0;
  }
}

function getClassificationDescription(classification: string): string {
  const descriptions: Record<string, string> = {
    'AAA': 'Excelente capacidade de pagamento e gestão financeira excepcional',
    'AA': 'Ótima capacidade de pagamento e gestão financeira muito sólida',
    'A': 'Boa capacidade de pagamento e gestão financeira sólida',
    'BBB': 'Capacidade de pagamento adequada com gestão financeira satisfatória',
    'BB': 'Capacidade de pagamento moderada com alguns pontos de atenção',
    'B': 'Capacidade de pagamento limitada requerendo monitoramento',
    'CCC': 'Capacidade de pagamento vulnerável com riscos significativos',
    'CC': 'Capacidade de pagamento muito vulnerável com alto risco',
    'C': 'Capacidade de pagamento extremamente vulnerável',
    'D': 'Situação crítica com alto risco de inadimplência',
  };
  return descriptions[classification] || 'Classificação em análise';
}

export async function getRatingHistory(organizationId: string, limit = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rating_calculations")
    .select(`
      *,
      rating_model:rating_models(nome),
      safra:safras(nome, ano_inicio, ano_fim)
    `)
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}