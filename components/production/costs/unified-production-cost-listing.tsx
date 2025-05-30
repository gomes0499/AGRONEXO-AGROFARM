"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, DollarSign } from "lucide-react";
import { formatCurrencyCompact } from "@/lib/utils/formatters";
import type { ProductionCost, Safra } from "@/lib/actions/production-actions";

interface UnifiedProductionCostListingProps {
  productionCosts: ProductionCost[];
  safras: Safra[];
}

const CATEGORY_LABELS: Record<string, string> = {
  CALCARIO: "Calcário",
  FERTILIZANTE: "Fertilizante",
  SEMENTES: "Sementes",
  TRATAMENTO_SEMENTES: "Trat. Sementes",
  HERBICIDA: "Herbicida",
  INSETICIDA: "Inseticida",
  FUNGICIDA: "Fungicida",
  OUTROS: "Outros",
  BENEFICIAMENTO: "Beneficiamento",
  SERVICOS: "Serviços",
  ADMINISTRATIVO: "Administrativo"
};

const CATEGORY_COLORS: Record<string, string> = {
  CALCARIO: "bg-purple-100 text-purple-800",
  FERTILIZANTE: "bg-green-100 text-green-800",
  SEMENTES: "bg-blue-100 text-blue-800",
  TRATAMENTO_SEMENTES: "bg-cyan-100 text-cyan-800",
  HERBICIDA: "bg-red-100 text-red-800",
  INSETICIDA: "bg-orange-100 text-orange-800",
  FUNGICIDA: "bg-pink-100 text-pink-800",
  OUTROS: "bg-gray-100 text-gray-800",
  BENEFICIAMENTO: "bg-yellow-100 text-yellow-800",
  SERVICOS: "bg-indigo-100 text-indigo-800",
  ADMINISTRATIVO: "bg-slate-100 text-slate-800"
};

export function UnifiedProductionCostListing({ 
  productionCosts, 
  safras 
}: UnifiedProductionCostListingProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar safras para mostrar apenas 2021/22 a 2029/30
  const filteredSafras = safras
    .filter(safra => {
      const anoInicio = safra.ano_inicio;
      return anoInicio >= 2021 && anoInicio <= 2029;
    })
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Filtrar custos baseado no termo de busca
  const filteredCosts = productionCosts.filter(cost => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cost.propriedades?.nome?.toLowerCase().includes(searchLower) ||
      cost.culturas?.nome?.toLowerCase().includes(searchLower) ||
      cost.sistemas?.nome?.toLowerCase().includes(searchLower) ||
      CATEGORY_LABELS[cost.categoria]?.toLowerCase().includes(searchLower)
    );
  });

  const getCombinationBadge = (cost: ProductionCost) => {
    return `${cost.culturas?.nome} - ${cost.sistemas?.nome}`;
  };

  const getCategoryBadge = (categoria: string) => {
    return (
      <Badge 
        variant="secondary" 
        className={`text-xs ${CATEGORY_COLORS[categoria] || CATEGORY_COLORS.OUTROS}`}
      >
        {CATEGORY_LABELS[categoria] || categoria}
      </Badge>
    );
  };

  const getCostValue = (cost: ProductionCost, safraId: string): number => {
    return cost.custos_por_safra[safraId] || 0;
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Custos de Produção</CardTitle>
            <CardDescription className="text-white/80">
              Registros de custos por safra, cultura e categoria
            </CardDescription>
          </div>
        </div>
        <Button variant="secondary" className="gap-1" size="sm">
          <Plus className="h-4 w-4" />
          Novo Custo
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="mt-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por propriedade, cultura, sistema ou categoria..."
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
                  <th className="text-left p-3 font-medium text-white border-r min-w-[120px]">
                    Categoria
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
                {filteredCosts.map((cost, index) => (
                  <tr 
                    key={cost.id} 
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                  >
                    <td className="p-3 border-r">
                      <Badge variant="default" className="text-xs font-medium">
                        {cost.propriedades?.nome || "Geral"}
                      </Badge>
                    </td>
                    <td className="p-3 border-r">
                      <Badge variant="default" className="text-xs">
                        {getCombinationBadge(cost)}
                      </Badge>
                    </td>
                    <td className="p-3 border-r">
                      {getCategoryBadge(cost.categoria)}
                    </td>
                    {filteredSafras.map(safra => {
                      const value = getCostValue(cost, safra.id);
                      return (
                        <td key={safra.id} className="p-3 border-r text-center">
                          <span className={value > 0 ? "font-medium" : "text-muted-foreground"}>
                            {value > 0 ? formatCurrencyCompact(value) : "-"}
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

        {filteredCosts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhum custo encontrado para o termo pesquisado." : "Nenhum custo de produção cadastrado."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}