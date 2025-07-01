"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Leaf, Settings, MapPin, Globe } from "lucide-react";
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
import { SafraProductivityEditor } from "../common/safra-productivity-editor";

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
  const isEditing = !!productivity?.id;

  const form = useForm<ProductivityFormValues>({
    resolver: zodResolver(productivityFormSchema),
    defaultValues: {
      cultura_id: productivity?.cultura_id || "",
      sistema_id: productivity?.sistema_id || "",
      propriedade_id: productivity?.propriedade_id || "",
      produtividades_por_safra: productivity?.produtividades_por_safra || {},
      observacoes: productivity?.observacoes || "",
    },
  });

  const onSubmit = async (values: ProductivityFormValues) => {
    setIsSubmitting(true);
    try {
      // Se selecionou "all", passar undefined para propriedade_id
      const propriedadeId = values.propriedade_id === "all" ? undefined : values.propriedade_id;
      
      const formData = {
        ...values,
        propriedade_id: propriedadeId || '',
      };
      
      if (isEditing && productivity?.id) {
        const updatedItem = await updateProductivity(productivity.id, formData);
        toast.success("Registro de produtividade atualizado com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        const dataWithOrgId = {
          ...formData,
          organizacao_id: organizationId
        };
        const newItem = await createProductivity(dataWithOrgId);
        toast.success(
          values.propriedade_id === "all"
            ? `${Object.keys(values.produtividades_por_safra).length} produtividade(s) criada(s) para todas as propriedades!`
            : `${Object.keys(values.produtividades_por_safra).length} produtividade(s) criada(s) com sucesso!`
        );
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar produtividade:", error);
      toast.error("Ocorreu um erro ao salvar a produtividade.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <Separator />

        {/* Productivity Editor */}
        <FormField
          control={form.control}
          name="produtividades_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraProductivityEditor
                label="Produtividades por Safra"
                description="Defina as produtividades para cada safra"
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
            {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Produtividades" : "Salvar Produtividades"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
