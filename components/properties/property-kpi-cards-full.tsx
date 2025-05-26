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
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatArea, formatCurrency } from "@/lib/utils/property-formatters";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
}

function KpiItem({
  title,
  value,
  change,
  isPositive,
  icon,
  loading,
  tooltip,
}: KpiItemProps) {
  return (
    <div className="flex items-start p-5">
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

interface PropertyKpiCardsFullProps {
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

export function PropertyKpiCardsFull({
  organizationId,
}: PropertyKpiCardsFullProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds } =
    useDashboardFilterContext();
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [sicarData, setSicarData] = useState<SicarData | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [loadingSicar, setLoadingSicar] = useState(true);

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

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <MapIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  Resumo das Propriedades
                </CardTitle>
                <CardDescription className="text-white/80">
                  Indicadores consolidados do portfólio fundiário
                </CardDescription>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Indicadores consolidados das propriedades incluindo área
                  total, valor patrimonial, dados ambientais e de
                  sustentabilidade baseados no CAR/SICAR.
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
              icon={
                <HomeIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Número total de propriedades rurais cadastradas no sistema, incluindo fazendas próprias e arrendadas."
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
              icon={
                <MapIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Soma de todas as áreas das propriedades em hectares, representando o tamanho total do portfólio fundiário."
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
              icon={
                <BanknoteIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Valor total de mercado de todas as propriedades, base para análise de patrimônio imobiliário rural."
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
              icon={
                <SproutIcon className="h-5 w-5 text-white dark:text-gray-700" />
              }
              tooltip="Área disponível para cultivo agrícola, mostrando o potencial produtivo das propriedades."
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
    </TooltipProvider>
  );
}
