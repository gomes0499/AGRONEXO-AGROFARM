"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  CalendarIcon,
  Leaf,
  Settings,
  Scale,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  type Productivity,
  type ProductivityFormValues,
  productivityFormSchema,
  type Culture,
  type System,
  type Harvest,
} from "@/schemas/production";
import {
  createProductivity,
  updateProductivity,
} from "@/lib/actions/production-actions";
import { parseFormattedNumber } from "@/lib/utils/formatters";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface ProductivityFormProps {
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  organizationId: string;
  productivity?: Productivity | null;
  properties: Property[];
  onSuccess?: (productivity: Productivity) => void;
  onCancel?: () => void;
}

// Unidades de produtividade com descrições e conversões
const PRODUCTIVITY_UNITS = [
  {
    value: "sc/ha",
    label: "Sacas por Hectare",
    shortLabel: "sc/ha",
    conversionToKg: 60,
  },
  {
    value: "@/ha",
    label: "Arrobas por Hectare",
    shortLabel: "@/ha",
    conversionToKg: 15,
  },
  {
    value: "kg/ha",
    label: "Quilos por Hectare",
    shortLabel: "kg/ha",
    conversionToKg: 1,
  },
  {
    value: "ton/ha",
    label: "Toneladas por Hectare",
    shortLabel: "ton/ha",
    conversionToKg: 1000,
  },
];

export function ProductivityForm({
  cultures,
  systems,
  harvests,
  organizationId,
  productivity = null,
  properties,
  onSuccess,
  onCancel,
}: ProductivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [equivalentValues, setEquivalentValues] = useState<
    Record<string, number>
  >({});
  const isEditing = !!productivity?.id;

  const form = useForm<ProductivityFormValues>({
    resolver: zodResolver(productivityFormSchema),
    defaultValues: {
      cultura_id: productivity?.cultura_id || "",
      sistema_id: productivity?.sistema_id || "",
      safra_id: productivity?.safra_id || "",
      propriedade_id: productivity?.propriedade_id || "",
      produtividade: productivity?.produtividade || 0,
      unidade: (productivity?.unidade as any) || "sc/ha",
    },
  });

  // Atualizar a unidade selecionada quando o formulário mudar
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "unidade") {
        setSelectedUnit(value.unidade as string);
      }

      // Calcular valores equivalentes quando produtividade ou unidade mudar
      if (name === "produtividade" || name === "unidade") {
        calculateEquivalentValues(
          value.produtividade || 0,
          value.unidade as string
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Inicializar a unidade selecionada
  useEffect(() => {
    const unit = form.getValues("unidade");
    setSelectedUnit(unit);
    calculateEquivalentValues(form.getValues("produtividade"), unit);
  }, [form]);

  // Calcular valores equivalentes em outras unidades
  const calculateEquivalentValues = (value: number, unit: string) => {
    if (!value || !unit) return;

    const selectedUnitInfo = PRODUCTIVITY_UNITS.find((u) => u.value === unit);
    if (!selectedUnitInfo) return;

    // Converter para kg/ha primeiro
    const valueInKg = value * selectedUnitInfo.conversionToKg;

    // Calcular para todas as outras unidades
    const equivalents: Record<string, number> = {};
    PRODUCTIVITY_UNITS.forEach((unitInfo) => {
      if (unitInfo.value !== unit) {
        equivalents[unitInfo.value] = valueInKg / unitInfo.conversionToKg;
      }
    });

    setEquivalentValues(equivalents);
  };

  // Encontrar detalhes da cultura, sistema e safra selecionados
  const selectedCulture = cultures.find(
    (c) => c.id === form.watch("cultura_id")
  );
  const selectedSystem = systems.find((s) => s.id === form.watch("sistema_id"));
  const selectedHarvest = harvests.find((h) => h.id === form.watch("safra_id"));
  const selectedProperty = properties.find(
    (p) => p.id === form.watch("propriedade_id")
  );

  const onSubmit = async (values: ProductivityFormValues) => {
    try {
      setIsSubmitting(true);

      if (isEditing && productivity?.id) {
        // Atualizar item existente
        const updatedItem = await updateProductivity(productivity.id, values);
        toast.success("Registro de produtividade atualizado com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Criar novo item
        const newItem = await createProductivity(organizationId, values);
        toast.success("Registro de produtividade criado com sucesso!");
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar registro de produtividade:", error);
      toast.error("Ocorreu um erro ao salvar o registro de produtividade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="safra_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  Safra
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
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
                        <Badge variant="outline" className="ml-2 py-0 h-4">
                          Ativa
                        </Badge>
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
                    {properties.map((property: Property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.nome}
                        {property.cidade && property.estado && (
                          <span className="text-muted-foreground ml-1">
                            ({property.cidade}/{property.estado})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedProperty && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted">
              <p className="font-medium text-foreground">
                Propriedade selecionada:
              </p>
              <p className="mt-1">
                {selectedProperty.nome}
                {selectedProperty.cidade && selectedProperty.estado && (
                  <span>
                    {" "}
                    - {selectedProperty.cidade}/{selectedProperty.estado}
                  </span>
                )}
              </p>
              {selectedProperty.areaTotal && (
                <p className="mt-1">
                  Área total: {selectedProperty.areaTotal} hectares
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cultura_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    Cultura
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
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

            <FormField
              control={form.control}
              name="sistema_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Sistema
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o sistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id || ""}>
                          {system.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="produtividade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Produção total
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Digite a produtividade"
                        {...field}
                        onChange={(e) => {
                          // Limpa a formatação e pega apenas números e vírgulas
                          const cleanValue = e.target.value.replace(
                            /[^\d.,]/g,
                            ""
                          );
                          // Converte para número para armazenar no form
                          const numericValue = parseFormattedNumber(cleanValue);
                          field.onChange(numericValue);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          // Formatar com 2 casas decimais ao sair do campo
                          if (field.value) {
                            e.target.value = field.value.toFixed(2);
                          }
                        }}
                        onFocus={(e) => {
                          // Quando ganhar foco, mostra apenas o número sem formatação
                          if (field.value) {
                            e.target.value = field.value.toString();
                          }
                        }}
                        value={
                          field.value !== undefined && field.value !== null
                            ? field.value
                            : ""
                        }
                        disabled={isSubmitting}
                        className="w-full"
                      />
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    Unidade
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRODUCTIVITY_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label} ({unit.shortLabel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Resumo e conversões */}
          {form.watch("produtividade") > 0 &&
            Object.keys(equivalentValues).length > 0 && (
              <Card className="mt-2 bg-muted/30 border-muted">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {selectedProperty && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Propriedade:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedProperty.nome}
                        </span>
                      </div>
                    )}

                    {selectedCulture && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Cultura:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedCulture.nome}
                        </span>
                      </div>
                    )}

                    {selectedHarvest && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Safra:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedHarvest.nome}
                        </span>
                      </div>
                    )}

                    {selectedSystem && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Sistema:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedSystem.nome}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-2" />

                  <div className="text-xs font-medium text-muted-foreground mb-1.5">
                    Equivalente a:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(equivalentValues).map(([unit, value]) => {
                      const unitInfo = PRODUCTIVITY_UNITS.find(
                        (u) => u.value === unit
                      );
                      return (
                        <Badge
                          key={unit}
                          variant="outline"
                          className="font-normal"
                        >
                          {value.toFixed(2)} {unitInfo?.shortLabel}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
