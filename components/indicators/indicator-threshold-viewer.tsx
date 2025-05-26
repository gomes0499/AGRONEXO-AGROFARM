"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { defaultIndicatorConfigs, indicatorLabels, indicatorDescriptions } from "@/schemas/indicators";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateIndicatorConfig } from "@/lib/actions/indicator-actions";
import { toast } from "sonner";
import { Loader2, Pencil, Save, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type IndicatorThresholdViewerProps = {
  indicatorConfigs: Record<string, any>;
};

export function IndicatorThresholdViewer({
  indicatorConfigs,
}: IndicatorThresholdViewerProps) {
  const [editingState, setEditingState] = useState<
    Record<string, Record<number, { min: string; max: string }>>
  >({});
  const [isLoading, setIsLoading] = useState<
    Record<string, Record<number, boolean>>
  >({});

  // Função para obter os thresholds de um indicador
  const getThresholds = (indicatorType: string) => {
    return (
      indicatorConfigs[indicatorType]?.thresholds ||
      defaultIndicatorConfigs[
        indicatorType as keyof typeof defaultIndicatorConfigs
      ]
    );
  };

  // Função para formatar o valor máximo (pode ser undefined)
  const formatMax = (max: number | undefined) => {
    return max === undefined ? "∞" : max.toFixed(2);
  };

  // Inicializa o estado de edição para um threshold
  const initThresholdEditState = (
    indicatorType: string,
    index: number,
    threshold: any
  ) => {
    if (!editingState[indicatorType]) {
      setEditingState((prev) => ({
        ...prev,
        [indicatorType]: {},
      }));
    }

    if (!editingState[indicatorType]?.[index]) {
      setEditingState((prev) => ({
        ...prev,
        [indicatorType]: {
          ...(prev[indicatorType] || {}),
          [index]: {
            min: threshold.min.toString(),
            max: threshold.max?.toString() || "",
          },
        },
      }));
    }

    if (!isLoading[indicatorType]) {
      setIsLoading((prev) => ({
        ...prev,
        [indicatorType]: {},
      }));
    }
  };

  // Atualiza o estado de edição
  const handleInputChange = (
    indicatorType: string,
    index: number,
    field: "min" | "max",
    value: string
  ) => {
    setEditingState((prev) => ({
      ...prev,
      [indicatorType]: {
        ...(prev[indicatorType] || {}),
        [index]: {
          ...(prev[indicatorType]?.[index] || { min: "", max: "" }),
          [field]: value,
        },
      },
    }));
  };

  // Salva as alterações
  const handleSave = async (
    indicatorType: string,
    index: number,
    threshold: any
  ) => {
    try {
      setIsLoading((prev) => ({
        ...prev,
        [indicatorType]: {
          ...(prev[indicatorType] || {}),
          [index]: true,
        },
      }));

      const editValues = editingState[indicatorType]?.[index];
      if (!editValues) return;

      // Obter todos os thresholds
      const thresholds = [...getThresholds(indicatorType)];

      // Atualizar o threshold específico
      thresholds[index] = {
        ...threshold,
        min: parseFloat(editValues.min),
        max: editValues.max === "" ? undefined : parseFloat(editValues.max),
      };

      // Salvar no banco de dados
      await updateIndicatorConfig({
        indicatorType: indicatorType as any,
        thresholds,
      });

      toast.success("Configuração atualizada com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading((prev) => ({
        ...prev,
        [indicatorType]: {
          ...(prev[indicatorType] || {}),
          [index]: false,
        },
      }));
    }
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Limiares de Indicadores</CardTitle>
            <CardDescription className="text-white/80">
              Configure os limiares para análise dos indicadores financeiros
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="mt-4">
        <div className="rounded-md border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {Object.entries(indicatorLabels).map(([indicatorType, label]) => (
              <div key={indicatorType} className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {indicatorDescriptions[indicatorType as keyof typeof indicatorDescriptions]}
                  </p>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary">
                        <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nível</TableHead>
                        <TableHead className="font-semibold text-primary-foreground">Mínimo</TableHead>
                        <TableHead className="font-semibold text-primary-foreground">Máximo</TableHead>
                        <TableHead className="font-semibold text-primary-foreground rounded-tr-md">Cor</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {getThresholds(indicatorType).map(
                      (threshold: any, idx: number) => {
                        // Inicializar o estado de edição para este threshold
                        initThresholdEditState(indicatorType, idx, threshold);

                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: `${threshold.color}20`,
                                  color: threshold.color,
                                  borderColor: threshold.color,
                                }}
                              >
                                {threshold.level === "THRESHOLD"
                                  ? "LIMITE CRÍTICO"
                                  : threshold.level}
                              </Badge>
                            </TableCell>
                            <TableCell>{threshold.min.toFixed(2)}</TableCell>
                            <TableCell>{formatMax(threshold.max)}</TableCell>
                            <TableCell>
                              <div className="flex justify-between items-center">
                                <div
                                  className="w-6 h-6 rounded-full border"
                                  style={{ backgroundColor: threshold.color }}
                                />
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="ml-2 h-8 w-8"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-auto p-4">
                                    <div className="grid grid-cols-1 gap-3">
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`${indicatorType}-${idx}-min`}
                                          >
                                            Mínimo
                                          </Label>
                                          <Input
                                            id={`${indicatorType}-${idx}-min`}
                                            type="number"
                                            value={
                                              editingState[indicatorType]?.[idx]
                                                ?.min || threshold.min.toString()
                                            }
                                            onChange={(e) =>
                                              handleInputChange(
                                                indicatorType,
                                                idx,
                                                "min",
                                                e.target.value
                                              )
                                            }
                                            step="0.01"
                                            className="w-24"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`${indicatorType}-${idx}-max`}
                                          >
                                            Máximo
                                          </Label>
                                          <Input
                                            id={`${indicatorType}-${idx}-max`}
                                            type="number"
                                            value={
                                              editingState[indicatorType]?.[idx]
                                                ?.max ??
                                              (threshold.max?.toString() || "")
                                            }
                                            onChange={(e) =>
                                              handleInputChange(
                                                indicatorType,
                                                idx,
                                                "max",
                                                e.target.value
                                              )
                                            }
                                            step="0.01"
                                            placeholder="∞"
                                            className="w-24"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="opacity-0">Ações</Label>
                                          <Button
                                            onClick={() =>
                                              handleSave(
                                                indicatorType,
                                                idx,
                                                threshold
                                              )
                                            }
                                            disabled={isLoading[indicatorType]?.[idx]}
                                            size="sm"
                                            className="w-full"
                                          >
                                            {isLoading[indicatorType]?.[idx] ? (
                                              <>
                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                Salvar
                                              </>
                                            ) : (
                                              <>
                                                <Save className="mr-1 h-3 w-3" />
                                                Salvar
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
