import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getFinancialMetrics } from "@/lib/actions/financial-metrics-actions";
import type { FinancialMetrics } from "@/lib/actions/financial-metrics-actions";
import {
  Building2Icon,
  FileTextIcon,
  TrendingDownIcon,
  ClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSummaryKpisProps {
  organizationId: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  badge: {
    text: string;
    variant: "destructive" | "secondary" | "default" | "outline";
  };
  icon: React.ReactNode;
}

function MetricCard({ title, value, badge, icon }: MetricCardProps) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          <div className="text-xl font-bold">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Badge variant={badge.variant} className="text-xs">
          {badge.text}
        </Badge>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-5 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function FinancialSummaryKpisContent({ organizationId }: FinancialSummaryKpisProps) {
  const metrics = await getFinancialMetrics(organizationId);

  const formatMilhoes = (valor: number) => {
    return `R$ ${(Math.abs(valor) / 1000000).toFixed(1)}M`;
  };

  const formatAnos = (valor: number) => {
    return `${valor.toFixed(1)} anos`;
  };

  const getBadgeVariant = (percentual: number, isDebtMetric: boolean = false): "destructive" | "secondary" | "default" => {
    if (Math.abs(percentual) < 0.1) return "secondary";
    
    // Para métricas de dívida, redução (negativo) é bom
    if (isDebtMetric) {
      return percentual < 0 ? "default" : "destructive";
    }
    
    // Para outras métricas, aumento (positivo) é bom
    return percentual >= 0 ? "default" : "destructive";
  };

  const getEmoji = (percentual: number, isDebtMetric: boolean = false): string => {
    if (Math.abs(percentual) < 0.1) return "⏸️";
    
    if (isDebtMetric) {
      return percentual < 0 ? "🟢" : "🔴";
    }
    
    return percentual >= 0 ? "🟢" : "🔴";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="DÍVIDA BANCÁRIA"
        value={formatMilhoes(metrics.dividaBancaria.valorAtual)}
        badge={{
          text: `${getEmoji(metrics.dividaBancaria.percentualMudanca, true)} ${metrics.dividaBancaria.percentualMudanca > 0 ? '+' : ''}${metrics.dividaBancaria.percentualMudanca.toFixed(1)}% YoY`,
          variant: getBadgeVariant(metrics.dividaBancaria.percentualMudanca, true),
        }}
        icon={<Building2Icon className="h-5 w-5 text-primary" />}
      />

      <MetricCard
        title="OUTROS PASSIVOS"
        value={formatMilhoes(metrics.outrosPassivos.valorAtual)}
        badge={{
          text: `${getEmoji(metrics.outrosPassivos.percentualMudanca, true)} ${metrics.outrosPassivos.percentualMudanca > 0 ? '+' : ''}${metrics.outrosPassivos.percentualMudanca.toFixed(1)}% YoY`,
          variant: getBadgeVariant(metrics.outrosPassivos.percentualMudanca, true),
        }}
        icon={<FileTextIcon className="h-5 w-5 text-primary" />}
      />

      <MetricCard
        title="DÍVIDA LÍQUIDA"
        value={formatMilhoes(metrics.dividaLiquida.valorAtual)}
        badge={{
          text: `${getEmoji(metrics.dividaLiquida.percentualMudanca, true)} ${metrics.dividaLiquida.percentualMudanca > 0 ? '+' : ''}${metrics.dividaLiquida.percentualMudanca.toFixed(1)}% YoY`,
          variant: getBadgeVariant(metrics.dividaLiquida.percentualMudanca, true),
        }}
        icon={<TrendingDownIcon className="h-5 w-5 text-primary" />}
      />

      <MetricCard
        title="PRAZO MÉDIO"
        value={formatAnos(metrics.prazoMedio.valorAtual)}
        badge={{
          text: `⏰ vs ${formatAnos(metrics.prazoMedio.valorAnterior)} ant.`,
          variant: "secondary",
        }}
        icon={<ClockIcon className="h-5 w-5 text-primary" />}
      />
    </div>
  );
}

export function FinancialSummaryKpis({ organizationId }: FinancialSummaryKpisProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <FinancialSummaryKpisContent organizationId={organizationId} />
    </Suspense>
  );
}