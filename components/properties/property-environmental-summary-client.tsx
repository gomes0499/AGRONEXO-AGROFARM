"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatArea } from "@/lib/utils/property-formatters";
import { Leaf, Droplets, Shield, TreePine, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PropertyEnvironmentalSummaryClientProps {
  organizationId: string;
}

interface EnvironmentalData {
  totalArea: number;
  totalModulosFiscais: number;
  totalReservaLegal: number;
  totalRecursosHidricos: number;
  totalAreaProtegida: number;
  percentualReservaLegal: number;
  percentualRecursosHidricos: number;
  percentualAreaProtegida: number;
}

interface SicarProperty {
  numero_car: string;
  estado: string;
}

export function PropertyEnvironmentalSummaryClient({ organizationId }: PropertyEnvironmentalSummaryClientProps) {
  const [data, setData] = useState<EnvironmentalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnvironmentalData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Buscar propriedades com CAR
        const supabase = createClient();
        const { data: properties, error: propertiesError } = await supabase
          .from('propriedades')
          .select('numero_car, estado, area_total')
          .eq('organizacao_id', organizationId)
          .not('numero_car', 'is', null);

        if (propertiesError) {
          throw new Error('Erro ao buscar propriedades');
        }

        if (!properties || properties.length === 0) {
          setData({
            totalArea: 0,
            totalModulosFiscais: 0,
            totalReservaLegal: 0,
            totalRecursosHidricos: 0,
            totalAreaProtegida: 0,
            percentualReservaLegal: 0,
            percentualRecursosHidricos: 0,
            percentualAreaProtegida: 0,
          });
          return;
        }

        // 2. Buscar dados do SICAR para cada propriedade
        const sicarPromises = properties.map(async (property) => {
          try {
            const response = await fetch(`/api/sicar?car=${property.numero_car}&estado=${property.estado}`);
            
            if (!response.ok) {
              console.warn(`Erro ao buscar SICAR para CAR ${property.numero_car}:`, response.statusText);
              return {
                area_imovel: property.area_total || 0,
                modulos_fiscais: 0,
                reserva_legal: { area: 0 },
                app: { area: 0 },
                area_protegida: { area: 0 },
              };
            }

            return await response.json();
          } catch (error) {
            console.warn(`Erro ao buscar SICAR para CAR ${property.numero_car}:`, error);
            return {
              area_imovel: property.area_total || 0,
              modulos_fiscais: 0,
              reserva_legal: { area: 0 },
              app: { area: 0 },
              area_protegida: { area: 0 },
            };
          }
        });

        // 3. Aguardar todas as chamadas
        const sicarResults = await Promise.all(sicarPromises);

        // 4. Consolidar dados
        const consolidated = sicarResults.reduce(
          (acc, result) => ({
            totalArea: acc.totalArea + (result.area_imovel || 0),
            totalModulosFiscais: acc.totalModulosFiscais + (result.modulos_fiscais || 0),
            totalReservaLegal: acc.totalReservaLegal + (result.reserva_legal?.area || 0),
            totalRecursosHidricos: acc.totalRecursosHidricos + (result.app?.area || 0),
            totalAreaProtegida: acc.totalAreaProtegida + (result.area_protegida?.area || 0),
          }),
          {
            totalArea: 0,
            totalModulosFiscais: 0,
            totalReservaLegal: 0,
            totalRecursosHidricos: 0,
            totalAreaProtegida: 0,
          }
        );

        // 5. Calcular percentuais
        const percentualReservaLegal = consolidated.totalArea > 0 
          ? (consolidated.totalReservaLegal / consolidated.totalArea) * 100 
          : 0;
        
        const percentualRecursosHidricos = consolidated.totalArea > 0 
          ? (consolidated.totalRecursosHidricos / consolidated.totalArea) * 100 
          : 0;
        
        const percentualAreaProtegida = consolidated.totalArea > 0 
          ? (consolidated.totalAreaProtegida / consolidated.totalArea) * 100 
          : 0;

        setData({
          ...consolidated,
          percentualReservaLegal,
          percentualRecursosHidricos,
          percentualAreaProtegida,
        });

      } catch (err) {
        console.error('Erro ao carregar dados ambientais:', err);
        setError('Erro ao carregar dados do SICAR');
      } finally {
        setLoading(false);
      }
    }

    fetchEnvironmentalData();
  }, [organizationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            <div>
              <CardTitle className="text-base">
                DADOS AMBIENTAIS (CAR/SICAR)
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Informações de sustentabilidade e conformidade ambiental
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Carregando dados do SICAR...</p>
            <p className="text-xs text-muted-foreground">
              Consultando órgãos ambientais
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            <div>
              <CardTitle className="text-base">
                DADOS AMBIENTAIS (CAR/SICAR)
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Informações de sustentabilidade e conformidade ambiental
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-1">Verifique se as propriedades têm número CAR</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalArea === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            <div>
              <CardTitle className="text-base">
                DADOS AMBIENTAIS (CAR/SICAR)
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Informações de sustentabilidade e conformidade ambiental
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          Nenhum dado ambiental encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="h-4 w-4 text-green-600" />
          DADOS AMBIENTAIS (CAR/SICAR)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área Total */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TreePine className="h-4 w-4 text-green-600" />
            <span className="font-semibold">Área Total</span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="text-lg font-bold">{formatArea(data.totalArea)}</div>
            <div className="text-sm text-muted-foreground">
              {data.totalModulosFiscais.toFixed(2)} módulos fiscais
            </div>
          </div>
        </div>

        {/* Reserva Legal */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">Reserva Legal</span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="text-lg font-bold text-emerald-600">
              {formatArea(data.totalReservaLegal)}
            </div>
            <div className="text-sm text-muted-foreground">
              {data.percentualReservaLegal.toFixed(2)}% da área total
            </div>
          </div>
        </div>

        {/* Recursos Hídricos */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-600" />
            <span className="font-semibold">Recursos Hídricos</span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="text-lg font-bold text-blue-600">
              {formatArea(data.totalRecursosHidricos)}
            </div>
            <div className="text-sm text-muted-foreground">
              {data.percentualRecursosHidricos.toFixed(2)}% da área total
            </div>
          </div>
        </div>

        {/* Área Protegida Total */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-teal-600" />
            <span className="font-semibold">Área Protegida Total</span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="text-lg font-bold text-teal-600">
              {formatArea(data.totalAreaProtegida)}
            </div>
            <div className="text-sm text-muted-foreground">
              {data.percentualAreaProtegida.toFixed(2)}% da área total
            </div>
          </div>
        </div>

        {/* Resumo de conformidade */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Consolidado de todas as propriedades via SICAR
          </div>
        </div>
      </CardContent>
    </Card>
  );
}