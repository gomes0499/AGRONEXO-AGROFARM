import { createClient } from "@/lib/supabase/server";
import { getProductionStats } from "@/lib/actions/production-stats-actions";
import { getSafras } from "@/lib/actions/production-actions";
import { getDividasBancarias } from "@/lib/actions/financial-actions/dividas-bancarias";
import { getDividasTerras } from "@/lib/actions/financial-actions/dividas-terras";
import { getDividasFornecedores } from "@/lib/actions/financial-actions/dividas-fornecedores";
import { getCaixaDisponibilidades } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { getFinanceiras } from "@/lib/actions/financial-actions/financeiras";
import { 
  getOutrasDespesas,
  getTotalOutrasDespesas
} from "@/lib/actions/financial-actions/outras-despesas";
import { getReceitasFinanceiras } from "@/lib/actions/financial-actions/receitas-financeiras-actions";
import { getProperties } from "@/lib/actions/property-actions";

// Tipos para o relatório
export interface OrganizationData {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  website?: string;
  logo?: string;
}

export interface PropertyData {
  totalFazendas: number;
  areaTotal: number;
  valorPatrimonial: number;
  areaCultivavel: number;
  utilizacaoPercentual: number;
  propriedades: Array<{
    nome: string;
    area_total: number;
    area_cultivada: number;
    valor_atual: number;
    tipo: string;
    cidade: string;
    estado: string;
  }>;
}

export interface ProductionData {
  areaPlantada: number;
  produtividadeMedia: number;
  receita: number;
  ebitda: number;
  margemEbitda: number;
  custoTotal: number;
  lucroLiquido: number;
  safraAtual?: string;
  culturas: Array<{
    nome: string;
    area: number;
    produtividade: number;
    receita: number;
  }>;
}

export interface FinancialData {
  dividaBancaria: number;
  dividaTerras: number;
  dividaFornecedores: number;
  dividaTotal: number;
  caixaDisponibilidades: number;
  estoquesTotal: number;
  recebiveisTotal: number;
  dividaLiquida: number;
  indicadores: {
    dividaReceita: number;
    dividaEbitda: number;
    dividaPatrimonio: number;
    liquidezCorrente: number;
  };
}

export interface DREData {
  receita: number;
  custoProducao: number;
  lucroBruto: number;
  margemBruta: number;
  despesasOperacionais: number;
  despesasAdministrativas: number;
  ebitda: number;
  margemEbitda: number;
  despesasFinanceiras: number;
  lucroOperacional: number;
  impostos: number;
  lucroLiquido: number;
  margemLiquida: number;
}

export interface BalanceSheetData {
  ativo: {
    circulante: {
      caixaBancos: number;
      recebiveisClientes: number;
      estoques: {
        insumos: number;
        commodities: number;
        total: number;
      };
      outrosAtivos: number;
      total: number;
    };
    naoCirculante: {
      propriedades: number;
      maquinasEquipamentos: number;
      ativoBiologico: number;
      total: number;
    };
    total: number;
  };
  passivo: {
    circulante: {
      fornecedores: number;
      dividasBancarias: number;
      outrosPassivos: number;
      total: number;
    };
    naoCirculante: {
      dividasBancarias: number;
      dividasTerras: number;
      outrosPassivos: number;
      total: number;
    };
    patrimonioLiquido: {
      capitalSocial: number;
      lucrosAcumulados: number;
      resultadoExercicio: number;
      total: number;
    };
    total: number;
  };
}

export interface ReportData {
  organization: OrganizationData;
  properties: PropertyData;
  production: ProductionData;
  financial: FinancialData;
  dre: DREData;
  balanceSheet: BalanceSheetData;
  generatedAt: Date;
}

export async function generateReportData(organizationId: string): Promise<ReportData> {
  const supabase = await createClient();

  // 1. Dados da Organização
  const { data: orgData } = await supabase
    .from("organizacoes")
    .select("*")
    .eq("id", organizationId)
    .single();

  const organization: OrganizationData = {
    id: orgData.id,
    nome: orgData.nome,
    cnpj: orgData.cnpj,
    endereco: orgData.endereco,
    cidade: orgData.cidade,
    estado: orgData.estado,
    telefone: orgData.telefone,
    email: orgData.email,
    website: orgData.website,
    logo: orgData.logo,
  };

  // 2. Dados das Propriedades
  const properties = await getProperties(organizationId);
  const propertyData: PropertyData = {
    totalFazendas: properties.length,
    areaTotal: properties.reduce((sum, p) => sum + (p.area_total || 0), 0),
    valorPatrimonial: properties.reduce((sum, p) => sum + (p.valor_atual || 0), 0),
    areaCultivavel: properties.reduce((sum, p) => sum + (p.area_cultivada || 0), 0),
    utilizacaoPercentual: 0,
    propriedades: properties.map(p => ({
      nome: p.nome,
      area_total: p.area_total || 0,
      area_cultivada: p.area_cultivada || 0,
      valor_atual: p.valor_atual || 0,
      tipo: p.tipo || "PROPRIO",
      cidade: p.cidade || "",
      estado: p.estado || "",
    })),
  };

  propertyData.utilizacaoPercentual = propertyData.areaTotal > 0 
    ? (propertyData.areaCultivavel / propertyData.areaTotal) * 100 
    : 0;

  // 3. Dados de Produção
  const productionStats = await getProductionStats(organizationId);
  const safras = await getSafras(organizationId);
  const safraAtual = safras.length > 0 ? safras[0].nome : "2024/25";

  const productionData: ProductionData = {
    areaPlantada: productionStats.areaPlantada,
    produtividadeMedia: productionStats.produtividadeMedia,
    receita: productionStats.receita,
    ebitda: productionStats.ebitda,
    margemEbitda: productionStats.margemEbitda,
    custoTotal: productionStats.custoTotal,
    lucroLiquido: productionStats.ebitda * 0.5, // Estimativa: 50% do EBITDA
    safraAtual,
    culturas: [], // Seria necessário buscar dados detalhados por cultura
  };

  // 4. Dados Financeiros
  const [
    dividasBancarias,
    dividasTerras,
    dividasFornecedores,
    caixaDisponibilidades,
    financeiras,
    // outrasDespesas,
    // receitasFinanceiras,
  ] = await Promise.all([
    getDividasBancarias(organizationId),
    getDividasTerras(organizationId),
    getDividasFornecedores(organizationId),
    getCaixaDisponibilidades(organizationId),
    getFinanceiras(organizationId),
    getOutrasDespesas(organizationId),
    getReceitasFinanceiras(organizationId),
  ]);

  // Calcular totais financeiros
  const totalDividaBancaria = dividasBancarias.reduce((sum, d) => {
    const valores = d.valores_por_ano || {};
    return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
  }, 0);

  const totalDividaTerras = dividasTerras.reduce((sum, d) => {
    const valores = d.valores_por_safra || {};
    return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
  }, 0);

  const totalDividaFornecedores = dividasFornecedores.reduce((sum, d) => {
    const valores = d.valores_por_safra || {};
    return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
  }, 0);

  const totalCaixa = caixaDisponibilidades
    .filter(c => c.categoria === "CAIXA_BANCOS")
    .reduce((sum, c) => {
      const valores = c.valores_por_ano || {};
      return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
    }, 0);

  const totalEstoques = caixaDisponibilidades
    .filter(c => c.categoria.includes("ESTOQUE"))
    .reduce((sum, c) => {
      const valores = c.valores_por_ano || {};
      return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
    }, 0);

  const totalRecebiveis = caixaDisponibilidades
    .filter(c => c.categoria === "CLIENTES")
    .reduce((sum, c) => {
      const valores = c.valores_por_ano || {};
      return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
    }, 0);

  const dividaTotal = totalDividaBancaria + totalDividaTerras + totalDividaFornecedores;
  const ativosLiquidos = totalCaixa + totalEstoques + totalRecebiveis;
  const dividaLiquida = dividaTotal - ativosLiquidos;

  const financialData: FinancialData = {
    dividaBancaria: totalDividaBancaria,
    dividaTerras: totalDividaTerras,
    dividaFornecedores: totalDividaFornecedores,
    dividaTotal,
    caixaDisponibilidades: totalCaixa,
    estoquesTotal: totalEstoques,
    recebiveisTotal: totalRecebiveis,
    dividaLiquida,
    indicadores: {
      dividaReceita: productionData.receita > 0 ? dividaTotal / productionData.receita : 0,
      // Calculate ratio even when EBITDA is negative to show true financial situation
      dividaEbitda: productionData.ebitda !== 0 ? dividaTotal / productionData.ebitda : 0,
      dividaPatrimonio: propertyData.valorPatrimonial > 0 ? dividaTotal / propertyData.valorPatrimonial : 0,
      liquidezCorrente: dividaTotal > 0 ? ativosLiquidos / dividaTotal : 0,
    },
  };

  // 5. DRE (Demonstração de Resultados)
  const totalDespesasOperacionais = await getTotalOutrasDespesas(organizationId);
  const despesasFinanceiras = financeiras.reduce((sum, f) => {
    const valores = f.valores_por_ano || {};
    return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
  }, 0);

  const dreData: DREData = {
    receita: productionData.receita,
    custoProducao: productionData.custoTotal,
    lucroBruto: productionData.receita - productionData.custoTotal,
    margemBruta: productionData.receita > 0 ? ((productionData.receita - productionData.custoTotal) / productionData.receita) * 100 : 0,
    despesasOperacionais: totalDespesasOperacionais,
    despesasAdministrativas: totalDespesasOperacionais * 0.3, // Estimativa: 30% das despesas operacionais
    ebitda: productionData.ebitda,
    margemEbitda: productionData.margemEbitda,
    despesasFinanceiras,
    lucroOperacional: productionData.ebitda - despesasFinanceiras,
    impostos: productionData.ebitda * 0.15, // Estimativa: 15% do EBITDA
    lucroLiquido: productionData.lucroLiquido,
    margemLiquida: productionData.receita > 0 ? (productionData.lucroLiquido / productionData.receita) * 100 : 0,
  };

  // 6. Balanço Patrimonial
  const totalMaquinasEquipamentos = 0; // TODO: Implementar quando o módulo de ativos estiver disponível
  
  const balanceSheetData: BalanceSheetData = {
    ativo: {
      circulante: {
        caixaBancos: totalCaixa,
        recebiveisClientes: totalRecebiveis,
        estoques: {
          insumos: caixaDisponibilidades
            .filter(c => c.categoria === "ESTOQUE_DEFENSIVOS" || c.categoria === "ESTOQUE_FERTILIZANTES")
            .reduce((sum, c) => {
              const valores = c.valores_por_ano || {};
              return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
            }, 0),
          commodities: caixaDisponibilidades
            .filter(c => c.categoria === "ESTOQUE_COMMODITIES")
            .reduce((sum, c) => {
              const valores = c.valores_por_ano || {};
              return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
            }, 0),
          total: totalEstoques,
        },
        outrosAtivos: caixaDisponibilidades
          .filter(c => c.categoria === "ADIANTAMENTOS" || c.categoria === "EMPRESTIMOS")
          .reduce((sum, c) => {
            const valores = c.valores_por_ano || {};
            return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
          }, 0),
        total: 0, // Será calculado
      },
      naoCirculante: {
        propriedades: propertyData.valorPatrimonial,
        maquinasEquipamentos: totalMaquinasEquipamentos,
        ativoBiologico: caixaDisponibilidades
          .filter(c => c.categoria === "ATIVO_BIOLOGICO" || c.categoria === "SEMOVENTES")
          .reduce((sum, c) => {
            const valores = c.valores_por_ano || {};
            return sum + Object.values(valores).reduce((s: number, v) => s + Number(v || 0), 0);
          }, 0),
        total: 0, // Será calculado
      },
      total: 0, // Será calculado
    },
    passivo: {
      circulante: {
        fornecedores: totalDividaFornecedores * 0.5, // Estimativa: 50% é de curto prazo
        dividasBancarias: totalDividaBancaria * 0.3, // Estimativa: 30% é de curto prazo
        outrosPassivos: 0,
        total: 0, // Será calculado
      },
      naoCirculante: {
        dividasBancarias: totalDividaBancaria * 0.7, // Estimativa: 70% é de longo prazo
        dividasTerras: totalDividaTerras,
        outrosPassivos: totalDividaFornecedores * 0.5, // Estimativa: 50% é de longo prazo
        total: 0, // Será calculado
      },
      patrimonioLiquido: {
        capitalSocial: propertyData.valorPatrimonial * 0.5, // Estimativa
        lucrosAcumulados: productionData.lucroLiquido * 2, // Estimativa: 2 anos de lucro
        resultadoExercicio: productionData.lucroLiquido,
        total: 0, // Será calculado
      },
      total: 0, // Será calculado
    },
  };

  // Calcular totais do balanço
  balanceSheetData.ativo.circulante.total = 
    balanceSheetData.ativo.circulante.caixaBancos +
    balanceSheetData.ativo.circulante.recebiveisClientes +
    balanceSheetData.ativo.circulante.estoques.total +
    balanceSheetData.ativo.circulante.outrosAtivos;

  balanceSheetData.ativo.naoCirculante.total = 
    balanceSheetData.ativo.naoCirculante.propriedades +
    balanceSheetData.ativo.naoCirculante.maquinasEquipamentos +
    balanceSheetData.ativo.naoCirculante.ativoBiologico;

  balanceSheetData.ativo.total = 
    balanceSheetData.ativo.circulante.total +
    balanceSheetData.ativo.naoCirculante.total;

  balanceSheetData.passivo.circulante.total = 
    balanceSheetData.passivo.circulante.fornecedores +
    balanceSheetData.passivo.circulante.dividasBancarias +
    balanceSheetData.passivo.circulante.outrosPassivos;

  balanceSheetData.passivo.naoCirculante.total = 
    balanceSheetData.passivo.naoCirculante.dividasBancarias +
    balanceSheetData.passivo.naoCirculante.dividasTerras +
    balanceSheetData.passivo.naoCirculante.outrosPassivos;

  balanceSheetData.passivo.patrimonioLiquido.total = 
    balanceSheetData.passivo.patrimonioLiquido.capitalSocial +
    balanceSheetData.passivo.patrimonioLiquido.lucrosAcumulados +
    balanceSheetData.passivo.patrimonioLiquido.resultadoExercicio;

  balanceSheetData.passivo.total = 
    balanceSheetData.passivo.circulante.total +
    balanceSheetData.passivo.naoCirculante.total +
    balanceSheetData.passivo.patrimonioLiquido.total;

  return {
    organization,
    properties: propertyData,
    production: productionData,
    financial: financialData,
    dre: dreData,
    balanceSheet: balanceSheetData,
    generatedAt: new Date(),
  };
}