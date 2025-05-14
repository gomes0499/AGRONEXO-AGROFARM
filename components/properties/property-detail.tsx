"use client";

import type { Property } from "@/schemas/properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatArea } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2Icon,
  AreaChartIcon,
  CalendarIcon,
  FileText,
  Landmark,
  MapPinIcon,
  FileIcon,
  CalendarCheckIcon,
  CalendarOffIcon,
  CheckCircleIcon,
  XCircleIcon,
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
  
  // Calcular duração do arrendamento em anos
  const arrendamentoDuration = property.tipo === "ARRENDADO" && property.data_inicio && property.data_termino
    ? Math.round((new Date(property.data_termino).getTime() - new Date(property.data_inicio).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Preparar URL da imagem para exibição
  const imageUrl = property.imagem ? property.imagem : null;
  
  // Para diagnóstico
  if (imageUrl) {
    console.log('URL da imagem da propriedade:', imageUrl);
  }

  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-sm transition-shadow">
      {/* Exibir a imagem da propriedade se existir */}
      {imageUrl && (
        <div className="relative w-full h-[240px] overflow-hidden rounded-t-lg">
          <img 
            src={imageUrl}
            alt={`Imagem da propriedade ${property.nome}`}
            className="w-full h-full object-cover"
            loading="eager" // Carrega imediatamente 
            onError={(e) => {
              console.error('Erro ao carregar imagem:', e);
              console.log('URL que falhou:', imageUrl);
              // Tentar definir uma imagem de fallback
              e.currentTarget.src = '/soja.jpg'; // Usando uma imagem default do projeto
            }}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Seção de Informações Básicas */}
        <div>
          <CardHeader className="py-3 px-4 border-b border-border/60">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Building2Icon size={18} />
                Informações Básicas
              </CardTitle>
              <Badge variant={typeInfo.variant}>
                {typeInfo.label}
              </Badge>
            </div>
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

              {/* Exibir Ano de Aquisição apenas para propriedades do tipo PROPRIO */}
              {property.tipo === "PROPRIO" && property.ano_aquisicao && (
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
              
              {/* Informações específicas de arrendamento */}
              {property.tipo === "ARRENDADO" && (
                <>
                  {property.tipo_anuencia && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Tipo de Anuência
                      </h3>
                      <p className="font-medium flex items-center gap-1.5">
                        {property.tipo_anuencia === "COM_ANUENCIA" ? (
                          <CheckCircleIcon size={16} className="text-green-500" />
                        ) : (
                          <XCircleIcon size={16} className="text-yellow-500" />
                        )}
                        {property.tipo_anuencia === "COM_ANUENCIA" ? "Com Anuência" : "Sem Anuência"}
                      </p>
                    </div>
                  )}
                  
                  {property.data_inicio && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Início do Arrendamento
                      </h3>
                      <p className="font-medium flex items-center gap-1.5">
                        <CalendarCheckIcon size={16} className="text-muted-foreground" />
                        {format(new Date(property.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  
                  {property.data_termino && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Término do Arrendamento
                      </h3>
                      <p className="font-medium flex items-center gap-1.5">
                        <CalendarOffIcon size={16} className="text-muted-foreground" />
                        {format(new Date(property.data_termino), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  
                  {arrendamentoDuration !== null && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Duração do Arrendamento
                      </h3>
                      <p className="font-medium flex items-center gap-1.5">
                        <CalendarIcon size={16} className="text-muted-foreground" />
                        {arrendamentoDuration} {arrendamentoDuration === 1 ? 'ano' : 'anos'}
                      </p>
                    </div>
                  )}
                </>
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
                 Avaliação do Imóvel
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
