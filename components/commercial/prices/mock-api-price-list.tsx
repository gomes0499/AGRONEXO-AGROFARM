"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

// Dados mockados de API financeira
const mockPriceData = {
  date: new Date(),
  lastUpdate: new Date(),
  prices: {
    dollar: {
      cotton: 5.23,
      corn: 5.18,
      soy: 5.21,
      closing: 5.2,
      change: 0.02, // Variação em relação ao dia anterior
    },
    cotton: {
      usdPerLb: 0.8145,
      pluma: 175.6,
      carocoTon: 580.0,
      carocoArroba: 8.7,
      capulho: 115.8,
      change: -0.015, // Variação em relação ao dia anterior
    },
    corn: {
      brlPerSack: 58.5,
      change: -0.02, // Variação em relação ao dia anterior
    },
    soy: {
      usdPerSack: 24.8,
      brlPerSack: 129.2,
      change: 0.03, // Variação em relação ao dia anterior
    },
    others: {
      millet: { value: 62.3, change: 0.01 },
      sorghum: { value: 50.7, change: -0.005 },
      beanGurutuba: { value: 195.0, change: 0.02 },
      beanCarioca: { value: 245.0, change: 0.03 },
      castor: { value: 5.85, change: 0.0 },
      pastureSeed: { value: 18.5, change: -0.01 },
      coffee: { value: 1250.0, change: 0.05 },
      wheat: { value: 68.0, change: -0.02 },
    },
  },
};

export function CommodityPriceCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    cambio: true,
    soja: true,
    milho: true,
    algodao: true,
    outras: false,
  });

  // Simular carregamento de dados
  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Função para formatar variação de preço
  const formatChange = (change: number) => {
    const prefix = change >= 0 ? "+" : "";
    const color = change >= 0 ? "text-green-500" : "text-red-500";
    return (
      <span className={color}>{`${prefix}${(change * 100).toFixed(2)}%`}</span>
    );
  };

  // Função para formatar valor absoluto de variação
  const formatAbsoluteChange = (change: number, baseValue: number) => {
    const absoluteChange = baseValue * change;
    const prefix = absoluteChange >= 0 ? "+" : "";
    const color = absoluteChange >= 0 ? "text-green-500" : "text-red-500";
    return (
      <span className={color}>{`${prefix}${absoluteChange.toFixed(4)}`}</span>
    );
  };

  // Toggle para expandir/colapsar seções
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preços de Commodities</CardTitle>
        <CardDescription className="flex justify-between items-center">
          Última atualização:{" "}
          {format(mockPriceData.lastUpdate, "dd MMM yyyy HH:mm:ss", {
            locale: ptBR,
          })}
          <Button variant="outline" size="sm" onClick={refreshData}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Separator />

        {/* Seção Câmbio */}
        <Collapsible open={expandedSections.cambio}>
          <CollapsibleTrigger
            className="flex justify-between items-center w-full p-4 hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("cambio")}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                DÓLAR
              </span>
              <Badge variant="outline" className="ml-2">
                USD
              </Badge>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.cambio ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20">
              <div>
                <div className="text-sm text-muted-foreground">
                  DÓLAR FECHAMENTO:
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">
                    {mockPriceData.prices.dollar.closing.toFixed(4)}
                  </span>
                  <span className="ml-2 text-red-500">
                    {mockPriceData.prices.dollar.change >= 0 ? "+" : ""}
                    {(
                      mockPriceData.prices.dollar.change *
                      mockPriceData.prices.dollar.closing
                    ).toFixed(4)}
                  </span>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">ALGODÃO</div>
                    <div className="font-medium">
                      {mockPriceData.prices.dollar.cotton.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">MILHO</div>
                    <div className="font-medium">
                      {mockPriceData.prices.dollar.corn.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">SOJA</div>
                    <div className="font-medium">
                      {mockPriceData.prices.dollar.soy.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Seção Soja */}
        <Collapsible open={expandedSections.soja}>
          <CollapsibleTrigger
            className="flex justify-between items-center w-full p-4 hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("soja")}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                SOJA
              </span>
              <Badge variant="outline" className="ml-2">
                SOY
              </Badge>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.soja ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20">
              <div>
                <div className="text-sm text-muted-foreground">
                  VALOR (R$/SACA):
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">
                    {mockPriceData.prices.soy.brlPerSack.toFixed(2)}
                  </span>
                  <span className="ml-2 text-green-500">
                    {mockPriceData.prices.soy.change >= 0 ? "+" : ""}
                    {(
                      mockPriceData.prices.soy.change *
                      mockPriceData.prices.soy.brlPerSack
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  VALOR (US$/SACA):
                </div>
                <div className="font-medium">
                  {mockPriceData.prices.soy.usdPerSack.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  VARIAÇÃO:
                </div>
                <div className="font-medium">
                  {formatChange(mockPriceData.prices.soy.change)}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Seção Milho */}
        <Collapsible open={expandedSections.milho}>
          <CollapsibleTrigger
            className="flex justify-between items-center w-full p-4 hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("milho")}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                MILHO
              </span>
              <Badge variant="outline" className="ml-2">
                CRN
              </Badge>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.milho ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20">
              <div>
                <div className="text-sm text-muted-foreground">
                  VALOR (R$/SACA):
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">
                    {mockPriceData.prices.corn.brlPerSack.toFixed(2)}
                  </span>
                  <span className="ml-2 text-red-500">
                    {mockPriceData.prices.corn.change >= 0 ? "+" : ""}
                    {(
                      mockPriceData.prices.corn.change *
                      mockPriceData.prices.corn.brlPerSack
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">VARIAÇÃO:</div>
                <div className="font-medium">
                  {formatChange(mockPriceData.prices.corn.change)}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Seção Algodão */}
        <Collapsible open={expandedSections.algodao}>
          <CollapsibleTrigger
            className="flex justify-between items-center w-full p-4 hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("algodao")}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                ALGODÃO
              </span>
              <Badge variant="outline" className="ml-2">
                CTN
              </Badge>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.algodao ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20">
              <div>
                <div className="text-sm text-muted-foreground">
                  VALOR (US$/LB):
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">
                    {mockPriceData.prices.cotton.usdPerLb.toFixed(4)}
                  </span>
                  <span className="ml-2 text-red-500">
                    {mockPriceData.prices.cotton.change >= 0 ? "+" : ""}
                    {(
                      mockPriceData.prices.cotton.change *
                      mockPriceData.prices.cotton.usdPerLb
                    ).toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">
                    PLUMA (R$/@)
                  </div>
                  <div className="font-medium">
                    {mockPriceData.prices.cotton.pluma.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    CAROÇO (R$/TON)
                  </div>
                  <div className="font-medium">
                    {mockPriceData.prices.cotton.carocoTon.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    CAROÇO (R$/@)
                  </div>
                  <div className="font-medium">
                    {mockPriceData.prices.cotton.carocoArroba.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    CAPULHO (R$/@)
                  </div>
                  <div className="font-medium">
                    {mockPriceData.prices.cotton.capulho.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Seção Outras Culturas */}
        <Collapsible open={expandedSections.outras}>
          <CollapsibleTrigger
            className="flex justify-between items-center w-full p-4 hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("outras")}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                OUTRAS CULTURAS
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.outras ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 bg-muted/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(mockPriceData.prices.others).map(
                  ([key, data]) => {
                    // Formatando o nome da cultura para exibição
                    const displayNames: Record<string, string> = {
                      millet: "Milheto (R$/Saca)",
                      sorghum: "Sorgo (R$/Saca)",
                      beanGurutuba: "Feijão Gurutuba (R$/Saca)",
                      beanCarioca: "Feijão Carioca (R$/Saca)",
                      castor: "Mamona (R$/Kg)",
                      pastureSeed: "Sem. Pastagem (R$/Kg)",
                      coffee: "Café (R$/Saca)",
                      wheat: "Trigo (R$/Saca)",
                    };

                    return (
                      <div key={key} className="border rounded p-3">
                        <div className="text-xs text-muted-foreground">
                          {displayNames[key]}
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-bold">
                            {data.value.toFixed(2)}
                          </span>
                          <span
                            className={
                              data.change >= 0
                                ? "text-green-500 text-xs"
                                : "text-red-500 text-xs"
                            }
                          >
                            {data.change >= 0 ? "+" : ""}
                            {(data.change * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
