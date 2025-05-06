"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import {
  PlantingArea,
  PlantingAreaFormValues,
  plantingAreaFormSchema,
  Culture,
  System,
  Cycle,
  Harvest,
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
      safra_id: plantingArea?.safra_id || "",
      area: plantingArea?.area || 0,
    },
  });

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="safra_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Safra</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a safra" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {harvests.map((harvest) => (
                    <SelectItem key={harvest.id} value={harvest.id || ""}>
                      {harvest.nome}
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
              <FormLabel>Propriedade</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a propriedade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.nome} ({property.cidade}/{property.estado})
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
                <FormLabel>Cultura</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
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
                <FormLabel>Sistema</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
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
                <FormLabel>Ciclo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
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
                <FormLabel>Área (ha)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Digite a área em hectares"
                    {...field}
                    onChange={(e) => {
                      // Limpa a formatação e pega apenas números e vírgulas
                      const cleanValue = e.target.value.replace(/[^\d.,]/g, "");
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
                  />
                </FormControl>
                <FormDescription>Em hectares</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
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
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
