"use client";

import { createContext, useContext, ReactNode } from "react";

interface CommercialPrice {
  id: string;
  safra_id: string;
  cultura_id: string;
  preco: number;
  moeda: string;
  created_at: string;
  updated_at: string;
}

interface DashboardContextData {
  commercialPrices: CommercialPrice[] | null;
}

interface DashboardProviderProps {
  children: ReactNode;
  commercialPrices: CommercialPrice[] | null;
}

const DashboardContext = createContext<DashboardContextData>({
  commercialPrices: null,
});

export function DashboardProvider({
  children,
  commercialPrices,
}: DashboardProviderProps) {
  return (
    <DashboardContext.Provider
      value={{
        commercialPrices,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
