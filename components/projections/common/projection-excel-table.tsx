"use client";

import { useState, useEffect } from "react";
import { useProjectionFiltersRead } from "@/hooks/use-projection-filters-read";
import { getDynamicProjectionData, type DynamicProjectionData } from "@/lib/actions/projections-actions/excel-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ProjectionExcelTableProps {
  organizationId: string;
}

export function ProjectionExcelTable({
  organizationId,
}: ProjectionExcelTableProps) {
  const [projectionData, setProjectionData] = useState<DynamicProjectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const filters = useProjectionFiltersRead();

  useEffect(() => {
    async function loadProjectionData() {
      try {
        setLoading(true);
        setError(null);
        
        const filtersData = {
          propertyIds: filters.propertyIds.length > 0 ? filters.propertyIds : undefined,
          cultureIds: filters.cultureIds.length > 0 ? filters.cultureIds : undefined,
          systemIds: filters.systemIds.length > 0 ? filters.systemIds : undefined,
          cycleIds: filters.cycleIds.length > 0 ? filters.cycleIds : undefined,
          safraIds: filters.safraIds.length > 0 ? filters.safraIds : undefined,
        };

        const result = await getDynamicProjectionData(organizationId, filtersData);
        setProjectionData(result);
      } catch (err) {
        console.error('Error loading projection data:', err);
        setError('Erro ao carregar dados da tabela de projeções');
      } finally {
        setLoading(false);
      }
    }

    loadProjectionData();
  }, [organizationId, filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${formatNumber(value)}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <CardTitle>Projeções por Safra</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!projectionData || !projectionData.years || projectionData.years.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <CardTitle>Projeções por Safra</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum dado encontrado para os filtros selecionados. 
              Verifique se há áreas de plantio cadastradas para as combinações filtradas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[calc(100vw-280px)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          <CardTitle>Projeções por Safra - {projectionData.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md" style={{ maxWidth: '100%' }}>
          <div className="min-w-max">
            <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 dark:bg-gray-800">
                <TableHead className="font-semibold text-center min-w-[180px] w-[180px] sticky left-0 bg-muted/50 dark:bg-gray-800 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Métrica
                </TableHead>
                <TableHead className="font-semibold text-center min-w-[100px] w-[100px] sticky left-[180px] bg-muted/50 dark:bg-gray-800 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Unidade
                </TableHead>
                {projectionData.years.map((year) => (
                  <TableHead 
                    key={year.safraId} 
                    className="font-semibold text-center min-w-[120px] w-[120px] whitespace-nowrap"
                  >
                    {year.safraName}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Área Plantada */}
              <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                <TableCell className="font-medium min-w-[180px] w-[180px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Área plantada
                </TableCell>
                <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[180px] bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  hectares
                </TableCell>
                {projectionData.years.map((year) => (
                  <TableCell 
                    key={year.safraId} 
                    className="text-center font-mono min-w-[120px] w-[120px]"
                  >
                    {formatNumber(year.areaPlantada)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Produtividade */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium min-w-[180px] w-[180px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Produtividade
                </TableCell>
                <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[180px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {projectionData.years[0]?.produtividadeUnit || 'Sc/ha'}
                </TableCell>
                {projectionData.years.map((year) => (
                  <TableCell 
                    key={year.safraId} 
                    className="text-center font-mono min-w-[120px] w-[120px]"
                  >
                    {formatNumber(year.produtividade)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Preço */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium min-w-[180px] w-[180px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Preço
                </TableCell>
                <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[180px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  R$/Sc
                </TableCell>
                {projectionData.years.map((year) => (
                  <TableCell 
                    key={year.safraId} 
                    className="text-center font-mono min-w-[120px] w-[120px]"
                  >
                    {formatCurrency(year.preco)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Receita */}
              <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-green-50/50 dark:bg-green-900/20">
                <TableCell className="font-medium min-w-[180px] w-[180px] sticky left-0 bg-green-50 dark:bg-green-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Receita
                </TableCell>
                <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[180px] bg-green-50 dark:bg-green-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  R$
                </TableCell>
                {projectionData.years.map((year) => (
                  <TableCell 
                    key={year.safraId} 
                    className="text-center font-mono text-green-700 dark:text-green-400 font-semibold min-w-[120px] w-[120px] bg-green-50/50 dark:bg-green-900/20"
                  >
                    {formatCurrency(year.receita)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Custo/ha */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium min-w-[180px] w-[180px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Custo
                </TableCell>
                <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[180px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  R$/ha
                </TableCell>
                {projectionData.years.map((year) => (
                  <TableCell 
                    key={year.safraId} 
                    className="text-center font-mono min-w-[120px] w-[120px]"
                  >
                    {formatCurrency(year.custoHa)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Custo Total */}
              <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-red-50/50 dark:bg-red-900/20">
                <TableCell className="font-medium min-w-[180px] w-[180px] sticky left-0 bg-red-50 dark:bg-red-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Custo Total
                </TableCell>
                <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[180px] bg-red-50 dark:bg-red-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  R$
                </TableCell>
                {projectionData.years.map((year) => (
                  <TableCell 
                    key={year.safraId} 
                    className="text-center font-mono text-red-700 dark:text-red-400 font-semibold min-w-[120px] w-[120px] bg-red-50/50 dark:bg-red-900/20"
                  >
                    {formatCurrency(year.custoTotal)}
                  </TableCell>
                ))}
              </TableRow>

              {/* EBITDA */}
              <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-blue-50/50 dark:bg-blue-900/20">
                <TableCell className="font-medium min-w-[180px] w-[180px] sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  EBITDA
                </TableCell>
                <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[180px] bg-blue-50 dark:bg-blue-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  R$
                </TableCell>
                {projectionData.years.map((year) => (
                  <TableCell 
                    key={year.safraId} 
                    className={cn(
                      "text-center font-mono font-semibold min-w-[120px] w-[120px] bg-blue-50/50 dark:bg-blue-900/20",
                      year.ebitda >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"
                    )}
                  >
                    {formatCurrency(year.ebitda)}
                  </TableCell>
                ))}
              </TableRow>

              {/* EBITDA % */}
              <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-blue-50/50 dark:bg-blue-900/20">
                <TableCell className="font-medium min-w-[180px] w-[180px] sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  EBITDA
                </TableCell>
                <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[180px] bg-blue-50 dark:bg-blue-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  %
                </TableCell>
                {projectionData.years.map((year) => (
                  <TableCell 
                    key={year.safraId} 
                    className={cn(
                      "text-center font-mono font-semibold min-w-[120px] w-[120px] bg-blue-50/50 dark:bg-blue-900/20",
                      year.ebitdaPercentage >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"
                    )}
                  >
                    {formatPercentage(year.ebitdaPercentage)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}