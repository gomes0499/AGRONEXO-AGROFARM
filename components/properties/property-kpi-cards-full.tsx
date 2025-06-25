"use client";

import type React from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  HomeIcon,
  MapIcon,
  BanknoteIcon,
  SproutIcon,
  Loader2,
  Info,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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
              <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
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
                "text-xs mt-1 text-muted-foreground leading-snug",
                change.includes('·') ? "text-[9px] sm:text-xs" : "text-xs"
              )}
            >
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
  propriedadesProprias: number;
  propriedadesArrendadas: number;
  areaPropriedadesProprias: number;
  areaPropriedadesArrendadas: number;
}

interface PropertyOption {
  id: string;
  nome: string;
}

interface PropertySelectorProps {
  properties: PropertyOption[];
  selectedPropertyIds: string[];
  onChange: (ids: string[]) => void;
}

function PropertySelector({ properties, selectedPropertyIds, onChange }: PropertySelectorProps) {
  const [open, setOpen] = useState(false);
  
  const handleSelectAll = () => {
    onChange([]);
  };
  
  const handleDeselectAll = () => {
    // Select just the first property to avoid empty selection
    if (properties.length > 0) {
      onChange([properties[0].id]);
    }
  };
  
  const handleToggle = (propertyId: string) => {
    let newSelectedIds: string[];
    
    if (selectedPropertyIds.includes(propertyId)) {
      // Prevent deselecting the last property
      if (selectedPropertyIds.length === 1) return;
      newSelectedIds = selectedPropertyIds.filter(id => id !== propertyId);
    } else {
      newSelectedIds = [...selectedPropertyIds, propertyId];
    }
    
    onChange(newSelectedIds);
  };
  
  // Check if all properties are selected (an empty array means all selected in our context)
  const allSelected = selectedPropertyIds.length === 0;
  // Count of effectively selected properties
  const selectedCount = allSelected ? properties.length : selectedPropertyIds.length;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white flex items-center gap-1"
        >
          <span className="mr-1">Propriedades</span>
          <Badge variant="default" className="bg-primary text-white text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
            {selectedCount}
          </Badge>
          <ChevronsUpDown className="h-4 w-4 ml-1 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar propriedade..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhuma propriedade encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem 
                onSelect={handleSelectAll}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    allSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>Selecionar todas</span>
              </CommandItem>
              <CommandItem 
                onSelect={handleDeselectAll}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPropertyIds.length === 1 ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>Desmarcar todas</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Propriedades">
              {properties.map((property) => (
                <CommandItem
                  key={property.id}
                  onSelect={() => handleToggle(property.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      allSelected || selectedPropertyIds.includes(property.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{property.nome}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


export function PropertyKpiCardsFull({
  organizationId,
}: PropertyKpiCardsFullProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds, setPropertyIds } =
    useDashboardFilterContext();
  const [filterData, setFilterData] = useState<{ properties?: any[] }>({ properties: [] });
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);

  // Fetch property data for filter dropdown
  useEffect(() => {
    async function fetchProperties() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("propriedades")
          .select("id, nome")
          .eq("organizacao_id", organizationId);
        
        setFilterData({ properties: data || [] });
      } catch (error) {
        console.error("Erro ao buscar propriedades para filtro:", error);
      }
    }
    
    fetchProperties();
  }, [organizationId]);

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


  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-sm mb-4">
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
            <div className="flex items-center gap-2">
              <PropertySelector 
                properties={(filterData?.properties || []).map(property => ({
                  id: property.id,
                  nome: property.nome || "Propriedade"
                }))}
                selectedPropertyIds={filters.propertyIds}
                onChange={(ids) => {
                  if (ids.length === 0) {
                    // Se todos forem desmarcados, selecionar todos
                    setPropertyIds([]);
                  } else {
                    setPropertyIds(ids);
                  }
                }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                  <p>
                    Indicadores consolidados das propriedades incluindo área
                    total, valor patrimonial e potencial produtivo.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Fazendas */}
          <div className="relative">
            <KpiItem
              title="Total Fazendas"
              value={propertyData ? `${propertyData.totalFazendas}` : "0"}
              change={propertyData ? `${propertyData.propriedadesProprias} próprias · ${propertyData.propriedadesArrendadas} arrendadas` : "propriedades"}
              isPositive={true}
              loading={loadingProperty}
              icon={
                <HomeIcon className="h-5 w-5 text-white dark:text-white" />
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
              change={propertyData ? `${formatArea(propertyData.areaPropriedadesProprias)} própria · ${formatArea(propertyData.areaPropriedadesArrendadas)} arrendada` : "hectares"}
              isPositive={true}
              loading={loadingProperty}
              icon={
                <MapIcon className="h-5 w-5 text-white dark:text-white" />
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
                <BanknoteIcon className="h-5 w-5 text-white dark:text-white" />
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
                  ? `${propertyData.utilizacaoPercentual.toFixed(1)}% do total em uso`
                  : "0% utilização"
              }
              isPositive={true}
              loading={loadingProperty}
              icon={
                <SproutIcon className="h-5 w-5 text-white dark:text-white" />
              }
              tooltip="Área disponível para cultivo agrícola, mostrando o potencial produtivo das propriedades."
            />
          </div>
        </div>

      </Card>
    </TooltipProvider>
  );
}
