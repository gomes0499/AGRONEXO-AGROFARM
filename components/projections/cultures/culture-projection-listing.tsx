"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/formatters";
import { getProjecoesCulturas } from "@/lib/actions/projections-actions/index";
import { useProjectionFiltersRead } from "@/hooks/use-projection-filters-read";
import { BarChart3, ChartLine } from "lucide-react";

interface ProjecaoCultura {
  id: string;
  organizacao_id: string;
  projecao_config_id: string;
  cultura_id: string;
  sistema_id: string;
  ciclo_id?: string;
  safra_id?: string;
  periodo: string;
  area_plantada: number;
  produtividade: number;
  unidade_produtividade: string;
  preco_unitario: number;
  unidade_preco: string;
  custo_fertilizantes: number;
  custo_defensivos: number;
  custo_sementes: number;
  custo_combustivel: number;
  custo_mao_obra: number;
  custo_maquinario: number;
  custo_outros: number;
  producao_total: number;
  receita_bruta: number;
  custo_total: number;
  ebitda: number;
  margem_ebitda: number;
  created_at: string;
  culturas?: { nome: string };
  sistemas?: { nome: string };
  ciclos?: { nome: string };
  safras?: { nome: string };
  projecoes_config?: { nome: string };
}

interface CultureProjectionListingProps {
  organizationId: string;
  activeConfigId: string | null;
}

export function CultureProjectionListing({
  organizationId,
  activeConfigId,
}: CultureProjectionListingProps) {
  const [projections, setProjections] = useState<ProjecaoCultura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar filtros globais de projeção
  const filters = useProjectionFiltersRead();

  useEffect(() => {
    async function loadProjections() {
      if (!activeConfigId) {
        setProjections([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await getProjecoesCulturas(organizationId, activeConfigId);
        
        if ('error' in result) {
          setError(result.error ?? null);
          setProjections([]);
        } else {
          // Aplicar filtros globais aos dados
          let filteredData = result.data;
          
          if (filters.hasActiveFilters) {
            filteredData = result.data.filter((projection: ProjecaoCultura) => {
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
      } catch (err) {
        setError('Erro ao carregar projeções de culturas');
        setProjections([]);
      } finally {
        setLoading(false);
      }
    }

    loadProjections();
  }, [organizationId, activeConfigId, filters]);

  if (loading) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<BarChart3 className="h-4 w-4" />}
          title="Projeções de Culturas"
          description="Gerencie projeções de produção e receita por cultura"
        />
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<BarChart3 className="h-4 w-4" />}
          title="Projeções de Culturas"
          description="Gerencie projeções de produção e receita por cultura"
        />
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<BarChart3 className="h-4 w-4" />}
        title="Projeções de Culturas"
        description="Gerencie projeções de produção e receita por cultura"
      />

      <CardContent className="p-6 space-y-6">
        {/* Tabela ou Empty State */}
        {projections.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">
                      Cultura
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Sistema
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Ciclo
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Safra
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">
                      Área (ha)
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">
                      Produtividade
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">
                      Preço Unitário
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">
                      Produção Total
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">
                      Receita Bruta
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">
                      Custo Total
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">
                      EBITDA
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md">
                      Margem %
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projections.map((projection) => (
                    <TableRow key={projection.id}>
                      <TableCell className="font-medium">
                        {projection.culturas?.nome || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {projection.sistemas?.nome || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {projection.ciclos?.nome || projection.periodo}
                      </TableCell>
                      <TableCell>
                        {projection.safras?.nome || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {projection.area_plantada.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {projection.produtividade.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })} {projection.unidade_produtividade}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(projection.preco_unitario)} / {projection.unidade_preco}
                      </TableCell>
                      <TableCell className="text-right">
                        {projection.producao_total.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })} {projection.unidade_produtividade}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(projection.receita_bruta)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(projection.custo_total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={projection.ebitda >= 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                          {formatCurrency(projection.ebitda)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={projection.margem_ebitda >= 0 ? "default" : "destructive"}>
                          {(projection.margem_ebitda * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<ChartLine className="h-10 w-10 text-muted-foreground" />}
            title={
              !activeConfigId
                ? "Configuração de Projeção Necessária"
                : "Nenhuma projeção disponível"
            }
            description={
              !activeConfigId
                ? "Você precisa criar uma configuração de projeção primeiro na aba Configurações"
                : "As projeções são calculadas automaticamente baseadas nas configurações e dados de produção"
            }
          />
        )}
      </CardContent>
    </Card>
  );
}