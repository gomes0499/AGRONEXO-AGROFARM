"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DividasBancariasFormValues,
  DividasBancariasListItem,
  dividasBancariasFormSchema,
} from "@/schemas/financial/dividas_bancarias";
// Import directly from the action file instead of the index
import { createDividaBancaria, updateDividaBancaria } from "@/lib/actions/financial-actions/dividas-bancarias";
import { SafraValueEditor } from "@/components/financial/common/safra-value-editor";

interface DividasBancariasFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  organizacaoId: string;
  initialData?: DividasBancariasListItem | null;
}

export function DividasBancariasFormModal({
  open,
  onClose,
  onSave,
  organizacaoId,
  initialData,
}: DividasBancariasFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DividasBancariasFormValues>({
    resolver: zodResolver(dividasBancariasFormSchema) as any,
    defaultValues: {
      nome: "",
      categoria: "CUSTEIO",
      valores_por_safra: {},
    },
  });

  // Atualizar o formulário quando os dados iniciais mudarem
  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.nome,
        categoria: initialData.categoria,
        valores_por_safra: initialData.valores_por_safra || {},
      });
    } else {
      form.reset({
        nome: "",
        categoria: "CUSTEIO",
        valores_por_safra: {},
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: DividasBancariasFormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateDividaBancaria(initialData.id, values, organizacaoId);
        toast.success("Dívida bancária atualizada com sucesso");
      } else {
        await createDividaBancaria(values, organizacaoId);
        toast.success("Dívida bancária criada com sucesso");
      }
      onSave();
    } catch (error) {
      console.error("Erro ao salvar dívida bancária:", error);
      toast.error("Não foi possível salvar a dívida bancária");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]" style={{ width: "90vw", maxWidth: "800px" }}>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Dívida Bancária" : "Nova Dívida Bancária"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
            <FormField
              control={form.control as any}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da dívida" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CUSTEIO">Custeio</SelectItem>
                      <SelectItem value="INVESTIMENTOS">Investimentos</SelectItem>
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
                      values={field.value as Record<string, number>}
                      onChange={field.onChange}
                      organizacaoId={organizacaoId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}