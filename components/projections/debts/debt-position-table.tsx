"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingDown, TrendingUp, DollarSign, ChevronRight, ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DebtPositionData } from "@/lib/actions/debt-position-actions";

interface DebtPositionTableProps {
  dividas: DebtPositionData[];
  ativos: DebtPositionData[];
  indicadores: {
    endividamento_total: Record<string, number>;
    caixas_disponibilidades: Record<string, number>;
    divida_liquida: Record<string, number>;
    divida_dolar: Record<string, number>;
    divida_liquida_dolar: Record<string, number>;
    dolar_fechamento: Record<string, number>;
    receita_ano_safra: Record<string, number>;
    ebitda_ano_safra: Record<string, number>;
    indicadores_calculados: {
      divida_receita: Record<string, number>;
      divida_ebitda: Record<string, number>;
      divida_liquida_receita: Record<string, number>;
      divida_liquida_ebitda: Record<string, number>;
      reducao_valor: Record<string, number>;
      reducao_percentual: Record<string, number>;
    };
  };
  anos: string[];
}

export function DebtPositionTable({ dividas, ativos, indicadores, anos }: DebtPositionTableProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatRatio = (value: number) => {
    return value.toFixed(2);
  };
  
  const formatCategoria = (categoria: string) => {
    // Converte string de uppercase para normal case
    if (!categoria) return '';
    return categoria.charAt(0) + categoria.slice(1).toLowerCase();
  };

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  const isSectionCollapsed = (section: string) => collapsedSections.has(section);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<TrendingDown className="h-4 w-4" />}
          title="Posição de Dívida"
          description="Análise consolidada da posição de endividamento e disponibilidades financeiras"
        />
        <CardContent className="p-6">
          <div className="overflow-x-auto overflow-y-hidden border rounded-md" style={{ maxWidth: '100%' }}>
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary dark:bg-primary/90 dark:hover:bg-primary/90">
                    <TableHead className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                      Posição de Dívida
                    </TableHead>
                    {anos.map((ano, index) => (
                      <TableHead 
                        key={ano} 
                        className={cn(
                          "font-medium text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                          index === anos.length - 1 && "rounded-tr-md"
                        )}
                      >
                        {ano}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* === SEÇÃO DE DÍVIDAS === */}
                  <TableRow className="bg-primary dark:bg-primary/90 font-medium border-b-2 border-primary/20">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('dividas')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('dividas') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingDown className="h-4 w-4" />
                        Dívidas
                      </button>
                    </TableCell>
                    {anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de dívidas */}
                  {!isSectionCollapsed('dividas') && dividas.map((divida, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                      <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                        {formatCategoria(divida.categoria)}
                      </TableCell>
                      {anos.map((ano) => (
                        <TableCell 
                          key={ano} 
                          className="text-center min-w-[120px] w-[120px]"
                        >
                          {divida.valores_por_ano[ano] 
                            ? formatNumber(divida.valores_por_ano[ano], 0)
                            : '-'
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Total do endividamento */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Endividamento Total
                    </TableCell>
                    {anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800"
                      >
                        {formatNumber(indicadores.endividamento_total[ano] || 0, 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE ATIVOS === */}
                  <TableRow className="bg-primary dark:bg-primary/90 font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('ativos')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('ativos') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingUp className="h-4 w-4" />
                        Caixas e Disponibilidades
                      </button>
                    </TableCell>
                    {anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de ativos */}
                  {!isSectionCollapsed('ativos') && ativos.map((ativo, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                      <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                        {formatCategoria(ativo.categoria)}
                      </TableCell>
                      {anos.map((ano) => (
                        <TableCell 
                          key={ano} 
                          className="text-center min-w-[120px] w-[120px]"
                        >
                          {ativo.valores_por_ano[ano] 
                            ? formatNumber(ativo.valores_por_ano[ano], 0)
                            : '-'
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Total das disponibilidades */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Caixas e Disponibilidades
                    </TableCell>
                    {anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800"
                      >
                        {formatNumber(indicadores.caixas_disponibilidades[ano] || 0, 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE ANÁLISE === */}
                  <TableRow className="bg-primary dark:bg-primary/90 font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('analise')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('analise') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <BarChart3 className="h-4 w-4" />
                        Análise e Indicadores
                      </button>
                    </TableCell>
                    {anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Dívida Líquida */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Dívida Líquida
                    </TableCell>
                    {anos.map((ano) => {
                      const valor = indicadores.divida_liquida[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                            valor < 0 ? "text-destructive dark:text-red-400" : "dark:text-green-400"
                          )}
                        >
                          {formatNumber(valor, 0)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Linhas da seção de análise */}
                  {!isSectionCollapsed('analise') && (
                    <>
                      {/* Dólar Fechamento */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Dólar Fechamento
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatNumber(indicadores.dolar_fechamento[ano] || 0, 2)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Dívida em Dólar */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Dívida em Dólar
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatNumber(indicadores.divida_dolar[ano] || 0, 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Dívida Líquida em Dólar */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Dívida Líquida em Dólar
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatNumber(indicadores.divida_liquida_dolar[ano] || 0, 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* === SEÇÃO DE INDICADORES === */}
                  <TableRow className="bg-primary dark:bg-primary/90 font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('indicadores')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('indicadores') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <BarChart3 className="h-4 w-4" />
                        Indicadores de Receita e Endividamento
                      </button>
                    </TableCell>
                    {anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas da seção de indicadores */}
                  {!isSectionCollapsed('indicadores') && (
                    <>
                      {/* Receita (Ano Safra) */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Receita (Ano Safra)
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatNumber(indicadores.receita_ano_safra[ano] || 0, 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Ebitda (Ano Safra) */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          EBITDA (Ano Safra)
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatNumber(indicadores.ebitda_ano_safra[ano] || 0, 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Dívida/ Receita */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Dívida/ Receita
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatRatio(indicadores.indicadores_calculados.divida_receita[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Dívida/ Ebitda */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Dívida/ Ebitda
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatRatio(indicadores.indicadores_calculados.divida_ebitda[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Dívida Líquida/ Receita */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Dívida Líquida/ Receita
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatRatio(indicadores.indicadores_calculados.divida_liquida_receita[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* Dívida Líquida/ Ebitda */}
                  <TableRow className="font-medium border-t-2 border-gray-100">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Dívida Líquida/ Ebitda
                    </TableCell>
                    {anos.map((ano) => {
                      const valor = indicadores.indicadores_calculados.divida_liquida_ebitda[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className="text-center font-bold min-w-[120px] w-[120px]"
                        >
                          {formatRatio(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}