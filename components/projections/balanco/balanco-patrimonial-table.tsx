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
import { 
  ClipboardList, 
  ArrowUpCircle, 
  ArrowDownCircle,
  BadgeDollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { BalancoPatrimonialData } from "@/lib/actions/projections-actions/balanco-patrimonial-data";

interface BalancoPatrimonialTableProps {
  data: BalancoPatrimonialData;
}

export function BalancoPatrimonialTable({ data }: BalancoPatrimonialTableProps) {
  if (!data || !data.anos || data.anos.length === 0) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<ClipboardList className="h-4 w-4" />}
          title="Balanço Patrimonial"
          description="Visão consolidada do patrimônio da empresa por período"
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
          icon={<ClipboardList className="h-4 w-4" />}
          title="Balanço Patrimonial"
          description="Visão consolidada do patrimônio da empresa por período"
        />
        <CardContent className="p-6">
          <div className="overflow-x-auto overflow-y-hidden border rounded-md">
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                      BALANÇO PATRIMONIAL
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
                  {/* === SEÇÃO DE ATIVO === */}
                  <TableRow className="bg-primary font-semibold border-b-2 border-primary/20">
                    <TableCell className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      ATIVO
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

                  {/* === ATIVO CIRCULANTE === */}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      ATIVO CIRCULANTE
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.ativo.circulante.total[ano] || 0;
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

                  {/* Detalhes do Ativo Circulante */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      CAIXA E BANCOS
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.ativo.circulante.caixa_bancos[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      CLIENTES
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.ativo.circulante.clientes[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      ADIANTAMENTOS A FORNECEDORES
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.ativo.circulante.adiantamentos_fornecedores[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30 bg-muted/5">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-muted/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      ESTOQUES
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-muted/5"
                      >
                        {formatCurrency(data.ativo.circulante.estoques.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Detalhes dos Estoques */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-12 text-sm">
                      Defensivos
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-sm"
                      >
                        {formatCurrency(data.ativo.circulante.estoques.defensivos[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-12 text-sm">
                      Fertilizantes
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-sm"
                      >
                        {formatCurrency(data.ativo.circulante.estoques.fertilizantes[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-12 text-sm">
                      Almoxarifado
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-sm"
                      >
                        {formatCurrency(data.ativo.circulante.estoques.almoxarifado[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-12 text-sm">
                      Commodities
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-sm"
                      >
                        {formatCurrency(data.ativo.circulante.estoques.commodities[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      EMPRÉSTIMOS A TERCEIROS
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.ativo.circulante.emprestimos_terceiros[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === ATIVO NÃO CIRCULANTE === */}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      ATIVO NÃO CIRCULANTE
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.ativo.nao_circulante.total[ano] || 0;
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

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      INVESTIMENTOS
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.ativo.nao_circulante.investimentos[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30 bg-muted/5">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-muted/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      IMOBILIZADO
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] bg-muted/5"
                      >
                        {formatCurrency(data.ativo.nao_circulante.imobilizado.total[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Detalhes do Imobilizado */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-12 text-sm">
                      Terras
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-sm"
                      >
                        {formatCurrency(data.ativo.nao_circulante.imobilizado.terras[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-12 text-sm">
                      Máquinas e Equipamentos
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-sm"
                      >
                        {formatCurrency(data.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-12 text-sm">
                      Benfeitorias
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-sm"
                      >
                        {formatCurrency(data.ativo.nao_circulante.imobilizado.benfeitorias[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-12 text-sm">
                      Outros Imobilizados
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px] text-sm"
                      >
                        {formatCurrency(data.ativo.nao_circulante.imobilizado.outros_imobilizados[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === TOTAL DO ATIVO === */}
                  <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      TOTAL DO ATIVO
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.ativo.total[ano] || 0;
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

                  {/* === SEÇÃO DE PASSIVO === */}
                  <TableRow className="bg-primary font-semibold border-b-2 border-primary/20 border-t-2">
                    <TableCell className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      PASSIVO
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

                  {/* === PASSIVO CIRCULANTE === */}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      PASSIVO CIRCULANTE
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.passivo.circulante.total[ano] || 0;
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

                  {/* Detalhes do Passivo Circulante */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      FORNECEDORES
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.circulante.fornecedores[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      EMPRÉSTIMOS E FINANCIAMENTOS (CP)
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.circulante.emprestimos_financiamentos_curto_prazo[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      ADIANTAMENTOS DE CLIENTES
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.circulante.adiantamentos_clientes[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      IMPOSTOS E TAXAS
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.circulante.impostos_taxas[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === PASSIVO NÃO CIRCULANTE === */}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      PASSIVO NÃO CIRCULANTE
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.passivo.nao_circulante.total[ano] || 0;
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

                  {/* Detalhes do Passivo Não Circulante */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      EMPRÉSTIMOS E FINANCIAMENTOS (LP)
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      FINANCIAMENTOS DE TERRAS
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.nao_circulante.financiamentos_terras[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      ARRENDAMENTOS
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.nao_circulante.arrendamentos[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === PATRIMÔNIO LÍQUIDO === */}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell className="font-semibold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      PATRIMÔNIO LÍQUIDO
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.passivo.patrimonio_liquido.total[ano] || 0;
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

                  {/* Detalhes do Patrimônio Líquido */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      CAPITAL SOCIAL
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.patrimonio_liquido.capital_social[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      RESERVAS
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.passivo.patrimonio_liquido.reservas[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      LUCROS ACUMULADOS
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.passivo.patrimonio_liquido.lucros_acumulados[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center min-w-[120px] w-[120px]",
                            valor >= 0 ? "text-primary" : "text-destructive"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === TOTAL DO PASSIVO + PL === */}
                  <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      TOTAL DO PASSIVO + PL
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.passivo.total[ano] || 0;
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