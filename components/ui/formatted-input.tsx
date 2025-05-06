"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ControllerRenderProps } from "react-hook-form";
import { FormatType, useFormattedInput } from "@/hooks/use-formatted-input";
import { CepData } from "@/lib/utils/format";

interface FormattedInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "onBlur" | "value"> {
  field: ControllerRenderProps<any, any>;
  formatType?: FormatType;
  onAddressFound?: (data: CepData) => void;
  className?: string;
  currency?: 'BRL' | 'USD'; // Para uso com formatação monetária
  type?: string;
}

export function FormattedInput({
  field,
  formatType = "none",
  onAddressFound,
  className,
  type,
  currency,
  ...props
}: FormattedInputProps) {
  const formattedInput = useFormattedInput({
    type: formatType,
    field,
    onAddressFound,
  });
  
  // Extract relevant properties, handling the possibility of no options case
  const value = 'value' in formattedInput ? formattedInput.value : '';
  const onChange = 'onChange' in formattedInput ? formattedInput.onChange : field.onChange;
  const onBlur = 'onBlur' in formattedInput ? formattedInput.onBlur : field.onBlur;
  const onFocus = 'onFocus' in formattedInput ? formattedInput.onFocus : () => {};
  const isLoading = 'isLoading' in formattedInput ? formattedInput.isLoading : false;

  return (
    <div className="relative">
      <Input
        {...props}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        className={cn(className, isLoading && "pr-10")}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}