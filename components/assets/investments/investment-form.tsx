"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSafras } from "@/lib/actions/production-actions";
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
import { CurrencyField } from "@/components/shared/currency-field";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { createInvestment, updateInvestment } from "@/lib/actions/patrimonio-actions";
import { Loader2 } from "lucide-react";
import { investmentFormSchema, type InvestmentFormValues } from "@/schemas/patrimonio/investments";

const INVESTMENT_CATEGORIES = [
  { value: "EQUIPAMENTO", label: "Equipamento" },
  { value: "TRATOR_COLHEITADEIRA_PULVERIZADOR", label: "Trator/Colheitadeira/Pulverizador" },
  { value: "AERONAVE", label: "Aeronave" },
  { value: "VEICULO", label: "Veículo" },
  { value: "BENFEITORIA", label: "Benfeitoria" },
  { value: "INVESTIMENTO_SOLO", label: "Investimento em Solo" },
];

interface InvestmentFormProps {
  organizationId: string;
  initialData?: any;
  onSuccess?: (investment: any) => void;
  onCancel?: () => void;
}

export function InvestmentForm({
  organizationId,
  initialData,
  onSuccess,
  onCancel,
}: InvestmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [harvests, setHarvests] = useState<Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>>([]);
  const [isLoadingHarvests, setIsLoadingHarvests] = useState(false);
  const isEditing = !!initialData?.id;

  // Carregar safras
  useEffect(() => {
    async function loadHarvests() {
      try {
        setIsLoadingHarvests(true);
        const harvestsData = await getSafras(organizationId);
        setHarvests(harvestsData.map(h => ({ 
          id: h.id, 
          nome: h.nome,
          ano_inicio: h.ano_inicio,
          ano_fim: h.ano_fim
        })));
      } catch (error) {
        console.error("Erro ao carregar safras:", error);
        toast.error("Erro ao carregar safras");
      } finally {
        setIsLoadingHarvests(false);
      }
    }
    loadHarvests();
  }, [organizationId]);

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: {
      categoria: initialData?.categoria || "",
      quantidade: initialData?.quantidade || 1,
      valor_unitario: initialData?.valor_unitario || 0,
      tipo: initialData?.tipo || "REALIZADO",
      safra_id: initialData?.safra_id || "",
      ano: initialData?.ano || new Date().getFullYear(),
    },
  });

  // Watch form values for calculations
  const quantidade = form.watch("quantidade") || 0;
  const valorUnitario = form.watch("valor_unitario") || 0;
  const selectedSafraId = form.watch("safra_id");

  // Calcular valor total automaticamente
  const valorTotal = useMemo(() => {
    return quantidade * valorUnitario;
  }, [quantidade, valorUnitario]);

  // Obter o ano da safra selecionada
  const getYearFromSafra = (safraId: string) => {
    if (!safraId || safraId === "none") {
      return new Date().getFullYear();
    }
    const safra = harvests.find(h => h.id === safraId);
    return safra ? safra.ano_inicio : new Date().getFullYear();
  };

  const onSubmit = async (values: InvestmentFormValues) => {
    try {
      setIsSubmitting(true);

      // Preparar dados para envio (incluindo valor_total calculado e ano)
      const dataToSubmit = {
        organizacao_id: organizationId,
        ...values,
        ano: getYearFromSafra(values.safra_id || ""), // Usar ano da safra selecionada
        valor_total: valorTotal, // Incluir valor calculado até que o banco seja ajustado
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateInvestment(initialData.id, dataToSubmit);
        toast.success("Investimento atualizado com sucesso!");
      } else {
        result = await createInvestment(dataToSubmit);
        toast.success("Investimento criado com sucesso!");
      }

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      if (onSuccess && result?.data) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      toast.error("Erro ao salvar investimento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="safra_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Safra</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} defaultValue={field.value || "none"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingHarvests ? "Carregando safras..." : "Selecione uma safra (opcional)"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhuma safra</SelectItem>
                  {harvests.map((harvest) => (
                    <SelectItem key={harvest.id} value={harvest.id}>
                      {harvest.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {selectedSafraId && selectedSafraId !== "none" && (
                <p className="text-sm text-muted-foreground mt-1">
                  Ano do investimento: {getYearFromSafra(selectedSafraId)}
                </p>
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <CurrencyField
            name="valor_unitario"
            label="Valor Unitário"
            control={form.control}
            placeholder="R$ 0,00"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Valor Total</label>
          <Input
            type="text"
            value={formatGenericCurrency(valorTotal, "BRL")}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
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
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}