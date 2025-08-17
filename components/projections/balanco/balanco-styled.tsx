"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronRight,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Building,
  Wallet,
  Package,
  Settings
} from "lucide-react";
import { getBalancoPatrimonialDataV2 } from "@/lib/actions/projections-actions/balanco-patrimonial-data-v2";
import { getFluxoCaixaSimplificado } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";
import { getDebtPosition } from "@/lib/actions/debt-position-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { BalanceSheetConfigModal } from "./balance-sheet-config-modal";

interface BalancoStyledProps {
  organizationId: string;
  projectionId?: string;
}

// Função para formatar valores em milhares sem R$
function formatValueCompact(value: number): string {
  if (value === 0) return "-";
  const valueInThousands = value / 1000;
  const isNegative = valueInThousands < 0;
  const absValue = Math.abs(valueInThousands);
  const formatted = absValue.toLocaleString('pt-BR', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 1 
  });
  return isNegative ? `(${formatted})` : formatted;
}

// Mapear ano para safra (2025 -> 2024/25)
function yearToSafra(year: string): string {
  const yearNum = parseInt(year);
  if (!isNaN(yearNum)) {
    const yearStart = yearNum - 1;
    const yearEnd = yearNum.toString().slice(-2);
    return `${yearStart}/${yearEnd}`;
  }
  return year;
}

export function BalancoStyled({ 
  organizationId, 
  projectionId 
}: BalancoStyledProps) {
  const [balancoData, setBalancoData] = useState<any>(null);
  const [fluxoCaixa, setFluxoCaixa] = useState<any>(null);
  const [debtPosition, setDebtPosition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [anos, setAnos] = useState<string[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Estados para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'ativoCirculante': false,
    'estoques': false,
    'ativoNaoCirculante': false,
    'imobilizado': false,
    'passivoCirculante': false,
    'passivoNaoCirculante': false,
    'patrimonioLiquido': false,
  });

  useEffect(() => {
    loadData();
  }, [organizationId, projectionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [balancoResponse, fluxoData, debtData] = await Promise.all([
        getBalancoPatrimonialDataV2(organizationId, projectionId),
        getFluxoCaixaSimplificado(organizationId, projectionId),
        getDebtPosition(organizationId, projectionId)
      ]);
      
      setBalancoData(balancoResponse);
      setFluxoCaixa(fluxoData);
      setDebtPosition(debtData);
      
      // Usar anos dinâmicos do balanço (que vem do fluxo de caixa)
      if (balancoResponse?.anos && balancoResponse.anos.length > 0) {
        setAnos(balancoResponse.anos);
      } else {
        // Fallback: Anos de 2023 a 2030 caso não haja dados
        const yearsSet = new Set<string>();
        for (let year = 2023; year <= 2030; year++) {
          yearsSet.add(year.toString());
        }
        setAnos(Array.from(yearsSet).sort());
      }
    } catch (error) {
      console.error("Erro ao carregar dados do balanço:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Função para obter valor por ano
  const getValueByYear = (data: any, year: string): number => {
    if (!data) return 0;
    
    const safraKey = yearToSafra(year);
    if (data[safraKey] !== undefined) return data[safraKey];
    if (data[year] !== undefined) return data[year];
    
    return 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!balancoData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Nenhum dado disponível para o Balanço Patrimonial
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeaderPrimary
          icon={<ClipboardList className="h-5 w-5" />}
          title="Balanço Patrimonial"
          description="Demonstração da posição patrimonial e financeira por período"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigModal(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurar Premissas
            </Button>
          }
        />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-white">
                <TableHead className="font-semibold text-white py-2 px-3 text-sm min-w-[300px]">
                  CONTAS
                </TableHead>
                <TableHead className="font-semibold text-white text-center w-20 py-2 px-2 text-xs">
                  UN
                </TableHead>
                {anos.map(ano => (
                  <TableHead 
                    key={ano} 
                    className="font-semibold text-white text-center min-w-[100px] py-2 px-2 text-sm"
                  >
                    {ano}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* ====== ATIVO ====== */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={2 + anos.length} className="py-1 px-3 text-sm text-primary">
                  ATIVO
                </TableCell>
              </TableRow>

              {/* ATIVO CIRCULANTE - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer"
                onClick={() => toggleSection('ativoCirculante')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('ativoCirculante');
                      }}
                    >
                      {expandedSections.ativoCirculante ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    ATIVO CIRCULANTE
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const valor = getValueByYear(balancoData?.ativo?.circulante?.total, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {valor > 0 ? formatValueCompact(valor) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes do Ativo Circulante */}
              {expandedSections.ativoCirculante && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Caixa e Bancos</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.ativo?.circulante?.caixa_bancos, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Contas a Receber</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.ativo?.circulante?.clientes, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Adiantamentos a Fornecedores</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.ativo?.circulante?.adiantamentos_fornecedores, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Estoques - Subseção colapsável */}
                  <TableRow className="bg-muted/30 cursor-pointer"
                    onClick={() => toggleSection('estoques')}>
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-3 w-3 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection('estoques');
                          }}
                        >
                          {expandedSections.estoques ? <ChevronDown className="h-2 w-2" /> : <ChevronRight className="h-2 w-2" />}
                        </Button>
                        Estoques
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.ativo?.circulante?.estoques?.total, ano);
                      return (
                        <TableCell key={ano} className="text-right font-medium py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Detalhes dos Estoques */}
                  {expandedSections.estoques && (
                    <>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">Defensivos</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.circulante?.estoques?.defensivos, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">Fertilizantes</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.circulante?.estoques?.fertilizantes, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">Commodities</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.circulante?.estoques?.commodities, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">Sementes</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.circulante?.estoques?.sementes, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </>
                  )}

                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Empréstimos a Terceiros</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.ativo?.circulante?.emprestimos_terceiros, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </>
              )}

              {/* ATIVO NÃO CIRCULANTE - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer"
                onClick={() => toggleSection('ativoNaoCirculante')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('ativoNaoCirculante');
                      }}
                    >
                      {expandedSections.ativoNaoCirculante ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    ATIVO NÃO CIRCULANTE
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const valor = getValueByYear(balancoData?.ativo?.nao_circulante?.total, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {valor > 0 ? formatValueCompact(valor) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes do Ativo Não Circulante */}
              {expandedSections.ativoNaoCirculante && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Investimentos</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.ativo?.nao_circulante?.investimentos, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Imobilizado - Subseção colapsável */}
                  <TableRow className="bg-muted/30 cursor-pointer"
                    onClick={() => toggleSection('imobilizado')}>
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-3 w-3 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection('imobilizado');
                          }}
                        >
                          {expandedSections.imobilizado ? <ChevronDown className="h-2 w-2" /> : <ChevronRight className="h-2 w-2" />}
                        </Button>
                        Imobilizado
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.ativo?.nao_circulante?.imobilizado?.total, ano);
                      return (
                        <TableCell key={ano} className="text-right font-medium py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Detalhes do Imobilizado */}
                  {expandedSections.imobilizado && (
                    <>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">Terras</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.nao_circulante?.imobilizado?.terras, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">Máquinas e Equipamentos</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.nao_circulante?.imobilizado?.maquinas_equipamentos, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">Veículos</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.nao_circulante?.imobilizado?.veiculos, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">Benfeitorias</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.nao_circulante?.imobilizado?.benfeitorias, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="">
                        <TableCell className="font-medium pl-10 py-1 pr-3 text-sm text-muted-foreground">(-) Depreciação Acumulada</TableCell>
                        <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                        {anos.map(ano => {
                          const valor = getValueByYear(balancoData?.ativo?.nao_circulante?.imobilizado?.depreciacao_acumulada, ano);
                          return (
                            <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                              {valor > 0 ? formatValueCompact(-valor) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </>
                  )}
                </>
              )}

              {/* TOTAL DO ATIVO */}
              <TableRow className="bg-green-50 dark:bg-green-900/20 font-bold">
                <TableCell className="font-bold py-1 px-3 text-sm">TOTAL DO ATIVO</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const valor = getValueByYear(balancoData?.ativo?.total, ano);
                  return (
                    <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                      {valor > 0 ? formatValueCompact(valor) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Linha separadora */}
              <TableRow>
                <TableCell colSpan={2 + anos.length} className="py-2"></TableCell>
              </TableRow>

              {/* ====== PASSIVO ====== */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={2 + anos.length} className="py-1 px-3 text-sm text-primary">
                  PASSIVO
                </TableCell>
              </TableRow>

              {/* PASSIVO CIRCULANTE - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer"
                onClick={() => toggleSection('passivoCirculante')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('passivoCirculante');
                      }}
                    >
                      {expandedSections.passivoCirculante ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    PASSIVO CIRCULANTE
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const valor = getValueByYear(balancoData?.passivo?.circulante?.total, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {valor > 0 ? formatValueCompact(valor) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes do Passivo Circulante */}
              {expandedSections.passivoCirculante && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Fornecedores</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.circulante?.fornecedores, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Empréstimos e Financiamentos CP</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.circulante?.emprestimos_financiamentos_curto_prazo, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Adiantamentos de Clientes</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.circulante?.adiantamentos_clientes, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Impostos e Taxas a Pagar</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.circulante?.impostos_taxas, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </>
              )}

              {/* PASSIVO NÃO CIRCULANTE - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer"
                onClick={() => toggleSection('passivoNaoCirculante')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('passivoNaoCirculante');
                      }}
                    >
                      {expandedSections.passivoNaoCirculante ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    PASSIVO NÃO CIRCULANTE
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const valor = getValueByYear(balancoData?.passivo?.nao_circulante?.total, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {valor > 0 ? formatValueCompact(valor) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes do Passivo Não Circulante */}
              {expandedSections.passivoNaoCirculante && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Empréstimos e Financiamentos LP</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.nao_circulante?.emprestimos_financiamentos_longo_prazo, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Financiamentos de Terras</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.nao_circulante?.financiamentos_terras, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Arrendamentos a Pagar</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.nao_circulante?.arrendamentos, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </>
              )}

              {/* PATRIMÔNIO LÍQUIDO - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer"
                onClick={() => toggleSection('patrimonioLiquido')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('patrimonioLiquido');
                      }}
                    >
                      {expandedSections.patrimonioLiquido ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    PATRIMÔNIO LÍQUIDO
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const valor = getValueByYear(balancoData?.passivo?.patrimonio_liquido?.total, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {valor > 0 ? formatValueCompact(valor) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes do Patrimônio Líquido */}
              {expandedSections.patrimonioLiquido && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Capital Social</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.patrimonio_liquido?.capital_social, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Reservas</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.patrimonio_liquido?.reservas, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Lucros/Prejuízos Acumulados</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(balancoData?.passivo?.patrimonio_liquido?.lucros_acumulados, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor !== 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </>
              )}

              {/* TOTAL DO PASSIVO + PL */}
              <TableRow className="bg-green-50 dark:bg-green-900/20 font-bold">
                <TableCell className="font-bold py-1 px-3 text-sm">TOTAL DO PASSIVO + PATRIMÔNIO LÍQUIDO</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const valor = getValueByYear(balancoData?.passivo?.total, ano);
                  return (
                    <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                      {valor > 0 ? formatValueCompact(valor) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

      {/* Modal de Configuração */}
      <BalanceSheetConfigModal
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
        organizationId={organizationId}
        onSuccess={() => {
          // Recarregar dados após salvar configurações
          loadData();
        }}
      />
    </>
  );
}