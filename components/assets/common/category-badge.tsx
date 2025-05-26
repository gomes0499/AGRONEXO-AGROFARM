"use client";

import { Badge } from "@/components/ui/badge";
import { AssetCategoryType } from "@/schemas/patrimonio/common";

interface CategoryBadgeProps {
  category: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    'EQUIPAMENTO': 'Equipamento',
    'TRATOR_COLHEITADEIRA_PULVERIZADOR': 'Máquina Agrícola',
    'AERONAVE': 'Aeronave',
    'VEICULO': 'Veículo',
    'BENFEITORIA': 'Benfeitoria',
    'INVESTIMENTO_SOLO': 'Inv. em Solo',
  };

  return categoryMap[category] || category;
}

export function CategoryBadge({ category, variant = "outline" }: CategoryBadgeProps) {
  return (
    <Badge variant={variant}>
      {getCategoryLabel(category)}
    </Badge>
  );
}