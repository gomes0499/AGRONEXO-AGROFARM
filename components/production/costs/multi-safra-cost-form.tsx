"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Leaf,
  Settings,
  Home,
  DollarSign,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  type ProductionCost,
  type MultiSafraProductionCostFormValues,
  multiSafraProductionCostFormSchema,
  type Culture,
  type System,
  type Harvest,
} from "@/schemas/production";
import { createMultiSafraProductionCosts } from "@/lib/actions/production-actions";
import { SafraCostEditor } from "../common/safra-cost-editor";

// Define interface for the property entity
// Use the same Property type as in production-actions.ts
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface MultiSafraProductionCostFormProps {
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  organizationId: string;
  onSuccess?: (costs: ProductionCost[]) => void;
  onCancel?: () => void;
}

const COST_CATEGORIES = {
  // Insumos
  CALCARIO: 'Calcário',
  FERTILIZANTE: 'Fertilizante',
  SEMENTES: 'Sementes',
  TRATAMENTO_SEMENTES: 'Tratamento de Sementes',
  
  // Defensivos
  HERBICIDA: 'Herbicida',
  INSETICIDA: 'Inseticida',
  FUNGICIDA: 'Fungicida',
  OUTROS: 'Outros Defensivos',
  
  // Operações
  BENEFICIAMENTO: 'Beneficiamento',
  SERVICOS: 'Serviços',
  
  // Gestão
  ADMINISTRATIVO: 'Administrativo'
}

const CATEGORY_GROUPS = {
  'Insumos': ['CALCARIO', 'FERTILIZANTE', 'SEMENTES', 'TRATAMENTO_SEMENTES'],
  'Defensivos': ['HERBICIDA', 'INSETICIDA', 'FUNGICIDA', 'OUTROS'],
  'Operações': ['BENEFICIAMENTO', 'SERVICOS'],
  'Gestão': ['ADMINISTRATIVO']
}

const CATEGORY_COLORS = {
  'Insumos': 'bg-green-100 text-green-800',
  'Defensivos': 'bg-red-100 text-red-800',
  'Operações': 'bg-blue-100 text-blue-800',
  'Gestão': 'bg-purple-100 text-purple-800'
}

export function MultiSafraProductionCostForm({
  properties,
  cultures,
  systems,
  harvests,
  organizationId,
  onSuccess,
  onCancel,
}: MultiSafraProductionCostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm<MultiSafraProductionCostFormValues>({
    resolver: zodResolver(multiSafraProductionCostFormSchema),
    defaultValues: {
      propriedade_id: "",
      cultura_id: "",
      sistema_id: "",
      categoria: "FERTILIZANTE",
      custos_por_safra: {},
    },
  });

  const watchedCategory = form.watch('categoria');

  const onSubmit = async (values: MultiSafraProductionCostFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure propriedade_id is provided (it's required by the API)
      const finalValues = {
        ...values,
        propriedade_id: values.propriedade_id || ''
      };
      const newCosts = await createMultiSafraProductionCosts(organizationId, finalValues);
      toast.success(`${Object.keys(values.custos_por_safra).length} custo(s) criado(s) com sucesso!`);
      
      if (onSuccess) {
        // Convert to expected array type with date conversion and explicit casting
        onSuccess([{
          ...newCosts,
          categoria: newCosts.categoria as any,
          created_at: newCosts.created_at ? new Date(newCosts.created_at) : undefined,
          updated_at: newCosts.updated_at ? new Date(newCosts.updated_at) : undefined
        }]); // Cast to satisfy TypeScript
      }
    } catch (error) {
      console.error("Erro ao criar custos:", error);
      toast.error("Ocorreu um erro ao criar os custos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryGroup = (category: string) => {
    for (const [group, categories] of Object.entries(CATEGORY_GROUPS)) {
      if (Array.isArray(categories) && categories.indexOf(category) !== -1) {
        return group
      }
    }
    return 'Outros'
  }

  const getCategoryColor = (category: string) => {
    const group = getCategoryGroup(category)
    return CATEGORY_COLORS[group as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="propriedade_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <Home className="h-4 w-4 text-muted-foreground" />
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
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Categoria
                    <Badge className={getCategoryColor(field.value)}>
                      {getCategoryGroup(field.value)}
                    </Badge>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_GROUPS).map(([group, categories]) => (
                        <div key={group}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {group}
                          </div>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {COST_CATEGORIES[category as keyof typeof COST_CATEGORIES]}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Safra Cost Editor */}
        <FormField
          control={form.control}
          name="custos_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraCostEditor
                label="Custos por Safra"
                description={`Defina os custos de ${COST_CATEGORIES[watchedCategory as keyof typeof COST_CATEGORIES]} para cada safra`}
                values={field.value}
                onChange={field.onChange}
                safras={harvests}
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Action Buttons */}
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
            {isSubmitting ? "Salvando..." : "Salvar Custos"}
          </Button>
        </div>
      </form>
    </Form>
  );
}