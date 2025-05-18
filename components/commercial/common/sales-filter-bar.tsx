"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { Culture } from "@/schemas/production";

interface SalesFilterBarProps {
  selectedSafraId: string;
  setSelectedSafraId: (value: string) => void;
  selectedPropertyId: string;
  setSelectedPropertyId: (value: string) => void;
  uniqueSafraIds: string[];
  uniquePropertyIds: string[];
  properties: Property[];
  harvests: Harvest[];
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedCulture?: string;
  setSelectedCulture?: (value: string) => void;
  cultures?: Culture[];
}

export function SalesFilterBar(props: SalesFilterBarProps) {
  const selectedSafraId = props.selectedSafraId;
  const setSelectedSafraId = props.setSelectedSafraId;
  const selectedPropertyId = props.selectedPropertyId;
  const setSelectedPropertyId = props.setSelectedPropertyId;
  const uniqueSafraIds = props.uniqueSafraIds || [];
  const uniquePropertyIds = props.uniquePropertyIds || [];
  const properties = props.properties || [];
  const harvests = props.harvests || [];
  const onRefresh = props.onRefresh;
  const isRefreshing = props.isRefreshing;
  const selectedCulture = props.selectedCulture;
  const setSelectedCulture = props.setSelectedCulture;
  const cultures = props.cultures || [];

  // Helper para obter o nome da safra a partir do ID
  const getSafraName = function (safraId: string): string {
    const safra = harvests.find(function (h) {
      return h.id === safraId;
    });
    return safra ? safra.nome : safraId;
  };

  // Helper para obter o nome da propriedade a partir do ID
  const getPropertyName = function (propertyId: string): string {
    const property = properties.find(function (p) {
      return p.id === propertyId;
    });
    return property ? property.nome : "Desconhecida";
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Filtro de cultura (apenas para sementes) */}
      {setSelectedCulture &&
        selectedCulture !== undefined &&
        cultures.length > 0 && (
          <Select value={selectedCulture} onValueChange={setSelectedCulture}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por cultura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as culturas</SelectItem>
              {cultures.map(function (culture) {
                return (
                  <SelectItem key={culture.id} value={culture.id || ""}>
                    {culture.nome}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}

      {/* Filtro de safra */}
      <Select value={selectedSafraId} onValueChange={setSelectedSafraId}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por safra" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as safras</SelectItem>
          {uniqueSafraIds.map(function (safraId) {
            return (
              <SelectItem key={safraId} value={safraId}>
                {getSafraName(safraId)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Filtro de propriedade */}
      <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por propriedade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as propriedades</SelectItem>
          {uniquePropertyIds.map(function (propertyId) {
            return (
              <SelectItem key={propertyId} value={propertyId}>
                {getPropertyName(propertyId)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Botão para atualizar dados */}
      <Button
        onClick={onRefresh}
        variant="outline"
        disabled={isRefreshing}
        className="h-10"
      >
        Atualizar dados
      </Button>
    </div>
  );
}
