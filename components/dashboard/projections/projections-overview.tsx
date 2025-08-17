"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  FileSpreadsheet, 
  Calculator, 
  TrendingDown, 
  Settings, 
  Percent,
  DollarSign,
  TrendingUp,
  Briefcase,
  Banknote,
  PiggyBank,
  Eye,
  EyeOff
} from "lucide-react";
import { getCultureProjections } from "@/lib/actions/culture-projections-actions";
import { getDebtPosition } from "@/lib/actions/debt-position-actions";
import { getDebtDetails } from "@/lib/actions/debt-details-actions";
import { getFluxoCaixaSimplificado } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatters";
import { calculateDebtService, getTotalDebtBySafra } from "@/lib/actions/debt-service-calculations";

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
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CashPolicyConfig } from "@/components/dashboard/visao-geral/cash-policy-config";

interface ProjectionsOverviewProps {
  organizationId: string;
  projectionId?: string;
  safras: any[];
  cultures: any[];
  properties: any[];
}

interface ProjectionSection {
  id: string;
  title: string;
  cultura: string;
  sistema: string;
  ciclo: string;
  isExpanded: boolean;
  data: any;
}

export function ProjectionsOverview({
  organizationId,
  projectionId,
  safras = [],
  cultures = [],
  properties = [],
}: ProjectionsOverviewProps) {
  const [sections, setSections] = useState<ProjectionSection[]>([]);
  const [consolidado, setConsolidado] = useState<any>(null);
  const [anos, setAnos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debtPosition, setDebtPosition] = useState<any>(null);
  const [debtSectionExpanded, setDebtSectionExpanded] = useState(true);
  const [showCashPolicyModal, setShowCashPolicyModal] = useState(false);
  const [fluxoCaixa, setFluxoCaixa] = useState<any>(null);
  const [fluxoSectionExpanded, setFluxoSectionExpanded] = useState(true);
  const [margemSeguranca, setMargemSeguranca] = useState(1.10); // 10% de margem padrão
  const [refinanciamentosManual, setRefinanciamentosManual] = useState<Record<string, number>>({});
  const [necessidadeCaixaPercent, setNecessidadeCaixaPercent] = useState(10); // 10% padrão
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);
  const [debtServiceData, setDebtServiceData] = useState<any>(null);
  
  // Estados para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'resultado': true,
    'culturas': false,
    'totalGeral': true,
    'posicaoDivida': true,
    'servicoDivida': true,
    'fluxoCaixa': true,
    'investimentos': true,
    'financeiras': true,
    'receitasDetalhes': false,
    'despesasDetalhes': false,
    'outrasDetalhes': false,
    'bancosDetalhes': false,
    'terrasDetalhes': false,
    'arrendamentoDetalhes': false,
    'fornecedoresDetalhes': false,
  });
  
  // Estados para controlar detalhes das culturas
  const [showCultureDetails, setShowCultureDetails] = useState<Record<string, boolean>>({});

  // Função para filtrar anos válidos (excluindo 2020/21 e limitando até 2029/30)
  const getValidAnos = () => {
    return anos.filter(ano => {
      const match = ano.match(/(\d{4})\/(\d{2})/);
      if (match) {
        const yearStart = parseInt(match[1]);
        // Excluir 2020/21 e manter apenas anos até 2029
        return yearStart > 2020 && yearStart <= 2029;
      }
      return true;
    });
  };

  const validAnos = getValidAnos();

  useEffect(() => {
    loadProjections();
  }, [organizationId, projectionId]);

  // Carregar detalhes dos bancos quando a seção for expandida
  useEffect(() => {
    if ((expandedSections.bancosDetalhes || expandedSections.terrasDetalhes || expandedSections.arrendamentoDetalhes || expandedSections.fornecedoresDetalhes) && !bankDetails && !loadingBankDetails) {
      loadBankDetails();
    }
  }, [expandedSections.bancosDetalhes, expandedSections.terrasDetalhes, expandedSections.arrendamentoDetalhes, expandedSections.fornecedoresDetalhes]);

  const loadBankDetails = async () => {
    setLoadingBankDetails(true);
    try {
      const details = await getDebtDetails(organizationId);
      setBankDetails(details);
    } catch (error) {
      console.error('Erro ao carregar detalhes das dívidas:', error);
    } finally {
      setLoadingBankDetails(false);
    }
  };
  
  // Função para alternar seção expandida
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  
  // Função para alternar detalhes da cultura
  const toggleCultureDetail = (cultureKey: string) => {
    setShowCultureDetails(prev => ({
      ...prev,
      [cultureKey]: !prev[cultureKey]
    }));
  };
  
  // Função para expandir/recolher todas as seções
  const toggleAllSections = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    Object.keys(expandedSections).forEach(key => {
      newState[key] = expand;
    });
    setExpandedSections(newState);
  };

  // Função para calcular ajustes de caixa para manter 10% da receita
  const calcularAjustesCaixa = () => {
    const ajustes: Record<string, { pagamentoBanco: number; refinanciamento: number }> = {};
    let acumulado = 0; // Sem valor inicial hardcoded

    // Usar os pagamentos calculados do debtPosition
    let pagamentosPorAno: Record<string, number> = {};
    
    console.log("=== DEBUG PAGAMENTO BANCO ===");
    console.log("debtPosition.pagamentos_bancos:", debtPosition?.pagamentos_bancos);
    
    // Usar os pagamentos já calculados no debtPosition
    if (debtPosition?.pagamentos_bancos) {
      pagamentosPorAno = debtPosition.pagamentos_bancos;
      console.log("Usando pagamentos do debtPosition:", pagamentosPorAno);
    } else {
      console.log("⚠️ pagamentos_bancos não encontrado no debtPosition");
    }
    
    // Para compatibilidade com código existente, manter pagamentoBaseGlobal
    const pagamentoBaseGlobal = pagamentosPorAno["2024/25"] || 0;
    
    console.log("Pagamento Base Global (2024/25):", pagamentoBaseGlobal);
    console.log("=== FIM DEBUG PAGAMENTO BANCO ===");

    validAnos.forEach(ano => {
      if (ano === '2021/22' || ano === '2022/23' || ano === '2023/24') {
        ajustes[ano] = { pagamentoBanco: 0, refinanciamento: 0 };
        return;
      }

      // Receita do ano
      const receita = fluxoCaixa?.receitas_agricolas?.total_por_ano?.[ano] || 0;
      const caixaMinimo = receita * (necessidadeCaixaPercent / 100); // 10% da receita

      // Fluxo da atividade antes das financeiras
      const fluxoAtividade = fluxoCaixa?.fluxo_atividade?.[ano] || 0;
      const investimentos = fluxoCaixa?.investimentos?.total?.[ano] || 0;
      
      // Usar serviço da dívida calculado dinamicamente
      const servicoDivida = debtServiceData?.servicoDivida?.[ano] || 0;

      // Usar o pagamento do ano específico
      const pagamentoBase = pagamentosPorAno[ano] || 0;
      
      // Calcular fluxo sem ajustes
      const fluxoSemAjustes = fluxoAtividade - Math.abs(investimentos) - servicoDivida - pagamentoBase;
      const acumuladoSemAjustes = acumulado + fluxoSemAjustes;

      // Calcular diferença entre o acumulado sem ajustes e o caixa mínimo desejado
      const diferenca = acumuladoSemAjustes - caixaMinimo;

      if (diferenca > 0) {
        // Excesso de caixa: aumentar pagamento aos bancos
        ajustes[ano] = {
          pagamentoBanco: pagamentoBase + diferenca,
          refinanciamento: 0
        };
      } else {
        // Necessidade de caixa: aumentar refinanciamento
        ajustes[ano] = {
          pagamentoBanco: pagamentoBase,
          refinanciamento: Math.abs(diferenca)
        };
      }

      // Atualizar acumulado para o próximo ano (sempre será o caixa mínimo)
      acumulado = caixaMinimo;
    });

    return ajustes;
  };

  // Memo para calcular ajustes apenas quando necessário
  const ajustesCaixa = React.useMemo(() => {
    if (!fluxoCaixa) return {};
    return calcularAjustesCaixa();
  }, [fluxoCaixa, necessidadeCaixaPercent, validAnos, debtPosition]);

  // Funções para obter valores ajustados
  const calcularPagamentoBanco = (ano: string): number => {
    // Primeiro tentar usar o valor dos ajustes (com excedente de caixa)
    if (ajustesCaixa[ano]?.pagamentoBanco !== undefined) {
      return ajustesCaixa[ano].pagamentoBanco;
    }
    // Se não houver ajuste, usar o valor base do debtPosition
    return debtPosition?.pagamentos_bancos?.[ano] || 0;
  };

  const calcularRefinanciamento = (ano: string): number => {
    return ajustesCaixa[ano]?.refinanciamento || 0;
  };

  const loadProjections = async () => {
    try {
      setIsLoading(true);
      
      // Carregar projeções de cultura, posição de dívida e fluxo de caixa primeiro
      const [cultureData, debtData, fluxoData] = await Promise.all([
        getCultureProjections(organizationId, projectionId),
        getDebtPosition(organizationId, projectionId),
        getFluxoCaixaSimplificado(organizationId, projectionId)
      ]);
      
      // Depois calcular o serviço da dívida usando os dados de debtPosition
      console.log("DebtData completo:", debtData);
      console.log("DebtData.dividas:", debtData?.dividas);
      const debtServiceCalc = await calculateDebtService(organizationId, safras, debtData);
      console.log("DebtServiceCalc retornado:", debtServiceCalc);
      
      // Criar seções para cada cultura
      const projectionSections: ProjectionSection[] = cultureData.projections.map((proj, index) => ({
        id: `proj-${index}`,
        title: proj.combination_title.replace("PROJEÇÃO - ", ""),
        cultura: proj.cultura_nome,
        sistema: proj.sistema_nome,
        ciclo: proj.ciclo_nome,
        isExpanded: true, // Começar expandido
        data: proj.projections_by_year,
      }));

      setSections(projectionSections);
      setConsolidado(cultureData.consolidado.projections_by_year);
      setAnos(cultureData.anos);
      setDebtPosition(debtData);
      setFluxoCaixa(fluxoData);
      setDebtServiceData(debtServiceCalc);
    } catch (error) {
      console.error("Erro ao carregar projeções:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para alternar culturas individuais
  const toggleCultureSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  };

  // Funções para expandir/recolher todas as culturas
  const expandAll = () => {
    setSections(prev => prev.map(section => ({ ...section, isExpanded: true })));
  };

  const collapseAll = () => {
    setSections(prev => prev.map(section => ({ ...section, isExpanded: false })));
  };

  const renderCultureSection = (section: ProjectionSection) => {
    const rows = [
      { label: "Área plantada", unit: "hectares", field: "area_plantada", format: "number" },
      { label: "Produtividade", unit: section.cultura.toLowerCase().includes("algod") ? "@/ha" : "Sc/ha", field: "produtividade", format: "decimal" },
      { label: "Preço", unit: section.cultura.toLowerCase().includes("algod") ? "R$/@" : "R$/Sc", field: "preco", format: "currency" },
      { label: "Receita", unit: "R$", field: "receita", format: "currency", highlight: true },
      { label: "Custo", unit: "R$/ha", field: "custo_ha", format: "currency" },
      { label: "Custo Total", unit: "R$", field: "custo_total", format: "currency" },
      { label: "EBITDA", unit: "R$", field: "ebitda", format: "currency", highlight: true },
      { label: "EBITDA", unit: "%", field: "ebitda_percent", format: "percent", highlight: true },
      { label: "BREAK EVEN", unit: "SACAS", field: "break_even", format: "decimal", calculate: true },
    ];

    return [
      /* Linha do título da cultura com toggle */
      <TableRow key={`${section.id}-header`} className="bg-muted/50 hover:bg-muted/70 cursor-pointer" onClick={() => toggleCultureSection(section.id)}>
        <TableCell colSpan={2 + validAnos.length} className="font-bold">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleCultureSection(section.id);
              }}
            >
              {section.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
            <span>{section.title}</span>
          </div>
        </TableCell>
      </TableRow>,

      /* Linhas de dados da cultura */
      ...(section.isExpanded ? rows.map((row, index) => {
        const isHighlight = row.highlight || false;
        
        return (
          <TableRow key={`${section.id}-${row.field}`} className={cn(
            "hover:bg-muted/30",
            isHighlight && "bg-primary/5"
          )}>
            <TableCell className="font-medium py-1 px-3 text-sm">{row.label}</TableCell>
            <TableCell className="text-muted-foreground text-xs py-1 px-2">{row.unit}</TableCell>
            {validAnos.map(ano => {
              const yearData = section.data[ano];
              let value = yearData?.[row.field] || 0;

              // Calcular Break Even se necessário
              if (row.calculate && row.field === "break_even") {
                const custoHa = yearData?.custo_ha || 0;
                const preco = yearData?.preco || 1;
                value = custoHa / preco;
              }

              let formattedValue = "-";
              if (yearData) {
                if (row.format === "currency") {
                  formattedValue = formatValueCompact(value);
                } else if (row.format === "percent") {
                  formattedValue = formatPercent(value);
                } else if (row.format === "decimal") {
                  formattedValue = formatNumber(value, 2);
                } else {
                  formattedValue = formatNumber(value);
                }
              }

              return (
                <TableCell 
                  key={ano} 
                  className={cn(
                    "text-right py-1 px-2 text-sm",
                    isHighlight && "font-medium"
                  )}
                >
                  {formattedValue}
                </TableCell>
              );
            })}
          </TableRow>
        );
      }) : []),

    ];
  };

  const renderConsolidado = () => {
    const rows = [
      { label: "Área Total", unit: "hectares", field: "area_plantada", format: "number" },
      { label: "Receita Total", unit: "R$", field: "receita", format: "currency", highlight: true },
      { label: "Custo Total", unit: "R$", field: "custo_total", format: "currency" },
      { label: "EBITDA", unit: "R$", field: "ebitda", format: "currency", highlight: true },
      { label: "EBITDA", unit: "%", field: "ebitda_percent", format: "percent", highlight: true },
    ];

    return (
      <>
        {/* Título do consolidado */}
        <TableRow 
          className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
          onClick={() => toggleSection('totalGeral')}
        >
          <TableCell colSpan={2 + validAnos.length} className="font-bold py-1 px-3 text-sm">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('totalGeral');
                }}
              >
                {expandedSections.totalGeral ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <span>TOTAL GERAL</span>
            </div>
          </TableCell>
        </TableRow>

        {/* Linhas de dados consolidados */}
        {expandedSections.totalGeral && rows.map((row, index) => {
          const isHighlight = row.highlight || false;
          
          return (
            <TableRow key={`consolidado-${row.field}`} className={cn(
              "hover:bg-muted/30",
              isHighlight && "bg-primary/5 font-semibold"
            )}>
              <TableCell className="font-medium py-1 px-3 text-sm">{row.label}</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">{row.unit}</TableCell>
              {validAnos.map(ano => {
                const yearData = consolidado?.[ano];
                const value = yearData?.[row.field] || 0;

                let formattedValue = "-";
                if (yearData) {
                  if (row.format === "currency") {
                    formattedValue = formatValueCompact(value);
                  } else if (row.format === "percent") {
                    formattedValue = formatPercent(value);
                  } else {
                    formattedValue = formatNumber(value);
                  }
                }

                return (
                  <TableCell 
                    key={ano} 
                    className={cn(
                      "text-right py-1 px-2 text-sm",
                      isHighlight && "font-medium"
                    )}
                  >
                    {formattedValue}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </>
    );
  };

  const renderDebtPosition = () => {
    if (!debtPosition) return null;

    const { dividas, indicadores } = debtPosition;
    
    // Mapear categorias para nomes exibidos
    const categoryNames: Record<string, string> = {
      "BANCOS": "Bancos",
      "TERRAS": "Terras", 
      "FORNECEDORES": "Fornecedores"
    };

    // Adicionar Arrendamento e Adiantamento Clientes
    const arrendamentoData = { categoria: "Arrendamento", valores_por_ano: {} as Record<string, number> };
    const adiantamentoData = { categoria: "Adiantamento Clientes", valores_por_ano: {} as Record<string, number> };
    const tradingsData = { categoria: "Tradings", valores_por_ano: {} as Record<string, number> };
    const outrosData = { categoria: "Outros", valores_por_ano: {} as Record<string, number> };
    
    // Inicializar com zeros
    validAnos.forEach(ano => {
      arrendamentoData.valores_por_ano[ano] = 0;
      adiantamentoData.valores_por_ano[ano] = 0;
      tradingsData.valores_por_ano[ano] = 0;
      outrosData.valores_por_ano[ano] = 0;
    });

    return (
      <>

        {/* Título da seção de dívida com toggle */}
        <TableRow 
          className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
          onClick={() => toggleSection('posicaoDivida')}
        >
          <TableCell colSpan={2 + validAnos.length} className="font-bold py-1 px-3 text-sm">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('posicaoDivida');
                }}
              >
                {expandedSections.posicaoDivida ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <span>POSIÇÃO DE DÍVIDA</span>
            </div>
          </TableCell>
        </TableRow>

        {/* Dados da posição de dívida */}
        {expandedSections.posicaoDivida && (
          <>
            {/* Bancos */}
            {dividas.find((d: any) => d.categoria === "BANCOS") && (
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('bancosDetalhes')}
                      className="h-5 w-5 p-0 hover:bg-transparent"
                    >
                      {expandedSections.bancosDetalhes ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                    <span>Bancos</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {(() => {
                  const bancos = dividas.find((d: any) => d.categoria === "BANCOS");
                  let saldoAcumulado = 0;
                  
                  return validAnos.map((ano, index) => {
                    // Para o primeiro ano válido ou anos anteriores a 2024/25, usar valor original
                    if (index === 0 || ano < '2024/25') {
                      saldoAcumulado = bancos?.valores_por_ano[ano] || 0;
                    } else {
                      // Para anos seguintes, calcular saldo considerando pagamentos e refinanciamentos
                      const pagamento = calcularPagamentoBanco(ano);
                      const refinanciamento = calcularRefinanciamento(ano);
                      
                      // Saldo = Saldo anterior - Pagamento + Refinanciamento
                      saldoAcumulado = saldoAcumulado - pagamento + refinanciamento;
                      
                      // Garantir que não fique negativo
                      if (saldoAcumulado < 0) saldoAcumulado = 0;
                    }
                    
                    return (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                        {saldoAcumulado > 0 ? formatValueCompact(saldoAcumulado) : "-"}
                      </TableCell>
                    );
                  });
                })()}
              </TableRow>
            )}

            {/* Detalhes dos Bancos - Expandido */}
            {expandedSections.bancosDetalhes && loadingBankDetails && (
              <TableRow>
                <TableCell colSpan={validAnos.length + 2} className="text-center py-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Carregando detalhes...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            
            {expandedSections.bancosDetalhes && !loadingBankDetails && bankDetails?.bancos && (
              <>
                {bankDetails.bancos.map((banco: any) => (
                  <TableRow key={`banco-${banco.id}`} className="hover:bg-muted/10">
                    <TableCell className="text-sm py-1 pl-8 pr-3 text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{banco.nome}</span>
                        {banco.taxa_juros && (
                          <span className="text-xs opacity-70">
                            Taxa: {banco.taxa_juros}% | {banco.moeda || 'BRL'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {validAnos.map((ano) => (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                        {banco.valores_por_ano?.[ano] 
                          ? formatValueCompact(banco.valores_por_ano[ano])
                          : '-'
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {bankDetails.bancos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={validAnos.length + 2} className="text-center py-2 text-sm text-muted-foreground">
                      Nenhum detalhe de dívida bancária disponível
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}

            {/* Adiantamento Clientes */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Adiantamento Clientes</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => (
                <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
              ))}
            </TableRow>

            {/* Terras */}
            {dividas.find((d: any) => d.categoria === "TERRAS") && (
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('terrasDetalhes')}
                      className="h-5 w-5 p-0 hover:bg-transparent"
                    >
                      {expandedSections.terrasDetalhes ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                    <span>Terras</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {validAnos.map(ano => {
                  const terras = dividas.find((d: any) => d.categoria === "TERRAS");
                  const value = terras?.valores_por_ano[ano] || 0;
                  return (
                    <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                      {value > 0 ? formatValueCompact(value) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}

            {/* Detalhes de Terras - Expandido */}
            {expandedSections.terrasDetalhes && loadingBankDetails && (
              <TableRow>
                <TableCell colSpan={validAnos.length + 2} className="text-center py-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Carregando detalhes...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            
            {expandedSections.terrasDetalhes && !loadingBankDetails && bankDetails?.terras && (
              <>
                {bankDetails.terras.map((terra: any) => (
                  <TableRow key={`terra-${terra.id}`} className="hover:bg-muted/10">
                    <TableCell className="text-sm py-1 pl-8 pr-3 text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{terra.nome}</span>
                        {terra.area_hectares && (
                          <span className="text-xs opacity-70">
                            {terra.area_hectares} ha | {terra.moeda || 'BRL'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {validAnos.map((ano) => (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                        {terra.valores_por_ano?.[ano] 
                          ? formatValueCompact(terra.valores_por_ano[ano])
                          : '-'
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {bankDetails.terras.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={validAnos.length + 2} className="text-center py-2 text-sm text-muted-foreground">
                      Nenhum detalhe de aquisição de terras disponível
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}

            {/* Arrendamento */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('arrendamentoDetalhes')}
                    className="h-5 w-5 p-0 hover:bg-transparent"
                  >
                    {expandedSections.arrendamentoDetalhes ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                  <span>Arrendamento</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const arrendamento = dividas.find((d: any) => d.categoria === "ARRENDAMENTO");
                const value = arrendamento?.valores_por_ano[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {value > 0 ? formatValueCompact(value) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Detalhes de Arrendamento - Expandido */}
            {expandedSections.arrendamentoDetalhes && loadingBankDetails && (
              <TableRow>
                <TableCell colSpan={validAnos.length + 2} className="text-center py-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Carregando detalhes...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            
            {expandedSections.arrendamentoDetalhes && !loadingBankDetails && bankDetails?.arrendamentos && (
              <>
                {bankDetails.arrendamentos.map((arrendamento: any) => (
                  <TableRow key={`arrendamento-${arrendamento.id}`} className="hover:bg-muted/10">
                    <TableCell className="text-sm py-1 pl-8 pr-3 text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{arrendamento.nome}</span>
                        {arrendamento.area_hectares && (
                          <span className="text-xs opacity-70">
                            {arrendamento.area_hectares} ha | {arrendamento.tipo || 'Arrendamento'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {validAnos.map((ano) => (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                        {arrendamento.valores_por_ano?.[ano] 
                          ? formatValueCompact(arrendamento.valores_por_ano[ano])
                          : '-'
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {(!bankDetails.arrendamentos || bankDetails.arrendamentos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={validAnos.length + 2} className="text-center py-2 text-sm text-muted-foreground">
                      Nenhum detalhe de arrendamento disponível
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}

            {/* Fornecedores */}
            {dividas.find((d: any) => d.categoria === "FORNECEDORES") && (
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium py-1 px-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('fornecedoresDetalhes')}
                      className="h-5 w-5 p-0 hover:bg-transparent"
                    >
                      {expandedSections.fornecedoresDetalhes ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                    <span>Fornecedores</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {validAnos.map(ano => {
                  const fornecedores = dividas.find((d: any) => d.categoria === "FORNECEDORES");
                  const value = fornecedores?.valores_por_ano[ano] || 0;
                  return (
                    <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                      {value > 0 ? formatValueCompact(value) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}

            {/* Detalhes de Fornecedores - Expandido */}
            {expandedSections.fornecedoresDetalhes && loadingBankDetails && (
              <TableRow>
                <TableCell colSpan={validAnos.length + 2} className="text-center py-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Carregando detalhes...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            
            {expandedSections.fornecedoresDetalhes && !loadingBankDetails && bankDetails?.fornecedores && (
              <>
                {bankDetails.fornecedores.map((fornecedor: any) => (
                  <TableRow key={`fornecedor-${fornecedor.id}`} className="hover:bg-muted/10">
                    <TableCell className="text-sm py-1 pl-8 pr-3 text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{fornecedor.nome}</span>
                        {fornecedor.tipo && (
                          <span className="text-xs opacity-70">
                            {fornecedor.tipo} | {fornecedor.moeda || 'BRL'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                    {validAnos.map((ano) => (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm text-muted-foreground">
                        {fornecedor.valores_por_ano?.[ano] 
                          ? formatValueCompact(fornecedor.valores_por_ano[ano])
                          : '-'
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {(!bankDetails.fornecedores || bankDetails.fornecedores.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={validAnos.length + 2} className="text-center py-2 text-sm text-muted-foreground">
                      Nenhum detalhe de dívida com fornecedores disponível
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}

            {/* Tradings */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Tradings</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => (
                <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
              ))}
            </TableRow>

            {/* Outros */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Outros</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => (
                <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>
              ))}
            </TableRow>

            {/* Endividamento Total */}
            <TableRow className="bg-destructive/5 font-semibold">
              <TableCell className="font-medium py-1 px-3 text-sm">Endividamento Total</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {(() => {
                const bancos = dividas.find((d: any) => d.categoria === "BANCOS");
                let saldoBancosAcumulado = 0;
                
                return validAnos.map((ano, index) => {
                  // Calcular saldo de bancos ajustado
                  if (index === 0 || ano < '2024/25') {
                    saldoBancosAcumulado = bancos?.valores_por_ano[ano] || 0;
                  } else {
                    const pagamento = calcularPagamentoBanco(ano);
                    const refinanciamento = calcularRefinanciamento(ano);
                    saldoBancosAcumulado = Math.max(0, saldoBancosAcumulado - pagamento + refinanciamento);
                  }
                  
                  // Calcular total com o saldo ajustado de bancos
                  let total = saldoBancosAcumulado;
                  
                  // Adicionar outras dívidas (exceto bancos)
                  dividas.forEach((divida: any) => {
                    if (divida.categoria !== "BANCOS") {
                      total += divida.valores_por_ano[ano] || 0;
                    }
                  });
                  
                  return (
                    <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                      {total > 0 ? formatValueCompact(total) : "-"}
                    </TableCell>
                  );
                });
              })()}
            </TableRow>

            {/* Caixas e Disponibilidades */}
            <TableRow className="bg-green-50 dark:bg-green-900/20">
              <TableCell className="font-medium py-1 px-3 text-sm">Caixas e Disponibilidades</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                // Calcular caixas e disponibilidades baseado na política de caixa
                // Por enquanto, vamos usar um valor padrão ou buscar da configuração
                const value = indicadores?.caixas_disponibilidades?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {value > 0 ? formatValueCompact(value) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Dívida Líquida */}
            <TableRow className="bg-gray-100 dark:bg-gray-800 font-semibold">
              <TableCell className="font-medium py-1 px-3 text-sm">Dívida Líquida</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {(() => {
                const bancos = dividas.find((d: any) => d.categoria === "BANCOS");
                let saldoBancosAcumulado = 0;
                
                return validAnos.map((ano, index) => {
                  // Calcular saldo de bancos ajustado
                  if (index === 0 || ano < '2024/25') {
                    saldoBancosAcumulado = bancos?.valores_por_ano[ano] || 0;
                  } else {
                    const pagamento = calcularPagamentoBanco(ano);
                    const refinanciamento = calcularRefinanciamento(ano);
                    saldoBancosAcumulado = Math.max(0, saldoBancosAcumulado - pagamento + refinanciamento);
                  }
                  
                  // Calcular endividamento total ajustado
                  let endividamentoTotal = saldoBancosAcumulado;
                  dividas.forEach((divida: any) => {
                    if (divida.categoria !== "BANCOS") {
                      endividamentoTotal += divida.valores_por_ano[ano] || 0;
                    }
                  });
                  
                  // Caixas e disponibilidades
                  const caixas = indicadores?.caixas_disponibilidades?.[ano] || 0;
                  
                  // Dívida Líquida = Endividamento Total - Caixas
                  const dividaLiquida = endividamentoTotal - caixas;
                  
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      {dividaLiquida !== 0 ? formatValueCompact(dividaLiquida) : "-"}
                    </TableCell>
                  );
                });
              })()}
            </TableRow>


            {/* Receita (Ano Safra) */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Receita (Ano Safra)</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const receita = indicadores?.receita_ano_safra?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {receita > 0 ? formatValueCompact(receita) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* EBITDA (Ano Safra) */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Ebitda (Ano Safra)</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const ebitda = indicadores?.ebitda_ano_safra?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {ebitda > 0 ? formatValueCompact(ebitda) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Dívida/Receita */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Dívida/Receita</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">x</TableCell>
              {validAnos.map(ano => {
                const endividamento = indicadores?.endividamento_total?.[ano] || 0;
                const receita = indicadores?.receita_ano_safra?.[ano] || 0;
                const ratio = receita > 0 ? endividamento / receita : 0;
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {ratio > 0 ? formatNumber(ratio, 2) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Dívida/EBITDA */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Dívida/Ebitda</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">x</TableCell>
              {validAnos.map(ano => {
                const endividamento = indicadores?.endividamento_total?.[ano] || 0;
                const ebitda = indicadores?.ebitda_ano_safra?.[ano] || 0;
                const ratio = ebitda > 0 ? endividamento / ebitda : 0;
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {ratio > 0 ? formatNumber(ratio, 2) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Dívida Líquida/Receita */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Dívida Líquida/Receita</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">x</TableCell>
              {validAnos.map(ano => {
                const endividamento = indicadores?.endividamento_total?.[ano] || 0;
                const caixas = indicadores?.caixas_disponibilidades?.[ano] || 0;
                const dividaLiquida = endividamento - caixas;
                const receita = indicadores?.receita_ano_safra?.[ano] || 0;
                const ratio = receita > 0 ? dividaLiquida / receita : 0;
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {ratio > 0 ? formatNumber(ratio, 2) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Dívida Líquida/EBITDA */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Dívida Líquida/Ebitda</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">x</TableCell>
              {validAnos.map(ano => {
                const endividamento = indicadores?.endividamento_total?.[ano] || 0;
                const caixas = indicadores?.caixas_disponibilidades?.[ano] || 0;
                const dividaLiquida = endividamento - caixas;
                const ebitda = indicadores?.ebitda_ano_safra?.[ano] || 0;
                const ratio = ebitda > 0 ? dividaLiquida / ebitda : 0;
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {ratio > 0 ? formatNumber(ratio, 2) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Dívida em Dólar */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Dívida em Dólar</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">USD</TableCell>
              {validAnos.map(ano => {
                const dividaDolar = indicadores?.divida_dolar?.[ano] || 0;
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {dividaDolar > 0 ? formatValueCompact(dividaDolar) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Dívida Líquida em Dólar */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Dívida Líquida em Dólar</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">USD</TableCell>
              {validAnos.map(ano => {
                const dividaLiquidaDolar = indicadores?.divida_liquida_dolar?.[ano] || 0;
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {dividaLiquidaDolar > 0 ? formatValueCompact(dividaLiquidaDolar) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* LTV */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">LTV</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">x</TableCell>
              {validAnos.map(ano => {
                const ltvValue = indicadores?.ltv?.[ano];
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {ltvValue !== undefined && ltvValue !== null 
                      ? (ltvValue / 100).toFixed(2)
                      : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* LTV Líquido */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">LTV Líquido</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">x</TableCell>
              {validAnos.map(ano => {
                const ltvLiquidoValue = indicadores?.ltv_liquido?.[ano];
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {ltvLiquidoValue !== undefined && ltvLiquidoValue !== null 
                      ? (ltvLiquidoValue / 100).toFixed(2)
                      : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Índice de Liquidez */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium py-1 px-3 text-sm">Índice de Liquidez</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">x</TableCell>
              {validAnos.map(ano => {
                const liquidezValue = indicadores?.liquidez_corrente?.[ano];
                
                // Não mostrar para anos 2021/22 e 2022/23
                if (ano === '2021/22' || ano === '2022/23') {
                  return <TableCell key={ano} className="text-right py-1 px-2 text-sm">-</TableCell>;
                }
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {liquidezValue !== undefined && liquidezValue !== null 
                      ? `${liquidezValue.toFixed(2)}x`
                      : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

          </>
        )}
      </>
    );
  };

  const renderFluxoCaixa = () => {
    if (!fluxoCaixa) return null;

    const formatarNomeCultura = (nome: string) => {
      // Formatar o nome da cultura para exibição
      // SOJA_1_SAFRA_SEQUEIRO -> Soja 1ª Safra Sequeiro
      return nome
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b1\b/g, '1ª')
        .replace(/\b2\b/g, '2ª')
        .replace(/\b(\w)/g, (match) => match.toUpperCase())
        .replace(/Soja/g, 'Soja')
        .replace(/Milho/g, 'Milho')
        .replace(/Feijao/g, 'Feijão')
        .replace(/Sorgo/g, 'Sorgo')
        .replace(/Algodao/g, 'Algodão')
        .replace(/Safra/g, 'Safra')
        .replace(/Sequeiro/g, 'Sequeiro')
        .replace(/Safrinha/g, 'Safrinha');
    };

    return (
      <>

        {/* Título da seção de Fluxo de Caixa com toggle */}
        <TableRow 
          className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
          onClick={() => toggleSection('fluxoCaixa')}
        >
          <TableCell colSpan={2 + validAnos.length} className="font-bold py-1 px-3 text-sm">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('fluxoCaixa');
                }}
              >
                {expandedSections.fluxoCaixa ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <span>FLUXO DE CAIXA PROJETADO</span>
            </div>
          </TableCell>
        </TableRow>

        {/* Dados do Fluxo de Caixa */}
        {expandedSections.fluxoCaixa && (
          <>
            {/* Receitas Agrícolas - Total */}
            <TableRow className="bg-primary/5 font-semibold cursor-pointer hover:bg-primary/10"
              onClick={() => toggleSection('receitasDetalhes')}>
              <TableCell className="font-medium py-1 px-3 text-sm">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection('receitasDetalhes');
                    }}
                  >
                    {expandedSections.receitasDetalhes ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                  Receitas Agrícolas
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const receita = fluxoCaixa?.receitas_agricolas?.total_por_ano?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                    {receita > 0 ? formatValueCompact(receita) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Receitas por Cultura */}
            {expandedSections.receitasDetalhes && fluxoCaixa?.receitas_agricolas?.culturas && 
              Object.entries(fluxoCaixa.receitas_agricolas.culturas).map(([cultura, valores]: [string, any]) => (
                <TableRow key={`receita-${cultura}`} className="hover:bg-muted/30">
                  <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">{formatarNomeCultura(cultura)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                  {validAnos.map(ano => {
                    const valor = valores[ano] || 0;
                    return (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                        {valor > 0 ? formatValueCompact(valor) : "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            }

            {/* Despesas Agrícolas - Total */}
            <TableRow className="bg-primary/5 font-semibold cursor-pointer hover:bg-primary/10"
              onClick={() => toggleSection('despesasDetalhes')}>
              <TableCell className="font-medium py-1 px-3 text-sm">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection('despesasDetalhes');
                    }}
                  >
                    {expandedSections.despesasDetalhes ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                  Despesas Agrícolas
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const despesa = fluxoCaixa?.despesas_agricolas?.total_por_ano?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                    {despesa > 0 ? formatValueCompact(despesa) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Despesas por Cultura */}
            {expandedSections.despesasDetalhes && fluxoCaixa?.despesas_agricolas?.culturas && 
              Object.entries(fluxoCaixa.despesas_agricolas.culturas).map(([cultura, valores]: [string, any]) => (
                <TableRow key={`despesa-${cultura}`} className="hover:bg-muted/30">
                  <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">{formatarNomeCultura(cultura)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                  {validAnos.map(ano => {
                    const valor = valores[ano] || 0;
                    return (
                      <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                        {valor > 0 ? formatValueCompact(valor) : "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            }

            {/* Outras Despesas - Total */}
            <TableRow className="bg-primary/5 font-semibold cursor-pointer hover:bg-primary/10"
              onClick={() => toggleSection('outrasDetalhes')}>
              <TableCell className="font-medium py-1 px-3 text-sm">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection('outrasDetalhes');
                    }}
                  >
                    {expandedSections.outrasDetalhes ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                  Outras Despesas
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const outras = fluxoCaixa?.outras_despesas?.total_por_ano?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                    {outras > 0 ? formatValueCompact(outras) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Detalhes de Outras Despesas */}
            {expandedSections.outrasDetalhes && (
            <>
            {/* Arrendamento */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Arrendamento</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const valor = fluxoCaixa?.outras_despesas?.arrendamento?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {valor > 0 ? formatValueCompact(valor) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Tributárias */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Tributárias</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const valor = fluxoCaixa?.outras_despesas?.tributarias?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {valor > 0 ? formatValueCompact(valor) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Pró-Labore/Divisão de Lucros */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Pró-Labore/Divisão de Lucros</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const proLabore = fluxoCaixa?.outras_despesas?.pro_labore?.[ano] || 0;
                const divisaoLucros = fluxoCaixa?.outras_despesas?.divisao_lucros?.[ano] || 0;
                const valor = proLabore + divisaoLucros;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {valor > 0 ? formatValueCompact(valor) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Outras */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Outras</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const valor = fluxoCaixa?.outras_despesas?.outras?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {valor > 0 ? formatValueCompact(valor) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>
            </>
            )}

            {/* Fluxo de Caixa da Atividade */}
            <TableRow className="bg-primary/5 font-bold">
              <TableCell className="font-medium py-1 px-3 text-sm">Fluxo Caixa da Atividade</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const fluxo = fluxoCaixa?.fluxo_atividade?.[ano] || 0;
                const isPositive = fluxo > 0;
                return (
                  <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                    {fluxo !== 0 ? formatValueCompact(fluxo) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>


            {/* === SEÇÃO DE INVESTIMENTOS === */}
            {/* Total de Investimentos */}
            <TableRow className="bg-primary/5 font-semibold cursor-pointer hover:bg-primary/10"
              onClick={() => toggleSection('investimentos')}>
              <TableCell className="font-medium py-1 px-3 text-sm">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection('investimentos');
                    }}
                  >
                    {expandedSections.investimentos ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                  Total Investimentos
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const valor = fluxoCaixa?.investimentos?.total?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                    {valor !== 0 ? formatValueCompact(valor) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Conteúdo detalhado de Investimentos */}
            {expandedSections.investimentos && (
              <>
            {/* Terras (Aquisições e Pagamentos) */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Terras</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const valor = fluxoCaixa?.investimentos?.terras?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {valor > 0 ? formatValueCompact(valor) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Maquinários */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Maquinários</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const valor = fluxoCaixa?.investimentos?.maquinarios?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {valor > 0 ? formatValueCompact(valor) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Outros */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Outros</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                const valor = fluxoCaixa?.investimentos?.outros?.[ano] || 0;
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {valor > 0 ? formatValueCompact(valor) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Vendas de Ativos (se houver) */}
            {fluxoCaixa?.investimentos?.vendas_ativos && Object.values(fluxoCaixa.investimentos.vendas_ativos).some((v: any) => v > 0) && (
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">(-) Vendas de Ativos</TableCell>
                <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
                {validAnos.map(ano => {
                  const valor = fluxoCaixa?.investimentos?.vendas_ativos?.[ano] || 0;
                  return (
                    <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                      {valor > 0 ? formatValueCompact(valor) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
              </>
            )}


            {/* === SEÇÃO DE FINANCEIRAS === */}
            {/* Total Financeiras */}
            <TableRow className="bg-primary/5 font-semibold cursor-pointer hover:bg-primary/10"
              onClick={() => toggleSection('financeiras')}>
              <TableCell className="font-medium py-1 px-3 text-sm">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection('financeiras');
                    }}
                  >
                    {expandedSections.financeiras ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                  Financeiras
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                // Usar serviço da dívida calculado dinamicamente
                const servicoDivida = debtServiceData?.servicoDivida?.[ano] || 0;
                const pagamentosBancos = calcularPagamentoBanco(ano);
                const refinanciamento = calcularRefinanciamento(ano);
                
                // Total Financeiras = - Serviço - Pagamentos + Refinanciamento
                const totalFinanceiras = -servicoDivida - pagamentosBancos + refinanciamento;
                
                // Não mostrar valor para 2021/22, 2022/23 e 2023/24
                if (ano === '2021/22' || ano === '2022/23' || ano === '2023/24') {
                  return (
                    <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                      -
                    </TableCell>
                  );
                }
                
                return (
                  <TableCell key={ano} className="text-right font-semibold py-1 px-2 text-sm">
                    {formatValueCompact(totalFinanceiras)}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Conteúdo detalhado de Financeiras */}
            {expandedSections.financeiras && (
              <>
            {/* Serviço da dívida */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Serviço da dívida</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                // Usar serviço da dívida calculado dinamicamente
                const servicoDivida = debtServiceData?.servicoDivida?.[ano] || 0;
                console.log(`Renderizando serviço da dívida para ${ano}:`, servicoDivida);
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {servicoDivida > 0 ? formatValueCompact(servicoDivida) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Outros Créditos */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Outros Créditos</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => (
                <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                  -
                </TableCell>
              ))}
            </TableRow>

            {/* Pagamentos - Bancos (com ajuste automático) */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Pagamentos - Bancos</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                // Calcular pagamento ajustado com base na necessidade de caixa
                const pagamentoBanco = calcularPagamentoBanco(ano);
                
                // Debug do valor
                if (ano === '2024/25') {
                  console.log(`Pagamento Banco para ${ano}:`, pagamentoBanco);
                  console.log(`Valor formatado:`, formatValueCompact(pagamentoBanco));
                }
                
                // Mostrar apenas a partir de 2024/25
                const mostrarValor = ano >= '2024/25';
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {mostrarValor && pagamentoBanco > 0 ? formatValueCompact(pagamentoBanco) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Pagamentos - Adto Clientes */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Pagamentos - Adto Clientes</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => (
                <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                  -
                </TableCell>
              ))}
            </TableRow>

            {/* Refinanciamentos/Novas Linhas - Bancos (com ajuste automático) */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Refinanciamentos/Novas Linhas - Bancos</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                // Calcular refinanciamento ajustado com base na necessidade de caixa
                const refinanciamento = calcularRefinanciamento(ano);
                
                return (
                  <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                    {refinanciamento > 0 ? formatValueCompact(refinanciamento) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Refinanciamentos - Adto Clientes */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Refinanciamentos - Adto Clientes</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => (
                <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                  -
                </TableCell>
              ))}
            </TableRow>

            {/* Novas Linhas Crédito */}
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium pl-6 py-1 pr-3 text-sm">Novas Linhas Crédito</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => (
                <TableCell key={ano} className="text-right py-1 px-2 text-sm">
                  -
                </TableCell>
              ))}
            </TableRow>
              </>
            )}
            

            {/* Fluxo Caixa da Atividade */}
            <TableRow className="bg-primary/5 font-bold">
              <TableCell className="font-medium py-1 px-3 text-sm">Fluxo Caixa da Atividade</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {validAnos.map(ano => {
                // Para 2021/22, 2022/23 e 2023/24, mostrar "-"
                if (ano === '2021/22' || ano === '2022/23' || ano === '2023/24') {
                  return (
                    <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                      -
                    </TableCell>
                  );
                }
                
                // Fluxo Caixa da Atividade = Fluxo da Atividade - Investimentos + Financeiras
                const fluxoAtividade = fluxoCaixa?.fluxo_atividade?.[ano] || 0;
                const investimentos = fluxoCaixa?.investimentos?.total?.[ano] || 0;
                
                // Usar serviço da dívida calculado dinamicamente
                const servicoDivida = debtServiceData?.servicoDivida?.[ano] || 0;
                const pagamentosBancos = calcularPagamentoBanco(ano);
                const refinanciamento = calcularRefinanciamento(ano);
                const totalFinanceiras = -servicoDivida - pagamentosBancos + refinanciamento;
                
                // Fluxo Caixa da Atividade = Fluxo Atividade - Investimentos + Financeiras
                const fluxoCaixaAtividade = fluxoAtividade - Math.abs(investimentos) + totalFinanceiras;
                const isPositive = fluxoCaixaAtividade > 0;
                
                return (
                  <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                    {fluxoCaixaAtividade !== 0 ? formatValueCompact(fluxoCaixaAtividade) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Fluxo Caixa da Atividade Acumulado (com ajuste automático para 10% da receita) */}
            <TableRow className="bg-primary/5 font-bold">
              <TableCell className="font-medium py-1 px-3 text-sm">Fluxo Caixa da Atividade Acumulado</TableCell>
              <TableCell className="text-muted-foreground text-xs py-1 px-2">R$</TableCell>
              {(() => {
                let acumulado = 0; // Sem valor inicial hardcoded
                return validAnos.map(ano => {
                  // Para 2021/22, 2022/23 e 2023/24, mostrar "-"
                  if (ano === '2021/22' || ano === '2022/23' || ano === '2023/24') {
                    return (
                      <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                        -
                      </TableCell>
                    );
                  }
                  
                  // Para anos posteriores, o acumulado será sempre 10% da receita (devido aos ajustes)
                  const receita = fluxoCaixa?.receitas_agricolas?.total_por_ano?.[ano] || 0;
                  const caixaMinimo = receita * (necessidadeCaixaPercent / 100);
                  
                  return (
                    <TableCell key={ano} className="text-right font-bold py-1 px-2 text-sm">
                      {caixaMinimo > 0 ? formatValueCompact(caixaMinimo) : "-"}
                    </TableCell>
                  );
                });
              })()}
            </TableRow>
          </>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeaderPrimary
          icon={<TrendingUp className="h-5 w-5" />}
          title="Carregando projeções..."
          description="Aguarde enquanto carregamos os dados"
        />
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeaderPrimary
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          title="Projeção de Resultado"
          description="Resultados realizados e projeções por cultura"
          action={
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1">
                <Label htmlFor="necessidade" className="text-sm whitespace-nowrap text-white/90">
                  Necessidade Caixa:
                </Label>
                <div className="relative w-24">
                  <Input
                    id="necessidade"
                    type="number"
                    value={necessidadeCaixaPercent}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0;
                      setNecessidadeCaixaPercent(valor);
                    }}
                    min="0"
                    max="100"
                    step="5"
                    className="pr-8 h-8 bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  />
                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowCashPolicyModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Caixa Mínimo
              </Button>
            </div>
          }
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:!bg-[#17134F]" style={{ backgroundColor: '#17134F' }}>
                  <TableHead className="text-white font-bold min-w-[200px]" style={{ backgroundColor: '#17134F' }}>
                    <div className="flex items-center justify-between">
                      <span>CONTA</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllSections(true)}
                          title="Expandir todas as seções"
                          className="h-6 px-2 text-white/80 hover:text-white hover:bg-white/20"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllSections(false)}
                          title="Recolher todas as seções"
                          className="h-6 px-2 text-white/80 hover:text-white hover:bg-white/20"
                        >
                          <EyeOff className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-bold min-w-[100px]" style={{ backgroundColor: '#17134F' }}>
                    Unidade
                  </TableHead>
                  {validAnos.map(ano => (
                    <TableHead key={ano} className="text-white font-bold text-center min-w-[120px]" style={{ backgroundColor: '#17134F' }}>
                      {ano}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Título da seção de Culturas com toggle */}
                <TableRow 
                  className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
                  onClick={() => toggleSection('culturas')}
                >
                  <TableCell colSpan={2 + validAnos.length} className="font-bold py-1 px-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSection('culturas');
                        }}
                      >
                        {expandedSections.culturas ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                      <span>CULTURAS DETALHADAS</span>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Renderizar cada cultura */}
                {expandedSections.culturas && sections.map(section => renderCultureSection(section))}
                
                {/* Renderizar consolidado */}
                {consolidado && renderConsolidado()}
                
                {/* Renderizar posição de dívida */}
                {debtPosition && renderDebtPosition()}
                
                {/* Renderizar fluxo de caixa */}
                {fluxoCaixa && renderFluxoCaixa()}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Configuração de Caixa Mínimo - Reutilizando componente existente */}
      <CashPolicyConfig
        open={showCashPolicyModal}
        onOpenChange={setShowCashPolicyModal}
        organizationId={organizationId}
      />
    </>
  );
}