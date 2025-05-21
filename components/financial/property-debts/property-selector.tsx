"use client";

import { useEffect, useState } from "react";
import {
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
import { Loader2 } from "lucide-react";
import { getProperties } from "@/lib/actions/property-actions";

// Importing the Property type directly from the schema
import { Property as PropertySchema } from "@/schemas/properties";

// For the component's internal use
interface Property {
  id: string;
  nome: string;
}

interface PropertySelectorProps {
  name: string;
  label: string;
  control: any;
  organizationId: string;
  disabled?: boolean;
}

export function PropertySelector({
  name,
  label,
  control,
  organizationId,
  disabled = false,
}: PropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        const propertiesData = await getProperties(organizationId);
        // Filter out properties without an id and map to the internal Property type
        setProperties(
          propertiesData
            .filter((prop): prop is PropertySchema & { id: string } => Boolean(prop.id))
            .map(prop => ({ id: prop.id, nome: prop.nome }))
        );
      } catch (error) {
        console.error("Erro ao carregar propriedades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [organizationId]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            disabled={disabled || isLoading}
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando propriedades...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Selecione uma propriedade" />
                )}
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {properties.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {isLoading
                    ? "Carregando propriedades..."
                    : "Nenhuma propriedade encontrada"}
                </div>
              ) : (
                properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.nome}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}