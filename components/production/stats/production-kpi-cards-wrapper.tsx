"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    async function fetchSafras() {
      try {
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

        setSafras(data || []);

        // Definir safra atual como padrão
        const currentYear = new Date().getFullYear();
        const currentSafra =
          data?.find((s) => s.ano_inicio === currentYear) || data?.[0];
        if (currentSafra) {
          setSelectedSafraId(currentSafra.id);
        }
      } catch (error) {
        console.error("Erro ao buscar safras:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSafras();
  }, [organizationId]);

  const handleSafraChange = (safraId: string) => {
    setSelectedSafraId(safraId);
  };

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
      {/* KPIs de Produção com Seletor de Safra */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Indicadores de Produção</h3>
            <p className="text-sm text-muted-foreground">
              Dados específicos por safra agrícola
            </p>
          </div>
          <Select value={selectedSafraId} onValueChange={handleSafraChange}>
            <SelectTrigger className="w-48">
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
        </div>

        {selectedSafraId && (
          <ProductionKpiCardsClient
            organizationId={organizationId}
            propertyIds={propertyIds}
            safraId={selectedSafraId}
          />
        )}
      </div>

      {/* Gráficos de Produção */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AreaPlantadaChart
            organizationId={organizationId}
            propertyIds={propertyIds}
          />
          <ProdutividadeChart
            organizationId={organizationId}
            propertyIds={propertyIds}
          />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReceitaChart
            organizationId={organizationId}
            propertyIds={propertyIds}
          />
          <FinancialChart
            organizationId={organizationId}
            propertyIds={propertyIds}
          />
        </div>
      </div>
    </div>
  );
}
