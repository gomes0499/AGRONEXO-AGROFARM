"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import {
  AreaChart,
  CircleDollarSign,
  Leaf,
  Shell,
  BarChart,
  PieChart,
  LineChart,
  Building2,
  Blocks,
  Activity,
  TrendingUp,
  DollarSign,
  HelpCircle,
} from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Mapeamento de nomes de ícones para componentes
const iconMap = {
  AreaChart,
  CircleDollarSign,
  Leaf,
  Shell,
  BarChart,
  PieChart,
  LineChart,
  Building2,
  Blocks,
  Activity,
  TrendingUp,
  DollarSign,
  HelpCircle,
};

// Criando um tipo para os nomes dos ícones disponíveis
type IconName = keyof typeof iconMap;

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  // Podemos aceitar tanto o nome do ícone como string quanto o próprio componente
  icon: IconName | React.ComponentType<{ className?: string }>;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  iconColor = "text-indigo-500",
  trend,
  className,
}: StatsCardProps) {
  // Componente de ícone a ser renderizado
  let IconComponent: React.ComponentType<{ className?: string }>;

  // Se o ícone for uma string, buscar no mapa de ícones
  if (typeof icon === "string") {
    IconComponent = iconMap[icon as IconName] || HelpCircle;
  } else {
    // Se for um componente, usar diretamente
    IconComponent = icon;
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconComponent className={cn("h-5 w-5", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs mt-1">
            <span
              className={cn(
                "mr-1 flex items-center",
                trend.positive ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
