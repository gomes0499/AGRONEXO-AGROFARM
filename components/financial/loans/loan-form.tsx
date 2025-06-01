"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThirdPartyLoan } from "@/schemas/financial";
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
  createThirdPartyLoan,
  updateThirdPartyLoan,
} from "@/lib/actions/financial-actions";

// Extended ThirdPartyLoan type to include valores_por_safra
interface ExtendedThirdPartyLoan extends ThirdPartyLoan {
  valores_por_safra?: Record<string, number> | string;
}

// Define exact form schema type to match current database structure
const formSchema = z.object({
  valor: z.coerce.number().positive("Valor deve ser positivo").optional(),
  valores_por_safra: z.record(z.string(), z.number()).optional(),
  beneficiario: z.string().min(1, "Nome do beneficiário é obrigatório"),
  organizacao_id: z.string().uuid(),
});

// Define form values type from schema
type FormValues = z.infer<typeof formSchema>;

interface LoanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingLoan?: ExtendedThirdPartyLoan;
  onSubmit?: (loan: ThirdPartyLoan) => void;
}

export function LoanForm({
  open,
  onOpenChange,
  organizationId,
  existingLoan,
  onSubmit,
}: LoanFormProps) {
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

  // Initialize form with explicit type
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizacao_id: organizationId,
      beneficiario: existingLoan?.beneficiario || "",
      valor: existingLoan?.valor || 0,
      valores_por_safra: parseValoresPorSafra(existingLoan?.valores_por_safra),
    },
  });

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
        moeda: "BRL",
      };

      let result;

      if (existingLoan?.id) {
        // Update existing loan
        result = await updateThirdPartyLoan(existingLoan.id, dataToSubmit);
        toast.success("Empréstimo atualizado com sucesso");
      } else {
        // Create new loan
        result = await createThirdPartyLoan(dataToSubmit);
        toast.success("Empréstimo criado com sucesso");
      }

      // Notify parent component
      if (onSubmit) {
        onSubmit(result);
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar empréstimo:", error);
      toast.error("Erro ao salvar empréstimo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {existingLoan ? "Editar Empréstimo" : "Novo Empréstimo"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do empréstimo concedido a terceiros (onde você é o
            credor e a outra parte é o beneficiário).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              const values = form.getValues();

              if (!values.organizacao_id) {
                console.error(
                  "ERRO: organizacao_id não definido no formulário"
                );
                form.setValue("organizacao_id", organizationId);
              }

              form.handleSubmit(onFormSubmit)(e);
            }}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="beneficiario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiário</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do beneficiário do empréstimo"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
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
                      description="Defina o valor do empréstimo para cada safra"
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
                  : existingLoan
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
