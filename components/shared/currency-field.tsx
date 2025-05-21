"use client";

import { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { parseFormattedNumber, formatGenericCurrency, isNegativeValue } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

type CurrencyType = "BRL" | "USD" | "EUR" | "SOJA";

interface CurrencyFieldProps {
  name: string;
  label: string;
  control: any;
  placeholder?: string;
  isCost?: boolean;
  isRevenue?: boolean;
  currency?: CurrencyType;
  currencyFieldName?: string; // Name of the field in the form that contains the currency type
}

export function CurrencyField({
  name,
  label,
  control,
  placeholder = "R$ 0,00",
  isCost = false,
  isRevenue = false,
  currency = "BRL",
  currencyFieldName = "moeda",
}: CurrencyFieldProps) {
  // Get form context if available
  const formContext = useFormContext();
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Track input focus state
        const [isFocused, setIsFocused] = useState(false);

        // Determine field label with cost/revenue indicators
        const displayLabel = isCost ? `(-) ${label}` : isRevenue ? `(+) ${label}` : label;

        // Get currency from form context if available
        const formCurrency = formContext?.watch?.(currencyFieldName) as CurrencyType | undefined;
        const activeCurrency = formCurrency || currency;
        
        // Set placeholder based on currency
        let currencyPlaceholder = placeholder;
        if (activeCurrency === "USD") {
          currencyPlaceholder = "US$ 0.00";
        } else if (activeCurrency === "EUR") {
          currencyPlaceholder = "€ 0,00";
        } else if (activeCurrency === "SOJA") {
          currencyPlaceholder = "0 sc";
        }

        return (
          <FormItem>
            <FormLabel>{displayLabel}</FormLabel>
            <FormControl>
              <input
                placeholder={currencyPlaceholder}
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
                    e.target.value = formatGenericCurrency(field.value, activeCurrency);
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
                    ? formatGenericCurrency(field.value, activeCurrency)
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