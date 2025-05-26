"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Control } from "react-hook-form"

interface YearFilterProps {
  control?: Control<any>
  name?: string
  label?: string
  placeholder?: string
  required?: boolean
  value?: string
  onValueChange?: (value: string) => void
  startYear?: number
  endYear?: number
  includeAll?: boolean
}

export function YearFilter({
  control,
  name = "ano",
  label = "Ano",
  placeholder = "Selecione o ano",
  required = false,
  value,
  onValueChange,
  startYear = new Date().getFullYear() - 2,
  endYear = new Date().getFullYear() + 10,
  includeAll = false
}: YearFilterProps) {
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  ).reverse()

  // Se temos control, renderizar como FormField
  if (control && name) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label} {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {includeAll && (
                  <SelectItem value="all">Todos os anos</SelectItem>
                )}
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
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

  // Caso contrário, renderizar como componente standalone
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeAll && (
            <SelectItem value="all">Todos os anos</SelectItem>
          )}
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}