"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionKpiCardsClient } from "./production-kpi-cards-client";
import { AreaPlantadaChart } from "./area-plantada-chart";
import { ProdutividadeChart } from "./produtividade-chart";
import { ReceitaChart } from "./receita-chart";
import { FinancialChart } from "./financial-chart";
import { createClient } from "@/lib/supabase/client";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";

interface SafraOption {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

interface ProductionKpiCardsWrapperProps {
  organizationId: string;
  propertyIds?: string[];
}

export function ProductionKpiCardsWrapper({
  organizationId,
  propertyIds,
}: ProductionKpiCardsWrapperProps) {
  const [safras, setSafras] = useState<SafraOption[]>([]);
  const [selectedSafraId, setSelectedSafraId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [cultures, setCultures] = useState<{ id: string; nome: string }[]>([]);
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>([]);
  const { getFilteredPropertyIds, getFilteredCultureIds, allPropertyIds, allCultureIds, filters } = useDashboardFilterContext();

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        
        // Buscar safras e culturas em paralelo
        const [safrasResponse, culturesResponse] = await Promise.all([
          supabase
            .from("safras")
            .select("id, nome, ano_inicio, ano_fim")
            .eq("organizacao_id", organizationId)
            .order("ano_inicio", { ascending: false }),
          supabase
            .from("culturas")
            .select("id, nome")
            .eq("organizacao_id", organizationId)
            .order("nome", { ascending: true })
        ]);

        if (safrasResponse.error) {
          console.error("Erro ao buscar safras:", safrasResponse.error);
        } else {
          setSafras(safrasResponse.data || []);

          // Definir safra atual como padrão
          const currentYear = new Date().getFullYear();
          const currentSafra =
            safrasResponse.data?.find((s) => s.ano_inicio === currentYear) || safrasResponse.data?.[0];
          if (currentSafra) {
            setSelectedSafraId(currentSafra.id);
          }
        }

        if (culturesResponse.error) {
          console.error("Erro ao buscar culturas:", culturesResponse.error);
        } else {
          setCultures(culturesResponse.data || []);
          // Verificar se existem filtros de cultura ativos no contexto global
          const filteredCultureIds = getFilteredCultureIds(allCultureIds);
          const dashboardHasCultureFilter = filteredCultureIds.length < allCultureIds.length;
          
          if (dashboardHasCultureFilter && filteredCultureIds.length > 0) {
            // Usar filtros do dashboard se existirem
            setSelectedCultureIds(filteredCultureIds);
          } else {
            // Caso contrário, selecionar todas as culturas por padrão
            setSelectedCultureIds(culturesResponse.data?.map(c => c.id) || []);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [organizationId, getFilteredCultureIds, allCultureIds, filters.cultureIds]);

  const handleSafraChange = React.useCallback((safraId: string) => {
    setSelectedSafraId(safraId);
  }, []);
  
  const handleCultureChange = React.useCallback((cultureIds: string[]) => {
    setSelectedCultureIds(cultureIds);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produção</CardTitle>
            <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 bg-muted rounded animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs de Produção com Seletor de Safra integrado no header */}
      <div>
        <ProductionKpiCardsClient
          organizationId={organizationId}
          propertyIds={getFilteredPropertyIds(allPropertyIds)}
          safraId={selectedSafraId}
          onSafraChange={handleSafraChange}
          cultures={cultures}
          selectedCultureIds={selectedCultureIds}
          onCultureChange={handleCultureChange}
        />
      </div>

      {/* Gráficos de Produção */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AreaPlantadaChart
            organizationId={organizationId}
            propertyIds={getFilteredPropertyIds(allPropertyIds)}
            cultureIds={selectedCultureIds}
          />
          <ProdutividadeChart
            organizationId={organizationId}
            propertyIds={getFilteredPropertyIds(allPropertyIds)}
            cultureIds={selectedCultureIds}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReceitaChart
            organizationId={organizationId}
            propertyIds={getFilteredPropertyIds(allPropertyIds)}
            cultureIds={selectedCultureIds}
          />
          <FinancialChart
            organizationId={organizationId}
            propertyIds={getFilteredPropertyIds(allPropertyIds)}
            cultureIds={selectedCultureIds}
          />
        </div>
      </div>
    </div>
  );
}
