"use client";

import { IndicatorThresholdViewer } from "./indicator-threshold-viewer";
import { CommodityPriceTab } from "./commodity-price-tab";
import { defaultIndicatorConfigs, indicatorLabels } from "@/schemas/indicators";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { TrendingUp, DollarSign } from "lucide-react";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CommodityPriceType } from "@/schemas/indicators/prices";

// Função para obter o nível de um indicador
function getIndicatorLevel(value: number, thresholds: any[]): string {
  if (!thresholds || thresholds.length === 0) {
    return "N/A";
  }
  
  for (const threshold of thresholds) {
    const min = threshold.min;
    const max = threshold.max;
    
    if (max === undefined) {
      if (value >= min) {
        return threshold.level === "THRESHOLD" ? "LIMITE CRÍTICO" : 
          threshold.level === "MUITO_BOM" ? "MUITO BOM" : 
          threshold.level === "ATENCAO" ? "ATENÇÃO" : 
          threshold.level === "CONFORTAVEL" ? "CONFORTÁVEL" : 
          threshold.level;
      }
    } else {
      if (value >= min && value <= max) {
        return threshold.level === "THRESHOLD" ? "LIMITE CRÍTICO" : 
          threshold.level === "MUITO_BOM" ? "MUITO BOM" : 
          threshold.level === "ATENCAO" ? "ATENÇÃO" : 
          threshold.level === "CONFORTAVEL" ? "CONFORTÁVEL" : 
          threshold.level;
      }
    }
  }
  
  return "N/A";
}

// Função para obter a cor de um indicador
function getIndicatorColor(value: number, thresholds: any[]): string {
  if (!thresholds || thresholds.length === 0) {
    return "#CBD5E0";
  }
  
  for (const threshold of thresholds) {
    const min = threshold.min;
    const max = threshold.max;
    
    if (max === undefined) {
      if (value >= min) {
        return threshold.color;
      }
    } else {
      if (value >= min && value <= max) {
        return threshold.color;
      }
    }
  }
  
  return "#CBD5E0";
}

type IndicatorDashboardProps = {
  indicatorData: {
    liquidez: number;
    dividaEbitda: number;
    dividaFaturamento: number;
    dividaPl: number;
    ltv: number;
  };
  indicatorConfigs: Record<string, any>;
  commodityPrices?: CommodityPriceType[] | undefined;
};

// Componente para a visão de indicadores
export function IndicatorsComponent({ 
  indicatorData, 
  indicatorConfigs, 
  commodityPrices = [] 
}: IndicatorDashboardProps) {
  const isMobile = useIsMobile();

  const tabs = [
    {
      value: "thresholds",
      label: "Limiares",
      icon: TrendingUp,
      content: (
        <div className="w-full">
          <CardHeaderPrimary
            title="Limiares de Indicadores"
            icon={<TrendingUp className="h-5 w-5" />}
            className="mb-4"
          />
          <IndicatorThresholdViewer indicatorConfigs={indicatorConfigs} />
        </div>
      ),
    },
    {
      value: "prices",
      label: "Preços",
      icon: DollarSign,
      content: (
        <div className="w-full">
          <CardHeaderPrimary
            title="Preços das Commodities"
            icon={<DollarSign className="h-5 w-5" />}
            className="mb-4"
          />
          <CommodityPriceTab commodityPrices={commodityPrices} />
        </div>
      ),
    },
  ];

  if (isMobile) {
    return (
      <div className="space-y-6">
        <MobileTabs tabs={tabs} defaultValue="thresholds" />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="space-y-6">
      <Tabs defaultValue="thresholds" className="w-full">
        <TabsList className="mb-6 overflow-x-auto w-max">
          <TabsTrigger value="thresholds">Limiares</TabsTrigger>
          <TabsTrigger value="prices">Preços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="thresholds" className="w-full">
          <CardHeaderPrimary
            title="Limiares de Indicadores"
            icon={<TrendingUp className="h-5 w-5" />}
            className="mb-4"
          />
          <IndicatorThresholdViewer indicatorConfigs={indicatorConfigs} />
        </TabsContent>
        
        <TabsContent value="prices" className="w-full">
          <CardHeaderPrimary
            title="Preços das Commodities"
            icon={<DollarSign className="h-5 w-5" />}
            className="mb-4"
          />
          <CommodityPriceTab commodityPrices={commodityPrices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente principal que será usado na página
export function IndicatorDashboard({ 
  indicatorData, 
  indicatorConfigs,
  commodityPrices 
}: IndicatorDashboardProps) {
  // Criar o componente de indicadores
  const indicatorsComponent = (
    <IndicatorsComponent 
      indicatorData={indicatorData} 
      indicatorConfigs={indicatorConfigs}
      commodityPrices={commodityPrices}
    />
  );
  
  // Importar dinamicamente o componente de navegação
  // Isso é feito aqui para evitar problemas com Server Components
  const { IndicatorNavClient } = require('./indicator-nav-client');
  
  return (
    <IndicatorNavClient
      indicatorsComponent={indicatorsComponent}
    />
  );
}