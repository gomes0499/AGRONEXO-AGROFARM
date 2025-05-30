"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSimpleAgriculturalRevenueProjections, type SimpleConsolidatedRevenues } from "@/lib/actions/simple-agricultural-projections";

interface AgriculturalRevenueDashboardProps {
  organizationId: string;
}

export function AgriculturalRevenueDashboard({ organizationId }: AgriculturalRevenueDashboardProps) {
  const [revenueData, setRevenueData] = useState<SimpleConsolidatedRevenues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRevenueData() {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getSimpleAgriculturalRevenueProjections(organizationId);
        setRevenueData(result);
      } catch (err) {
        console.error('Error loading revenue data:', err);
        setError('Erro ao carregar dados das receitas agrícolas');
      } finally {
        setLoading(false);
      }
    }

    loadRevenueData();
  }, [organizationId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMillions = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<TrendingUp className="h-4 w-4" />}
          title="Receitas Agrícolas Projetadas"
          description="Cálculo: Área × Produtividade × Preço (2022-2030)"
        />
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<TrendingUp className="h-4 w-4" />}
          title="Receitas Agrícolas Projetadas"
          description="Cálculo: Área × Produtividade × Preço (2022-2030)"
        />
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!revenueData || !revenueData.receitas || revenueData.receitas.length === 0) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<TrendingUp className="h-4 w-4" />}
          title="Receitas Agrícolas Projetadas"
          description="Cálculo: Área × Produtividade × Preço (2022-2030)"
        />
        <CardContent className="p-6">
          <EmptyState
            icon={<BarChart3 className="h-10 w-10 text-muted-foreground" />}
            title="Nenhuma projeção disponível"
            description="Não há dados suficientes para calcular receitas agrícolas. Verifique se há áreas de plantio, produtividades e preços cadastrados."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<TrendingUp className="h-4 w-4" />}
        title="Receitas Agrícolas Projetadas"
        description="Cálculo: Área × Produtividade × Preço (2022-2030)"
      />

      <CardContent className="p-6">
        <Tabs defaultValue="consolidated" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
            <TabsTrigger value="detailed">Detalhado</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="consolidated" className="space-y-4">
            <div className="overflow-x-auto overflow-y-hidden border rounded-md">
              <div className="min-w-max">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="font-semibold text-primary-foreground min-w-[200px] w-[200px] sticky left-0 bg-primary z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                        Cultura + Sistema + Ciclo
                      </TableHead>
                      {revenueData.anos.map((ano, index) => (
                        <TableHead 
                          key={ano} 
                          className={cn(
                            "font-semibold text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                            index === revenueData.anos.length - 1 && "rounded-tr-md"
                          )}
                        >
                          {ano}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueData.receitas.map((receita, index) => (
                      <TableRow key={index} className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {receita.cultura} {receita.sistema} {receita.ciclo && `- ${receita.ciclo}`}
                        </TableCell>
                        {revenueData.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center font-mono min-w-[120px] w-[120px]"
                          >
                            {formatCurrency(receita.receitas_por_ano[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    
                    {/* Total */}
                    <TableRow className="bg-green-50/50 hover:bg-green-50/70">
                      <TableCell className="font-bold min-w-[200px] w-[200px] sticky left-0 bg-green-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Total Receitas Agrícolas
                      </TableCell>
                      {revenueData.anos.map((ano) => (
                        <TableCell 
                          key={ano} 
                          className="text-center font-mono font-bold text-green-700 min-w-[120px] w-[120px] bg-green-50/50"
                        >
                          {formatCurrency(revenueData.total_por_ano[ano] || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <div className="grid gap-4">
              {revenueData.receitas.map((receita, index) => (
                <Card key={index} className="border border-muted/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">
                      {receita.cultura} {receita.sistema} {receita.ciclo && `- ${receita.ciclo}`}
                      <span className="text-sm text-muted-foreground ml-2">({receita.unidade})</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {revenueData.anos.map((ano) => (
                        <div key={ano} className="text-center">
                          <div className="text-xs text-muted-foreground">{ano}</div>
                          <div className="font-mono text-sm">
                            {formatCurrency(receita.receitas_por_ano[ano] || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total por Ano */}
              <Card className="border border-muted/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Total por Ano
                  </h3>
                  <div className="space-y-2">
                    {revenueData.anos.map((ano) => {
                      const valor = revenueData.total_por_ano[ano] || 0;
                      const maxValor = Math.max(...Object.values(revenueData.total_por_ano));
                      const percentage = maxValor > 0 ? (valor / maxValor) * 100 : 0;
                      
                      return (
                        <div key={ano} className="flex items-center justify-between">
                          <span className="text-sm">{ano}</span>
                          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono min-w-[60px] text-right">
                              {formatMillions(valor)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Ranking por Cultura */}
              <Card className="border border-muted/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Ranking por Cultura
                  </h3>
                  <div className="space-y-2">
                    {revenueData.receitas
                      .map((receita) => ({
                        nome: `${receita.cultura} ${receita.sistema}`,
                        total: Object.values(receita.receitas_por_ano).reduce((sum, val) => sum + val, 0)
                      }))
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 5)
                      .map((item, index) => {
                        const maxTotal = Math.max(...revenueData.receitas.map(r => 
                          Object.values(r.receitas_por_ano).reduce((sum, val) => sum + val, 0)
                        ));
                        const percentage = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                        
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm truncate max-w-[120px]">{item.nome}</span>
                            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono min-w-[60px] text-right">
                                {formatMillions(item.total)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}