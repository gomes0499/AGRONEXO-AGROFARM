// VERSÃO PÚBLICA PARA API - SEM AUTENTICAÇÃO
// EM PRODUÇÃO, ADICIONE API KEY OU TOKEN

import { createClient } from "@/lib/supabase/server";
import { cleanPropertyName } from "@/lib/utils/property-name-cleaner";
import { getCultureProjections } from "./culture-projections-actions";
import { getOutrasDespesas } from "./financial-actions/outras-despesas";
import { getReceitasFinanceiras } from "./financial-actions/receitas-financeiras-actions";
import { getCotacoesCambio } from "./financial-actions/cotacoes-cambio-actions";
import { getCaixaDisponibilidades } from "./financial-actions/caixa-disponibilidades";
import { getSuppliersUnified } from "./financial-liquidity-actions";
import { getEquipments } from "./patrimonio-actions";
import { getFluxoCaixaSimplificado } from "./projections-actions/fluxo-caixa-simplificado";
import { getDebtPosition } from "./debt-position-actions";
import { getFinancialMetrics } from "./financial-metrics-actions";
import { getTotalDividasBancariasConsolidado } from "./financial-actions/dividas-bancarias";
import { getDebtTypeDistributionAllSafrasData } from "./debt-type-distribution-all-safras-actions";
import { getDebtTypeDistributionData } from "./debt-type-distribution-actions";
// Funções de DRE e Balanço requerem autenticação, então vamos calcular diretamente

// Interface completa para exportação de dados
export interface ReportDataJSON {
  organization: {
    id: string;
    nome: string;
    cpf?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: any;
    socios?: any[];
    generatedAt: string;
  };
  financialKpis?: {
    dividaBancaria: number;
    dividaBancariaPercentual: number;
    outrosPassivos: number;
    outrosPassivosPercentual: number;
    dividaLiquida: number;
    dividaLiquidaPercentual: number;
    prazoMedio: number;
    prazoMedioDiferenca: number;
  };
  properties: {
    stats: {
      totalFazendas: number;
      totalProprias: number;
      totalArrendadas: number;
      areaTotal: number;
      areaPropria: number;
      areaArrendada: number;
      areaPercentualPropria: number;
      areaPercentualArrendada: number;
      valorPatrimonial: number;
      areaCultivavel: number;
    };
    list: Array<{
      nome: string;
      nomeClean: string;
      valor_atual: number;
      area_total: number;
      area_cultivada: number;
      tipo: string;
    }>;
  };
  plantingAreas: {
    chartData: Array<{
      safra: string;
      total: number;
      culturas: { [key: string]: number };
    }>;
    tableData: Array<{
      cultura: string;
      sistema: string;
      ciclo: string;
      areas: { [safra: string]: number };
    }>;
  };
  productivity: {
    chartData: Array<{
      safra: string;
      culturas: { [key: string]: number };
    }>;
    tableData: Array<{
      cultura: string;
      sistema: string;
      ciclo: string;
      produtividades: { [safra: string]: number };
    }>;
  };
  revenue: {
    chartData: Array<{
      safra: string;
      total: number;
      culturas: { [key: string]: number };
    }>;
    tableData: Array<{
      categoria: string;
      receitas: { [safra: string]: number };
    }>;
  };
  financialEvolution: Array<{
    safra: string;
    receita: number;
    custo: number;
    lucro: number;
    margem: number;
  }>;
  debts: {
    debtBySafra: Array<{
      safra: string;
      valor: number;
    }>;
    debtDistribution2025: Array<{
      name: string;
      value: number;
    }>;
    debtDistribution2025_26: Array<{
      name: string;
      value: number;
    }>;
    debtDistributionConsolidated: Array<{
      name: string;
      value: number;
    }>;
    totalConsolidado?: {
      total_brl: number;
      total_usd: number;
      total_consolidado_brl: number;
      taxa_cambio: number;
      quantidade_contratos: number;
    };
    list: Array<{
      id: string;
      banco: string;
      tipo: string;
      valor_original: number;
      saldo_devedor: number;
      safra_quitacao: string;
      data_vencimento: string;
      taxa_juros: number;
    }>;
  };
  economicIndicators: {
    data: Array<{
      safra: string;
      margem: number;
      rentabilidade: number;
    }>;
    tableData: Array<{
      safra: string;
      receita_bruta: number;
      custo_total: number;
      lucro_liquido: number;
      margem_liquida: number;
      roi: number;
    }>;
  };
  investments: Array<{
    id: string;
    descricao: string;
    tipo: string;
    valor: number;
    ano: number;
    status: string;
  }>;
  arrendamentos: Array<{
    id: string;
    propriedade_nome: string;
    area: number;
    valor_hectare: number;
    valor_total: number;
    forma_pagamento: string;
    safra_inicio: string;
    safra_fim: string;
  }>;
  cashFlowProjection: {
    anos: string[];
    receitas_agricolas: {
      culturas: Record<string, Record<string, number>>;
      culturas_detalhado?: Record<string, Record<string, { area: number; produtividade: number; preco: number; }>>;
      total_por_ano: Record<string, number>;
    };
    despesas_agricolas: {
      culturas: Record<string, Record<string, number>>;
      culturas_detalhado?: Record<string, Record<string, Record<string, number>>>;
      total_por_ano: Record<string, number>;
    };
    outras_despesas: {
      arrendamento: Record<string, number>;
      arrendamento_detalhado?: Record<string, Record<string, number>>;
      pro_labore: Record<string, number>;
      divisao_lucros: Record<string, number>;
      financeiras: Record<string, number>;
      financeiras_detalhado?: Record<string, Record<string, number>>;
      tributarias: Record<string, number>;
      outras: Record<string, number>;
      outras_detalhado?: Record<string, Record<string, number>>;
      total_por_ano: Record<string, number>;
    };
    ebitda: Record<string, number>;
    fluxo_atividade: Record<string, number>;
    fluxo_operacional: Record<string, number>;
    investimentos: {
      total: Record<string, number>;
      terras: Record<string, number>;
      maquinarios: Record<string, number>;
      maquinarios_detalhado?: Record<string, Record<string, number>>;
      outros: Record<string, number>;
      outros_detalhado?: Record<string, Record<string, number>>;
    };
    financeiras: {
      servico_divida: Record<string, number>;
      pagamentos_bancos: Record<string, number>;
      novas_linhas_credito: Record<string, number>;
      total_por_ano: Record<string, number>;
      dividas_bancarias: Record<string, number>;
      dividas_bancarias_detalhado?: Record<string, Record<string, number>>;
      dividas_terras: Record<string, number>;
      dividas_terras_detalhado?: Record<string, Record<string, number>>;
      dividas_fornecedores: Record<string, number>;
      dividas_fornecedores_detalhado?: Record<string, Record<string, number>>;
      divida_total_consolidada: Record<string, number>;
      saldo_devedor: Record<string, number>;
    };
    fluxo_liquido: Record<string, number>;
    fluxo_acumulado: Record<string, number>;
    fluxo_liquido_sem_pagamento_divida: Record<string, number>;
    fluxo_acumulado_sem_pagamento_divida: Record<string, number>;
    politica_caixa: {
      ativa: boolean;
      valor_minimo: number | null;
      moeda: "BRL" | "USD";
      prioridade: "debt" | "cash";
      alertas: Record<string, {
        abaixo_minimo: boolean;
        valor_faltante: number;
      }>;
    };
  };
  dre: Array<{
    ano: number;
    receita_bruta: number;
    deducoes: number;
    receita_liquida: number;
    custos_vendas: number;
    lucro_bruto: number;
    despesas_operacionais: number;
    lucro_operacional: number;
    resultado_financeiro: number;
    lucro_antes_impostos: number;
    impostos: number;
    lucro_liquido: number;
  }>;
  balanceSheet: {
    anos: string[];
    ativo: {
      circulante: {
        caixa_bancos: Record<string, number>;
        clientes: Record<string, number>;
        adiantamentos_fornecedores: Record<string, number>;
        estoques: {
          defensivos: Record<string, number>;
          fertilizantes: Record<string, number>;
          almoxarifado: Record<string, number>;
          commodities: Record<string, number>;
          sementes: Record<string, number>;
          total: Record<string, number>;
        };
        emprestimos_terceiros: Record<string, number>;
        outros_ativos_circulantes: Record<string, number>;
        total: Record<string, number>;
      };
      nao_circulante: {
        investimentos: Record<string, number>;
        imobilizado: {
          terras: Record<string, number>;
          maquinas_equipamentos: Record<string, number>;
          veiculos: Record<string, number>;
          benfeitorias: Record<string, number>;
          depreciacao_acumulada: Record<string, number>;
          outros_imobilizados: Record<string, number>;
          total: Record<string, number>;
        };
        total: Record<string, number>;
      };
      total: Record<string, number>;
    };
    passivo: {
      circulante: {
        fornecedores: Record<string, number>;
        emprestimos_financiamentos_curto_prazo: Record<string, number>;
        adiantamentos_clientes: Record<string, number>;
        impostos_taxas: Record<string, number>;
        outros_passivos_circulantes: Record<string, number>;
        total: Record<string, number>;
      };
      nao_circulante: {
        emprestimos_financiamentos_longo_prazo: Record<string, number>;
        financiamentos_terras: Record<string, number>;
        arrendamentos: Record<string, number>;
        outros_passivos_nao_circulantes: Record<string, number>;
        total: Record<string, number>;
      };
      patrimonio_liquido: {
        capital_social: Record<string, number>;
        reservas: Record<string, number>;
        lucros_acumulados: Record<string, number>;
        total: Record<string, number>;
      };
      total: Record<string, number>;
    };
  };
  inventario: Array<{
    id: string;
    tipo: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
    safra: string;
  }>;
  benfeitorias: Array<{
    id: string;
    tipo: string;
    descricao: string;
    quantidade: number;
    unidade_medida: string;
    valor: number;
    propriedade_id: string;
  }>;
  caixaDisponibilidades: Array<{
    id: string;
    categoria: string;
    descricao: string;
    valores_por_ano: Record<string, number>;
  }>;
  fornecedores: Array<{
    id: string;
    nome: string;
    tipo: string;
    valores_por_ano: Record<string, number>;
  }>;
  equipamentos: Array<{
    id: string;
    tipo: string;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    ano_aquisicao: number;
  }>;
  liquidityIndicators: {
    indicadores: {
      liquidez_corrente: Record<string, number>;
      liquidez_seca: Record<string, number>;
      liquidez_geral: Record<string, number>;
      endividamento_geral: Record<string, number>;
      imobilizacao_patrimonio: Record<string, number>;
      capital_giro: Record<string, number>;
      necessidade_capital_giro: Record<string, number>;
    };
  };
  debtPosition: {
    dividas: Array<{
      categoria: string;
      valores_por_ano: Record<string, number>;
    }>;
    indicadores: {
      endividamento_total: Record<string, number>;
      divida_liquida: Record<string, number>;
      dividas_cp: Record<string, number>;
      dividas_lp: Record<string, number>;
      servico_divida: Record<string, number>;
      cobertura_juros: Record<string, number>;
      receita_ano_safra: Record<string, number>;
      ebitda_ano_safra: Record<string, number>;
      indicadores_calculados: {
        divida_receita: Record<string, number>;
        divida_ebitda: Record<string, number>;
        divida_liquida_receita: Record<string, number>;
        divida_liquida_ebitda: Record<string, number>;
      };
    };
  };
}

export async function exportReportDataAsJSONPublic(
  organizationId: string, 
  projectionId?: string
): Promise<ReportDataJSON> {
  try {
    const supabase = await createClient();
    
    // Buscar dados da organização
    const { data: organization, error } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (error || !organization) {
      throw new Error("Organização não encontrada");
    }
    
    // Os sócios estão no campo estrutura_societaria da organização (JSONB)

    // Buscar dados das propriedades
    const { data: properties } = await supabase
      .from("propriedades")
      .select("*")
      .eq("organizacao_id", organizationId);

    const { data: benfeitorias } = await supabase
      .from("benfeitorias")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Calcular estatísticas das propriedades
    const totalFazendas = properties?.length || 0;
    const areaTotal = properties?.reduce((sum, prop) => sum + (prop.area_total || 0), 0) || 0;
    
    const propriasProprias = properties?.filter(p => p.tipo === "PROPRIO") || [];
    const propriasArrendadas = properties?.filter(p => p.tipo === "ARRENDADO") || [];
    
    const totalProprias = propriasProprias.length;
    const totalArrendadas = propriasArrendadas.length;
    
    const areaPropria = propriasProprias.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    const areaArrendada = propriasArrendadas.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    
    const areaPercentualPropria = areaTotal > 0 ? (areaPropria / areaTotal) * 100 : 0;
    const areaPercentualArrendada = areaTotal > 0 ? (areaArrendada / areaTotal) * 100 : 0;
    
    const valorPropriedades = properties?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;
    const valorBenfeitorias = benfeitorias?.reduce((sum, benf) => sum + (benf.valor || 0), 0) || 0;
    const valorPatrimonial = valorPropriedades + valorBenfeitorias;
    
    const areaCultivavel = properties?.reduce((sum, prop) => sum + (prop.area_cultivada || 0), 0) || 0;

    // Buscar dados de safras
    const { data: safras } = await supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio");

    // Buscar também culturas, sistemas e ciclos para mapear IDs
    const { data: culturas } = await supabase
      .from("culturas")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    const { data: sistemas } = await supabase
      .from("sistemas")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    const { data: ciclos } = await supabase
      .from("ciclos")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Criar mapas para acesso rápido
    const culturaMap = new Map(culturas?.map(c => [c.id, c.nome]) || []);
    const sistemaMap = new Map(sistemas?.map(s => [s.id, s.nome]) || []);
    const cicloMap = new Map(ciclos?.map(c => [c.id, c.nome]) || []);

    // Buscar dados de áreas de plantio diretamente
    let areaChartData: any[] = [];
    const { data: areasPlantio, error: areaError } = await supabase
      .from(projectionId ? "areas_plantio_projections" : "areas_plantio")
      .select("*")
      .eq("organizacao_id", organizationId);
      
    if (areaError) {
      console.error("Erro ao buscar áreas de plantio:", areaError);
    }
      
    if (areasPlantio && safras) {
      const chartDataMap = new Map<string, any>();
      
      // Inicializar dados para cada safra
      safras.filter(s => s.ano_inicio <= 2029).forEach(safra => {
        chartDataMap.set(safra.nome, {
          safra: safra.nome,
          total: 0
        });
      });
      
      // Processar áreas
      areasPlantio.forEach(area => {
        if (area.areas_por_safra) {
          Object.entries(area.areas_por_safra).forEach(([safraId, areaValue]) => {
            const safra = safras.find(s => s.id === safraId);
            if (safra && chartDataMap.has(safra.nome) && Number(areaValue) > 0) {
              const data = chartDataMap.get(safra.nome);
              const cultura = culturaMap.get(area.cultura_id) || 'Não Informado';
              
              data.total += Number(areaValue) || 0;
              if (!data[cultura]) {
                data[cultura] = 0;
              }
              data[cultura] += Number(areaValue) || 0;
            }
          });
        }
      });
      
      areaChartData = Array.from(chartDataMap.values()).filter(d => d.total > 0);
    }

    // Buscar produtividade com joins corretos
    const prodTable = projectionId ? "produtividades_projections" : "produtividades";
    const { data: productivity } = await supabase
      .from(prodTable)
      .select(`
        *,
        cultura:cultura_id(nome),
        sistema:sistema_id(nome),
        ciclo:ciclo_id(nome)
      `)
      .eq("organizacao_id", organizationId);

    // Buscar receitas financeiras
    const { data: revenues } = await supabase
      .from("receitas_financeiras")
      .select(`
        *,
        safra:safra_id (id, nome)
      `)
      .eq("organizacao_id", organizationId);

    // Buscar dívidas bancárias
    const { data: debts } = await supabase
      .from("dividas_bancarias")
      .select(`
        *,
        safra:safra_id (id, nome)
      `)
      .eq("organizacao_id", organizationId);

    // Buscar arrendamentos
    const { data: arrendamentos } = await supabase
      .from("arrendamentos")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Buscar investimentos
    const { data: investments } = await supabase
      .from("investimentos")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano");

    // Buscar financiamentos
    const { data: financiamentos } = await supabase
      .from("financiamentos")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Buscar custos de produção
    const custosTable = projectionId ? "custos_producao_projections" : "custos_producao";
    const custosQuery = supabase
      .from(custosTable)
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      custosQuery.eq("projection_id", projectionId);
    }
    
    const { data: custos } = await custosQuery;

    // Buscar contratos de financiamento (removido inventário que não existe)

    // Buscar projeções de cultura para calcular DRE
    const cultureProjections = await getCultureProjections(organizationId, projectionId);
    const outrasDespesas = await getOutrasDespesas(organizationId, projectionId);
    const receitasFinanceiras = await getReceitasFinanceiras(organizationId, projectionId);
    const cotacoesCambio = await getCotacoesCambio(organizationId);
    
    // Buscar dívidas bancárias e caixa para cálculo de variação cambial
    const { data: dividasBancarias } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    // Buscar caixa disponibilidades
    const caixaDisponibilidadesData = await getCaixaDisponibilidades(organizationId, projectionId);
    
    // Buscar fornecedores
    const fornecedoresData = await getSuppliersUnified(organizationId, projectionId);
    
    // Buscar equipamentos
    const equipamentosData = await getEquipments(organizationId);
    
    // Buscar fluxo de caixa completo
    const fluxoCaixaCompleto = await getFluxoCaixaSimplificado(organizationId, projectionId);
    
    // Buscar posição da dívida
    const debtPositionData = await getDebtPosition(organizationId, projectionId);
    
    // Calcular DRE seguindo a lógica do getDREDataUpdated
    const dreData: Record<string, any> = {};
    const anos = cultureProjections.anos;
    
    // Criar mapeamento de safra ID para nome
    const safraToYear = safras?.reduce((acc, safra) => {
      acc[safra.id] = safra.nome;
      return acc;
    }, {} as Record<string, string>) || {};
    
    // Função auxiliar para obter taxa de câmbio
    const getTaxaCambio = (safraId: string): number => {
      const cotacao = cotacoesCambio.find(c => c.tipo_moeda === "DOLAR_FECHAMENTO");
      if (cotacao && cotacao.cotacoes_por_ano) {
        const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string' 
          ? JSON.parse(cotacao.cotacoes_por_ano)
          : cotacao.cotacoes_por_ano;
        
        let taxaRetornada = cotacoesPorAno[safraId];
        if (!taxaRetornada && safraToYear[safraId]) {
          const anoSafra = safraToYear[safraId].split('/')[0];
          taxaRetornada = cotacoesPorAno[anoSafra];
        }
        return taxaRetornada || cotacao.cotacao_atual || 5.50;
      }
      return 5.50;
    };
    
    // Processar cada ano
    anos.forEach((ano, index) => {
      const safraId = Object.entries(safraToYear).find(([id, nome]) => nome === ano)?.[0];
      
      // Receita Bruta Agrícola
      let receitaAgricolaAno = 0;
      [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno && dadosAno.receita) {
          receitaAgricolaAno += dadosAno.receita;
        }
      });
      
      // Impostos sobre Vendas
      let impostoICMS = 0;
      let impostoPIS = 0;
      let impostoCOFINS = 0;
      
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          const valor = despesa.valores_por_safra?.[safraId] || 0;
          switch (despesa.categoria) {
            case "ICMS":
              impostoICMS += valor;
              break;
            case "PIS":
              impostoPIS += valor;
              break;
            case "COFINS":
              impostoCOFINS += valor;
              break;
          }
        });
      }
      
      const impostosVendasTotal = impostoICMS + impostoPIS + impostoCOFINS;
      const receitaLiquida = receitaAgricolaAno - impostosVendasTotal;
      
      // Custos Agrícolas
      let custoAgricolaAno = 0;
      [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno) {
          custoAgricolaAno += dadosAno.custo_total || 0;
        }
      });
      
      const lucroBruto = receitaLiquida - custoAgricolaAno;
      
      // Despesas Operacionais
      let despesasOperacionais = {
        administrativas: 0,
        pessoal: 0,
        arrendamentos: 0,
        tributarias: 0,
        manutencao_seguros: 0,
        outros: 0,
        total: 0
      };
      
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          const valor = despesa.valores_por_safra?.[safraId] || 0;
          
          switch (despesa.categoria) {
            case "DESPESAS_ADMINISTRATIVAS":
            case "ENERGIA_COMBUSTIVEL":
            case "COMUNICACAO":
            case "VIAGENS":
            case "MATERIAL_ESCRITORIO":
            case "CONSULTORIAS":
              despesasOperacionais.administrativas += valor;
              break;
            case "PESSOAL":
            case "PRO_LABORE":
              despesasOperacionais.pessoal += valor;
              break;
            case "ARRENDAMENTOS":
              despesasOperacionais.arrendamentos += valor;
              break;
            case "TRIBUTARIAS":
              despesasOperacionais.tributarias += valor;
              break;
            case "MANUTENCAO":
            case "SEGUROS":
              despesasOperacionais.manutencao_seguros += valor;
              break;
            case "OUTRAS_OPERACIONAIS":
            case "OUTROS":
            case "DESPESAS_COMERCIAIS":
              despesasOperacionais.outros += valor;
              break;
          }
        });
        
        despesasOperacionais.total = despesasOperacionais.administrativas + 
          despesasOperacionais.pessoal + despesasOperacionais.arrendamentos + 
          despesasOperacionais.tributarias + despesasOperacionais.manutencao_seguros + 
          despesasOperacionais.outros;
      }
      
      // Outras Receitas Operacionais
      let outrasReceitasOperacionais = 0;
      if (safraId) {
        receitasFinanceiras.forEach(receita => {
          outrasReceitasOperacionais += (receita.valores_por_safra as any)?.[safraId] || 0;
        });
      }
      
      const ebitda = lucroBruto + outrasReceitasOperacionais - despesasOperacionais.total;
      const margemEbitda = receitaAgricolaAno > 0 ? (ebitda / receitaAgricolaAno) : 0;
      
      // Depreciação e Amortização
      let depreciacaoAmortizacao = 0;
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          if (despesa.categoria === "DEPRECIACAO" || despesa.categoria === "AMORTIZACAO") {
            depreciacaoAmortizacao += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      
      const ebit = ebitda - depreciacaoAmortizacao;
      
      // Resultado Financeiro
      let despesasFinanceiras = 0;
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          if (despesa.categoria === "DESPESAS_FINANCEIRAS") {
            despesasFinanceiras += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      
      // Variação Cambial
      let variacaoCambial = 0;
      if (safraId && index > 0) {
        const taxaAtual = getTaxaCambio(safraId);
        const safraAnteriorId = Object.entries(safraToYear).find(([id, nome]) => nome === anos[index - 1])?.[0];
        const taxaAnterior = safraAnteriorId ? getTaxaCambio(safraAnteriorId) : taxaAtual;
        const variacaoPercentual = (taxaAtual - taxaAnterior) / taxaAnterior;
        
        // Calcular passivos e ativos em USD
        let totalPassivosUSD = 0;
        let totalAtivosUSD = 0;
        
        dividasBancarias?.forEach(divida => {
          if (divida.moeda === "USD") {
            totalPassivosUSD += divida.valor_principal || 0;
          }
        });
        
        caixaDisponibilidadesData?.forEach(caixa => {
          const moedaCaixa = caixa.moeda || "BRL";
          if (moedaCaixa === "USD" && caixa.valores_por_ano) {
            const valores = typeof caixa.valores_por_ano === 'string' 
              ? JSON.parse(caixa.valores_por_ano)
              : caixa.valores_por_ano;
            const valorCaixa = valores[safraId] || 0;
            totalAtivosUSD += valorCaixa;
          }
        });
        
        const exposicaoLiquidaUSD = totalAtivosUSD - totalPassivosUSD;
        const exposicaoLiquidaBRL = exposicaoLiquidaUSD * taxaAnterior;
        variacaoCambial = exposicaoLiquidaBRL * variacaoPercentual;
      }
      
      const resultadoFinanceiroTotal = -despesasFinanceiras + variacaoCambial;
      const lucroAntesIR = ebit + resultadoFinanceiroTotal;
      
      // Impostos sobre Lucro
      let impostosLucro = 0;
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          if (despesa.categoria === "IMPOSTO_RENDA" || despesa.categoria === "CSLL") {
            impostosLucro += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      
      const lucroLiquido = lucroAntesIR - impostosLucro;
      const margemLiquida = receitaAgricolaAno > 0 ? (lucroLiquido / receitaAgricolaAno) : 0;
      
      // Armazenar dados do DRE
      dreData[ano] = {
        receita_bruta: {
          agricola: receitaAgricolaAno,
          pecuaria: 0,
          total: receitaAgricolaAno
        },
        impostos_vendas: {
          icms: impostoICMS,
          pis: impostoPIS,
          cofins: impostoCOFINS,
          total: impostosVendasTotal
        },
        receita_liquida: receitaLiquida,
        custos: {
          agricola: custoAgricolaAno,
          pecuaria: 0,
          total: custoAgricolaAno
        },
        lucro_bruto: lucroBruto,
        despesas_operacionais: despesasOperacionais,
        outras_receitas_operacionais: outrasReceitasOperacionais,
        ebitda: ebitda,
        margem_ebitda: margemEbitda,
        depreciacao_amortizacao: depreciacaoAmortizacao,
        ebit: ebit,
        resultado_financeiro: {
          receitas_financeiras: 0,
          despesas_financeiras: despesasFinanceiras,
          variacao_cambial: variacaoCambial,
          total: resultadoFinanceiroTotal
        },
        lucro_antes_ir: lucroAntesIR,
        impostos_sobre_lucro: impostosLucro,
        lucro_liquido: lucroLiquido,
        margem_liquida: margemLiquida
      };
    });
    
    // Converter DRE para formato de array
    const dreArray = Object.entries(dreData).map(([ano, dados]) => ({
      ano: parseInt(ano.split('/')[0]),
      receita_bruta: dados.receita_bruta.total,
      deducoes: dados.impostos_vendas.total,
      receita_liquida: dados.receita_liquida,
      custos_vendas: dados.custos.total,
      lucro_bruto: dados.lucro_bruto,
      despesas_operacionais: dados.despesas_operacionais.total,
      lucro_operacional: dados.ebit,
      resultado_financeiro: dados.resultado_financeiro.total,
      lucro_antes_impostos: dados.lucro_antes_ir,
      impostos: dados.impostos_sobre_lucro,
      lucro_liquido: dados.lucro_liquido
    }));
    
    // Calcular Balanço Patrimonial detalhado
    const balanceSheetData: any = {
      anos: anos,
      ativo: {
        circulante: {
          caixa_bancos: {},
          clientes: {},
          adiantamentos_fornecedores: {},
          estoques: {
            defensivos: {},
            fertilizantes: {},
            almoxarifado: {},
            commodities: {},
            sementes: {},
            total: {}
          },
          emprestimos_terceiros: {},
          outros_ativos_circulantes: {},
          total: {}
        },
        nao_circulante: {
          investimentos: {},
          imobilizado: {
            terras: {},
            maquinas_equipamentos: {},
            veiculos: {},
            benfeitorias: {},
            depreciacao_acumulada: {},
            outros_imobilizados: {},
            total: {}
          },
          total: {}
        },
        total: {}
      },
      passivo: {
        circulante: {
          fornecedores: {},
          emprestimos_financiamentos_curto_prazo: {},
          adiantamentos_clientes: {},
          impostos_taxas: {},
          outros_passivos_circulantes: {},
          total: {}
        },
        nao_circulante: {
          emprestimos_financiamentos_longo_prazo: {},
          financiamentos_terras: {},
          arrendamentos: {},
          outros_passivos_nao_circulantes: {},
          total: {}
        },
        patrimonio_liquido: {
          capital_social: {},
          reservas: {},
          lucros_acumulados: {},
          total: {}
        },
        total: {}
      }
    };
    
    // Calcular lucros acumulados
    let lucrosAcumulados = 0;
    
    // Processar cada ano
    anos.forEach((ano, index) => {
      const safraId = Object.entries(safraToYear).find(([id, nome]) => nome === ano)?.[0];
      
      // ATIVO CIRCULANTE
      // Caixa e Bancos
      let caixaBancosValor = 0;
      caixaDisponibilidadesData?.forEach(item => {
        if (item.categoria === "CAIXA_BANCOS") {
          const valor = item.valores_por_ano?.[safraId || ano] || 0;
          caixaBancosValor += Number(valor);
        }
      });
      
      // Adiantamentos a Fornecedores
      let adiantamentosFornecedoresValor = 0;
      caixaDisponibilidadesData?.forEach(item => {
        if (item.categoria === "ADIANTAMENTOS") {
          const valor = item.valores_por_ano?.[safraId || ano] || 0;
          adiantamentosFornecedoresValor += Number(valor);
        }
      });
      
      // Estoques
      let estoquesDefensivos = 0, estoquesFertilizantes = 0, estoquesAlmoxarifado = 0;
      let estoquesCommodities = 0, estoquesSementes = 0;
      
      caixaDisponibilidadesData?.forEach(item => {
        const valor = Number(item.valores_por_ano?.[safraId || ano] || 0);
        switch (item.categoria) {
          case "ESTOQUE_DEFENSIVOS":
            estoquesDefensivos += valor;
            break;
          case "ESTOQUE_FERTILIZANTES":
            estoquesFertilizantes += valor;
            break;
          case "ESTOQUE_ALMOXARIFADO":
            estoquesAlmoxarifado += valor;
            break;
          case "ESTOQUE_COMMODITIES":
            estoquesCommodities += valor;
            break;
          case "ESTOQUE_SEMENTES":
            estoquesSementes += valor;
            break;
        }
      });
      
      const estoquesTotal = estoquesDefensivos + estoquesFertilizantes + estoquesAlmoxarifado + 
                           estoquesCommodities + estoquesSementes;
      
      // Empréstimos a Terceiros
      let emprestimosATerceiros = 0;
      caixaDisponibilidadesData?.forEach(item => {
        if (item.categoria === "EMPRESTIMOS") {
          const valor = item.valores_por_ano?.[safraId || ano] || 0;
          emprestimosATerceiros += Number(valor);
        }
      });
      
      const ativoCirculanteTotal = caixaBancosValor + adiantamentosFornecedoresValor + 
                                   estoquesTotal + emprestimosATerceiros;
      
      // ATIVO NÃO CIRCULANTE
      // Investimentos
      const investimentosValor = investments?.filter(inv => inv.ano <= parseInt(ano.split('/')[0]))
                                            .reduce((sum, inv) => sum + (inv.valor_total || 0), 0) || 0;
      
      // Terras
      const terrasValor = properties?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;
      
      // Máquinas e Equipamentos
      const maquinasEquipamentosValor = 'data' in equipamentosData ? 
        equipamentosData.data?.reduce((sum: number, eq: any) => sum + (eq.valor_total || 0), 0) || 0 : 0;
      
      // Benfeitorias
      const benfeitoriasValor = benfeitorias?.reduce((sum, benf) => sum + (benf.valor || 0), 0) || 0;
      
      const imobilizadoTotal = terrasValor + maquinasEquipamentosValor + benfeitoriasValor;
      const ativoNaoCirculanteTotal = investimentosValor + imobilizadoTotal;
      const ativoTotal = ativoCirculanteTotal + ativoNaoCirculanteTotal;
      
      // PASSIVO CIRCULANTE
      // Fornecedores
      let fornecedoresValor = 0;
      fornecedoresData?.suppliers?.forEach(supplier => {
        const valor = supplier.valores_por_ano?.[ano] || 0;
        fornecedoresValor += Number(valor);
      });
      
      // Dívidas curto prazo (usar endividamento total como aproximação)
      const dividasCurtoPrazo = (debtPositionData?.indicadores?.endividamento_total?.[ano] || 0) * 0.3; // 30% curto prazo
      
      const passivoCirculanteTotal = fornecedoresValor + dividasCurtoPrazo;
      
      // PASSIVO NÃO CIRCULANTE
      const dividasLongoPrazo = (debtPositionData?.indicadores?.endividamento_total?.[ano] || 0) * 0.7; // 70% longo prazo
      const financiamentosTerras = fluxoCaixaCompleto?.financeiras?.dividas_terras?.[ano] || 0;
      const arrendamentosValor = fluxoCaixaCompleto?.outras_despesas?.arrendamento?.[ano] || 0;
      
      const passivoNaoCirculanteTotal = dividasLongoPrazo + financiamentosTerras + arrendamentosValor;
      
      // PATRIMÔNIO LÍQUIDO
      lucrosAcumulados += dreData[ano]?.lucro_liquido || 0;
      const capitalSocial = 0; // Sem valor hardcoded
      const reservas = 0;
      const patrimonioLiquidoTotal = capitalSocial + reservas + lucrosAcumulados;
      
      // Preencher dados do balanço
      balanceSheetData.ativo.circulante.caixa_bancos[ano] = caixaBancosValor;
      balanceSheetData.ativo.circulante.clientes[ano] = 0;
      balanceSheetData.ativo.circulante.adiantamentos_fornecedores[ano] = adiantamentosFornecedoresValor;
      balanceSheetData.ativo.circulante.estoques.defensivos[ano] = estoquesDefensivos;
      balanceSheetData.ativo.circulante.estoques.fertilizantes[ano] = estoquesFertilizantes;
      balanceSheetData.ativo.circulante.estoques.almoxarifado[ano] = estoquesAlmoxarifado;
      balanceSheetData.ativo.circulante.estoques.commodities[ano] = estoquesCommodities;
      balanceSheetData.ativo.circulante.estoques.sementes[ano] = estoquesSementes;
      balanceSheetData.ativo.circulante.estoques.total[ano] = estoquesTotal;
      balanceSheetData.ativo.circulante.emprestimos_terceiros[ano] = emprestimosATerceiros;
      balanceSheetData.ativo.circulante.outros_ativos_circulantes[ano] = 0;
      balanceSheetData.ativo.circulante.total[ano] = ativoCirculanteTotal;
      
      balanceSheetData.ativo.nao_circulante.investimentos[ano] = investimentosValor;
      balanceSheetData.ativo.nao_circulante.imobilizado.terras[ano] = terrasValor;
      balanceSheetData.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] = maquinasEquipamentosValor;
      balanceSheetData.ativo.nao_circulante.imobilizado.veiculos[ano] = 0;
      balanceSheetData.ativo.nao_circulante.imobilizado.benfeitorias[ano] = benfeitoriasValor;
      balanceSheetData.ativo.nao_circulante.imobilizado.depreciacao_acumulada[ano] = 0;
      balanceSheetData.ativo.nao_circulante.imobilizado.outros_imobilizados[ano] = 0;
      balanceSheetData.ativo.nao_circulante.imobilizado.total[ano] = imobilizadoTotal;
      balanceSheetData.ativo.nao_circulante.total[ano] = ativoNaoCirculanteTotal;
      balanceSheetData.ativo.total[ano] = ativoTotal;
      
      balanceSheetData.passivo.circulante.fornecedores[ano] = fornecedoresValor;
      balanceSheetData.passivo.circulante.emprestimos_financiamentos_curto_prazo[ano] = dividasCurtoPrazo;
      balanceSheetData.passivo.circulante.adiantamentos_clientes[ano] = 0;
      balanceSheetData.passivo.circulante.impostos_taxas[ano] = 0;
      balanceSheetData.passivo.circulante.outros_passivos_circulantes[ano] = 0;
      balanceSheetData.passivo.circulante.total[ano] = passivoCirculanteTotal;
      
      balanceSheetData.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo[ano] = dividasLongoPrazo;
      balanceSheetData.passivo.nao_circulante.financiamentos_terras[ano] = financiamentosTerras;
      balanceSheetData.passivo.nao_circulante.arrendamentos[ano] = arrendamentosValor;
      balanceSheetData.passivo.nao_circulante.outros_passivos_nao_circulantes[ano] = 0;
      balanceSheetData.passivo.nao_circulante.total[ano] = passivoNaoCirculanteTotal;
      
      balanceSheetData.passivo.patrimonio_liquido.capital_social[ano] = capitalSocial;
      balanceSheetData.passivo.patrimonio_liquido.reservas[ano] = reservas;
      balanceSheetData.passivo.patrimonio_liquido.lucros_acumulados[ano] = lucrosAcumulados;
      balanceSheetData.passivo.patrimonio_liquido.total[ano] = patrimonioLiquidoTotal;
      
      balanceSheetData.passivo.total[ano] = passivoCirculanteTotal + passivoNaoCirculanteTotal + patrimonioLiquidoTotal;
    });
    
    // Usar fluxo de caixa completo já calculado
    const cashFlowProjections = fluxoCaixaCompleto;

    // Processar dados de áreas de plantio
    const plantingChartData = areaChartData && areaChartData.length > 0 ? areaChartData.map(data => ({
      safra: data.safra,
      total: data.total,
      culturas: Object.entries(data)
        .filter(([key]) => key !== 'safra' && key !== 'total')
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value
        }), {})
    })) : [];
    
    // Para tableData, vamos buscar dados detalhados
    const { data: areasDetalhadas } = await supabase
      .from(projectionId ? "areas_plantio_projections" : "areas_plantio")
      .select(`
        *,
        cultura:cultura_id(nome),
        sistema:sistema_id(nome),
        ciclo:ciclo_id(nome)
      `)
      .eq("organizacao_id", organizationId);
      
    const plantingTableData: any[] = [];
    if (areasDetalhadas && safras) {
      const tableDataMap = new Map<string, any>();
      
      areasDetalhadas.forEach(area => {
        const cultura = (area.cultura as any)?.nome || 'Não Informado';
        const sistema = (area.sistema as any)?.nome || 'Não Informado';
        const ciclo = (area.ciclo as any)?.nome || 'Não Informado';
        const key = `${cultura}-${sistema}-${ciclo}`;
        
        if (!tableDataMap.has(key)) {
          tableDataMap.set(key, {
            cultura,
            sistema,
            ciclo,
            areas: {} as { [safra: string]: number }
          });
        }
        
        const tableRow = tableDataMap.get(key);
        
        // Adicionar área para cada safra
        safras.forEach(safra => {
          const areaValue = area.areas_por_safra?.[safra.id] || 0;
          if (areaValue > 0) {
            tableRow.areas[safra.nome] = (tableRow.areas[safra.nome] || 0) + areaValue;
          }
        });
      });
      
      plantingTableData.push(...Array.from(tableDataMap.values()));
    }

    // Processar dados de produtividade diretamente
    let productivityChartData: any[] = [];
    if (productivity && safras) {
      const chartDataMap = new Map<string, any>();
      
      safras.filter(s => s.ano_inicio <= 2029).forEach(safra => {
        const culturaProdMap = new Map<string, { total: number, count: number }>();
        
        productivity.forEach(prod => {
          const prodSafra = prod.produtividades_por_safra?.[safra.id];
          let prodValue = 0;
          
          if (typeof prodSafra === 'number') {
            prodValue = prodSafra;
          } else if (prodSafra && typeof prodSafra === 'object' && 'produtividade' in prodSafra) {
            prodValue = prodSafra.produtividade;
          }
          
          if (prodValue > 0) {
            const culturaNome = (prod.cultura as any)?.nome || 'Não Informado';
            const sistemaNome = (prod.sistema as any)?.nome || '';
            
            let chaveCompleta = culturaNome;
            if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
              chaveCompleta = `${culturaNome} ${sistemaNome}`;
            }
            
            const current = culturaProdMap.get(chaveCompleta) || { total: 0, count: 0 };
            culturaProdMap.set(chaveCompleta, {
              total: current.total + prodValue,
              count: current.count + 1
            });
          }
        });
        
        if (culturaProdMap.size > 0) {
          const culturas: { [key: string]: number } = {};
          culturaProdMap.forEach((data, cultura) => {
            culturas[cultura] = data.count > 0 ? data.total / data.count : 0;
          });
          
          chartDataMap.set(safra.nome, {
            safra: safra.nome,
            culturas
          });
        }
      });
      
      productivityChartData = Array.from(chartDataMap.values());
    }
    
    // Processar dados da tabela de produtividade
    const productivityTableData: any[] = [];
    if (productivity && productivity.length > 0 && safras) {
      const tableDataMap = new Map<string, any>();
      
      productivity.forEach(prod => {
        const cultura = (prod.cultura as any)?.nome || 'Não Informado';
        const sistema = (prod.sistema as any)?.nome || 'Não Informado';
        const ciclo = (prod.ciclo as any)?.nome || 'Não Informado';
        const key = `${cultura}-${sistema}-${ciclo}`;
        
        if (!tableDataMap.has(key)) {
          tableDataMap.set(key, {
            cultura,
            sistema,
            ciclo,
            produtividades: {} as { [safra: string]: number }
          });
        }
        
        const tableRow = tableDataMap.get(key);
        
        // Adicionar produtividade para cada safra
        safras.forEach(safra => {
          const prodSafra = prod.produtividade_por_safra?.[safra.id];
          let prodValue = 0;
          
          if (typeof prodSafra === 'number') {
            prodValue = prodSafra;
          } else if (prodSafra && typeof prodSafra === 'object' && 'produtividade' in prodSafra) {
            prodValue = prodSafra.produtividade;
          }
          
          if (prodValue > 0) {
            // Se já existe um valor, fazer média
            if (tableRow.produtividades[safra.nome]) {
              tableRow.produtividades[safra.nome] = (tableRow.produtividades[safra.nome] + prodValue) / 2;
            } else {
              tableRow.produtividades[safra.nome] = prodValue;
            }
          }
        });
      });
      
      productivityTableData.push(...Array.from(tableDataMap.values()));
    }

    // Buscar preços de commodities para calcular receitas
    const { data: precos } = await supabase
      .from("precos")
      .select("*")
      .eq("organizacao_id", organizationId);
      
    // Processar dados de receitas das projeções de cultura
    const revenueChartData: any[] = [];
    const revenueTableData: any[] = [];
    
    // Usar dados das projeções de cultura para calcular receitas
    anos.forEach(ano => {
      let totalReceita = 0;
      const culturasReceita: { [key: string]: number } = {};
      
      cultureProjections.projections.forEach(projection => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno && dadosAno.receita > 0) {
          culturasReceita[projection.cultura_nome] = (culturasReceita[projection.cultura_nome] || 0) + dadosAno.receita;
          totalReceita += dadosAno.receita;
        }
      });
      
      if (totalReceita > 0) {
        revenueChartData.push({
          safra: ano,
          total: totalReceita,
          culturas: culturasReceita
        });
      }
    });
    
    // Criar dados da tabela de receita por cultura
    const culturasUnicas = new Set<string>();
    cultureProjections.projections.forEach(p => culturasUnicas.add(p.cultura_nome));
    
    culturasUnicas.forEach(cultura => {
      const tableRow = {
        categoria: cultura,
        receitas: {} as { [safra: string]: number }
      };
      
      anos.forEach(ano => {
        let receitaCultura = 0;
        cultureProjections.projections
          .filter(p => p.cultura_nome === cultura)
          .forEach(p => {
            const dadosAno = p.projections_by_year[ano];
            if (dadosAno && dadosAno.receita) {
              receitaCultura += dadosAno.receita;
            }
          });
        tableRow.receitas[ano] = receitaCultura;
      });
      
      if (Object.values(tableRow.receitas).some(v => v > 0)) {
        revenueTableData.push(tableRow);
      }
    });

    // Processar dados de dívidas
    const debtBySafra: any[] = [];
    let debtDistribution2025: any[] = [];
    let debtDistribution2025_26: any[] = [];
    let debtDistributionConsolidated: any[] = [];
    let totalConsolidado = null;
    
    // Calcular total consolidado manualmente
    if (debts && debts.length > 0) {
      let totalBRL = 0;
      let totalUSD = 0;
      
      // Buscar taxa de câmbio das cotações
      let taxaCambio = 5.50;
      const cotacaoDolar = cotacoesCambio.find(c => c.tipo_moeda === "DOLAR_FECHAMENTO");
      if (cotacaoDolar && cotacaoDolar.cotacao_atual) {
        taxaCambio = cotacaoDolar.cotacao_atual;
      }
      
      // Calcular totais por moeda
      debts.forEach(debt => {
        const valor = debt.valor_principal || 0;
        if (debt.moeda === "USD") {
          totalUSD += valor;
        } else {
          totalBRL += valor;
        }
      });
      
      // Total consolidado em BRL
      const totalConsolidadoBRL = totalBRL + (totalUSD * taxaCambio);
      
      totalConsolidado = {
        total_brl: totalBRL,
        total_usd: totalUSD,
        total_consolidado_brl: totalConsolidadoBRL,
        taxa_cambio: taxaCambio,
        quantidade_contratos: debts.length
      };
    }
    
    if (debts && debts.length > 0) {
      // Agrupar dívidas por safra usando fluxo_pagamento_anual
      const debtsBySafra = new Map<string, number>();
      
      // Também calcular distribuições por modalidade
      const modalidadeConsolidado = new Map<string, number>();
      const modalidade2025 = new Map<string, number>();
      const debtsByType = new Map<string, number>();
      const debtsByType2025 = new Map<string, number>();
      
      // Taxa de câmbio já calculada acima
      const taxaCambio = totalConsolidado?.taxa_cambio || 5.50;
      
      debts.forEach(debt => {
        const modalidade = debt.modalidade || 'OUTROS';
        
        // Calcular valor para modalidade consolidada com conversão de moeda
        const valorPrincipal = debt.valor_principal || 0;
        const valorConvertido = debt.moeda === "USD" ? valorPrincipal * taxaCambio : valorPrincipal;
        
        if (valorConvertido > 0) {
          // Agrupar modalidade
          const modalidadeAgrupada = (modalidade === 'CUSTEIO' || modalidade === 'INVESTIMENTOS') ? modalidade : 'INVESTIMENTOS';
          modalidadeConsolidado.set(modalidadeAgrupada, (modalidadeConsolidado.get(modalidadeAgrupada) || 0) + valorConvertido);
        }
        
        // Processar fluxo_pagamento_anual para obter valores por safra
        if (debt.fluxo_pagamento_anual && safras) {
          Object.entries(debt.fluxo_pagamento_anual).forEach(([safraId, valor]) => {
            const safra = safras.find(s => s.id === safraId);
            if (safra && valor) {
              const valorNumerico = Number(valor);
              if (valorNumerico > 0) {
                // Por safra
                debtsBySafra.set(safra.nome, (debtsBySafra.get(safra.nome) || 0) + valorNumerico);
                
                // Por modalidade (consolidado)
                debtsByType.set(modalidade, (debtsByType.get(modalidade) || 0) + valorNumerico);
                
                // Por modalidade para 2025/26
                if (safra.nome === '2025/26') {
                  debtsByType2025.set(modalidade, (debtsByType2025.get(modalidade) || 0) + valorNumerico);
                }
              }
            }
          });
        } else if (debt.valor_principal) {
          // Se não tem fluxo, usar valor principal
          const totalDebt = Number(debt.valor_principal);
          debtsBySafra.set('Sem safra', (debtsBySafra.get('Sem safra') || 0) + totalDebt);
          debtsByType.set(modalidade, (debtsByType.get(modalidade) || 0) + totalDebt);
        }
      });

      // Converter para array
      debtBySafra.push(...Array.from(debtsBySafra.entries()).map(([safra, valor]) => ({
        safra,
        valor
      })));

      // Distribuição 2025
      if (debtsByType2025.size > 0) {
        debtDistribution2025.push(...Array.from(debtsByType2025.entries()).map(([name, value]) => ({
          name,
          value
        })));
        // Também adicionar como 2025_26 para compatibilidade
        debtDistribution2025_26.push(...Array.from(debtsByType2025.entries()).map(([name, value]) => ({
          name,
          value
        })));
      }

      // Distribuição consolidada - usar os valores com conversão de moeda
      if (modalidadeConsolidado.size > 0) {
        debtDistributionConsolidated = Array.from(modalidadeConsolidado.entries()).map(([name, value]) => ({
          name,
          value
        }));
      } else {
        // Fallback para o método antigo se não houver dados
        debtDistributionConsolidated.push(...Array.from(debtsByType.entries()).map(([name, value]) => ({
          name,
          value
        })));
      }
    }

    // Processar evolução financeira baseada no DRE calculado
    const financialEvolution: any[] = [];
    
    // Usar os dados calculados do DRE para evolução financeira
    Object.entries(dreData).forEach(([ano, dados]) => {
      financialEvolution.push({
        safra: ano,
        receita: dados.receita_bruta.total,
        custo: dados.custos.total + dados.despesas_operacionais.total,
        lucro: dados.lucro_liquido,
        margem: dados.margem_liquida * 100
      });
    });

    // Calcular indicadores de liquidez para cada ano
    const liquidityIndicators = {
      indicadores: {
        liquidez_corrente: {} as Record<string, number>,
        liquidez_seca: {} as Record<string, number>,
        liquidez_geral: {} as Record<string, number>,
        endividamento_geral: {} as Record<string, number>,
        imobilizacao_patrimonio: {} as Record<string, number>,
        capital_giro: {} as Record<string, number>,
        necessidade_capital_giro: {} as Record<string, number>
      }
    };
    
    anos.forEach(ano => {
      const ativoCirculante = balanceSheetData.ativo.circulante.total[ano] || 0;
      const passivoCirculante = balanceSheetData.passivo.circulante.total[ano] || 0;
      const estoques = balanceSheetData.ativo.circulante.estoques.total[ano] || 0;
      const ativoTotal = balanceSheetData.ativo.total[ano] || 0;
      const passivoTotal = balanceSheetData.passivo.circulante.total[ano] + balanceSheetData.passivo.nao_circulante.total[ano] || 0;
      const ativoNaoCirculante = balanceSheetData.ativo.nao_circulante.total[ano] || 0;
      const patrimonioLiquido = balanceSheetData.passivo.patrimonio_liquido.total[ano] || 0;
      
      // Liquidez Corrente = Ativo Circulante / Passivo Circulante
      liquidityIndicators.indicadores.liquidez_corrente[ano] = passivoCirculante > 0 ? ativoCirculante / passivoCirculante : 0;
      
      // Liquidez Seca = (Ativo Circulante - Estoques) / Passivo Circulante
      liquidityIndicators.indicadores.liquidez_seca[ano] = passivoCirculante > 0 ? (ativoCirculante - estoques) / passivoCirculante : 0;
      
      // Liquidez Geral = (Ativo Circulante + Realizável LP) / (Passivo Circulante + Passivo Não Circulante)
      liquidityIndicators.indicadores.liquidez_geral[ano] = passivoTotal > 0 ? ativoCirculante / passivoTotal : 0;
      
      // Endividamento Geral = (Passivo Circulante + Passivo Não Circulante) / Ativo Total
      liquidityIndicators.indicadores.endividamento_geral[ano] = ativoTotal > 0 ? passivoTotal / ativoTotal : 0;
      
      // Imobilização do Patrimônio = Ativo Não Circulante / Patrimônio Líquido
      liquidityIndicators.indicadores.imobilizacao_patrimonio[ano] = patrimonioLiquido > 0 ? ativoNaoCirculante / patrimonioLiquido : 0;
      
      // Capital de Giro = Ativo Circulante - Passivo Circulante
      liquidityIndicators.indicadores.capital_giro[ano] = ativoCirculante - passivoCirculante;
      
      // Necessidade de Capital de Giro
      liquidityIndicators.indicadores.necessidade_capital_giro[ano] = liquidityIndicators.indicadores.capital_giro[ano];
    });
    
    // Processar indicadores econômicos baseados no DRE
    const economicIndicatorsData: any[] = [];
    const economicIndicatorsTable: any[] = [];
    
    financialEvolution.forEach((fin, index) => {
      // Calcular ROI se tiver investimentos
      let roi = 0;
      if (investments && investments.length > 0) {
        const ano = parseInt(fin.safra.split('/')[0]);
        const investimentosAcumulados = investments
          .filter(inv => inv.ano <= ano)
          .reduce((sum, inv) => sum + (inv.valor_total || 0), 0);
        
        if (investimentosAcumulados > 0 && index > 0) {
          // ROI = Lucro Anual / Investimento Total Acumulado
          roi = (fin.lucro / investimentosAcumulados);
        }
      }
      
      economicIndicatorsData.push({
        safra: fin.safra,
        margem: fin.margem,
        rentabilidade: fin.receita > 0 ? (fin.lucro / fin.receita * 100) : 0
      });

      economicIndicatorsTable.push({
        safra: fin.safra,
        receita_bruta: fin.receita,
        custo_total: fin.custo,
        lucro_liquido: fin.lucro,
        margem_liquida: fin.margem,
        roi: roi
      });
    });

    // Estrutura completa de dados
    const reportData: ReportDataJSON = {
      organization: {
        id: organization.id,
        nome: organization.nome,
        cpf: organization.cpf || '',
        cnpj: organization.cnpj || '',
        email: organization.email || '',
        telefone: organization.telefone || '',
        endereco: organization.endereco || {},
        socios: organization.estrutura_societaria || [],
        generatedAt: new Date().toISOString()
      },
      properties: {
        stats: {
          totalFazendas,
          totalProprias,
          totalArrendadas,
          areaTotal,
          areaPropria,
          areaArrendada,
          areaPercentualPropria,
          areaPercentualArrendada,
          valorPatrimonial,
          areaCultivavel,
        },
        list: properties?.map(p => ({
          nome: p.nome,
          nomeClean: cleanPropertyName(p.nome),
          valor_atual: p.valor_atual || 0,
          area_total: p.area_total || 0,
          area_cultivada: p.area_cultivada || 0,
          tipo: p.tipo
        })).sort((a, b) => b.valor_atual - a.valor_atual) || []
      },
      plantingAreas: {
        chartData: plantingChartData,
        tableData: plantingTableData.length > 0 ? plantingTableData : [],
      },
      productivity: {
        chartData: productivityChartData,
        tableData: productivityTableData,
      },
      revenue: {
        chartData: revenueChartData,
        tableData: revenueTableData,
      },
      financialEvolution: financialEvolution,
      debts: {
        debtBySafra: debtBySafra,
        debtDistribution2025: debtDistribution2025,
        debtDistribution2025_26: debtDistribution2025_26,
        debtDistributionConsolidated: debtDistributionConsolidated,
        totalConsolidado: totalConsolidado || undefined,
        list: debts?.map(d => {
          // Calcular saldo devedor total
          let saldoDevedor = 0;
          if (d.fluxo_pagamento_anual) {
            Object.values(d.fluxo_pagamento_anual).forEach((valor: any) => {
              saldoDevedor += Number(valor || 0);
            });
          } else if (d.valor_principal) {
            saldoDevedor = Number(d.valor_principal);
          }
          
          return {
            id: d.id,
            banco: d.instituicao_bancaria || '',
            tipo: d.tipo || '',
            valor_original: d.valor_principal || 0,
            saldo_devedor: saldoDevedor,
            safra_quitacao: d.safra?.nome || '',
            data_vencimento: '', // Não existe na tabela
            taxa_juros: d.taxa_real || 0
          };
        }) || []
      },
      economicIndicators: {
        data: economicIndicatorsData,
        tableData: economicIndicatorsTable,
      },
      investments: investments?.map(inv => ({
        id: inv.id,
        descricao: inv.categoria || '',
        tipo: inv.tipo || '',
        valor: inv.valor_total || 0,
        ano: inv.ano || 0,
        status: inv.tipo || ''
      })) || [],
      arrendamentos: arrendamentos?.map(arr => ({
        id: arr.id,
        propriedade_nome: arr.propriedade_nome,
        area: arr.area || 0,
        valor_hectare: arr.valor_hectare || 0,
        valor_total: arr.valor_total || 0,
        forma_pagamento: arr.forma_pagamento,
        safra_inicio: arr.safra_inicio,
        safra_fim: arr.safra_fim
      })) || [],
      cashFlowProjection: cashFlowProjections,
      dre: dreArray || [],
      balanceSheet: balanceSheetData,
      inventario: [], // Tabela não existe no sistema
      benfeitorias: benfeitorias?.map(b => ({
        id: b.id,
        tipo: b.tipo,
        descricao: b.descricao,
        quantidade: b.quantidade || 0,
        unidade_medida: b.unidade_medida,
        valor: b.valor || 0,
        propriedade_id: b.propriedade_id
      })) || [],
      caixaDisponibilidades: caixaDisponibilidadesData?.map(c => ({
        id: c.id,
        categoria: c.categoria,
        descricao: c.descricao || c.nome,
        valores_por_ano: c.valores_por_ano || {}
      })) || [],
      fornecedores: fornecedoresData?.suppliers?.map(f => ({
        id: f.id,
        nome: f.nome,
        tipo: f.tipo,
        valores_por_ano: f.valores_por_ano || {}
      })) || [],
      equipamentos: 'data' in equipamentosData ? equipamentosData.data?.map((e: any) => ({
        id: e.id,
        tipo: e.tipo,
        descricao: e.descricao,
        quantidade: e.quantidade || 1,
        valor_unitario: e.valor_unitario || e.valor_aquisicao || 0,
        valor_total: e.valor_total || e.valor_aquisicao || 0,
        ano_aquisicao: e.ano_aquisicao || new Date().getFullYear()
      })) : [],
      liquidityIndicators: liquidityIndicators,
      debtPosition: {
        dividas: debtPositionData?.dividas?.map(d => ({
          categoria: d.categoria,
          valores_por_ano: d.valores_por_ano || {}
        })) || [],
        indicadores: {
          endividamento_total: debtPositionData?.indicadores?.endividamento_total || {},
          divida_liquida: debtPositionData?.indicadores?.divida_liquida || {},
          dividas_cp: {},
          dividas_lp: {},
          servico_divida: {},
          cobertura_juros: {},
          receita_ano_safra: debtPositionData?.indicadores?.receita_ano_safra || {},
          ebitda_ano_safra: debtPositionData?.indicadores?.ebitda_ano_safra || {},
          indicadores_calculados: debtPositionData?.indicadores?.indicadores_calculados || {
            divida_receita: {},
            divida_ebitda: {},
            divida_liquida_receita: {},
            divida_liquida_ebitda: {}
          }
        }
      }
    };

    // Calcular métricas financeiras KPIs
    try {
      const financialMetrics = await getFinancialMetrics(organizationId, undefined, projectionId);
      
      if (financialMetrics) {
        reportData.financialKpis = {
          dividaBancaria: financialMetrics.dividaBancaria.valorAtual,
          dividaBancariaPercentual: financialMetrics.dividaBancaria.percentualMudanca,
          outrosPassivos: financialMetrics.outrosPassivos.valorAtual,
          outrosPassivosPercentual: financialMetrics.outrosPassivos.percentualMudanca,
          dividaLiquida: financialMetrics.dividaLiquida.valorAtual,
          dividaLiquidaPercentual: financialMetrics.dividaLiquida.percentualMudanca,
          prazoMedio: financialMetrics.prazoMedio.valorAtual,
          prazoMedioDiferenca: financialMetrics.prazoMedio.diferenca
        };
      }
    } catch (error) {
      console.error("Erro ao calcular métricas financeiras:", error);
      // Continuar sem as métricas financeiras
    }

    return reportData;
    
  } catch (error) {
    console.error("Erro ao exportar dados do relatório:", error);
    // Lançar erro com mais detalhes
    if (error instanceof Error) {
      throw new Error(`Falha ao exportar dados: ${error.message}`);
    }
    throw new Error("Falha ao exportar dados do relatório");
  }
}