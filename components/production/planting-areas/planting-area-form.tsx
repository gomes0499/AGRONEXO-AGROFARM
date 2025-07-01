"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Leaf, Settings, CropIcon, Home, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SafraAreaEditor } from "../common/safra-area-editor";

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
  const isEditing = !!plantingArea?.id;

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

  const onSubmit = async (values: PlantingAreaFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
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
            ? `${Object.keys(values.areas_por_safra).length} área(s) de plantio criada(s) para todas as propriedades!`
            : `${Object.keys(values.areas_por_safra).length} área(s) de plantio criada(s) com sucesso!`
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
        {/* Basic Configuration */}
        <div className="space-y-4">
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
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
        </div>

        <Separator />

        {/* Area Editor */}
        <FormField
          control={form.control}
          name="areas_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraAreaEditor
                label="Áreas por Safra"
                description="Defina as áreas plantadas para cada safra"
                values={field.value}
                onChange={field.onChange}
                safras={harvests}
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Áreas" : "Salvar Áreas"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
