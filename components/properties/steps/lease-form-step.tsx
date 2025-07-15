"use client";

import { useEffect, useState } from "react";
import {
  Building,
  User,
  Calendar,
  Hash,
  Ruler,
  DollarSign,
  MapPin,
  FileText,
} from "lucide-react";
import { SafraFinancialEditorAllVisible } from "@/components/financial/common/safra-financial-editor-all-visible";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/datepicker";
import {
  formatArea,
  formatSacas,
  parseFormattedNumber,
} from "@/lib/utils/formatters";
import { getSafras } from "@/lib/actions/property-actions";
import { getCommodityPriceProjections } from "@/lib/actions/production-prices-actions";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { LeaseFormValues } from "@/schemas/properties";

interface LeaseFormStepProps {
  form: UseFormReturn<any>;
  organizationId: string;
}

export function LeaseFormStep({ form, organizationId }: LeaseFormStepProps) {
  const [safras, setSafras] = useState<any[]>([]);
  const [isLoadingSafras, setIsLoadingSafras] = useState(false);
  const [commodityPrices, setCommodityPrices] = useState<any[]>([]);

  // Buscar safras disponíveis
  useEffect(() => {
    const fetchSafras = async () => {
      if (!organizationId) {
        console.error("ID da organização não fornecido");
        return;
      }

      try {
        setIsLoadingSafras(true);

        const safrasList = await getSafras(organizationId);
        setSafras(safrasList);
      } catch (error) {
        console.error("Erro ao buscar safras:", error);
        toast.error("Não foi possível carregar as safras");
      } finally {
        setIsLoadingSafras(false);
      }
    };

    fetchSafras();
  }, [organizationId]);

  // Buscar preços de commodities
  useEffect(() => {
    const fetchCommodityPrices = async () => {
      try {
        const result = await getCommodityPriceProjections();
        if (result.data && Array.isArray(result.data)) {
          setCommodityPrices(result.data);
        }
      } catch (error) {
        console.error("Erro ao buscar preços:", error);
      }
    };

    if (organizationId) {
      fetchCommodityPrices();
    }
  }, [organizationId]);

  // Calcular valores por safra automaticamente
  useEffect(() => {
    const areaArrendada = form.watch("area_arrendada");
    const custoHectare = form.watch("custo_hectare");

    if (areaArrendada && custoHectare && safras.length > 0) {
      const custosPorAno: Record<string, number> = {};
      const sacasTotal = areaArrendada * custoHectare;

      // Se temos preços de commodities, tentar usar
      if (commodityPrices.length > 0) {
        let sojaPrices = commodityPrices.find((p) => {
          const match =
            p.commodity_type === "SOJA_SEQUEIRO" ||
            (p.cultura &&
              p.cultura.nome &&
              p.cultura.nome.toLowerCase() === "soja" &&
              p.sistema &&
              p.sistema.nome &&
              p.sistema.nome.toLowerCase() === "sequeiro");

          return match;
        });

        // Se não encontrar sequeiro, tentar irrigado como fallback
        if (!sojaPrices) {
          sojaPrices = commodityPrices.find(
            (p) =>
              p.commodity_type === "SOJA_IRRIGADO" ||
              (p.cultura &&
                p.cultura.nome &&
                p.cultura.nome.toLowerCase() === "soja" &&
                p.sistema &&
                p.sistema.nome &&
                p.sistema.nome.toLowerCase() === "irrigado")
          );
        }

        if (sojaPrices && sojaPrices.precos_por_ano) {
          // Calcular para cada safra
          safras.forEach((safra) => {
            if (!safra.id) {
              console.error("Safra sem ID:", safra);
              return;
            }

            let precoSafra = 0;

            // Buscar preço por ID da safra (padrão do sistema)
            if (
              sojaPrices.precos_por_ano &&
              sojaPrices.precos_por_ano[safra.id]
            ) {
              precoSafra = sojaPrices.precos_por_ano[safra.id];
            }

            // Se não encontrar por ID, tentar por ano como fallback
            if (!precoSafra && safra.ano_inicio && sojaPrices.precos_por_ano) {
              const anoStr = safra.ano_inicio.toString();
              precoSafra = sojaPrices.precos_por_ano[anoStr] || 0;
            }

            // Se ainda não encontrar, usar preço atual como fallback
            if (!precoSafra && sojaPrices.current_price) {
              precoSafra = sojaPrices.current_price;
            }

            // Se ainda não tiver preço, usar padrão
            if (!precoSafra) {
              precoSafra = 150; // R$ 150 por saca como padrão
            }

            // Calcular o valor total: sacas/ha * área * preço da saca
            const valorTotal = sacasTotal * precoSafra;

            // Usar o ID da safra como chave (requerido pelo banco)
            custosPorAno[safra.id] = valorTotal;
          });
        } else {
          // Usar preço padrão se não encontrar preços de soja
          safras.forEach((safra) => {
            if (safra.id) {
              custosPorAno[safra.id] = sacasTotal * 150; // R$ 150 por saca
            }
          });
        }
      } else {
        // Se não há preços de commodities, usar valor padrão
        safras.forEach((safra) => {
          if (safra.id) {
            custosPorAno[safra.id] = sacasTotal * 150; // R$ 150 por saca
          }
        });
      }

      // Só atualizar se temos valores calculados
      if (Object.keys(custosPorAno).length > 0) {
        form.setValue("custos_por_ano", custosPorAno);
      }
    }
  }, [
    form.watch("area_arrendada"),
    form.watch("custo_hectare"),
    safras,
    commodityPrices,
  ]);

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="numero_arrendamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Número do Arrendamento*
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex: ARR001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome_fazenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Nome da Fazenda*
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fazenda São João" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="arrendantes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Arrendantes*
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Nome dos arrendantes/proprietários"
                {...field}
                className="resize-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* Período do Contrato */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Período do Contrato
        </h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="data_inicio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Data de Início*
                </FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  placeholder="Data de início"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_termino"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Data de Término*
                </FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  placeholder="Selecione a data de término"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Áreas */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Áreas</h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="area_fazenda"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  Área Total da Fazenda (ha)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    value={field.value || ""}
                    readOnly={true} // Somente leitura, preenchido automaticamente
                    className="bg-muted"
                  />
                </FormControl>
                <FormDescription>
                  Em hectares (preenchido automaticamente)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_arrendada"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  Área Arrendada (ha)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Digite a área arrendada (ex: 150.50)"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    onBlur={field.onBlur}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Em hectares (utilize ponto para casas decimais)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Custos */}
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="tipo_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Tipo de Pagamento*
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SACAS">Sacas</SelectItem>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    <SelectItem value="MISTO">Misto</SelectItem>
                    <SelectItem value="PERCENTUAL_PRODUCAO">
                      % da Produção
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Forma de pagamento do arrendamento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="custo_hectare"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Custo por Hectare (sacas)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Digite o custo por hectare (ex: 13.50)"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    onBlur={field.onBlur}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Em sacas por hectare (base: Soja Sequeiro)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Editor de custos por safra */}
        <FormField
          control={form.control}
          name="custos_por_ano"
          render={({ field }) => (
            <FormItem>
              <SafraFinancialEditorAllVisible
                label="Custos do Arrendamento por Safra"
                description="Valores calculados automaticamente: Custo/ha × Área × Preço da Soja"
                values={field.value || {}}
                onChange={field.onChange}
                safras={safras}
                disabled={true}
                currency="BRL"
              />
              {(!form.watch("area_arrendada") ||
                !form.watch("custo_hectare")) && (
                <p className="text-sm text-muted-foreground mt-2">
                  Preencha a área arrendada e o custo por hectare para calcular
                  os valores
                </p>
              )}
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Status do Contrato */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Status do Contrato
        </h4>
        <div className="grid gap-4 grid-cols-1">
          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Contrato Ativo</FormLabel>
                  <FormDescription>
                    Indica se o contrato de arrendamento está ativo
                  </FormDescription>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Observações
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações adicionais sobre o contrato"
                    className="resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Informações adicionais sobre o contrato
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
