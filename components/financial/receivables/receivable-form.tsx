"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ReceivableContract } from "@/schemas/financial/receivables";
import { commodityTypeEnum } from "@/schemas/financial/common";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  createReceivableContract,
  updateReceivableContract,
} from "@/lib/actions/financial-actions";
import { CurrencyField } from "@/components/shared/currency-field";
import { SafraValueEditor } from "../common/safra-value-editor";
import { Harvest } from "@/schemas/production";
import { getSafras } from "@/lib/actions/production-actions";

// Extended ReceivableContract type to include valores_por_safra
interface ExtendedReceivableContract extends ReceivableContract {
  valores_por_safra?: Record<string, number> | string;
}

// Definindo o schema diretamente para evitar problemas de tipagem
const formSchema = z.object({
  commodity: commodityTypeEnum,
  valor: z.coerce.number().positive("Valor deve ser positivo").optional(),
  valores_por_safra: z.record(z.string(), z.number()).optional(),
  organizacao_id: z.string().uuid(),
});

// Tipo para os valores do formulário
type FormValues = z.infer<typeof formSchema>;

interface ReceivableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingReceivable?: ExtendedReceivableContract;
  onSubmit?: (receivable: ReceivableContract) => void;
}

export function ReceivableForm({
  open,
  onOpenChange,
  organizationId,
  existingReceivable,
  onSubmit,
}: ReceivableFormProps) {
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

  // Inicializar formulário com esquema definido localmente
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      commodity: existingReceivable?.commodity || "SOJA",
      valor: existingReceivable?.valor || 0,
      valores_por_safra: parseValoresPorSafra(
        existingReceivable?.valores_por_safra
      ),
      organizacao_id:
        organizationId || existingReceivable?.organizacao_id || "",
    },
  });

  // Garantir que o organization_id seja definido no formulário
  useEffect(() => {
    if (organizationId) {
      form.setValue("organizacao_id", organizationId);
    }
  }, [organizationId, form]);

  // Função para lidar com o envio do formulário
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);

      if (!values.organizacao_id) {
        console.error("Erro: organizacao_id não definido no formulário");
        toast.error("Erro: ID da organização não definido");
        return;
      }

      // Calculate total from safra values
      const valoresPorSafra = values.valores_por_safra || {};
      const valorTotal = Object.values(
        valoresPorSafra as Record<string, number>
      ).reduce((acc, val) => acc + (typeof val === "number" ? val : 0), 0);

      // Preparar valores simplificados para envio
      const dataToSubmit = {
        ...values,
        valor: valorTotal,
        valores_por_safra: JSON.stringify(valoresPorSafra),
      };

      let result;

      if (existingReceivable?.id) {
        // Atualizar contrato existente
        result = await updateReceivableContract(
          existingReceivable.id,
          dataToSubmit
        );
        toast.success("Contrato recebível atualizado com sucesso");
      } else {
        // Criar novo contrato
        result = await createReceivableContract(dataToSubmit);
        toast.success("Contrato recebível criado com sucesso");
      }

      // Notificar componente pai
      if (onSubmit) {
        onSubmit(result);
      }

      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar contrato recebível:", error);
      toast.error("Erro ao salvar contrato recebível");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {existingReceivable
              ? "Editar Contrato Recebível"
              : "Novo Contrato Recebível"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do contrato recebível.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="commodity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commodity</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
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
                      <SelectItem value="FEIJAO_GURUTUBA">
                        Feijão Gurutuba
                      </SelectItem>
                      <SelectItem value="FEIJAO_CARIOCA">
                        Feijão Carioca
                      </SelectItem>
                      <SelectItem value="MAMONA">Mamona</SelectItem>
                      <SelectItem value="SEM_PASTAGEM">Sem Pastagem</SelectItem>
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
              control={form.control}
              name="valores_por_safra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valores por Safra</FormLabel>
                  <FormControl>
                    <SafraValueEditor
                      label="Valor"
                      description="Defina o valor do contrato recebível para cada safra"
                      values={field.value || {}}
                      onChange={field.onChange}
                      safras={harvests.map((h) => ({ id: h.id, nome: h.nome }))}
                      currency="BRL"
                      disabled={isSubmitting || isLoadingHarvests}
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
                  : existingReceivable
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
