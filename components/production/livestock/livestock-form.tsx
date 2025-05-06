"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Livestock, LivestockFormValues, livestockFormSchema } from "@/schemas/production";
import { createLivestock, updateLivestock } from "@/lib/actions/production-actions";
import { formatCurrency, parseFormattedNumber } from "@/lib/utils/formatters";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
  [key: string]: any;
}

interface LivestockFormProps {
  properties: Property[];
  organizationId: string;
  livestock?: Livestock | null;
  onSuccess?: (livestock: Livestock) => void;
  onCancel?: () => void;
}

export function LivestockForm({
  properties,
  organizationId,
  livestock = null,
  onSuccess,
  onCancel,
}: LivestockFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isEditing = !!livestock?.id;
  
  const form = useForm<LivestockFormValues>({
    resolver: zodResolver(livestockFormSchema),
    defaultValues: {
      tipo_animal: livestock?.tipo_animal || "",
      categoria: livestock?.categoria || "",
      quantidade: livestock?.quantidade || 0,
      preco_unitario: livestock?.preco_unitario || 0,
      propriedade_id: livestock?.propriedade_id || "",
    },
  });
  
  const onSubmit = async (values: LivestockFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && livestock?.id) {
        // Atualizar item existente
        const updatedItem = await updateLivestock(livestock.id, values);
        toast.success("Registro de rebanho atualizado com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Criar novo item
        const newItem = await createLivestock(organizationId, values);
        toast.success("Registro de rebanho criado com sucesso!");
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar registro de rebanho:", error);
      toast.error("Ocorreu um erro ao salvar o registro de rebanho.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo_animal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Animal</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Bovino, Ovino, etc."
                    {...field}
                  />
                </FormControl>
                <FormDescription>Tipo ou espécie do animal</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Bezerro, Garrote, etc."
                    {...field}
                  />
                </FormControl>
                <FormDescription>Categoria, faixa etária ou sexo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="Quantidade de animais"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : 0;
                      field.onChange(value);
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>Número de cabeças</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="preco_unitario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Unitário (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Valor por animal"
                    {...field}
                    onChange={(e) => {
                      // Limpa a formatação e pega apenas números e vírgulas
                      const cleanValue = e.target.value.replace(/[^\d.,]/g, '');
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
                  />
                </FormControl>
                <FormDescription>Preço por cabeça em R$</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="propriedade_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Propriedade</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a propriedade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((property: Property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.nome} {property.cidade && property.estado ? `(${property.cidade}/${property.estado})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
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
      </form>
    </Form>
  );
}