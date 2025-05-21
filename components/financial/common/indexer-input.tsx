"use client";

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

// Tipos comuns de indexadores financeiros
const COMMON_INDEXERS = [
  { value: "SELIC", label: "SELIC" },
  { value: "CDI", label: "CDI" },
  { value: "IPCA", label: "IPCA" },
  { value: "IGP-M", label: "IGP-M" },
  { value: "TJLP", label: "TJLP" },
  { value: "LIBOR", label: "LIBOR" },
  { value: "PRE_FIXADO", label: "Pré-fixado" },
  { value: "POS_FIXADO", label: "Pós-fixado" },
  { value: "HIBRIDO", label: "Híbrido" },
  { value: "OUTROS", label: "Outros" },
];

interface IndexerInputProps {
  name: string;
  label: string;
  control: any;
  placeholder?: string;
  customIndexers?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  showOtherOption?: boolean;
}

export function IndexerInput({
  name,
  label,
  control,
  placeholder = "Selecione o indexador",
  customIndexers = [],
  disabled = false,
  showOtherOption = true,
}: IndexerInputProps) {
  // Combina os indexadores padrão com os personalizados
  const indexers = [...COMMON_INDEXERS, ...customIndexers];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            disabled={disabled}
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {indexers.map((indexer) => (
                <SelectItem key={indexer.value} value={indexer.value}>
                  {indexer.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}