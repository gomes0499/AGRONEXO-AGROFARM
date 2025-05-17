"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface CurrencyFieldFallbackProps {
  name: string;
  label: string;
  control: any;
  placeholder?: string;
}

export function CurrencyFieldFallback({
  name,
  label,
  control,
  placeholder = "R$ 0,00",
}: CurrencyFieldFallbackProps) {
  // Simplified version without any complex formatting or state management
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                placeholder={placeholder}
                onChange={(e) => {
                  try {
                    // Simply remove non-numeric characters and convert to number
                    const rawValue = e.target.value.replace(/[^\d.,\-]/g, "");
                    const numericValue = parseFloat(rawValue.replace(/,/g, '.'));
                    field.onChange(isNaN(numericValue) ? null : numericValue);
                  } catch (error) {
                    console.error("Error in fallback currency field:", error);
                    field.onChange(null);
                  }
                }}
                value={field.value !== undefined && field.value !== null ? field.value : ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}