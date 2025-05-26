"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatCurrency } from "@/lib/utils/formatters"

interface CalculationItemProps {
  label: string
  value: number
  unit?: string
  trend?: "up" | "down" | "neutral"
  highlighted?: boolean
  description?: string
}

interface CalculationDisplayProps {
  title: string
  description?: string
  calculations: CalculationItemProps[]
  columns?: 1 | 2 | 3 | 4
}

export function CalculationDisplay({
  title,
  description,
  calculations,
  columns = 2
}: CalculationDisplayProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }

  const getTrendIcon = (trend?: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const formatValue = (value: number, unit?: string) => {
    if (unit === "currency" || unit === "R$") {
      return formatCurrency(value)
    }
    if (unit === "percentage" || unit === "%") {
      return `${value.toFixed(2)}%`
    }
    if (unit) {
      return `${value.toLocaleString('pt-BR')} ${unit}`
    }
    return value.toLocaleString('pt-BR')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${gridClasses[columns]}`}>
          {calculations.map((calc, index) => (
            <div
              key={index}
              className={`space-y-2 p-4 rounded-lg border ${
                calc.highlighted 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-background"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {calc.label}
                </span>
                {calc.trend && getTrendIcon(calc.trend)}
              </div>
              
              <div className="space-y-1">
                <div className={`text-xl font-bold ${
                  calc.highlighted ? "text-primary" : "text-foreground"
                }`}>
                  {formatValue(calc.value, calc.unit)}
                </div>
                
                {calc.description && (
                  <p className="text-xs text-muted-foreground">
                    {calc.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para exibição de cálculos em linha
export function InlineCalculationDisplay({
  calculations,
  size = "sm"
}: {
  calculations: CalculationItemProps[]
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  }

  const formatValue = (value: number, unit?: string) => {
    if (unit === "currency" || unit === "R$") {
      return formatCurrency(value)
    }
    if (unit === "percentage" || unit === "%") {
      return `${value.toFixed(1)}%`
    }
    if (unit) {
      return `${value.toLocaleString('pt-BR')} ${unit}`
    }
    return value.toLocaleString('pt-BR')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {calculations.map((calc, index) => (
        <Badge
          key={index}
          variant={calc.highlighted ? "default" : "secondary"}
          className={`${sizeClasses[size]} px-2 py-1`}
        >
          {calc.label}: {formatValue(calc.value, calc.unit)}
        </Badge>
      ))}
    </div>
  )
}