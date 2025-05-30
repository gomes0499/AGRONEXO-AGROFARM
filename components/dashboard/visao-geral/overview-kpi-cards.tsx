"use client";

import type React from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  HomeIcon,
  MapIcon,
  BanknoteIcon,
  SproutIcon,
  TreePineIcon,
  ShieldIcon,
  DropletsIcon,
  LeafIcon,
  Loader2,
  Info,
  BarChart3,
  Target,
  DollarSign,
  TrendingUp,
  Building2,
  FileText,
  TrendingDown,
  Clock,
  Home,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatArea,
  formatCurrency,
  formatPercentage,
} from "@/lib/utils/property-formatters";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";
import {
  getProductionStats,
  type ProductionStats,
} from "@/lib/actions/production-stats-actions";
import {
  getFinancialMetrics,
  type FinancialMetrics,
} from "@/lib/actions/financial-metrics-actions";
import { BrazilMapSvg } from "@/components/properties/brazil-map-svg";
import { getPropertyGeoStats } from "@/lib/actions/property-geo-stats-actions";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { AreaPlantadaChart } from "@/components/production/stats/area-plantada-chart";
import { ProdutividadeChart } from "@/components/production/stats/produtividade-chart";
import { ReceitaChart } from "@/components/production/stats/receita-chart";
import { FinancialChart } from "@/components/production/stats/financial-chart";

interface ExtendedFinancialData {
  lucroLiquido: number;
  dividaTotal: number;
  dividaPorSafra: number;
  // Indicadores de dívida
  dividaReceita: number | null;
  dividaEbitda: number | null;
  dividaLucroLiquido: number | null;
  // Indicadores de dívida líquida
  dividaLiquidaReceita: number | null;
  dividaLiquidaEbitda: number | null;
  dividaLiquidaLucroLiquido: number | null;
}

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
  clickable?: boolean;
  onClick?: () => void;
}

function KpiItem({
  title,
  value,
  change,
  isPositive,
  icon,
  loading,
  tooltip,
  clickable = false,
  onClick,
}: KpiItemProps) {
  return (
    <div
      className={cn(
        "flex items-start p-5 transition-colors",
        clickable && "cursor-pointer hover:bg-muted/50 active:bg-muted"
      )}
      onClick={clickable ? onClick : undefined}
    >
      <div className={`rounded-full p-2 mr-3 bg-primary`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
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
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {isPositive ? (
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

interface OverviewKpiCardsProps {
  organizationId: string;
}

interface PropertyData {
  totalFazendas: number;
  areaTotal: number;
  valorPatrimonial: number;
  areaCultivavel: number;
  utilizacaoPercentual: number;
  crescimentoArea: number;
  crescimentoValor: number;
}

interface SicarData {
  totalArea: number;
  totalModulosFiscais: number;
  totalReservaLegal: number;
  totalRecursosHidricos: number;
  totalAreaProtegida: number;
  percentualReservaLegal: number;
  percentualRecursosHidricos: number;
  percentualAreaProtegida: number;
}

export function OverviewKpiCards({ organizationId }: OverviewKpiCardsProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds } =
    useDashboardFilterContext();
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [sicarData, setSicarData] = useState<SicarData | null>(null);
  const [productionData, setProductionData] = useState<ProductionStats | null>(
    null
  );
  const [financialData, setFinancialData] = useState<FinancialMetrics | null>(
    null
  );
  const [extendedFinancialData, setExtendedFinancialData] =
    useState<ExtendedFinancialData | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [loadingSicar, setLoadingSicar] = useState(true);
  const [loadingProduction, setLoadingProduction] = useState(true);
  const [loadingFinancial, setLoadingFinancial] = useState(true);
  const [loadingExtendedFinancial, setLoadingExtendedFinancial] =
    useState(true);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [geoStats, setGeoStats] = useState<any>(null);
  const [loadingGeoStats, setLoadingGeoStats] = useState(false);
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [propertyValueData, setPropertyValueData] = useState<any[]>([]);
  const [loadingPropertyValue, setLoadingPropertyValue] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [propertyAreaData, setPropertyAreaData] = useState<any[]>([]);
  const [loadingPropertyArea, setLoadingPropertyArea] = useState(false);
  const [cultivableAreaModalOpen, setCultivableAreaModalOpen] = useState(false);
  const [propertyCultivableAreaData, setPropertyCultivableAreaData] = useState<
    any[]
  >([]);
  const [loadingPropertyCultivableArea, setLoadingPropertyCultivableArea] =
    useState(false);
  const [areaPlantadaModalOpen, setAreaPlantadaModalOpen] = useState(false);
  const [produtividadeModalOpen, setProdutividadeModalOpen] = useState(false);
  const [receitaModalOpen, setReceitaModalOpen] = useState(false);
  const [ebitdaModalOpen, setEbitdaModalOpen] = useState(false);

  useEffect(() => {
    async function fetchPropertyData() {
      try {
        // Aplicar filtros usando os IDs já disponíveis no contexto
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);

        // Fazer a chamada para a API com os filtros aplicados
        const url = new URL(
          `/api/properties/${organizationId}/stats`,
          window.location.origin
        );

        // Adicionar filtros se não estiver em estado "todos selecionados"
        if (filters.propertyIds.length > 0) {
          url.searchParams.set("propertyIds", filteredPropertyIds.join(","));
        }

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setPropertyData(data);
        }
      } catch (error) {
        console.error("Erro ao buscar dados de propriedades:", error);
      } finally {
        setLoadingProperty(false);
      }
    }

    fetchPropertyData();
  }, [
    organizationId,
    filters.propertyIds,
    getFilteredPropertyIds,
    allPropertyIds,
  ]);

  useEffect(() => {
    async function fetchSicarData() {
      try {
        setLoadingSicar(true);

        // Aplicar filtros usando os IDs já disponíveis no contexto
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);

        // Buscar propriedades com CAR
        const supabase = createClient();
        let query = supabase
          .from("propriedades")
          .select("numero_car, estado, area_total")
          .eq("organizacao_id", organizationId)
          .not("numero_car", "is", null);

        // Aplicar filtros se não estiver em estado "todos selecionados"
        if (filters.propertyIds.length > 0) {
          query = query.in("id", filteredPropertyIds);
        }

        const { data: properties } = await query;

        if (!properties || properties.length === 0) {
          setSicarData({
            totalArea: 0,
            totalModulosFiscais: 0,
            totalReservaLegal: 0,
            totalRecursosHidricos: 0,
            totalAreaProtegida: 0,
            percentualReservaLegal: 0,
            percentualRecursosHidricos: 0,
            percentualAreaProtegida: 0,
          });
          return;
        }

        // Buscar dados do SICAR
        const sicarPromises = properties.map(async (property) => {
          try {
            const response = await fetch(
              `/api/sicar?car=${property.numero_car}&estado=${property.estado}`
            );
            if (!response.ok) {
              return {
                area_imovel: property.area_total || 0,
                modulos_fiscais: 0,
                reserva_legal: { area: 0 },
                app: { area: 0 },
                area_protegida: { area: 0 },
              };
            }
            return await response.json();
          } catch {
            return {
              area_imovel: property.area_total || 0,
              modulos_fiscais: 0,
              reserva_legal: { area: 0 },
              app: { area: 0 },
              area_protegida: { area: 0 },
            };
          }
        });

        const sicarResults = await Promise.all(sicarPromises);

        const consolidated = sicarResults.reduce(
          (acc, result) => ({
            totalArea: acc.totalArea + (result.area_imovel || 0),
            totalModulosFiscais:
              acc.totalModulosFiscais + (result.modulos_fiscais || 0),
            totalReservaLegal:
              acc.totalReservaLegal + (result.reserva_legal?.area || 0),
            totalRecursosHidricos:
              acc.totalRecursosHidricos + (result.app?.area || 0),
            totalAreaProtegida:
              acc.totalAreaProtegida + (result.area_protegida?.area || 0),
          }),
          {
            totalArea: 0,
            totalModulosFiscais: 0,
            totalReservaLegal: 0,
            totalRecursosHidricos: 0,
            totalAreaProtegida: 0,
          }
        );

        const percentualReservaLegal =
          consolidated.totalArea > 0
            ? (consolidated.totalReservaLegal / consolidated.totalArea) * 100
            : 0;

        const percentualRecursosHidricos =
          consolidated.totalArea > 0
            ? (consolidated.totalRecursosHidricos / consolidated.totalArea) *
              100
            : 0;

        const percentualAreaProtegida =
          consolidated.totalArea > 0
            ? (consolidated.totalAreaProtegida / consolidated.totalArea) * 100
            : 0;

        setSicarData({
          ...consolidated,
          percentualReservaLegal,
          percentualRecursosHidricos,
          percentualAreaProtegida,
        });
      } catch (error) {
        console.error("Erro ao buscar dados SICAR:", error);
        setSicarData({
          totalArea: 0,
          totalModulosFiscais: 0,
          totalReservaLegal: 0,
          totalRecursosHidricos: 0,
          totalAreaProtegida: 0,
          percentualReservaLegal: 0,
          percentualRecursosHidricos: 0,
          percentualAreaProtegida: 0,
        });
      } finally {
        setLoadingSicar(false);
      }
    }

    fetchSicarData();
  }, [
    organizationId,
    filters.propertyIds,
    getFilteredPropertyIds,
    allPropertyIds,
  ]);

  useEffect(() => {
    async function fetchProductionData() {
      try {
        setLoadingProduction(true);
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);
        const stats = await getProductionStats(
          organizationId,
          filters.propertyIds.length > 0 ? filteredPropertyIds : undefined
        );
        setProductionData(stats);
      } catch (error) {
        console.error("Erro ao buscar dados de produção:", error);
      } finally {
        setLoadingProduction(false);
      }
    }

    fetchProductionData();
  }, [
    organizationId,
    filters.propertyIds,
    getFilteredPropertyIds,
    allPropertyIds,
  ]);

  useEffect(() => {
    async function fetchFinancialData() {
      try {
        setLoadingFinancial(true);
        const metrics = await getFinancialMetrics(organizationId);
        setFinancialData(metrics);
      } catch (error) {
        console.error("Erro ao buscar dados financeiros:", error);
      } finally {
        setLoadingFinancial(false);
      }
    }

    fetchFinancialData();
  }, [organizationId]);

  useEffect(() => {
    async function fetchExtendedFinancialData() {
      try {
        setLoadingExtendedFinancial(true);

        // Calcular dados estendidos baseado nos dados já obtidos
        if (!financialData || !productionData) {
          return;
        }

        // Calcular lucro líquido (50% do EBITDA)
        const lucroLiquido = productionData.ebitda * 0.5;

        // Calcular dívida total
        const dividaTotal =
          financialData.dividaBancaria.valorAtual +
          financialData.outrosPassivos.valorAtual;

        // Calcular dívida por safra (assumindo dívida dividida por número de safras anuais)
        const dividaPorSafra = dividaTotal / 2; // Assumindo 2 safras por ano

        // Calcular indicadores de dívida
        const dividaReceita =
          productionData.receita > 0
            ? dividaTotal / productionData.receita
            : null;
        const dividaEbitda =
          productionData.ebitda > 0
            ? dividaTotal / productionData.ebitda
            : null;
        const dividaLucroLiquido =
          lucroLiquido > 0 ? dividaTotal / lucroLiquido : null;

        // Calcular indicadores de dívida líquida
        const dividaLiquidaValue = financialData.dividaLiquida.valorAtual;
        const dividaLiquidaReceita =
          productionData.receita > 0
            ? dividaLiquidaValue / productionData.receita
            : null;
        const dividaLiquidaEbitda =
          productionData.ebitda > 0
            ? dividaLiquidaValue / productionData.ebitda
            : null;
        const dividaLiquidaLucroLiquido =
          lucroLiquido > 0 ? dividaLiquidaValue / lucroLiquido : null;

        setExtendedFinancialData({
          lucroLiquido,
          dividaTotal,
          dividaPorSafra,
          dividaReceita,
          dividaEbitda,
          dividaLucroLiquido,
          dividaLiquidaReceita,
          dividaLiquidaEbitda,
          dividaLiquidaLucroLiquido,
        });
      } catch (error) {
        console.error("Erro ao calcular dados financeiros estendidos:", error);
      } finally {
        setLoadingExtendedFinancial(false);
      }
    }

    fetchExtendedFinancialData();
  }, [financialData, productionData]);

  const handleMapModalOpen = async () => {
    setMapModalOpen(true);

    if (!geoStats) {
      try {
        setLoadingGeoStats(true);
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);
        const propertyIdsForFilter =
          filters.propertyIds.length > 0 ? filteredPropertyIds : undefined;
        const stats = await getPropertyGeoStats(
          organizationId,
          propertyIdsForFilter
        );
        setGeoStats(stats);
      } catch (error) {
        console.error("Erro ao carregar dados geográficos:", error);
      } finally {
        setLoadingGeoStats(false);
      }
    }
  };

  const handleValueModalOpen = async () => {
    setValueModalOpen(true);

    if (propertyValueData.length === 0) {
      try {
        setLoadingPropertyValue(true);
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);

        const supabase = createClient();
        let query = supabase
          .from("propriedades")
          .select("id, nome, valor_atual")
          .eq("organizacao_id", organizationId)
          .not("valor_atual", "is", null)
          .order("valor_atual", { ascending: false });

        if (filters.propertyIds.length > 0) {
          query = query.in("id", filteredPropertyIds);
        }

        const { data } = await query;

        if (data) {
          const chartData = data.map((property) => ({
            nome:
              property.nome.length > 15
                ? property.nome.substring(0, 15) + "..."
                : property.nome,
            nomeCompleto: property.nome,
            valor: property.valor_atual,
            valorFormatado: formatCurrency(property.valor_atual),
          }));
          setPropertyValueData(chartData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados de valor:", error);
      } finally {
        setLoadingPropertyValue(false);
      }
    }
  };

  const handleAreaModalOpen = async () => {
    setAreaModalOpen(true);

    if (propertyAreaData.length === 0) {
      try {
        setLoadingPropertyArea(true);
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);

        const supabase = createClient();
        let query = supabase
          .from("propriedades")
          .select("id, nome, area_total")
          .eq("organizacao_id", organizationId)
          .not("area_total", "is", null)
          .order("area_total", { ascending: false });

        if (filters.propertyIds.length > 0) {
          query = query.in("id", filteredPropertyIds);
        }

        const { data } = await query;

        if (data) {
          const chartData = data.map((property) => ({
            nome:
              property.nome.length > 15
                ? property.nome.substring(0, 15) + "..."
                : property.nome,
            nomeCompleto: property.nome,
            area: property.area_total,
            areaFormatada: formatArea(property.area_total),
          }));
          setPropertyAreaData(chartData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados de área:", error);
      } finally {
        setLoadingPropertyArea(false);
      }
    }
  };

  const handleCultivableAreaModalOpen = async () => {
    setCultivableAreaModalOpen(true);

    if (propertyCultivableAreaData.length === 0) {
      try {
        setLoadingPropertyCultivableArea(true);
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);

        const supabase = createClient();
        let query = supabase
          .from("propriedades")
          .select("id, nome, area_cultivada")
          .eq("organizacao_id", organizationId)
          .not("area_cultivada", "is", null)
          .order("area_cultivada", { ascending: false });

        if (filters.propertyIds.length > 0) {
          query = query.in("id", filteredPropertyIds);
        }

        const { data } = await query;

        if (data) {
          const chartData = data.map((property) => ({
            nome:
              property.nome.length > 15
                ? property.nome.substring(0, 15) + "..."
                : property.nome,
            nomeCompleto: property.nome,
            area: property.area_cultivada,
            areaFormatada: formatArea(property.area_cultivada),
          }));
          setPropertyCultivableAreaData(chartData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados de área cultivável:", error);
      } finally {
        setLoadingPropertyCultivableArea(false);
      }
    }
  };

  const handleAreaPlantadaModalOpen = () => {
    setAreaPlantadaModalOpen(true);
  };

  const handleProdutividadeModalOpen = () => {
    setProdutividadeModalOpen(true);
  };

  const handleReceitaModalOpen = () => {
    setReceitaModalOpen(true);
  };

  const handleEbitdaModalOpen = () => {
    setEbitdaModalOpen(true);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  Resumo Executivo
                </CardTitle>
                <CardDescription className="text-white/80">
                  Indicadores consolidados de propriedades, produção e finanças
                </CardDescription>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Indicadores consolidados incluindo propriedades, dados
                  ambientais baseados no CAR/SICAR, métricas de produção e
                  posição financeira.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Fazendas */}
          <div className="relative">
            <KpiItem
              title="Total Fazendas"
              value={propertyData ? `${propertyData.totalFazendas}` : "0"}
              change="propriedades"
              isPositive={true}
              loading={loadingProperty}
              clickable={true}
              onClick={handleMapModalOpen}
              icon={
                <HomeIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Número total de propriedades rurais cadastradas no sistema. Clique para ver localização no mapa do Brasil."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Área Total */}
          <div className="relative">
            <KpiItem
              title="Área Total"
              value={propertyData ? formatArea(propertyData.areaTotal) : "0 ha"}
              change="hectares"
              isPositive={true}
              loading={loadingProperty}
              clickable={true}
              onClick={handleAreaModalOpen}
              icon={
                <MapIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Soma de todas as áreas das propriedades em hectares, representando o tamanho total do portfólio fundiário. Clique para ver ranking por propriedade."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Valor Patrimonial */}
          <div className="relative">
            <KpiItem
              title="Valor Patrimonial"
              value={
                propertyData
                  ? formatCurrency(propertyData.valorPatrimonial)
                  : "R$ 0"
              }
              change="patrimônio"
              isPositive={true}
              loading={loadingProperty}
              clickable={true}
              onClick={handleValueModalOpen}
              icon={
                <BanknoteIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Valor total de mercado de todas as propriedades, base para análise de patrimônio imobiliário rural. Clique para ver ranking por propriedade."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Área Cultivável */}
          <div>
            <KpiItem
              title="Área Cultivável"
              value={
                propertyData ? formatArea(propertyData.areaCultivavel) : "0 ha"
              }
              change={
                propertyData
                  ? `${propertyData.utilizacaoPercentual.toFixed(1)}% util.`
                  : "0% util."
              }
              isPositive={true}
              loading={loadingProperty}
              clickable={true}
              onClick={handleCultivableAreaModalOpen}
              icon={
                <SproutIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Área disponível para cultivo agrícola, mostrando o potencial produtivo das propriedades. Clique para ver ranking por propriedade."
            />
          </div>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Área Plantada */}
          <div className="relative">
            <KpiItem
              title="Área Plantada"
              value={
                productionData
                  ? formatArea(productionData.areaPlantada)
                  : "0 ha"
              }
              change={
                !productionData?.temComparacao
                  ? "Sem comparação"
                  : `${
                      productionData.crescimentoArea >= 0 ? "+" : ""
                    }${formatPercentage(productionData.crescimentoArea)} YoY${
                      productionData.safraComparada
                        ? ` vs ${productionData.safraComparada}`
                        : ""
                    }`
              }
              isPositive={
                productionData?.temComparacao
                  ? productionData.crescimentoArea >= 0
                  : true
              }
              loading={loadingProduction}
              clickable={true}
              onClick={handleAreaPlantadaModalOpen}
              icon={
                <SproutIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Área total destinada ao plantio de culturas agrícolas em hectares. Clique para ver evolução por cultura."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Produtividade */}
          <div className="relative">
            <KpiItem
              title="Produtividade"
              value={
                productionData
                  ? `${productionData.produtividadeMedia.toFixed(1)} sc/ha`
                  : "0 sc/ha"
              }
              change={
                !productionData?.temComparacao
                  ? "Sem comparação"
                  : `${
                      productionData.crescimentoProdutividade >= 0 ? "+" : ""
                    }${formatPercentage(
                      productionData.crescimentoProdutividade
                    )} YoY${
                      productionData.safraComparada
                        ? ` vs ${productionData.safraComparada}`
                        : ""
                    }`
              }
              isPositive={
                productionData?.temComparacao
                  ? productionData.crescimentoProdutividade >= 0
                  : true
              }
              loading={loadingProduction}
              clickable={true}
              onClick={handleProdutividadeModalOpen}
              icon={
                <Target className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Produtividade média das culturas em sacas por hectare. Clique para ver evolução por cultura."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Receita */}
          <div className="relative">
            <KpiItem
              title="Receita"
              value={
                productionData ? formatCurrency(productionData.receita) : "R$ 0"
              }
              change={
                !productionData?.temComparacao
                  ? "Sem comparação"
                  : `${
                      productionData.crescimentoReceita >= 0 ? "+" : ""
                    }${formatPercentage(
                      productionData.crescimentoReceita
                    )} YoY${
                      productionData.safraComparada
                        ? ` vs ${productionData.safraComparada}`
                        : ""
                    }`
              }
              isPositive={
                productionData?.temComparacao
                  ? productionData.crescimentoReceita >= 0
                  : true
              }
              loading={loadingProduction}
              clickable={true}
              onClick={handleReceitaModalOpen}
              icon={
                <DollarSign className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Receita operacional bruta estimada com base na produção e preços de mercado. Clique para ver evolução por cultura."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* EBITDA */}
          <div>
            <KpiItem
              title="EBITDA"
              value={
                productionData ? formatCurrency(productionData.ebitda) : "R$ 0"
              }
              change={
                productionData
                  ? `${productionData.margemEbitda.toFixed(1)}% margem`
                  : "0% margem"
              }
              isPositive={
                productionData ? productionData.margemEbitda > 30 : true
              }
              loading={loadingProduction}
              clickable={true}
              onClick={handleEbitdaModalOpen}
              icon={
                <TrendingUp className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Resultado operacional antes de juros, impostos, depreciação e amortização. Clique para ver evolução financeira."
            />
          </div>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Dívida Bancária */}
          <div className="relative">
            <KpiItem
              title="Dívida Bancária"
              value={
                financialData
                  ? formatCurrency(financialData.dividaBancaria.valorAtual)
                  : "R$ 0"
              }
              change={
                financialData
                  ? `${
                      financialData.dividaBancaria.percentualMudanca > 0
                        ? "+"
                        : ""
                    }${financialData.dividaBancaria.percentualMudanca.toFixed(
                      1
                    )}% YoY`
                  : "0% YoY"
              }
              isPositive={
                financialData
                  ? financialData.dividaBancaria.percentualMudanca < 0
                  : true
              }
              loading={loadingFinancial}
              icon={
                <Building2 className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Total das dívidas bancárias ativas. Redução é considerada positiva."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Outros Passivos */}
          <div className="relative">
            <KpiItem
              title="Outros Passivos"
              value={
                financialData
                  ? formatCurrency(financialData.outrosPassivos.valorAtual)
                  : "R$ 0"
              }
              change={
                financialData
                  ? `${
                      financialData.outrosPassivos.percentualMudanca > 0
                        ? "+"
                        : ""
                    }${financialData.outrosPassivos.percentualMudanca.toFixed(
                      1
                    )}% YoY`
                  : "0% YoY"
              }
              isPositive={
                financialData
                  ? financialData.outrosPassivos.percentualMudanca < 0
                  : true
              }
              loading={loadingFinancial}
              icon={
                <FileText className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Soma de dívidas de trading, imóveis, fornecedores e adiantamentos. Redução é considerada positiva."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida Líquida */}
          <div className="relative">
            <KpiItem
              title="Dívida Líquida"
              value={
                financialData
                  ? formatCurrency(financialData.dividaLiquida.valorAtual)
                  : "R$ 0"
              }
              change={
                financialData
                  ? `${
                      financialData.dividaLiquida.percentualMudanca > 0
                        ? "+"
                        : ""
                    }${financialData.dividaLiquida.percentualMudanca.toFixed(
                      1
                    )}% YoY`
                  : "0% YoY"
              }
              isPositive={
                financialData
                  ? financialData.dividaLiquida.percentualMudanca < 0
                  : true
              }
              loading={loadingFinancial}
              icon={
                <TrendingDown className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Dívida total menos ativos líquidos (caixa, recebíveis, estoques). Redução é considerada positiva."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Prazo Médio */}
          <div>
            <KpiItem
              title="Prazo Médio"
              value={
                financialData
                  ? `${financialData.prazoMedio.valorAtual.toFixed(1)} anos`
                  : "0 anos"
              }
              change={
                financialData
                  ? `vs ${financialData.prazoMedio.valorAnterior.toFixed(
                      1
                    )} anos ant.`
                  : "vs 0 anos ant."
              }
              isPositive={true}
              loading={loadingFinancial}
              icon={<Clock className="h-5 w-5 text-white dark:text-gray-700" />}
              tooltip="Prazo médio de vencimento das dívidas em anos."
            />
          </div>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Lucro Líquido */}
          <div className="relative">
            <KpiItem
              title="Lucro Líquido"
              value={
                extendedFinancialData
                  ? formatCurrency(extendedFinancialData.lucroLiquido)
                  : "R$ 0"
              }
              change="50% do EBITDA"
              isPositive={
                extendedFinancialData
                  ? extendedFinancialData.lucroLiquido > 0
                  : true
              }
              loading={loadingExtendedFinancial}
              icon={
                <TrendingUp className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Lucro líquido estimado como 50% do EBITDA operacional."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida Total */}
          <div className="relative">
            <KpiItem
              title="Dívida Total"
              value={
                extendedFinancialData
                  ? formatCurrency(extendedFinancialData.dividaTotal)
                  : "R$ 0"
              }
              change="bancária + outros passivos"
              isPositive={
                extendedFinancialData
                  ? extendedFinancialData.dividaTotal <
                    extendedFinancialData.dividaTotal * 1.1
                  : true
              }
              loading={loadingExtendedFinancial}
              icon={
                <Building2 className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Soma total das dívidas bancárias + outros passivos (trading, imóveis, fornecedores, adiantamentos)."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida/Receita */}
          <div className="relative">
            <KpiItem
              title="Dívida/Receita"
              value={
                extendedFinancialData?.dividaReceita
                  ? `${extendedFinancialData.dividaReceita.toFixed(2)}x`
                  : "0x"
              }
              change="índice"
              isPositive={
                extendedFinancialData
                  ? (extendedFinancialData.dividaReceita || 0) < 2.0
                  : true
              }
              loading={loadingExtendedFinancial}
              icon={
                <DollarSign className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Indicador de endividamento: dívida total dividida pela receita. Ideal < 2.0x."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida/EBITDA */}
          <div>
            <KpiItem
              title="Dívida/EBITDA"
              value={
                extendedFinancialData?.dividaEbitda
                  ? `${extendedFinancialData.dividaEbitda.toFixed(2)}x`
                  : "0x"
              }
              change="índice"
              isPositive={
                extendedFinancialData
                  ? (extendedFinancialData.dividaEbitda || 0) < 3.5
                  : true
              }
              loading={loadingExtendedFinancial}
              icon={
                <BarChart3 className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Indicador de endividamento: dívida total dividida pelo EBITDA. Ideal < 3.5x."
            />
          </div>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Dívida por Safra */}
          <div className="relative">
            <KpiItem
              title="Dívida por Safra"
              value={
                extendedFinancialData
                  ? formatCurrency(extendedFinancialData.dividaPorSafra)
                  : "R$ 0"
              }
              change="por safra"
              isPositive={true}
              loading={loadingExtendedFinancial}
              icon={<Clock className="h-5 w-5 text-white dark:text-gray-700" />}
              tooltip="Dívida total dividida pelo número de safras anuais (assumindo 2 safras/ano)."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida/Lucro Líquido */}
          <div className="relative">
            <KpiItem
              title="Dívida/Lucro Líquido"
              value={
                extendedFinancialData?.dividaLucroLiquido
                  ? `${extendedFinancialData.dividaLucroLiquido.toFixed(2)}x`
                  : "0x"
              }
              change="índice"
              isPositive={
                extendedFinancialData
                  ? (extendedFinancialData.dividaLucroLiquido || 0) < 7.0
                  : true
              }
              loading={loadingExtendedFinancial}
              icon={
                <TrendingUp className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Indicador de endividamento: dívida total dividida pelo lucro líquido. Ideal < 7.0x."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dív. Líq./Receita */}
          <div className="relative">
            <KpiItem
              title="Dív. Líq./Receita"
              value={
                extendedFinancialData?.dividaLiquidaReceita
                  ? `${extendedFinancialData.dividaLiquidaReceita.toFixed(2)}x`
                  : "0x"
              }
              change="índice"
              isPositive={
                extendedFinancialData
                  ? (extendedFinancialData.dividaLiquidaReceita || 0) < 1.5
                  : true
              }
              loading={loadingExtendedFinancial}
              icon={
                <DollarSign className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Indicador de endividamento: dívida líquida dividida pela receita. Ideal < 1.5x."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dív. Líq./EBITDA */}
          <div className="relative">
            <KpiItem
              title="Dív. Líq./EBITDA"
              value={
                extendedFinancialData?.dividaLiquidaEbitda
                  ? `${extendedFinancialData.dividaLiquidaEbitda.toFixed(2)}x`
                  : "0x"
              }
              change="índice"
              isPositive={
                extendedFinancialData
                  ? (extendedFinancialData.dividaLiquidaEbitda || 0) < 2.5
                  : true
              }
              loading={loadingExtendedFinancial}
              icon={
                <BarChart3 className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Indicador de endividamento: dívida líquida dividida pelo EBITDA. Ideal < 2.5x."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dív. Líq./Lucro Líq. */}
          <div>
            <KpiItem
              title="Dív. Líq./Lucro Líq."
              value={
                extendedFinancialData?.dividaLiquidaLucroLiquido
                  ? `${extendedFinancialData.dividaLiquidaLucroLiquido.toFixed(
                      2
                    )}x`
                  : "0x"
              }
              change="índice"
              isPositive={
                extendedFinancialData
                  ? (extendedFinancialData.dividaLiquidaLucroLiquido || 0) < 5.0
                  : true
              }
              loading={loadingExtendedFinancial}
              icon={
                <TrendingDown className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Indicador de endividamento: dívida líquida dividida pelo lucro líquido. Ideal < 5.0x."
            />
          </div>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Reserva Legal */}
          <div className="relative">
            <KpiItem
              title="Reserva Legal"
              value={
                sicarData ? formatArea(sicarData.totalReservaLegal) : "0 ha"
              }
              change={
                sicarData
                  ? `${sicarData.percentualReservaLegal.toFixed(
                      2
                    )}% da área total`
                  : "0% da área total"
              }
              isPositive={true}
              loading={loadingSicar}
              icon={
                <ShieldIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Área de Reserva Legal obrigatória por lei para conservação da biodiversidade e uso sustentável dos recursos naturais."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Recursos Hídricos */}
          <div className="relative">
            <KpiItem
              title="Recursos Hídricos"
              value={
                sicarData ? formatArea(sicarData.totalRecursosHidricos) : "0 ha"
              }
              change={
                sicarData
                  ? `${sicarData.percentualRecursosHidricos.toFixed(
                      2
                    )}% da área total`
                  : "0% da área total"
              }
              isPositive={true}
              loading={loadingSicar}
              icon={
                <DropletsIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Área de Preservação Permanente em recursos hídricos, fundamental para proteção de nascentes, rios e mananciais."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Área Protegida Total */}
          <div className="relative">
            <KpiItem
              title="Área Protegida Total"
              value={
                sicarData ? formatArea(sicarData.totalAreaProtegida) : "0 ha"
              }
              change={
                sicarData
                  ? `${sicarData.percentualAreaProtegida.toFixed(
                      2
                    )}% da área total`
                  : "0% da área total"
              }
              isPositive={true}
              loading={loadingSicar}
              icon={
                <LeafIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Soma total de todas as áreas destinadas à conservação ambiental, incluindo Reserva Legal e APPs."
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Vegetação Nativa Remanescente */}
          <div>
            <KpiItem
              title="Vegetação Nativa Remanescente"
              value={
                sicarData ? formatArea(sicarData.totalAreaProtegida) : "0 ha"
              }
              change="área preservada"
              isPositive={true}
              loading={loadingSicar}
              icon={
                <TreePineIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Área de vegetação nativa ainda preservada nas propriedades, indicador de sustentabilidade ambiental."
            />
          </div>
        </div>
      </Card>

      {/* Modal com Mapa do Brasil */}
      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent className="sm:max-w-[1200px]  overflow-y-auto">
          <DialogHeader className="pb-2 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Mapa do Brasil
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Visualização geográfica das propriedades
            </p>
          </DialogHeader>

          {loadingGeoStats ? (
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-32 bg-muted rounded animate-pulse" />
            </div>
          ) : !geoStats ||
            !geoStats.estadosData ||
            geoStats.estadosData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhuma propriedade cadastrada
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mapa do Brasil */}
              <Card>
                <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full p-2 bg-white/20">
                        <MapIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          Mapa do Brasil
                        </CardTitle>
                        <CardDescription className="text-white/80">
                          Visualização geográfica das propriedades
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <div>
                  <div className="space-y-4">
                    {/* Lista de estados com indicadores */}
                    <div className="space-y-2">
                      {geoStats.estadosData
                        .slice(0, 5)
                        .map((estado: any, index: number) => (
                          <div
                            key={estado.estado}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: estado.color }}
                              />
                              <span className="font-medium text-sm">
                                {estado.estado}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {estado.totalPropriedades}{" "}
                                {estado.totalPropriedades === 1
                                  ? "propriedade"
                                  : "propriedades"}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {estado.percentualArea.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                    </div>

                    {/* Mapa SVG do Brasil */}
                    <div className="mt-6">
                      <BrazilMapSvg estadosData={geoStats.estadosData} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Breakdown por Estado */}
              <Card>
                <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full p-2 bg-white/20">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          Resumo por Estado
                        </CardTitle>
                        <CardDescription className="text-white/80">
                          Análise detalhada por estado
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <div className=" p-4">
                  <div className="space-y-6">
                    {geoStats.estadosData.map((estado: any) => (
                      <div key={estado.estado} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm uppercase tracking-wide">
                            {estado.nomeEstado}
                          </h4>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: estado.color }}
                          />
                        </div>

                        <div className="pl-4 space-y-1 border-l-2 border-muted">
                          {/* Área */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              ├─ {formatArea(estado.areaTotal)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {estado.percentualArea.toFixed(1)}%
                            </Badge>
                          </div>

                          {/* Valor */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              ├─ {formatCurrency(estado.valorTotal)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {estado.percentualValor.toFixed(1)}%
                            </Badge>
                          </div>

                          {/* Tipo de propriedades */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">└─</span>
                              {estado.propriedadesProprias > 0 && (
                                <div className="flex items-center gap-1">
                                  <Home className="h-3 w-3 text-green-600" />
                                  <span className="text-xs">
                                    {estado.propriedadesProprias}{" "}
                                    {estado.propriedadesProprias === 1
                                      ? "própria"
                                      : "próprias"}
                                  </span>
                                </div>
                              )}
                              {estado.propriedadesArrendadas > 0 && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs">
                                    {estado.propriedadesArrendadas}{" "}
                                    {estado.propriedadesArrendadas === 1
                                      ? "arrendada"
                                      : "arrendadas"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Resumo total */}
                    {geoStats.estadosData.length > 0 && geoStats.totalGeral && (
                      <div className="pt-4 border-t">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>
                            Total: {geoStats.totalGeral.propriedades}{" "}
                            propriedades
                          </div>
                          <div>
                            Área: {formatArea(geoStats.totalGeral.area)}
                          </div>
                          <div>
                            Valor: {formatCurrency(geoStats.totalGeral.valor)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal com Gráfico de Valor por Propriedade */}
      <Dialog open={valueModalOpen} onOpenChange={setValueModalOpen}>
        <DialogContent className="sm:max-w-[1000px] sm:max-h-[95vh] h-[700px] overflow-y-auto">
          <DialogHeader className="pb-2 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <BanknoteIcon className="h-5 w-5" />
              Valor por Propriedade
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Ranking patrimonial das propriedades
            </p>
          </DialogHeader>

          {loadingPropertyValue ? (
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          ) : propertyValueData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhuma propriedade com valor cadastrado
            </div>
          ) : (
            <Card>
              <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-white/20">
                      <BanknoteIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        Ranking Patrimonial
                      </CardTitle>
                      <CardDescription className="text-white/80">
                        Valor de mercado por propriedade
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="p-6">
                <ChartContainer
                  config={{
                    valor: {
                      label: "Valor",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[400px] w-full"
                >
                  <BarChart
                    data={propertyValueData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 80,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="nome"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold text-sm">
                                {data.nomeCompleto}
                              </p>
                              <p className="text-primary font-bold">
                                {data.valorFormatado}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="valor"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>

                {/* Resumo */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">
                        Resumo Patrimonial
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {propertyValueData.length}{" "}
                        {propertyValueData.length === 1
                          ? "propriedade"
                          : "propriedades"}{" "}
                        com valor cadastrado
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatCurrency(
                          propertyValueData.reduce((acc, p) => acc + p.valor, 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Valor Total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal com Gráfico de Área por Propriedade */}
      <Dialog open={areaModalOpen} onOpenChange={setAreaModalOpen}>
        <DialogContent className="sm:max-w-[1000px] sm:max-h-[95vh] h-[700px] overflow-y-auto">
          <DialogHeader className="pb-2 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Área por Propriedade
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Ranking de área das propriedades em hectares
            </p>
          </DialogHeader>

          {loadingPropertyArea ? (
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          ) : propertyAreaData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhuma propriedade com área cadastrada
            </div>
          ) : (
            <Card>
              <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-white/20">
                      <MapIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        Ranking por Área
                      </CardTitle>
                      <CardDescription className="text-white/80">
                        Extensão territorial por propriedade
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="p-6">
                <ChartContainer
                  config={{
                    area: {
                      label: "Área",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[400px] w-full"
                >
                  <BarChart
                    data={propertyAreaData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 80,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="nome"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold text-sm">
                                {data.nomeCompleto}
                              </p>
                              <p className="text-primary font-bold">
                                {data.areaFormatada}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="area"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>

                {/* Resumo */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Resumo de Área</h4>
                      <p className="text-xs text-muted-foreground">
                        {propertyAreaData.length}{" "}
                        {propertyAreaData.length === 1
                          ? "propriedade"
                          : "propriedades"}{" "}
                        com área cadastrada
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatArea(
                          propertyAreaData.reduce((acc, p) => acc + p.area, 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Área Total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal com Gráfico de Área Cultivável por Propriedade */}
      <Dialog
        open={cultivableAreaModalOpen}
        onOpenChange={setCultivableAreaModalOpen}
      >
        <DialogContent className="sm:max-w-[1000px] sm:max-h-[95vh] h-[700px] overflow-y-auto">
          <DialogHeader className="pb-2 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <SproutIcon className="h-5 w-5" />
              Área Cultivável por Propriedade
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Ranking de área cultivável das propriedades em hectares
            </p>
          </DialogHeader>

          {loadingPropertyCultivableArea ? (
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          ) : propertyCultivableAreaData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhuma propriedade com área cultivável cadastrada
            </div>
          ) : (
            <Card>
              <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-white/20">
                      <SproutIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        Ranking por Área Cultivável
                      </CardTitle>
                      <CardDescription className="text-white/80">
                        Potencial produtivo por propriedade
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="p-6">
                <ChartContainer
                  config={{
                    area: {
                      label: "Área Cultivável",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[400px] w-full"
                >
                  <BarChart
                    data={propertyCultivableAreaData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 80,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="nome"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold text-sm">
                                {data.nomeCompleto}
                              </p>
                              <p className="text-primary font-bold">
                                {data.areaFormatada}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="area"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>

                {/* Resumo */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">
                        Resumo de Área Cultivável
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {propertyCultivableAreaData.length}{" "}
                        {propertyCultivableAreaData.length === 1
                          ? "propriedade"
                          : "propriedades"}{" "}
                        com área cultivável cadastrada
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatArea(
                          propertyCultivableAreaData.reduce(
                            (acc, p) => acc + p.area,
                            0
                          )
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Área Cultivável Total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal com Gráfico de Evolução da Área Plantada por Cultura */}
      <Dialog
        open={areaPlantadaModalOpen}
        onOpenChange={setAreaPlantadaModalOpen}
      >
        <DialogContent className="sm:max-w-[1200px] ">
          <DialogHeader className="pb-2 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <SproutIcon className="h-5 w-5" />
              Evolução da Área Plantada por Cultura
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Área plantada por cultura em hectares (2021/22 - 2029/30)
            </p>
          </DialogHeader>

          <AreaPlantadaChart
            organizationId={organizationId}
            propertyIds={
              filters.propertyIds.length > 0
                ? getFilteredPropertyIds(allPropertyIds)
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      {/* Modal com Gráfico de Evolução da Produtividade por Cultura */}
      <Dialog
        open={produtividadeModalOpen}
        onOpenChange={setProdutividadeModalOpen}
      >
        <DialogContent className="sm:max-w-[1200px] ">
          <DialogHeader className="pb-2 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Evolução da Produtividade por Cultura
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Produtividade média por cultura (2021/22 - 2029/30)
            </p>
          </DialogHeader>

          <ProdutividadeChart
            organizationId={organizationId}
            propertyIds={
              filters.propertyIds.length > 0
                ? getFilteredPropertyIds(allPropertyIds)
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      {/* Modal com Gráfico de Evolução da Receita Projetada por Cultura */}
      <Dialog
        open={receitaModalOpen}
        onOpenChange={setReceitaModalOpen}
      >
        <DialogContent className="sm:max-w-[1200px] ">
          <DialogHeader className="pb-2 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Evolução da Receita Projetada por Cultura
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Receita projetada por cultura em reais (2021/22 - 2029/30)
            </p>
          </DialogHeader>

          <ReceitaChart
            organizationId={organizationId}
            propertyIds={
              filters.propertyIds.length > 0
                ? getFilteredPropertyIds(allPropertyIds)
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      {/* Modal com Gráfico de Evolução Financeira */}
      <Dialog
        open={ebitdaModalOpen}
        onOpenChange={setEbitdaModalOpen}
      >
        <DialogContent className="sm:max-w-[1200px] ">
          <DialogHeader className="pb-2 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Financeira
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Receita, Custo, EBITDA e Lucro Líquido por safra (2021/22 - 2029/30)
            </p>
          </DialogHeader>

          <FinancialChart
            organizationId={organizationId}
            propertyIds={
              filters.propertyIds.length > 0
                ? getFilteredPropertyIds(allPropertyIds)
                : undefined
            }
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
