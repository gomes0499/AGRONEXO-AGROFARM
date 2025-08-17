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
  FileText,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { getFluxoCaixaSimplificado } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";
import { getDebtPosition } from "@/lib/actions/debt-position-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface DREStyledProps {
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

// Função para formatar percentual
function formatPercent(value: number): string {
  if (value === 0) return "-";
  return `${value.toFixed(1)}%`;
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

export function DREStyled({ 
  organizationId, 
  projectionId 
}: DREStyledProps) {
  const [fluxoCaixa, setFluxoCaixa] = useState<any>(null);
  const [debtPosition, setDebtPosition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [anos, setAnos] = useState<string[]>([]);
  
  // Estados para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'receitaOperacional': false,
    'custos': false,
    'despesasOperacionais': false,
    'resultadoFinanceiro': false,
  });

  useEffect(() => {
    loadData();
  }, [organizationId, projectionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fluxoData, debtData] = await Promise.all([
        getFluxoCaixaSimplificado(organizationId, projectionId),
        getDebtPosition(organizationId, projectionId)
      ]);
      
      if (fluxoData) {
        setFluxoCaixa(fluxoData);
        // Anos de 2023 a 2030
        const yearsSet = new Set<string>();
        for (let year = 2023; year <= 2030; year++) {
          yearsSet.add(year.toString());
        }
        setAnos(Array.from(yearsSet).sort());
      }
      
      if (debtData) {
        setDebtPosition(debtData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do DRE:", error);
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

  // Valores hardcoded de financeiras (mesmos da tabela de projeções)
  const getFinanceirasByYear = (year: string) => {
    const safra = yearToSafra(year);
    
    const servicoDividaValues: Record<string, number> = {
      "2022/23": 0,
      "2023/24": 0,
      "2024/25": 9385384,
      "2025/26": 8709391,
      "2026/27": 7399292,
      "2027/28": 5886929,
      "2028/29": 3699556,
      "2029/30": 1512183,
    };
    
    return servicoDividaValues[safra] || 0;
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

  if (!fluxoCaixa) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Nenhum dado disponível para o DRE
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeaderPrimary
        icon={<FileText className="h-5 w-5" />}
        title="Demonstração de Resultado do Exercício (DRE)"
        description="Análise consolidada de receitas, custos e resultados por período"
      />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-white">
                <TableHead className="font-semibold text-white py-2 px-3 text-sm min-w-[250px]">
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
              {/* RECEITA OPERACIONAL BRUTA - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer "
                onClick={() => toggleSection('receitaOperacional')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('receitaOperacional');
                      }}
                    >
                      {expandedSections.receitaOperacional ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    RECEITA OPERACIONAL BRUTA
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const receita = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {receita > 0 ? formatValueCompact(receita) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes de Receita Operacional */}
              {expandedSections.receitaOperacional && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Receitas Agrícolas</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Receitas Pecuárias</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
                    ))}
                  </TableRow>
                </>
              )}

              {/* RECEITA OPERACIONAL LÍQUIDA */}
              <TableRow className="">
                <TableCell className="font-medium py-1 px-3 text-sm">(-) Impostos sobre Vendas</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-primary/5 font-semibold">
                <TableCell className="font-medium py-1 px-3 text-sm">RECEITA OPERACIONAL LÍQUIDA</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const receita = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {receita > 0 ? formatValueCompact(receita) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* CUSTOS - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer "
                onClick={() => toggleSection('custos')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('custos');
                      }}
                    >
                      {expandedSections.custos ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    (-) CUSTOS DOS PRODUTOS VENDIDOS
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const custo = getValueByYear(fluxoCaixa?.despesas_agricolas?.total_por_ano, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {custo > 0 ? formatValueCompact(custo) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes de Custos */}
              {expandedSections.custos && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Custos Agrícolas</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(fluxoCaixa?.despesas_agricolas?.total_por_ano, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Custos Pecuários</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
                    ))}
                  </TableRow>
                </>
              )}

              {/* EBITDA (igual ao Lucro Bruto na estrutura de Projeções) */}
              <TableRow className="bg-primary/5 font-bold">
                <TableCell className="font-medium py-1 px-3 text-sm">EBITDA</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const receita = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                  const custo = getValueByYear(fluxoCaixa?.despesas_agricolas?.total_por_ano, ano);
                  const ebitda = receita - custo;
                  return (
                    <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                      {ebitda !== 0 ? formatValueCompact(ebitda) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Margem EBITDA */}
              <TableRow className="">
                <TableCell className="font-medium py-1 px-3 text-sm italic">Margem EBITDA</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">%</TableCell>
                {anos.map(ano => {
                  const receita = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                  const custo = getValueByYear(fluxoCaixa?.despesas_agricolas?.total_por_ano, ano);
                  const ebitda = receita - custo;
                  const margem = receita > 0 ? (ebitda / receita) * 100 : 0;
                  return (
                    <TableCell key={ano} className="text-right py-1 px-2 text-sm italic">
                      {margem !== 0 ? formatPercent(margem) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* DESPESAS OPERACIONAIS - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer "
                onClick={() => toggleSection('despesasOperacionais')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('despesasOperacionais');
                      }}
                    >
                      {expandedSections.despesasOperacionais ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    (-) OUTRAS DESPESAS
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const outras = getValueByYear(fluxoCaixa?.outras_despesas?.total_por_ano, ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {outras > 0 ? formatValueCompact(outras) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes de Despesas Operacionais */}
              {expandedSections.despesasOperacionais && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Arrendamentos</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(fluxoCaixa?.outras_despesas?.arrendamento, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Despesas Tributárias</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(fluxoCaixa?.outras_despesas?.tributarias, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Pró-Labore/Divisão de Lucros</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const proLabore = getValueByYear(fluxoCaixa?.outras_despesas?.pro_labore, ano);
                      const divisaoLucros = getValueByYear(fluxoCaixa?.outras_despesas?.divisao_lucros, ano);
                      const valor = (proLabore || 0) + (divisaoLucros || 0);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Outras Despesas</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getValueByYear(fluxoCaixa?.outras_despesas?.outras, ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </>
              )}

              {/* Depreciação */}
              <TableRow className="">
                <TableCell className="font-medium py-1 px-3 text-sm">(-) Depreciação e Amortização</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
                ))}
              </TableRow>

              {/* EBIT (LUCRO OPERACIONAL) = EBITDA - Outras Despesas */}
              <TableRow className="bg-primary/5 font-bold">
                <TableCell className="font-medium py-1 px-3 text-sm">EBIT (LUCRO OPERACIONAL)</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const receita = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                  const custo = getValueByYear(fluxoCaixa?.despesas_agricolas?.total_por_ano, ano);
                  const outras = getValueByYear(fluxoCaixa?.outras_despesas?.total_por_ano, ano);
                  const ebitda = receita - custo;
                  const ebit = ebitda - outras; // EBIT = EBITDA - Outras Despesas
                  return (
                    <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                      {ebit !== 0 ? formatValueCompact(ebit) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* RESULTADO FINANCEIRO - Total */}
              <TableRow className="bg-primary/5 font-semibold cursor-pointer "
                onClick={() => toggleSection('resultadoFinanceiro')}>
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('resultadoFinanceiro');
                      }}
                    >
                      {expandedSections.resultadoFinanceiro ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                    RESULTADO FINANCEIRO
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const despesasFinanceiras = getFinanceirasByYear(ano);
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {despesasFinanceiras > 0 ? formatValueCompact(-despesasFinanceiras) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Detalhes do Resultado Financeiro */}
              {expandedSections.resultadoFinanceiro && (
                <>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Receitas Financeiras</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">(-) Despesas Financeiras</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => {
                      const valor = getFinanceirasByYear(ano);
                      return (
                        <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                          {valor > 0 ? formatValueCompact(valor) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="">
                    <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Variação Cambial</TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {anos.map(ano => (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
                    ))}
                  </TableRow>
                </>
              )}

              {/* LUCRO ANTES DO IR */}
              <TableRow className="bg-primary/5 font-bold">
                <TableCell className="font-medium py-1 px-3 text-sm">LUCRO ANTES DO IR</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const receita = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                  const custo = getValueByYear(fluxoCaixa?.despesas_agricolas?.total_por_ano, ano);
                  const outras = getValueByYear(fluxoCaixa?.outras_despesas?.total_por_ano, ano);
                  const ebitda = receita - custo;
                  const ebit = ebitda - outras;
                  const despesasFinanceiras = getFinanceirasByYear(ano);
                  const lucroAntesIR = ebit - despesasFinanceiras;
                  return (
                    <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                      {lucroAntesIR !== 0 ? formatValueCompact(lucroAntesIR) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* IR e CSLL */}
              <TableRow className="">
                <TableCell className="font-medium py-1 px-3 text-sm">(-) Imposto de Renda e CSLL</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
                ))}
              </TableRow>

              {/* LUCRO LÍQUIDO */}
              <TableRow className="bg-green-50 dark:bg-green-900/20 font-bold">
                <TableCell className="font-bold py-1 px-3 text-sm">LUCRO LÍQUIDO DO EXERCÍCIO</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {anos.map(ano => {
                  const receita = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                  const custo = getValueByYear(fluxoCaixa?.despesas_agricolas?.total_por_ano, ano);
                  const outras = getValueByYear(fluxoCaixa?.outras_despesas?.total_por_ano, ano);
                  const ebitda = receita - custo;
                  const ebit = ebitda - outras;
                  const despesasFinanceiras = getFinanceirasByYear(ano);
                  const lucroLiquido = ebit - despesasFinanceiras;
                  return (
                    <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                      {lucroLiquido !== 0 ? formatValueCompact(lucroLiquido) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Margem Líquida */}
              <TableRow className="">
                <TableCell className="font-medium py-1 px-3 text-sm italic">Margem Líquida</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">%</TableCell>
                {anos.map(ano => {
                  const receita = getValueByYear(fluxoCaixa?.receitas_agricolas?.total_por_ano, ano);
                  const custo = getValueByYear(fluxoCaixa?.despesas_agricolas?.total_por_ano, ano);
                  const outras = getValueByYear(fluxoCaixa?.outras_despesas?.total_por_ano, ano);
                  const ebitda = receita - custo;
                  const ebit = ebitda - outras;
                  const despesasFinanceiras = getFinanceirasByYear(ano);
                  const lucroLiquido = ebit - despesasFinanceiras;
                  const margem = receita > 0 ? (lucroLiquido / receita) * 100 : 0;
                  return (
                    <TableCell key={ano} className="text-right py-1 px-2 text-sm italic">
                      {margem !== 0 ? formatPercent(margem) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}