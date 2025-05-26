"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Control } from "react-hook-form"

interface PeriodSelectorProps {
  control: Control<any>
  startYearName?: string
  endYearName?: string
  label?: string
  required?: boolean
}

export function PeriodSelector({
  control,
  startYearName = "periodo_inicio",
  endYearName = "periodo_fim",
  label = "Período da Projeção",
  required = true
}: PeriodSelectorProps) {
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={startYearName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Ano Inicial {required && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={currentYear.toString()}
                  min={2020}
                  max={2050}
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={endYearName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Ano Final {required && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={(currentYear + 5).toString()}
                  min={2020}
                  max={2050}
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}