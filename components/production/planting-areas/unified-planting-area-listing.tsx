"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, Sprout } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";
import type { PlantingArea, Safra } from "@/lib/actions/production-actions";

interface UnifiedPlantingAreaListingProps {
  plantingAreas: PlantingArea[];
  safras: Safra[];
}

export function UnifiedPlantingAreaListing({ 
  plantingAreas, 
  safras 
}: UnifiedPlantingAreaListingProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar safras para mostrar apenas 2021/22 a 2029/30
  const filteredSafras = safras
    .filter(safra => {
      const anoInicio = safra.ano_inicio;
      return anoInicio >= 2021 && anoInicio <= 2029;
    })
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Filtrar áreas de plantio baseado no termo de busca
  const filteredPlantingAreas = plantingAreas.filter(area => {
    const searchLower = searchTerm.toLowerCase();
    return (
      area.propriedades?.nome?.toLowerCase().includes(searchLower) ||
      area.culturas?.nome?.toLowerCase().includes(searchLower) ||
      area.sistemas?.nome?.toLowerCase().includes(searchLower) ||
      area.ciclos?.nome?.toLowerCase().includes(searchLower)
    );
  });

  const getCombinationBadge = (area: PlantingArea) => {
    return `${area.culturas?.nome} - ${area.sistemas?.nome} - ${area.ciclos?.nome}`;
  };

  const getAreaValue = (area: PlantingArea, safraId: string): number => {
    return area.areas_por_safra[safraId] || 0;
  };
  
  // Formata o valor de área para remover casas decimais desnecessárias (,00)
  const formatAreaValue = (value: number): string => {
    if (value === 0) return "-";
    
    // Se o valor é um número inteiro ou tem apenas zeros após a vírgula, remove a parte decimal
    if (value % 1 === 0) {
      return `${Math.round(value).toLocaleString('pt-BR')} ha`;
    }
    
    // Caso contrário, mantém até 2 casas decimais
    return `${value.toLocaleString('pt-BR')} ha`;
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Áreas de Plantio</CardTitle>
            <CardDescription className="text-white/80">
              Registros de áreas plantadas por safra, cultura e sistema
            </CardDescription>
          </div>
        </div>
        <Button variant="secondary" className="gap-1" size="sm">
          <Plus className="h-4 w-4" />
          Nova Área
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="mt-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por propriedade, cultura, sistema ou ciclo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm"
          />
        </div>

        {/* Table Container with Scroll */}
        <div className="border rounded-lg">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[150px] w-[150px]">
                    Propriedade
                  </th>
                  <th className="text-left p-3 font-medium text-white border-r min-w-[250px]">
                    Cultura/Sistema/Ciclo
                  </th>
                  {filteredSafras.map((safra, index) => (
                    <th key={safra.id} className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                      {safra.nome}
                    </th>
                  ))}
                  <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[100px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlantingAreas.map((area, index) => (
                  <tr 
                    key={area.id} 
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                  >
                    <td className="p-3 border-r">
                      <Badge variant="default" className="text-xs font-medium">
                        {area.propriedades?.nome || "N/A"}
                      </Badge>
                    </td>
                    <td className="p-3 border-r">
                      <Badge variant="default" className="text-xs">
                        {getCombinationBadge(area)}
                      </Badge>
                    </td>
                    {filteredSafras.map(safra => {
                      const value = getAreaValue(area, safra.id);
                      return (
                        <td key={safra.id} className="p-3 border-r text-center">
                          <span className={value > 0 ? "font-medium" : "text-muted-foreground"}>
                            {value > 0 ? formatAreaValue(value) : "-"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPlantingAreas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhuma área encontrada para o termo pesquisado." : "Nenhuma área de plantio cadastrada."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}