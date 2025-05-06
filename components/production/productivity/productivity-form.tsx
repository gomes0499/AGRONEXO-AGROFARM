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
  Productivity,
  ProductivityFormValues,
  productivityFormSchema,
  productivityUnitEnum,
  Culture,
  System,
  Harvest,
} from "@/schemas/production";
import {
  createProductivity,
  updateProductivity,
} from "@/lib/actions/production-actions";
import { parseFormattedNumber } from "@/lib/utils/formatters";

interface ProductivityFormProps {
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  organizationId: string;
  productivity?: Productivity | null;
  onSuccess?: (productivity: Productivity) => void;
  onCancel?: () => void;
}

export function ProductivityForm({
  cultures,
  systems,
  harvests,
  organizationId,
  productivity = null,
  onSuccess,
  onCancel,
}: ProductivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isEditing = !!productivity?.id;

  const form = useForm<ProductivityFormValues>({
    resolver: zodResolver(productivityFormSchema),
    defaultValues: {
      cultura_id: productivity?.cultura_id || "",
      sistema_id: productivity?.sistema_id || "",
      safra_id: productivity?.safra_id || "",
      produtividade: productivity?.produtividade || 0,
      unidade: (productivity?.unidade as any) || "sc/ha",
    },
  });

  const onSubmit = async (values: ProductivityFormValues) => {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        // Atualizar item existente
        const updatedItem = await updateProductivity(
          productivity.id || "",
          values
        );
        toast.success("Produtividade atualizada com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Criar novo item
        const newItem = await createProductivity(organizationId, values);
        toast.success("Produtividade criada com sucesso!");
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar produtividade:", error);
      toast.error("Ocorreu um erro ao salvar a produtividade.");
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
            name="produtividade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produtividade</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Digite a produtividade"
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
                    }}
                    onFocus={(e) => {
                      // Quando ganhar foco, mostra apenas o número sem formatação
                      if (field.value) {
                        e.target.value = field.value.toString();
                      }
                    }}
                    value={
                      field.value !== undefined && field.value !== null
                        ? field.value
                        : ""
                    }
                  />
                </FormControl>
                <FormDescription>
                  Valor da produtividade na unidade selecionada
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sc/ha">
                      Sacas por Hectare (sc/ha)
                    </SelectItem>
                    <SelectItem value="@/ha">
                      Arrobas por Hectare (@/ha)
                    </SelectItem>
                    <SelectItem value="kg/ha">
                      Quilos por Hectare (kg/ha)
                    </SelectItem>
                  </SelectContent>
                </Select>
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
