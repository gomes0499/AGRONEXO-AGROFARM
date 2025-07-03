"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
// Removed accordion imports as we're using a single table now
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  ChevronDown,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";

// Interface para os dados do DRE
export interface DREData {
  anos: string[];
  // Receita Operacional Bruta
  receita_bruta: {
    agricola: Record<string, number>;
    pecuaria: Record<string, number>;
    total: Record<string, number>;
  };
  // Impostos sobre Vendas
  impostos_vendas?: {
    icms: Record<string, number>;
    pis: Record<string, number>;
    cofins: Record<string, number>;
    total: Record<string, number>;
  };
  // Receita Operacional Líquida
  receita_liquida: Record<string, number>;
  // Custos
  custos: {
    agricola: Record<string, number>;
    pecuaria: Record<string, number>;
    total: Record<string, number>;
  };
  // Lucro Bruto
  lucro_bruto: Record<string, number>;
  // Outras Receitas Operacionais
  outras_receitas_operacionais?: Record<string, number>;
  // Despesas Operacionais
  despesas_operacionais: {
    administrativas: Record<string, number>;
    pessoal: Record<string, number>;
    arrendamentos: Record<string, number>;
    tributarias: Record<string, number>;
    manutencao_seguros: Record<string, number>;
    outros: Record<string, number>;
    total: Record<string, number>;
  };
  // EBITDA (Lucro antes de juros, impostos, depreciação e amortização)
  ebitda: Record<string, number>;
  // Margem EBITDA (%)
  margem_ebitda: Record<string, number>;
  // Depreciação e Amortização
  depreciacao_amortizacao: Record<string, number>;
  // EBIT (Lucro antes de juros e impostos)
  ebit: Record<string, number>;
  // Resultado Financeiro
  resultado_financeiro: {
    receitas_financeiras: Record<string, number>;
    despesas_financeiras: Record<string, number>;
    variacao_cambial: Record<string, number>;
    total: Record<string, number>;
  };
  // Lucro Antes do Imposto de Renda
  lucro_antes_ir: Record<string, number>;
  // Imposto de Renda e Contribuição Social
  impostos_sobre_lucro: Record<string, number>;
  // Lucro Líquido do Exercício
  lucro_liquido: Record<string, number>;
  // Margem Líquida (%)
  margem_liquida: Record<string, number>;
}

interface DRETableProps {
  organizationId: string;
  initialData: DREData;
}

export function DRETable({ organizationId, initialData }: DRETableProps) {
  const data = initialData;
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  // Função para formatar texto em normal case
  const formatText = (text: string) => {
    if (!text) return '';
    
    // Mantém siglas como EBITDA, EBIT, IR, CSLL em maiúsculas
    const acronyms = ['EBITDA', 'EBIT', 'IR', 'CSLL'];
    for (const acronym of acronyms) {
      if (text === acronym) return acronym;
    }
    
    // Converte para normal case (primeira letra maiúscula, resto minúsculo)
    return text.charAt(0) + text.slice(1).toLowerCase();
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
  
  if (!data || !data.anos || data.anos.length === 0) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<FileText className="h-4 w-4" />}
          title="Demonstração de Resultado do Exercício (DRE)"
          description="Análise consolidada de receitas, custos e resultados por período"
        />
        <CardContent className="p-6">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<FileText className="h-4 w-4" />}
          title="Demonstração de Resultado do Exercício (DRE)"
          description="Análise consolidada de receitas, custos e resultados por período"
        />
        <CardContent className="p-6">
          <div className="overflow-x-auto overflow-y-hidden border rounded-md" style={{ maxWidth: '100%' }}>
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary dark:bg-primary/90 dark:hover:bg-primary/90">
                    <TableHead className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                      Demonstração de Resultado
                    </TableHead>
                    {data.anos.map((ano, index) => (
                      <TableHead 
                        key={ano} 
                        className={cn(
                          "font-semibold text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                          index === data.anos.length - 1 && "rounded-tr-md"
                        )}
                      >
                        {ano}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* === RECEITA OPERACIONAL BRUTA === */}
                  <TableRow className="bg-primary font-semibold border-b-2 border-primary/20 dark:bg-primary/90">
                    <TableCell className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('receita_bruta')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('receita_bruta') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingUp className="h-4 w-4" />
                        Receita Operacional Bruta
                      </button>
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de receita bruta */}
                  {!isSectionCollapsed('receita_bruta') && (
                    <>
                      {/* Receita Agrícola */}
                      <TableRow className="hover:bg-muted/20 dark:hover:bg-gray-700/20 transition-colors">
                        <TableCell className="font-medium text-sm min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8 text-gray-700 dark:text-gray-300">
                          Receita Agrícola
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-green-700 dark:text-green-400 font-medium"
                          >
                            {formatCurrency(data.receita_bruta.agricola[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Receita Pecuária */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Receita Pecuária
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatCurrency(data.receita_bruta.pecuaria[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* Total Receita Bruta */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-semibold border-y">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Receita Bruta
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-semibold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800/50 text-green-700 dark:text-green-400"
                      >
                        {formatCurrency(data.receita_bruta.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === IMPOSTOS SOBRE VENDAS === */}
                  {data.impostos_vendas && (
                    <>
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium text-sm min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8 text-gray-700 dark:text-gray-300">
                          (-) PIS/COFINS
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-red-700 dark:text-red-400 font-medium"
                          >
                            ({formatCurrency((data.impostos_vendas?.pis[ano] || 0) + (data.impostos_vendas?.cofins[ano] || 0))})
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          (-) Total Impostos s/ Vendas
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive font-medium"
                          >
                            ({formatCurrency(data.impostos_vendas?.total[ano] || 0)})
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* === RECEITA OPERACIONAL LÍQUIDA === */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-semibold border-y">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Receita Operacional Líquida
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-semibold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800/50"
                      >
                        {formatCurrency(data.receita_liquida[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === CUSTOS === */}
                  <TableRow className="bg-primary font-semibold border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('custos')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('custos') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingDown className="h-4 w-4" />
                        Custos
                      </button>
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de custos */}
                  {!isSectionCollapsed('custos') && (
                    <>
                      {/* Custos Agrícola */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Custos Agrícola
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.custos.agricola[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Custos Pecuária */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Custos Pecuária
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.custos.pecuaria[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* Total Custos */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Custos
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800 text-destructive"
                      >
                        {formatCurrency(data.custos.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === LUCRO BRUTO === */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700 font-medium border-t-2">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Lucro Bruto
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.lucro_bruto[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                            valor < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === OUTRAS RECEITAS OPERACIONAIS === */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                        Outras Receitas Operacionais
                      </div>
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-green-600 dark:text-green-400"
                      >
                        {formatCurrency(data.outras_receitas_operacionais?.[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === DESPESAS OPERACIONAIS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('despesas_operacionais')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('despesas_operacionais') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingDown className="h-4 w-4" />
                        Despesas Operacionais
                      </button>
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de despesas operacionais */}
                  {!isSectionCollapsed('despesas_operacionais') && (
                    <>
                      {/* Despesas Administrativas */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Despesas Administrativas
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.despesas_operacionais.administrativas[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Despesas de Pessoal */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Despesas de Pessoal
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.despesas_operacionais.pessoal[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Despesas com Arrendamentos */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Despesas com Arrendamentos
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.despesas_operacionais.arrendamentos[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Despesas Tributárias */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Despesas Tributárias
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.despesas_operacionais.tributarias[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Manutenção e Seguros */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Manutenção e Seguros
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.despesas_operacionais.manutencao_seguros[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Outras Despesas Operacionais */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Outras Despesas Operacionais
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.despesas_operacionais.outros[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* Total Despesas Operacionais */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Despesas Operacionais
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800 text-destructive"
                      >
                        {formatCurrency(data.despesas_operacionais.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === EBITDA === */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700 font-medium border-t-2">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      EBITDA
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.ebitda[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                            valor < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === MARGEM EBITDA === */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Margem EBITDA (%)
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.margem_ebitda[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center min-w-[120px] w-[120px]",
                            valor < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatPercent(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === DEPRECIAÇÃO E AMORTIZAÇÃO === */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Depreciação e Amortização
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive"
                      >
                        {formatCurrency(data.depreciacao_amortizacao[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === EBIT === */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700 font-medium border-t-2">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      EBIT
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.ebit[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                            valor < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === RESULTADO FINANCEIRO === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('resultado_financeiro')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('resultado_financeiro') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <DollarSign className="h-4 w-4" />
                        Resultado Financeiro
                      </button>
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary dark:bg-primary/90 text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de resultado financeiro */}
                  {!isSectionCollapsed('resultado_financeiro') && (
                    <>
                      {/* Receitas Financeiras */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Receitas Financeiras
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px]"
                          >
                            {formatCurrency(data.resultado_financeiro.receitas_financeiras[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Despesas Financeiras */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Despesas Financeiras
                        </TableCell>
                        {data.anos.map((ano) => (
                          <TableCell 
                            key={ano} 
                            className="text-center min-w-[120px] w-[120px] text-destructive"
                          >
                            {formatCurrency(data.resultado_financeiro.despesas_financeiras[ano] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Variação Cambial */}
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                          Variação Cambial de Ativos e Passivos
                        </TableCell>
                        {data.anos.map((ano) => {
                          const valor = data.resultado_financeiro.variacao_cambial?.[ano] || 0;
                          return (
                            <TableCell 
                              key={ano} 
                              className={cn(
                                "text-center min-w-[120px] w-[120px]",
                                valor < 0 ? "text-destructive" : valor > 0 ? "text-green-600 dark:text-green-400" : ""
                              )}
                            >
                              {formatCurrency(valor)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </>
                  )}

                  {/* Total Resultado Financeiro */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Resultado Financeiro
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.resultado_financeiro.total[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                            valor < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === LUCRO ANTES DO IR === */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700 font-medium border-t-2">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Lucro Antes do IR
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.lucro_antes_ir[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                            valor < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === IMPOSTOS SOBRE O LUCRO === */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Impostos sobre o Lucro
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive"
                      >
                        {formatCurrency(data.impostos_sobre_lucro[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === LUCRO LÍQUIDO === */}
                  <TableRow className="bg-gray-200 dark:bg-gray-600 font-medium font-bold border-t-2">
                    <TableCell className="font-medium font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-200 dark:bg-gray-600 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      LUCRO LÍQUIDO
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.lucro_liquido[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium font-bold min-w-[120px] w-[120px] bg-gray-200 dark:bg-gray-600",
                            valor < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === MARGEM LÍQUIDA === */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Margem Líquida (%)
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.margem_liquida[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center min-w-[120px] w-[120px]",
                            valor < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatPercent(valor)}
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