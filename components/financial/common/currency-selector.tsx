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
import { CurrencyType } from "@/schemas/financial/common";

interface CurrencySelectorProps {
  name: string;
  label: string;
  control: any;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export function CurrencySelector({
  name,
  label,
  control,
  disabled = false,
  value,
  onChange,
}: CurrencySelectorProps) {
  // Support both direct use and form field use
  const isFormField = !!control && !!name;
  
  if (!isFormField) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <Select
          disabled={disabled}
          onValueChange={onChange}
          value={value}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a moeda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BRL">Real (R$)</SelectItem>
            <SelectItem value="USD">Dólar (US$)</SelectItem>
            <SelectItem value="EUR">Euro (€)</SelectItem>
            <SelectItem value="SOJA">Soja (sacas)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
  
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
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="BRL">Real (R$)</SelectItem>
              <SelectItem value="USD">Dólar (US$)</SelectItem>
              <SelectItem value="EUR">Euro (€)</SelectItem>
              <SelectItem value="SOJA">Soja (sacas)</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}