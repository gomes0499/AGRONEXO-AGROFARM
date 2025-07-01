import { cache } from "react";

export interface MarketData {
  dolar: {
    value: number;
    change: number;
    changePercent: number;
  };
  algodao: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  };
  boi: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  };
  soja: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  };
  milho: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  };
  feijao: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  };
}

/**
 * Fetch market data from external API
 * In production, this would call a real market data API
 */
export const getMarketData = cache(async (): Promise<MarketData> => {
  // TODO: Replace with actual market data API
  // For now, return mock data
  return {
    dolar: {
      value: 5.45,
      change: 0.05,
      changePercent: 0.92,
    },
    algodao: {
      name: "Algodão",
      value: 385.20,
      change: 2.50,
      changePercent: 0.65,
    },
    boi: {
      name: "Boi Gordo",
      value: 318.00,
      change: -1.50,
      changePercent: -0.47,
    },
    soja: {
      name: "Soja ESALQ/BM&F",
      value: 158.50,
      change: 0.75,
      changePercent: 0.48,
    },
    milho: {
      name: "Milho",
      value: 88.50,
      change: 0.25,
      changePercent: 0.28,
    },
    feijao: {
      name: "Feijão",
      value: 285.00,
      change: -2.00,
      changePercent: -0.70,
    },
  };
});