import { formatCurrency } from "./formatters";

export interface CurrencyConfig {
  safraId: string;
  moedaPrincipal: "BRL" | "USD";
  taxaCambio: number;
}

/**
 * Converte valor de uma moeda para outra usando a taxa de câmbio
 */
export function convertCurrency(
  value: number,
  fromCurrency: "BRL" | "USD",
  toCurrency: "BRL" | "USD",
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return value;
  
  if (fromCurrency === "USD" && toCurrency === "BRL") {
    return value * exchangeRate;
  }
  
  if (fromCurrency === "BRL" && toCurrency === "USD") {
    return value / exchangeRate;
  }
  
  return value;
}

/**
 * Formata valor com conversão de moeda opcional
 */
export function formatCurrencyWithConversion(
  value: number,
  displayCurrency: "BRL" | "USD" | "BOTH",
  valueCurrency: "BRL" | "USD",
  exchangeRate: number = 5.00
): string {
  if (displayCurrency === "BOTH") {
    const brlValue = valueCurrency === "BRL" ? value : convertCurrency(value, "USD", "BRL", exchangeRate);
    const usdValue = valueCurrency === "USD" ? value : convertCurrency(value, "BRL", "USD", exchangeRate);
    
    return `${formatCurrency(brlValue)} / ${formatCurrency(usdValue)}`;
  }
  
  if (displayCurrency === valueCurrency) {
    return formatCurrency(value);
  }
  
  const convertedValue = convertCurrency(value, valueCurrency, displayCurrency, exchangeRate);
  return formatCurrency(convertedValue);
}

/**
 * Obtém a taxa de câmbio para uma safra específica a partir de configurações
 */
export function getExchangeRateForSafraFromConfig(
  safraId: string,
  currencyConfigs: CurrencyConfig[]
): number {
  const config = currencyConfigs.find(c => c.safraId === safraId);
  return config?.taxaCambio || 5.00; // Taxa padrão se não configurada
}

/**
 * Obtém a moeda principal para uma safra específica
 */
export function getMainCurrencyForSafra(
  safraId: string,
  currencyConfigs: CurrencyConfig[]
): "BRL" | "USD" {
  const config = currencyConfigs.find(c => c.safraId === safraId);
  return config?.moedaPrincipal || "BRL"; // BRL como padrão
}

/**
 * Formata valor com múltiplas moedas usando taxa de câmbio
 */
export function formatWithExchangeRate(
  value: number, 
  currency: string, 
  exchangeRate: number
): { primary: string; secondary: string } {
  const formatCurrency = (val: number, curr: string) => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: curr === 'USD' ? 'USD' : 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    if (curr === 'USD') {
      return formatter.format(val).replace('US$', 'US$');
    } else if (curr === 'SOJA') {
      return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sc`;
    }
    return formatter.format(val);
  };

  const primary = formatCurrency(value, currency);
  let secondary = '';
  
  if (currency === 'USD') {
    secondary = formatCurrency(value * exchangeRate, 'BRL');
  } else if (currency === 'BRL') {
    secondary = formatCurrency(value / exchangeRate, 'USD');
  }
  
  return { primary, secondary };
}

/**
 * Obtém taxa de câmbio para uma safra específica
 */
export function getExchangeRateForSafra(cotacoes: any[], safraId: string): number {
  // Find exchange rate for DOLAR_FECHAMENTO for the safra
  const cotacao = cotacoes.find(c => 
    c.safra_id === safraId && 
    c.tipo_moeda === "DOLAR_FECHAMENTO"
  );
  
  if (cotacao && cotacao.cotacoes_por_ano) {
    // If has yearly rates, get the rate for the safraId
    const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string' 
      ? JSON.parse(cotacao.cotacoes_por_ano)
      : cotacao.cotacoes_por_ano;
      
    // Get the first available rate or default
    const anos = Object.keys(cotacoesPorAno).sort();
    if (anos.length > 0) {
      return cotacoesPorAno[anos[0]] || 5.7;
    }
  }
  
  // Fallback to current rate or default
  return cotacao?.cotacao_atual || 5.7;
}