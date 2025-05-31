"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import {
  IndicatorThreshold,
  defaultIndicatorConfigs,
  indicatorDescriptions,
  indicatorLabels,
} from "@/schemas/indicators";
import { updateIndicatorConfig } from "@/lib/actions/indicator-actions";

type IndicatorConfigProps = {
  initialConfigs: Record<string, any>;
  singleIndicator?: string; // Se fornecido, apenas este indicador será exibido
};

export function IndicatorConfigPanel({
  initialConfigs,
  singleIndicator,
}: IndicatorConfigProps) {
  const [activeTab, setActiveTab] = useState(singleIndicator || "LIQUIDEZ");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<
    Record<string, IndicatorThreshold[]>
  >({});

  // Inicializar com os valores padrão ou configurações existentes
  useEffect(() => {
    const configs: Record<string, IndicatorThreshold[]> = {};

    // Para cada tipo de indicador, usar config inicial ou padrão
    Object.keys(defaultIndicatorConfigs).forEach((type) => {
      if (initialConfigs && initialConfigs[type]) {
        configs[type] = initialConfigs[type].thresholds;
      } else {
        // @ts-ignore - Tipo de índice é garantido
        configs[type] = defaultIndicatorConfigs[type];
      }
    });

    setCurrentConfig(configs);
  }, [initialConfigs]);

  // Função para atualizar um valor específico
  const updateThresholdValue = (
    indicatorType: string,
    levelIndex: number,
    field: "min" | "max",
    value: string
  ) => {
    if (!currentConfig[indicatorType]) return;

    const updatedThresholds = [...currentConfig[indicatorType]];
    const numValue =
      value === "" ? (field === "max" ? undefined : 0) : parseFloat(value);

    updatedThresholds[levelIndex] = {
      ...updatedThresholds[levelIndex],
      [field]: numValue,
    };

    setCurrentConfig({
      ...currentConfig,
      [indicatorType]: updatedThresholds,
    });
  };

  // Função para salvar as configurações
  const handleSave = async (indicatorType: string) => {
    try {
      setIsLoading(true);

      const thresholds = currentConfig[indicatorType];
      if (!thresholds) return;

      const result = await updateIndicatorConfig({
        indicatorType: indicatorType as any,
        thresholds,
      });

      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar configurações para um tipo de indicador
  const renderIndicatorConfig = (indicatorType: string) => {
    const thresholds = currentConfig[indicatorType];
    if (!thresholds) return null;

    return (
      <div className="space-y-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {thresholds.map((threshold, index) => (
            <Card
              key={index}
              className="border-l-4"
              style={{ borderLeftColor: threshold.color }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {threshold.level === "THRESHOLD"
                      ? "Limite Crítico"
                      : threshold.level}
                  </CardTitle>
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: threshold.color }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${indicatorType}-${index}-min`}>
                      Valor Mínimo
                    </Label>
                    <Input
                      id={`${indicatorType}-${index}-min`}
                      type="number"
                      value={threshold.min.toString()}
                      onChange={(e) =>
                        updateThresholdValue(
                          indicatorType,
                          index,
                          "min",
                          e.target.value
                        )
                      }
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${indicatorType}-${index}-max`}>
                      Valor Máximo
                    </Label>
                    <Input
                      id={`${indicatorType}-${index}-max`}
                      type="number"
                      value={threshold.max?.toString() || ""}
                      onChange={(e) =>
                        updateThresholdValue(
                          indicatorType,
                          index,
                          "max",
                          e.target.value
                        )
                      }
                      step="0.01"
                      placeholder={threshold.max === undefined ? "∞" : ""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleSave(indicatorType)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Renderizar apenas um indicador específico ou todos
  const indicatorTypes = singleIndicator
    ? [singleIndicator]
    : Object.keys(indicatorLabels);

  return (
    <div className="w-full">
      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={setActiveTab}
      >
        {!singleIndicator && (
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="LIQUIDEZ">Liquidez</TabsTrigger>
            <TabsTrigger value="DIVIDA_EBITDA">Dívida/EBITDA</TabsTrigger>
            <TabsTrigger value="DIVIDA_FATURAMENTO">
              Dívida/Faturamento
            </TabsTrigger>
            <TabsTrigger value="DIVIDA_PL">Dívida/PL</TabsTrigger>
            <TabsTrigger value="LTV">LTV</TabsTrigger>
          </TabsList>
        )}

        {indicatorTypes.map((indicatorType) => (
          <TabsContent
            key={indicatorType}
            value={indicatorType}
            className="mt-4 w-full max-w-5xl"
          >
            <div className="mb-6">
              <h3 className="text-lg font-medium">
                {indicatorLabels[indicatorType as keyof typeof indicatorLabels]}
              </h3>
              <p className="text-muted-foreground mt-1">
                {
                  indicatorDescriptions[
                    indicatorType as keyof typeof indicatorDescriptions
                  ]
                }
              </p>
            </div>

            <Separator className="my-4" />

            {renderIndicatorConfig(indicatorType)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
