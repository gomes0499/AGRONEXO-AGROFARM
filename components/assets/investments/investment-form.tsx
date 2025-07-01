"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { createMultiSafraInvestments } from "@/lib/actions/patrimonio-actions";
import { Loader2 } from "lucide-react";
import { multiSafraInvestmentFormSchema, type MultiSafraInvestmentFormValues } from "@/schemas/patrimonio/investments";
import { SafraInvestmentEditor } from "../common/safra-investment-editor";
import { type Safra } from "@/lib/actions/asset-forms-data-actions";

const INVESTMENT_CATEGORIES = [
  { value: "EQUIPAMENTO", label: "Equipamento" },
  { value: "TRATOR_COLHEITADEIRA_PULVERIZADOR", label: "Trator/Colheitadeira/Pulverizador" },
  { value: "AERONAVE", label: "Aeronave" },
  { value: "VEICULO", label: "Veículo" },
  { value: "BENFEITORIA", label: "Benfeitoria" },
  { value: "INVESTIMENTO_SOLO", label: "Investimento em Solo" },
];

interface InvestmentFormClientProps {
  organizationId: string;
  initialData?: any;
  onSuccess?: (investments: any[]) => void;
  onCancel?: () => void;
  initialSafras: Safra[];
}

export function InvestmentForm({
  organizationId,
  initialData,
  onSuccess,
  onCancel,
  initialSafras,
}: InvestmentFormClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData?.id;

  // Transform safras to match expected format
  const harvests = initialSafras.map(h => ({ 
    id: h.id, 
    nome: h.nome,
    ano_inicio: h.ano_inicio,
    ano_fim: h.ano_fim
  }));

  const form = useForm<MultiSafraInvestmentFormValues>({
    resolver: zodResolver(multiSafraInvestmentFormSchema),
    defaultValues: {
      categoria: initialData?.categoria || "",
      tipo: initialData?.tipo || "REALIZADO",
      investimentos_por_safra: {},
    },
  });

  const onSubmit = async (values: MultiSafraInvestmentFormValues) => {
    setIsSubmitting(true);
    try {
      const newInvestments = await createMultiSafraInvestments(
        organizationId,
        values
      );
      toast.success(
        `${Object.keys(values.investimentos_por_safra).length} investimento(s) criado(s) com sucesso!`
      );

      if (onSuccess) {
        onSuccess(newInvestments);
      }
    } catch (error) {
      console.error("Erro ao criar investimentos:", error);
      toast.error("Ocorreu um erro ao criar os investimentos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INVESTMENT_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="REALIZADO">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Realizado
                        </div>
                      </SelectItem>
                      <SelectItem value="PLANEJADO">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Planejado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Investment Editor */}
        <FormField
          control={form.control}
          name="investimentos_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraInvestmentEditor
                label="Investimentos por Safra"
                description="Defina os investimentos para cada safra"
                values={field.value}
                onChange={field.onChange}
                safras={harvests}
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Action Buttons */}
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
            {isSubmitting ? "Salvando..." : "Salvar Investimentos"}
          </Button>
        </div>
      </form>
    </Form>
  );
}