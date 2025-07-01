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
import { getProperties, getLeases, getImprovements } from "../property-actions";
import { getEquipments, getInvestments } from "../patrimonio-actions";
import { 
  getReceivableContracts, 
  getSupplierAdvances, 
  getThirdPartyLoans 
} from "../financial-actions";

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
        sementes: Record<string, number>;
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
        veiculos: Record<string, number>;
        benfeitorias: Record<string, number>;
        depreciacao_acumulada: Record<string, number>;
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
    // Buscar dados necessários em paralelo
    const [
      fluxoCaixaData,
      liquidityFactors,
      inventories,
      commodityInventories,
      suppliers,
      properties,
      equipments,
      investments,
      receivableContracts,
      supplierAdvances,
      thirdPartyLoans,
      debtPosition,
      leases,
      improvements
    ] = await Promise.all([
      getFluxoCaixaSimplificado(organizacaoId),
      getLiquidityFactorsUnified(organizacaoId),
      getInventoriesUnified(organizacaoId),
      getCommodityInventoriesUnified(organizacaoId),
      getSuppliersUnified(organizacaoId),
      getProperties(organizacaoId),
      getEquipments(organizacaoId),
      getInvestments(organizacaoId),
      getReceivableContracts(organizacaoId),
      getSupplierAdvances(organizacaoId),
      getThirdPartyLoans(organizacaoId),
      getDebtPosition(organizacaoId),
      getLeases(organizacaoId),
      getImprovements(organizacaoId)
    ]);

    const anos = fluxoCaixaData.anos;
    // Filtrar anos para remover 2030/31 e 2031/32
    const anosFiltrados = anos.filter((ano: string) => ano !== "2030/31" && ano !== "2031/32");
    
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
            sementes: {},
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
            veiculos: {},
            benfeitorias: {},
            depreciacao_acumulada: {},
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

    // Debug logs
    console.log("Calculando balanço patrimonial...");
    console.log("Anos:", anosFiltrados);

    // CALCULAR VALORES ATUAIS (para usar em todos os anos)
    
    // 1. ATIVO CIRCULANTE
    
    // Caixa e Bancos
    let caixaBancosValor = 0;
    if (liquidityFactors && liquidityFactors.liquidityFactors && Array.isArray(liquidityFactors.liquidityFactors)) {
      caixaBancosValor = liquidityFactors.liquidityFactors
        .filter((item: any) => item.categoria === "CAIXA_BANCOS")
        .reduce((acc: number, item: any) => {
          // Somar todos os valores por safra/ano
          const valores = item.valores_por_safra || item.valores_por_ano || {};
          const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
          return acc + total;
        }, 0);
    }
    console.log("Caixa e Bancos:", caixaBancosValor);

    // Clientes (Contas a Receber)
    let clientesValor = 0;
    if (Array.isArray(receivableContracts)) {
      clientesValor = receivableContracts.reduce((acc: number, item: any) => acc + (item.valor || 0), 0);
    }
    console.log("Clientes:", clientesValor);

    // Adiantamentos a Fornecedores
    let adiantamentosFornecedoresValor = 0;
    if (Array.isArray(supplierAdvances)) {
      adiantamentosFornecedoresValor = supplierAdvances.reduce((acc: number, item: any) => acc + (item.valor || 0), 0);
    }
    console.log("Adiantamentos Fornecedores:", adiantamentosFornecedoresValor);

    // Estoques
    let estoquesDefensivosValor = 0;
    let estoquesFertilizantesValor = 0;
    let estoquesAlmoxarifadoValor = 0;
    let estoquesSementesValor = 0;
    if (inventories && inventories.inventories && Array.isArray(inventories.inventories)) {
      estoquesDefensivosValor = inventories.inventories
        .filter((item: any) => item.categoria === "ESTOQUE_DEFENSIVOS")
        .reduce((acc: number, item: any) => {
          const valores = item.valores_por_safra || item.valores_por_ano || {};
          const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
          return acc + total;
        }, 0);
      
      estoquesFertilizantesValor = inventories.inventories
        .filter((item: any) => item.categoria === "ESTOQUE_FERTILIZANTES")
        .reduce((acc: number, item: any) => {
          const valores = item.valores_por_safra || item.valores_por_ano || {};
          const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
          return acc + total;
        }, 0);
      
      estoquesAlmoxarifadoValor = inventories.inventories
        .filter((item: any) => item.categoria === "ESTOQUE_ALMOXARIFADO")
        .reduce((acc: number, item: any) => {
          const valores = item.valores_por_safra || item.valores_por_ano || {};
          const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
          return acc + total;
        }, 0);
        
      estoquesSementesValor = inventories.inventories
        .filter((item: any) => item.categoria === "ESTOQUE_SEMENTES")
        .reduce((acc: number, item: any) => {
          const valores = item.valores_por_safra || item.valores_por_ano || {};
          const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
          return acc + total;
        }, 0);
    }

    let estoquesCommoditiesValor = 0;
    if (commodityInventories && commodityInventories.commodityInventories && Array.isArray(commodityInventories.commodityInventories)) {
      estoquesCommoditiesValor = commodityInventories.commodityInventories
        .reduce((acc: number, item: any) => {
          const valores = item.valores_totais_por_ano || item.valores_por_safra || item.valores_por_ano || {};
          const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
          return acc + total;
        }, 0);
    }

    const estoquesTotalValor = estoquesDefensivosValor + estoquesFertilizantesValor + 
                               estoquesAlmoxarifadoValor + estoquesSementesValor + estoquesCommoditiesValor;
    console.log("Estoques Total:", estoquesTotalValor);

    // Empréstimos a Terceiros
    let emprestimosATerceirosValor = 0;
    if (Array.isArray(thirdPartyLoans)) {
      emprestimosATerceirosValor = thirdPartyLoans.reduce((acc: number, item: any) => acc + (item.valor || 0), 0);
    }
    console.log("Empréstimos a Terceiros:", emprestimosATerceirosValor);

    // Total Ativo Circulante
    const ativoCirculanteTotal = caixaBancosValor + clientesValor + adiantamentosFornecedoresValor + 
                                 estoquesTotalValor + emprestimosATerceirosValor;
    console.log("Ativo Circulante Total:", ativoCirculanteTotal);

    // 2. ATIVO NÃO CIRCULANTE

    // Investimentos
    let investimentosValor = 0;
    if (investments && 'data' in investments && Array.isArray(investments.data)) {
      investimentosValor = investments.data.reduce((acc: number, item: any) => {
        const valorTotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        return acc + valorTotal;
      }, 0);
    }
    console.log("Investimentos:", investimentosValor);

    // Terras
    let terrasValor = 0;
    if (Array.isArray(properties)) {
      terrasValor = properties.reduce((acc: number, item: any) => acc + (item.valor_atual || 0), 0);
    }
    console.log("Terras:", terrasValor);

    // Máquinas e Equipamentos
    let maquinasEquipamentosValor = 0;
    if (equipments && 'data' in equipments && Array.isArray(equipments.data)) {
      maquinasEquipamentosValor = equipments.data.reduce((acc: number, item: any) => acc + (item.valor_aquisicao || 0), 0);
    }
    console.log("Máquinas e Equipamentos:", maquinasEquipamentosValor);

    // Benfeitorias
    let benfeitoriasValor = 0;
    if (Array.isArray(improvements)) {
      benfeitoriasValor = improvements.reduce((acc: number, item: any) => acc + (item.valor || 0), 0);
    }
    console.log("Benfeitorias:", benfeitoriasValor);

    const imobilizadoTotal = terrasValor + maquinasEquipamentosValor + benfeitoriasValor;
    const ativoNaoCirculanteTotal = investimentosValor + imobilizadoTotal;
    console.log("Ativo Não Circulante Total:", ativoNaoCirculanteTotal);

    // Total do Ativo
    const ativoTotal = ativoCirculanteTotal + ativoNaoCirculanteTotal;
    console.log("Ativo Total:", ativoTotal);

    // 3. PASSIVO

    // Fornecedores - pegar valor do primeiro ano disponível
    let fornecedoresValor = 0;
    if (suppliers && suppliers.suppliers && Array.isArray(suppliers.suppliers)) {
      fornecedoresValor = suppliers.suppliers.reduce((acc: number, item: any) => {
        if (item.valores_por_ano && typeof item.valores_por_ano === 'object') {
          // Pegar o primeiro valor disponível
          const anos = Object.keys(item.valores_por_ano).sort();
          if (anos.length > 0) {
            return acc + (item.valores_por_ano[anos[0]] || 0);
          }
        }
        return acc;
      }, 0);
    }
    console.log("Fornecedores:", fornecedoresValor);

    // Dívidas
    let dividasCurtoPrazo = 0;
    let dividasLongoPrazo = 0;
    let financiamentosTerras = 0;
    if (debtPosition && (debtPosition as any).items && Array.isArray((debtPosition as any).items)) {
      (debtPosition as any).items.forEach((debt: any) => {
        if (debt.annual_payments && typeof debt.annual_payments === 'object') {
          const anos = Object.keys(debt.annual_payments).sort();
          if (anos.length > 0) {
            // Primeiro ano = curto prazo
            dividasCurtoPrazo += debt.annual_payments[anos[0]] || 0;
            
            // Resto = longo prazo
            if (debt.categoria === "TERRAS") {
              for (let i = 1; i < anos.length; i++) {
                financiamentosTerras += debt.annual_payments[anos[i]] || 0;
              }
            } else {
              for (let i = 1; i < anos.length; i++) {
                dividasLongoPrazo += debt.annual_payments[anos[i]] || 0;
              }
            }
          }
        }
      });
    }
    console.log("Dívidas Curto Prazo:", dividasCurtoPrazo);
    console.log("Dívidas Longo Prazo:", dividasLongoPrazo);
    console.log("Financiamentos Terras:", financiamentosTerras);

    // Arrendamentos
    let arrendamentosValor = 0;
    if (Array.isArray(leases)) {
      arrendamentosValor = leases.reduce((acc: number, lease: any) => {
        const custoAnual = (lease.custo_ano || 0) * 5500; // Preço médio saca
        return acc + custoAnual;
      }, 0);
    }
    console.log("Arrendamentos:", arrendamentosValor);

    // Totais do Passivo
    const passivoCirculanteTotal = fornecedoresValor + dividasCurtoPrazo;
    const passivoNaoCirculanteTotal = dividasLongoPrazo + financiamentosTerras + arrendamentosValor;
    const passivoTotal = passivoCirculanteTotal + passivoNaoCirculanteTotal;

    // Patrimônio Líquido (diferença)
    const patrimonioLiquidoTotal = ativoTotal - passivoTotal;
    const capitalSocial = patrimonioLiquidoTotal * 0.3; // 30% como capital social
    const lucrosAcumulados = patrimonioLiquidoTotal * 0.7; // 70% como lucros acumulados

    console.log("Patrimônio Líquido Total:", patrimonioLiquidoTotal);

    // APLICAR VALORES PARA CADA ANO
    anosFiltrados.forEach((ano: string) => {
      // Ativo Circulante
      balancoData.ativo.circulante.caixa_bancos[ano] = caixaBancosValor;
      balancoData.ativo.circulante.clientes[ano] = clientesValor;
      balancoData.ativo.circulante.adiantamentos_fornecedores[ano] = adiantamentosFornecedoresValor;
      balancoData.ativo.circulante.estoques.defensivos[ano] = estoquesDefensivosValor;
      balancoData.ativo.circulante.estoques.fertilizantes[ano] = estoquesFertilizantesValor;
      balancoData.ativo.circulante.estoques.almoxarifado[ano] = estoquesAlmoxarifadoValor;
      balancoData.ativo.circulante.estoques.commodities[ano] = estoquesCommoditiesValor;
      balancoData.ativo.circulante.estoques.sementes[ano] = 0;
      balancoData.ativo.circulante.estoques.total[ano] = estoquesTotalValor;
      balancoData.ativo.circulante.emprestimos_terceiros[ano] = emprestimosATerceirosValor;
      balancoData.ativo.circulante.outros_ativos_circulantes[ano] = 0;
      balancoData.ativo.circulante.total[ano] = ativoCirculanteTotal;

      // Ativo Não Circulante
      balancoData.ativo.nao_circulante.investimentos[ano] = investimentosValor;
      balancoData.ativo.nao_circulante.imobilizado.terras[ano] = terrasValor;
      balancoData.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] = maquinasEquipamentosValor;
      balancoData.ativo.nao_circulante.imobilizado.veiculos[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.benfeitorias[ano] = benfeitoriasValor;
      balancoData.ativo.nao_circulante.imobilizado.depreciacao_acumulada[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.outros_imobilizados[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.total[ano] = imobilizadoTotal;
      balancoData.ativo.nao_circulante.total[ano] = ativoNaoCirculanteTotal;
      balancoData.ativo.total[ano] = ativoTotal;

      // Passivo Circulante
      balancoData.passivo.circulante.fornecedores[ano] = fornecedoresValor;
      balancoData.passivo.circulante.emprestimos_financiamentos_curto_prazo[ano] = dividasCurtoPrazo;
      balancoData.passivo.circulante.adiantamentos_clientes[ano] = 0;
      balancoData.passivo.circulante.impostos_taxas[ano] = 0;
      balancoData.passivo.circulante.outros_passivos_circulantes[ano] = 0;
      balancoData.passivo.circulante.total[ano] = passivoCirculanteTotal;

      // Passivo Não Circulante
      balancoData.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo[ano] = dividasLongoPrazo;
      balancoData.passivo.nao_circulante.financiamentos_terras[ano] = financiamentosTerras;
      balancoData.passivo.nao_circulante.arrendamentos[ano] = arrendamentosValor;
      balancoData.passivo.nao_circulante.outros_passivos_nao_circulantes[ano] = 0;
      balancoData.passivo.nao_circulante.total[ano] = passivoNaoCirculanteTotal;

      // Patrimônio Líquido
      balancoData.passivo.patrimonio_liquido.capital_social[ano] = capitalSocial;
      balancoData.passivo.patrimonio_liquido.reservas[ano] = 0;
      balancoData.passivo.patrimonio_liquido.lucros_acumulados[ano] = lucrosAcumulados;
      balancoData.passivo.patrimonio_liquido.total[ano] = patrimonioLiquidoTotal;

      // Total do Passivo + PL
      balancoData.passivo.total[ano] = ativoTotal; // Deve ser igual ao ativo total
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
          sementes: {},
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
          veiculos: {},
          benfeitorias: {},
          depreciacao_acumulada: {},
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
  anos.forEach((ano: string) => {
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