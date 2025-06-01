"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";

export interface ProductionNavClientProps {
  plantingAreasComponent: React.ReactNode;
  productivityComponent: React.ReactNode;
  costsComponent: React.ReactNode;
  livestockComponent: React.ReactNode;
  livestockOperationsComponent: React.ReactNode;
  configComponent: React.ReactNode;
}

export function ProductionNavClient({
  plantingAreasComponent,
  productivityComponent,
  costsComponent,
  livestockComponent,
  livestockOperationsComponent,
  configComponent,
}: ProductionNavClientProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("plantingAreas");

  // Detectar a tab inicial baseada na URL apenas na montagem do componente
  useEffect(() => {
    if (pathname) {
      if (pathname.includes("/production/planting-areas")) {
        setActiveTab("plantingAreas");
      } else if (pathname.includes("/production/productivity")) {
        setActiveTab("productivity");
      } else if (pathname.includes("/production/costs")) {
        setActiveTab("costs");
      } else if (pathname.includes("/production/livestock-operations")) {
        setActiveTab("livestockOperations");
      } else if (pathname.includes("/production/livestock")) {
        setActiveTab("livestock");
      } else if (pathname.includes("/production/config")) {
        setActiveTab("config");
      } else {
        // Default para áreas de plantio
        setActiveTab("plantingAreas");
      }
    }
  }, [pathname]);

  // Função para trocar de tab
  const handleTabChange = (value: string) => {
    if (value === activeTab) return;
    setActiveTab(value);
  };

  // Renderizar o conteúdo da tab ativa
  const renderTabContent = () => {
    switch (activeTab) {
      case "plantingAreas":
        return plantingAreasComponent;
      case "productivity":
        return productivityComponent;
      case "costs":
        return costsComponent;
      case "livestock":
        return livestockComponent;
      case "livestockOperations":
        return livestockOperationsComponent;
      case "config":
        return configComponent;
      default:
        return plantingAreasComponent;
    }
  };

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full max-w-full"
      >
        <TabsList className="w-full overflow-x-auto flex flex-nowrap dark:bg-gray-800 dark:text-gray-300">
          {/* Configurações como primeira tab */}
          <TabsTrigger value="config" className="relative dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            Configurações
          </TabsTrigger>

          {/* Áreas de Plantio */}
          <TabsTrigger value="plantingAreas" className="relative dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            Áreas de Plantio
          </TabsTrigger>

          {/* Produtividade */}
          <TabsTrigger value="productivity" className="relative dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            Produtividade
          </TabsTrigger>

          {/* Custos de Produção */}
          <TabsTrigger value="costs" className="relative dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            Custos de Produção
          </TabsTrigger>

          {/* Rebanho */}
          <TabsTrigger value="livestock" className="relative dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            Rebanho
          </TabsTrigger>

          {/* Operações Pecuárias */}
          <TabsTrigger value="livestockOperations" className="relative dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            Operações Pecuárias
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Conteúdo da tab ativa */}
      <div className="mt-4 relative">{renderTabContent()}</div>
    </div>
  );
}
