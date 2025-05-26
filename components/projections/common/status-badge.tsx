"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Archive } from "lucide-react"

interface StatusBadgeProps {
  status: "ATIVA" | "INATIVA" | "ARQUIVADA"
  size?: "sm" | "md" | "lg"
}

const statusConfig = {
  ATIVA: {
    label: "Ativa",
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 hover:bg-green-100"
  },
  INATIVA: {
    label: "Inativa", 
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
  },
  ARQUIVADA: {
    label: "Arquivada",
    variant: "outline" as const,
    icon: Archive,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

const sizeClasses = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-2.5 py-1", 
  lg: "text-sm px-3 py-1.5"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1.5`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}