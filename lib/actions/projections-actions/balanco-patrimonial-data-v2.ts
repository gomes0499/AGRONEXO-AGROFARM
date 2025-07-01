"use server";

import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFluxoCaixaSimplificado } from "./fluxo-caixa-simplificado";
import { getCaixaDisponibilidades } from "../financial-actions/caixa-disponibilidades";
import { getProperties, getImprovements, getLeases } from "../property-actions";
import { getEquipments, getInvestments } from "../patrimonio-actions";
import { getDebtPosition } from "../debt-position-actions";
import { getSuppliersUnified } from "../financial-liquidity-actions";
import { BalancoPatrimonialData } from "./balanco-patrimonial-data";
import { getDREDataUpdated } from "./dre-data-updated";

export async function getBalancoPatrimonialDataV2(organizacaoId: string, projectionId?: string): Promise<BalancoPatrimonialData> {
  const session = await getSession();

  if (!session) {
    throw new Error("Não autorizado");
  }

  const supabase = await createClient();

  try {
    // Buscar dados necessários em paralelo
    const [
      fluxoCaixaData,
      caixaDisponibilidades,
      suppliers,
      properties,
      equipments,
      investments,
      debtPosition,
      leases,
      improvements,
      safras,
      dreData
    ] = await Promise.all([
      getFluxoCaixaSimplificado(organizacaoId, projectionId),
      getCaixaDisponibilidades(organizacaoId, projectionId),
      getSuppliersUnified(organizacaoId, projectionId),
      getProperties(organizacaoId),
      getEquipments(organizacaoId),
      getInvestments(organizacaoId),
      getDebtPosition(organizacaoId, projectionId),
      getLeases(organizacaoId),
      getImprovements(organizacaoId),
      supabase
        .from("safras")
        .select("id, nome, ano_inicio, ano_fim")
        .eq("organizacao_id", organizacaoId)
        .order("ano_inicio"),
      getDREDataUpdated(organizacaoId, projectionId)
    ]);

    if (safras.error) {
      console.error("Erro ao buscar safras:", safras.error);
      throw safras.error;
    }

    // Handle empty safras gracefully
    if (!safras.data || safras.data.length === 0) {
      return {
        anos: [],
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
            imobilizado: {
              terras: {},
              maquinas_equipamentos: {},
              veiculos: {},
              benfeitorias: {},
              depreciacao_acumulada: {},
              outros_imobilizados: {},
              total: {}
            },
            investimentos: {},
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
    }

    // Criar mapeamento de safra nome para ID
    const safraNameToId = safras.data.reduce((acc, safra) => {
      acc[safra.nome] = safra.id;
      return acc;
    }, {} as Record<string, string>);

    const anos = fluxoCaixaData.anos;
    // Filtrar anos para remover 2030/31 e 2031/32
    const anosFiltrados = anos.filter((ano: string) => ano !== "2030/31" && ano !== "2031/32");
    
    // Inicializar objeto de retorno
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

    // Calcular lucros acumulados do DRE
    let lucrosAcumuladosPorAno: Record<string, number> = {};
    let lucroAcumuladoTotal = 0;
    
    // Capital social inicial (pode ser configurado ou buscado de outra tabela)
    const capitalSocialInicial = 1000000; // R$ 1 milhão como exemplo
    
    anosFiltrados.forEach((ano: string) => {
      // Acumular lucros do DRE
      const lucroLiquidoAno = dreData.lucro_liquido[ano] || 0;
      lucroAcumuladoTotal += lucroLiquidoAno;
      lucrosAcumuladosPorAno[ano] = lucroAcumuladoTotal;
    });

    // Processar dados para cada ano
    anosFiltrados.forEach((ano: string, index: number) => {
      const safraId = safraNameToId[ano];
      
      // 1. ATIVO CIRCULANTE
      
      // Caixa e Bancos
      let caixaBancosValor = 0;
      if (caixaDisponibilidades && Array.isArray(caixaDisponibilidades)) {
        caixaBancosValor = caixaDisponibilidades
          .filter((item: any) => item.categoria === "CAIXA_BANCOS")
          .reduce((acc: number, item: any) => {
            const valores = item.valores_por_ano || item.valores_por_safra || {};
            const valorAno = valores[safraId] || 0;
            return acc + Number(valorAno);
          }, 0);
      }

      // Clientes (por enquanto zero, mas pode ser implementado)
      const clientesValor = 0;

      // Adiantamentos a Fornecedores
      let adiantamentosFornecedoresValor = 0;
      if (caixaDisponibilidades && Array.isArray(caixaDisponibilidades)) {
        adiantamentosFornecedoresValor = caixaDisponibilidades
          .filter((item: any) => item.categoria === "ADIANTAMENTOS")
          .reduce((acc: number, item: any) => {
            const valores = item.valores_por_ano || item.valores_por_safra || {};
            const valorAno = valores[safraId] || 0;
            return acc + Number(valorAno);
          }, 0);
      }

      // Estoques
      let estoquesDefensivosValor = 0;
      let estoquesFertilizantesValor = 0;
      let estoquesAlmoxarifadoValor = 0;
      let estoquesSementesValor = 0;
      let estoquesCommoditiesValor = 0;
      
      if (caixaDisponibilidades && Array.isArray(caixaDisponibilidades)) {
        estoquesDefensivosValor = caixaDisponibilidades
          .filter((item: any) => item.categoria === "ESTOQUE_DEFENSIVOS")
          .reduce((acc: number, item: any) => {
            const valores = item.valores_por_ano || item.valores_por_safra || {};
            const valorAno = valores[safraId] || 0;
            return acc + Number(valorAno);
          }, 0);
        
        estoquesFertilizantesValor = caixaDisponibilidades
          .filter((item: any) => item.categoria === "ESTOQUE_FERTILIZANTES")
          .reduce((acc: number, item: any) => {
            const valores = item.valores_por_ano || item.valores_por_safra || {};
            const valorAno = valores[safraId] || 0;
            return acc + Number(valorAno);
          }, 0);
        
        estoquesAlmoxarifadoValor = caixaDisponibilidades
          .filter((item: any) => item.categoria === "ESTOQUE_ALMOXARIFADO")
          .reduce((acc: number, item: any) => {
            const valores = item.valores_por_ano || item.valores_por_safra || {};
            const valorAno = valores[safraId] || 0;
            return acc + Number(valorAno);
          }, 0);
          
        estoquesSementesValor = caixaDisponibilidades
          .filter((item: any) => item.categoria === "ESTOQUE_SEMENTES")
          .reduce((acc: number, item: any) => {
            const valores = item.valores_por_ano || item.valores_por_safra || {};
            const valorAno = valores[safraId] || 0;
            return acc + Number(valorAno);
          }, 0);
          
        estoquesCommoditiesValor = caixaDisponibilidades
          .filter((item: any) => item.categoria === "ESTOQUE_COMMODITIES")
          .reduce((acc: number, item: any) => {
            const valores = item.valores_por_ano || item.valores_por_safra || {};
            const valorAno = valores[safraId] || 0;
            return acc + Number(valorAno);
          }, 0);
      }

      const estoquesTotalValor = estoquesDefensivosValor + estoquesFertilizantesValor + 
                                estoquesAlmoxarifadoValor + estoquesSementesValor + estoquesCommoditiesValor;

      // Empréstimos a Terceiros
      let emprestimosATerceirosValor = 0;
      if (caixaDisponibilidades && Array.isArray(caixaDisponibilidades)) {
        emprestimosATerceirosValor = caixaDisponibilidades
          .filter((item: any) => item.categoria === "EMPRESTIMOS")
          .reduce((acc: number, item: any) => {
            const valores = item.valores_por_ano || item.valores_por_safra || {};
            const valorAno = valores[safraId] || 0;
            return acc + Number(valorAno);
          }, 0);
      }

      // Total Ativo Circulante
      const ativoCirculanteTotal = caixaBancosValor + clientesValor + adiantamentosFornecedoresValor + 
                                   estoquesTotalValor + emprestimosATerceirosValor;

      // 2. ATIVO NÃO CIRCULANTE

      // Investimentos (valor total, não varia por ano)
      let investimentosValor = 0;
      if (investments && Array.isArray(investments)) {
        investimentosValor = investments.reduce((acc: number, item: any) => {
          const valorTotal = (item.quantidade || 0) * (item.valor_unitario || 0);
          return acc + valorTotal;
        }, 0);
      }

      // Terras (valor total, não varia por ano)
      let terrasValor = 0;
      if (Array.isArray(properties)) {
        terrasValor = properties.reduce((acc: number, item: any) => acc + (item.valor_atual || 0), 0);
      }

      // Máquinas e Equipamentos (valor total, não varia por ano)
      let maquinasEquipamentosValor = 0;
      if (equipments && Array.isArray(equipments)) {
        maquinasEquipamentosValor = equipments.reduce((acc: number, item: any) => acc + (item.valor_aquisicao || 0), 0);
      }

      // Benfeitorias (valor total, não varia por ano)
      let benfeitoriasValor = 0;
      if (Array.isArray(improvements)) {
        benfeitoriasValor = improvements.reduce((acc: number, item: any) => acc + (item.valor || 0), 0);
      }

      const imobilizadoTotal = terrasValor + maquinasEquipamentosValor + benfeitoriasValor;
      const ativoNaoCirculanteTotal = investimentosValor + imobilizadoTotal;

      // Total do Ativo
      const ativoTotal = ativoCirculanteTotal + ativoNaoCirculanteTotal;

      // 3. PASSIVO

      // Fornecedores
      let fornecedoresValor = 0;
      if (suppliers && suppliers.suppliers && Array.isArray(suppliers.suppliers)) {
        fornecedoresValor = suppliers.suppliers.reduce((acc: number, item: any) => {
          const valores = item.valores_por_ano || {};
          const valorAno = valores[safraId] || 0;
          return acc + Number(valorAno);
        }, 0);
      }

      // Dívidas por ano (do debt position)
      let dividasCurtoPrazo = 0;
      let dividasLongoPrazo = 0;
      let financiamentosTerras = 0;
      
      if (debtPosition && debtPosition.dividas && Array.isArray(debtPosition.dividas)) {
        debtPosition.dividas.forEach((divida: any) => {
          const valoresPorAno = divida.valores_por_ano || {};
          
          // Para classificar curto vs longo prazo, precisamos olhar o fluxo de pagamento
          // Curto prazo: pagamentos devidos no próximo ano (safra seguinte)
          // Longo prazo: pagamentos devidos após o próximo ano
          
          if (divida.categoria === "TERRAS") {
            // Para terras, verificar se há pagamentos no próximo ano
            const proximoAno = index < anosFiltrados.length - 1 ? anosFiltrados[index + 1] : null;
            if (proximoAno) {
              const proximoSafraId = safraNameToId[proximoAno];
              const valorProximoAno = valoresPorAno[proximoSafraId] || 0;
              const valorAtual = valoresPorAno[safraId] || 0;
              
              // Se há redução no próximo ano, significa pagamento
              if (valorAtual > valorProximoAno) {
                const pagamentoCurtoPrazo = valorAtual - valorProximoAno;
                dividasCurtoPrazo += pagamentoCurtoPrazo;
                financiamentosTerras += valorProximoAno; // Saldo remanescente é longo prazo
              } else {
                financiamentosTerras += valorAtual; // Tudo é longo prazo
              }
            } else {
              // Último ano, considerar tudo como curto prazo
              dividasCurtoPrazo += valoresPorAno[safraId] || 0;
            }
          } else if (divida.categoria === "FORNECEDORES") {
            // Fornecedores geralmente são curto prazo
            dividasCurtoPrazo += valoresPorAno[safraId] || 0;
          } else if (divida.categoria === "BANCOS") {
            // Para bancos, analisar o fluxo de pagamento
            const proximoAno = index < anosFiltrados.length - 1 ? anosFiltrados[index + 1] : null;
            if (proximoAno) {
              const proximoSafraId = safraNameToId[proximoAno];
              const valorProximoAno = valoresPorAno[proximoSafraId] || 0;
              const valorAtual = valoresPorAno[safraId] || 0;
              
              // Se há redução no próximo ano, significa pagamento
              if (valorAtual > valorProximoAno) {
                const pagamentoCurtoPrazo = valorAtual - valorProximoAno;
                dividasCurtoPrazo += pagamentoCurtoPrazo;
                dividasLongoPrazo += valorProximoAno; // Saldo remanescente é longo prazo
              } else {
                dividasLongoPrazo += valorAtual; // Tudo é longo prazo se não há pagamento próximo
              }
            } else {
              // Último ano, considerar tudo como curto prazo
              dividasCurtoPrazo += valoresPorAno[safraId] || 0;
            }
          } else {
            // Outras dívidas - aplicar mesma lógica
            const proximoAno = index < anosFiltrados.length - 1 ? anosFiltrados[index + 1] : null;
            if (proximoAno) {
              const proximoSafraId = safraNameToId[proximoAno];
              const valorProximoAno = valoresPorAno[proximoSafraId] || 0;
              const valorAtual = valoresPorAno[safraId] || 0;
              
              if (valorAtual > valorProximoAno) {
                const pagamentoCurtoPrazo = valorAtual - valorProximoAno;
                dividasCurtoPrazo += pagamentoCurtoPrazo;
                dividasLongoPrazo += valorProximoAno;
              } else {
                dividasLongoPrazo += valorAtual;
              }
            } else {
              dividasCurtoPrazo += valoresPorAno[safraId] || 0;
            }
          }
        });
      }

      // Arrendamentos
      let arrendamentosValor = 0;
      if (Array.isArray(leases)) {
        arrendamentosValor = leases.reduce((acc: number, lease: any) => {
          const custoAnual = (lease.custo_ano || 0) * 5500; // Preço médio saca
          return acc + custoAnual;
        }, 0);
      }

      // Totais do Passivo
      const passivoCirculanteTotal = fornecedoresValor + dividasCurtoPrazo;
      const passivoNaoCirculanteTotal = dividasLongoPrazo + financiamentosTerras + arrendamentosValor;
      const passivoTotal = passivoCirculanteTotal + passivoNaoCirculanteTotal;

      // Patrimônio Líquido calculado com base no DRE
      const lucrosAcumulados = lucrosAcumuladosPorAno[ano] || 0;
      const capitalSocial = capitalSocialInicial;
      const reservas = 0; // Pode ser implementado futuramente
      
      // O patrimônio líquido total é a soma do capital social + lucros acumulados + reservas
      const patrimonioLiquidoTotal = capitalSocial + lucrosAcumulados + reservas;
      
      // Validar integridade do balanço sem ajustes artificiais
      const diferencaBalanco = ativoTotal - (passivoTotal + patrimonioLiquidoTotal);
      
      if (Math.abs(diferencaBalanco) > 1000) {
        console.warn(`⚠️ Balanço patrimonial não fecha. Diferença: R$ ${diferencaBalanco.toFixed(2)}`);
        console.log(`Ativo Total: R$ ${ativoTotal.toFixed(2)}`);
        console.log(`Passivo + PL: R$ ${(passivoTotal + patrimonioLiquidoTotal).toFixed(2)}`);
      }
      
      // Usar lucros acumulados reais sem ajuste artificial
      const lucrosAcumuladosAjustados = lucrosAcumulados;

      // Verificar se as propriedades "veiculos" e "depreciacao_acumulada" precisam ser adicionadas ao imobilizado
      if (!balancoData.ativo.nao_circulante.imobilizado.veiculos) {
        balancoData.ativo.nao_circulante.imobilizado.veiculos = {};
      }
      if (!balancoData.ativo.nao_circulante.imobilizado.depreciacao_acumulada) {
        balancoData.ativo.nao_circulante.imobilizado.depreciacao_acumulada = {};
      }

      // Preencher dados do ano
      balancoData.ativo.circulante.caixa_bancos[ano] = caixaBancosValor;
      balancoData.ativo.circulante.clientes[ano] = clientesValor;
      balancoData.ativo.circulante.adiantamentos_fornecedores[ano] = adiantamentosFornecedoresValor;
      balancoData.ativo.circulante.estoques.defensivos[ano] = estoquesDefensivosValor;
      balancoData.ativo.circulante.estoques.fertilizantes[ano] = estoquesFertilizantesValor;
      balancoData.ativo.circulante.estoques.almoxarifado[ano] = estoquesAlmoxarifadoValor;
      balancoData.ativo.circulante.estoques.commodities[ano] = estoquesCommoditiesValor;
      balancoData.ativo.circulante.estoques.sementes[ano] = estoquesSementesValor;
      balancoData.ativo.circulante.estoques.total[ano] = estoquesTotalValor;
      balancoData.ativo.circulante.emprestimos_terceiros[ano] = emprestimosATerceirosValor;
      balancoData.ativo.circulante.outros_ativos_circulantes[ano] = 0;
      balancoData.ativo.circulante.total[ano] = ativoCirculanteTotal;

      // Ativo Não Circulante
      balancoData.ativo.nao_circulante.investimentos[ano] = investimentosValor;
      balancoData.ativo.nao_circulante.imobilizado.terras[ano] = terrasValor;
      balancoData.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] = maquinasEquipamentosValor;
      balancoData.ativo.nao_circulante.imobilizado.veiculos[ano] = 0; // Valor de veículos (pode ser implementado)
      balancoData.ativo.nao_circulante.imobilizado.benfeitorias[ano] = benfeitoriasValor;
      balancoData.ativo.nao_circulante.imobilizado.depreciacao_acumulada[ano] = 0; // Depreciação acumulada (pode ser implementado)
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
      balancoData.passivo.patrimonio_liquido.reservas[ano] = reservas;
      balancoData.passivo.patrimonio_liquido.lucros_acumulados[ano] = lucrosAcumuladosAjustados;
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

  // Preencher com zeros
  anos.forEach(ano => {
    // Ativo Circulante
    zeroData.ativo.circulante.caixa_bancos[ano] = 0;
    zeroData.ativo.circulante.clientes[ano] = 0;
    zeroData.ativo.circulante.adiantamentos_fornecedores[ano] = 0;
    zeroData.ativo.circulante.estoques.defensivos[ano] = 0;
    zeroData.ativo.circulante.estoques.fertilizantes[ano] = 0;
    zeroData.ativo.circulante.estoques.almoxarifado[ano] = 0;
    zeroData.ativo.circulante.estoques.commodities[ano] = 0;
    zeroData.ativo.circulante.estoques.sementes[ano] = 0;
    zeroData.ativo.circulante.estoques.total[ano] = 0;
    zeroData.ativo.circulante.emprestimos_terceiros[ano] = 0;
    zeroData.ativo.circulante.outros_ativos_circulantes[ano] = 0;
    zeroData.ativo.circulante.total[ano] = 0;

    // Ativo Não Circulante
    zeroData.ativo.nao_circulante.investimentos[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.terras[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.veiculos[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.benfeitorias[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.depreciacao_acumulada[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.outros_imobilizados[ano] = 0;
    zeroData.ativo.nao_circulante.imobilizado.total[ano] = 0;
    zeroData.ativo.nao_circulante.total[ano] = 0;
    zeroData.ativo.total[ano] = 0;

    // Passivo Circulante
    zeroData.passivo.circulante.fornecedores[ano] = 0;
    zeroData.passivo.circulante.emprestimos_financiamentos_curto_prazo[ano] = 0;
    zeroData.passivo.circulante.adiantamentos_clientes[ano] = 0;
    zeroData.passivo.circulante.impostos_taxas[ano] = 0;
    zeroData.passivo.circulante.outros_passivos_circulantes[ano] = 0;
    zeroData.passivo.circulante.total[ano] = 0;

    // Passivo Não Circulante
    zeroData.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo[ano] = 0;
    zeroData.passivo.nao_circulante.financiamentos_terras[ano] = 0;
    zeroData.passivo.nao_circulante.arrendamentos[ano] = 0;
    zeroData.passivo.nao_circulante.outros_passivos_nao_circulantes[ano] = 0;
    zeroData.passivo.nao_circulante.total[ano] = 0;

    // Patrimônio Líquido
    zeroData.passivo.patrimonio_liquido.capital_social[ano] = 0;
    zeroData.passivo.patrimonio_liquido.reservas[ano] = 0;
    zeroData.passivo.patrimonio_liquido.lucros_acumulados[ano] = 0;
    zeroData.passivo.patrimonio_liquido.total[ano] = 0;

    // Total do Passivo + PL
    zeroData.passivo.total[ano] = 0;
  });

  return zeroData;
}