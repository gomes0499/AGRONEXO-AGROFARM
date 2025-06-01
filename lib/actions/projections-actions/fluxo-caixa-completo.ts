"use server";

import { createClient } from "@/lib/supabase/server";
import { getCultureProjections } from "@/lib/actions/culture-projections-actions";
import { getOutrasDespesas } from "@/lib/actions/financial-actions/outras-despesas";

export interface FluxoCaixaCompletoData {
  anos: string[];
  receitas_agricolas: {
    culturas: Record<string, Record<string, number>>;
    total_por_ano: Record<string, number>;
  };
  despesas_agricolas: {
    culturas: Record<string, Record<string, number>>;
    total_por_ano: Record<string, number>;
  };
  outras_despesas: {
    arrendamento: Record<string, number>;
    pro_labore: Record<string, number>;
    divisao_lucros: Record<string, number>;
    financeiras: Record<string, number>;
    tributarias: Record<string, number>;
    outras: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  fluxo_atividade: Record<string, number>;
  investimentos: Record<string, number>;
  fluxo_liquido: Record<string, number>;
  fluxo_acumulado: Record<string, number>;
}

export async function getFluxoCaixaCompleto(
  organizationId: string
): Promise<FluxoCaixaCompletoData> {
  try {


    // 1. Buscar projeções de culturas (incluindo receitas e custos)
    const cultureProjections = await getCultureProjections(organizationId);
    
    // 2. Buscar outras despesas (arrendamento, pró-labore, etc.)
    const outrasDespesas = await getOutrasDespesas(organizationId);
    
    // 3. Recuperar safras/anos
    const anos = cultureProjections.anos;
    
    // 4. Processamento dos dados por safra
    const receitasAgricolas: Record<string, Record<string, number>> = {};
    const despesasAgricolas: Record<string, Record<string, number>> = {};
    const totalReceitasPorAno: Record<string, number> = {};
    const totalDespesasPorAno: Record<string, number> = {};
    
    // Inicializar totais por ano
    anos.forEach(ano => {
      totalReceitasPorAno[ano] = 0;
      totalDespesasPorAno[ano] = 0;
    });

    // Processar cada projeção de cultura para extrair receitas e custos
    [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
      const culturaNome = getNomeCulturaFormatado(projection);
      receitasAgricolas[culturaNome] = {};
      despesasAgricolas[culturaNome] = {};
      
      anos.forEach(ano => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno) {
          // Receitas
          const receita = dadosAno.receita || 0;
          receitasAgricolas[culturaNome][ano] = receita;
          totalReceitasPorAno[ano] += receita;
          
          // Despesas/Custos
          const despesa = dadosAno.custo_total || 0;
          despesasAgricolas[culturaNome][ano] = despesa;
          totalDespesasPorAno[ano] += despesa;
        } else {
          receitasAgricolas[culturaNome][ano] = 0;
          despesasAgricolas[culturaNome][ano] = 0;
        }
      });
    });

    // 5. Processar outras despesas
    const despesasArrendamento: Record<string, number> = {};
    const despesasProLabore: Record<string, number> = {};
    const despesasDivisaoLucros: Record<string, number> = {};
    const despesasFinanceiras: Record<string, number> = {};
    const despesasTributarias: Record<string, number> = {};
    const despesasOutras: Record<string, number> = {};
    const totalOutrasDespesasPorAno: Record<string, number> = {};
    
    // Inicializar totais de outras despesas por ano
    anos.forEach(ano => {
      despesasArrendamento[ano] = 0;
      despesasProLabore[ano] = 0;
      despesasDivisaoLucros[ano] = 0;
      despesasFinanceiras[ano] = 0;
      despesasTributarias[ano] = 0;
      despesasOutras[ano] = 0;
      totalOutrasDespesasPorAno[ano] = 0;
    });

    // Processar cada categoria de outras despesas
    outrasDespesas.forEach(despesa => {
      const categoria = despesa.categoria;
      const valoresPorAno = despesa.valores_por_ano || {};
      
      // Mapear IDs de safra para nomes de safra usando o cache já carregado
      const safraIdToName: Record<string, string> = {};
      
      // Usar as safras já carregadas no início da função
      anos.forEach((anoNome, index) => {
        const safra = cultureProjections.anos.find(a => a === anoNome);
        if (safra) {
          // Encontrar o ID da safra para este ano
          const safraId = Object.keys(cultureProjections.projections[0]?.projections_by_year || {})
            .find(id => {
              const safraData = cultureProjections.projections[0]?.projections_by_year[id];
              return safraData && id;
            });
          
          if (safraId) {
            safraIdToName[safraId] = anoNome;
          }
        }
      });
      
      // Processar valores por safra
      Object.entries(valoresPorAno).forEach(([safraId, valor]) => {
        const anoNome = safraIdToName[safraId];
        if (anoNome && anos.includes(anoNome)) {
          const valorNumerico = Number(valor) || 0;
          
          if (categoria === 'ARRENDAMENTO') {
            despesasArrendamento[anoNome] += valorNumerico;
          } else if (categoria === 'PRO_LABORE') {
            despesasProLabore[anoNome] += valorNumerico;
          } else if (categoria === 'DIVISAO_LUCROS') {
            despesasDivisaoLucros[anoNome] += valorNumerico;
          } else if (categoria === 'FINANCEIRAS') {
            despesasFinanceiras[anoNome] += valorNumerico;
          } else if (categoria === 'TRIBUTARIAS') {
            despesasTributarias[anoNome] += valorNumerico;
          } else {
            despesasOutras[anoNome] += valorNumerico;
          }
          
          totalOutrasDespesasPorAno[anoNome] += valorNumerico;
        }
      });
    });

    // 6. Calcular fluxo de atividade (receitas - despesas - outras despesas)
    const fluxoAtividade: Record<string, number> = {};
    anos.forEach(ano => {
      fluxoAtividade[ano] = totalReceitasPorAno[ano] - totalDespesasPorAno[ano] - totalOutrasDespesasPorAno[ano];
    });

    // 7. Obter investimentos (simplificado por enquanto)
    const investimentos: Record<string, number> = {};
    anos.forEach(ano => {
      investimentos[ano] = 0; // Valor zerado até implementarmos lógica específica
    });

    // 8. Calcular fluxo líquido (fluxo atividade - investimentos)
    const fluxoLiquido: Record<string, number> = {};
    anos.forEach(ano => {
      fluxoLiquido[ano] = fluxoAtividade[ano] - investimentos[ano];
    });

    // 9. Calcular fluxo acumulado
    const fluxoAcumulado: Record<string, number> = {};
    let acumulado = 0;
    anos.forEach(ano => {
      acumulado += fluxoLiquido[ano];
      fluxoAcumulado[ano] = acumulado;
    });

    // 10. Retornar dados completos
    return {
      anos,
      receitas_agricolas: {
        culturas: receitasAgricolas,
        total_por_ano: totalReceitasPorAno
      },
      despesas_agricolas: {
        culturas: despesasAgricolas,
        total_por_ano: totalDespesasPorAno
      },
      outras_despesas: {
        arrendamento: despesasArrendamento,
        pro_labore: despesasProLabore,
        divisao_lucros: despesasDivisaoLucros,
        financeiras: despesasFinanceiras,
        tributarias: despesasTributarias,
        outras: despesasOutras,
        total_por_ano: totalOutrasDespesasPorAno
      },
      fluxo_atividade: fluxoAtividade,
      investimentos,
      fluxo_liquido: fluxoLiquido,
      fluxo_acumulado: fluxoAcumulado
    };
  } catch (error) {
    console.error("Erro ao calcular fluxo de caixa:", error);
    throw new Error("Falha ao calcular fluxo de caixa");
  }
}

// Função auxiliar para formatar nome de cultura
function getNomeCulturaFormatado(projection: any): string {
  let nome = projection.cultura_nome.toUpperCase();
  
  if (projection.tipo === 'sementes') {
    return `SEMENTE ${nome}`;
  }
  
  if (projection.ciclo_nome) {
    const ciclo = projection.ciclo_nome.toUpperCase();
    if (ciclo.includes('1')) {
      nome = `${nome} 1ª SAFRA`;
    } else if (ciclo.includes('2')) {
      nome = `${nome} 2ª SAFRA`;
    }
  }
  
  if (projection.sistema_nome) {
    const sistema = projection.sistema_nome.toUpperCase();
    if (sistema.includes('SEQUEIRO')) {
      nome = `${nome} SEQUEIRO`;
    } else if (sistema.includes('IRRIGADO')) {
      nome = `${nome} IRRIGADO`;
    }
  }
  
  return nome;
}