"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { BALANCE_SHEET_CONFIG } from "@/lib/config/balance-sheet-config";

export interface BalanceSheetPremises {
  organizacao_id: string;
  estoques_percentual_custo: number;
  adiantamentos_fornecedores_percentual: number;
  contas_receber_percentual_receita: number;
  bancos_curto_prazo: number;
  bancos_longo_prazo: number;
  depreciacao_maquinas: number;
  depreciacao_veiculos: number;
  depreciacao_benfeitorias: number;
  impostos_sobre_vendas: number;
  provisao_impostos: number;
  updated_at?: string;
}

// Buscar configurações do banco ou retornar valores padrão
export async function getBalanceSheetPremises(organizacaoId: string): Promise<BalanceSheetPremises> {
  const session = await getSession();
  if (!session) {
    throw new Error("Não autorizado");
  }

  const supabase = await createClient();

  try {
    // Tentar buscar configurações salvas no banco
    const { data, error } = await supabase
      .from('premissas_balanco')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .single();

    if (error || !data) {
      // Retornar valores padrão se não existir no banco
      return {
        organizacao_id: organizacaoId,
        estoques_percentual_custo: BALANCE_SHEET_CONFIG.estimativas.estoquesPercentualCusto,
        adiantamentos_fornecedores_percentual: BALANCE_SHEET_CONFIG.estimativas.adiantamentosFornecedoresPercentual,
        contas_receber_percentual_receita: BALANCE_SHEET_CONFIG.estimativas.contasReceberPercentualReceita,
        bancos_curto_prazo: BALANCE_SHEET_CONFIG.prazoDividas.bancosCurtoPrazo,
        bancos_longo_prazo: BALANCE_SHEET_CONFIG.prazoDividas.bancosLongoPrazo,
        depreciacao_maquinas: BALANCE_SHEET_CONFIG.depreciacaoAnual.maquinasEquipamentos,
        depreciacao_veiculos: BALANCE_SHEET_CONFIG.depreciacaoAnual.veiculos,
        depreciacao_benfeitorias: BALANCE_SHEET_CONFIG.depreciacaoAnual.benfeitorias,
        impostos_sobre_vendas: BALANCE_SHEET_CONFIG.impostos.percentualSobreVendas,
        provisao_impostos: BALANCE_SHEET_CONFIG.impostos.provisaoImpostos,
      };
    }

    return data as BalanceSheetPremises;
  } catch (error) {
    console.error("Erro ao buscar premissas do balanço:", error);
    // Retornar valores padrão em caso de erro
    return {
      organizacao_id: organizacaoId,
      estoques_percentual_custo: BALANCE_SHEET_CONFIG.estimativas.estoquesPercentualCusto,
      adiantamentos_fornecedores_percentual: BALANCE_SHEET_CONFIG.estimativas.adiantamentosFornecedoresPercentual,
      contas_receber_percentual_receita: BALANCE_SHEET_CONFIG.estimativas.contasReceberPercentualReceita,
      bancos_curto_prazo: BALANCE_SHEET_CONFIG.prazoDividas.bancosCurtoPrazo,
      bancos_longo_prazo: BALANCE_SHEET_CONFIG.prazoDividas.bancosLongoPrazo,
      depreciacao_maquinas: BALANCE_SHEET_CONFIG.depreciacaoAnual.maquinasEquipamentos,
      depreciacao_veiculos: BALANCE_SHEET_CONFIG.depreciacaoAnual.veiculos,
      depreciacao_benfeitorias: BALANCE_SHEET_CONFIG.depreciacaoAnual.benfeitorias,
      impostos_sobre_vendas: BALANCE_SHEET_CONFIG.impostos.percentualSobreVendas,
      provisao_impostos: BALANCE_SHEET_CONFIG.impostos.provisaoImpostos,
    };
  }
}

// Salvar/atualizar configurações no banco
export async function updateBalanceSheetPremises(
  organizacaoId: string, 
  premises: Partial<BalanceSheetPremises>
): Promise<BalanceSheetPremises> {
  const session = await getSession();
  if (!session) {
    throw new Error("Não autorizado");
  }

  const supabase = await createClient();

  try {
    const dataToSave = {
      ...premises,
      organizacao_id: organizacaoId,
      updated_at: new Date().toISOString(),
    };

    // Upsert (inserir ou atualizar)
    const { data, error } = await supabase
      .from('premissas_balanco')
      .upsert(dataToSave, {
        onConflict: 'organizacao_id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as BalanceSheetPremises;
  } catch (error) {
    console.error("Erro ao atualizar premissas do balanço:", error);
    throw error;
  }
}

// Resetar para valores padrão
export async function resetBalanceSheetPremises(organizacaoId: string): Promise<BalanceSheetPremises> {
  const defaultPremises: Partial<BalanceSheetPremises> = {
    estoques_percentual_custo: BALANCE_SHEET_CONFIG.estimativas.estoquesPercentualCusto,
    adiantamentos_fornecedores_percentual: BALANCE_SHEET_CONFIG.estimativas.adiantamentosFornecedoresPercentual,
    contas_receber_percentual_receita: BALANCE_SHEET_CONFIG.estimativas.contasReceberPercentualReceita,
    bancos_curto_prazo: BALANCE_SHEET_CONFIG.prazoDividas.bancosCurtoPrazo,
    bancos_longo_prazo: BALANCE_SHEET_CONFIG.prazoDividas.bancosLongoPrazo,
    depreciacao_maquinas: BALANCE_SHEET_CONFIG.depreciacaoAnual.maquinasEquipamentos,
    depreciacao_veiculos: BALANCE_SHEET_CONFIG.depreciacaoAnual.veiculos,
    depreciacao_benfeitorias: BALANCE_SHEET_CONFIG.depreciacaoAnual.benfeitorias,
    impostos_sobre_vendas: BALANCE_SHEET_CONFIG.impostos.percentualSobreVendas,
    provisao_impostos: BALANCE_SHEET_CONFIG.impostos.provisaoImpostos,
  };

  return updateBalanceSheetPremises(organizacaoId, defaultPremises);
}