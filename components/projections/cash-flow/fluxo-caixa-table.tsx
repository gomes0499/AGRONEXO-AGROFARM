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
      <Card className="shadow-sm border-muted/80">
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
  const dataFiltrada = {
    ...data,
    anos: anosFiltrados
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-muted/80">
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
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
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
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Receitas Agrícolas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de receitas por cultura */}
                  {Object.keys(dataFiltrada.receitas_agricolas.culturas).map((cultura) => (
                    <TableRow key={`receita-${cultura}`} className="hover:bg-muted/30">
                      <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                        {cultura}
                      </TableCell>
                      {dataFiltrada.anos.map((ano) => (
                        <TableCell 
                          key={ano} 
                          className="text-center min-w-[120px] w-[120px]"
                        >
                          {formatCurrency(dataFiltrada.receitas_agricolas.culturas[cultura][ano] || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Total de receitas */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Receitas Agrícolas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50"
                      >
                        {formatCurrency(dataFiltrada.receitas_agricolas.total_por_ano[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE DESPESAS AGRÍCOLAS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Despesas Agrícolas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de despesas por cultura */}
                  {Object.keys(dataFiltrada.despesas_agricolas.culturas).map((cultura) => (
                    <TableRow key={`despesa-${cultura}`} className="hover:bg-muted/30">
                      <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                        {cultura}
                      </TableCell>
                      {dataFiltrada.anos.map((ano) => (
                        <TableCell 
                          key={ano} 
                          className="text-center min-w-[120px] w-[120px]"
                        >
                          {formatCurrency(dataFiltrada.despesas_agricolas.culturas[cultura][ano] || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Total de despesas */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Despesas Agrícolas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50"
                      >
                        {formatCurrency(dataFiltrada.despesas_agricolas.total_por_ano[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE OUTRAS DESPESAS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Outras Despesas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de outras despesas */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Arrendamento
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.outras_despesas.arrendamento[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Pró-labore
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.outras_despesas.pro_labore[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Divisão de Lucros
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.outras_despesas.divisao_lucros[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Financeiras
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.outras_despesas.financeiras[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Tributárias
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.outras_despesas.tributarias[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Outras
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.outras_despesas.outras[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Total de outras despesas */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Outras Despesas
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50"
                      >
                        {formatCurrency(dataFiltrada.outras_despesas.total_por_ano[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Fluxo de Caixa da Atividade */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Fluxo de Caixa da Atividade
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      const valor = dataFiltrada.fluxo_atividade[ano] || 0;
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

                  {/* === SEÇÃO DE INVESTIMENTOS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Investimentos
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de investimentos */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Terras
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.investimentos.terras[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Maquinários
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.investimentos.maquinarios[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Outros
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.investimentos.outros[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Total investimentos */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Investimentos
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center font-medium min-w-[120px] w-[120px] bg-gray-50"
                      >
                        {formatCurrency(dataFiltrada.investimentos.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === SEÇÃO DE FINANCEIRAS === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Financeiras
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Linhas de financeiras */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Serviço da Dívida
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.financeiras?.servico_divida[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Pagamentos - Bancos/Adto. Clientes
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.financeiras?.pagamentos_bancos[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Novas Linhas Crédito-Bancos/Adto. Clientes
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(dataFiltrada.financeiras?.novas_linhas_credito[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Total financeiras */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total Financeiras
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      const valor = dataFiltrada.financeiras?.total_por_ano[ano] || 0;
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
                    {dataFiltrada.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-primary text-primary-foreground"
                      >
                        {/* Célula vazia para cabeçalho de seção */}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Fluxo Líquido */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Fluxo de Caixa Líquido
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      const valor = dataFiltrada.fluxo_liquido[ano] || 0;
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

                  {/* Fluxo Acumulado */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Fluxo de Caixa Acumulado
                    </TableCell>
                    {dataFiltrada.anos.map((ano) => {
                      const valor = dataFiltrada.fluxo_acumulado[ano] || 0;
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
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}