"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Control } from "react-hook-form"

interface SafraFormatSelectorProps {
  control: Control<any>
  name?: string
  label?: string
  placeholder?: string
  required?: boolean
}

const safraFormats = [
  {
    value: "SAFRA_COMPLETA",
    label: "Safra Completa",
    description: "Ex: 2023/24, 2024/25"
  },
  {
    value: "ANO_CIVIL", 
    label: "Ano Civil",
    description: "Ex: 2024, 2025"
  }
]

export function SafraFormatSelector({
  control,
  name = "formato_safra",
  label = "Formato da Safra",
  placeholder = "Selecione o formato",
  required = false
}: SafraFormatSelectorProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-destructive">*</span>}
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {safraFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{format.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {format.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}