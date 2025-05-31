"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSafras } from "@/lib/actions/production-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatCurrency } from "@/lib/utils/formatters";
import {
  createAssetSale,
  updateAssetSale,
} from "@/lib/actions/asset-sales-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { assetSaleFormSchema, type AssetSaleFormValues } from "@/schemas/patrimonio/asset-sales";

interface AssetSaleFormProps {
  organizationId: string;
  initialData?: any;
  onSuccess?: (assetSale: any) => void;
  onCancel?: () => void;
}

const ASSET_CATEGORIES = [
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
}: AssetSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [harvests, setHarvests] = useState<Array<{ id: string; nome: string }>>([]);
  const [isLoadingHarvests, setIsLoadingHarvests] = useState(false);
  const isEditing = !!initialData?.id;

  // Carregar safras
  useEffect(() => {
    async function loadHarvests() {
      try {
        setIsLoadingHarvests(true);
        const harvestsData = await getSafras(organizationId);
        setHarvests(harvestsData.map(h => ({ id: h.id, nome: h.nome })));
      } catch (error) {
        console.error("Erro ao carregar safras:", error);
      } finally {
        setIsLoadingHarvests(false);
      }
    }
    loadHarvests();
  }, [organizationId]);

  const form = useForm<AssetSaleFormValues>({
    resolver: zodResolver(assetSaleFormSchema),
    defaultValues: {
      categoria: initialData?.categoria || "",
      quantidade: initialData?.quantidade || 1,
      valor_unitario: initialData?.valor_unitario || 0,
      tipo: initialData?.tipo || "REALIZADO",
      safra_id: initialData?.safra_id || "",
      ano: initialData?.ano || new Date().getFullYear(), // Adicionar ano como valor padrão
    },
  });

  // Watch form values for calculations
  const quantidade = form.watch("quantidade") || 0;
  const valorUnitario = form.watch("valor_unitario") || 0;

  const valorTotal = useMemo(() => {
    return quantidade * valorUnitario;
  }, [quantidade, valorUnitario]);

  const onSubmit = async (values: AssetSaleFormValues) => {
    try {
      console.log("Form submitted with values:", values);
      setIsSubmitting(true);

      const dataToSubmit = {
        organizacao_id: organizationId,
        ...values,
        // Usar o ano informado ou o ano atual se não houver
        ano: values.ano || new Date().getFullYear(),
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateAssetSale(initialData.id, dataToSubmit);
      } else {
        result = await createAssetSale(dataToSubmit);
      }

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Venda de ativo atualizada com sucesso!" : "Venda de ativo criada com sucesso!");
      onSuccess?.(result.data);
    } catch (error) {
      console.error("Erro ao salvar venda de ativo:", error);
      toast.error("Erro ao salvar venda de ativo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log("Form submitted, calling handleSubmit");
          form.handleSubmit(onSubmit)(e);
        }} 
        className="space-y-4">
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
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Realizado
                    </div>
                  </SelectItem>
                  <SelectItem value="PLANEJADO">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
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
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ex: 1"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
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

        {valorTotal > 0 && (
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Valor Total:</span>
            <span className="text-lg font-semibold text-primary">
              {formatCurrency(valorTotal)}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            disabled={isSubmitting}
            onClick={() => {
              console.log("Submit button clicked, triggering validation");
              console.log("Form state:", form.getValues());
              // Validar o formulário manualmente
              form.trigger().then((isValid) => {
                console.log("Form validation result:", isValid);
                if (isValid) {
                  const values = form.getValues();
                  onSubmit(values);
                } else {
                  console.error("Form validation failed:", form.formState.errors);
                  toast.error("Por favor, preencha corretamente todos os campos obrigatórios.");
                }
              });
            }}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
