import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectionMetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  source: string;
  formula?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function ProjectionMetricsCard({
  title,
  value,
  unit,
  description,
  source,
  formula,
  trend,
  className,
}: ProjectionMetricsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (title.includes('R$') || title.includes('Receita') || title.includes('Custo') || title.includes('EBITDA')) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(val);
      }
      
      if (title.includes('%')) {
        return `${val.toFixed(2)}%`;
      }
      
      return new Intl.NumberFormat('pt-BR').format(val);
    }
    return val;
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getSourceColor = () => {
    switch (source) {
      case "Dados do módulo produção":
        return "bg-blue-100 text-blue-800";
      case "Dados do módulo indicadores":
        return "bg-green-100 text-green-800";
      case "Calculado":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Badge variant="secondary" className={getSourceColor()}>
          {source === "Dados do módulo produção" ? "Produção" : 
           source === "Dados do módulo indicadores" ? "Indicadores" : 
           "Calculado"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className={cn("text-2xl font-bold", getTrendColor())}>
              {formatValue(value)}
              {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
            {formula && (
              <p className="text-xs text-blue-600 font-mono">
                {formula}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}