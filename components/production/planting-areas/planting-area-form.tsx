"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  CalendarIcon,
  Leaf,
  Settings,
  CropIcon,
  Home,
  Ruler,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  type PlantingArea,
  type PlantingAreaFormValues,
  plantingAreaFormSchema,
  type Culture,
  type System,
  type Cycle,
  type Harvest,
} from "@/schemas/production";
import {
  createPlantingArea,
  updatePlantingArea,
} from "@/lib/actions/production-actions";

// Define interface for the property entity
// Use the same Property type as in production-actions.ts
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface PlantingAreaFormProps {
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  harvests: Harvest[];
  organizationId: string;
  plantingArea?: PlantingArea | null;
  onSuccess?: (plantingArea: PlantingArea) => void;
  onCancel?: () => void;
}

// Conversões de área
const AREA_CONVERSIONS = [
  { unit: "hectares", shortUnit: "ha", factor: 1 },
  { unit: "alqueires paulistas", shortUnit: "alq", factor: 0.413223 },
  { unit: "metros quadrados", shortUnit: "m²", factor: 10000 },
  { unit: "acres", shortUnit: "ac", factor: 2.47105 },
];

export function PlantingAreaForm({
  properties,
  cultures,
  systems,
  cycles,
  harvests,
  organizationId,
  plantingArea = null,
  onSuccess,
  onCancel,
}: PlantingAreaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [areaConversions, setAreaConversions] = useState<
    Record<string, number>
  >({});
  const [selectedSafraId, setSelectedSafraId] = useState<string>("");
  const [currentArea, setCurrentArea] = useState<number>(0);
  const isEditing = !!plantingArea?.id;

  // Initialize form with correct defaultValues based on the updated schema
  const form = useForm<PlantingAreaFormValues>({
    resolver: zodResolver(plantingAreaFormSchema),
    defaultValues: {
      propriedade_id: plantingArea?.propriedade_id || "",
      cultura_id: plantingArea?.cultura_id || "",
      sistema_id: plantingArea?.sistema_id || "",
      ciclo_id: plantingArea?.ciclo_id || "",
      areas_por_safra: plantingArea?.areas_por_safra || {},
      observacoes: plantingArea?.observacoes,
    },
  });

  // Update area conversions when current area changes
  useEffect(() => {
    calculateAreaConversions(currentArea);
  }, [currentArea]);

  // Initialize area conversions if editing an existing area
  useEffect(() => {
    if (isEditing && selectedSafraId && plantingArea?.areas_por_safra) {
      const area = plantingArea.areas_por_safra[selectedSafraId] || 0;
      setCurrentArea(area);
      calculateAreaConversions(area);
    }
  }, [isEditing, selectedSafraId, plantingArea]);

  // Calcular conversões de área
  const calculateAreaConversions = (areaInHectares: number) => {
    if (!areaInHectares) return;

    const conversions: Record<string, number> = {};
    AREA_CONVERSIONS.forEach((conversion) => {
      if (conversion.shortUnit !== "ha") {
        conversions[conversion.shortUnit] = areaInHectares * conversion.factor;
      }
    });

    setAreaConversions(conversions);
  };

  // Encontrar detalhes dos itens selecionados
  const selectedProperty = properties.find(
    (p) => p.id === form.watch("propriedade_id")
  );
  const selectedCulture = cultures.find(
    (c) => c.id === form.watch("cultura_id")
  );
  const selectedSystem = systems.find((s) => s.id === form.watch("sistema_id"));
  const selectedCycle = cycles.find((c) => c.id === form.watch("ciclo_id"));
  const selectedHarvest = harvests.find((h) => h.id === selectedSafraId);
  
  // Helper functions for managing areas per safra
  const updateAreaForSafra = (safraId: string, area: number) => {
    const currentAreas = form.getValues("areas_por_safra") || {};
    form.setValue("areas_por_safra", {
      ...currentAreas,
      [safraId]: area,
    });
  };

  const onSubmit = async (values: PlantingAreaFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Ensure at least one area is defined for a safra
      const areasPerSafra = values.areas_por_safra;
      if (Object.keys(areasPerSafra).length === 0) {
        toast.error("Adicione pelo menos uma área por safra");
        return;
      }

      if (isEditing) {
        // Atualizar área existente
        const updatedArea = await updatePlantingArea(
          plantingArea?.id || "",
          {
            areas_por_safra: values.areas_por_safra,
            observacoes: values.observacoes
          }
        );
        toast.success("Área de plantio atualizada com sucesso!");
        onSuccess?.(updatedArea);
      } else {
        // Criar nova área
        // Se selecionou "all", passar undefined para propriedade_id
        const propriedadeId = values.propriedade_id === "all" ? undefined : values.propriedade_id;
        
        const newArea = await createPlantingArea({
          organizacao_id: organizationId,
          propriedade_id: propriedadeId,
          cultura_id: values.cultura_id,
          sistema_id: values.sistema_id,
          ciclo_id: values.ciclo_id,
          areas_por_safra: values.areas_por_safra,
          observacoes: values.observacoes
        });
        toast.success(
          values.propriedade_id === "all" 
            ? "Área de plantio criada para todas as propriedades!" 
            : "Área de plantio criada com sucesso!"
        );
        onSuccess?.(newArea);
      }
    } catch (error) {
      console.error("Erro ao salvar área de plantio:", error);
      toast.error("Ocorreu um erro ao salvar a área de plantio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Safra Selector */}
            <div>
              <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Safra
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  setSelectedSafraId(value);
                  // Get the area for this safra if it exists
                  const areas = form.getValues("areas_por_safra");
                  const area = areas[value] || 0;
                  setCurrentArea(area);
                }}
                value={selectedSafraId}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a safra" />
                </SelectTrigger>
                <SelectContent>
                  {harvests.map((harvest) => (
                    <SelectItem key={harvest.id} value={harvest.id || ""}>
                      {harvest.nome}
                      {harvest.ano_inicio === new Date().getFullYear() && (
                        <Badge variant="outline" className="ml-2 py-0 h-4">
                          Atual
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area input for selected safra */}
            <div>
              <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                Área (ha)
              </FormLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 10.5"
                value={currentArea || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : 0;
                  setCurrentArea(value);
                  if (selectedSafraId) {
                    updateAreaForSafra(selectedSafraId, value);
                  }
                }}
                disabled={isSubmitting || !selectedSafraId}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Areas per safra summary */}
          {Object.keys(form.watch("areas_por_safra")).length > 0 && (
            <div className="rounded-md border p-3 bg-muted/20">
              <h3 className="text-sm font-medium mb-2">Áreas por safra adicionadas:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(form.watch("areas_por_safra")).map(([safraId, area]) => {
                  const harvest = harvests.find(h => h.id === safraId);
                  if (!harvest || !area) return null;
                  
                  return (
                    <Badge key={safraId} variant="secondary" className="flex items-center gap-1">
                      <span>{harvest.nome}: {area} ha</span>
                      <button
                        type="button"
                        className="ml-1 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const updatedAreas = { ...form.getValues("areas_por_safra") };
                          delete updatedAreas[safraId];
                          form.setValue("areas_por_safra", updatedAreas);
                          if (selectedSafraId === safraId) {
                            setCurrentArea(0);
                          }
                        }}
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="propriedade_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  Propriedade
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a propriedade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">Todas as Propriedades</span>
                      </div>
                    </SelectItem>
                    <Separator className="my-1" />
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex flex-col">
                          <span>{property.nome}</span>
                          {property.cidade && property.estado && (
                            <span className="text-xs text-muted-foreground">
                              {property.cidade}/{property.estado}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                {field.value === "all" && (
                  <FormDescription className="text-xs mt-1">
                    A área total será consolidada para todas as propriedades
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cultura_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    Cultura
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a cultura" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cultures.map((culture) => (
                        <SelectItem key={culture.id} value={culture.id || ""}>
                          {culture.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sistema_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Sistema
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o sistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id || ""}>
                          {system.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="ciclo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <CropIcon className="h-4 w-4 text-muted-foreground" />
                  Ciclo
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o ciclo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id || ""}>
                        {cycle.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resumo e conversões */}
          {(selectedProperty || selectedCulture || selectedSystem || selectedCycle) && (
            <Card className="mt-2 bg-muted/30 border-muted">
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {selectedProperty && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Propriedade:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedProperty.nome}
                      </span>
                    </div>
                  )}

                  {selectedCulture && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Cultura:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedCulture.nome}
                      </span>
                    </div>
                  )}

                  {selectedSystem && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Sistema:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedSystem.nome}
                      </span>
                    </div>
                  )}

                  {selectedCycle && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Ciclo:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedCycle.nome}
                      </span>
                    </div>
                  )}
                </div>

                {currentArea > 0 && Object.keys(areaConversions).length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">
                      Conversões da área atual:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(areaConversions).map(
                        ([unit, value]) => (
                          <Badge
                            key={unit}
                            variant="outline"
                            className="font-normal"
                          >
                            {value.toFixed(2)} {unit}
                          </Badge>
                        )
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Observações field */}
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Observações
                </FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Observações adicionais (opcional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
