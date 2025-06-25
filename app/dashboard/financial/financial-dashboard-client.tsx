"use client";

import { useState } from "react";
import { CurrencyProvider } from "@/contexts/currency-context";
import { CurrencyViewToggle } from "@/components/financial/currency-config/currency-view-toggle";
import { CurrencyConfigModal } from "@/components/financial/currency-config/currency-config-modal";

interface FinancialDashboardClientProps {
  children: React.ReactNode;
  safras: Array<{ id: string; nome: string }>;
}

export function FinancialDashboardClient({
  children,
  safras,
}: FinancialDashboardClientProps) {
  return (
    <CurrencyProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4 md:px-6">
          <h1 className="text-2xl font-semibold">Módulo Financeiro</h1>
          <div className="flex items-center gap-4">
            <CurrencyViewToggle
              currentView="BRL"
              onViewChange={(view) => {
                // Esta função será conectada ao contexto
                console.log("Mudando visualização para:", view);
              }}
            />
            <CurrencyConfigModal
              safras={safras}
              configs={[]}
              onSave={(configs) => {
                console.log("Salvando configurações:", configs);
              }}
            />
          </div>
        </div>
        {children}
      </div>
    </CurrencyProvider>
  );
}