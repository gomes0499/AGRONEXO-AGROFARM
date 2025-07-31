"use client";

import React, { useState } from "react";
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
import { TrendingDown, TrendingUp, CircleDollarSign, DollarSign, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { getCostCategoryName, COST_CATEGORIES } from "@/lib/utils/cost-categories";
import type { FluxoCaixaData } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";
import type { FluxoCaixaCorrigidoData } from "@/lib/actions/projections-actions/fluxo-caixa-corrigido";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// União dos tipos para suportar ambas as estruturas
type FluxoCaixaUnifiedData = FluxoCaixaData | FluxoCaixaCorrigidoData;

interface FluxoCaixaTableProps {
  data: FluxoCaixaUnifiedData;
}

export function FluxoCaixaTable({ data }: FluxoCaixaTableProps) {
  const [selectedYear, setSelectedYear] = useState<string | undefined>();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [expandedCosts, setExpandedCosts] = useState<Record<string, boolean>>({});
  const [expandedOutrasDespesas, setExpandedOutrasDespesas] = useState<Record<string, boolean>>({});
  const [expandedInvestimentos, setExpandedInvestimentos] = useState<Record<string, boolean>>({});
  const [expandedFinanceiras, setExpandedFinanceiras] = useState<Record<string, boolean>>({});
  const [expandedReceitas, setExpandedReceitas] = useState<Record<string, boolean>>({});
  if (!data || !data.anos || data.anos.length === 0) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<DollarSign className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise consolidada de receitas, despesas e fluxo de caixa"
        />
        <CardContent className="p-6">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Usar os dados diretamente (filtragem já feita no server-side)
  const dataFiltrada = data;
  
  // Type guard para verificar se é FluxoCaixaCorrigidoData
  const isFluxoCaixaCorrigido = (data: FluxoCaixaUnifiedData): data is FluxoCaixaCorrigidoData => {
    return 'servico_divida' in data;
  };

  // Garantir que todas as propriedades existam antes de acessá-las com estrutura completa
  if (!dataFiltrada.despesas_agricolas) {
    dataFiltrada.despesas_agricolas = { culturas: {}, total_por_ano: {} };
  } else {
    if (!dataFiltrada.despesas_agricolas.culturas) {
      dataFiltrada.despesas_agricolas.culturas = {};
    }
    if (!dataFiltrada.despesas_agricolas.total_por_ano) {
      dataFiltrada.despesas_agricolas.total_por_ano = {};
    }
  }
  
  if (!dataFiltrada.outras_despesas) {
    dataFiltrada.outras_despesas = { 
      arrendamento: {}, 
      pro_labore: {}, 
      financeiras: {}, 
      tributarias: {}, 
      outras: {}, 
      total_por_ano: {} 
    } as any;
  } else {
    if (!dataFiltrada.outras_despesas.arrendamento) {
      dataFiltrada.outras_despesas.arrendamento = {};
    }
    if (!dataFiltrada.outras_despesas.pro_labore) {
      dataFiltrada.outras_despesas.pro_labore = {};
    }
    if (isFluxoCaixaCorrigido(dataFiltrada) && !dataFiltrada.outras_despesas.administrativas) {
      dataFiltrada.outras_despesas.administrativas = {};
    }
    if (!dataFiltrada.outras_despesas.financeiras) {
      dataFiltrada.outras_despesas.financeiras = {};
    }
    if (!dataFiltrada.outras_despesas.tributarias) {
      dataFiltrada.outras_despesas.tributarias = {};
    }
    if (!dataFiltrada.outras_despesas.outras) {
      dataFiltrada.outras_despesas.outras = {};
    }
    if (!dataFiltrada.outras_despesas.total_por_ano) {
      dataFiltrada.outras_despesas.total_por_ano = {};
    }
  }
  
  if (!dataFiltrada.investimentos) {
    dataFiltrada.investimentos = { 
      total: {}, 
      terras: {}, 
      maquinarios: {}, 
      outros: {} 
    };
  } else {
    if (!dataFiltrada.investimentos.total) {
      dataFiltrada.investimentos.total = {};
    }
    if (!dataFiltrada.investimentos.terras) {
      dataFiltrada.investimentos.terras = {};
    }
    if (!dataFiltrada.investimentos.maquinarios) {
      dataFiltrada.investimentos.maquinarios = {};
    }
    if (!dataFiltrada.investimentos.outros) {
      dataFiltrada.investimentos.outros = {};
    }
  }
  
  // Verificar se servico_divida existe (apenas em FluxoCaixaCorrigidoData)
  if (isFluxoCaixaCorrigido(dataFiltrada)) {
    if (!dataFiltrada.servico_divida) {
      dataFiltrada.servico_divida = { 
        bancos: {}, 
        fornecedores: {}, 
        terras: {}, 
        total_por_ano: {} 
      };
    } else {
      if (!dataFiltrada.servico_divida.bancos) {
        dataFiltrada.servico_divida.bancos = {};
      }
      if (!dataFiltrada.servico_divida.fornecedores) {
        dataFiltrada.servico_divida.fornecedores = {};
      }
      if (!dataFiltrada.servico_divida.terras) {
        dataFiltrada.servico_divida.terras = {};
      }
      if (!dataFiltrada.servico_divida.total_por_ano) {
        dataFiltrada.servico_divida.total_por_ano = {};
      }
    }
  }
  
  if (!dataFiltrada.receitas_agricolas) {
    dataFiltrada.receitas_agricolas = { culturas: {}, total_por_ano: {} };
  } else {
    if (!dataFiltrada.receitas_agricolas.culturas) {
      dataFiltrada.receitas_agricolas.culturas = {};
    }
    if (!dataFiltrada.receitas_agricolas.total_por_ano) {
      dataFiltrada.receitas_agricolas.total_por_ano = {};
    }
  }
  
  // Inicializar fluxo_liquido e fluxo_acumulado se não existirem
  if (!dataFiltrada.fluxo_liquido) {
    dataFiltrada.fluxo_liquido = {};
  }
  
  if (!dataFiltrada.fluxo_acumulado) {
    dataFiltrada.fluxo_acumulado = {};
  }

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
          icon={<DollarSign className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise consolidada de receitas, despesas e fluxo de caixa"
        />
        <CardContent className="p-6">
          <TooltipProvider>
            <div className="overflow-x-auto overflow-y-hidden border rounded-md" style={{ maxWidth: '100%' }}>
              <div className="min-w-max">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary dark:bg-primary/90 dark:hover:bg-primary/90">
                      <TableHead className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                        Fluxo de Caixa
                      </TableHead>
                      {dataFiltrada.anos.map((ano, index) => (
                        <TableHead 
                          key={ano} 
                          className={cn(
                            "font-medium text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                            index === dataFiltrada.anos.length - 1 && "rounded-tr-md",
                            selectedYear === ano && "ring-2 ring-primary-foreground ring-inset"
                          )}
                        >
                          {ano}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* === SEÇÃO DE RECEITAS AGRÍCOLAS === */}
                    <TableRow className="bg-primary font-semibold border-b-2 border-primary/20 dark:bg-primary/90">
                      <TableCell className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <button
                          onClick={() => toggleSection('receitas')}
                          className="flex items-center gap-2 w-full text-left"
                        >
                          {isSectionCollapsed('receitas') ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <TrendingUp className="h-4 w-4" />
                          Receitas Agrícolas
                        </button>
                      </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de receitas por cultura */}
                  {!isSectionCollapsed('receitas') && dataFiltrada.receitas_agricolas?.culturas && Object.keys(dataFiltrada.receitas_agricolas.culturas).map((cultura) => (
                    <React.Fragment key={`receita-${cultura}`}>
                      <TableRow className="hover:bg-muted/20 dark:hover:bg-gray-700/20 transition-colors">
                        <TableCell className="font-medium text-sm min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center justify-between">
                            <span>{cultura}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedReceitas(prev => ({ ...prev, [cultura]: !prev[cultura] }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedReceitas[cultura] ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      {dataFiltrada.anos.map((ano) => {
                        const valor = (dataFiltrada.receitas_agricolas?.culturas?.[cultura]?.[ano]) || 0;
                        const total = (dataFiltrada.receitas_agricolas?.total_por_ano?.[ano]) || 0;
                        const percentual = total > 0 ? (valor / total * 100).toFixed(1) : 0;
                        
                        return (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help text-green-700 dark:text-green-400 font-medium">
                                  {formatCurrency(valor)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium">{cultura} - {ano}</p>
                                  <p>{percentual}% do total de receitas</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                      </TableRow>

                      {/* Drill-down Receitas por Cultura */}
                      {expandedReceitas[cultura] && 'culturas_detalhado' in dataFiltrada.receitas_agricolas && dataFiltrada.receitas_agricolas.culturas_detalhado?.[cultura] && (
                        <>
                          {/* Linha Área */}
                          <TableRow className="bg-gray-50/50 dark:bg-gray-800/30">
                            <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                              📐 Área (ha)
                            </TableCell>
                            {dataFiltrada.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                              >
                                {('culturas_detalhado' in dataFiltrada.receitas_agricolas && dataFiltrada.receitas_agricolas.culturas_detalhado?.[cultura]?.[ano]?.area || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                              </TableCell>
                            ))}
                          </TableRow>
                          
                          {/* Linha Produtividade */}
                          <TableRow className="bg-gray-50/50 dark:bg-gray-800/30">
                            <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                              🌾 Produtividade (sc/ha)
                            </TableCell>
                            {dataFiltrada.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                              >
                                {('culturas_detalhado' in dataFiltrada.receitas_agricolas && dataFiltrada.receitas_agricolas.culturas_detalhado?.[cultura]?.[ano]?.produtividade || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                              </TableCell>
                            ))}
                          </TableRow>
                          
                          {/* Linha Preço */}
                          <TableRow className="bg-gray-50/50 dark:bg-gray-800/30">
                            <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                              💰 Preço (R$/sc)
                            </TableCell>
                            {dataFiltrada.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                              >
                                {formatCurrency('culturas_detalhado' in dataFiltrada.receitas_agricolas && dataFiltrada.receitas_agricolas.culturas_detalhado?.[cultura]?.[ano]?.preco || 0)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                  
                  {/* Total de receitas */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-semibold border-y">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Receitas Agrícolas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-semibold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800/50 text-green-700 dark:text-green-400"
                      >
                        {formatCurrency((dataFiltrada.receitas_agricolas?.total_por_ano?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE DESPESAS AGRÍCOLAS === */}
                  <TableRow className="bg-primary font-semibold border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('despesas')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('despesas') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingDown className="h-4 w-4" />
                        Despesas Agrícolas
                      </button>
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de despesas por cultura */}
                  {!isSectionCollapsed('despesas') && dataFiltrada.despesas_agricolas?.culturas && Object.keys(dataFiltrada.despesas_agricolas.culturas).map((cultura) => {
                    const culturaKey = `despesa-${cultura}`;
                    const isExpanded = expandedCosts[culturaKey];
                    
                    return (
                      <React.Fragment key={culturaKey}>
                        <TableRow className="hover:bg-muted/20 dark:hover:bg-gray-700/20 transition-colors">
                          <TableCell className="font-medium text-sm min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8 text-gray-700 dark:text-gray-300">
                            <div className="flex items-center justify-between">
                              <span>{cultura}</span>
                              {'culturas_detalhado' in dataFiltrada.despesas_agricolas && dataFiltrada.despesas_agricolas.culturas_detalhado?.[cultura] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedCosts(prev => ({ ...prev, [culturaKey]: !prev[culturaKey] }))}
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          {dataFiltrada.anos.map((ano) => {
                            const valor = (dataFiltrada.despesas_agricolas?.culturas?.[cultura]?.[ano]) || 0;
                            const temDetalhes = 'culturas_detalhado' in dataFiltrada.despesas_agricolas ? dataFiltrada.despesas_agricolas.culturas_detalhado?.[cultura]?.[ano] : undefined;
                            
                            return (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {temDetalhes ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help text-red-700 dark:text-red-400 font-medium">
                                        {formatCurrency(valor)}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-sm">
                                        <p className="font-medium mb-1">{cultura} - {ano}</p>
                                        <p className="text-xs text-muted-foreground">Clique para ver detalhes por categoria</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-red-700 dark:text-red-400 font-medium">
                                    {formatCurrency(valor)}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        
                        {/* Detalhes expandidos por categoria */}
                        {isExpanded && 'culturas_detalhado' in dataFiltrada.despesas_agricolas && dataFiltrada.despesas_agricolas.culturas_detalhado?.[cultura] && (
                          <>
                            {Object.entries(COST_CATEGORIES).map(([categoria, nomeCategoria]) => {
                              const temValorCategoria = dataFiltrada.anos.some(
                                ano => 'culturas_detalhado' in dataFiltrada.despesas_agricolas && dataFiltrada.despesas_agricolas.culturas_detalhado?.[cultura]?.[ano]?.[categoria] && dataFiltrada.despesas_agricolas.culturas_detalhado[cultura][ano][categoria] > 0
                              );
                              
                              if (!temValorCategoria) return null;
                              
                              return (
                                <TableRow key={`${culturaKey}-${categoria}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                                  <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                    {getCostCategoryName(categoria)}
                                  </TableCell>
                                  {dataFiltrada.anos.map((ano) => {
                                    const valorCategoria = 'culturas_detalhado' in dataFiltrada.despesas_agricolas ? (dataFiltrada.despesas_agricolas.culturas_detalhado?.[cultura]?.[ano]?.[categoria] || 0) : 0;
                                    
                                    return (
                                      <TableCell 
                                        key={ano} 
                                        className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                      >
                                        {valorCategoria > 0 ? formatCurrency(valorCategoria) : '-'}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Total de despesas */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-semibold border-y">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Despesas Agrícolas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-semibold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800/50 text-red-700 dark:text-red-400"
                      >
                        {formatCurrency((dataFiltrada.despesas_agricolas?.total_por_ano?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE MARGEM BRUTA === */}
                  <TableRow className="bg-blue-50 dark:bg-blue-900/20 font-bold border-t-2 border-b">
                    <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Margem Bruta Agrícola
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      const receitas = (dataFiltrada.receitas_agricolas?.total_por_ano?.[ano]) || 0;
                      const despesas = (dataFiltrada.despesas_agricolas?.total_por_ano?.[ano]) || 0;
                      const valor = receitas - despesas;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-bold min-w-[120px] w-[120px] bg-blue-50 dark:bg-blue-900/20",
                            valor < 0 ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === SEÇÃO DE OUTRAS DESPESAS === */}
                  <TableRow className="bg-primary font-semibold border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('outras_despesas')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('outras_despesas') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingDown className="h-4 w-4" />
                        Outras Despesas
                      </button>
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de outras despesas */}
                  {!isSectionCollapsed('outras_despesas') && (
                    <>
                      {/* Arrendamento */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <span>Arrendamento</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedOutrasDespesas(prev => ({ ...prev, arrendamento: !prev.arrendamento }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedOutrasDespesas.arrendamento ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency((dataFiltrada.outras_despesas?.arrendamento?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Drill-down Arrendamento */}
                      {expandedOutrasDespesas.arrendamento && 'arrendamento_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.arrendamento_detalhado && (
                        <>
                          {Object.keys('arrendamento_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.arrendamento_detalhado || {}).map((propriedade) => (
                            <TableRow key={`arrendamento-${propriedade}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                              <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                {propriedade}
                              </TableCell>
                              {dataFiltrada.anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                >
                                  {formatCurrency(('arrendamento_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.arrendamento_detalhado?.[propriedade]?.[ano]) || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Pró-Labore */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Pró-Labore
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency((dataFiltrada.outras_despesas?.pro_labore?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Divisão de Lucros */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Divisão de Lucros
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency(
                              ('divisao_lucros' in (dataFiltrada.outras_despesas || {}) 
                                ? (dataFiltrada.outras_despesas as any)?.divisao_lucros?.[ano] 
                                : (dataFiltrada.outras_despesas as any)?.administrativas?.[ano]
                              ) || 0
                            )}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Financeiras */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <span>Financeiras</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedOutrasDespesas(prev => ({ ...prev, financeiras: !prev.financeiras }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedOutrasDespesas.financeiras ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency((dataFiltrada.outras_despesas?.financeiras?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Drill-down Financeiras */}
                      {expandedOutrasDespesas.financeiras && 'financeiras_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.financeiras_detalhado && (
                        <>
                          {Object.keys('financeiras_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.financeiras_detalhado || {}).map((categoria) => (
                            <TableRow key={`financeiras-${categoria}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                              <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                {categoria}
                              </TableCell>
                              {dataFiltrada.anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                >
                                  {formatCurrency(('financeiras_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.financeiras_detalhado?.[categoria]?.[ano]) || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Tributárias */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Tributárias
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency((dataFiltrada.outras_despesas?.tributarias?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Outras */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <span>Outras</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedOutrasDespesas(prev => ({ ...prev, outras: !prev.outras }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedOutrasDespesas.outras ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency((dataFiltrada.outras_despesas?.outras?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Drill-down Outras */}
                      {expandedOutrasDespesas.outras && 'outras_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.outras_detalhado && (
                        <>
                          {Object.keys('outras_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.outras_detalhado || {}).map((subcategoria) => (
                            <TableRow key={`outras-${subcategoria}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                              <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                {subcategoria}
                              </TableCell>
                              {dataFiltrada.anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                >
                                  {formatCurrency(('outras_detalhado' in dataFiltrada.outras_despesas && dataFiltrada.outras_despesas.outras_detalhado?.[subcategoria]?.[ano]) || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}
                    </>
                  )}

                  {/* Total de outras despesas */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Outras Despesas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800 text-destructive dark:text-red-400"
                      >
                        {formatCurrency((dataFiltrada.outras_despesas?.total_por_ano?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>



                  {/* === SEÇÃO DE INVESTIMENTOS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('investimentos')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('investimentos') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <DollarSign className="h-4 w-4" />
                        Investimentos
                      </button>
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de investimentos */}
                  {!isSectionCollapsed('investimentos') && (
                    <>
                      {/* Terras */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Terras
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency((dataFiltrada.investimentos?.terras?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                      
                      {/* Maquinários */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <span>Maquinários</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedInvestimentos(prev => ({ ...prev, maquinarios: !prev.maquinarios }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedInvestimentos.maquinarios ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency((dataFiltrada.investimentos?.maquinarios?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Drill-down Maquinários */}
                      {expandedInvestimentos.maquinarios && 'maquinarios_detalhado' in dataFiltrada.investimentos && dataFiltrada.investimentos.maquinarios_detalhado && (
                        <>
                          {Object.keys('maquinarios_detalhado' in dataFiltrada.investimentos && dataFiltrada.investimentos.maquinarios_detalhado || {}).map((tipo) => (
                            <TableRow key={`maquinarios-${tipo}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                              <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                {tipo}
                              </TableCell>
                              {dataFiltrada.anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                >
                                  {formatCurrency(('maquinarios_detalhado' in dataFiltrada.investimentos && dataFiltrada.investimentos.maquinarios_detalhado?.[tipo]?.[ano]) || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}
                      
                      {/* Outros */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <span>Outros</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedInvestimentos(prev => ({ ...prev, outros: !prev.outros }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedInvestimentos.outros ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                          >
                            {formatCurrency((dataFiltrada.investimentos?.outros?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Drill-down Outros */}
                      {expandedInvestimentos.outros && 'outros_detalhado' in dataFiltrada.investimentos && dataFiltrada.investimentos.outros_detalhado && (
                        <>
                          {Object.keys('outros_detalhado' in dataFiltrada.investimentos && dataFiltrada.investimentos.outros_detalhado || {}).map((tipo) => (
                            <TableRow key={`outros-inv-${tipo}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                              <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                {tipo}
                              </TableCell>
                              {dataFiltrada.anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                >
                                  {formatCurrency(('outros_detalhado' in dataFiltrada.investimentos && dataFiltrada.investimentos.outros_detalhado?.[tipo]?.[ano]) || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}
                    </>
                  )}

                  {/* Total de investimentos */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Investimentos
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800 text-destructive dark:text-red-400"
                      >
                        {formatCurrency((dataFiltrada.investimentos?.total?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE FINANCEIRAS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('financeiras')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('financeiras') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <CircleDollarSign className="h-4 w-4" />
                        Financeiras
                      </button>
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Apenas o total - Fluxo de Financiamento Líquido */}
                  {!isSectionCollapsed('financeiras') && (
                    <>
                      {/* Dívidas Bancárias */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left">
                                  Dívidas Bancárias
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Valor das dívidas com instituições bancárias</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedFinanceiras(prev => ({ ...prev, dividas_bancarias: !prev.dividas_bancarias }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedFinanceiras.dividas_bancarias ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400 font-medium"
                          >
                            {formatCurrency(('dividas_bancarias' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_bancarias?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Drill-down Dívidas Bancárias */}
                      {expandedFinanceiras.dividas_bancarias && 'dividas_bancarias_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_bancarias_detalhado && (
                        <>
                          {Object.keys('dividas_bancarias_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_bancarias_detalhado || {}).map((contrato) => (
                            <TableRow key={`dividas-bancarias-${contrato}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                              <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                {contrato}
                              </TableCell>
                              {dataFiltrada.anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                >
                                  {formatCurrency(('dividas_bancarias_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_bancarias_detalhado?.[contrato]?.[ano]) || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Dívidas de Terras */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left">
                                  Dívidas de Terras
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Valor das dívidas relacionadas à aquisição de imóveis rurais</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedFinanceiras(prev => ({ ...prev, dividas_terras: !prev.dividas_terras }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedFinanceiras.dividas_terras ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400 font-medium"
                          >
                            {formatCurrency(('dividas_terras' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_terras?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Drill-down Dívidas de Terras */}
                      {expandedFinanceiras.dividas_terras && 'dividas_terras_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_terras_detalhado && (
                        <>
                          {Object.keys('dividas_terras_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_terras_detalhado || {}).map((propriedade) => (
                            <TableRow key={`dividas-terras-${propriedade}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                              <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                {propriedade}
                              </TableCell>
                              {dataFiltrada.anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                >
                                  {formatCurrency(('dividas_terras_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_terras_detalhado?.[propriedade]?.[ano]) || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Dívidas Fornecedores */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <div className="flex items-center justify-between">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left">
                                  Dívidas Fornecedores
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Valor das dívidas com fornecedores</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedFinanceiras(prev => ({ ...prev, dividas_fornecedores: !prev.dividas_fornecedores }))}
                              className="h-6 w-6 p-0"
                            >
                              {expandedFinanceiras.dividas_fornecedores ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400 font-medium"
                          >
                            {formatCurrency(('dividas_fornecedores' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_fornecedores?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Drill-down Dívidas Fornecedores */}
                      {expandedFinanceiras.dividas_fornecedores && 'dividas_fornecedores_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_fornecedores_detalhado && (
                        <>
                          {Object.keys('dividas_fornecedores_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_fornecedores_detalhado || {}).map((fornecedor) => (
                            <TableRow key={`dividas-fornecedores-${fornecedor}`} className="bg-gray-50/50 dark:bg-gray-800/30">
                              <TableCell className="text-xs min-w-[250px] w-[250px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-16 text-gray-600 dark:text-gray-400">
                                {fornecedor}
                              </TableCell>
                              {dataFiltrada.anos.map((ano) => (
                                <TableCell 
                                  key={ano} 
                                  className="text-center min-w-[120px] w-[120px] text-xs text-gray-600 dark:text-gray-400"
                                >
                                  {formatCurrency(('dividas_fornecedores_detalhado' in dataFiltrada.financeiras && dataFiltrada.financeiras.dividas_fornecedores_detalhado?.[fornecedor]?.[ano]) || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Total Consolidado */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 border-t">
                        <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">
                                Dívida Total Consolidada
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Soma total: Dívidas Bancárias + Dívidas de Terras</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400 font-semibold"
                          >
                            {formatCurrency((dataFiltrada.financeiras?.divida_total_consolidada?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Serviço de Dívida */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">
                                Serviço de Dívida
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Pagamentos de dívidas bancárias e de terras no período</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400 font-medium"
                          >
                            {formatCurrency((dataFiltrada.financeiras?.servico_divida?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Saldo Devedor */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">
                                Saldo Devedor
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Saldo remanescente após pagamentos realizados</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400 font-medium"
                          >
                            {formatCurrency((dataFiltrada.financeiras?.saldo_devedor?.[ano]) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* Total Financeiras */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Fluxo de Financiamento Líquido
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      const valor = (dataFiltrada.financeiras?.total_por_ano?.[ano]) || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                            valor < 0 ? "text-destructive dark:text-red-400" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === FLUXO DE CAIXA FINAL === */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700 font-medium font-bold border-t-2">
                    <TableCell className="font-medium font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Fluxo de Caixa Final
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      // Usar valores pré-calculados da API se disponíveis
                      const fluxoLiquido = dataFiltrada.fluxo_liquido?.[ano] || 0;
                      
                      if (fluxoLiquido !== undefined) {
                        // Usar o valor da API
                        return (
                          <TableCell 
                            key={ano} 
                            className={cn(
                              "text-center font-medium font-bold min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                              fluxoLiquido < 0 ? "text-destructive dark:text-red-400" : "text-green-600 dark:text-green-400"
                            )}
                          >
                            {formatCurrency(Math.abs(fluxoLiquido))}
                          </TableCell>
                        );
                      } else {
                        // Calcular manualmente se não disponível
                        const receitasAgricolas = (dataFiltrada.receitas_agricolas?.total_por_ano?.[ano]) || 0;
                        // Despesas são valores negativos, então somamos (não subtraímos)
                        const despesasAgricolas = (dataFiltrada.despesas_agricolas?.total_por_ano?.[ano]) || 0;
                        const outrasDespesas = (dataFiltrada.outras_despesas?.total_por_ano?.[ano]) || 0;
                        // Investimentos são valores negativos
                        const investimentos = (dataFiltrada.investimentos?.total?.[ano]) || 0;
                        // Financeiras podem ser positivas ou negativas dependendo do ano
                        const financeiras = (dataFiltrada.financeiras?.total_por_ano?.[ano]) || 0;
                        
                        // Calcular fluxo líquido
                        const fluxoCaixa = receitasAgricolas - despesasAgricolas - outrasDespesas - investimentos + financeiras;
                        
                        return (
                          <TableCell 
                            key={ano} 
                            className={cn(
                              "text-center font-medium font-bold min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                              fluxoCaixa < 0 ? "text-destructive dark:text-red-400" : "text-green-600 dark:text-green-400"
                            )}
                          >
                            {formatCurrency(Math.abs(fluxoCaixa))}
                          </TableCell>
                        );
                      }
                    })}
                  </TableRow>

                  {/* === FLUXO ACUMULADO SEM PAGAMENTO DE DÍVIDA === */}
                  <TableRow className="hover:bg-orange-50/50 dark:hover:bg-orange-900/20 border-t">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600 dark:text-orange-400">●</span>
                              <span>Fluxo Acumulado (sem pgto dívida)</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cenário hipotético: fluxo de caixa acumulado<br/>caso não houvesse pagamento de dívidas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      const fluxoAcumuladoSemPgto = ('fluxo_acumulado_sem_pagamento_divida' in dataFiltrada && dataFiltrada.fluxo_acumulado_sem_pagamento_divida?.[ano]) || 0;
                      
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px]",
                            fluxoAcumuladoSemPgto < 0 ? "text-orange-700 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(Math.abs(fluxoAcumuladoSemPgto))}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === FLUXO DE CAIXA ACUMULADO COM PAGAMENTO === */}
                  <TableRow className="bg-gray-200 dark:bg-gray-600 font-medium font-bold">
                    <TableCell className="font-medium font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-200 dark:bg-gray-600 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-primary">●</span>
                              <span>Fluxo de Caixa Acumulado</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Fluxo real: acumulado após todos os<br/>pagamentos, incluindo serviço da dívida</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {dataFiltrada.anos.map((ano, index) => {
                      // Usar valores pré-calculados da API se disponíveis
                      const fluxoAcumulado = dataFiltrada.fluxo_acumulado?.[ano];
                      
                      if (fluxoAcumulado !== undefined) {
                        // Usar o valor da API
                        return (
                          <TableCell 
                            key={ano} 
                            className={cn(
                              "text-center font-medium font-bold min-w-[120px] w-[120px] bg-gray-200 dark:bg-gray-600",
                              fluxoAcumulado < 0 ? "text-destructive dark:text-red-400" : "text-green-600 dark:text-green-400"
                            )}
                          >
                            {formatCurrency(Math.abs(fluxoAcumulado))}
                          </TableCell>
                        );
                      } else {
                        // Calcular manualmente se não disponível
                        let acumulado = 0;
                        for (let i = 0; i <= index; i++) {
                          const anoAtual = dataFiltrada.anos[i];
                          // Usar fluxo líquido pré-calculado se disponível
                          if (dataFiltrada.fluxo_liquido?.[anoAtual] !== undefined) {
                            acumulado += dataFiltrada.fluxo_liquido[anoAtual];
                          } else {
                            // Calcular manualmente
                            const receitasAgricolas = (dataFiltrada.receitas_agricolas?.total_por_ano?.[anoAtual]) || 0;
                            const despesasAgricolas = (dataFiltrada.despesas_agricolas?.total_por_ano?.[anoAtual]) || 0;
                            const outrasDespesas = (dataFiltrada.outras_despesas?.total_por_ano?.[anoAtual]) || 0;
                            const investimentos = (dataFiltrada.investimentos?.total?.[anoAtual]) || 0;
                            const financeiras = (dataFiltrada.financeiras?.total_por_ano?.[anoAtual]) || 0;
                            
                            acumulado += receitasAgricolas - despesasAgricolas - outrasDespesas - investimentos - financeiras;
                          }
                        }
                        
                        return (
                          <TableCell 
                            key={ano} 
                            className={cn(
                              "text-center font-medium font-bold min-w-[120px] w-[120px] bg-gray-200 dark:bg-gray-600",
                              acumulado < 0 ? "text-destructive dark:text-red-400" : "text-green-600 dark:text-green-400"
                            )}
                          >
                            {formatCurrency(Math.abs(acumulado))}
                          </TableCell>
                        );
                      }
                    })}
                  </TableRow>

                  {/* === INDICADORES DE POSIÇÃO DE CAIXA === */}
                  {'politica_caixa' in dataFiltrada && dataFiltrada.politica_caixa?.ativa && dataFiltrada.politica_caixa.valor_minimo && (
                    <>
                      <TableRow className="bg-indigo-50 dark:bg-indigo-900/20 border-t-2">
                        <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-indigo-50 dark:bg-indigo-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">
                                Política de Caixa Mínimo
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Valor mínimo de caixa a ser mantido</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center font-bold min-w-[120px] w-[120px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                          >
                            {formatCurrency(('politica_caixa' in dataFiltrada && dataFiltrada.politica_caixa?.valor_minimo) || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                      
                      <TableRow className="bg-amber-50 dark:bg-amber-900/20">
                        <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-amber-50 dark:bg-amber-900/20 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">
                                Excesso/(Falta) de Caixa
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Diferença entre o caixa acumulado e o mínimo requerido</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {dataFiltrada.anos.map((ano) => {
                          const caixaAcumulado = dataFiltrada.fluxo_acumulado?.[ano] || 0;
                          const caixaMinimo = ('politica_caixa' in dataFiltrada && dataFiltrada.politica_caixa?.valor_minimo) || 0;
                          const diferenca = caixaAcumulado - caixaMinimo;
                          
                          return (
                            <TableCell 
                              key={ano} 
                              className={cn(
                                "text-center font-bold min-w-[120px] w-[120px] bg-amber-50 dark:bg-amber-900/20",
                                diferenca >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400",
                                diferenca < 0 && "ring-2 ring-red-500 ring-inset"
                              )}
                            >
                              {formatCurrency(Math.abs(diferenca))}
                              {diferenca < 0 && (
                                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  Abaixo do mínimo
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}