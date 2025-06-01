"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SupplierAdvance } from "@/schemas/financial";
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
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/shared/currency-field";
import { SafraValueEditor } from "../common/safra-value-editor";
import { Harvest } from "@/schemas/production";
import { getSafras } from "@/lib/actions/production-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSupplierAdvance,
  updateSupplierAdvance,
  getSuppliersByOrganization,
} from "@/lib/actions/financial-actions";

// Define exact form schema type to match current database structure
const formSchema = z.object({
  valor: z.coerce.number().positive("Valor deve ser positivo").optional(),
  valores_por_safra: z.record(z.string(), z.number()).optional(),
  fornecedor_id: z.string().uuid("ID do fornecedor é obrigatório"),
  organizacao_id: z.string().uuid(),
});

// Define form values type from schema
type FormValues = z.infer<typeof formSchema>;

interface AdvanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingAdvance?: SupplierAdvance;
  onSubmit?: (advance: SupplierAdvance) => void;
}

export function AdvanceForm({
  open,
  onOpenChange,
  organizationId,
  existingAdvance,
  onSubmit,
}: AdvanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; nome: string }>
  >([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isLoadingHarvests, setIsLoadingHarvests] = useState(false);

  // Helper de parsear datas removido

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

  // Initialize form with explicit type
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizacao_id: organizationId,
      fornecedor_id: existingAdvance?.fornecedor_id || "",
      valor: existingAdvance?.valor || 0,
      valores_por_safra: parseValoresPorSafra(
        existingAdvance?.valores_por_safra || {}
      ),
    },
  });

  // Carregar lista de fornecedores e safras quando o formulário abrir
  useEffect(() => {
    if (open && organizationId) {
      loadSuppliers();
      loadHarvests();
    }
  }, [open, organizationId]);

  const loadSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true);
      const data = await getSuppliersByOrganization(organizationId);
      setSuppliers(data);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      toast.error("Erro ao carregar lista de fornecedores");
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

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

  // Garantir que o organization_id seja definido no formulário
  useEffect(() => {
    if (organizationId) {
      form.setValue("organizacao_id", organizationId);
    }
  }, [organizationId, form]);

  // Handle form submission with explicit typing
  const onFormSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setIsSubmitting(true);

      // Garante que organizacao_id está definido, usando organizationId como fallback
      if (!data.organizacao_id && !organizationId) {
        console.error("Erro: organizacao_id não definido no formulário");
        toast.error("Erro: ID da organização não definido");
        return;
      }

      // Usa o valor do formulário ou o organizationId diretamente
      const orgId = data.organizacao_id || organizationId;

      // Verificar se foi selecionado um fornecedor
      if (!data.fornecedor_id) {
        console.error("Erro: fornecedor_id não definido no formulário");
        toast.error("Selecione um fornecedor para continuar");
        return;
      }

      // Calculate total from safra values
      const valoresPorSafra = data.valores_por_safra || {};
      const valorTotal = Object.values(
        valoresPorSafra as Record<string, number>
      ).reduce((acc, val) => acc + (typeof val === "number" ? val : 0), 0);

      // Preparar dados para envio
      const dataToSubmit = {
        ...data,
        valor: valorTotal,
        valores_por_safra: JSON.stringify(valoresPorSafra),
        organizacao_id: orgId,
      };

      let result;

      if (existingAdvance?.id) {
        // Update existing advance
        result = await updateSupplierAdvance(existingAdvance.id, dataToSubmit);
        toast.success("Adiantamento atualizado com sucesso");
      } else {
        // Create new advance
        result = await createSupplierAdvance(dataToSubmit);
        toast.success("Adiantamento criado com sucesso");
      }

      // Notify parent component
      if (onSubmit) {
        onSubmit(result);
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar adiantamento:", error);
      toast.error("Erro ao salvar adiantamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {existingAdvance ? "Editar Adiantamento" : "Novo Adiantamento"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do adiantamento a fornecedor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="fornecedor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <Select
                    disabled={isSubmitting || isLoadingSuppliers}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingSuppliers
                              ? "Carregando fornecedores..."
                              : "Selecione um fornecedor"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          {isLoadingSuppliers
                            ? "Carregando..."
                            : "Nenhum fornecedor encontrado"}
                        </SelectItem>
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valores_por_safra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valores por Safra</FormLabel>
                  <FormControl>
                    <SafraValueEditor
                      label="Valor"
                      description="Defina o valor do adiantamento para cada safra"
                      values={field.value || {}}
                      onChange={field.onChange}
                      safras={harvests.map((h) => ({
                        id: h.id || "",
                        nome: h.nome,
                      }))}
                      currency="BRL"
                      disabled={isSubmitting || isLoadingHarvests}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos de data removidos conforme solicitado */}

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
                  : existingAdvance
                  ? "Atualizar"
                  : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
