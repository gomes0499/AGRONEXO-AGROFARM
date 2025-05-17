"use client";

import { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { parseFormattedNumber, formatCurrency, isNegativeValue } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface CurrencyFieldProps {
  name: string;
  label: string;
  control: any;
  placeholder?: string;
  isCost?: boolean;
  isRevenue?: boolean;
}

export function CurrencyField({
  name,
  label,
  control,
  placeholder = "R$ 0,00",
  isCost = false,
  isRevenue = false,
}: CurrencyFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Track input focus state
        const [isFocused, setIsFocused] = useState(false);

        // Determine field label with cost/revenue indicators
        const displayLabel = isCost ? `(-) ${label}` : isRevenue ? `(+) ${label}` : label;

        return (
          <FormItem>
            <FormLabel>{displayLabel}</FormLabel>
            <FormControl>
              <input
                placeholder={placeholder}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  isNegativeValue(field.value) && "text-red-600"
                )}
                onChange={(e) => {
                  // Allow continuous typing by preserving the raw input
                  const rawValue = e.target.value.replace(/[^\d.,\-]/g, "");
                  const numericValue = parseFormattedNumber(rawValue);
                  field.onChange(numericValue);
                }}
                onBlur={(e) => {
                  setIsFocused(false);
                  field.onBlur();
                  if (field.value !== undefined && field.value !== null) {
                    e.target.value = formatCurrency(field.value);
                  }
                }}
                onFocus={(e) => {
                  setIsFocused(true);
                  if (field.value) {
                    // Show raw value without formatting for editing
                    e.target.value = String(Math.abs(field.value));
                  } else {
                    e.target.value = "";
                  }
                }}
                value={
                  isFocused
                    ? field.value !== undefined && field.value !== null
                      ? String(Math.abs(field.value))
                      : ""
                    : field.value !== undefined && field.value !== null
                    ? formatCurrency(field.value)
                    : ""
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}