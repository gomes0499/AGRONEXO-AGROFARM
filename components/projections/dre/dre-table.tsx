"use client";

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
  ArrowUpCircle 
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
    outras: Record<string, number>;
    total: Record<string, number>;
  };
  // Deduções da Receita
  deducoes: {
    impostos_federais: Record<string, number>;
    impostos_estaduais: Record<string, number>;
    funrural: Record<string, number>;
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
  // Despesas Operacionais
  despesas_operacionais: {
    administrativas: Record<string, number>;
    comerciais: Record<string, number>;
    pessoal: Record<string, number>;
    arrendamentos: Record<string, number>;
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
  data: DREData;
}

export function DRETable({ data }: DRETableProps) {
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
  
  if (!data || !data.anos || data.anos.length === 0) {
    return (
      <Card className="shadow-sm border-muted/80">
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
      <Card className="shadow-sm border-muted/80">
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
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                      Demonstração de Resultado
                    </TableHead>
                    {data.anos.map((ano, index) => (
                      <TableHead 
                        key={ano} 
                        className={cn(
                          "font-medium text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                          index === data.anos.length - 1 && "rounded-tr-md"
                        )}
                      >
                        {ano}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* === SEÇÃO DE RECEITAS === */}
                  <TableRow className="bg-primary font-semibold border-b-2 border-primary/20">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Receitas
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Receita Operacional Bruta */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Receita Operacional Bruta
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-gray-50"
                      >
                        {formatCurrency(data.receita_bruta.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Detalhes da Receita Bruta */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Agrícola
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.receita_bruta.agricola[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Pecuária
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

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Outras Receitas
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.receita_bruta.outras[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Deduções da Receita */}
                  <TableRow className="bg-destructive/10 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-destructive/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (-) Deduções da Receita
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-destructive/10 text-destructive"
                      >
                        {formatCurrency(data.deducoes.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Detalhes das Deduções */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Impostos Federais
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive"
                      >
                        {formatCurrency(data.deducoes.impostos_federais[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Impostos Estaduais
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive"
                      >
                        {formatCurrency(data.deducoes.impostos_estaduais[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Funrural
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive"
                      >
                        {formatCurrency(data.deducoes.funrural[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Receita Líquida */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (=) Receita Operacional Líquida
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.receita_liquida[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50",
                            valor < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === SEÇÃO DE CUSTOS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Custos e Lucro Bruto
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Custos Operacionais */}
                  <TableRow className="bg-destructive/10 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-destructive/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (-) Custos Operacionais
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-destructive/10 text-destructive"
                      >
                        {formatCurrency(data.custos.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Detalhes dos Custos */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Custos Agrícolas
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

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Custos Pecuários
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

                  {/* Lucro Bruto */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (=) Lucro Bruto
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.lucro_bruto[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50",
                            valor < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === SEÇÃO DE DESPESAS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Despesas e EBITDA
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Despesas Operacionais */}
                  <TableRow className="bg-destructive/10 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-destructive/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (-) Despesas Operacionais
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-destructive/10 text-destructive"
                      >
                        {formatCurrency(data.despesas_operacionais.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Detalhes das Despesas */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
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

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Despesas Comerciais
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-destructive"
                      >
                        {formatCurrency(data.despesas_operacionais.comerciais[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Despesas com Pessoal
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

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Arrendamentos
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

                  {/* EBITDA */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (=) EBITDA
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.ebitda[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50",
                            valor < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === SEÇÃO DE RESULTADO FINAL === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Resultado Final
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Depreciação e Amortização */}
                  <TableRow className="bg-muted/10 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-muted/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (-) Depreciação e Amortização
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-muted/10 text-destructive"
                      >
                        {formatCurrency(data.depreciacao_amortizacao[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* EBIT */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (=) EBIT
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.ebit[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50",
                            valor < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Resultado Financeiro */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Resultado Financeiro
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.resultado_financeiro.total[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center min-w-[120px] w-[120px] bg-gray-50",
                            valor < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Detalhes do Resultado Financeiro */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      (+) Receitas Financeiras
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-primary"
                      >
                        {formatCurrency(data.resultado_financeiro.receitas_financeiras[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      (-) Despesas Financeiras
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

                  {/* Lucro Antes do IR */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (=) Lucro Antes do IR
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.lucro_antes_ir[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50",
                            valor < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Impostos sobre Lucro */}
                  <TableRow className="bg-destructive/10 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-destructive/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (-) Imposto de Renda e CSLL
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-destructive/10 text-destructive"
                      >
                        {formatCurrency(data.impostos_sobre_lucro[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Lucro Líquido */}
                  <TableRow className="bg-gray-50 font-medium border-t-2 border-gray-200">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      (=) Lucro Líquido do Exercício
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.lucro_liquido[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-bold min-w-[120px] w-[120px] bg-gray-50",
                            valor < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Margem Líquida */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Margem Líquida (%)
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.margem_liquida[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center min-w-[120px] w-[120px]",
                            valor < 0 ? "text-destructive" : ""
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