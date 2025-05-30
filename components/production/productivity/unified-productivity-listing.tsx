"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";
import { normalizeProductivityData } from "@/lib/utils/production-helpers";
import type { Productivity, Safra } from "@/lib/actions/production-actions";

interface UnifiedProductivityListingProps {
  productivities: Productivity[];
  safras: Safra[];
}

export function UnifiedProductivityListing({ 
  productivities, 
  safras 
}: UnifiedProductivityListingProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar safras para mostrar apenas 2021/22 a 2029/30
  const filteredSafras = safras
    .filter(safra => {
      const anoInicio = safra.ano_inicio;
      return anoInicio >= 2021 && anoInicio <= 2029;
    })
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Filtrar produtividades baseado no termo de busca
  const filteredProductivities = productivities.filter(productivity => {
    const searchLower = searchTerm.toLowerCase();
    return (
      productivity.propriedades?.nome?.toLowerCase().includes(searchLower) ||
      productivity.culturas?.nome?.toLowerCase().includes(searchLower) ||
      productivity.sistemas?.nome?.toLowerCase().includes(searchLower)
    );
  });

  const getCombinationBadge = (productivity: Productivity) => {
    return `${productivity.culturas?.nome} - ${productivity.sistemas?.nome}`;
  };

  const getProductivityValue = (productivity: Productivity, safraId: string) => {
    const safraData = productivity.produtividades_por_safra[safraId];
    if (!safraData) return null;
    
    // Handle both formats: number or object with produtividade and unidade
    if (typeof safraData === 'number') {
      return { produtividade: safraData, unidade: 'sc/ha' };
    }
    
    return safraData;
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Produtividades</CardTitle>
            <CardDescription className="text-white/80">
              Registros de produtividade por safra, cultura e sistema
            </CardDescription>
          </div>
        </div>
        <Button variant="secondary" className="gap-1" size="sm">
          <Plus className="h-4 w-4" />
          Nova Produtividade
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="mt-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por propriedade, cultura ou sistema..."
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
                  <th className="text-left p-3 font-medium text-white border-r min-w-[220px]">
                    Cultura/Sistema
                  </th>
                  {filteredSafras.map(safra => (
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
                {filteredProductivities.map((productivity, index) => (
                  <tr 
                    key={productivity.id} 
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                  >
                    <td className="p-3 border-r">
                      <Badge variant="default" className="text-xs font-medium">
                        {productivity.propriedades?.nome || "Geral"}
                      </Badge>
                    </td>
                    <td className="p-3 border-r">
                      <Badge variant="default" className="text-xs">
                        {getCombinationBadge(productivity)}
                      </Badge>
                    </td>
                    {filteredSafras.map(safra => {
                      const productivityData = getProductivityValue(productivity, safra.id);
                      return (
                        <td key={safra.id} className="p-3 border-r text-center">
                          {productivityData ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatNumber(productivityData.produtividade)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {productivityData.unidade}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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

        {filteredProductivities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhuma produtividade encontrada para o termo pesquisado." : "Nenhuma produtividade cadastrada."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}