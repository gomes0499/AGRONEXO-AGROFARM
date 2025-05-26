import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatArea } from "@/lib/utils/property-formatters";
import { Leaf, Droplets, Shield, TreePine } from "lucide-react";

interface PropertyEnvironmentalSummaryProps {
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

async function getEnvironmentalData(organizationId: string): Promise<EnvironmentalData> {
  const supabase = await createClient();
  
  const { data: properties, error } = await supabase
    .from('propriedades')
    .select(`
      area_total,
      modulos_fiscais,
      area_reserva_legal,
      area_recursos_hidricos,
      area_protegida_total
    `)
    .eq('organizacao_id', organizationId);

  if (error) {
    console.error('Erro ao buscar dados ambientais:', error);
    throw error;
  }

  if (!properties || properties.length === 0) {
    return {
      totalArea: 0,
      totalModulosFiscais: 0,
      totalReservaLegal: 0,
      totalRecursosHidricos: 0,
      totalAreaProtegida: 0,
      percentualReservaLegal: 0,
      percentualRecursosHidricos: 0,
      percentualAreaProtegida: 0,
    };
  }

  // Consolidar dados de todas as propriedades
  const totals = properties.reduce((acc, prop) => ({
    totalArea: acc.totalArea + (prop.area_total || 0),
    totalModulosFiscais: acc.totalModulosFiscais + (prop.modulos_fiscais || 0),
    totalReservaLegal: acc.totalReservaLegal + (prop.area_reserva_legal || 0),
    totalRecursosHidricos: acc.totalRecursosHidricos + (prop.area_recursos_hidricos || 0),
    totalAreaProtegida: acc.totalAreaProtegida + (prop.area_protegida_total || 0),
  }), {
    totalArea: 0,
    totalModulosFiscais: 0,
    totalReservaLegal: 0,
    totalRecursosHidricos: 0,
    totalAreaProtegida: 0,
  });

  // Calcular percentuais
  const percentualReservaLegal = totals.totalArea > 0 ? (totals.totalReservaLegal / totals.totalArea) * 100 : 0;
  const percentualRecursosHidricos = totals.totalArea > 0 ? (totals.totalRecursosHidricos / totals.totalArea) * 100 : 0;
  const percentualAreaProtegida = totals.totalArea > 0 ? (totals.totalAreaProtegida / totals.totalArea) * 100 : 0;

  return {
    ...totals,
    percentualReservaLegal,
    percentualRecursosHidricos,
    percentualAreaProtegida,
  };
}

async function PropertyEnvironmentalSummaryContent({ organizationId }: PropertyEnvironmentalSummaryProps) {
  try {
    const data = await getEnvironmentalData(organizationId);

    if (data.totalArea === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Leaf className="h-4 w-4 text-green-600" />
              DADOS AMBIENTAIS (CAR/SICAR)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
            Nenhum dado ambiental cadastrado
          </CardContent>
        </Card>
      );
    }

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
              Consolidado de todas as propriedades
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("Erro ao carregar dados ambientais:", error);
    
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
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
              <div className="pl-6 space-y-1">
                <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
}

export async function PropertyEnvironmentalSummary({ organizationId }: PropertyEnvironmentalSummaryProps) {
  return <PropertyEnvironmentalSummaryContent organizationId={organizationId} />;
}