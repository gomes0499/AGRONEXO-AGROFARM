"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const TIPO_OPTIONS = [
  { 
    value: "REALIZADO", 
    label: "Realizado",
    description: "Já executado/adquirido",
    badge: "bg-green-100 text-green-800"
  },
  { 
    value: "PLANEJADO", 
    label: "Planejado",
    description: "Planejamento futuro",
    badge: "bg-blue-100 text-blue-800"
  },
]

interface TipoSelectorProps {
  value?: "REALIZADO" | "PLANEJADO"
  onValueChange?: (value: "REALIZADO" | "PLANEJADO") => void
  placeholder?: string
  disabled?: boolean
}

export function TipoSelector({ 
  value,
  onValueChange,
  placeholder = "Selecione o tipo",
  disabled = false
}: TipoSelectorProps) {
  return (
    <Select 
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {TIPO_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={option.badge}>
                {option.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {option.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}