'use server';

import {
  Price,
  PriceFormValues,
  SeedSale,
  SeedSaleFormValues,
  LivestockSale,
  LivestockSaleFormValues,
  CommodityStock,
  CommodityStockFormValues,
  PriceAlert,
  PriceAlertFormValues,
} from '@/schemas/commercial';

import { createClient } from '@/lib/supabase/server';
import { errorHandler } from '@/utils/error-handler';
import { formatISO } from 'date-fns';
import { revalidatePath } from 'next/cache';

// Helper function to check if precos table exists and return appropriate error
async function safeExecuteWithPrecosTable<T>(
  operation: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (error?.code === '42P01' || error?.message?.includes('relation "public.precos" does not exist')) {
      console.warn('Tabela precos não existe ainda, retornando valor padrão');
      return fallbackValue;
    }
    throw error;
  }
}


export async function getPrices(organizacaoId: string, safraId?: string) {
  return safeExecuteWithPrecosTable(async () => {
    const supabase = await createClient();
    
    let query = supabase
      .from('precos')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .order('data_referencia', { ascending: false });
    
    if (safraId) {
      query = query.eq('safra_id', safraId);
    }
    
    const { data: prices, error } = await query;
    
    if (error) throw error;
    
    // Buscar safras separadamente se necessário
    if (prices && prices.length > 0) {
      const safraIds = [...new Set(prices.map(p => p.safra_id).filter(Boolean))];
      
      if (safraIds.length > 0) {
        const { data: safras } = await supabase
          .from('safras')
          .select('*')
          .in('id', safraIds);
        
        // Mapear safras para os preços
        const safraMap = safras?.reduce((acc, safra) => {
          acc[safra.id] = safra;
          return acc;
        }, {} as Record<string, any>) || {};
        
        return prices.map(price => ({
          ...price,
          safra: price.safra_id ? safraMap[price.safra_id] : null
        })) as Price[];
      }
    }
    
    return prices as Price[] || [];
  }, []);
}

/**
 * Obtém um preço específico por ID
 */
export async function getPriceById(id: string, organizacaoId: string) {
  return safeExecuteWithPrecosTable(async () => {
    const supabase = await createClient();
    
    const { data: price, error } = await supabase
      .from('precos')
      .select('*')
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .single();
    
    if (error) throw error;
    
    // Buscar safra separadamente se necessário
    if (price && price.safra_id) {
      const { data: safra } = await supabase
        .from('safras')
        .select('*')
        .eq('id', price.safra_id)
        .single();
      
      return {
        ...price,
        safra: safra || null
      } as Price;
    }
    
    return {
      ...price,
      safra: null
    } as Price;
  }, null);
}

/**
 * Cria um novo preço
 */
export async function createPrice(organizacaoId: string, values: PriceFormValues) {
  try {
    const supabase = await createClient();
    
    // Prepara os dados para inserção
    const priceData = {
      ...values,
      organizacao_id: organizacaoId,
      data_referencia: values.data_referencia ? formatISO(values.data_referencia, { representation: 'date' }) : formatISO(new Date(), { representation: 'date' }),
    };
    
    const { data, error } = await supabase
      .from('precos')
      .insert(priceData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return data as Price;
  } catch (error) {
    return errorHandler(error, 'Erro ao criar preço');
  }
}

/**
 * Atualiza um preço existente
 */
export async function updatePrice(id: string, values: Partial<PriceFormValues>) {
  try {
    const supabase = await createClient();
    
    // Prepara os dados para atualização
    const priceData = {
      ...values,
      data_referencia: values.data_referencia ? formatISO(values.data_referencia, { representation: 'date' }) : undefined,
    };
    
    const { data, error } = await supabase
      .from('precos')
      .update(priceData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return data as Price;
  } catch (error) {
    return errorHandler(error, 'Erro ao atualizar preço');
  }
}

/**
 * Exclui um preço existente
 */
export async function deletePrice(id: string) {
  try {
    const supabase =  await createClient();
    
    const { error } = await supabase
      .from('precos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return { success: true };
  } catch (error) {
    return errorHandler(error, 'Erro ao excluir preço');
  }
}

// ==== SEED SALE ACTIONS ====

/**
 * Obtém todas as vendas de sementes da organização
 */
export async function getSeedSales(organizacaoId: string, culturaId?: string, safraId?: string) {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('vendas_sementes')
      .select('*, cultura:culturas(*), safra:safras(*), propriedade:propriedades(*)')
      .eq('organizacao_id', organizacaoId)
      .order('created_at', { ascending: false });
    
    if (culturaId) {
      query = query.eq('cultura_id', culturaId);
    }
    
    if (safraId) {
      query = query.eq('safra_id', safraId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data as SeedSale[];
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar vendas de sementes');
  }
}

/**
 * Obtém uma venda de sementes específica por ID
 */
export async function getSeedSaleById(id: string, organizacaoId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('vendas_sementes')
      .select('*, cultura:culturas(*), safra:safras(*), propriedade:propriedades(*)')
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .single();
    
    if (error) throw error;
    
    return data as SeedSale;
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar venda de sementes');
  }
}

/**
 * Cria uma nova venda de sementes
 */
export async function createSeedSale(organizacaoId: string, values: SeedSaleFormValues) {
  try {
    const supabase = await createClient();
    
    // Prepara os dados para inserção
    const saleData = {
      ...values,
      organizacao_id: organizacaoId,
    };
    
    const { data, error } = await supabase
      .from('vendas_sementes')
      .insert(saleData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return data as SeedSale;
  } catch (error) {
    return errorHandler(error, 'Erro ao criar venda de sementes');
  }
}

/**
 * Atualiza uma venda de sementes existente
 */
export async function updateSeedSale(id: string, values: Partial<SeedSaleFormValues>) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('vendas_sementes')
      .update(values)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return data as SeedSale;
  } catch (error) {
    return errorHandler(error, 'Erro ao atualizar venda de sementes');
  }
}

/**
 * Exclui uma venda de sementes existente
 */
export async function deleteSeedSale(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('vendas_sementes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return { success: true };
  } catch (error) {
    return errorHandler(error, 'Erro ao excluir venda de sementes');
  }
}

// ==== LIVESTOCK SALE ACTIONS ====

/**
 * Obtém todas as vendas pecuárias da organização
 */
export async function getLivestockSales(organizacaoId: string, safraId?: string) {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('vendas_pecuaria')
      .select('*, safra:safras(*), propriedade:propriedades(*)')
      .eq('organizacao_id', organizacaoId)
      .order('created_at', { ascending: false });
    
    if (safraId) {
      query = query.eq('safra_id', safraId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data as LivestockSale[];
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar vendas pecuárias');
  }
}

/**
 * Obtém uma venda pecuária específica por ID
 */
export async function getLivestockSaleById(id: string, organizacaoId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('vendas_pecuaria')
      .select('*, safra:safras(*), propriedade:propriedades(*)')
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .single();
    
    if (error) throw error;
    
    return data as LivestockSale;
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar venda pecuária');
  }
}

/**
 * Cria uma nova venda pecuária
 */
export async function createLivestockSale(organizacaoId: string, values: LivestockSaleFormValues) {
  try {
    const supabase = await createClient();
    
    // Prepara os dados para inserção
    const saleData = {
      ...values,
      organizacao_id: organizacaoId,
    };
    
    const { data, error } = await supabase
      .from('vendas_pecuaria')
      .insert(saleData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return data as LivestockSale;
  } catch (error) {
    return errorHandler(error, 'Erro ao criar venda pecuária');
  }
}

/**
 * Atualiza uma venda pecuária existente
 */
export async function updateLivestockSale(id: string, values: Partial<LivestockSaleFormValues>) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('vendas_pecuaria')
      .update(values)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return data as LivestockSale;
  } catch (error) {
    return errorHandler(error, 'Erro ao atualizar venda pecuária');
  }
}

/**
 * Exclui uma venda pecuária existente
 */
export async function deleteLivestockSale(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('vendas_pecuaria')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return { success: true };
  } catch (error) {
    return errorHandler(error, 'Erro ao excluir venda pecuária');
  }
}

// ==== COMMODITY STOCK ACTIONS ====

/**
 * Obtém todos os estoques de commodities da organização
 */
export async function getCommodityStocks(organizacaoId: string, commodity?: string, dataReferencia?: Date) {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('estoques_commodities')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .order('data_referencia', { ascending: false });
    
    if (commodity) {
      query = query.eq('commodity', commodity);
    }
    
    if (dataReferencia) {
      const formattedDate = formatISO(dataReferencia, { representation: 'date' });
      query = query.eq('data_referencia', formattedDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data as CommodityStock[];
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar estoques de commodities');
  }
}

/**
 * Obtém um estoque de commodity específico por ID
 */
export async function getCommodityStockById(id: string, organizacaoId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('estoques_commodities')
      .select('*')
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .single();
    
    if (error) throw error;
    
    return data as CommodityStock;
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar estoque de commodity');
  }
}

/**
 * Cria um novo estoque de commodity
 */
export async function createCommodityStock(organizacaoId: string, values: CommodityStockFormValues) {
  try {
    const supabase = await createClient();
    
    // Calcula o valor total
    const valorTotal = values.quantidade * values.valor_unitario;
    
    // Prepara os dados para inserção
    const stockData = {
      ...values,
      organizacao_id: organizacaoId,
      valor_total: valorTotal,
      data_referencia: values.data_referencia 
        ? formatISO(values.data_referencia, { representation: 'date' }) 
        : formatISO(new Date(), { representation: 'date' }),
    };
    
    const { data, error } = await supabase
      .from('estoques_commodities')
      .insert(stockData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return data as CommodityStock;
  } catch (error) {
    return errorHandler(error, 'Erro ao criar estoque de commodity');
  }
}

/**
 * Atualiza um estoque de commodity existente
 */
export async function updateCommodityStock(id: string, values: Partial<CommodityStockFormValues>) {
  try {
    const supabase = await createClient();
    
    // Primeiro, obtém os dados atuais para calcular o valor total
    const { data: currentData, error: fetchError } = await supabase
      .from('estoques_commodities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Calcula o valor total com base nos novos valores ou valores existentes
    const quantidade = values.quantidade ?? currentData.quantidade;
    const valorUnitario = values.valor_unitario ?? currentData.valor_unitario;
    const valorTotal = quantidade * valorUnitario;
    
    // Prepara os dados para atualização
    const stockData = {
      ...values,
      valor_total: valorTotal,
      data_referencia: values.data_referencia 
        ? formatISO(values.data_referencia, { representation: 'date' }) 
        : undefined,
    };
    
    const { data, error } = await supabase
      .from('estoques_commodities')
      .update(stockData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return data as CommodityStock;
  } catch (error) {
    return errorHandler(error, 'Erro ao atualizar estoque de commodity');
  }
}

/**
 * Exclui um estoque de commodity existente
 */
export async function deleteCommodityStock(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('estoques_commodities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Revalida os caminhos para atualizar os dados
    revalidatePath('/dashboard/commercial');
    
    return { success: true };
  } catch (error) {
    return errorHandler(error, 'Erro ao excluir estoque de commodity');
  }
}

// ==== DASHBOARD DATA ACTIONS ====

/**
 * Obtém dados para o dashboard comercial
 */
export async function getCommercialDashboardData(organizacaoId: string) {
  try {
    const supabase = await createClient();
    
    // Busca os preços mais recentes
    const { data: prices, error: pricesError } = await supabase
      .from('precos')
      .select('*, safra:safras(*)')
      .eq('organizacao_id', organizacaoId)
      .order('data_referencia', { ascending: false })
      .limit(10);
    
    if (pricesError) throw pricesError;
    
    // Busca safras atuais
    const currentYear = new Date().getFullYear();
    const { data: currentSafras, error: safrasError } = await supabase
      .from('safras')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .or(`ano_inicio.eq.${currentYear},ano_fim.eq.${currentYear}`);
    
    if (safrasError) throw safrasError;
    
    let safraIds = [];
    if (currentSafras && currentSafras.length > 0) {
      safraIds = currentSafras.map(s => s.id);
    }
    
    // Busca as vendas de sementes da safra atual
    const { data: seedSales, error: seedSalesError } = await supabase
      .from('vendas_sementes')
      .select('*, cultura:culturas(*), safra:safras(*)')
      .eq('organizacao_id', organizacaoId)
      .in('safra_id', safraIds.length > 0 ? safraIds : ['no-safra-found'])
      .order('created_at', { ascending: false });
    
    if (seedSalesError) throw seedSalesError;
    
    // Busca as vendas pecuárias da safra atual
    const { data: livestockSales, error: livestockSalesError } = await supabase
      .from('vendas_pecuaria')
      .select('*, safra:safras(*)')
      .eq('organizacao_id', organizacaoId)
      .in('safra_id', safraIds.length > 0 ? safraIds : ['no-safra-found'])
      .order('created_at', { ascending: false });
    
    if (livestockSalesError) throw livestockSalesError;
    
    // Busca os estoques de commodities atuais
    const { data: commodityStocks, error: commodityStocksError } = await supabase
      .from('estoques_commodities')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .order('data_referencia', { ascending: false });
    
    if (commodityStocksError) throw commodityStocksError;
    
    return {
      prices,
      seedSales,
      livestockSales,
      commodityStocks,
    };
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar dados do dashboard comercial');
  }
}

// ==== HISTORICAL ANALYSIS ACTIONS ====

// Definir tipo para os dados de preço para resolver problemas de indexação
type PriceRecord = Price & {
  safra?: { nome: string };
  [key: string]: any; // Permite indexação com string
};

// Definir tipo para dados processados de preço histórico
interface ProcessedPriceData {
  date: string;
  price: number;
  safra?: string;
}

// Importar tipo de resposta de erro
import { ErrorResponse } from '@/utils/error-handler';

/**
 * Obtém dados históricos de preços para análise
 */
export async function getHistoricalPriceData(
  organizacaoId: string, 
  commodity: string, 
  startDate: Date, 
  endDate: Date,
  currency: 'BRL' | 'USD' = 'BRL'
): Promise<ProcessedPriceData[] | ErrorResponse> {
  try {
    const supabase = await createClient();
    
    // Formata as datas para ISO
    const formattedStartDate = formatISO(startDate, { representation: 'date' });
    const formattedEndDate = formatISO(endDate, { representation: 'date' });
    
    // Determina o campo de preço com base na commodity e moeda selecionadas
    let priceField: string;
    switch (commodity) {
      case 'SOJA':
        priceField = currency === 'USD' ? 'preco_soja_usd' : 'preco_soja_brl';
        break;
      case 'MILHO':
        priceField = 'preco_milho'; // Sempre em BRL
        break;
      case 'ALGODAO':
        priceField = currency === 'USD' ? 'preco_algodao' : 'preco_algodao_bruto';
        break;
      default:
        // Para outras commodities, busca nos campos de outros_precos
        priceField = 'outros_precos';
        break;
    }
    
    // Busca os dados de preços
    let query = supabase
      .from('precos')
      .select('*, safra:safras(*)')
      .eq('organizacao_id', organizacaoId)
      .gte('data_referencia', formattedStartDate)
      .lte('data_referencia', formattedEndDate)
      .order('data_referencia', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Processa os dados para o formato necessário para a análise
    let processedData: ProcessedPriceData[] = [];
    
    if (priceField === 'outros_precos') {
      // Filtra e processa dados de outras commodities
      processedData = (data as PriceRecord[])
        .filter(item => item.outros_precos && 
                typeof item.outros_precos === 'object' && 
                commodity.toLowerCase() in item.outros_precos)
        .map(item => ({
          date: item.data_referencia.toString(),
          price: item.outros_precos?.[commodity.toLowerCase()] || 0,
          safra: item.safra?.nome,
        }));
    } else {
      // Processa dados para as commodities principais
      processedData = (data as PriceRecord[])
        .filter(item => item[priceField] !== null && item[priceField] !== undefined)
        .map(item => ({
          date: item.data_referencia.toString(),
          price: item[priceField] as number,
          safra: item.safra?.nome,
        }));
    }
    
    return processedData;
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar dados históricos de preços');
  }
}

// Definir tipo para dados de comparação de preços
interface PriceComparisonData {
  [commodity: string]: ProcessedPriceData[];
}

/**
 * Obtém dados para comparação de preços de commodities
 */
export async function getPriceComparisonData(
  organizacaoId: string,
  commodities: string[],
  startDate: Date,
  endDate: Date,
  currency: 'BRL' | 'USD' = 'BRL'
): Promise<PriceComparisonData | ErrorResponse> {
  try {
    const supabase = await createClient();
    
    // Formata as datas para ISO
    const formattedStartDate = formatISO(startDate, { representation: 'date' });
    const formattedEndDate = formatISO(endDate, { representation: 'date' });
    
    // Busca os dados de preços
    const { data, error } = await supabase
      .from('precos')
      .select('*, safra:safras(*)')
      .eq('organizacao_id', organizacaoId)
      .gte('data_referencia', formattedStartDate)
      .lte('data_referencia', formattedEndDate)
      .order('data_referencia', { ascending: true });
    
    if (error) throw error;
    
    // Processa os dados para comparação de múltiplas commodities
    const comparisonData: PriceComparisonData = {};
    
    (data as PriceRecord[]).forEach(item => {
      const date = item.data_referencia;
      
      commodities.forEach(commodity => {
        if (!comparisonData[commodity]) {
          comparisonData[commodity] = [];
        }
        
        let price: number | null = null;
        
        switch (commodity) {
          case 'SOJA':
            price = currency === 'USD' 
              ? (item.preco_soja_usd as number | null) 
              : (item.preco_soja_brl as number | null);
            break;
          case 'MILHO':
            price = item.preco_milho as number | null;
            break;
          case 'ALGODAO':
            price = currency === 'USD' 
              ? (item.preco_algodao as number | null) 
              : (item.preco_algodao_bruto as number | null);
            break;
          default:
            // Para outras commodities, busca nos campos de outros_precos
            if (item.outros_precos && 
                typeof item.outros_precos === 'object' && 
                commodity.toLowerCase() in item.outros_precos) {
              price = item.outros_precos[commodity.toLowerCase()];
            }
            break;
        }
        
        if (price !== null && price !== undefined) {
          comparisonData[commodity].push({
            date: date.toString(),
            price,
            safra: item.safra?.nome,
          });
        }
      });
    });
    
    return comparisonData;
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar dados para comparação de preços');
  }
}

// Tipos para dados de sazonalidade
interface PriceSeriesItem {
  date: Date;
  price: number;
  month: number;
  year: number;
}

interface MonthlyAverage {
  month: number;
  average: number;
  count: number;
}

interface YearData {
  prices: number[];
  min: number;
  max: number;
}

interface YearSummary {
  year: number;
  average: number;
  min: number;
  max: number;
  variance: number;
}

interface SeasonalityResult {
  monthlyAverages: MonthlyAverage[];
  yearSummaries: YearSummary[];
  rawData: PriceSeriesItem[];
}

/**
 * Obtém dados de sazonalidade de preços
 */
export async function getSeasonalityData(
  organizacaoId: string,
  commodity: string,
  years: number
): Promise<SeasonalityResult | ErrorResponse> {
  try {
    const supabase = await createClient();
    
    // Calcula a data de início com base no número de anos
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);
    const formattedStartDate = formatISO(startDate, { representation: 'date' });
    
    // Determina o campo de preço com base na commodity
    let priceField: string;
    switch (commodity) {
      case 'SOJA':
        priceField = 'preco_soja_brl';
        break;
      case 'MILHO':
        priceField = 'preco_milho';
        break;
      case 'ALGODAO':
        priceField = 'preco_algodao_bruto';
        break;
      default:
        // Para outras commodities, busca nos campos de outros_precos
        priceField = 'outros_precos';
        break;
    }
    
    // Busca os dados de preços
    const { data, error } = await supabase
      .from('precos')
      .select('*, safra:safras(*)')
      .eq('organizacao_id', organizacaoId)
      .gte('data_referencia', formattedStartDate)
      .order('data_referencia', { ascending: true });
    
    if (error) throw error;
    
    // Processa os dados para análise de sazonalidade
    let priceSeries: PriceSeriesItem[] = [];
    
    if (priceField === 'outros_precos') {
      // Filtra e processa dados de outras commodities
      priceSeries = (data as PriceRecord[])
        .filter(item => item.outros_precos && 
                typeof item.outros_precos === 'object' && 
                commodity.toLowerCase() in item.outros_precos)
        .map(item => {
          const referenceDate = new Date(item.data_referencia);
          return {
            date: referenceDate,
            price: item.outros_precos?.[commodity.toLowerCase()] || 0,
            month: referenceDate.getMonth(),
            year: referenceDate.getFullYear(),
          };
        });
    } else {
      // Processa dados para as commodities principais
      priceSeries = (data as PriceRecord[])
        .filter(item => item[priceField] !== null && item[priceField] !== undefined)
        .map(item => {
          const referenceDate = new Date(item.data_referencia);
          return {
            date: referenceDate,
            price: item[priceField] as number,
            month: referenceDate.getMonth(),
            year: referenceDate.getFullYear(),
          };
        });
    }
    
    // Calcula as médias mensais
    const monthlyAverages: MonthlyAverage[] = [];
    for (let month = 0; month < 12; month++) {
      const pricesForMonth = priceSeries.filter(item => item.month === month);
      
      if (pricesForMonth.length > 0) {
        const sum = pricesForMonth.reduce((total, item) => total + item.price, 0);
        const average = sum / pricesForMonth.length;
        
        monthlyAverages.push({
          month: month + 1, // Mês de 1 a 12
          average: parseFloat(average.toFixed(2)),
          count: pricesForMonth.length,
        });
      }
    }
    
    // Calcula estatísticas anuais
    const yearlyData: Record<number, YearData> = {};
    priceSeries.forEach(item => {
      if (!yearlyData[item.year]) {
        yearlyData[item.year] = {
          prices: [],
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE,
        };
      }
      
      yearlyData[item.year].prices.push(item.price);
      yearlyData[item.year].min = Math.min(yearlyData[item.year].min, item.price);
      yearlyData[item.year].max = Math.max(yearlyData[item.year].max, item.price);
    });
    
    // Calcula média, mínimo e máximo anuais
    const yearSummaries: YearSummary[] = Object.keys(yearlyData).map(year => {
      const yearNum = parseInt(year);
      const yearData = yearlyData[yearNum];
      const sum = yearData.prices.reduce((total, price) => total + price, 0);
      const average = sum / yearData.prices.length;
      
      return {
        year: yearNum,
        average: parseFloat(average.toFixed(2)),
        min: yearData.min,
        max: yearData.max,
        variance: parseFloat((yearData.max - yearData.min).toFixed(2)),
      };
    }).sort((a, b) => a.year - b.year);
    
    return {
      monthlyAverages,
      yearSummaries,
      rawData: priceSeries,
    };
  } catch (error) {
    return errorHandler(error, 'Erro ao buscar dados de sazonalidade');
  }
}