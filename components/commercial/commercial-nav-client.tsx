"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";

export interface CommercialNavClientProps {
  seedsComponent?: React.ReactNode;
  livestockComponent?: React.ReactNode;
  stocksComponent?: React.ReactNode;
}

export function CommercialNavClient({
  seedsComponent,
  livestockComponent,
}: CommercialNavClientProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("seeds");

  // Detectar a tab inicial baseada na URL apenas na montagem do componente
  useEffect(() => {
    if (pathname) {
      if (pathname.includes("/commercial/seeds")) {
        setActiveTab("seeds");
      } else if (pathname.includes("/commercial/livestock")) {
        setActiveTab("livestock");
      } else {
        // Default para seeds
        setActiveTab("seeds");
      }
    }
  }, [pathname]);

  // Handler for tab change
  const handleTabChange = (value: string) => {
    if (value === activeTab) return;
    setActiveTab(value);
  };

  // Renderizar o conteúdo da tab ativa
  const renderTabContent = () => {
    switch (activeTab) {
      case "seeds":
        return seedsComponent || (
          <div className="flex items-center justify-center h-60 border rounded-lg">
            <p className="text-muted-foreground">
              Módulo de vendas de sementes em desenvolvimento
            </p>
          </div>
        );
      case "livestock":
        return livestockComponent || (
          <div className="flex items-center justify-center h-60 border rounded-lg">
            <p className="text-muted-foreground">
              Módulo de vendas pecuárias em desenvolvimento
            </p>
          </div>
        );
      default:
        return seedsComponent;
    }
  };

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-4">
          {/* Seeds Tab */}
          <TabsTrigger value="seeds" className="relative">
            Sementes
          </TabsTrigger>

          {/* Livestock Tab */}
          <TabsTrigger value="livestock" className="relative">
            Pecuária
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Conteúdo da tab ativa - renderizado FORA do componente Tabs */}
      <div className="mt-4 relative">
        {renderTabContent()}
      </div>
    </div>
  );
}