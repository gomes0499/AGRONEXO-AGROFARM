"use client";

import { useState, useEffect } from "react";
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
import { 
  createMultiSafraInvestmentsV2, 
  updateInvestment,
  getInvestment 
} from "@/lib/actions/patrimonio-actions";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { SafraInvestmentEditorV2 } from "../common/safra-investment-editor-v2";
import { type Safra } from "@/lib/actions/asset-forms-data-actions";

const INVESTMENT_CATEGORIES = [
  { value: "MAQUINARIO_AGRICOLA", label: "Máquinas" },
  { value: "EQUIPAMENTO", label: "Equipamento" },
  { value: "TRATOR_COLHEITADEIRA_PULVERIZADOR", label: "Trator/Colheitadeira/Pulverizador" },
  { value: "INFRAESTRUTURA", label: "Infraestrutura" },
  { value: "INVESTIMENTO_SOLO", label: "Solo" },
  { value: "BENFEITORIA", label: "Benfeitoria" },
  { value: "VEICULO", label: "Veículo" },
  { value: "AERONAVE", label: "Aeronave" },
  { value: "TECNOLOGIA", label: "Tecnologia" },
  { value: "OUTROS", label: "Outros" },
];

// Schema atualizado para suportar tipo por safra
const investmentFormSchemaV2 = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  investimentos_por_safra: z.record(z.string(), z.object({
    quantidade: z.number().min(0),
    valor_unitario: z.number().min(0),
    tipo: z.enum(["REALIZADO", "PLANEJADO"])
  })).refine(data => Object.keys(data).length > 0, "Adicione pelo menos um investimento por safra"),
});

type InvestmentFormV2Values = z.infer<typeof investmentFormSchemaV2>;

interface InvestmentFormV2Props {
  organizationId: string;
  initialData?: any;
  onSuccess?: (investments: any[]) => void;
  onCancel?: () => void;
  initialSafras: Safra[];
}

export function InvestmentFormV2({
  organizationId,
  initialData,
  onSuccess,
  onCancel,
  initialSafras,
}: InvestmentFormV2Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData?.id;

  // Transform safras to match expected format
  const harvests = initialSafras.map(h => ({ 
    id: h.id, 
    nome: h.nome,
    ano_inicio: h.ano_inicio,
    ano_fim: h.ano_fim
  }));

  const form = useForm<InvestmentFormV2Values>({
    resolver: zodResolver(investmentFormSchemaV2),
    defaultValues: {
      categoria: "",
      investimentos_por_safra: {},
    },
  });

  // Carregar dados para edição
  useEffect(() => {
    if (isEditing && initialData) {
      setIsLoading(true);
      
      // Se temos um ID, buscar todos os investimentos relacionados
      loadInvestmentData();
    }
  }, [initialData]);

  const loadInvestmentData = async () => {
    if (!initialData?.id) return;
    
    try {
      // Buscar o investimento específico
      const investmentData = await getInvestment(initialData.id);
      
      if ('data' in investmentData && investmentData.data) {
        const investment = investmentData.data;
        
        // Buscar todos os investimentos da mesma categoria e tipo
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        const { data: relatedInvestments } = await supabase
          .from("investimentos")
          .select("*")
          .eq("organizacao_id", organizationId)
          .eq("categoria", investment.categoria)
          .order("ano", { ascending: true });

        if (relatedInvestments) {
          // Criar objeto de investimentos por safra
          const investimentosPorSafra: Record<string, any> = {};
          
          relatedInvestments.forEach(inv => {
            // Encontrar a safra correspondente ao ano
            const safra = initialSafras.find(s => 
              s.ano_inicio <= inv.ano && s.ano_fim >= inv.ano
            );
            
            if (safra) {
              investimentosPorSafra[safra.id] = {
                quantidade: inv.quantidade || 1,
                valor_unitario: inv.valor_unitario || 0,
                tipo: inv.tipo || "REALIZADO"
              };
            }
          });

          form.reset({
            categoria: investment.categoria,
            investimentos_por_safra: investimentosPorSafra
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do investimento:", error);
      toast.error("Erro ao carregar dados do investimento");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: InvestmentFormV2Values) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        // Para edição, usar modo 'update' que gerencia automaticamente as atualizações
        const newInvestments = await createMultiSafraInvestmentsV2(
          organizationId,
          values,
          'update'
        );
        
        toast.success("Investimentos atualizados com sucesso!");
        
        if (onSuccess) {
          onSuccess(newInvestments);
        }
      } else {
        // Criar novos investimentos usando modo 'create'
        const newInvestments = await createMultiSafraInvestmentsV2(
          organizationId,
          values,
          'create'
        );
        
        toast.success(
          `${Object.keys(values.investimentos_por_safra).length} investimento(s) criado(s) com sucesso!`
        );

        if (onSuccess) {
          onSuccess(newInvestments);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar investimentos:", error);
      toast.error("Ocorreu um erro ao salvar os investimentos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isEditing}
                >
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
        </div>

        <Separator />

        {/* Investment Editor with tipo per safra */}
        <FormField
          control={form.control}
          name="investimentos_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraInvestmentEditorV2
                label="Investimentos por Safra"
                description="Defina os investimentos para cada safra e selecione se é realizado ou planejado"
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
            {isSubmitting 
              ? "Salvando..." 
              : isEditing 
                ? "Atualizar Investimentos" 
                : "Salvar Investimentos"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}