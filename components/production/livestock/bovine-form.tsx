"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  MapPin,
  Users,
  Calendar,
  Scale,
  DollarSign,
  Globe,
  Calculator,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  type BovineFormValues,
  bovineFormSchema,
  type BovineAgeRange,
} from "@/schemas/production";
import { createLivestock } from "@/lib/actions/production-actions";
import { formatCurrency } from "@/lib/utils/formatters";

// Interface para propriedade
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface BovineFormProps {
  properties: Property[];
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Labels para faixas etárias
const AGE_RANGE_LABELS: Record<BovineAgeRange, string> = {
  "0_12": "0 a 12 meses",
  "13_24": "13 a 24 meses",
  "25_36": "25 a 36 meses",
  ACIMA_36: "Acima de 36 meses",
};

// Peso médio por faixa etária e sexo (em kg)
const PESO_MEDIO_REFERENCIA: Record<
  BovineAgeRange,
  { macho: number; femea: number }
> = {
  "0_12": { macho: 180, femea: 160 }, // Bezerro/Bezerra
  "13_24": { macho: 330, femea: 290 }, // Novilho/Novilha jovem
  "25_36": { macho: 450, femea: 380 }, // Novilho/Novilha
  ACIMA_36: { macho: 550, femea: 450 }, // Boi/Vaca
};

// 1 arroba = 15kg
const KG_POR_ARROBA = 15;

export function BovineForm({
  properties,
  organizationId,
  onSuccess,
  onCancel,
}: BovineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arrobas, setArrobas] = useState<number>(0);
  const [valorTotal, setValorTotal] = useState<number>(0);

  const form = useForm<BovineFormValues>({
    resolver: zodResolver(bovineFormSchema),
    defaultValues: {
      propriedade_id: "",
      sexo: "MACHO",
      faixa_etaria: "0_12",
      quantidade: 1,
      peso_medio: undefined,
      valor_arroba: undefined,
    },
  });

  // Calcular arrobas e valor total
  const calcularArrobasEValor = (
    quantidade: number,
    pesoMedio: number | undefined,
    valorArroba: number | undefined
  ) => {
    if (quantidade && pesoMedio) {
      const pesoTotal = quantidade * pesoMedio;
      const totalArrobas = pesoTotal / KG_POR_ARROBA;
      setArrobas(totalArrobas);

      if (valorArroba) {
        const total = totalArrobas * valorArroba;
        setValorTotal(total);
      } else {
        setValorTotal(0);
      }
    } else {
      setArrobas(0);
      setValorTotal(0);
    }
  };

  // Atualizar peso médio de referência quando mudar sexo ou faixa etária
  const sexo = form.watch("sexo");
  const faixaEtaria = form.watch("faixa_etaria");
  const quantidade = form.watch("quantidade");
  const pesoMedio = form.watch("peso_medio");
  const valorArroba = form.watch("valor_arroba");

  // Recalcular quando valores mudarem
  useState(() => {
    calcularArrobasEValor(quantidade, pesoMedio, valorArroba);
  });

  const onSubmit = async (values: BovineFormValues) => {
    try {
      setIsSubmitting(true);

      // Se selecionou "all", passar undefined para propriedade_id
      const propriedadeId =
        values.propriedade_id === "all" ? undefined : values.propriedade_id;

      // Criar categoria baseada na faixa etária e sexo
      let categoria = "";
      if (values.sexo === "MACHO") {
        switch (values.faixa_etaria) {
          case "0_12":
            categoria = "Bezerro";
            break;
          case "13_24":
          case "25_36":
            categoria = "Novilho";
            break;
          case "ACIMA_36":
            categoria = "Boi";
            break;
        }
      } else {
        switch (values.faixa_etaria) {
          case "0_12":
            categoria = "Bezerra";
            break;
          case "13_24":
          case "25_36":
            categoria = "Novilha";
            break;
          case "ACIMA_36":
            categoria = "Vaca";
            break;
        }
      }

      // Criar registro usando a estrutura de livestock existente
      const livestockData = {
        tipo_animal: "Bovino",
        categoria: `${categoria} (${AGE_RANGE_LABELS[values.faixa_etaria]})`,
        quantidade: values.quantidade,
        preco_unitario: valorTotal / values.quantidade, // Preço por cabeça
        unidade_preco: "CABECA" as const,
        numero_cabecas: values.quantidade,
        propriedade_id: propriedadeId || "",
      };

      await createLivestock(organizationId, livestockData);

      toast.success(
        values.propriedade_id === "all"
          ? `${values.quantidade} bovino(s) cadastrado(s) para todas as propriedades!`
          : `${values.quantidade} bovino(s) cadastrado(s) com sucesso!`
      );

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao cadastrar bovinos:", error);
      toast.error("Erro ao cadastrar bovinos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Propriedade */}
        <FormField
          control={form.control}
          name="propriedade_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Propriedade
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a propriedade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="font-medium">Todas as Propriedades</span>
                    </div>
                  </SelectItem>
                  <Separator className="my-1" />
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex flex-col">
                        <span>{property.nome}</span>
                        {property.cidade && property.estado && (
                          <span className="text-xs text-muted-foreground">
                            {property.cidade}/{property.estado}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {field.value === "all" && (
                <FormDescription className="text-xs mt-1">
                  O rebanho será consolidado para todas as propriedades
                </FormDescription>
              )}
            </FormItem>
          )}
        />

        <Separator />

        {/* Sexo e Faixa Etária */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sexo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Sexo
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MACHO">Macho</SelectItem>
                    <SelectItem value="FEMEA">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="faixa_etaria"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Faixa Etária
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a faixa etária" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(AGE_RANGE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Quantidade e Peso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Quantidade de Cabeças
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 50"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      field.onChange(value);
                      calcularArrobasEValor(value, pesoMedio, valorArroba);
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="peso_medio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Peso Médio (kg)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={`Sugestão: ${
                      PESO_MEDIO_REFERENCIA[faixaEtaria][
                        sexo.toLowerCase() as "macho" | "femea"
                      ]
                    } kg`}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                      calcularArrobasEValor(quantidade, value, valorArroba);
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Peso médio de referência:{" "}
                  {
                    PESO_MEDIO_REFERENCIA[faixaEtaria][
                      sexo.toLowerCase() as "macho" | "femea"
                    ]
                  }{" "}
                  kg
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Valor da Arroba */}
        <FormField
          control={form.control}
          name="valor_arroba"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Valor da Arroba (R$/@)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 280.00"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    field.onChange(value);
                    calcularArrobasEValor(quantidade, pesoMedio, value);
                  }}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Resumo de Cálculos */}
        {(arrobas > 0 || valorTotal > 0) && (
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h4 className="text-sm font-medium">Resumo do Cálculo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Total de Arrobas:
                      </span>
                      <p className="font-medium">{arrobas.toFixed(2)} @</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Valor Total:
                      </span>
                      <p className="font-medium">
                        {formatCurrency(valorTotal)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Valor por Cabeça:
                      </span>
                      <p className="font-medium">
                        {quantidade > 0
                          ? formatCurrency(valorTotal / quantidade)
                          : "R$ 0,00"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info sobre cálculo */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p>
              O cálculo de arrobas é feito com base no peso total do rebanho
              (quantidade × peso médio).
            </p>
            <p className="mt-1">1 arroba (@) = 15 kg</p>
          </div>
        </div>

        <Separator />

        {/* Botões de Ação */}
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
            Cadastrar Bovinos
          </Button>
        </div>
      </form>
    </Form>
  );
}
