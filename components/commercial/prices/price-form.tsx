"use client";

import { useState } from "react";
import { useForm, SubmitHandler, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PriceFormValues, priceFormSchema, Price } from "@/schemas/commercial";
import { createPrice, updatePrice } from "@/lib/actions/commercial-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Harvest } from "@/schemas/production";
import { DatePicker } from "@/components/ui/datepicker";
import {
  parseFormattedNumber,
  formatCurrency,
  formatUsdCurrency,
} from "@/lib/utils/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorResponse } from "@/utils/error-handler";

interface PriceFormProps {
  harvests: Harvest[];
  organizationId: string;
  price?: Price;
  onSuccess?: (price: Price) => void;
  onCancel?: () => void;
}

// Define um tipo específico para os valores do formulário
type FormValues = {
  organizacao_id: string;
  safra_id: string;
  data_referencia: Date;
  dolar_algodao: number | null;
  dolar_milho: number | null;
  dolar_soja: number | null;
  dolar_fechamento: number | null;
  preco_algodao: number | null;
  preco_caroco_algodao: number | null;
  preco_unitario_caroco_algodao: number | null;
  preco_algodao_bruto: number | null;
  preco_milho: number | null;
  preco_soja_usd: number | null;
  preco_soja_brl: number | null;
  outros_precos: Record<string, number>;
};

// Função para lidar com campos de preço formatados
const handleFormattedPriceChange = (
  field: any,
  e: React.ChangeEvent<HTMLInputElement>
) => {
  // Remove tudo exceto dígitos, vírgulas e pontos
  const cleanValue = e.target.value.replace(/[^\d.,\-]/g, "");
  // Processa o valor numérico (funciona tanto para formato R$ quanto US$)
  const numericValue = parseFormattedNumber(cleanValue);
  field.onChange(numericValue);
};

// Componente reutilizável para campos de moeda
const CurrencyField = ({
  name,
  label,
  control,
  placeholder = "R$ 0,00",
  formatter = formatCurrency,
  decimals = 2,
}: {
  name: string;
  label: string;
  control: any;
  placeholder?: string;
  formatter?: (value: number, decimals?: number) => string;
  decimals?: number;
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => {
      // Track input focus state
      const [isFocused, setIsFocused] = useState(false);

      return (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              onChange={(e) => {
                // Allow continuous typing by preserving the raw input, including decimals
                // Keep the raw input exactly as typed, including commas and dots
                const rawValue = e.target.value.replace(/[^\d.,\-]/g, "");
                
                // Only process to numeric when we have a valid number
                const numericValue = parseFormattedNumber(rawValue);
                
                // Update the field value with the parsed number (can be null)
                field.onChange(numericValue);
                
                // Keep cursor position and improve typing experience
                if (rawValue !== e.target.value) {
                  const cursorPos = e.target.selectionStart || 0;
                  setTimeout(() => {
                    e.target.setSelectionRange(cursorPos, cursorPos);
                  }, 0);
                }
              }}
              onBlur={(e) => {
                setIsFocused(false);
                field.onBlur();
                if (field.value !== undefined && field.value !== null) {
                  // Make sure to format with the correct number of decimal places
                  e.target.value = formatter(field.value, decimals);
                }
              }}
              onFocus={(e) => {
                setIsFocused(true);
                if (field.value) {
                  // Show raw value without formatting, but preserve decimal places
                  const absValue = Math.abs(field.value);
                  
                  // Determine appropriate decimal places based on the value
                  const decimalPlaces = decimals;
                  
                  // Format with explicit decimal places to make it easier to edit
                  e.target.value = absValue.toFixed(decimalPlaces);
                } else {
                  e.target.value = "";
                }
              }}
              value={
                isFocused
                  ? field.value !== undefined && field.value !== null
                    ? Math.abs(field.value).toFixed(decimals)
                    : ""
                  : field.value !== undefined && field.value !== null
                  ? formatter(field.value, decimals)
                  : ""
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      );
    }}
  />
);

export function PriceForm({
  harvests,
  organizationId,
  price,
  onSuccess,
  onCancel,
}: PriceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("principal");
  const isEditing = !!price?.id;

  // Preparar valores iniciais
  const defaultValues: Partial<FormValues> = {
    organizacao_id: organizationId,
    safra_id: price?.safra_id || "",
    data_referencia: price?.data_referencia
      ? new Date(price.data_referencia)
      : new Date(),
    dolar_algodao: price?.dolar_algodao || null,
    dolar_milho: price?.dolar_milho || null,
    dolar_soja: price?.dolar_soja || null,
    dolar_fechamento: price?.dolar_fechamento || null,
    preco_algodao: price?.preco_algodao || null,
    preco_caroco_algodao: price?.preco_caroco_algodao || null,
    preco_unitario_caroco_algodao: price?.preco_unitario_caroco_algodao || null,
    preco_algodao_bruto: price?.preco_algodao_bruto || null,
    preco_milho: price?.preco_milho || null,
    preco_soja_usd: price?.preco_soja_usd || null,
    preco_soja_brl: price?.preco_soja_brl || null,
    outros_precos: price?.outros_precos || {},
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(priceFormSchema) as any,
    defaultValues,
  });

  // Função para manipular outros preços
  const handleCustomPriceChange = (commodity: string, value: string) => {
    const numericValue = parseFormattedNumber(value) || 0; // Garante que nunca será null
    const currentOutrosPrecos = form.getValues("outros_precos") || {};

    form.setValue("outros_precos", {
      ...currentOutrosPrecos,
      [commodity]: numericValue,
    });
  };

  // Função de submit
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setIsSubmitting(true);

      let result;
      if (isEditing && price?.id) {
        result = await updatePrice(price.id, values);
      } else {
        result = await createPrice(organizationId, values);
      }

      // Verifica se o resultado é um erro
      if (result && "error" in result) {
        console.error("Erro da API:", result.message);
        // Aqui você poderia mostrar um toast ou mensagem de erro
        return;
      }

      if (onSuccess && result) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Erro ao salvar preço:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...(form as unknown as UseFormReturn<Record<string, any>>)}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="principal">Principal</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="outros">Outros Preços</TabsTrigger>
          </TabsList>

          <TabsContent value="principal" className="space-y-4">
            {/* Campos principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectTrigger>
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

              <FormField
                control={form.control as any}
                name="data_referencia"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Referência</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={(date) => date && field.onChange(date)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preços de Soja */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Soja</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CurrencyField
                  name="preco_soja_brl"
                  label="Preço Soja (R$/saca)"
                  control={form.control as any}
                  placeholder="R$ 0,00"
                  formatter={formatCurrency}
                  decimals={2}
                />

                <CurrencyField
                  name="preco_soja_usd"
                  label="Preço Soja (US$/saca)"
                  control={form.control as any}
                  placeholder="US$ 0.00"
                  formatter={formatUsdCurrency}
                  decimals={2}
                />

                <CurrencyField
                  name="dolar_soja"
                  label="Dólar Soja (R$)"
                  control={form.control as any}
                  formatter={formatCurrency}
                  placeholder="R$ 0,00"
                  decimals={2}
                />
              </div>
            </div>

            {/* Preços de Milho */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Milho</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField
                  name="preco_milho"
                  label="Preço Milho (R$/saca)"
                  control={form.control as any}
                  formatter={formatCurrency}
                  placeholder="R$ 0,00"
                  decimals={2}
                />

                <CurrencyField
                  name="dolar_milho"
                  label="Dólar Milho (R$)"
                  control={form.control as any}
                  formatter={formatCurrency}
                  placeholder="R$ 0,00"
                  decimals={2}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-4">
            {/* Preços de Algodão */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Algodão</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField
                  name="preco_algodao"
                  label="Preço Algodão (US$/lb)"
                  control={form.control as any}
                  formatter={(value) => formatUsdCurrency(value, 4)}
                  decimals={4}
                  placeholder="US$ 0.0000"
                />

                <CurrencyField
                  name="preco_algodao_bruto"
                  label="Preço Algodão Bruto (R$/@)"
                  control={form.control as any}
                  formatter={formatCurrency}
                  placeholder="R$ 0,00"
                  decimals={2}
                />

                <CurrencyField
                  name="dolar_algodao"
                  label="Dólar Algodão (R$)"
                  control={form.control as any}
                  formatter={formatCurrency}
                  placeholder="R$ 0,00"
                  decimals={2}
                />
              </div>
            </div>

            {/* Preços do Caroço de Algodão */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Caroço de Algodão</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField
                  name="preco_caroco_algodao"
                  label="Preço Caroço (R$/ton)"
                  control={form.control as any}
                  formatter={formatCurrency}
                  placeholder="R$ 0,00"
                  decimals={2}
                />

                <CurrencyField
                  name="preco_unitario_caroco_algodao"
                  label="Preço Unitário (R$/@)"
                  control={form.control as any}
                  formatter={formatCurrency}
                  placeholder="R$ 0,00"
                  decimals={2}
                />
              </div>
            </div>

            {/* Dólar Fechamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Câmbio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField
                  name="dolar_fechamento"
                  label="Dólar Fechamento (R$)"
                  control={form.control as any}
                  formatter={formatCurrency}
                  placeholder="R$ 0,00"
                  decimals={2}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outros" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Outras Commodities</h3>
              <p className="text-sm text-muted-foreground">
                Registre preços de outras commodities relevantes para seu
                negócio
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Campos para outras commodities */}
                {["arroz", "sorgo", "cafe", "cacau"].map((commodity) => {
                  const currentValue =
                    form.getValues("outros_precos")?.[commodity] || "";
                  return (
                    <div key={commodity} className="space-y-2">
                      <FormLabel className="capitalize">{commodity}</FormLabel>
                      <Input
                        placeholder={`R$ 0,00`}
                        onChange={(e) => {
                          // Allow continuous typing by preserving the raw input including decimal values
                          const rawValue = e.target.value.replace(
                            /[^\d.,\-]/g,
                            ""
                          );
                          // Parse to numeric value for storage
                          const numericValue = parseFormattedNumber(rawValue);
                          // Use the original raw value to support ongoing decimal entry
                          handleCustomPriceChange(commodity, rawValue);
                          
                          // Keep cursor position and improve typing experience
                          if (rawValue !== e.target.value) {
                            const cursorPos = e.target.selectionStart || 0;
                            setTimeout(() => {
                              e.target.setSelectionRange(cursorPos, cursorPos);
                            }, 0);
                          }
                        }}
                        onBlur={(e) => {
                          const value =
                            form.getValues("outros_precos")?.[commodity];
                          if (value) {
                            e.target.value = formatCurrency(value, 2);
                          }
                        }}
                        onFocus={(e) => {
                          const value =
                            form.getValues("outros_precos")?.[commodity];
                          if (value) {
                            // Show raw value without formatting but preserve decimal places
                            e.target.value = Math.abs(value).toFixed(2);
                          } else {
                            e.target.value = "";
                          }
                        }}
                        value={
                          currentValue !== undefined && currentValue !== null
                            ? formatCurrency(currentValue as number, 2)
                            : ""
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <FormLabel>Commodity Personalizada</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Nome da commodity"
                    id="custom-commodity-name"
                  />
                  <Input 
                    placeholder="R$ 0,00" 
                    id="custom-commodity-value"
                    onChange={(e) => {
                      // Allow continuous typing by preserving the raw input
                      const rawValue = e.target.value.replace(/[^\d.,\-]/g, "");
                      
                      // Keep cursor position and improve typing experience
                      if (rawValue !== e.target.value) {
                        const cursorPos = e.target.selectionStart || 0;
                        setTimeout(() => {
                          e.target.setSelectionRange(cursorPos, cursorPos);
                        }, 0);
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseFormattedNumber(e.target.value);
                      if (value) {
                        e.target.value = formatCurrency(value, 2);
                      }
                    }}
                    onFocus={(e) => {
                      // Show raw value without formatting when focused
                      const value = parseFormattedNumber(e.target.value);
                      if (value) {
                        e.target.value = Math.abs(value).toFixed(2);
                      } else {
                        e.target.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const nameInput = document.getElementById(
                        "custom-commodity-name"
                      ) as HTMLInputElement;
                      const valueInput = document.getElementById(
                        "custom-commodity-value"
                      ) as HTMLInputElement;

                      if (nameInput?.value && valueInput?.value) {
                        const commodityName = nameInput.value.toLowerCase();
                        handleCustomPriceChange(
                          commodityName,
                          valueInput.value
                        );
                        nameInput.value = "";
                        valueInput.value = "";
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">
                    Outras Commodities Adicionadas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {form.getValues("outros_precos") &&
                      Object.entries(form.getValues("outros_precos") || {})
                        .filter(
                          ([key]) =>
                            !["arroz", "sorgo", "cafe", "cacau"].includes(key)
                        )
                        .map(([commodity, value]) => (
                          <div
                            key={commodity}
                            className="flex justify-between items-center p-2 border rounded-md"
                          >
                            <span className="capitalize">{commodity}</span>
                            <div className="flex items-center gap-2">
                              <span>{formatCurrency(value as number, 2)}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentOutrosPrecos =
                                    form.getValues("outros_precos") || {};
                                  const { [commodity]: _, ...rest } =
                                    currentOutrosPrecos;
                                  form.setValue("outros_precos", rest);
                                }}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
