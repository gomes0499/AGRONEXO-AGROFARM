"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { createMultiSafraAssetSales } from "@/lib/actions/asset-sales-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  multiSafraAssetSaleFormSchema,
  type MultiSafraAssetSaleFormValues,
} from "@/schemas/patrimonio/asset-sales";
import { SafraAssetSaleEditor } from "../common/safra-asset-sale-editor";
import { type Safra } from "@/lib/actions/asset-forms-data-actions";

interface AssetSaleFormClientProps {
  organizationId: string;
  initialData?: any;
  onSuccess?: (assetSales: any[]) => void;
  onCancel?: () => void;
  initialSafras?: Safra[];
}

const ASSET_CATEGORIES = [
  { value: "PROPRIEDADE_RURAL", label: "Propriedade Rural (Área)" },
  { value: "EQUIPAMENTO", label: "Equipamento" },
  {
    value: "TRATOR_COLHEITADEIRA_PULVERIZADOR",
    label: "Trator/Colheitadeira/Pulverizador",
  },
  { value: "AERONAVE", label: "Aeronave" },
  { value: "VEICULO", label: "Veículo" },
  { value: "BENFEITORIA", label: "Benfeitoria" },
  { value: "INVESTIMENTO_SOLO", label: "Investimento em Solo" },
  { value: "OUTROS", label: "Outros" },
];

export function AssetSaleForm({
  organizationId,
  initialData,
  onSuccess,
  onCancel,
  initialSafras = [],
}: AssetSaleFormClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData?.id;

  // Transform safras to match expected format
  const harvests = initialSafras.map(h => ({ 
    id: h.id, 
    nome: h.nome,
    ano_inicio: h.ano_inicio,
    ano_fim: h.ano_fim
  }));

  const form = useForm<MultiSafraAssetSaleFormValues>({
    resolver: zodResolver(multiSafraAssetSaleFormSchema) as any,
    defaultValues: {
      tipo: (initialData?.tipo || "REALIZADO") as "REALIZADO" | "PLANEJADO",
      categoria: initialData?.categoria || "",
      vendas_por_safra: {},
    },
  });

  const onSubmit = async (values: MultiSafraAssetSaleFormValues) => {
    setIsSubmitting(true);
    try {
      const newAssetSales = await createMultiSafraAssetSales(
        organizationId,
        values
      );
      
      if ("error" in newAssetSales) {
        toast.error(newAssetSales.error);
        return;
      }
      
      toast.success(
        `${Object.keys(values.vendas_por_safra).length} venda(s) de ativo criada(s) com sucesso!`
      );

      if (onSuccess) {
        onSuccess(newAssetSales.data || []);
      }
    } catch (error) {
      console.error("Erro ao criar vendas de ativos:", error);
      toast.error("Ocorreu um erro ao criar as vendas de ativos.");
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
                      {ASSET_CATEGORIES.map((category) => (
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

        {/* Asset Sale Editor */}
        <FormField
          control={form.control}
          name="vendas_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraAssetSaleEditor
                label="Vendas por Safra"
                description="Defina as vendas para cada safra"
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
            {isSubmitting ? "Salvando..." : "Salvar Vendas"}
          </Button>
        </div>
      </form>
    </Form>
  );
}