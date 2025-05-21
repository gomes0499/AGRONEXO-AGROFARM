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
  SelectItem
} from "@/components/ui/select";
import {
  createReceivableContract,
  updateReceivableContract,
} from "@/lib/actions/financial-actions";
import { CurrencyField } from "@/components/shared/currency-field";

// Definindo o schema diretamente para evitar problemas de tipagem
const formSchema = z.object({
  commodity: commodityTypeEnum,
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  organizacao_id: z.string().uuid(),
});

// Tipo para os valores do formulário
type FormValues = z.infer<typeof formSchema>;

interface ReceivableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingReceivable?: ReceivableContract;
  onSubmit?: (receivable: ReceivableContract) => void;
}

export function ReceivableForm({
  open,
  onOpenChange,
  organizationId,
  existingReceivable,
  onSubmit,
}: ReceivableFormProps) {
  console.log("Receivable form - organizationId recebido:", organizationId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar formulário com esquema definido localmente
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      commodity: existingReceivable?.commodity || "SOJA",
      valor: existingReceivable?.valor || 0,
      organizacao_id: organizationId || existingReceivable?.organizacao_id || "",
    },
  });
  
  // Garantir que o organization_id seja definido no formulário
  useEffect(() => {
    if (organizationId) {
      form.setValue("organizacao_id", organizationId);
      console.log("Atualizando organizacao_id no formulário:", organizationId);
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
      
      console.log("Enviando contrato recebível com organizacao_id:", values.organizacao_id);

      // Preparar valores simplificados para envio
      const dataToSubmit = {
        ...values
      };
      
      // Adicionar logs para depuração
      console.log("Dados do formulário para envio:", dataToSubmit);

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
            {existingReceivable ? "Editar Contrato Recebível" : "Novo Contrato Recebível"}
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
                      <SelectItem value="FEIJAO_GURUTUBA">Feijão Gurutuba</SelectItem>
                      <SelectItem value="FEIJAO_CARIOCA">Feijão Carioca</SelectItem>
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

            <CurrencyField
              name="valor"
              label="Valor"
              control={form.control}
              isRevenue={true}
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