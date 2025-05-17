"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface CommercialNavClientProps {
  seedsComponent?: React.ReactNode;
  livestockComponent?: React.ReactNode;
  stocksComponent?: React.ReactNode;
}

export function CommercialNavClient({
  seedsComponent,
  livestockComponent,
}: CommercialNavClientProps) {
  // Inicialização direta sem useEffect para evitar problemas de temporalidade
  const [activeTab, setActiveTab] = useState("seeds");

  // Função para trocar de tab
  const handleTabChange = (value: string) => {
    if (value === activeTab) return;
    setActiveTab(value);
  };

  // Renderizar o conteúdo da tab ativa de forma segura
  let tabContent;
  if (activeTab === "seeds") {
    tabContent = seedsComponent || (
      <div className="flex items-center justify-center h-60 border rounded-lg">
        <p className="text-muted-foreground">
          Módulo de vendas de sementes em desenvolvimento
        </p>
      </div>
    );
  } else if (activeTab === "livestock") {
    tabContent = livestockComponent || (
      <div className="flex items-center justify-center h-60 border rounded-lg">
        <p className="text-muted-foreground">
          Módulo de vendas pecuárias em desenvolvimento
        </p>
      </div>
    );
  }

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList>
          {/* Sementes */}
          <TabsTrigger value="seeds" className="relative">
            Sementes
          </TabsTrigger>

          {/* Pecuária */}
          <TabsTrigger value="livestock" className="relative">
            Pecuária
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Conteúdo da tab ativa */}
      <div className="mt-4 relative">{tabContent}</div>
    </div>
  );
}
