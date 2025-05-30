"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getSafras } from "@/lib/actions/production-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyField } from "@/components/shared/currency-field";
import { formatCurrency } from "@/lib/utils/formatters";
import { 
  LandAcquisitionFormValues,
  landAcquisitionFormSchema,
  type LandAcquisition
} from "@/schemas/patrimonio/land-acquisitions";
import { createLandPlan, updateLandPlan } from "@/lib/actions/patrimonio-actions";

interface LandPlanFormProps {
  organizationId: string;
  initialData?: LandAcquisition | null;
  onSubmit?: (data: LandAcquisition) => void;
  onCancel?: () => void;
}

export function LandPlanForm({ 
  organizationId, 
  initialData, 
  onSubmit, 
  onCancel 
}: LandPlanFormProps) {
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

  const form = useForm<LandAcquisitionFormValues>({
    resolver: zodResolver(landAcquisitionFormSchema),
    defaultValues: {
      nome_fazenda: initialData?.nome_fazenda || "",
      hectares: initialData?.hectares || 0,
      sacas: initialData?.sacas || 0,
      valor_total: initialData?.valor_total || 0,
      tipo: initialData?.tipo || "PLANEJADO",
      ano: initialData?.ano || new Date().getFullYear(),
      safra_id: initialData?.safra_id || "",
    }
  });

  const { watch } = form;
  const hectares = watch("hectares") || 0;
  const sacas = watch("sacas") || 0;

  const totalSacasCalculated = useMemo(() => {
    return hectares * sacas;
  }, [hectares, sacas]);

  const handleSubmit = async (values: LandAcquisitionFormValues) => {
    try {
      setIsSubmitting(true);
      
      const dataWithTotal = {
        ...values,
        ano: new Date().getFullYear(), // Usar ano atual já que removemos o campo
        total_sacas: totalSacasCalculated
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateLandPlan(initialData.id, dataWithTotal);
      } else {
        result = await createLandPlan(organizationId, dataWithTotal);
      }

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isEditing 
          ? "Aquisição de terra atualizada com sucesso!" 
          : "Aquisição de terra criada com sucesso!"
      );
      
      onSubmit?.(result.data);
    } catch (error) {
      toast.error("Erro ao salvar aquisição de terra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  <SelectItem value="PLANEJADO">Planejado</SelectItem>
                  <SelectItem value="REALIZADO">Realizado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome_fazenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Fazenda</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fazenda Santa Clara" {...field} />
              </FormControl>
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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="hectares"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hectares</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100.5"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sacas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sacas por Hectare</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 60"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Total de Sacas</label>
        <Input
          type="number"
          step="0.01"
          readOnly
          className="bg-muted"
          value={totalSacasCalculated}
        />
      </div>

      <CurrencyField
        name="valor_total"
        label="Valor Total"
        control={form.control}
        placeholder="R$ 0,00"
      />

      {totalSacasCalculated > 0 && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total de Sacas:</span>
              <span className="font-medium">{totalSacasCalculated} sacas</span>
            </div>
            {form.watch("valor_total") > 0 && (
              <div className="flex justify-between text-sm">
                <span>Valor por Saca:</span>
                <span className="font-medium">
                  {formatCurrency(
                    form.watch("valor_total") / totalSacasCalculated
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
