"use client";

import { useState, useEffect } from "react";
import { useProjectionFiltersRead } from "@/hooks/use-projection-filters-read";
import { getDebtPositionData, type DebtPositionData } from "@/lib/actions/projections-actions/debt-position-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface DebtPositionTableProps {
  organizationId: string;
}

export function DebtPositionTable({
  organizationId,
}: DebtPositionTableProps) {
  const [debtData, setDebtData] = useState<DebtPositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const filters = useProjectionFiltersRead();

  useEffect(() => {
    async function loadDebtData() {
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

        const result = await getDebtPositionData(organizationId, filtersData);
        setDebtData(result);
      } catch (err) {
        console.error('Error loading debt position data:', err);
        setError('Erro ao carregar dados da posição de dívida');
      } finally {
        setLoading(false);
      }
    }

    loadDebtData();
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

  const formatRatio = (value: number) => {
    return `${formatNumber(value, 2)}x`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Posição de Dívida</CardTitle>
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

  if (!debtData || !debtData.years || debtData.years.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Posição de Dívida</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum dado encontrado para os filtros selecionados. 
              Verifique se há dados financeiros cadastrados.
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
          <TrendingUp className="h-5 w-5" />
          <CardTitle>Posição de Dívida - {debtData.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md max-w-full">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-center min-w-[200px] w-[200px] sticky left-0 bg-muted/50 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Métrica
                  </TableHead>
                  <TableHead className="font-semibold text-center min-w-[100px] w-[100px] sticky left-[200px] bg-muted/50 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Unidade
                  </TableHead>
                  {debtData.years.map((year) => (
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
                {/* COMPONENTES DO ENDIVIDAMENTO */}
                <TableRow className="bg-red-50/30">
                  <TableCell colSpan={2 + debtData.years.length} className="font-bold text-center text-red-800 bg-red-100">
                    COMPONENTES DO ENDIVIDAMENTO
                  </TableCell>
                </TableRow>

                {/* Bancos */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Bancos
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.bancos)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Adiantamento Clientes */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Adiantamento Clientes
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.adiantamentoClientes)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Terras */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Terras
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.terras)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Arrendamento */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Arrendamento
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.arrendamento)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Fornecedores */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Fornecedores
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.fornecedores)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Tradings */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Tradings
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.tradings)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Outros */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Outros
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.outros)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Endividamento Total */}
                <TableRow className="hover:bg-muted/30 bg-red-50/50">
                  <TableCell className="font-bold min-w-[200px] w-[200px] sticky left-0 bg-red-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Endividamento Total
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-red-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono font-bold text-red-700 min-w-[120px] w-[120px] bg-red-50/50"
                    >
                      {formatCurrency(year.endividamentoTotal)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ATIVOS LÍQUIDOS */}
                <TableRow className="bg-green-50/30">
                  <TableCell colSpan={2 + debtData.years.length} className="font-bold text-center text-green-800 bg-green-100">
                    ATIVOS LÍQUIDOS
                  </TableCell>
                </TableRow>

                {/* Estoque de Soja */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Estoque de Soja
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.estoqueSoja)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Estoque de Defensivos */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Estoque de Defensivos
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.estoqueDefensivos)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Caixa */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Caixa
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.caixa)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Ativo Biológico */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Ativo Biológico
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.ativoBiologico)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Caixas e Disponibilidades */}
                <TableRow className="hover:bg-muted/30 bg-green-50/50">
                  <TableCell className="font-bold min-w-[200px] w-[200px] sticky left-0 bg-green-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Caixas e Disponibilidades
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-green-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono font-bold text-green-700 min-w-[120px] w-[120px] bg-green-50/50"
                    >
                      {formatCurrency(year.caixasDisponibilidades)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* INDICADORES PRINCIPAIS */}
                <TableRow className="bg-blue-50/30">
                  <TableCell colSpan={2 + debtData.years.length} className="font-bold text-center text-blue-800 bg-blue-100">
                    INDICADORES PRINCIPAIS
                  </TableCell>
                </TableRow>

                {/* Dívida Líquida */}
                <TableRow className="hover:bg-muted/30 bg-blue-50/50">
                  <TableCell className="font-bold min-w-[200px] w-[200px] sticky left-0 bg-blue-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Dívida Líquida
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-blue-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className={cn(
                        "text-center font-mono font-bold min-w-[120px] w-[120px] bg-blue-50/50",
                        year.dividaLiquida >= 0 ? "text-red-700" : "text-green-700"
                      )}
                    >
                      {formatCurrency(year.dividaLiquida)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Receita (Ano Safra) */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Receita (Ano Safra)
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.receita)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* EBITDA (Ano Safra) */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    EBITDA (Ano Safra)
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    R$
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.ebitda)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ÍNDICES DE ENDIVIDAMENTO */}
                <TableRow className="bg-orange-50/30">
                  <TableCell colSpan={2 + debtData.years.length} className="font-bold text-center text-orange-800 bg-orange-100">
                    ÍNDICES DE ENDIVIDAMENTO
                  </TableCell>
                </TableRow>

                {/* Dívida/Receita */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Dívida/Receita
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    x
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatRatio(year.dividaReceita)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Dívida/EBITDA */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Dívida/EBITDA
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    x
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatRatio(year.dividaEbitda)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Dívida Líquida/Receita */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Dívida Líquida/Receita
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    x
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatRatio(year.dividaLiquidaReceita)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Dívida Líquida/EBITDA */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Dívida Líquida/EBITDA
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    x
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatRatio(year.dividaLiquidaEbitda)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* EXPOSIÇÃO CAMBIAL */}
                <TableRow className="bg-purple-50/30">
                  <TableCell colSpan={2 + debtData.years.length} className="font-bold text-center text-purple-800 bg-purple-100">
                    EXPOSIÇÃO CAMBIAL
                  </TableCell>
                </TableRow>

                {/* Dívida em Dólar */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Dívida em Dólar
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    USD
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.dividaDolar)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Dívida Líquida em Dólar */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Dívida Líquida em Dólar
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground min-w-[100px] w-[100px] sticky left-[200px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    USD
                  </TableCell>
                  {debtData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(year.dividaLiquidaDolar)}
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