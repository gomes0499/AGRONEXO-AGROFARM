"use client";

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
import { TrendingDown, TrendingUp, CircleDollarSign, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import type { FluxoCaixaData } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";

interface FluxoCaixaTableProps {
  data: FluxoCaixaData;
}

export function FluxoCaixaTable({ data }: FluxoCaixaTableProps) {
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
  
  // Filtrar anos para remover 2030/31 e 2031/32
  const anosFiltrados = data.anos.filter(ano => ano !== "2030/31" && ano !== "2031/32");
  
  // Criar uma cópia dos dados com os anos filtrados
  const dataFiltrada = { ...data, anos: anosFiltrados };
  
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
      divisao_lucros: {}, 
      financeiras: {}, 
      tributarias: {}, 
      outras: {}, 
      total_por_ano: {} 
    };
  } else {
    if (!dataFiltrada.outras_despesas.arrendamento) {
      dataFiltrada.outras_despesas.arrendamento = {};
    }
    if (!dataFiltrada.outras_despesas.pro_labore) {
      dataFiltrada.outras_despesas.pro_labore = {};
    }
    if (!dataFiltrada.outras_despesas.divisao_lucros) {
      dataFiltrada.outras_despesas.divisao_lucros = {};
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
  
  if (!dataFiltrada.financeiras) {
    dataFiltrada.financeiras = { 
      servico_divida: {}, 
      pagamentos_bancos: {}, 
      novas_linhas_credito: {}, 
      total_por_ano: {} 
    };
  } else {
    if (!dataFiltrada.financeiras.servico_divida) {
      dataFiltrada.financeiras.servico_divida = {};
    }
    if (!dataFiltrada.financeiras.pagamentos_bancos) {
      dataFiltrada.financeiras.pagamentos_bancos = {};
    }
    if (!dataFiltrada.financeiras.novas_linhas_credito) {
      dataFiltrada.financeiras.novas_linhas_credito = {};
    }
    if (!dataFiltrada.financeiras.total_por_ano) {
      dataFiltrada.financeiras.total_por_ano = {};
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

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<DollarSign className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise consolidada de receitas, despesas e fluxo de caixa"
        />
        <CardContent className="p-6">
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
                          index === dataFiltrada.anos.length - 1 && "rounded-tr-md"
                        )}
                      >
                        {ano}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* === SEÇÃO DE RECEITAS AGRÍCOLAS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 dark:bg-primary/90">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Receitas Agrícolas
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
                  {dataFiltrada.receitas_agricolas?.culturas && Object.keys(dataFiltrada.receitas_agricolas.culturas).map((cultura) => (
                    <TableRow key={`receita-${cultura}`} className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                      <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                        {cultura}
                      </TableCell>
                      {dataFiltrada.anos.map((ano) => (
                        <TableCell 
                          key={ano} 
                          className="text-center min-w-[120px] w-[120px]"
                        >
                          {formatCurrency((dataFiltrada.receitas_agricolas?.culturas?.[cultura]?.[ano]) || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Total de receitas */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Receitas Agrícolas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800"
                      >
                        {formatCurrency((dataFiltrada.receitas_agricolas?.total_por_ano?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE DESPESAS AGRÍCOLAS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Despesas Agrícolas
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
                  {dataFiltrada.despesas_agricolas?.culturas && Object.keys(dataFiltrada.despesas_agricolas.culturas).map((cultura) => (
                    <TableRow key={`despesa-cultura-${cultura}`} className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                      <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                        {cultura}
                      </TableCell>
                      {dataFiltrada.anos.map((ano) => (
                        <TableCell 
                          key={ano} 
                          className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                        >
                          {formatCurrency((dataFiltrada.despesas_agricolas?.culturas?.[cultura]?.[ano]) || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Total de despesas */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Despesas Agrícolas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800 text-destructive dark:text-red-400"
                      >
                        {formatCurrency((dataFiltrada.despesas_agricolas?.total_por_ano?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE MARGEM BRUTA === */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700 font-medium border-t-2">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Margem Bruta Agrícola
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      const receitas = (dataFiltrada.receitas_agricolas?.total_por_ano?.[ano]) || 0;
                      const despesas = (dataFiltrada.despesas_agricolas?.total_por_ano?.[ano]) || 0;
                      const valor = receitas + despesas;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                            valor < 0 ? "text-destructive dark:text-red-400" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === SEÇÃO DE OUTRAS DESPESAS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Outras Despesas
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

                  {/* Arrendamento */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Arrendamento
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

                  {/* Pró-Labore */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
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
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Divisão de Lucros
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                      >
                        {formatCurrency((dataFiltrada.outras_despesas?.divisao_lucros?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Financeiras */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Financeiras
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

                  {/* Tributárias */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
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
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Outras
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
                      Investimentos
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

                  {/* Terras */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
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
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Maquinários
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
                  
                  {/* Outros */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Outros
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
                      Financeiras
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

                  {/* Serviço da Dívida */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Serviço da Dívida
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                      >
                        {formatCurrency((dataFiltrada.financeiras?.servico_divida?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Pagamentos - Bancos */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Pagamentos - Bancos
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive dark:text-red-400"
                      >
                        {formatCurrency((dataFiltrada.financeiras?.pagamentos_bancos?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Novas Linhas de Crédito */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Novas Linhas de Crédito
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-green-600 dark:text-green-400"
                      >
                        {formatCurrency((dataFiltrada.financeiras?.novas_linhas_credito?.[ano]) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Total Financeiras */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Financeiras
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
                      const fluxoLiquido = dataFiltrada.fluxo_liquido?.[ano];
                      
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
                            {formatCurrency(fluxoLiquido)}
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
                        const fluxoCaixa = receitasAgricolas + despesasAgricolas + outrasDespesas - investimentos + financeiras;
                        
                        return (
                          <TableCell 
                            key={ano} 
                            className={cn(
                              "text-center font-medium font-bold min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                              fluxoCaixa < 0 ? "text-destructive dark:text-red-400" : "text-green-600 dark:text-green-400"
                            )}
                          >
                            {formatCurrency(fluxoCaixa)}
                          </TableCell>
                        );
                      }
                    })}
                  </TableRow>

                  {/* === FLUXO DE CAIXA ACUMULADO === */}
                  <TableRow className="bg-gray-200 dark:bg-gray-600 font-medium font-bold">
                    <TableCell className="font-medium font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-200 dark:bg-gray-600 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Fluxo de Caixa Acumulado
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
                            {formatCurrency(fluxoAcumulado)}
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
                            
                            acumulado += receitasAgricolas + despesasAgricolas + outrasDespesas - investimentos + financeiras;
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
                            {formatCurrency(acumulado)}
                          </TableCell>
                        );
                      }
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