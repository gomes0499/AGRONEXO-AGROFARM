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
import { 
  ClipboardList, 
  ArrowUpCircle, 
  ArrowDownCircle,
  BadgeDollarSign,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { BalancoPatrimonialCorrigidoData } from "@/lib/actions/projections-actions/balanco-patrimonial-corrigido";

interface BalancoPatrimonialTableProps {
  organizationId: string;
  initialData: BalancoPatrimonialCorrigidoData;
}

export function BalancoPatrimonialTable({ organizationId, initialData }: BalancoPatrimonialTableProps) {
  const data = initialData;
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
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
          <div className="overflow-x-auto overflow-y-hidden border rounded-md" style={{ maxWidth: '100%' }}>
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary dark:bg-primary/90 dark:hover:bg-primary/90">
                    <TableHead className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                      Balanço Patrimonial
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
                  <TableRow className="bg-primary font-semibold border-b-2 border-primary/20 dark:bg-primary/90">
                    <TableCell className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('ativo')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('ativo') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingUp className="h-4 w-4" />
                        Ativo
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

                  {/* === ATIVO CIRCULANTE === */}
                  {!isSectionCollapsed('ativo') && (
                    <>
                      <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <button
                            onClick={() => toggleSection('ativo_circulante')}
                            className="flex items-center gap-2 w-full text-left"
                          >
                            {isSectionCollapsed('ativo_circulante') ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            Ativo Circulante
                          </button>
                        </TableCell>
                        {data.anos.map((ano) => {
                          const valor = data.ativo.circulante.total?.[ano] || 0;
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

                      {/* Detalhes do Ativo Circulante */}
                      {!isSectionCollapsed('ativo_circulante') && (
                        <>
                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Caixa e Bancos
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.circulante.caixa_bancos?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Clientes
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.circulante.clientes?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Adiantamentos a Fornecedores
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Empréstimos a Terceiros
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          {/* Estoques */}
                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Estoque Defensivos
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.circulante.estoques?.defensivos?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Estoque Fertilizantes
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.circulante.estoques?.fertilizantes?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Estoque Almoxarifado
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.circulante.estoques?.outros?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Estoque Commodities
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.circulante.estoques?.commodities?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Estoque Sementes
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Outros Ativos Circulantes
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.circulante.outros_ativos_circulantes?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* === ATIVO NÃO CIRCULANTE === */}
                      <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold border-t-2">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <button
                            onClick={() => toggleSection('ativo_nao_circulante')}
                            className="flex items-center gap-2 w-full text-left"
                          >
                            {isSectionCollapsed('ativo_nao_circulante') ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            Ativo Não Circulante
                          </button>
                        </TableCell>
                        {data.anos.map((ano) => {
                          const valor = data.ativo.nao_circulante.total?.[ano] || 0;
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

                      {/* Detalhes do Ativo Não Circulante */}
                      {!isSectionCollapsed('ativo_nao_circulante') && (
                        <>
                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Imobilizado
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.nao_circulante.total?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Terras
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px]"
                              >
                                {formatCurrency(data.ativo.nao_circulante.propriedades?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}
                    </>
                  )}

                  {/* === TOTAL DO ATIVO === */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700 font-semibold border-t-2">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      TOTAL DO ATIVO
                    </TableCell>
                    {data.anos.map((ano) => {
                      const circulante = data.ativo.circulante.total?.[ano] || 0;
                      const naoCirculante = data.ativo.nao_circulante.total?.[ano] || 0;
                      const total = circulante + naoCirculante;
                      
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700",
                            total < 0 ? "text-destructive" : ""
                          )}
                        >
                          {formatCurrency(total)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* === SEÇÃO DE PASSIVO === */}
                  <TableRow className="bg-primary font-medium border-b-2 border-primary/20 border-t-2 dark:bg-primary/90">
                    <TableCell className="font-medium text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => toggleSection('passivo')}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {isSectionCollapsed('passivo') ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <TrendingDown className="h-4 w-4" />
                        Passivo
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

                  {/* === PASSIVO CIRCULANTE === */}
                  {!isSectionCollapsed('passivo') && (
                    <>
                      <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <button
                            onClick={() => toggleSection('passivo_circulante')}
                            className="flex items-center gap-2 w-full text-left"
                          >
                            {isSectionCollapsed('passivo_circulante') ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            Passivo Circulante
                          </button>
                        </TableCell>
                        {data.anos.map((ano) => {
                          const valor = data.passivo.circulante.total?.[ano] || 0;
                          return (
                            <TableCell 
                              key={ano} 
                              className={cn(
                                "text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                                valor < 0 ? "" : "text-destructive"
                              )}
                            >
                              {formatCurrency(valor)}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Detalhes do Passivo Circulante */}
                      {!isSectionCollapsed('passivo_circulante') && (
                        <>
                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Fornecedores
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(data.passivo.circulante.fornecedores?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Empréstimos e Financiamentos
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(data.passivo.circulante.dividas_bancarias_cp?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Adiantamentos de Clientes
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Obrigações Fiscais
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Outras Obrigações
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(data.passivo.circulante.outras_obrigacoes_cp?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* === PASSIVO NÃO CIRCULANTE === */}
                      <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold border-t-2">
                        <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <button
                            onClick={() => toggleSection('passivo_nao_circulante')}
                            className="flex items-center gap-2 w-full text-left"
                          >
                            {isSectionCollapsed('passivo_nao_circulante') ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            Passivo Não Circulante
                          </button>
                        </TableCell>
                        {data.anos.map((ano) => {
                          const valor = data.passivo.nao_circulante.total?.[ano] || 0;
                          return (
                            <TableCell 
                              key={ano} 
                              className={cn(
                                "text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                                valor < 0 ? "" : "text-destructive"
                              )}
                            >
                              {formatCurrency(valor)}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Detalhes do Passivo Não Circulante */}
                      {!isSectionCollapsed('passivo_nao_circulante') && (
                        <>
                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Empréstimos e Financiamentos
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(data.passivo.nao_circulante.dividas_bancarias_lp?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Financiamento de Terras
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(data.passivo.nao_circulante.dividas_imoveis?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Arrendamentos a Pagar
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(0)}
                              </TableCell>
                            ))}
                          </TableRow>

                          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-8">
                              Outras Obrigações
                            </TableCell>
                            {data.anos.map((ano) => (
                              <TableCell 
                                key={ano} 
                                className="text-center min-w-[120px] w-[120px] text-destructive"
                              >
                                {formatCurrency(data.passivo.nao_circulante.outras_obrigacoes_lp?.[ano] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}
                    </>
                  )}

                  {/* === PATRIMÔNIO LÍQUIDO === */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold border-t-2">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Patrimônio Líquido
                    </TableCell>
                    {data.anos.map((ano) => {
                      const valor = data.patrimonio_liquido?.total?.[ano] || 0;
                      return (
                        <TableCell 
                          key={ano} 
                          className={cn(
                            "text-center font-medium min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                            valor < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {formatCurrency(valor)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Detalhes do Patrimônio Líquido */}
                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Capital Social
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className={cn(
                          "text-center min-w-[120px] w-[120px]",
                          (data.patrimonio_liquido?.capital_social?.[ano] || 0) < 0 ? "text-destructive" : ""
                        )}
                      >
                        {formatCurrency(data.patrimonio_liquido?.capital_social?.[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Reservas
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className={cn(
                          "text-center min-w-[120px] w-[120px]",
                          (data.patrimonio_liquido?.reservas?.[ano] || 0) < 0 ? "text-destructive" : ""
                        )}
                      >
                        {formatCurrency(data.patrimonio_liquido?.reservas?.[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-6">
                      Lucros Acumulados
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className={cn(
                          "text-center min-w-[120px] w-[120px]",
                          (data.patrimonio_liquido?.lucros_acumulados?.[ano] || 0) < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                        )}
                      >
                        {formatCurrency(data.patrimonio_liquido?.lucros_acumulados?.[ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* === TOTAL DO PASSIVO E PATRIMÔNIO LÍQUIDO === */}
                  <TableRow className="bg-gray-100 dark:bg-gray-700 font-semibold border-t-2">
                    <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      TOTAL DO PASSIVO + PL
                    </TableCell>
                    {data.anos.map((ano) => {
                      const passivoCirculante = data.passivo.circulante.total?.[ano] || 0;
                      const passivoNaoCirculante = data.passivo.nao_circulante.total?.[ano] || 0;
                      const patrimonioLiquido = data.patrimonio_liquido?.total?.[ano] || 0;
                      const total = passivoCirculante + passivoNaoCirculante + patrimonioLiquido;
                      
                      return (
                        <TableCell 
                          key={ano} 
                          className="text-center font-medium min-w-[120px] w-[120px] bg-gray-100 dark:bg-gray-700"
                        >
                          {formatCurrency(total)}
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