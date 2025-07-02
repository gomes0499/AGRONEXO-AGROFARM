"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, Pencil, Map } from "lucide-react";
import { toast } from "sonner";
import { updatePlantingArea } from "@/lib/actions/production-actions";
import { type PlantingArea as BasePlantingArea, type Harvest, type Culture, type System, type Cycle } from "@/schemas/production";
import { formatArea } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";

// Extended PlantingArea type with related entities
interface PlantingArea extends BasePlantingArea {
  propriedades?: {
    nome: string;
  };
  culturas?: {
    nome: string;
  };
  sistemas?: {
    nome: string;
  };
  ciclos?: {
    nome: string;
  };
}

interface PlantingAreaEditorProps {
  plantingArea: PlantingArea;
  harvests: Harvest[];
  onSuccess?: (plantingArea: PlantingArea) => void;
}

export function PlantingAreaEditor({ plantingArea, harvests, onSuccess }: PlantingAreaEditorProps) {
  const [editingState, setEditingState] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize editing state
  useEffect(() => {
    const newEditingState: Record<string, number> = {};
    
    // Populate with all available harvests, even those without areas yet
    harvests.forEach(harvest => {
      const harvestId = harvest.id || "";
      newEditingState[harvestId] = plantingArea.areas_por_safra?.[harvestId] || 0;
    });
    
    setEditingState(newEditingState);
  }, [plantingArea, harvests]);

  // Format number for display
  const formatNumber = (value: number) => {
    if (value === 0) return "-";
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handle input change for area fields
  const handleInputChange = (harvestId: string, value: string) => {
    const numericValue = value ? parseFloat(value) : 0;
    setEditingState((prev) => ({
      ...prev,
      [harvestId]: numericValue,
    }));
  };

  // Save all changes
  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Create updated areas object, removing zeros
      const updatedAreas = { ...editingState };
      
      // Remove areas with value 0
      Object.keys(updatedAreas).forEach(key => {
        if (updatedAreas[key] === 0) {
          delete updatedAreas[key];
        }
      });

      // Check if there are any areas left
      if (Object.keys(updatedAreas).length === 0) {
        toast.error("Adicione pelo menos uma área com valor maior que zero");
        setIsLoading(false);
        return;
      }

      // Update the planting area
      const updatedArea = await updatePlantingArea(plantingArea.id!, {
        areas_por_safra: updatedAreas,
        observacoes: plantingArea.observacoes,
      }) as PlantingArea;

      // Update the local state with the server response
      plantingArea.areas_por_safra = updatedArea.areas_por_safra;
      
      toast.success("Áreas atualizadas com sucesso!");
      
      if (onSuccess) {
        onSuccess(updatedArea);
      }
    } catch (error: any) {
      console.error("Erro ao salvar áreas:", error);
      toast.error(`Erro ao salvar: ${error.message || "Falha na atualização"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total area
  const totalArea = Object.values(plantingArea.areas_por_safra || {}).reduce(
    (sum, area) => sum + (area || 0), 
    0
  );

  // Get property, culture, system and cycle information
  const propertyName = plantingArea.propriedades?.nome || "Propriedade não encontrada";
  const cultureName = plantingArea.culturas?.nome || "Cultura não encontrada";
  const systemName = plantingArea.sistemas?.nome || "Sistema não encontrado";
  const cycleName = plantingArea.ciclos?.nome || "Ciclo não encontrado";

  // No filtering - show all harvests sorted by year
  const filteredHarvests = harvests
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  return (
    <Card className="w-full shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Map className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Áreas por Safra</CardTitle>
            <CardDescription className="text-white/80">
              Edite as áreas por safra para esta combinação de propriedade, cultura, sistema e ciclo
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="mt-4">
        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-background border-primary text-primary px-3 py-1">
              Propriedade: {propertyName}
            </Badge>
            <Badge variant="outline" className="bg-background border-primary text-primary px-3 py-1">
              Cultura: {cultureName}
            </Badge>
            <Badge variant="outline" className="bg-background border-primary text-primary px-3 py-1">
              Sistema: {systemName}
            </Badge>
            <Badge variant="outline" className="bg-background border-primary text-primary px-3 py-1">
              Ciclo: {cycleName}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Área total: <span className="font-semibold">{formatArea(totalArea)}</span>
          </p>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground rounded-tl-md w-[200px] bg-primary">Safra</TableHead>
                  <TableHead className="font-semibold text-primary-foreground bg-primary">Período</TableHead>
                  <TableHead className="font-semibold text-primary-foreground bg-primary">Área (ha)</TableHead>
                  <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[60px] bg-primary">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHarvests.map((harvest) => {
                  const harvestId = harvest.id || "";
                  const areaValue = plantingArea.areas_por_safra?.[harvestId] || 0;
                  
                  return (
                    <TableRow key={harvestId}>
                      <TableCell className="font-medium">
                        {harvest.nome}
                      </TableCell>
                      <TableCell>{harvest.ano_inicio}/{harvest.ano_fim}</TableCell>
                      <TableCell className={areaValue > 0 ? "font-medium" : "text-muted-foreground"}>
                        {formatNumber(areaValue)}
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-auto p-4">
                            <div className="grid gap-4 w-[800px] max-h-[500px] overflow-y-auto">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">
                                  Editar Áreas - {propertyName} ({cultureName}/{systemName}/{cycleName})
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Atualize as áreas plantadas para os anos seguintes.
                                </p>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                {filteredHarvests.map((safra) => {
                                  const safraId = safra.id || "";
                                  return (
                                    <div key={safraId} className="space-y-2">
                                      <Label htmlFor={`area-${safraId}`}>
                                        {safra.nome} ({safra.ano_inicio}/{safra.ano_fim})
                                      </Label>
                                      <Input
                                        id={`area-${safraId}`}
                                        type="number"
                                        step="0.01"
                                        value={editingState[safraId] || ""}
                                        onChange={(e) => handleInputChange(safraId, e.target.value)}
                                        placeholder="0.00"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <Button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                  </>
                                )}
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}