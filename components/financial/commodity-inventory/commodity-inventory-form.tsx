"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CommodityInventory } from "@/schemas/financial/inventory";
import { commodityTypeEnum } from "@/schemas/financial";
import { toast } from "sonner";
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
import { FinancialFormModal } from "../common/financial-form-modal";
import {
  createCommodityInventory,
  updateCommodityInventory,
} from "@/lib/actions/financial-actions";
import { CurrencyField } from "@/components/shared/currency-field";
import { SafraValueEditor } from "../common/safra-value-editor";
import { Harvest } from "@/schemas/production";
import { getSafras } from "@/lib/actions/production-actions";

// Define commodity type enum values
// Using the schema's values to ensure consistency
const commodityOptions = [
  "SOJA", "ALGODAO", "MILHO", "ARROZ", "SORGO", "CAFE", "CACAU", 
  "SOJA_CANA", "TRIGO", "FEIJAO", "GIRASSOL", "AMENDOIM", 
  "BOI_GORDO", "BEZERRO", "VACA_GORDA", "OUTROS"
] as const;

// Define local schema for better type safety with React Hook Form
const formSchema = z.object({
  organizacao_id: z.string().uuid(),
  commodity: z.enum(commodityOptions),
  valor_total: z.coerce.number().min(0, "Valor total deve ser positivo").optional(),
  valores_por_safra: z.record(z.string(), z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CommodityInventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingInventory?: CommodityInventory;
  onSubmit?: (inventory: CommodityInventory) => void;
}

export function CommodityInventoryForm({
  open,
  onOpenChange,
  organizationId,
  existingInventory,
  onSubmit,
}: CommodityInventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isLoadingHarvests, setIsLoadingHarvests] = useState(false);

  // Carregar safras quando o modal abrir
  useEffect(() => {
    if (open && organizationId) {
      loadHarvests();
    }
  }, [open, organizationId]);

  const loadHarvests = async () => {
    try {
      setIsLoadingHarvests(true);
      const harvestsData = await getSafras(organizationId);
      setHarvests(harvestsData);
    } catch (error) {
      console.error("Erro ao carregar safras:", error);
      toast.error("Erro ao carregar safras");
    } finally {
      setIsLoadingHarvests(false);
    }
  };

  // Parse existing valores_por_safra
  const parseValoresPorSafra = (valores: any) => {
    if (!valores) return {};
    if (typeof valores === "string") {
      try {
        return JSON.parse(valores);
      } catch {
        return {};
      }
    }
    return valores;
  };

  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizacao_id: organizationId,
      commodity: existingInventory?.commodity || "SOJA",
      valor_total: existingInventory?.valor_total || 0,
      valores_por_safra: parseValoresPorSafra(existingInventory?.valores_por_safra),
    },
  });
  
  // Garantir que o organization_id seja definido no formulário
  useEffect(() => {
    if (organizationId) {
      form.setValue("organizacao_id", organizationId);
      console.log("ID da organização definido:", organizationId);
    }
  }, [organizationId, form]);
  
  // Função para lidar com o envio do formulário
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);
      
      // Garante que organizacao_id está definido, usando organizationId como fallback
      if (!values.organizacao_id && !organizationId) {
        console.error("Erro: organizacao_id não definido");
        toast.error("Erro: ID da organização não definido");
        return;
      }

      const orgId = values.organizacao_id || organizationId;
      console.log("Enviando estoque com organizacao_id:", orgId);

      // Calculate total from safra values
      const valoresPorSafra = values.valores_por_safra || {};
      const valorTotal = Object.values(valoresPorSafra as Record<string, number>).reduce(
        (acc, val) => acc + (typeof val === "number" ? val : 0),
        0
      );
      
      // Adicionar apenas os dados essenciais
      const dataToSubmit = {
        commodity: values.commodity,
        valor_total: valorTotal,
        valores_por_safra: JSON.stringify(valoresPorSafra),
        organizacao_id: orgId,
      };

      let result;

      if (existingInventory?.id) {
        // Atualizar estoque existente
        result = await updateCommodityInventory(
          existingInventory.id,
          dataToSubmit
        );
        toast.success("Estoque de commodity atualizado com sucesso");
      } else {
        // Criar novo estoque
        result = await createCommodityInventory(dataToSubmit);
        toast.success("Estoque de commodity criado com sucesso");
      }

      // Notificar componente pai
      if (onSubmit) {
        onSubmit(result);
      }

      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar estoque de commodity:", error);
      toast.error("Erro ao salvar estoque de commodity");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <FinancialFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        existingInventory
          ? "Editar Estoque de Commodity"
          : "Novo Estoque de Commodity"
      }
      description="Preencha os dados do estoque de commodity."
      isSubmitting={isSubmitting}
      showFooter={false}
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            control={form.control as any}
            name="commodity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Commodity</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a commodity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SOJA">Soja</SelectItem>
                    <SelectItem value="ALGODAO">Algodão</SelectItem>
                    <SelectItem value="MILHO">Milho</SelectItem>
                    <SelectItem value="MILHETO">Milheto</SelectItem>
                    <SelectItem value="SORGO">Sorgo</SelectItem>
                    <SelectItem value="FEIJAO_GURUTUBA">Feijão Gurutuba</SelectItem>
                    <SelectItem value="FEIJAO_CARIOCA">Feijão Carioca</SelectItem>
                    <SelectItem value="MAMONA">Mamona</SelectItem>
                    <SelectItem value="SEM_PASTAGEM">Sementes para Pastagem</SelectItem>
                    <SelectItem value="CAFE">Café</SelectItem>
                    <SelectItem value="TRIGO">Trigo</SelectItem>
                    <SelectItem value="PECUARIA">Pecuária</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="valores_por_safra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valores por Safra</FormLabel>
                <FormControl>
                  <SafraValueEditor
                    values={field.value || {}}
                    onChange={field.onChange}
                    organizacaoId={organizationId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : existingInventory
                ? "Atualizar"
                : "Salvar"}
            </Button>
          </div>
        </form>
      </Form>
    </FinancialFormModal>
  );
}
