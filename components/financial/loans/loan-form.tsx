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

// Define exact form schema type to match current database structure
const formSchema = z.object({
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  beneficiario: z.string().min(1, "Nome do beneficiário é obrigatório"),
  organizacao_id: z.string().uuid(),
});

// Define form values type from schema
type FormValues = z.infer<typeof formSchema>;

interface LoanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingLoan?: ThirdPartyLoan;
  onSubmit?: (loan: ThirdPartyLoan) => void;
}

export function LoanForm({
  open,
  onOpenChange,
  organizationId,
  existingLoan,
  onSubmit,
}: LoanFormProps) {
  console.log("Loan form - organizationId recebido:", organizationId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with explicit type
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizacao_id: organizationId,
      ...(existingLoan || {}),
      // Garantir campos obrigatórios ou com valores padrão específicos
      beneficiario: existingLoan?.beneficiario || "",
      valor: existingLoan?.valor || 0,
    },
  });

  // Garantir que o organization_id seja definido no formulário
  useEffect(() => {
    if (organizationId) {
      form.setValue("organizacao_id", organizationId);
      console.log("Atualizando organizacao_id no formulário:", organizationId);
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

      console.log(
        "Enviando empréstimo com organizacao_id:",
        orgId
      );

      // Preparar dados para envio
      const dataToSubmit = {
        ...data,
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
              console.log("Form submission attempt");
              console.log("Form validation state:", form.formState.isValid);
              console.log("Form errors:", form.formState.errors);
              const values = form.getValues();
              console.log("Form values:", values);
              
              // Verificar os dados críticos
              console.log("beneficiario:", values.beneficiario, "tipo:", typeof values.beneficiario);
              console.log("valor:", values.valor, "tipo:", typeof values.valor);
              console.log("organizacao_id:", values.organizacao_id, "tipo:", typeof values.organizacao_id);
              
              if (!values.organizacao_id) {
                console.error("ERRO: organizacao_id não definido no formulário");
                form.setValue("organizacao_id", organizationId);
                console.log("Definindo organizacao_id para:", organizationId);
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

            <CurrencyField
              name="valor"
              label="Valor"
              control={form.control}
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
