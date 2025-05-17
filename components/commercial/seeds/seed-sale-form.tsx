"use client";

import { useState } from "react";
import { useForm, SubmitHandler, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  SeedSale,
  SeedSaleFormValues,
  seedSaleFormSchema,
} from "@/schemas/commercial";
import {
  createSeedSale,
  updateSeedSale,
} from "@/lib/actions/commercial-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Harvest } from "@/schemas/production";
import { Culture } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { CurrencyField } from "@/components/ui/currency-field";

interface SeedSaleFormProps {
  harvests: Harvest[];
  cultures: Culture[];
  properties: Property[];
  organizationId: string;
  seedSale?: SeedSale;
  onSuccess?: (seedSale: SeedSale) => void;
  onCancel?: () => void;
}

export function SeedSaleForm({
  harvests,
  cultures,
  properties,
  organizationId,
  seedSale,
  onSuccess,
  onCancel,
}: SeedSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!seedSale?.id;

  // Prepare initial values
  const defaultValues: Partial<SeedSaleFormValues> = {
    organizacao_id: organizationId,
    propriedade_id: seedSale?.propriedade_id || "",
    safra_id: seedSale?.safra_id || "",
    cultura_id: seedSale?.cultura_id || "",
    receita_operacional_bruta: seedSale?.receita_operacional_bruta || 0,
    impostos_vendas: seedSale?.impostos_vendas || 0,
    comissao_vendas: seedSale?.comissao_vendas || 0,
    logistica_entregas: seedSale?.logistica_entregas || 0,
    custo_mercadorias_vendidas: seedSale?.custo_mercadorias_vendidas || 0,
    despesas_gerais: seedSale?.despesas_gerais || 0,
    imposto_renda: seedSale?.imposto_renda || 0,
  };

  const form = useForm<SeedSaleFormValues>({
    resolver: zodResolver(seedSaleFormSchema) as any,
    defaultValues,
  });

  // Função de submit
  const onSubmit: SubmitHandler<SeedSaleFormValues> = async (values) => {
    try {
      setIsSubmitting(true);

      let result;
      if (isEditing && seedSale?.id) {
        result = await updateSeedSale(seedSale.id, values);
      } else {
        result = await createSeedSale(organizationId, values);
        toast.success("Venda de sementes criada com sucesso!");
      }

      // Verifica se o resultado é um erro
      if (result && "error" in result) {
        console.error("Erro da API:", result.message);
        toast.error("Ocorreu um erro ao salvar a venda de sementes.");
        return;
      }

      if (onSuccess && result) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Erro ao salvar venda de sementes:", error);
      toast.error("Ocorreu um erro ao salvar a venda de sementes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...(form as unknown as UseFormReturn<Record<string, any>>)}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Propriedade */}
            <FormField
              control={form.control as any}
              name="propriedade_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propriedade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a proprie.." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id || ""}>
                          {property.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Safra */}
            <FormField
              control={form.control as any}
              name="safra_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Safra</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a safra" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {harvests.map((harvest) => (
                        <SelectItem key={harvest.id} value={harvest.id || ""}>
                          {harvest.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Cultura */}
            <FormField
              control={form.control as any}
              name="cultura_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cultura</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a cultura" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cultures.map((culture) => (
                        <SelectItem key={culture.id} value={culture.id || ""}>
                          {culture.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Receitas e Custos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Receita Operacional Bruta */}
              <CurrencyField
                name="receita_operacional_bruta"
                label="Receita Operacional Bruta"
                control={form.control as any}
                isRevenue={true}
              />

              {/* Impostos sobre Vendas */}
              <CurrencyField
                name="impostos_vendas"
                label="Impostos sobre Vendas"
                control={form.control as any}
                isCost={true}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Comissão de Vendas */}
              <CurrencyField
                name="comissao_vendas"
                label="Comissão de Vendas"
                control={form.control as any}
                isCost={true}
              />

              {/* Logistica e Entregas */}
              <CurrencyField
                name="logistica_entregas"
                label="Logística e Entregas"
                control={form.control as any}
                isCost={true}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custo das Mercadorias Vendidas */}
              <CurrencyField
                name="custo_mercadorias_vendidas"
                label="Custo das Mercadorias Vendidas"
                control={form.control as any}
                isCost={true}
              />

              {/* Despesas Gerais */}
              <CurrencyField
                name="despesas_gerais"
                label="Despesas Gerais"
                control={form.control as any}
                isCost={true}
              />
            </div>

            {/* Imposto de Renda */}
            <CurrencyField
              name="imposto_renda"
              label="Imposto de Renda"
              control={form.control as any}
              isCost={true}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
