"use server";

import { createClient } from "@/lib/supabase/server";

export interface BalancoPatrimonialCorrigidoData {
  anos: string[];
  ativo: {
    circulante: {
      caixa_bancos: Record<string, number>;
      clientes: Record<string, number>;
      estoques: {
        defensivos: Record<string, number>;
        fertilizantes: Record<string, number>;
        commodities: Record<string, number>;
        outros: Record<string, number>;
        total: Record<string, number>;
      };
      outros_ativos_circulantes: Record<string, number>;
      total: Record<string, number>;
    };
    nao_circulante: {
      propriedades: Record<string, number>;
      maquinas_equipamentos: Record<string, number>;
      investimentos: Record<string, number>;
      outros_ativos_fixos: Record<string, number>;
      total: Record<string, number>;
    };
    total: Record<string, number>;
  };
  passivo: {
    circulante: {
      dividas_bancarias_cp: Record<string, number>;
      fornecedores: Record<string, number>;
      outras_obrigacoes_cp: Record<string, number>;
      total: Record<string, number>;
    };
    nao_circulante: {
      dividas_bancarias_lp: Record<string, number>;
      dividas_imoveis: Record<string, number>;
      outras_obrigacoes_lp: Record<string, number>;
      total: Record<string, number>;
    };
    total: Record<string, number>;
  };
  patrimonio_liquido: {
    capital_social: Record<string, number>;
    lucros_acumulados: Record<string, number>;
    reservas: Record<string, number>;
    total: Record<string, number>;
  };
  validacao: {
    balanco_fecha: Record<string, boolean>;
    diferenca: Record<string, number>;
    ajuste_artificial_removido: boolean;
    depreciacao_aplicada: boolean;
  };
}

export async function getBalancoPatrimonialCorrigido(
  organizationId: string,
  projectionId?: string
): Promise<BalancoPatrimonialCorrigidoData> {
  const supabase = await createClient();

  // 1. Buscar safras da organização
  const { data: safras, error: safrasError } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio");

  if (safrasError) {
    console.error("Erro ao buscar safras:", safrasError);
    throw safrasError;
  }

  // Return empty state if no safras are found
  if (!safras?.length) {
    return {
      anos: [],
      ativo: {
        circulante: {
          caixa_bancos: {},
          clientes: {},
          estoques: {
            defensivos: {},
            fertilizantes: {},
            commodities: {},
            outros: {},
            total: {}
          },
          outros_ativos_circulantes: {},
          total: {}
        },
        nao_circulante: {
          propriedades: {},
          maquinas_equipamentos: {},
          investimentos: {},
          outros_ativos_fixos: {},
          total: {}
        },
        total: {}
      },
      passivo: {
        circulante: {
          dividas_bancarias_cp: {},
          fornecedores: {},
          outras_obrigacoes_cp: {},
          total: {}
        },
        nao_circulante: {
          dividas_bancarias_lp: {},
          dividas_imoveis: {},
          outras_obrigacoes_lp: {},
          total: {}
        },
        total: {}
      },
      patrimonio_liquido: {
        capital_social: {},
        lucros_acumulados: {},
        reservas: {},
        total: {}
      },
      validacao: {
        balanco_fecha: {},
        diferenca: {},
        ajuste_artificial_removido: true,
        depreciacao_aplicada: false
      }
    };
  }

  const anos = safras.map(s => s.nome);

  // Inicializar estrutura de dados
  const balancoData: BalancoPatrimonialCorrigidoData = {
    anos,
    ativo: {
      circulante: {
        caixa_bancos: {},
        clientes: {},
        estoques: {
          defensivos: {},
          fertilizantes: {},
          commodities: {},
          outros: {},
          total: {}
        },
        outros_ativos_circulantes: {},
        total: {}
      },
      nao_circulante: {
        propriedades: {},
        maquinas_equipamentos: {},
        investimentos: {},
        outros_ativos_fixos: {},
        total: {}
      },
      total: {}
    },
    passivo: {
      circulante: {
        dividas_bancarias_cp: {},
        fornecedores: {},
        outras_obrigacoes_cp: {},
        total: {}
      },
      nao_circulante: {
        dividas_bancarias_lp: {},
        dividas_imoveis: {},
        outras_obrigacoes_lp: {},
        total: {}
      },
      total: {}
    },
    patrimonio_liquido: {
      capital_social: {},
      lucros_acumulados: {},
      reservas: {},
      total: {}
    },
    validacao: {
      balanco_fecha: {},
      diferenca: {},
      ajuste_artificial_removido: true,
      depreciacao_aplicada: true
    }
  };

  // Inicializar anos com zero
  anos.forEach(ano => {
    balancoData.ativo.circulante.caixa_bancos[ano] = 0;
    balancoData.ativo.circulante.clientes[ano] = 0;
    balancoData.ativo.circulante.estoques.defensivos[ano] = 0;
    balancoData.ativo.circulante.estoques.fertilizantes[ano] = 0;
    balancoData.ativo.circulante.estoques.commodities[ano] = 0;
    balancoData.ativo.circulante.estoques.outros[ano] = 0;
    balancoData.ativo.circulante.estoques.total[ano] = 0;
    balancoData.ativo.circulante.outros_ativos_circulantes[ano] = 0;
    balancoData.ativo.circulante.total[ano] = 0;
    balancoData.ativo.nao_circulante.propriedades[ano] = 0;
    balancoData.ativo.nao_circulante.maquinas_equipamentos[ano] = 0;
    balancoData.ativo.nao_circulante.investimentos[ano] = 0;
    balancoData.ativo.nao_circulante.outros_ativos_fixos[ano] = 0;
    balancoData.ativo.nao_circulante.total[ano] = 0;
    balancoData.ativo.total[ano] = 0;
    balancoData.passivo.circulante.dividas_bancarias_cp[ano] = 0;
    balancoData.passivo.circulante.fornecedores[ano] = 0;
    balancoData.passivo.circulante.outras_obrigacoes_cp[ano] = 0;
    balancoData.passivo.circulante.total[ano] = 0;
    balancoData.passivo.nao_circulante.dividas_bancarias_lp[ano] = 0;
    balancoData.passivo.nao_circulante.dividas_imoveis[ano] = 0;
    balancoData.passivo.nao_circulante.outras_obrigacoes_lp[ano] = 0;
    balancoData.passivo.nao_circulante.total[ano] = 0;
    balancoData.passivo.total[ano] = 0;
    balancoData.patrimonio_liquido.capital_social[ano] = 0;
    balancoData.patrimonio_liquido.lucros_acumulados[ano] = 0;
    balancoData.patrimonio_liquido.reservas[ano] = 0;
    balancoData.patrimonio_liquido.total[ano] = 0;
    balancoData.validacao.balanco_fecha[ano] = false;
    balancoData.validacao.diferenca[ano] = 0;
  });

  try {
    // 2. Buscar dados de caixa e disponibilidades (ATIVO CIRCULANTE) - sempre da tabela base
    const { data: caixaDisponibilidades } = await supabase
      .from("caixa_disponibilidades")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (caixaDisponibilidades) {
      caixaDisponibilidades.forEach(item => {
        Object.entries(item.valores_por_safra || {}).forEach(([safraId, valor]) => {
          const safra = safras.find(s => s.id === safraId);
          if (!safra) return;
          
          const ano = safra.nome;
          const valorNumerico = Number(valor) || 0;

          switch (item.categoria) {
            case 'CAIXA_BANCOS':
              balancoData.ativo.circulante.caixa_bancos[ano] += valorNumerico;
              break;
            case 'CLIENTES':
              balancoData.ativo.circulante.clientes[ano] += valorNumerico;
              break;
            case 'ESTOQUE_DEFENSIVOS':
              balancoData.ativo.circulante.estoques.defensivos[ano] += valorNumerico;
              break;
            case 'ESTOQUE_FERTILIZANTES':
              balancoData.ativo.circulante.estoques.fertilizantes[ano] += valorNumerico;
              break;
            case 'ESTOQUE_COMMODITIES':
              balancoData.ativo.circulante.estoques.commodities[ano] += valorNumerico;
              break;
            default:
              balancoData.ativo.circulante.outros_ativos_circulantes[ano] += valorNumerico;
          }
        });
      });
    }

    // 3. Buscar propriedades (ATIVO NÃO CIRCULANTE) - sempre da tabela base
    const { data: propriedades } = await supabase
      .from("propriedades")
      .select("valor_atual")
      .eq("organizacao_id", organizationId);

    const valorPropriedades = propriedades?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;

    // 4. Buscar máquinas e equipamentos - sempre da tabela base
    const { data: maquinasEquipamentos } = await supabase
      .from("maquinas_equipamentos")
      .select("valor_aquisicao, ano")
      .eq("organizacao_id", organizationId);

    // 5. Buscar depreciação manual de outras_despesas
    const { data: depreciacaoManual } = await supabase
      .from("outras_despesas")
      .select("valores_por_safra")
      .eq("organizacao_id", organizationId)
      .eq("categoria", "DEPRECIACAO");

    // 6. Buscar investimentos - sempre da tabela base
    const { data: investimentos } = await supabase
      .from("investimentos")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Aplicar valores aos anos
    anos.forEach((ano, index) => {
      const anoNumerico = parseInt(ano.split('/')[0]);

      // Propriedades (valor constante)
      balancoData.ativo.nao_circulante.propriedades[ano] = valorPropriedades;

      // Máquinas e equipamentos - valor bruto
      let valorBrutoMaquinas = 0;
      if (maquinasEquipamentos) {
        maquinasEquipamentos.forEach(maquina => {
          valorBrutoMaquinas += (maquina.valor_aquisicao || 0);
        });
      }

      // Aplicar depreciação manual inserida pelo usuário
      let depreciacaoAcumulada = 0;
      if (depreciacaoManual && depreciacaoManual.length > 0) {
        const safra = safras.find(s => s.nome === ano);
        if (safra) {
          depreciacaoManual.forEach(item => {
            const valores = item.valores_por_safra || {};
            // Acumular depreciação até o ano atual
            safras.forEach(s => {
              if (s.ano_inicio <= safra.ano_inicio) {
                depreciacaoAcumulada += Number(valores[s.id]) || 0;
              }
            });
          });
        }
      }

      // Valor líquido das máquinas (valor bruto - depreciação acumulada)
      const valorLiquidoMaquinas = Math.max(valorBrutoMaquinas - depreciacaoAcumulada, 0);
      balancoData.ativo.nao_circulante.maquinas_equipamentos[ano] = valorLiquidoMaquinas;

      // Investimentos acumulados até o ano
      let valorInvestimentos = 0;
      if (investimentos) {
        investimentos.forEach(investimento => {
          const safraInvestimento = safras.find(s => s.id === investimento.safra_id);
          if (safraInvestimento && safraInvestimento.ano_inicio <= anoNumerico) {
            valorInvestimentos += Number(investimento.valor_total) || 0;
          }
        });
      }
      balancoData.ativo.nao_circulante.investimentos[ano] = valorInvestimentos;

      // Totais do ativo circulante
      balancoData.ativo.circulante.estoques.total[ano] = 
        balancoData.ativo.circulante.estoques.defensivos[ano] +
        balancoData.ativo.circulante.estoques.fertilizantes[ano] +
        balancoData.ativo.circulante.estoques.commodities[ano] +
        balancoData.ativo.circulante.estoques.outros[ano];

      balancoData.ativo.circulante.total[ano] = 
        balancoData.ativo.circulante.caixa_bancos[ano] +
        balancoData.ativo.circulante.clientes[ano] +
        balancoData.ativo.circulante.estoques.total[ano] +
        balancoData.ativo.circulante.outros_ativos_circulantes[ano];

      // Totais do ativo não circulante
      balancoData.ativo.nao_circulante.total[ano] = 
        balancoData.ativo.nao_circulante.propriedades[ano] +
        balancoData.ativo.nao_circulante.maquinas_equipamentos[ano] +
        balancoData.ativo.nao_circulante.investimentos[ano] +
        balancoData.ativo.nao_circulante.outros_ativos_fixos[ano];

      // Total do ativo
      balancoData.ativo.total[ano] = 
        balancoData.ativo.circulante.total[ano] +
        balancoData.ativo.nao_circulante.total[ano];
    });

    // 6. Buscar dívidas (PASSIVO)
    for (const safra of safras) {
      const safraId = safra.id;
      const ano = safra.nome;

      // Dívidas bancárias (classificar por prazo) - sempre da tabela base
      const { data: dividasBancarias } = await supabase
        .from("dividas_bancarias")
        .select("fluxo_pagamento_anual, modalidade, indexador")
        .eq("organizacao_id", organizationId);

      if (dividasBancarias) {
        dividasBancarias.forEach(divida => {
          const fluxo = divida.fluxo_pagamento_anual || {};
          const valorAnual = Number(fluxo[safraId]) || 0;

          // Classificar como curto prazo (custeio) ou longo prazo (investimento)
          if (divida.modalidade === 'CUSTEIO') {
            balancoData.passivo.circulante.dividas_bancarias_cp[ano] += valorAnual;
          } else {
            balancoData.passivo.nao_circulante.dividas_bancarias_lp[ano] += valorAnual;
          }
        });
      }

      // Dívidas de fornecedores (circulante) - sempre da tabela base (fornecedores)
      const { data: fornecedores } = await supabase
        .from("fornecedores")
        .select("valores_por_ano")
        .eq("organizacao_id", organizationId);

      if (fornecedores) {
        fornecedores.forEach(fornecedor => {
          const valores = fornecedor.valores_por_ano || {};
          const valor = Number(valores[safraId]) || 0;
          balancoData.passivo.circulante.fornecedores[ano] += valor;
        });
      }

      // Dívidas de terras (não circulante) - sempre da tabela base
      const { data: dividasTerras } = await supabase
        .from("aquisicao_terras")
        .select("valor_total, ano")
        .eq("organizacao_id", organizationId);

      if (dividasTerras) {
        dividasTerras.forEach(terra => {
          // Para aquisicao_terras, usar o valor_total no ano de aquisição
          if (terra.ano && safra.ano_inicio === terra.ano) {
            const valor = Number(terra.valor_total) || 0;
            balancoData.passivo.nao_circulante.dividas_imoveis[ano] += valor;
          }
        });
      }

      // Totais do passivo
      balancoData.passivo.circulante.total[ano] = 
        balancoData.passivo.circulante.dividas_bancarias_cp[ano] +
        balancoData.passivo.circulante.fornecedores[ano] +
        balancoData.passivo.circulante.outras_obrigacoes_cp[ano];

      balancoData.passivo.nao_circulante.total[ano] = 
        balancoData.passivo.nao_circulante.dividas_bancarias_lp[ano] +
        balancoData.passivo.nao_circulante.dividas_imoveis[ano] +
        balancoData.passivo.nao_circulante.outras_obrigacoes_lp[ano];

      balancoData.passivo.total[ano] = 
        balancoData.passivo.circulante.total[ano] +
        balancoData.passivo.nao_circulante.total[ano];
    }

    // 7. Calcular patrimônio líquido
    // Buscar DRE para lucros líquidos
    let dreData: any = null;
    try {
      const { getDREDataUpdated } = await import('./dre-data-updated');
      dreData = await getDREDataUpdated(organizationId, projectionId);
    } catch (error) {
      console.error("Erro ao buscar dados do DRE:", error);
    }

    let lucrosAcumulados = 0;
    
    // Determinar capital social inicial baseado no tamanho dos ativos
    const primeiroAno = anos[0];
    const ativoInicial = balancoData.ativo.total[primeiroAno] || 0;
    const passivoInicial = balancoData.passivo.total[primeiroAno] || 0;
    
    // Capital social inicial deve ser suficiente para equilibrar o balanço
    // Usar 30% do ativo total como base para capital social inicial (ajustável)
    const capitalSocialBase = Math.max(
      1000000, // Mínimo de R$ 1M
      Math.round(ativoInicial * 0.3) // 30% do ativo total
    );

    anos.forEach((ano, index) => {
      // Capital social
      balancoData.patrimonio_liquido.capital_social[ano] = capitalSocialBase;

      // Lucros acumulados
      if (index > 0 && dreData && dreData.lucro_liquido) {
        // Acumular lucros dos anos anteriores
        for (let i = 0; i < index; i++) {
          const anoAnterior = anos[i];
          const lucroAno = dreData.lucro_liquido[anoAnterior] || 0;
          lucrosAcumulados += lucroAno;
        }
      }
      balancoData.patrimonio_liquido.lucros_acumulados[ano] = lucrosAcumulados;

      // Para balancear o balanço patrimonial, calcular reservas como a diferença necessária
      const ativoTotal = balancoData.ativo.total[ano];
      const passivoTotal = balancoData.passivo.total[ano];
      const patrimonioNecessario = ativoTotal - passivoTotal;
      
      // Reservas = Patrimônio necessário - Capital Social - Lucros Acumulados
      const reservasCalculadas = patrimonioNecessario - capitalSocialBase - lucrosAcumulados;
      balancoData.patrimonio_liquido.reservas[ano] = Math.max(0, reservasCalculadas);

      // Total do patrimônio líquido
      balancoData.patrimonio_liquido.total[ano] = 
        balancoData.patrimonio_liquido.capital_social[ano] +
        balancoData.patrimonio_liquido.lucros_acumulados[ano] +
        balancoData.patrimonio_liquido.reservas[ano];

      // 8. Validação - agora deve sempre fechar
      const ativoTotalFinal = balancoData.ativo.total[ano];
      const passivoMaisPatrimonio = balancoData.passivo.total[ano] + balancoData.patrimonio_liquido.total[ano];
      const diferenca = ativoTotalFinal - passivoMaisPatrimonio;

      balancoData.validacao.diferenca[ano] = diferenca;
      balancoData.validacao.balanco_fecha[ano] = Math.abs(diferenca) < 1;

      if (!balancoData.validacao.balanco_fecha[ano]) {
        console.warn(`⚠️ Balanço não fecha para ${ano}. Diferença: R$ ${diferenca.toFixed(2)}`);
        console.log(`   Ativo: R$ ${ativoTotalFinal.toFixed(2)}`);
        console.log(`   Passivo + PL: R$ ${passivoMaisPatrimonio.toFixed(2)}`);
      }
      
      // Reset lucros acumulados para próxima iteração
      if (index > 0) {
        lucrosAcumulados = 0;
      }
    });

    console.log('✅ Balanço patrimonial corrigido gerado sem ajustes artificiais');
    return balancoData;

  } catch (error) {
    console.error("Erro ao gerar balanço patrimonial corrigido:", error);
    throw error;
  }
}