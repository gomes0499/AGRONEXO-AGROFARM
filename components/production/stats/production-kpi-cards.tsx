import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProductionStats } from "@/lib/actions/production-stats-actions";
import { formatArea, formatCurrency, formatPercentage } from "@/lib/utils/property-formatters";
import { Sprout, TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Wheat, ArrowUpIcon, ArrowDownIcon, Loader2, Info, TrendingUpIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
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
  PopoverTrigger
} from "@/components/ui/popover";
import { 
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
                <TooltipContent>
                  <p>Clique para ver evolução histórica</p>
                </TooltipContent>
              </Tooltip>
            )}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
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

interface ProductionKpiCardsProps {
  organizationId: string;
  propertyIds?: string[];
  safraId?: string;
  onSafraChange?: (safraId: string) => void;
  cultures?: { id: string; nome: string }[];
  selectedCultureIds?: string[];
  onCultureChange?: (cultureIds: string[]) => void;
}

interface ProductionKpiCardsContentProps extends ProductionKpiCardsProps {}

function ProductionKpiCardsContent({ 
  organizationId, 
  propertyIds,
  safraId,
  onSafraChange,
  cultures = [],
  selectedCultureIds = [],
  onCultureChange
}: ProductionKpiCardsContentProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('area');
  const [safras, setSafras] = useState<SafraOption[]>([]);
  const [selectedSafraId, setSelectedSafraId] = useState<string>(safraId || "");
  const [loadingSafras, setLoadingSafras] = useState(true);
  const [isCultureDropdownOpen, setIsCultureDropdownOpen] = useState(false);

  const handleMetricClick = (metricType: MetricType) => {
    setSelectedMetric(metricType);
    setModalOpen(true);
  };

  const handleSafraChange = (value: string) => {
    setSelectedSafraId(value);
    if (onSafraChange) {
      onSafraChange(value);
    }
  };
  
  const handleCultureToggle = (cultureId: string) => {
    if (!onCultureChange) return;
    
    // Safety check - validate cultureId
    if (!cultureId) {
      console.warn("Attempted to toggle a culture with invalid ID");
      return;
    }
    
    let newSelectedCultureIds: string[];
    
    // Se já está selecionado, remove
    if (selectedCultureIds.includes(cultureId)) {
      // Não permitir deselecionar a última cultura
      if (selectedCultureIds.length === 1) {
        console.log("Cannot deselect the last culture");
        return;
      }
      newSelectedCultureIds = selectedCultureIds.filter(id => id !== cultureId);
    } else {
      // Adicionar à seleção
      newSelectedCultureIds = [...selectedCultureIds, cultureId];
    }
    
    // Safety check - validate we always have at least one culture selected
    if (newSelectedCultureIds.length === 0 && cultures.length > 0) {
      console.warn("Attempting to have zero cultures selected, forcing one selection");
      newSelectedCultureIds = [cultures[0].id];
    }
    
    onCultureChange(newSelectedCultureIds);
  };
  
  const handleSelectAllCultures = () => {
    if (!onCultureChange || !cultures) return;
    onCultureChange(cultures.map(c => c.id));
  };
  
  const handleDeselectAllCultures = () => {
    if (!onCultureChange || !cultures || cultures.length === 0) return;
    
    // Safety check - ensure we have at least one culture
    if (cultures.length > 0) {
      // Mantenha ao menos uma cultura selecionada (a primeira)
      onCultureChange([cultures[0].id]);
    } else {
      // Fail-safe if somehow we don't have cultures
      console.warn("No cultures available to select");
    }
  };

  // Carregar as safras disponíveis
  useEffect(() => {
    async function fetchSafras() {
      console.log("Fetching safras...");
      try {
        setLoadingSafras(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("safras")
          .select("id, nome, ano_inicio, ano_fim")
          .eq("organizacao_id", organizationId)
          .order("ano_inicio", { ascending: false });

        if (error) {
          console.error("Erro ao buscar safras:", error);
          return;
        }

        console.log("Safras fetched successfully:", data);
        setSafras(data || []);

        // Definir safra atual como padrão se não estiver definida
        if (!selectedSafraId && data && data.length > 0) {
          const currentYear = new Date().getFullYear();
          const currentSafra =
            data?.find((s) => s.ano_inicio === currentYear) || data?.[0];
          if (currentSafra) {
            console.log("Setting default safra:", currentSafra);
            setSelectedSafraId(currentSafra.id);
            if (onSafraChange) {
              onSafraChange(currentSafra.id);
            }
          }
        } else {
          console.log("Not setting default safra - selectedSafraId:", selectedSafraId);
        }
      } catch (error) {
        console.error("Erro ao buscar safras:", error);
      } finally {
        setLoadingSafras(false);
      }
    }

    if (organizationId) {
      fetchSafras();
    }
  }, [organizationId, onSafraChange]);

  const loadStats = async () => {
    try {
      console.log("Loading stats with parameters:", {
        organizationId,
        propertyIds,
        safraId: selectedSafraId || safraId,
        selectedCultureIds
      });
      
      setLoading(true);
      setError(null);
      // Usar selectedSafraId em vez de safraId para garantir que estamos usando o valor mais atualizado
      const result = await getProductionStats(
        organizationId, 
        propertyIds, 
        selectedSafraId || safraId,
        selectedCultureIds.length > 0 ? selectedCultureIds : undefined
      );
      console.log("Stats loaded successfully:", result);
      setStats(result);
    } catch (err) {
      console.error("Erro ao carregar KPIs de produção:", err);
      setError("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (organizationId && (selectedSafraId || safraId)) {
      console.log("Triggering loadStats due to dependency change");
      loadStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, 
      // Use JSON.stringify for array dependencies to avoid unnecessary rerenders
      propertyIds ? JSON.stringify(propertyIds) : null, 
      selectedSafraId, 
      safraId, 
      selectedCultureIds ? JSON.stringify(selectedCultureIds) : null]);
  
  // Debug
  React.useEffect(() => {
    console.log("ProductionKpiCardsContent - Cultures:", cultures);
    console.log("ProductionKpiCardsContent - Selected Culture IDs:", selectedCultureIds);
  }, [cultures, selectedCultureIds]);
  
  // Debug Safras
  React.useEffect(() => {
    console.log("ProductionKpiCardsContent - Safras:", safras);
    console.log("ProductionKpiCardsContent - Selected Safra ID:", selectedSafraId);
    console.log("ProductionKpiCardsContent - Safra ID from props:", safraId);
    console.log("ProductionKpiCardsContent - Loading Safras:", loadingSafras);
  }, [safras, selectedSafraId, safraId, loadingSafras]);

  if (loading || error || !stats) {
    return (
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
                    Resumo da Produção
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {loading ? "Carregando..." : error ? "Erro ao carregar" : "Indicadores consolidados de produção agrícola"}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {loadingSafras ? (
                  <div className="h-9 w-48 bg-white/10 rounded animate-pulse" />
                ) : (
                  <Select disabled={loading || loadingSafras} value="" onValueChange={() => {}}>
                    <SelectTrigger className="w-48 h-9 bg-white/10 border-white/20 text-white focus:ring-white/30 placeholder:text-white/60">
                      <SelectValue placeholder="Carregando safras..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="py-2 text-center text-sm text-muted-foreground">
                        Carregando...
                      </div>
                    </SelectContent>
                  </Select>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Indicadores consolidados da produção agrícola incluindo área plantada, 
                      produtividade média, receita operacional e margem EBITDA.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Loading state for all 4 KPIs */}
            <div className="relative">
              <KpiItem
                title="Área Plantada"
                value="0 ha"
                change="0% YoY"
                isPositive={true}
                loading={loading}
                icon={<Sprout className="h-5 w-5 text-white dark:text-gray-700" />}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            <div className="relative">
              <KpiItem
                title="Produtividade"
                value="0 sc/ha"
                change="0% YoY"
                isPositive={true}
                loading={loading}
                icon={<Target className="h-5 w-5 text-white dark:text-gray-700" />}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            <div className="relative">
              <KpiItem
                title="Receita"
                value="R$ 0"
                change="0% YoY"
                isPositive={true}
                loading={loading}
                icon={<DollarSign className="h-5 w-5 text-white dark:text-gray-700" />}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            <div>
              <KpiItem
                title="EBITDA"
                value="R$ 0"
                change="0% margem"
                isPositive={true}
                loading={loading}
                icon={<BarChart3 className="h-5 w-5 text-white dark:text-gray-700" />}
              />
            </div>
          </div>
        </Card>
      </TooltipProvider>
    );
  }

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
                    Resumo da Produção
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Indicadores consolidados de produção agrícola
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {loadingSafras ? (
                  <div className="h-9 w-48 bg-white/10 rounded animate-pulse" />
                ) : (
                  <div className="flex gap-2">
                    {safras.length > 0 ? (
                      <Select value={selectedSafraId} onValueChange={handleSafraChange}>
                        <SelectTrigger className="w-48 h-9 bg-white/10 border-white/20 text-white focus:ring-white/30 placeholder:text-white/60">
                          <SelectValue placeholder="Selecionar safra" />
                        </SelectTrigger>
                        <SelectContent>
                          {safras.map((safra) => (
                            <SelectItem key={safra.id} value={safra.id}>
                              {safra.nome} ({safra.ano_inicio}/{safra.ano_fim})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="w-48 h-9 flex items-center justify-center bg-white/10 border border-white/20 rounded-md text-white/60 text-sm">
                        Sem safras
                      </div>
                    )}
                    
                    {cultures.length > 0 ? (
                      <Popover open={isCultureDropdownOpen} onOpenChange={setIsCultureDropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                          >
                            <span className="mr-1">Culturas</span>
                            <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {selectedCultureIds.length}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-0" align="end">
                          <Command>
                            <CommandList>
                              <CommandGroup>
                                <CommandItem 
                                  onSelect={handleSelectAllCultures}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCultureIds.length === cultures.length
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span>Selecionar todas</span>
                                </CommandItem>
                                <CommandItem 
                                  onSelect={handleDeselectAllCultures}
                                  className="cursor-pointer"
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
                              <CommandSeparator />
                              <CommandGroup>
                                {cultures.map((culture) => (
                                  <CommandItem
                                    key={culture.id}
                                    onSelect={() => handleCultureToggle(culture.id)}
                                    className="cursor-pointer"
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
                      <div className="h-9 px-3 flex items-center justify-center bg-white/10 border border-white/20 rounded-md text-white/60 text-sm">
                        Sem culturas
                      </div>
                    )}
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Indicadores consolidados da produção agrícola incluindo área plantada, 
                      produtividade média, receita operacional e margem EBITDA.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Área Plantada */}
            <div className="relative">
              <KpiItem
                title="Área Plantada"
                value={formatArea(stats.areaPlantada)}
                change={
                  !stats.temComparacao 
                    ? "Sem comparação" 
                    : `${stats.crescimentoArea >= 0 ? '+' : ''}${formatPercentage(stats.crescimentoArea)} YoY${stats.safraComparada ? ` vs ${stats.safraComparada}` : ''}`
                }
                isPositive={stats.temComparacao ? stats.crescimentoArea >= 0 : true}
                icon={<Sprout className="h-5 w-5 text-white dark:text-gray-700" />}
                tooltip="Área total destinada ao plantio de culturas agrícolas em hectares."
                clickable={true}
                onClick={() => handleMetricClick('area')}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            {/* Produtividade */}
            <div className="relative">
              <KpiItem
                title="Produtividade"
                value={`${stats.produtividadeMedia.toFixed(1)} sc/ha`}
                change={
                  !stats.temComparacao 
                    ? "Sem comparação" 
                    : `${stats.crescimentoProdutividade >= 0 ? '+' : ''}${formatPercentage(stats.crescimentoProdutividade)} YoY${stats.safraComparada ? ` vs ${stats.safraComparada}` : ''}`
                }
                isPositive={stats.temComparacao ? stats.crescimentoProdutividade >= 0 : true}
                icon={<Target className="h-5 w-5 text-white dark:text-gray-700" />}
                tooltip="Produtividade média das culturas em sacas por hectare."
                clickable={true}
                onClick={() => handleMetricClick('produtividade')}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            {/* Receita */}
            <div className="relative">
              <KpiItem
                title="Receita"
                value={formatCurrency(stats.receita)}
                change={
                  !stats.temComparacao 
                    ? "Sem comparação" 
                    : `${stats.crescimentoReceita >= 0 ? '+' : ''}${formatPercentage(stats.crescimentoReceita)} YoY${stats.safraComparada ? ` vs ${stats.safraComparada}` : ''}`
                }
                isPositive={stats.temComparacao ? stats.crescimentoReceita >= 0 : true}
                icon={<DollarSign className="h-5 w-5 text-white dark:text-gray-700" />}
                tooltip="Receita operacional bruta estimada com base na produção e preços de mercado."
                clickable={true}
                onClick={() => handleMetricClick('receita')}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            {/* EBITDA */}
            <div>
              <KpiItem
                title="EBITDA"
                value={formatCurrency(stats.ebitda)}
                change={`${stats.margemEbitda.toFixed(1)}% margem`}
                isPositive={stats.margemEbitda > 30}
                icon={<BarChart3 className="h-5 w-5 text-white dark:text-gray-700" />}
                tooltip="Resultado operacional antes de juros, impostos, depreciação e amortização."
                clickable={true}
                onClick={() => handleMetricClick('ebitda')}
              />
            </div>
          </div>
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
      />
    </>
  );
}

export function ProductionKpiCards({ 
  organizationId, 
  propertyIds,
  safraId,
  onSafraChange,
  cultures,
  selectedCultureIds,
  onCultureChange
}: ProductionKpiCardsProps) {
  return (
    <ProductionKpiCardsContent 
      organizationId={organizationId} 
      propertyIds={propertyIds} 
      safraId={safraId} 
      onSafraChange={onSafraChange} 
      cultures={cultures}
      selectedCultureIds={selectedCultureIds}
      onCultureChange={onCultureChange}
    />
  );
}