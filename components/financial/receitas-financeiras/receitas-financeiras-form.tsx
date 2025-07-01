"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SafraValueEditor } from "@/components/financial/common/safra-value-editor";
import { 
  ReceitaFinanceiraFormValues,
  receitaFinanceiraFormSchema,
  receitaFinanceiraCategoriaEnum
} from "@/schemas/financial/receitas_financeiras";
import { createReceitaFinanceira, updateReceitaFinanceira } from "@/lib/actions/financial-actions/receitas-financeiras-actions";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  JUROS_APLICACOES: "Juros de Aplicações",
  RENDIMENTOS_FUNDOS: "Rendimentos de Fundos",
  DESCONTOS_OBTIDOS: "Descontos Obtidos",
  VARIACAO_CAMBIAL: "Variação Cambial Positiva",
  HEDGE: "Resultados com Hedge",
  DIVIDENDOS: "Dividendos Recebidos",
  OUTRAS_RECEITAS: "Outras Receitas Financeiras"
};

interface ReceitasFinanceirasFormProps {
  organizationId: string;
  safras: Array<{ id: string; nome: string }>;
  receitaId?: string;
  defaultValues?: ReceitaFinanceiraFormValues;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReceitasFinanceirasForm({
  organizationId,
  safras,
  receitaId,
  defaultValues,
  onSuccess,
  onCancel,
}: ReceitasFinanceirasFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReceitaFinanceiraFormValues>({
    resolver: zodResolver(receitaFinanceiraFormSchema) as any,
    defaultValues: defaultValues || {
      nome: "",
      categoria: "OUTRAS_RECEITAS",
      moeda: "BRL",
      valores_por_safra: {},
      descricao: "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);

      // Garantir que valores_por_safra seja um objeto
      const valoresPorSafra = values.valores_por_safra || {};
      
      if (receitaId) {
        await updateReceitaFinanceira(receitaId, {
          ...values,
          valores_por_safra: valoresPorSafra,
        });
        toast.success("Receita financeira atualizada com sucesso!");
      } else {
        await createReceitaFinanceira(organizationId, {
          ...values,
          valores_por_safra: valoresPorSafra,
        });
        toast.success("Receita financeira criada com sucesso!");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar receita financeira:", error);
      toast.error(
        receitaId
          ? "Erro ao atualizar receita financeira"
          : "Erro ao criar receita financeira"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        <FormField
          control={form.control as any}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Receita</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Rendimentos CDB"
                  {...field}
                  disabled={isSubmitting}
                />
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
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {receitaFinanceiraCategoriaEnum.options.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoryLabels[categoria] || categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="moeda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moeda</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição opcional da receita financeira"
                  className="resize-none"
                  rows={3}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Adicione detalhes relevantes sobre esta receita
              </FormDescription>
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
                  values={(field.value as any) || {}}
                  onChange={field.onChange}
                  safras={safras}
                  organizacaoId={organizationId}
                  label="Valores de Receita por Safra"
                  description="Informe os valores de receita para cada safra"
                  currency={form.watch("moeda") as "BRL" | "USD"}
                  disabled={isSubmitting}
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
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {receitaId ? "Atualizar" : "Criar"} Receita
          </Button>
        </div>
      </form>
    </Form>
  );
}