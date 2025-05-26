import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
} from "lucide-react";

export default function ProjectionDetailsPage({ params }: any) {
  // Mock data - replace with actual API calls
  const projectionSummary = {
    totalReceitas: 15600000,
    totalCustos: 11200000,
    margemBruta: 4400000,
    ebitda: 3800000,
    margemEbitda: 24.4,
    fluxoCaixaLivre: 2100000,
    dividaTotal: 8500000,
    liquidezCorrente: 1.8,
    roi: 18.5,
  };

  const yearlyData = [
    {
      ano: 2024,
      receitas: 5000000,
      custos: 3600000,
      ebitda: 1400000,
      status: "realizado",
    },
    {
      ano: 2025,
      receitas: 5300000,
      custos: 3800000,
      ebitda: 1500000,
      status: "projetado",
    },
    {
      ano: 2026,
      receitas: 5300000,
      custos: 3800000,
      ebitda: 900000,
      status: "projetado",
    },
  ];

  const kpis = [
    {
      title: "Receita Total Projetada",
      value: projectionSummary.totalReceitas,
      format: "currency",
      trend: "up",
      trendValue: 12.5,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "EBITDA Consolidado",
      value: projectionSummary.ebitda,
      format: "currency",
      trend: "up",
      trendValue: 8.2,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Margem EBITDA",
      value: projectionSummary.margemEbitda,
      format: "percentage",
      trend: "down",
      trendValue: -2.1,
      icon: Target,
      color: "text-purple-600",
    },
    {
      title: "Fluxo de Caixa Livre",
      value: projectionSummary.fluxoCaixaLivre,
      format: "currency",
      trend: "up",
      trendValue: 15.3,
      icon: Activity,
      color: "text-orange-600",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>
                {kpi.format === "currency"
                  ? formatCurrency(kpi.value)
                  : formatPercentage(kpi.value)}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    kpi.trend === "up" ? "text-green-600" : "text-red-600"
                  }
                >
                  {kpi.trend === "up" ? "+" : ""}
                  {kpi.trendValue}%
                </span>
                <span>vs ano anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evolução Anual */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Anual</CardTitle>
          <CardDescription>
            Comparativo de receitas, custos e EBITDA por ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yearlyData.map((year) => (
              <div
                key={year.ano}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{year.ano}</span>
                    <Badge
                      variant={
                        year.status === "realizado" ? "default" : "secondary"
                      }
                    >
                      {year.status === "realizado" ? "Realizado" : "Projetado"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 text-sm">
                  <div>
                    <p className="text-muted-foreground">Receitas</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(year.receitas)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custos</p>
                    <p className="font-medium text-red-600">
                      {formatCurrency(year.custos)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">EBITDA</p>
                    <p className="font-medium text-blue-600">
                      {formatCurrency(year.ebitda)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Saúde Financeira */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Indicadores de Liquidez</CardTitle>
            <CardDescription>
              Análise da capacidade de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Liquidez Corrente</span>
              <div className="flex items-center space-x-2">
                <Progress
                  value={projectionSummary.liquidezCorrente * 50}
                  className="w-20"
                />
                <span className="text-sm font-bold">
                  {projectionSummary.liquidezCorrente.toFixed(1)}x
                </span>
                {projectionSummary.liquidezCorrente >= 1.5 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dívida Total</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(projectionSummary.dividaTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cobertura de Juros</span>
              <div className="flex items-center space-x-2">
                <Progress value={75} className="w-20" />
                <span className="text-sm font-bold">4.2x</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indicadores de Rentabilidade</CardTitle>
            <CardDescription>
              Análise do retorno dos investimentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                ROI (Return on Investment)
              </span>
              <div className="flex items-center space-x-2">
                <Progress value={projectionSummary.roi * 5} className="w-20" />
                <span className="text-sm font-bold text-green-600">
                  {formatPercentage(projectionSummary.roi)}
                </span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Margem Bruta</span>
              <div className="flex items-center space-x-2">
                <Progress value={28.2 * 3} className="w-20" />
                <span className="text-sm font-bold text-blue-600">28.2%</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Margem EBITDA</span>
              <div className="flex items-center space-x-2">
                <Progress
                  value={projectionSummary.margemEbitda * 4}
                  className="w-20"
                />
                <span className="text-sm font-bold text-purple-600">
                  {formatPercentage(projectionSummary.margemEbitda)}
                </span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Categoria</CardTitle>
          <CardDescription>
            Análise detalhada das principais categorias de projeção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">
                Receitas Projetadas
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Soja</span>
                  <span className="font-medium">{formatCurrency(7800000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Milho</span>
                  <span className="font-medium">{formatCurrency(4200000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Algodão</span>
                  <span className="font-medium">{formatCurrency(3100000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outras</span>
                  <span className="font-medium">{formatCurrency(500000)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-red-700">Custos Projetados</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Produção</span>
                  <span className="font-medium">{formatCurrency(8400000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operacionais</span>
                  <span className="font-medium">{formatCurrency(1800000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Financeiros</span>
                  <span className="font-medium">{formatCurrency(700000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outros</span>
                  <span className="font-medium">{formatCurrency(300000)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-blue-700">Investimentos</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Maquinários</span>
                  <span className="font-medium">{formatCurrency(1200000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Infraestrutura</span>
                  <span className="font-medium">{formatCurrency(800000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tecnologia</span>
                  <span className="font-medium">{formatCurrency(400000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outros</span>
                  <span className="font-medium">{formatCurrency(200000)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
