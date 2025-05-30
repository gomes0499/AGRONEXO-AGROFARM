"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Inventory } from "@/schemas/financial/inventory";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinancialFormModal } from "../common/financial-form-modal";
import { createInventory, updateInventory } from "@/lib/actions/financial-actions";
import { CurrencyField } from "@/components/shared/currency-field";
import { SafraValueEditor } from "../common/safra-value-editor";
import { Harvest } from "@/schemas/production";
import { getSafras } from "@/lib/actions/production-actions";

// Define local schema para incluir organizacao_id
const formSchema = z.object({
  organizacao_id: z.string().uuid(),
  tipo: z.enum([
    "FERTILIZANTES", "DEFENSIVOS", "ALMOXARIFADO", "OUTROS", "SEMENTES",
    "MAQUINAS_E_EQUIPAMENTOS", "COMBUSTIVEIS", "PECAS_E_ACESSORIOS",
    "MEDICAMENTOS_VETERINARIOS", "RACAO_ANIMAL"
  ]),
  valor: z.coerce.number().min(0, "Valor deve ser positivo").optional(),
  valores_por_safra: z.record(z.string(), z.number()).optional(),
});

// Tipo para os valores do formulário
type FormValues = z.infer<typeof formSchema>;

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingInventory?: Inventory;
  onSubmit?: (inventory: Inventory) => void;
}

export function InventoryForm({
  open,
  onOpenChange,
  organizationId,
  existingInventory,
  onSubmit,
}: InventoryFormProps) {
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
      tipo: existingInventory?.tipo || "FERTILIZANTES",
      valor: existingInventory?.valor || 0,
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
  const onSubmitHandler = async (values: FormValues) => {
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
      
      const dataToSubmit = {
        ...values,
        organizacao_id: orgId,
        valor: valorTotal,
        valores_por_safra: valoresPorSafra,
      };

      let result;
      
      if (existingInventory?.id) {
        // Atualizar estoque existente
        result = await updateInventory(existingInventory.id, dataToSubmit);
        toast.success("Estoque atualizado com sucesso");
      } else {
        // Criar novo estoque
        result = await createInventory(dataToSubmit);
        toast.success("Estoque criado com sucesso");
      }
      
      // Notificar componente pai
      if (onSubmit) {
        onSubmit(result);
      }
      
      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar estoque:", error);
      toast.error("Erro ao salvar estoque");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FinancialFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={existingInventory ? "Editar Estoque" : "Novo Estoque"}
      description="Preencha os dados do estoque."
      isSubmitting={isSubmitting}
      showFooter={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-6">
          <FormField
            control={form.control as any}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Estoque</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FERTILIZANTES">Fertilizantes</SelectItem>
                    <SelectItem value="DEFENSIVOS">Defensivos</SelectItem>
                    <SelectItem value="ALMOXARIFADO">Almoxarifado</SelectItem>
                    <SelectItem value="SEMENTES">Sementes</SelectItem>
                    <SelectItem value="MAQUINAS_E_EQUIPAMENTOS">Máquinas e Equipamentos</SelectItem>
                    <SelectItem value="COMBUSTIVEIS">Combustíveis</SelectItem>
                    <SelectItem value="PECAS_E_ACESSORIOS">Peças e Acessórios</SelectItem>
                    <SelectItem value="MEDICAMENTOS_VETERINARIOS">Medicamentos Veterinários</SelectItem>
                    <SelectItem value="RACAO_ANIMAL">Ração Animal</SelectItem>
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
                  <div className="w-full">
                    <SafraValueEditor
                      values={field.value || {}}
                      onChange={field.onChange}
                      organizacaoId={organizationId}
                    />
                  </div>
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
              {isSubmitting ? "Salvando..." : existingInventory ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </Form>
    </FinancialFormModal>
  );
}