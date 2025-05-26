import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPropertyStats } from "@/lib/actions/property-stats-actions";
import { Badge } from "@/components/ui/badge";
import { Home, Building2, TrendingUp, PieChart } from "lucide-react";

interface PropertyStatsSummaryProps {
  organizationId: string;
}

export async function PropertyStatsSummary({ organizationId }: PropertyStatsSummaryProps) {
  try {
    const stats = await getPropertyStats(organizationId);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Distribuição de Propriedades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">
                Distribuição de Propriedades
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Proporção entre propriedades próprias e arrendadas
              </CardDescription>
            </div>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Home className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Próprias</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.propriedadesProprias}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalFazendas > 0 
                      ? `${((stats.propriedadesProprias / stats.totalFazendas) * 100).toFixed(0)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Arrendadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.propriedadesArrendadas}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalFazendas > 0 
                      ? `${((stats.propriedadesArrendadas / stats.totalFazendas) * 100).toFixed(0)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eficiência de Área */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">
                Eficiência de Área
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Aproveitamento da área cultivável disponível
              </CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Utilização</span>
                  <span className="font-medium">
                    {stats.utilizacaoPercentual.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(stats.utilizacaoPercentual, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {stats.areaCultivavel.toFixed(0)} ha cultiváveis de {stats.areaTotal.toFixed(0)} ha totais
              </div>
              
              <Badge 
                variant={stats.utilizacaoPercentual > 70 ? "default" : "secondary"}
                className="w-full justify-center"
              >
                {stats.utilizacaoPercentual > 80 ? "Excelente" : 
                 stats.utilizacaoPercentual > 70 ? "Boa" : 
                 stats.utilizacaoPercentual > 50 ? "Média" : "Baixa"} utilização
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Crescimento Patrimonial */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">
                Crescimento Patrimonial
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Evolução anual de valor e área das propriedades
              </CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor YoY</span>
                <Badge variant="default" className="text-green-700 bg-green-100">
                  +{stats.crescimentoValor?.toFixed(1)}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Área YoY</span>
                <Badge variant="default" className="text-blue-700 bg-blue-100">
                  +{stats.crescimentoArea?.toFixed(1)}%
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                Crescimento baseado nos últimos 12 meses
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar resumo de propriedades:", error);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-4 bg-muted rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}