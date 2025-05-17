"use client";

import { createContext, useContext, ReactNode } from "react";

interface DashboardContextData {
  commercialPrices: any | null;
}

interface DashboardProviderProps {
  children: ReactNode;
  commercialPrices: any | null;
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