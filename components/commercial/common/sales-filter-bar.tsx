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

export function SalesFilterBar({
  selectedSafraId,
  setSelectedSafraId,
  selectedPropertyId,
  setSelectedPropertyId,
  uniqueSafraIds,
  uniquePropertyIds,
  properties,
  harvests,
  onRefresh,
  isRefreshing,
  selectedCulture,
  setSelectedCulture,
  cultures,
}: SalesFilterBarProps) {
  // Helper para obter o nome da safra a partir do ID
  const getSafraName = (safraId: string) => {
    const safra = harvests.find((h) => h.id === safraId);
    return safra ? safra.nome : safraId;
  };

  // Helper para obter o nome da propriedade a partir do ID
  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property ? property.nome : "Desconhecida";
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Filtro de cultura (apenas para sementes) */}
      {setSelectedCulture && selectedCulture !== undefined && cultures && (
        <Select value={selectedCulture} onValueChange={setSelectedCulture}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por cultura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as culturas</SelectItem>
            {cultures.map((culture) => (
              <SelectItem key={culture.id} value={culture.id || ""}>
                {culture.nome}
              </SelectItem>
            ))}
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
          {uniqueSafraIds.map((safraId) => (
            <SelectItem key={safraId} value={safraId}>
              {getSafraName(safraId)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro de propriedade */}
      <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por propriedade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as propriedades</SelectItem>
          {uniquePropertyIds.map((propertyId) => (
            <SelectItem key={propertyId} value={propertyId}>
              {getPropertyName(propertyId)}
            </SelectItem>
          ))}
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
