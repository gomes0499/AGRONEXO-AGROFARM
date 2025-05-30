"use server";

import { getSession } from "@/lib/auth";
import { getFluxoCaixaSimplificado } from "./fluxo-caixa-simplificado";
import { getDebtPosition } from "../debt-position-actions";
import { 
  getLiquidityFactorsUnified, 
  getInventoriesUnified, 
  getCommodityInventoriesUnified,
  getSuppliersUnified 
} from "../financial-liquidity-actions";
import { getProperties } from "../property-actions";

// Interface para os dados do Balanço Patrimonial
export interface BalancoPatrimonialData {
  anos: string[];
  // Ativo
  ativo: {
    // Ativo Circulante
    circulante: {
      caixa_bancos: Record<string, number>;
      clientes: Record<string, number>;
      adiantamentos_fornecedores: Record<string, number>;
      estoques: {
        defensivos: Record<string, number>;
        fertilizantes: Record<string, number>;
        almoxarifado: Record<string, number>;
        commodities: Record<string, number>;
        total: Record<string, number>;
      };
      emprestimos_terceiros: Record<string, number>;
      outros_ativos_circulantes: Record<string, number>;
      total: Record<string, number>;
    };
    // Ativo Não Circulante
    nao_circulante: {
      investimentos: Record<string, number>;
      imobilizado: {
        terras: Record<string, number>;
        maquinas_equipamentos: Record<string, number>;
        benfeitorias: Record<string, number>;
        outros_imobilizados: Record<string, number>;
        total: Record<string, number>;
      };
      total: Record<string, number>;
    };
    // Total do Ativo
    total: Record<string, number>;
  };
  // Passivo
  passivo: {
    // Passivo Circulante
    circulante: {
      fornecedores: Record<string, number>;
      emprestimos_financiamentos_curto_prazo: Record<string, number>;
      adiantamentos_clientes: Record<string, number>;
      impostos_taxas: Record<string, number>;
      outros_passivos_circulantes: Record<string, number>;
      total: Record<string, number>;
    };
    // Passivo Não Circulante
    nao_circulante: {
      emprestimos_financiamentos_longo_prazo: Record<string, number>;
      financiamentos_terras: Record<string, number>;
      arrendamentos: Record<string, number>;
      outros_passivos_nao_circulantes: Record<string, number>;
      total: Record<string, number>;
    };
    // Patrimônio Líquido
    patrimonio_liquido: {
      capital_social: Record<string, number>;
      reservas: Record<string, number>;
      lucros_acumulados: Record<string, number>;
      total: Record<string, number>;
    };
    // Total do Passivo + PL
    total: Record<string, number>;
  };
}

export async function getBalancoPatrimonialData(organizacaoId: string): Promise<BalancoPatrimonialData> {
  const session = await getSession();

  if (!session) {
    throw new Error("Não autorizado");
  }

  try {
    // Buscar apenas os anos do fluxo de caixa
    const fluxoCaixaData = await getFluxoCaixaSimplificado(organizacaoId);
    const anos = fluxoCaixaData.anos;

    // Filtrar anos para remover 2030/31 e 2031/32
    const anosFiltrados = anos.filter(ano => ano !== "2030/31" && ano !== "2031/32");
    
    // Inicializar objeto de retorno com valores zerados
    const balancoData: BalancoPatrimonialData = {
      anos: anosFiltrados,
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
            total: {},
          },
          emprestimos_terceiros: {},
          outros_ativos_circulantes: {},
          total: {},
        },
        nao_circulante: {
          investimentos: {},
          imobilizado: {
            terras: {},
            maquinas_equipamentos: {},
            benfeitorias: {},
            outros_imobilizados: {},
            total: {},
          },
          total: {},
        },
        total: {},
      },
      passivo: {
        circulante: {
          fornecedores: {},
          emprestimos_financiamentos_curto_prazo: {},
          adiantamentos_clientes: {},
          impostos_taxas: {},
          outros_passivos_circulantes: {},
          total: {},
        },
        nao_circulante: {
          emprestimos_financiamentos_longo_prazo: {},
          financiamentos_terras: {},
          arrendamentos: {},
          outros_passivos_nao_circulantes: {},
          total: {},
        },
        patrimonio_liquido: {
          capital_social: {},
          reservas: {},
          lucros_acumulados: {},
          total: {},
        },
        total: {},
      },
    };

    // Preencher todos os campos com zero para cada ano
    anosFiltrados.forEach(ano => {
      // 1. Ativo Circulante
      balancoData.ativo.circulante.caixa_bancos[ano] = 0;
      balancoData.ativo.circulante.clientes[ano] = 0;
      balancoData.ativo.circulante.adiantamentos_fornecedores[ano] = 0;
      
      // Estoques
      balancoData.ativo.circulante.estoques.defensivos[ano] = 0;
      balancoData.ativo.circulante.estoques.fertilizantes[ano] = 0;
      balancoData.ativo.circulante.estoques.almoxarifado[ano] = 0;
      balancoData.ativo.circulante.estoques.commodities[ano] = 0;
      balancoData.ativo.circulante.estoques.total[ano] = 0;
      
      balancoData.ativo.circulante.emprestimos_terceiros[ano] = 0;
      balancoData.ativo.circulante.outros_ativos_circulantes[ano] = 0;
      
      // Total Ativo Circulante
      balancoData.ativo.circulante.total[ano] = 0;
      
      // 2. Ativo Não Circulante
      balancoData.ativo.nao_circulante.investimentos[ano] = 0;
      
      // Imobilizado
      balancoData.ativo.nao_circulante.imobilizado.terras[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.benfeitorias[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.outros_imobilizados[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.total[ano] = 0;
      
      // Total Ativo Não Circulante
      balancoData.ativo.nao_circulante.total[ano] = 0;
      
      // Total do Ativo
      balancoData.ativo.total[ano] = 0;
      
      // 1. Passivo Circulante
      balancoData.passivo.circulante.fornecedores[ano] = 0;
      balancoData.passivo.circulante.emprestimos_financiamentos_curto_prazo[ano] = 0;
      balancoData.passivo.circulante.adiantamentos_clientes[ano] = 0;
      balancoData.passivo.circulante.impostos_taxas[ano] = 0;
      balancoData.passivo.circulante.outros_passivos_circulantes[ano] = 0;
      
      // Total Passivo Circulante
      balancoData.passivo.circulante.total[ano] = 0;
      
      // 2. Passivo Não Circulante
      balancoData.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo[ano] = 0;
      balancoData.passivo.nao_circulante.financiamentos_terras[ano] = 0;
      balancoData.passivo.nao_circulante.arrendamentos[ano] = 0;
      balancoData.passivo.nao_circulante.outros_passivos_nao_circulantes[ano] = 0;
      
      // Total Passivo Não Circulante
      balancoData.passivo.nao_circulante.total[ano] = 0;
      
      // 3. Patrimônio Líquido
      balancoData.passivo.patrimonio_liquido.capital_social[ano] = 0;
      balancoData.passivo.patrimonio_liquido.reservas[ano] = 0;
      balancoData.passivo.patrimonio_liquido.lucros_acumulados[ano] = 0;
      
      // Total Patrimônio Líquido
      balancoData.passivo.patrimonio_liquido.total[ano] = 0;
      
      // Total do Passivo + PL
      balancoData.passivo.total[ano] = 0;
    });

    return balancoData;
  } catch (error) {
    console.error("Erro ao buscar dados do Balanço Patrimonial:", error);
    
    // Retornar dados zerados em caso de erro
    return generateZeroBalancoPatrimonialData();
  }
}

function generateZeroBalancoPatrimonialData(): BalancoPatrimonialData {
  const anos = ["2021/22", "2022/23", "2023/24", "2024/25", "2025/26", "2026/27", "2027/28", "2028/29", "2029/30"];
  
  const zeroData: BalancoPatrimonialData = {
    anos,
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
          total: {},
        },
        emprestimos_terceiros: {},
        outros_ativos_circulantes: {},
        total: {},
      },
      nao_circulante: {
        investimentos: {},
        imobilizado: {
          terras: {},
          maquinas_equipamentos: {},
          benfeitorias: {},
          outros_imobilizados: {},
          total: {},
        },
        total: {},
      },
      total: {},
    },
    passivo: {
      circulante: {
        fornecedores: {},
        emprestimos_financiamentos_curto_prazo: {},
        adiantamentos_clientes: {},
        impostos_taxas: {},
        outros_passivos_circulantes: {},
        total: {},
      },
      nao_circulante: {
        emprestimos_financiamentos_longo_prazo: {},
        financiamentos_terras: {},
        arrendamentos: {},
        outros_passivos_nao_circulantes: {},
        total: {},
      },
      patrimonio_liquido: {
        capital_social: {},
        reservas: {},
        lucros_acumulados: {},
        total: {},
      },
      total: {},
    },
  };

  // Preencher todos os campos com zero para cada ano
  anos.forEach(ano => {
    // 1. Ativo Circulante
    zeroData.ativo.circulante.caixa_bancos[ano] = 0;
    zeroData.ativo.circulante.clientes[ano] = 0;
    zeroData.ativo.circulante.adiantamentos_fornecedores[ano] = 0;
    
    zeroData.ativo.circulante.estoques.defensivos[ano] = 0;
    zeroData.ativo.circulante.estoques.fertilizantes[ano] = 0;
    zeroData.ativo.circulante.estoques.almoxarifado[ano] = 0;
    zeroData.ativo.circulante.estoques.commodities[ano] = 0;
    zeroData.ativo.circulante.estoques.total[ano] = 0;
    
    zeroData.ativo.circulante.emprestimos_terceiros[ano] = 0;
    zeroData.ativo.circulante.outros_ativos_circulantes[ano] = 0;
    
    zeroData.ativo.circulante.total[ano] = 0;
    
    // 2. Ativo Não Circulante
    zeroData.ativo.nao_circulante.investimentos[ano] = 0;
    
    zeroData.ativo.nao_circulante.imobilizado.terras[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.benfeitorias[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.outros_imobilizados[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.total[ano] = 0;
    
    zeroData.ativo.nao_circulante.total[ano] = 0;
    
    // Total do Ativo
    zeroData.ativo.total[ano] = 0;
    
    // 3. Passivo Circulante
    zeroData.passivo.circulante.fornecedores[ano] = 0;
    zeroData.passivo.circulante.emprestimos_financiamentos_curto_prazo[ano] = 0;
    zeroData.passivo.circulante.adiantamentos_clientes[ano] = 0;
    zeroData.passivo.circulante.impostos_taxas[ano] = 0;
    zeroData.passivo.circulante.outros_passivos_circulantes[ano] = 0;
    
    zeroData.passivo.circulante.total[ano] = 0;
    
    // 4. Passivo Não Circulante
    zeroData.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo[ano] = 0;
    zeroData.passivo.nao_circulante.financiamentos_terras[ano] = 0;
    zeroData.passivo.nao_circulante.arrendamentos[ano] = 0;
    zeroData.passivo.nao_circulante.outros_passivos_nao_circulantes[ano] = 0;
    
    zeroData.passivo.nao_circulante.total[ano] = 0;
    
    // 5. Patrimônio Líquido
    zeroData.passivo.patrimonio_liquido.capital_social[ano] = 0;
    zeroData.passivo.patrimonio_liquido.reservas[ano] = 0;
    zeroData.passivo.patrimonio_liquido.lucros_acumulados[ano] = 0;
    
    zeroData.passivo.patrimonio_liquido.total[ano] = 0;
    
    // Total do Passivo + PL
    zeroData.passivo.total[ano] = 0;
  });

  return zeroData;
}