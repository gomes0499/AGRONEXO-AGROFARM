"use client";

import { useState } from "react";
import { Settings, Palette, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  useChartColors,
  DEFAULT_CHART_COLORS,
} from "@/contexts/chart-colors-context";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { updateOrganizationChartColors } from "@/lib/actions/organization-chart-colors-actions";
import { ChartColors } from "@/lib/constants/chart-colors";
import { useOrganization } from "@/components/auth/organization-provider";
import { Tabs, TabsContent, TabsList, TabsTriggerPrimary } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Paletas de cores predefinidas
const colorPalettes = {
  default: {
    name: "Padrão",
    colors: DEFAULT_CHART_COLORS,
  },
  corporate: {
    name: "Corporativo",
    colors: {
      color1: "#1e40af", // Azul escuro
      color2: "#3b82f6", // Azul
      color3: "#60a5fa", // Azul claro
      color4: "#93c5fd", // Azul mais claro
      color5: "#dbeafe", // Azul muito claro
      color6: "#eff6ff", // Azul quase branco
    },
  },
  nature: {
    name: "Natureza",
    colors: {
      color1: "#166534", // Verde escuro
      color2: "#16a34a", // Verde
      color3: "#22c55e", // Verde claro
      color4: "#4ade80", // Verde mais claro
      color5: "#86efac", // Verde muito claro
      color6: "#bbf7d0", // Verde quase branco
    },
  },
  sunset: {
    name: "Pôr do Sol",
    colors: {
      color1: "#dc2626", // Vermelho
      color2: "#f97316", // Laranja
      color3: "#fbbf24", // Amarelo
      color4: "#fde047", // Amarelo claro
      color5: "#fef3c7", // Amarelo muito claro
      color6: "#fffbeb", // Amarelo quase branco
    },
  },
  ocean: {
    name: "Oceano",
    colors: {
      color1: "#0891b2", // Ciano escuro
      color2: "#06b6d4", // Ciano
      color3: "#22d3ee", // Ciano claro
      color4: "#67e8f9", // Ciano mais claro
      color5: "#a5f3fc", // Ciano muito claro
      color6: "#cffafe", // Ciano quase branco
    },
  },
  purple: {
    name: "Roxo Moderno",
    colors: {
      color1: "#7c3aed", // Roxo
      color2: "#8b5cf6", // Roxo claro
      color3: "#a78bfa", // Roxo mais claro
      color4: "#c4b5fd", // Roxo muito claro
      color5: "#ddd6fe", // Roxo quase branco
      color6: "#ede9fe", // Roxo branquinho
    },
  },
};

export function ChartColorsConfig() {
  const { colors, organizationColors, loadOrganizationColors } = useChartColors();
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [localColors, setLocalColors] = useState(colors);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<string | null>("default");

  const colorLabels = {
    color1: "Cor 1 - Principal",
    color2: "Cor 2 - Secundária",
    color3: "Cor 3 - Terciária",
    color4: "Cor 4 - Quaternária",
    color5: "Cor 5 - Quinária",
    color6: "Cor 6 - Senária",
  };

  const handleColorChange = (
    colorKey: keyof typeof DEFAULT_CHART_COLORS,
    value: string
  ) => {
    setLocalColors((prev) => ({
      ...prev,
      [colorKey]: value,
    }));
    setSelectedPalette(null); // Limpa a seleção de paleta quando o usuário edita manualmente
  };

  const applyPalette = (paletteKey: string) => {
    const palette = colorPalettes[paletteKey as keyof typeof colorPalettes];
    if (palette) {
      setLocalColors(palette.colors);
      setSelectedPalette(paletteKey);
    }
  };

  const handleSave = async () => {
    if (!organization?.id) {
      toast.error("Organização não encontrada");
      return;
    }

    setIsSaving(true);
    try {
      // Mapear as cores antigas para o novo formato
      const chartColors: Partial<ChartColors> = {
        primary: localColors.color1,
        secondary: localColors.color2,
        tertiary: localColors.color3,
        quaternary: localColors.color4,
        quinary: localColors.color5,
        senary: localColors.color6,
      };

      // Salvar no banco de dados
      await updateOrganizationChartColors(organization.id, chartColors);
      
      // Recarregar as cores da organização
      await loadOrganizationColors(organization.id);
      
      // Aguardar um pouco para garantir que as cores foram propagadas
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.success("Cores dos gráficos atualizadas!");
      setOpen(false);
      
      // Forçar recarga da página para garantir que as cores são aplicadas
      window.location.reload();
    } catch (error) {
      toast.error("Erro ao salvar cores");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!organization?.id) {
      toast.error("Organização não encontrada");
      return;
    }

    setIsSaving(true);
    try {
      // Resetar para as cores padrão
      const defaultColors: Partial<ChartColors> = {
        primary: DEFAULT_CHART_COLORS.color1,
        secondary: DEFAULT_CHART_COLORS.color2,
        tertiary: DEFAULT_CHART_COLORS.color3,
        quaternary: DEFAULT_CHART_COLORS.color4,
        quinary: DEFAULT_CHART_COLORS.color5,
        senary: DEFAULT_CHART_COLORS.color6,
      };

      await updateOrganizationChartColors(organization.id, defaultColors);
      await loadOrganizationColors(organization.id);
      
      setLocalColors(DEFAULT_CHART_COLORS);
      
      // Aguardar um pouco para garantir que as cores foram propagadas
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.info("Cores restauradas para o padrão");
      
      // Forçar recarga da página para garantir que as cores são aplicadas
      window.location.reload();
    } catch (error) {
      toast.error("Erro ao restaurar cores");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalColors(colors);
    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          // Ao abrir, sincronizar com as cores atuais
          setLocalColors(colors);
          // Verificar se as cores atuais correspondem a alguma paleta
          const matchingPalette = Object.entries(colorPalettes).find(([key, palette]) => {
            return Object.entries(palette.colors).every(([colorKey, colorValue]) => {
              return colors[colorKey as keyof typeof colors] === colorValue;
            });
          });
          setSelectedPalette(matchingPalette ? matchingPalette[0] : null);
        } else {
          // Ao fechar, resetar para as cores atuais
          setLocalColors(colors);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Configurar cores dos gráficos"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <div className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cores dos Gráficos
            </SheetTitle>
            <SheetDescription>
              Personalize as cores utilizadas nos gráficos da visão geral
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6">
            <Tabs defaultValue="palettes" className="w-full">
              <TabsList>
                <TabsTriggerPrimary value="palettes">Paletas</TabsTriggerPrimary>
                <TabsTriggerPrimary value="custom">Personalizar</TabsTriggerPrimary>
              </TabsList>
              
              <TabsContent value="palettes" className="space-y-4 mt-4">
                {/* Preview */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Visualização Atual</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(localColors).map(([key, color]) => (
                        <div
                          key={key}
                          className="h-10 rounded flex items-center justify-center text-white text-xs font-medium shadow-sm"
                          style={{ backgroundColor: color }}
                        >
                          {key.replace("color", "")}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Paletas predefinidas */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Escolha uma paleta</Label>
                  <div className="grid gap-3">
                    {Object.entries(colorPalettes).map(([key, palette]) => (
                      <button
                        key={key}
                        onClick={() => applyPalette(key)}
                        className={cn(
                          "relative w-full rounded-lg border p-3 transition-all hover:shadow-md",
                          selectedPalette === key
                            ? "border-primary ring-2 ring-primary ring-opacity-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{palette.name}</span>
                          {selectedPalette === key && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {Object.values(palette.colors).map((color, index) => (
                            <div
                              key={index}
                              className="h-8 rounded"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4 mt-4">
                {/* Preview */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Visualização</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(localColors).map(([key, color]) => (
                        <div
                          key={key}
                          className="h-10 rounded flex items-center justify-center text-white text-xs font-medium shadow-sm"
                          style={{ backgroundColor: color }}
                        >
                          {key.replace("color", "")}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Configuração manual de cores */}
                <div className="space-y-4">
                  {Object.entries(localColors).map(([key, color]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-sm font-medium">
                        {colorLabels[key as keyof typeof colorLabels]}
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative">
                          <Input
                            type="color"
                            id={`${key}-picker`}
                            value={color}
                            onChange={(e) =>
                              handleColorChange(
                                key as keyof typeof DEFAULT_CHART_COLORS,
                                e.target.value
                              )
                            }
                            className="w-14 h-10 p-1 cursor-pointer border-2 hover:border-primary transition-colors"
                          />
                        </div>
                        <Input
                          type="text"
                          id={key}
                          value={color.toUpperCase()}
                          onChange={(e) =>
                            handleColorChange(
                              key as keyof typeof DEFAULT_CHART_COLORS,
                              e.target.value
                            )
                          }
                          placeholder="#000000"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <SheetFooter className="border-t pt-4 gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={handleCancel} disabled={isSaving} size="sm">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
