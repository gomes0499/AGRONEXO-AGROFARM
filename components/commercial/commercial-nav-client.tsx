"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export interface CommercialNavClientProps {
  seedsComponent?: React.ReactNode;
  livestockComponent?: React.ReactNode;
  stocksComponent?: React.ReactNode;
}

export function CommercialNavClient({
  seedsComponent,
  livestockComponent,
}: CommercialNavClientProps) {
  // Inicialização com tratamento de erro
  const [activeTab, setActiveTab] = useState("seeds");
  const [hasError, setHasError] = useState(false);

  // Função para trocar de tab com proteção contra erros
  const handleTabChange = (value: string) => {
    try {
      if (value === activeTab) return;
      setActiveTab(value);
    } catch (error) {
      console.error("Erro ao trocar de tab:", error);
      setHasError(true);
    }
  };

  // Em caso de erro, mostre um fallback simples
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-60 border rounded-lg">
        <p className="text-muted-foreground mb-2">
          Ocorreu um erro ao carregar o módulo comercial.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Renderizar o conteúdo da tab ativa de forma segura
  let tabContent;
  try {
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
  } catch (error) {
    console.error("Erro ao renderizar o conteúdo da tab:", error);
    tabContent = (
      <div className="flex items-center justify-center h-60 border rounded-lg border-red-200">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-muted-foreground">
            Carregando dados...
          </p>
        </div>
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

      {/* Conteúdo da tab ativa com tratamento de erro */}
      <div className="mt-4 relative">
        {tabContent || (
          <div className="flex items-center justify-center h-60 border rounded-lg">
            <p className="text-muted-foreground">
              Conteúdo não disponível
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
