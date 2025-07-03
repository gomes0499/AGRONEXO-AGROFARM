"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

import {
  formatArea,
  formatCurrency,
  formatPercentage,
} from "@/lib/utils/property-formatters";
import {
  Sprout,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Wheat,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2,
  Info,
  TrendingUpIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useCallback, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { MetricHistoryChartModal } from "./metric-history-chart-modal";
import type { MetricType } from "@/lib/actions/production-historical-stats-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useScenario } from "@/contexts/scenario-context-v2";
import { getProductionStats } from "@/lib/actions/production-stats-actions";
import { useTransition } from "react";

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
  onClick?: () => void;
  clickable?: boolean;
}

function KpiItem({
  title,
  value,
  change,
  isPositive,
  icon,
  loading,
  tooltip,
  onClick,
  clickable = false,
}: KpiItemProps) {
  return (
    <div
      className={cn(
        "flex items-start p-5 transition-colors",
        clickable && "cursor-pointer hover:bg-muted/50 active:bg-muted"
      )}
      onClick={onClick}
    >
      <div className={`rounded-full p-2 mr-3 bg-primary`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-center gap-1">
            {clickable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <TrendingUpIcon className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                  <p>Clique para ver evolução histórica</p>
                </TooltipContent>
              </Tooltip>
            )}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center mt-1">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold mt-1 dark:text-gray-100">
              {value}
            </h3>
            <p
              className={cn(
                "flex items-center text-xs font-medium mt-1",
                change === "Sem comparação"
                  ? "text-muted-foreground"
                  : isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {change === "Sem comparação" ? (
                <Info className="h-3 w-3 mr-1" />
              ) : isPositive ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              {change}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

interface SafraOption {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

interface Culture {
  id: string;
  nome: string;
}

interface ProductionKpiCardsProps {
  organizationId: string;
  propertyIds?: string[];
  safraId?: string;
  onSafraChange?: (safraId: string) => void;
  cultures: Culture[];
  selectedCultureIds?: string[];
  onCultureChange?: (cultureIds: string[]) => void;
  projectionId?: string;
  safras: SafraOption[];
  initialStats: any;
  defaultCultureIds: string[];
}

export function ProductionKPICardsClient({
  organizationId,
  propertyIds,
  safraId,
  onSafraChange,
  cultures = [],
  selectedCultureIds: propSelectedCultureIds,
  onCultureChange,
  projectionId,
  safras,
  initialStats,
  defaultCultureIds,
}: ProductionKpiCardsProps) {
  const [stats, setStats] = useState<any>(initialStats);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("area");
  // Definir safra padrão como 2025/26
  const defaultSafraId = safras?.find(s => s.nome === "2025/26")?.id || safraId || "";
  const [selectedSafraId, setSelectedSafraId] = useState<string>(defaultSafraId);
  const [isCultureDropdownOpen, setIsCultureDropdownOpen] = useState(false);
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>(
    propSelectedCultureIds || defaultCultureIds
  );
  const [isPending, startTransition] = useTransition();
  
  // Usar o contexto de cenário
  const { currentScenario, getProjectedValue } = useScenario();

  // Buscar dados quando o componente montar com a safra padrão
  useEffect(() => {
    if (defaultSafraId && defaultSafraId !== safraId) {
      startTransition(async () => {
        try {
          const result = await getProductionStats(
            organizationId,
            propertyIds,
            projectionId,
            defaultSafraId,
            selectedCultureIds.length > 0 ? selectedCultureIds : undefined
          );
          setStats(result);
        } catch (error) {
          console.error("Erro ao carregar estatísticas:", error);
        }
      });
    }
  }, []); // Executar apenas na montagem

  // Buscar dados quando o cenário (projectionId) mudar
  useEffect(() => {
    if (projectionId !== undefined) {
      startTransition(async () => {
        try {
          const result = await getProductionStats(
            organizationId,
            propertyIds,
            projectionId,
            selectedSafraId || defaultSafraId,
            selectedCultureIds.length > 0 ? selectedCultureIds : undefined
          );
          setStats(result);
        } catch (error) {
          console.error("Erro ao carregar estatísticas do cenário:", error);
        }
      });
    }
  }, [projectionId]); // Executar quando projectionId mudar

  const handleMetricClick = (metricType: MetricType) => {
    setSelectedMetric(metricType);
    setModalOpen(true);
  };

  const handleSafraChange = (value: string) => {
    setSelectedSafraId(value);
    if (onSafraChange) {
      onSafraChange(value);
    }
    
    // Buscar novos stats quando a safra mudar
    startTransition(async () => {
      try {
        const result = await getProductionStats(
          organizationId,
          propertyIds,
          projectionId,
          value,
          selectedCultureIds.length > 0 ? selectedCultureIds : undefined
        );
        setStats(result);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    });
  };

  const handleCultureToggle = (cultureId: string) => {
    if (!onCultureChange) return;

    let newSelectedCultureIds: string[];

    if (selectedCultureIds.includes(cultureId)) {
      if (selectedCultureIds.length === 1) {
        return;
      }
      newSelectedCultureIds = selectedCultureIds.filter(
        (id) => id !== cultureId
      );
    } else {
      newSelectedCultureIds = [...selectedCultureIds, cultureId];
    }

    setSelectedCultureIds(newSelectedCultureIds);
    if (onCultureChange) {
      onCultureChange(newSelectedCultureIds);
    }

    // Buscar novos stats quando as culturas mudarem
    startTransition(async () => {
      try {
        const result = await getProductionStats(
          organizationId,
          propertyIds,
          projectionId,
          selectedSafraId,
          newSelectedCultureIds.length > 0 ? newSelectedCultureIds : undefined
        );
        setStats(result);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    });
  };

  const handleSelectAllCultures = () => {
    if (!onCultureChange || !cultures) return;
    const allIds = cultures.map((c) => c.id);
    setSelectedCultureIds(allIds);
    onCultureChange(allIds);
    
    // Buscar novos stats
    startTransition(async () => {
      try {
        const result = await getProductionStats(
          organizationId,
          propertyIds,
          projectionId,
          selectedSafraId,
          allIds.length > 0 ? allIds : undefined
        );
        setStats(result);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    });
  };

  const handleDeselectAllCultures = () => {
    if (!onCultureChange || !cultures || cultures.length === 0) return;

    if (cultures.length > 0) {
      const firstCultureId = [cultures[0].id];
      setSelectedCultureIds(firstCultureId);
      onCultureChange(firstCultureId);
      
      // Buscar novos stats
      startTransition(async () => {
        try {
          const result = await getProductionStats(
            organizationId,
            propertyIds,
            projectionId,
            selectedSafraId,
            firstCultureId
          );
          setStats(result);
        } catch (error) {
          console.error("Erro ao carregar estatísticas:", error);
        }
      });
    }
  };

  const loading = isPending;

  // Default stats to show 0 values when no data is available
  const defaultStats = {
    areaPlantada: 0,
    produtividade: 0,
    produtividadeMedia: 0,
    receita: 0,
    ebitda: 0,
    margemEbitda: 0,
    crescimentoArea: 0,
    crescimentoProdutividade: 0,
    crescimentoReceita: 0,
    crescimentoEbitda: 0,
    temComparacao: false,
    safraComparada: null,
    mediaReceita: 0,
    mediaEbitda: 0,
  };

  const statsToUse = stats || defaultStats;

  return (
    <>
      <TooltipProvider>
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white/20">
                  <Wheat className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">
                    Resumo da Produção{currentScenario && " - Projeção"}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {currentScenario 
                      ? `Cenário: ${currentScenario.scenarioName}`
                      : "Indicadores consolidados de produção agrícola"}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {safras && safras.length > 0 ? (
                    <Select
                      value={selectedSafraId}
                      onValueChange={handleSafraChange}
                    >
                      <SelectTrigger className="w-full sm:w-48 h-9 bg-white/10 border-white/20 text-white focus:ring-white/30 placeholder:text-white/60">
                        <SelectValue placeholder="Selecionar safra" />
                      </SelectTrigger>
                      <SelectContent className="bg-background dark:bg-gray-800 border dark:border-gray-700">
                        {safras.map((safra) => (
                          <SelectItem key={safra.id} value={safra.id}>
                            {safra.nome} ({safra.ano_inicio}/{safra.ano_fim})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-full sm:w-48 h-9 flex items-center justify-center bg-white/10 border border-white/20 rounded-md text-white/60 text-sm">
                      Sem safras
                    </div>
                  )}

                  {cultures.length > 0 ? (
                    <Popover
                      open={isCultureDropdownOpen}
                      onOpenChange={setIsCultureDropdownOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                        >
                          <span className="mr-1">Culturas</span>
                          <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {selectedCultureIds.length}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-56 p-0 bg-background dark:bg-gray-800 border dark:border-gray-700"
                        align="end"
                      >
                        <Command className="bg-transparent">
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                onSelect={handleSelectAllCultures}
                                className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-700/50"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCultureIds.length ===
                                      cultures.length
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span>Selecionar todas</span>
                              </CommandItem>
                              <CommandItem
                                onSelect={handleDeselectAllCultures}
                                className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-700/50"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCultureIds.length === 1
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span>Desmarcar todas</span>
                              </CommandItem>
                            </CommandGroup>
                            <CommandSeparator className="dark:bg-gray-700" />
                            <CommandGroup>
                              {cultures.map((culture) => (
                                <CommandItem
                                  key={culture.id}
                                  onSelect={() =>
                                    handleCultureToggle(culture.id)
                                  }
                                  className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-700/50"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCultureIds.includes(culture.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span>{culture.nome}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="h-9 w-full sm:w-auto px-3 flex items-center justify-center bg-white/10 border border-white/20 rounded-md text-white/60 text-sm">
                      Sem culturas
                    </div>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                    <p>
                      Indicadores consolidados da produção agrícola incluindo
                      área plantada, produtividade média, receita operacional e
                      margem EBITDA.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* Loading state for all 4 KPIs */}
              <div className="relative">
                <KpiItem
                  title="Área Plantada"
                  value="0 ha"
                  change="0% YoY"
                  isPositive={true}
                  loading={true}
                  icon={<Sprout className="h-5 w-5 text-white dark:text-white" />}
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              <div className="relative">
                <KpiItem
                  title="Produtividade"
                  value="0 sc/ha"
                  change="0% YoY"
                  isPositive={true}
                  loading={true}
                  icon={<Target className="h-5 w-5 text-white dark:text-white" />}
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              <div className="relative">
                <KpiItem
                  title="Receita"
                  value="R$ 0"
                  change="0% YoY"
                  isPositive={true}
                  loading={true}
                  icon={
                    <DollarSign className="h-5 w-5 text-white dark:text-white" />
                  }
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              <div>
                <KpiItem
                  title="EBITDA"
                  value="R$ 0"
                  change="0% margem"
                  isPositive={true}
                  loading={true}
                  icon={
                    <BarChart3 className="h-5 w-5 text-white dark:text-white" />
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* Área Plantada */}
              <div className="relative">
                <KpiItem
                  title={`Área Plantada${currentScenario ? " (Projetada)" : ""}`}
                  value={formatArea(
                    currentScenario && selectedSafraId
                      ? getProjectedValue(selectedSafraId, '', '', 'area_hectares', statsToUse.areaPlantada)
                      : statsToUse.areaPlantada
                  )}
                  change={
                    statsToUse.temComparacao
                      ? `${statsToUse.crescimentoArea >= 0 ? '+' : ''}${statsToUse.crescimentoArea.toFixed(1)}% YoY`
                      : "Sem comparação"
                  }
                  isPositive={
                    currentScenario
                      ? getProjectedValue(selectedSafraId, '', '', 'area_hectares', statsToUse.areaPlantada) >= statsToUse.areaPlantada
                      : statsToUse.temComparacao ? statsToUse.crescimentoArea >= 0 : true
                  }
                  icon={<Sprout className="h-5 w-5 text-white dark:text-white" />}
                  tooltip={`Área total destinada ao plantio de culturas agrícolas em hectares.${currentScenario ? ` Cenário: ${currentScenario.scenarioName}` : ""}`}
                  clickable={true}
                  onClick={() => handleMetricClick("area")}
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* Produtividade */}
              <div className="relative">
                <KpiItem
                  title={`Produtividade${currentScenario ? " (Projetada)" : ""}`}
                  value={`${((
                    currentScenario && selectedSafraId
                      ? getProjectedValue(selectedSafraId, '', '', 'productivity', statsToUse.produtividadeMedia)
                      : statsToUse.produtividadeMedia
                  ) || 0).toFixed(1)} sc/ha`}
                  change={
                    statsToUse.temComparacao
                      ? `${statsToUse.crescimentoProdutividade >= 0 ? '+' : ''}${statsToUse.crescimentoProdutividade.toFixed(1)}% YoY`
                      : "Sem comparação"
                  }
                  isPositive={
                    currentScenario
                      ? getProjectedValue(selectedSafraId, '', '', 'productivity', statsToUse.produtividadeMedia) >= statsToUse.produtividadeMedia
                      : statsToUse.temComparacao
                      ? statsToUse.crescimentoProdutividade >= 0
                      : true
                  }
                  icon={<Target className="h-5 w-5 text-white dark:text-white" />}
                  tooltip={`Produtividade média das culturas em sacas por hectare.${currentScenario ? ` Cenário: ${currentScenario.scenarioName}` : ""}`}
                  clickable={true}
                  onClick={() => handleMetricClick("produtividade")}
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* Receita */}
              <div className="relative">
                <KpiItem
                  title={`Receita${currentScenario ? " (Projetada)" : ""}`}
                  value={formatCurrency(
                    currentScenario && selectedSafraId
                      ? getProjectedValue(selectedSafraId, '', '', 'price_per_unit', statsToUse.receita)
                      : statsToUse.receita
                  )}
                  change={
                    statsToUse.temComparacao
                      ? `${statsToUse.crescimentoReceita >= 0 ? '+' : ''}${statsToUse.crescimentoReceita.toFixed(1)}% YoY`
                      : "Sem comparação"
                  }
                  isPositive={
                    currentScenario
                      ? getProjectedValue(selectedSafraId, '', '', 'price_per_unit', statsToUse.receita) >= statsToUse.receita
                      : statsToUse.temComparacao ? statsToUse.crescimentoReceita >= 0 : true
                  }
                  icon={
                    <DollarSign className="h-5 w-5 text-white dark:text-white" />
                  }
                  tooltip={`Receita operacional bruta estimada com base na produção e preços de mercado.${currentScenario ? ` Cenário: ${currentScenario.scenarioName}` : ""}`}
                  clickable={true}
                  onClick={() => handleMetricClick("receita")}
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* EBITDA */}
              <div>
                <KpiItem
                  title={`EBITDA${currentScenario ? " (Projetado)" : ""}`}
                  value={formatCurrency(
                    currentScenario && selectedSafraId
                      ? getProjectedValue(selectedSafraId, '', '', 'production_cost_per_hectare', statsToUse.ebitda)
                      : statsToUse.ebitda
                  )}
                  change={(() => {
                    let margem = 0;
                    if (currentScenario && selectedSafraId) {
                      const receitaProjetada = getProjectedValue(selectedSafraId, '', '', 'price_per_unit', statsToUse.receita);
                      const ebitdaProjetado = getProjectedValue(selectedSafraId, '', '', 'production_cost_per_hectare', statsToUse.ebitda);
                      margem = receitaProjetada > 0 ? (ebitdaProjetado / receitaProjetada * 100) : 0;
                    } else {
                      margem = statsToUse.margemEbitda || 0;
                    }
                    return `${margem.toFixed(1)}% margem`;
                  })()}
                  isPositive={(() => {
                    if (currentScenario && selectedSafraId) {
                      const receitaProjetada = getProjectedValue(selectedSafraId, '', '', 'price_per_unit', statsToUse.receita);
                      const ebitdaProjetado = getProjectedValue(selectedSafraId, '', '', 'production_cost_per_hectare', statsToUse.ebitda);
                      return receitaProjetada > 0 ? (ebitdaProjetado / receitaProjetada * 100) > 30 : false;
                    }
                    return statsToUse.margemEbitda > 30;
                  })()}
                  icon={
                    <BarChart3 className="h-5 w-5 text-white dark:text-white" />
                  }
                  tooltip={`Resultado operacional antes de juros, impostos, depreciação e amortização.${currentScenario ? ` Cenário: ${currentScenario.scenarioName}` : ""}`}
                  clickable={true}
                  onClick={() => handleMetricClick("ebitda")}
                />
              </div>
            </div>
          )}
          </CardContent>
          
          {/* Footer com insights */}
          <CardFooter>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {currentScenario 
                  ? `Cenário ativo: ${currentScenario.scenarioName}. Os valores projetados são baseados nas configurações do cenário.`
                  : statsToUse.temComparacao 
                    ? `Comparação com ${statsToUse.safraComparada}. Crescimento geral de ${formatPercentage(statsToUse.crescimentoReceita)}.`
                    : "Adicione mais safras para habilitar comparações de crescimento ano a ano."
                }
              </p>
            </div>
          </CardFooter>
        </Card>
      </TooltipProvider>

      {/* Modal com gráfico histórico */}
      <MetricHistoryChartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        metricType={selectedMetric}
        organizationId={organizationId}
        propertyIds={propertyIds}
        cultureIds={selectedCultureIds}
        projectionId={projectionId}
      />
    </>
  );
}