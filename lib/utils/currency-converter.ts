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
    
    return `${formatCurrency(brlValue, "BRL")} / ${formatCurrency(usdValue, "USD")}`;
  }
  
  if (displayCurrency === valueCurrency) {
    return formatCurrency(value, displayCurrency);
  }
  
  const convertedValue = convertCurrency(value, valueCurrency, displayCurrency, exchangeRate);
  return formatCurrency(convertedValue, displayCurrency);
}

/**
 * Obtém a taxa de câmbio para uma safra específica
 */
export function getExchangeRateForSafra(
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