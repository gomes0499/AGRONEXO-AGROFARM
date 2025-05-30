"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import type { ConsolidatedRevenues } from "@/lib/actions/cash-flow-projections-actions";

interface CashFlowProjectionsDashboardProps {
  revenueData: ConsolidatedRevenues;
  organizationId: string;
}

export function CashFlowProjectionsDashboard({ 
  revenueData,
  organizationId 
}: CashFlowProjectionsDashboardProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  const getYearlyTotal = (year: number) => {
    return revenueData.total_receitas_agricolas[year] || 0;
  };

  const formatCultureName = (culture: any) => {
    let name = culture.cultura_nome;
    if (culture.sistema_nome && culture.sistema_nome !== culture.cultura_nome) {
      name += ` ${culture.sistema_nome}`;
    }
    if (culture.ciclo_nome) {
      name += ` - ${culture.ciclo_nome}`;
    }
    return name.toUpperCase();
  };

  const getCultureRevenue = (culture: any, year: number) => {
    return culture.projections_by_year[year]?.receita || 0;
  };

  const getCultureDetails = (culture: any, year: number) => {
    return culture.projections_by_year[year] || {
      area: 0,
      produtividade: 0,
      unidade: 'sc/ha',
      preco: 0,
      receita: 0,
      custo_ha: 0,
      custo_total: 0,
      ebitda: 0,
      ebitda_percent: 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fluxo de Caixa Projetado</h2>
          <p className="text-muted-foreground">
            Receitas agrícolas consolidadas por cultura e período
          </p>
        </div>
        <Button variant="outline">
          Configurar Projeções
        </Button>
      </div>

      <Tabs defaultValue="consolidado" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
          <TabsTrigger value="detalhado">Detalhado</TabsTrigger>
          <TabsTrigger value="analise">Análise por Cultura</TabsTrigger>
        </TabsList>

        {/* Aba Consolidado - Tabela Principal */}
        <TabsContent value="consolidado" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receitas Agrícolas Consolidadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium border-r min-w-[200px]">
                        Fluxo Caixa Projetado
                      </th>
                      {revenueData.anos.map(ano => (
                        <th key={ano} className="text-center p-3 font-medium border-r min-w-[120px]">
                          {ano}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Total Geral */}
                    <tr className="bg-primary/5 font-semibold">
                      <td className="p-3 border-r">
                        <Badge variant="default" className="bg-green-600">
                          Receitas Agrícolas
                        </Badge>
                      </td>
                      {revenueData.anos.map(ano => (
                        <td key={ano} className="p-3 border-r text-center font-bold">
                          {formatCurrency(getYearlyTotal(ano))}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Detalhamento por cultura */}
                    {revenueData.detail_by_culture
                      .filter(culture => 
                        revenueData.anos.some(ano => getCultureRevenue(culture, ano) > 0)
                      )
                      .map((culture, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                          <td className="p-3 border-r">
                            <span className="font-medium">
                              {formatCultureName(culture)}
                            </span>
                          </td>
                          {revenueData.anos.map(ano => {
                            const receita = getCultureRevenue(culture, ano);
                            return (
                              <td key={ano} className="p-3 border-r text-center">
                                {receita > 0 ? formatCurrency(receita) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Detalhado - Métricas por Cultura */}
        <TabsContent value="detalhado" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium">Ano:</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1 border rounded-md"
            >
              {revenueData.anos.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4">
            {revenueData.detail_by_culture
              .filter(culture => getCultureRevenue(culture, selectedYear) > 0)
              .map((culture, index) => {
                const details = getCultureDetails(culture, selectedYear);
                return (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {formatCultureName(culture)}
                        </CardTitle>
                        <Badge 
                          variant={details.ebitda_percent > 40 ? "default" : details.ebitda_percent > 20 ? "secondary" : "destructive"}
                        >
                          EBITDA: {details.ebitda_percent.toFixed(1)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="text-muted-foreground">Área plantada</label>
                          <p className="font-medium">{formatNumber(details.area)} hectares</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Produtividade</label>
                          <p className="font-medium">{formatNumber(details.produtividade)} {details.unidade}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Preço</label>
                          <p className="font-medium">R$ {formatNumber(details.preco)}/{details.unidade.split('/')[0]}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Receita</label>
                          <p className="font-bold text-green-600">{formatCurrency(details.receita)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Custo/ha</label>
                          <p className="font-medium">R$ {formatNumber(details.custo_ha)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Custo Total</label>
                          <p className="font-medium text-red-600">{formatCurrency(details.custo_total)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">EBITDA</label>
                          <p className={`font-bold ${details.ebitda > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(details.ebitda)}
                          </p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">EBITDA %</label>
                          <p className={`font-bold ${details.ebitda_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {details.ebitda_percent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            }
          </div>
        </TabsContent>

        {/* Aba Análise */}
        <TabsContent value="analise" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total por Ano */}
            {revenueData.anos.map(ano => (
              <Card key={ano}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{ano}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(getYearlyTotal(ano))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receita total agrícola
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ranking de Culturas */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Receitas por Cultura (2024)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {revenueData.detail_by_culture
                  .map(culture => ({
                    ...culture,
                    receita_2024: getCultureRevenue(culture, 2024)
                  }))
                  .filter(culture => culture.receita_2024 > 0)
                  .sort((a, b) => b.receita_2024 - a.receita_2024)
                  .map((culture, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}º</Badge>
                        <span className="font-medium">{formatCultureName(culture)}</span>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatCurrency(culture.receita_2024)}
                      </span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}