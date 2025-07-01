"use server";

import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFluxoCaixaSimplificado } from "./fluxo-caixa-simplificado";
import { getCultureProjections } from "../culture-projections-actions";
import { getOutrasDespesas } from "../financial-actions/outras-despesas";
import { getReceitasFinanceiras } from "../financial-actions/receitas-financeiras-actions";
import { DREData } from "@/components/projections/dre/dre-table";
import { calculateSalesTaxes, calculateIncomeTaxes } from "@/lib/config/tax-rates";

export async function getDREDataUpdated(organizacaoId: string, projectionId?: string): Promise<DREData> {
  const session = await getSession();

  if (!session) {
    throw new Error("Não autorizado");
  }

  const supabase = await createClient();

  try {
    // Buscar apenas os anos do fluxo de caixa
    const fluxoCaixaData = await getFluxoCaixaSimplificado(organizacaoId, projectionId);
    const anos = fluxoCaixaData.anos;

    // Filtrar anos para remover 2030/31 e 2031/32
    const anosFiltrados = anos.filter(ano => ano !== "2030/31" && ano !== "2031/32");
    
    // Inicializar objeto de retorno com valores zerados
    const dreData: DREData = {
      anos: anosFiltrados,
      receita_bruta: {
        agricola: {},
        pecuaria: {},
        total: {},
      },
      impostos_vendas: {
        icms: {},
        pis: {},
        cofins: {},
        total: {},
      },
      receita_liquida: {},
      custos: {
        agricola: {},
        pecuaria: {},
        total: {},
      },
      lucro_bruto: {},
      despesas_operacionais: {
        administrativas: {},
        pessoal: {},
        arrendamentos: {},
        tributarias: {},
        manutencao_seguros: {},
        outros: {},
        total: {},
      },
      ebitda: {},
      margem_ebitda: {},
      depreciacao_amortizacao: {},
      ebit: {},
      resultado_financeiro: {
        receitas_financeiras: {},
        despesas_financeiras: {},
        variacao_cambial: {},
        total: {},
      },
      lucro_antes_ir: {},
      impostos_sobre_lucro: {},
      lucro_liquido: {},
      margem_liquida: {},
    };

    // Buscar safras para mapear IDs para nomes
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome")
      .eq("organizacao_id", organizacaoId)
      .order("nome");

    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      throw new Error("Erro ao buscar safras");
    }

    // Criar mapeamento de safra ID para nome
    const safraToYear = safras.reduce((acc, safra) => {
      acc[safra.id] = safra.nome;
      return acc;
    }, {} as Record<string, string>);

    // 1. Buscar receitas agrícolas das projeções de culturas
    const cultureProjections = await getCultureProjections(organizacaoId, projectionId);
    
    // 2. Buscar receitas pecuárias (por enquanto zerado, será implementado)
    
    // 3. Buscar outras despesas categorizadas
    const outrasDespesas = await getOutrasDespesas(organizacaoId);
    
    // 4. Buscar receitas financeiras
    const receitasFinanceiras = await getReceitasFinanceiras(organizacaoId);

    // Preencher dados para cada ano
    anosFiltrados.forEach(ano => {
      // Receita Bruta Agrícola e cálculo de impostos por cultura
      let receitaAgricolaAno = 0;
      let totalImpostosVendas = {
        icms: 0,
        pis: 0,
        cofins: 0,
        total: 0
      };
      
      [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno && dadosAno.receita) {
          receitaAgricolaAno += dadosAno.receita;
          
          // Calcular impostos sobre vendas para cada cultura
          const impostos = calculateSalesTaxes(dadosAno.receita, projection.cultura_nome);
          totalImpostosVendas.icms += impostos.icms;
          totalImpostosVendas.pis += impostos.pis;
          totalImpostosVendas.cofins += impostos.cofins;
          totalImpostosVendas.total += impostos.totalTaxes;
        }
      });
      dreData.receita_bruta.agricola[ano] = receitaAgricolaAno;

      // Receita Bruta Pecuária (por enquanto zero)
      dreData.receita_bruta.pecuaria[ano] = 0;

      // Receita Bruta Total
      dreData.receita_bruta.total[ano] = receitaAgricolaAno + dreData.receita_bruta.pecuaria[ano];

      // Impostos sobre Vendas
      dreData.impostos_vendas!.icms[ano] = totalImpostosVendas.icms;
      dreData.impostos_vendas!.pis[ano] = totalImpostosVendas.pis;
      dreData.impostos_vendas!.cofins[ano] = totalImpostosVendas.cofins;
      dreData.impostos_vendas!.total[ano] = totalImpostosVendas.total;

      // Receita Líquida (bruta menos impostos sobre vendas)
      dreData.receita_liquida[ano] = dreData.receita_bruta.total[ano] - totalImpostosVendas.total;

      // Custos Agrícolas
      let custoAgricolaAno = 0;
      [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno) {
          custoAgricolaAno += dadosAno.custo_total || 0;
        }
      });
      dreData.custos.agricola[ano] = custoAgricolaAno;

      // Custos Pecuários (por enquanto zero)
      dreData.custos.pecuaria[ano] = 0;

      // Custos Totais
      dreData.custos.total[ano] = custoAgricolaAno + dreData.custos.pecuaria[ano];

      // Lucro Bruto
      dreData.lucro_bruto[ano] = dreData.receita_liquida[ano] - dreData.custos.total[ano];

      // Despesas Operacionais - Processar outras despesas por categoria
      let despesasAdministrativas = 0;
      let despesasPessoal = 0;
      let despesasArrendamentos = 0;
      let despesasTributarias = 0;
      let despesasManutencaoSeguros = 0;
      let despesasOutros = 0;

      // Encontrar ID da safra para o ano atual
      const safraId = Object.entries(safraToYear).find(([id, nome]) => nome === ano)?.[0];

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
              despesasAdministrativas += valor;
              break;
            
            case "PESSOAL":
            case "PRO_LABORE":
              despesasPessoal += valor;
              break;
            
            case "ARRENDAMENTOS":
              despesasArrendamentos += valor;
              break;
              
            case "TRIBUTARIAS":
              despesasTributarias += valor;
              break;
              
            case "MANUTENCAO":
            case "SEGUROS":
              despesasManutencaoSeguros += valor;
              break;
            
            case "OUTRAS_OPERACIONAIS":
            case "OUTROS":
            case "DESPESAS_COMERCIAIS": // Mantém para compatibilidade mas agrupado em outros
              despesasOutros += valor;
              break;
          }
        });
      }

      dreData.despesas_operacionais.administrativas[ano] = despesasAdministrativas;
      dreData.despesas_operacionais.pessoal[ano] = despesasPessoal;
      dreData.despesas_operacionais.arrendamentos[ano] = despesasArrendamentos;
      dreData.despesas_operacionais.tributarias[ano] = despesasTributarias;
      dreData.despesas_operacionais.manutencao_seguros[ano] = despesasManutencaoSeguros;
      dreData.despesas_operacionais.outros[ano] = despesasOutros;
      dreData.despesas_operacionais.total[ano] = 
        despesasAdministrativas + despesasPessoal + despesasArrendamentos + 
        despesasTributarias + despesasManutencaoSeguros + despesasOutros;

      // EBITDA
      dreData.ebitda[ano] = dreData.lucro_bruto[ano] - dreData.despesas_operacionais.total[ano];
      
      // Margem EBITDA
      dreData.margem_ebitda[ano] = dreData.receita_bruta.total[ano] > 0 
        ? (dreData.ebitda[ano] / dreData.receita_bruta.total[ano])
        : 0;

      // Depreciação e Amortização
      let depreciacaoAmortizacao = 0;
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          if (despesa.categoria === "DEPRECIACAO" || despesa.categoria === "AMORTIZACAO") {
            depreciacaoAmortizacao += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      dreData.depreciacao_amortizacao[ano] = depreciacaoAmortizacao;

      // EBIT
      dreData.ebit[ano] = dreData.ebitda[ano] - dreData.depreciacao_amortizacao[ano];

      // Resultado Financeiro
      // Receitas Financeiras
      let receitasFinanceirasAno = 0;
      if (safraId) {
        receitasFinanceiras.forEach(receita => {
          receitasFinanceirasAno += (receita.valores_por_safra as any)?.[safraId] || 0;
        });
      }
      dreData.resultado_financeiro.receitas_financeiras[ano] = receitasFinanceirasAno;

      // Despesas Financeiras
      let despesasFinanceirasAno = 0;
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          if (despesa.categoria === "DESPESAS_FINANCEIRAS") {
            despesasFinanceirasAno += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      dreData.resultado_financeiro.despesas_financeiras[ano] = despesasFinanceirasAno;

      // Variação Cambial (por enquanto zero, será implementado)
      dreData.resultado_financeiro.variacao_cambial[ano] = 0;

      // Resultado Financeiro Total
      dreData.resultado_financeiro.total[ano] = 
        receitasFinanceirasAno - despesasFinanceirasAno + dreData.resultado_financeiro.variacao_cambial[ano];

      // Lucro Antes do IR
      dreData.lucro_antes_ir[ano] = dreData.ebit[ano] + dreData.resultado_financeiro.total[ano];

      // Imposto de Renda e CSLL - Calcular com base no lucro antes do IR
      // Usar valores tributários manuais inseridos pelo usuário em "outras despesas"
      let impostosLucro = 0;
      
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          if (despesa.categoria === "TRIBUTARIAS") {
            // Somar todos os impostos manuais da categoria TRIBUTARIAS
            impostosLucro += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      
      console.log(`📊 Impostos sobre lucro (valores manuais): R$ ${impostosLucro.toFixed(2)}`);
      dreData.impostos_sobre_lucro[ano] = impostosLucro;

      // Lucro Líquido
      dreData.lucro_liquido[ano] = dreData.lucro_antes_ir[ano] - dreData.impostos_sobre_lucro[ano];

      // Margem Líquida
      dreData.margem_liquida[ano] = dreData.receita_bruta.total[ano] > 0
        ? (dreData.lucro_liquido[ano] / dreData.receita_bruta.total[ano])
        : 0;
    });

    return dreData;
  } catch (error) {
    console.error("Erro ao buscar dados do DRE:", error);
    
    // Retornar objeto com valores zerados
    return generateZeroDREData();
  }
}

function generateZeroDREData(): DREData {
  const anos = ["2021/22", "2022/23", "2023/24", "2024/25", "2025/26", "2026/27", "2027/28", "2028/29", "2029/30"];
  
  const zeroData: DREData = {
    anos,
    receita_bruta: {
      agricola: {},
      pecuaria: {},
      total: {},
    },
    impostos_vendas: {
      icms: {},
      pis: {},
      cofins: {},
      total: {},
    },
    receita_liquida: {},
    custos: {
      agricola: {},
      pecuaria: {},
      total: {},
    },
    lucro_bruto: {},
    despesas_operacionais: {
      administrativas: {},
      pessoal: {},
      arrendamentos: {},
      tributarias: {},
      manutencao_seguros: {},
      outros: {},
      total: {},
    },
    ebitda: {},
    margem_ebitda: {},
    depreciacao_amortizacao: {},
    ebit: {},
    resultado_financeiro: {
      receitas_financeiras: {},
      despesas_financeiras: {},
      variacao_cambial: {},
      total: {},
    },
    lucro_antes_ir: {},
    impostos_sobre_lucro: {},
    lucro_liquido: {},
    margem_liquida: {},
  };

  // Preencher todos os campos com zero para cada ano
  anos.forEach(ano => {
    // Receita Bruta
    zeroData.receita_bruta.agricola[ano] = 0;
    zeroData.receita_bruta.pecuaria[ano] = 0;
    zeroData.receita_bruta.total[ano] = 0;

    // Impostos sobre Vendas
    zeroData.impostos_vendas!.icms[ano] = 0;
    zeroData.impostos_vendas!.pis[ano] = 0;
    zeroData.impostos_vendas!.cofins[ano] = 0;
    zeroData.impostos_vendas!.total[ano] = 0;

    // Receita Líquida
    zeroData.receita_liquida[ano] = 0;

    // Custos
    zeroData.custos.agricola[ano] = 0;
    zeroData.custos.pecuaria[ano] = 0;
    zeroData.custos.total[ano] = 0;

    // Lucro Bruto
    zeroData.lucro_bruto[ano] = 0;

    // Despesas Operacionais
    zeroData.despesas_operacionais.administrativas[ano] = 0;
    zeroData.despesas_operacionais.pessoal[ano] = 0;
    zeroData.despesas_operacionais.arrendamentos[ano] = 0;
    zeroData.despesas_operacionais.tributarias[ano] = 0;
    zeroData.despesas_operacionais.manutencao_seguros[ano] = 0;
    zeroData.despesas_operacionais.outros[ano] = 0;
    zeroData.despesas_operacionais.total[ano] = 0;

    // EBITDA
    zeroData.ebitda[ano] = 0;
    
    // Margem EBITDA
    zeroData.margem_ebitda[ano] = 0;

    // Depreciação e Amortização
    zeroData.depreciacao_amortizacao[ano] = 0;

    // EBIT
    zeroData.ebit[ano] = 0;

    // Resultado Financeiro
    zeroData.resultado_financeiro.receitas_financeiras[ano] = 0;
    zeroData.resultado_financeiro.despesas_financeiras[ano] = 0;
    zeroData.resultado_financeiro.variacao_cambial[ano] = 0;
    zeroData.resultado_financeiro.total[ano] = 0;

    // Lucro Antes do IR
    zeroData.lucro_antes_ir[ano] = 0;

    // Imposto de Renda e CSLL
    zeroData.impostos_sobre_lucro[ano] = 0;

    // Lucro Líquido
    zeroData.lucro_liquido[ano] = 0;

    // Margem Líquida
    zeroData.margem_liquida[ano] = 0;
  });

  return zeroData;
}