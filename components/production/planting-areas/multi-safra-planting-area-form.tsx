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
  type MultiSafraPlantingAreaFormValues,
  multiSafraPlantingAreaFormSchema,
  type Culture,
  type System,
  type Cycle,
  type Harvest,
} from "@/schemas/production";
import { createMultiSafraPlantingAreas } from "@/lib/actions/production-actions";
import { SafraAreaEditor } from "../common/safra-area-editor";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface MultiSafraPlantingAreaFormProps {
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  harvests: Harvest[];
  organizationId: string;
  onSuccess?: (areas: PlantingArea[]) => void;
  onCancel?: () => void;
}

export function MultiSafraPlantingAreaForm({
  properties,
  cultures,
  systems,
  cycles,
  harvests,
  organizationId,
  onSuccess,
  onCancel,
}: MultiSafraPlantingAreaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm<MultiSafraPlantingAreaFormValues>({
    resolver: zodResolver(multiSafraPlantingAreaFormSchema),
    defaultValues: {
      propriedade_id: "",
      cultura_id: "",
      sistema_id: "",
      ciclo_id: "",
      areas_por_safra: {},
    },
  });

  const onSubmit = async (values: MultiSafraPlantingAreaFormValues) => {
    setIsSubmitting(true);
    try {
      // Se selecionou "all", passar undefined para propriedade_id
      const propriedadeId = values.propriedade_id === "all" ? undefined : values.propriedade_id;
      
      const formData = {
        ...values,
        propriedade_id: propriedadeId || '',
      };
      
      const newAreas = await createMultiSafraPlantingAreas(
        organizationId,
        formData
      );
      toast.success(
        values.propriedade_id === "all"
          ? `${Object.keys(values.areas_por_safra).length} área(s) de plantio criada(s) para todas as propriedades!`
          : `${Object.keys(values.areas_por_safra).length} área(s) de plantio criada(s) com sucesso!`
      );

      if (onSuccess) {
        // Convert string dates to Date objects to match expected type
        onSuccess([{
          ...newAreas,
          created_at: newAreas.created_at ? new Date(newAreas.created_at) : undefined,
          updated_at: newAreas.updated_at ? new Date(newAreas.updated_at) : undefined,
        }]);
      }
    } catch (error) {
      console.error("Erro ao criar áreas de plantio:", error);
      toast.error("Ocorreu um erro ao criar as áreas de plantio.");
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

        {/* Safra Area Editor */}
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
            {isSubmitting ? "Salvando..." : "Salvar Áreas"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
