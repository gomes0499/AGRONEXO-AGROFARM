"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  DollarSign,
  CalendarIcon,
  Leaf,
  Settings,
  Tag,
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  type ProductionCost,
  type ProductionCostFormValues,
  productionCostFormSchema,
  type Culture,
  type System,
  type Harvest,
} from "@/schemas/production";
import {
  createProductionCost,
  updateProductionCost,
} from "@/lib/actions/production-actions";
import { formatCurrency, parseFormattedNumber } from "@/lib/utils/formatters";

interface ProductionCostFormProps {
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  organizationId: string;
  cost?: ProductionCost | null;
  onSuccess?: (cost: ProductionCost) => void;
  onCancel?: () => void;
}

// Categorias de custo com ícones e cores
const COST_CATEGORIES = [
  {
    value: "CALCARIO",
    label: "Calcário",
    color: "bg-stone-100 text-stone-900",
    group: "Insumos",
  },
  {
    value: "FERTILIZANTE",
    label: "Fertilizante",
    color: "bg-green-100 text-green-900",
    group: "Insumos",
  },
  {
    value: "SEMENTES",
    label: "Sementes",
    color: "bg-amber-100 text-amber-900",
    group: "Insumos",
  },
  {
    value: "TRATAMENTO_SEMENTES",
    label: "Tratamento de Sementes",
    color: "bg-yellow-100 text-yellow-900",
    group: "Insumos",
  },
  {
    value: "HERBICIDA",
    label: "Herbicida",
    color: "bg-red-100 text-red-900",
    group: "Defensivos",
  },
  {
    value: "INSETICIDA",
    label: "Inseticida",
    color: "bg-orange-100 text-orange-900",
    group: "Defensivos",
  },
  {
    value: "FUNGICIDA",
    label: "Fungicida",
    color: "bg-blue-100 text-blue-900",
    group: "Defensivos",
  },
  {
    value: "BENEFICIAMENTO",
    label: "Beneficiamento",
    color: "bg-indigo-100 text-indigo-900",
    group: "Operações",
  },
  {
    value: "SERVICOS",
    label: "Serviços",
    color: "bg-purple-100 text-purple-900",
    group: "Operações",
  },
  {
    value: "ADMINISTRATIVO",
    label: "Administrativo",
    color: "bg-gray-100 text-gray-900",
    group: "Gestão",
  },
  {
    value: "OUTROS",
    label: "Outros",
    color: "bg-slate-100 text-slate-900",
    group: "Diversos",
  },
];

// Agrupar categorias por grupo
const CATEGORY_GROUPS = COST_CATEGORIES.reduce<
  Record<string, typeof COST_CATEGORIES>
>((acc, category) => {
  if (!acc[category.group]) {
    acc[category.group] = [];
  }
  acc[category.group].push(category);
  return acc;
}, {});

export function ProductionCostForm({
  cultures,
  systems,
  harvests,
  organizationId,
  cost = null,
  onSuccess,
  onCancel,
}: ProductionCostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const isEditing = !!cost?.id;

  const form = useForm<ProductionCostFormValues>({
    resolver: zodResolver(productionCostFormSchema),
    defaultValues: {
      cultura_id: cost?.cultura_id || "",
      sistema_id: cost?.sistema_id || "",
      safra_id: cost?.safra_id || "",
      categoria: (cost?.categoria as any) || "OUTROS",
      valor: cost?.valor || 0,
    },
  });

  // Atualizar a categoria selecionada quando o formulário mudar
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "categoria") {
        setSelectedCategory(value.categoria as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Inicializar a categoria selecionada
  useEffect(() => {
    setSelectedCategory(form.getValues("categoria"));
  }, [form]);

  // Encontrar detalhes da categoria selecionada
  const selectedCategoryDetails = COST_CATEGORIES.find(
    (cat) => cat.value === selectedCategory
  );

  // Encontrar detalhes da cultura, sistema e safra selecionados
  const selectedCulture = cultures.find(
    (c) => c.id === form.watch("cultura_id")
  );
  const selectedSystem = systems.find((s) => s.id === form.watch("sistema_id"));
  const selectedHarvest = harvests.find((h) => h.id === form.watch("safra_id"));

  const onSubmit = async (values: ProductionCostFormValues) => {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        // Atualizar item existente
        const updatedItem = await updateProductionCost(cost.id || "", values);
        toast.success("Custo atualizado com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Criar novo item
        const newItem = await createProductionCost(organizationId, values);
        toast.success("Custo criado com sucesso!");
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar custo:", error);
      toast.error("Ocorreu um erro ao salvar o custo.");
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
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Categoria
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CATEGORY_GROUPS).map(
                      ([group, categories]) => (
                        <div key={group}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {group}
                          </div>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    category.color.split(" ")[0]
                                  }`}
                                  aria-hidden="true"
                                />
                                {category.label}
                              </div>
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                        </div>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Valor (R$)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Digite o valor do custo"
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
                        // Se tiver um valor, formata ele ao sair do campo
                        if (field.value) {
                          const formattedValue = formatCurrency(field.value);
                          e.target.value = formattedValue;
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
                          ? formatCurrency(field.value)
                          : ""
                      }
                      disabled={isSubmitting}
                      className="pl-8"
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Valor do custo em reais (R$)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resumo das seleções */}
          {(selectedCategoryDetails ||
            selectedCulture ||
            selectedSystem ||
            selectedHarvest) && (
            <Card className="mt-4 bg-muted/30 border-muted">
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {selectedCategoryDetails && (
                    <div className="flex items-center gap-2">
                      <Badge
                        className={selectedCategoryDetails.color}
                        variant="secondary"
                      >
                        {selectedCategoryDetails.label}
                      </Badge>
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

                  {form.watch("valor") > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Valor:
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {formatCurrency(form.watch("valor"))}
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
