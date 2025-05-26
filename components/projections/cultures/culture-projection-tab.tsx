"use client";

import { useState, useEffect } from "react";
import { CultureProjectionListing } from "./culture-projection-listing";
import { getProjecoesCulturas, getProjecoesConfig } from "@/lib/actions/projections-actions";
import { useProjectionFiltersRead } from "@/hooks/use-projection-filters-read";
import { ProjectionExcelTable } from "@/components/projections/common/projection-excel-table";
import { Skeleton } from "@/components/ui/skeleton";

interface CultureProjectionTabProps {
  organizationId: string;
  projecaoConfigId?: string;
}

export function CultureProjectionTab({ organizationId, projecaoConfigId }: CultureProjectionTabProps) {
  const [projections, setProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(projecaoConfigId || null);
  
  // Usar filtros globais
  const filters = useProjectionFiltersRead();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Se não tiver configuração passada, busca a configuração ativa/padrão
        let configId = projecaoConfigId;
        if (!configId) {
          const configResult = await getProjecoesConfig(organizationId);
          if ('data' in configResult && configResult.data.length > 0) {
            // Busca configuração padrão ou a primeira ativa
            const defaultConfig = configResult.data.find(c => c.eh_padrao && c.status === 'ATIVA') ||
                                configResult.data.find(c => c.status === 'ATIVA');
            if (defaultConfig) {
              configId = defaultConfig.id;
              setActiveConfigId(configId);
            }
          }
        }
        
        if (configId) {
          const result = await getProjecoesCulturas(organizationId, configId);
          
          if ('error' in result) {
            setError(result.error);
          } else {
            // Aplicar filtros aos dados
            let filteredData = result.data;
            
            if (filters.hasActiveFilters) {
              filteredData = result.data.filter((projection: any) => {
                // Filtrar por cultura
                if (filters.cultureIds.length > 0 && !filters.cultureIds.includes(projection.cultura_id)) {
                  return false;
                }
                
                // Filtrar por sistema
                if (filters.systemIds.length > 0 && !filters.systemIds.includes(projection.sistema_id)) {
                  return false;
                }
                
                // Filtrar por ciclo
                if (filters.cycleIds.length > 0 && projection.ciclo_id && !filters.cycleIds.includes(projection.ciclo_id)) {
                  return false;
                }
                
                // Filtrar por safra
                if (filters.safraIds.length > 0 && projection.safra_id && !filters.safraIds.includes(projection.safra_id)) {
                  return false;
                }
                
                return true;
              });
            }
            
            setProjections(filteredData);
          }
        } else {
          setProjections([]);
        }
      } catch (err) {
        setError('Erro ao carregar projeções de culturas');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [organizationId, projecaoConfigId, filters]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-hidden">
      {/* Listagem de Projeções com Tabela Calculada */}
      <CultureProjectionListing 
        organizationId={organizationId}
        activeConfigId={activeConfigId}
      />
    </div>
  );
}