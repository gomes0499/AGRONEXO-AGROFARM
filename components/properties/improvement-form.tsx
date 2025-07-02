"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { improvementFormSchema, type ImprovementFormValues } from "@/schemas/properties";
import { createImprovement } from "@/lib/actions/property-actions";
import { toast } from "sonner";
import { CurrencyField } from "@/components/shared/currency-field";

const CurrencyFieldWrapper = CurrencyField as any;

interface ImprovementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  organizationId: string;
  onSuccess?: () => void;
}

export function ImprovementForm({
  open,
  onOpenChange,
  propertyId,
  organizationId,
  onSuccess,
}: ImprovementFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ImprovementFormValues>({
    resolver: zodResolver(improvementFormSchema),
    defaultValues: {
      propriedade_id: propertyId,
      descricao: "",
      dimensoes: "",
      valor: 0,
    },
  });

  const onSubmit = async (values: ImprovementFormValues) => {
    try {
      setIsLoading(true);
      await createImprovement(organizationId, values);
      toast.success("Benfeitoria adicionada com sucesso!");
      form.reset();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar benfeitoria:", error);
      toast.error("Erro ao adicionar benfeitoria");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Benfeitoria</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Casa sede, Galpão de máquinas, Silo..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dimensoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dimensões</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 200m², 15x30m"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CurrencyFieldWrapper
              name="valor"
              label="Valor*"
              control={form.control as any}
              placeholder="R$ 0,00"
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}