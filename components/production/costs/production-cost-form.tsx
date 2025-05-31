"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, DollarSign, Leaf, Settings, Tag, MapPin } from "lucide-react";
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
  productionCostFormSchema,
  type Culture,
  type System,
  type Harvest,
} from "@/schemas/production";

// Ajustando para omitir os campos que removemos do formulário
import { z } from "zod";
type ProductionCostFormValues = {
  propriedade_id: string;
  cultura_id: string;
  sistema_id: string;
  categoria: string;
  custos_por_safra: Record<string, number>;
};
import {
  createProductionCost,
  updateProductionCost,
} from "@/lib/actions/production-actions";
import { formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { SafraCostEditor } from "../common/safra-cost-editor";

// Define interface for the property entity
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface ProductionCostFormProps {
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  organizationId: string;
  cost?: ProductionCost | null;
  properties: Property[];
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
  properties,
  onSuccess,
  onCancel,
}: ProductionCostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const isEditing = !!cost?.id;

  // Initialize form with correct defaultValues based on the updated schema
  const form = useForm<ProductionCostFormValues>({
    resolver: zodResolver(productionCostFormSchema),
    defaultValues: {
      cultura_id: cost?.cultura_id || "",
      sistema_id: cost?.sistema_id || "",
      propriedade_id: cost?.propriedade_id || "",
      categoria: (cost?.categoria as any) || "OUTROS",
      custos_por_safra: cost?.custos_por_safra || {},
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

  // Encontrar detalhes da cultura, sistema e propriedade selecionados
  const selectedCulture = cultures.find(
    (c) => c.id === form.watch("cultura_id")
  );
  const selectedSystem = systems.find((s) => s.id === form.watch("sistema_id"));
  const selectedProperty = properties.find(
    (p) => p.id === form.watch("propriedade_id")
  );

  const onSubmit = async (values: ProductionCostFormValues) => {
    try {
      setIsSubmitting(true);

      // Ensure at least one cost is defined for a safra
      const costsPerSafra = values.custos_por_safra;
      if (Object.keys(costsPerSafra).length === 0) {
        toast.error("Adicione pelo menos um custo por safra");
        return;
      }

      // Filtrar apenas valores maiores que zero
      const validCosts: Record<string, number> = {};
      Object.entries(values.custos_por_safra).forEach(([safraId, value]) => {
        if (value > 0) {
          validCosts[safraId] = value;
        }
      });

      if (Object.keys(validCosts).length === 0) {
        toast.error("Adicione pelo menos um custo válido por safra");
        setIsSubmitting(false);
        return;
      }

      // Atualizar com os valores filtrados
      values.custos_por_safra = validCosts;

      if (isEditing && cost?.id) {
        // Atualizar item existente
        const updatedItem = await updateProductionCost(cost.id, {
          custos_por_safra: values.custos_por_safra,
          descricao: "",
          observacoes: "",
        });
        toast.success("Custo de produção atualizado com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Criar novo item
        const newItem = await createProductionCost(organizationId, {
          organizacao_id: organizationId,
          propriedade_id: values.propriedade_id,
          cultura_id: values.cultura_id,
          sistema_id: values.sistema_id,
          categoria: values.categoria,
          custos_por_safra: values.custos_por_safra,
          descricao: "",
          observacoes: "",
        });
        toast.success("Custo de produção criado com sucesso!");
        onSuccess?.(newItem);
      }

      // A revalidação já é feita pelas funções do servidor
      // Não precisamos forçar refresh aqui
    } catch (error) {
      console.error("Erro ao salvar custo de produção:", error);
      toast.error("Ocorreu um erro ao salvar o custo de produção.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
          {/* Primeira seção: Propriedade e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-5">
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
            </div>

            <div className="space-y-5">
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
          </div>

          {/* Resumo das seleções */}
          {(selectedCategoryDetails ||
            selectedCulture ||
            selectedSystem ||
            selectedProperty) && (
            <Card className="bg-muted/30 border-muted">
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

          {/* SafraCostEditor - posicionado por último */}
          <Separator className="my-4" />

          <FormField
            control={form.control}
            name="custos_por_safra"
            render={({ field }) => (
              <FormItem>
                <SafraCostEditor
                  label="Custos por Safra"
                  description={`Defina os custos por safra (R$/ha)`}
                  values={field.value}
                  onChange={field.onChange}
                  safras={harvests}
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />
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
