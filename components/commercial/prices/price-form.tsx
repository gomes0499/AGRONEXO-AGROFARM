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
import { parseFormattedNumber, formatCurrency } from "@/lib/utils/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorResponse } from '@/utils/error-handler';

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

  // Função para lidar com campos de preço formatados
  const handleFormattedPriceChange = (
    field: any,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const cleanValue = e.target.value.replace(/[^\d.,]/g, "");
    const numericValue = parseFormattedNumber(cleanValue);
    field.onChange(numericValue);
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
      if (result && 'error' in result) {
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
    <Form {...form as unknown as UseFormReturn<Record<string, any>>}>
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
                <FormField
                  control={form.control as any}
                  name="preco_soja_brl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Soja (R$/saca)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="preco_soja_usd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Soja (US$/saca)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="US$ 0.00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = field.value.toFixed(2);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? field.value.toFixed(2)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="dolar_soja"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dólar Soja (R$)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preços de Milho */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Milho</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="preco_milho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Milho (R$/saca)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="dolar_milho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dólar Milho (R$)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-4">
            {/* Preços de Algodão */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Algodão</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="preco_algodao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Algodão (US$/lb)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="US$ 0.0000"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = field.value.toFixed(4);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? field.value.toFixed(4)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="preco_algodao_bruto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Algodão Bruto (R$/@)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="dolar_algodao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dólar Algodão (R$)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preços do Caroço de Algodão */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Caroço de Algodão</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="preco_caroco_algodao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Caroço (R$/ton)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="preco_unitario_caroco_algodao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Unitário (R$/@)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dólar Fechamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Câmbio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="dolar_fechamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dólar Fechamento (R$)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          onChange={(e) => handleFormattedPriceChange(field, e)}
                          onBlur={(e) => {
                            field.onBlur();
                            if (field.value) {
                              e.target.value = formatCurrency(field.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (field.value) {
                              e.target.value = String(field.value);
                            }
                          }}
                          value={
                            field.value !== undefined && field.value !== null
                              ? formatCurrency(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
                          const cleanValue = e.target.value.replace(
                            /[^\d.,]/g,
                            ""
                          );
                          handleCustomPriceChange(commodity, cleanValue);
                        }}
                        onBlur={(e) => {
                          const value =
                            form.getValues("outros_precos")?.[commodity];
                          if (value) {
                            e.target.value = formatCurrency(value);
                          }
                        }}
                        onFocus={(e) => {
                          const value =
                            form.getValues("outros_precos")?.[commodity];
                          if (value) {
                            e.target.value = String(value);
                          }
                        }}
                        value={
                          currentValue !== undefined && currentValue !== null
                            ? formatCurrency(currentValue as number)
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
                  <Input placeholder="R$ 0,00" id="custom-commodity-value" />
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
                              <span>{formatCurrency(value as number)}</span>
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
