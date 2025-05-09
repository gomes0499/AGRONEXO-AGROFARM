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
import { formatArea, parseFormattedNumber } from "@/lib/utils/formatters";

// Define interface for the property entity
interface Property {
  id: string;
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
  const isEditing = !!plantingArea?.id;

  const form = useForm<PlantingAreaFormValues>({
    resolver: zodResolver(plantingAreaFormSchema),
    defaultValues: {
      propriedade_id: plantingArea?.propriedade_id || "",
      cultura_id: plantingArea?.cultura_id || "",
      sistema_id: plantingArea?.sistema_id || "",
      ciclo_id: plantingArea?.ciclo_id || "",
      safra_id: plantingArea?.safra_id || "",
      area: plantingArea?.area || 0,
    },
  });

  // Calcular conversões de área quando o valor mudar
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "area") {
        calculateAreaConversions(value.area || 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Inicializar conversões de área
  useEffect(() => {
    calculateAreaConversions(form.getValues("area"));
  }, [form]);

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
  const selectedHarvest = harvests.find((h) => h.id === form.watch("safra_id"));

  const onSubmit = async (values: PlantingAreaFormValues) => {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        // Atualizar área existente
        const updatedArea = await updatePlantingArea(
          plantingArea.id || "",
          values
        );
        toast.success("Área de plantio atualizada com sucesso!");
        onSuccess?.(updatedArea);
      } else {
        // Criar nova área
        const newArea = await createPlantingArea(organizationId, values);
        toast.success("Área de plantio criada com sucesso!");
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
          <FormField
            control={form.control}
            name="safra_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  Safra
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a safra" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {harvests.map((harvest) => (
                      <SelectItem key={harvest.id} value={harvest.id || ""}>
                        {harvest.nome}

                        <Badge variant="outline" className="ml-2 py-0 h-4">
                          Ativa
                        </Badge>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    Área (ha)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Digite a área em hectares"
                        {...field}
                        onChange={(e) => {
                          // Limpa a formatação e pega apenas números e vírgulas
                          const cleanValue = e.target.value.replace(
                            /[^\d.,]/g,
                            ""
                          );
                          // Converte para número para armazenar no form
                          const numericValue = parseFormattedNumber(cleanValue);
                          field.onChange(numericValue);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          // Se tiver um valor, formata ele ao sair do campo
                          if (field.value) {
                            const formattedValue = formatArea(field.value);
                            e.target.value = formattedValue;
                          }
                        }}
                        onFocus={(e) => {
                          // Quando ganhar foco, mostra apenas o número sem formatação
                          if (field.value) {
                            e.target.value = field.value.toString();
                          }
                        }}
                        value={
                          field.value !== undefined && field.value !== null
                            ? formatArea(field.value)
                            : ""
                        }
                        disabled={isSubmitting}
                        className="w-full"
                      />
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Resumo e conversões */}
          {(selectedProperty ||
            selectedCulture ||
            selectedSystem ||
            selectedCycle ||
            selectedHarvest ||
            form.watch("area") > 0) && (
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

                  {selectedHarvest && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Safra:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedHarvest.nome}
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

                {form.watch("area") > 0 &&
                  Object.keys(areaConversions).length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        Equivalente a:
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
