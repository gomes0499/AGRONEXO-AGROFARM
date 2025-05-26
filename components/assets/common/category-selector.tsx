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
import { AssetCategoryType } from "@/schemas/patrimonio/common";

interface CategorySelectorProps {
  name: string;
  label: string;
  control: any;
  disabled?: boolean;
}

export function CategorySelector({
  name,
  label,
  control,
  disabled = false,
}: CategorySelectorProps) {
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
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="EQUIPAMENTO">Equipamento / Implemento</SelectItem>
              <SelectItem value="TRATOR_COLHEITADEIRA_PULVERIZADOR">Trator / Colheitadeira / Pulverizador</SelectItem>
              <SelectItem value="AERONAVE">Aeronave</SelectItem>
              <SelectItem value="VEICULO">Veículo</SelectItem>
              <SelectItem value="BENFEITORIA">Benfeitoria</SelectItem>
              <SelectItem value="INVESTIMENTO_SOLO">Investimento em Solo</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}