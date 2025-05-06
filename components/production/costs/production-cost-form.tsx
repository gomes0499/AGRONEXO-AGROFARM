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
  ProductionCost,
  ProductionCostFormValues,
  productionCostFormSchema,
  productionCostCategoryEnum,
  Culture,
  System,
  Harvest,
} from "@/schemas/production";
import {
  createProductionCost,
  updateProductionCost,
} from "@/lib/actions/production-actions";
import { formatCurrency, parseFormattedNumber } from "@/lib/utils/formatters";

interface ProductionCostFormProps {
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  organizationId: string;
  cost?: ProductionCost | null;
  onSuccess?: (cost: ProductionCost) => void;
  onCancel?: () => void;
}

export function ProductionCostForm({
  cultures,
  systems,
  harvests,
  organizationId,
  cost = null,
  onSuccess,
  onCancel,
}: ProductionCostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isEditing = !!cost?.id;

  const form = useForm<ProductionCostFormValues>({
    resolver: zodResolver(productionCostFormSchema),
    defaultValues: {
      cultura_id: cost?.cultura_id || "",
      sistema_id: cost?.sistema_id || "",
      safra_id: cost?.safra_id || "",
      categoria: (cost?.categoria as any) || "OUTROS",
      valor: cost?.valor || 0,
    },
  });

  const onSubmit = async (values: ProductionCostFormValues) => {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        // Atualizar item existente
        const updatedItem = await updateProductionCost(cost.id || "", values);
        toast.success("Custo atualizado com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Criar novo item
        const newItem = await createProductionCost(organizationId, values);
        toast.success("Custo criado com sucesso!");
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar custo:", error);
      toast.error("Ocorreu um erro ao salvar o custo.");
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
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CALCARIO">Calcário</SelectItem>
                  <SelectItem value="FERTILIZANTE">Fertilizante</SelectItem>
                  <SelectItem value="SEMENTES">Sementes</SelectItem>
                  <SelectItem value="TRATAMENTO_SEMENTES">
                    Tratamento de Sementes
                  </SelectItem>
                  <SelectItem value="HERBICIDA">Herbicida</SelectItem>
                  <SelectItem value="INSETICIDA">Inseticida</SelectItem>
                  <SelectItem value="FUNGICIDA">Fungicida</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                  <SelectItem value="BENEFICIAMENTO">Beneficiamento</SelectItem>
                  <SelectItem value="SERVICOS">Serviços</SelectItem>
                  <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
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

        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Digite o valor do custo"
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
                      const formattedValue = formatCurrency(field.value);
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
                      ? formatCurrency(field.value)
                      : ""
                  }
                />
              </FormControl>
              <FormDescription>Valor do custo em reais (R$)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
