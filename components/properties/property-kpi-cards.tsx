import { Card, CardContent } from "@/components/ui/card";
import { getPropertyStats } from "@/lib/actions/property-stats-actions";
import { formatArea, formatCurrency, formatPercentage } from "@/lib/utils/property-formatters";
import { Building2, MapPin, DollarSign, Sprout, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyKpiCardsProps {
  organizationId: string;
}

async function PropertyKpiCardsContent({ organizationId }: PropertyKpiCardsProps) {
  try {
    const stats = await getPropertyStats(organizationId);

    const kpis = [
      {
        title: "TOTAL FAZENDAS",
        value: stats.totalFazendas.toString(),
        subtitle: "propriedades",
        icon: Building2,
        trend: null, // Não há tendência para contagem de propriedades
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "ÁREA TOTAL",
        value: formatArea(stats.areaTotal),
        subtitle: `📏 +${formatPercentage(stats.crescimentoArea || 0)} YoY`,
        icon: MapPin,
        trend: {
          value: stats.crescimentoArea || 0,
          isPositive: (stats.crescimentoArea || 0) > 0,
        },
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "VALOR PATRIMONIAL",
        value: formatCurrency(stats.valorPatrimonial),
        subtitle: `💰 +${formatPercentage(stats.crescimentoValor || 0)} YoY`,
        icon: DollarSign,
        trend: {
          value: stats.crescimentoValor || 0,
          isPositive: (stats.crescimentoValor || 0) > 0,
        },
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        title: "ÁREA CULTIVÁVEL",
        value: formatArea(stats.areaCultivavel),
        subtitle: `🌱 ${formatPercentage(stats.utilizacaoPercentual)} util.`,
        icon: Sprout,
        trend: {
          value: stats.utilizacaoPercentual,
          isPositive: stats.utilizacaoPercentual > 70, // Boa utilização > 70%
        },
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {kpi.value}
                    </p>
                    <div className="flex items-center mt-2 space-x-1">
                      <p className="text-xs text-muted-foreground">
                        {kpi.subtitle}
                      </p>
                      {kpi.trend && (
                        <div className={cn(
                          "inline-flex items-center text-xs",
                          kpi.trend.isPositive ? "text-green-600" : "text-red-600"
                        )}>
                          {kpi.trend.isPositive ? (
                            <TrendingUp className="h-3 w-3 ml-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 ml-1" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={cn(
                    "p-2 rounded-lg",
                    kpi.bgColor
                  )}>
                    <Icon className={cn("h-5 w-5", kpi.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar KPIs de propriedades:", error);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-24 mb-2" />
                  <div className="h-6 bg-muted rounded w-16 mb-2" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <div className="h-5 w-5 bg-muted-foreground/20 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}

export async function PropertyKpiCards({ organizationId }: PropertyKpiCardsProps) {
  return <PropertyKpiCardsContent organizationId={organizationId} />;
}