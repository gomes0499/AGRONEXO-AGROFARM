"use client";

import type { Property } from "@/schemas/properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatArea } from "@/lib/utils/formatters";
import {
  Building2Icon,
  AreaChartIcon,
  CalendarIcon,
  FileText,
  Landmark,
  MapPinIcon,
  FileIcon,
} from "lucide-react";

interface PropertyDetailProps {
  property: Property;
}

export function PropertyDetail({ property }: PropertyDetailProps) {
  // Calcular a porcentagem de área cultivada
  const cultivationPercentage = property.area_cultivada
    ? Math.round((property.area_cultivada / property.area_total) * 100)
    : 0;

  // Determinar o tipo de propriedade e suas características visuais
  const propertyTypeInfo = {
    PROPRIO: { label: "Próprio", variant: "default" as const },
    ARRENDADO: { label: "Arrendado", variant: "secondary" as const },
  };

  const typeInfo = propertyTypeInfo[property.tipo] || propertyTypeInfo.PROPRIO;

  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-sm transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Seção de Informações Básicas */}
        <div>
          <CardHeader className="py-3 px-4 border-b border-border/60">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Building2Icon size={18} />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Proprietário
                </h3>
                <p className="font-medium flex items-center gap-1.5">
                  <Building2Icon size={16} className="text-muted-foreground" />
                  {property.proprietario}
                </p>
              </div>

              {property.ano_aquisicao && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Ano de Aquisição
                  </h3>
                  <p className="font-medium flex items-center gap-1.5">
                    <CalendarIcon size={16} className="text-muted-foreground" />
                    {property.ano_aquisicao}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Matrícula
                </h3>
                <p className="font-medium flex items-center gap-1.5">
                  <FileText size={16} className="text-muted-foreground" />
                  {property.numero_matricula}
                </p>
              </div>

              {property.numero_car && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Número CAR
                  </h3>
                  <p className="font-medium flex items-center gap-1.5">
                    <FileIcon size={16} className="text-muted-foreground" />
                    {property.numero_car}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </div>

        {/* Seção de Área e Valoração */}
        <div className="md:border-l border-border/60">
          <CardHeader className="py-3 px-4 border-b border-border/60">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AreaChartIcon size={18} />
              Área e Valoração
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">
                Área Total
              </h3>
              <p className="text-2xl font-bold tracking-tight">
                {formatArea(property.area_total)}
              </p>
            </div>

            {property.area_cultivada && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Área Cultivável
                </h3>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium">
                    {formatArea(property.area_cultivada)}
                  </p>
                  <Badge variant="outline" className="ml-1 font-normal">
                    {cultivationPercentage}%
                  </Badge>
                </div>
                <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${cultivationPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            <Separator />

            {property.valor_atual && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Valor Atual
                </h3>
                <p className="text-xl font-bold tracking-tight flex items-center gap-1.5">
                  <Landmark size={16} className="text-muted-foreground" />
                  {formatCurrency(property.valor_atual)}
                </p>
              </div>
            )}

            {property.avaliacao_banco && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Avaliação Bancária
                </h3>
                <p className="font-medium">
                  {formatCurrency(property.avaliacao_banco)}
                </p>
              </div>
            )}
          </CardContent>
        </div>
      </div>

      {/* Informações adicionais */}
      {property.onus && (
        <div className="mt-4 bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-bold mb-2">Ônus e Observações</h2>
          <p className="text-muted-foreground">
            <strong>Ônus:</strong> {property.onus}
          </p>
        </div>
      )}
    </Card>
  );
}
