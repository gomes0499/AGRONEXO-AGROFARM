"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CurrencyConfig } from "@/lib/utils/currency-converter";

interface CurrencyContextType {
  currencyConfigs: CurrencyConfig[];
  setCurrencyConfigs: (configs: CurrencyConfig[]) => void;
  displayCurrency: "BRL" | "USD" | "BOTH";
  setDisplayCurrency: (currency: "BRL" | "USD" | "BOTH") => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyConfigs, setCurrencyConfigs] = useState<CurrencyConfig[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<"BRL" | "USD" | "BOTH">("BRL");

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedConfigs = localStorage.getItem("currencyConfigs");
    const savedDisplay = localStorage.getItem("displayCurrency");
    
    if (savedConfigs) {
      try {
        setCurrencyConfigs(JSON.parse(savedConfigs));
      } catch (error) {
        console.error("Erro ao carregar configurações de moeda:", error);
      }
    }
    
    if (savedDisplay) {
      setDisplayCurrency(savedDisplay as "BRL" | "USD" | "BOTH");
    }
  }, []);

  // Salvar configurações no localStorage
  const updateCurrencyConfigs = (configs: CurrencyConfig[]) => {
    setCurrencyConfigs(configs);
    localStorage.setItem("currencyConfigs", JSON.stringify(configs));
  };

  const updateDisplayCurrency = (currency: "BRL" | "USD" | "BOTH") => {
    setDisplayCurrency(currency);
    localStorage.setItem("displayCurrency", currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencyConfigs,
        setCurrencyConfigs: updateCurrencyConfigs,
        displayCurrency,
        setDisplayCurrency: updateDisplayCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}