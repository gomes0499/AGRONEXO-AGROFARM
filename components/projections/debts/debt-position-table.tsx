"use client";

import React, { useState, useEffect } from "react";
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
import { TrendingDown, TrendingUp, DollarSign, ChevronRight, ChevronDown, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DebtPositionData } from "@/lib/actions/debt-position-actions";
import { Button } from "@/components/ui/button";
import { getDebtDetails, type DebtDetailsResponse } from "@/lib/actions/debt-details-actions";

import type { ConsolidatedDebtPosition } from "@/lib/actions/debt-position-actions";

// Função para converter safra para ano (2024/25 -> 2025)
function safraToYear(safra: string): string {
  const match = safra.match(/(\d{4})\/(\d{2})/);
  if (match) {
    const yearStart = parseInt(match[1]);
    const yearEnd = parseInt(match[2]);
    // Se o ano final for menor que 50, assumimos que é 20XX, senão 19XX
    const fullYearEnd = yearEnd < 50 ? 2000 + yearEnd : 1900 + yearEnd;
    return fullYearEnd.toString();
  }
  return safra; // Retorna original se não for no formato esperado
}

interface DebtPositionTableProps {
  organizationId: string;
  initialDebtPositions: ConsolidatedDebtPosition;
  safras: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number; }>;
}

export function DebtPositionTable({ organizationId, initialDebtPositions, safras }: DebtPositionTableProps) {
  const { dividas, ativos, indicadores, anos } = initialDebtPositions;
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [expandedDebts, setExpandedDebts] = useState<Record<string, boolean>>({});
  const [debtDetails, setDebtDetails] = useState<DebtDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
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

  // Carregar detalhes das dívidas quando necessário
  useEffect(() => {
    const hasExpandedDebt = Object.values(expandedDebts).some(v => v);
    if (hasExpandedDebt && !debtDetails && !loadingDetails) {
      loadDebtDetails();
    }
  }, [expandedDebts]);

  const loadDebtDetails = async () => {
    setLoadingDetails(true);
    try {
      const details = await getDebtDetails(organizationId);
      setDebtDetails(details);
    } catch (error) {
      console.error('Erro ao carregar detalhes das dívidas:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleDebtExpansion = (categoria: string) => {
    setExpandedDebts(prev => ({ ...prev, [categoria]: !prev[categoria] }));
  };

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
                  <TableRow className="hover:!bg-[#17134F]" style={{ backgroundColor: '#17134F' }}>
                    <TableHead className="font-medium text-white min-w-[200px] w-[200px] sticky left-0 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md py-2" style={{ backgroundColor: '#17134F' }}>
                      <div>
                        <div className="text-sm">Posição de Dívida</div>
                        <div className="text-[10px] font-normal opacity-90">Valores em R$ mil</div>
                      </div>
                    </TableHead>
                    {anos.map((ano, index) => (
                      <TableHead 
                        key={ano} 
                        className={cn(
                          "font-medium text-white text-center min-w-[100px] w-[100px] whitespace-nowrap text-sm py-2",
                          index === anos.length - 1 && "rounded-tr-md"
                        )}
                        style={{ backgroundColor: '#17134F' }}
                      >
                        {safraToYear(ano)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* === SEÇÃO DE DÍVIDAS === */}
                  <TableRow className="font-medium border-b border-[#17134F]/20" style={{ backgroundColor: '#E8E4F3' }}>
                    <TableCell className="font-medium text-[#17134F] min-w-[200px] w-[200px] sticky left-0 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-1" style={{ backgroundColor: '#E8E4F3' }}>
                      <button
                        onClick={() => toggleSection('dividas')}
                        className="flex items-center gap-2 w-full text-left text-xs"
                      >
                        {isSectionCollapsed('dividas') ? (
                          <ChevronRight className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        <TrendingDown className="h-3 w-3" />
                        DÍVIDAS
                      </button>
                    </TableCell>
                    {anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[100px] w-[100px] text-[#17134F]"
                        style={{ backgroundColor: '#E8E4F3' }}
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de dívidas */}
                  {!isSectionCollapsed('dividas') && dividas.map((divida, index) => (
                    <React.Fragment key={`divida-${index}`}>
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <span>
                              {formatCategoria(divida.categoria)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDebtExpansion(divida.categoria)}
                              className="h-6 w-6 p-0"
                            >
                              {expandedDebts[divida.categoria] ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] font-semibold"
                          >
                            {divida.valores_por_ano[ano] 
                              ? formatNumber(divida.valores_por_ano[ano], 0)
                              : '-'
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                      
                      {/* Detalhes expandidos */}
                      {expandedDebts[divida.categoria] && loadingDetails && (
                        <TableRow>
                          <TableCell colSpan={anos.length + 1} className="text-center py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">Carregando detalhes...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {expandedDebts[divida.categoria] && !loadingDetails && debtDetails && (
                        <>
                          {divida.categoria === 'BANCOS' && debtDetails.bancos.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={anos.length + 1} className="text-center py-2 text-sm text-muted-foreground">
                                Nenhum detalhe de dívida bancária disponível
                              </TableCell>
                            </TableRow>
                          )}
                          {divida.categoria === 'BANCOS' && debtDetails.bancos.map((banco) => (
                            <TableRow key={`banco-${banco.id}`} className="hover:bg-muted/10 dark:hover:bg-gray-700/10">
                              <TableCell className="text-sm min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-muted-foreground">
                                <div className="flex flex-col">
                                  <span>{banco.nome}</span>
                                  {banco.taxa_juros && (
                                    <span className="text-xs">Taxa: {banco.taxa_juros}% | {banco.moeda || 'BRL'}</span>
                                  )}
                                </div>
                              </TableCell>
                              {anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-sm"
                                >
                                  {banco.valores_por_ano[ano] 
                                    ? formatNumber(banco.valores_por_ano[ano], 0)
                                    : '-'
                                  }
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                          
                          {divida.categoria === 'TERRAS' && debtDetails.terras.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={anos.length + 1} className="text-center py-2 text-sm text-muted-foreground">
                                Nenhum detalhe de aquisição de terras disponível
                              </TableCell>
                            </TableRow>
                          )}
                          {divida.categoria === 'TERRAS' && debtDetails.terras.map((terra) => (
                            <TableRow key={`terra-${terra.id}`} className="hover:bg-muted/10 dark:hover:bg-gray-700/10">
                              <TableCell className="text-sm min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-muted-foreground">
                                <div className="flex flex-col">
                                  <span>{terra.nome}</span>
                                  {terra.area_hectares && (
                                    <span className="text-xs">{terra.area_hectares} ha | {terra.moeda || 'BRL'}</span>
                                  )}
                                </div>
                              </TableCell>
                              {anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-sm"
                                >
                                  {terra.valores_por_ano[ano] 
                                    ? formatNumber(terra.valores_por_ano[ano], 0)
                                    : '-'
                                  }
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                          
                          {divida.categoria === 'FORNECEDORES' && debtDetails.fornecedores.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={anos.length + 1} className="text-center py-2 text-sm text-muted-foreground">
                                Nenhum detalhe de dívida com fornecedores disponível
                              </TableCell>
                            </TableRow>
                          )}
                          {divida.categoria === 'FORNECEDORES' && debtDetails.fornecedores.map((fornecedor) => (
                            <TableRow key={`fornecedor-${fornecedor.id}`} className="hover:bg-muted/10 dark:hover:bg-gray-700/10">
                              <TableCell className="text-sm min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-muted-foreground">
                                <div className="flex flex-col">
                                  <span>{fornecedor.nome}</span>
                                  {fornecedor.tipo && (
                                    <span className="text-xs">{fornecedor.tipo} | {fornecedor.moeda || 'BRL'}</span>
                                  )}
                                </div>
                              </TableCell>
                              {anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-sm"
                                >
                                  {fornecedor.valores_por_ano[ano] 
                                    ? formatNumber(fornecedor.valores_por_ano[ano], 0)
                                    : '-'
                                  }
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}
                    </React.Fragment>
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
                      const isPositiveCash = valor < 0; // Valor negativo significa mais caixa que dívida
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                            isPositiveCash ? "text-green-600 dark:text-green-400" : ""
                          )}
                        >
                          {valor !== 0 ? formatNumber(Math.abs(valor), 0) : '-'}
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
                        {anos.map((ano) => {
                          const valor = indicadores.divida_liquida_dolar[ano] || 0;
                          const isPositiveCash = valor < 0; // Valor negativo significa mais caixa que dívida
                          return (
                            <TableCell 
                              key={ano} 
                              className={cn(
                                "text-center min-w-[120px] w-[120px]",
                                isPositiveCash && "text-green-600 dark:text-green-400"
                              )}
                            >
                              {valor !== 0 ? formatNumber(Math.abs(valor), 0) : '-'}
                            </TableCell>
                          );
                        })}
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

                      {/* Dívida Líquida/ Ebitda */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Dívida Líquida/ Ebitda
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatRatio(indicadores.indicadores_calculados.divida_liquida_ebitda[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* LTV */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          LTV
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {indicadores.ltv && indicadores.ltv[ano] !== undefined 
                              ? formatRatio(indicadores.ltv[ano] / 100) 
                              : '-'}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* LTV Líquido */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          LTV Líquido
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {indicadores.ltv_liquido && indicadores.ltv_liquido[ano] !== undefined 
                              ? formatRatio(indicadores.ltv_liquido[ano] / 100) 
                              : '-'}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Índice de Liquidez Corrente */}
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Índice de Liquidez Corrente
                        </TableCell>
                        {anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {indicadores.liquidez_corrente && indicadores.liquidez_corrente[ano] !== undefined 
                              ? `${formatRatio(indicadores.liquidez_corrente[ano])}x` 
                              : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}