"use client";

import type { Property, PropertyOwner } from "@/schemas/properties";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatArea, formatCPF, formatCNPJ } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { getPropertyOwners } from "@/lib/actions/property-actions";
import {
  Building2,
  User,
  Calendar,
  FileText,
  DollarSign,
  Ruler,
  MapPin,
  Hash,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Users,
} from "lucide-react";
import { InfoField } from "@/components/organization/common/data-display/info-field";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { PropertyMap } from "./property-map";

interface PropertyDetailProps {
  property: Property;
}

export function PropertyDetail({ property }: PropertyDetailProps) {
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);

  useEffect(() => {
    async function loadOwners() {
      try {
        const ownersData = await getPropertyOwners(property.id!);
        setOwners(ownersData);
      } catch (error) {
        console.error("Erro ao carregar proprietários:", error);
      } finally {
        setLoadingOwners(false);
      }
    }
    
    if (property.id) {
      loadOwners();
    }
  }, [property.id]);
  // Função para renderizar o tipo de propriedade
  const renderTypeField = () => {
    const typeInfo = {
      PROPRIO: { label: "Própria", variant: "default" as const },
      ARRENDADO: { label: "Arrendada", variant: "secondary" as const },
      PARCERIA: { label: "Parceria", variant: "outline" as const },
      COMODATO: { label: "Comodato", variant: "ghost" as const },
    };

    const type = property.tipo ? typeInfo[property.tipo] : typeInfo.PROPRIO;
    
    return (
      <InfoField
        icon={<Building2 className="h-4 w-4" />}
        label="Tipo de Propriedade"
        copyable={false}
      >
        <Badge variant={type.variant} className="mt-0.5 font-medium">
          {type.label}
        </Badge>
      </InfoField>
    );
  };

  // Função para renderizar localização
  const renderLocationField = () => {
    const location = [property.cidade, property.estado].filter(Boolean).join(", ");
    
    return (
      <InfoField
        icon={<MapPin className="h-4 w-4" />}
        label="Localização"
        value={location}
      />
    );
  };

  // Função para renderizar área cultivada com porcentagem
  const renderCultivatedAreaField = () => {
    if (!property.area_cultivada || !property.area_total) return null;

    const cultivationPercentage = Math.round((property.area_cultivada / (property.area_total || 1)) * 100);
    
    return (
      <InfoField
        icon={<Ruler className="h-4 w-4" />}
        label="Área Cultivada"
        copyable={false}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatArea(property.area_cultivada)}</span>
            <Badge variant="outline" className="text-xs">
              {cultivationPercentage}%
            </Badge>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${cultivationPercentage}%` }}
            />
          </div>
        </div>
      </InfoField>
    );
  };

  // Função para renderizar datas de arrendamento
  const renderLeaseFields = () => {
    if (property.tipo !== "ARRENDADO") return null;

    const fields = [];

    if (property.data_inicio) {
      fields.push(
        <InfoField
          key="data_inicio"
          icon={<Calendar className="h-4 w-4" />}
          label="Início do Arrendamento"
          value={format(new Date(property.data_inicio), "dd/MM/yyyy")}
        />
      );
    }

    if (property.data_termino) {
      fields.push(
        <InfoField
          key="data_termino"
          icon={<Calendar className="h-4 w-4" />}
          label="Término do Arrendamento"
          value={format(new Date(property.data_termino), "dd/MM/yyyy")}
        />
      );
    }

    if (property.tipo_anuencia) {
      const hasAnnuity = property.tipo_anuencia === "COM_ANUENCIA";
      fields.push(
        <InfoField
          key="tipo_anuencia"
          icon={hasAnnuity ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          label="Anuência"
          copyable={false}
        >
          <Badge variant={hasAnnuity ? "default" : "secondary"} className="mt-0.5">
            {hasAnnuity ? "Com Anuência" : "Sem Anuência"}
          </Badge>
        </InfoField>
      );
    }

    return fields;
  };

  return (
    <div className="space-y-6">
      {/* Card de Informações da Propriedade */}
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary 
          icon={<Building2 className="h-4 w-4" />}
          title="Dados da Propriedade"
          description="Informações gerais e documentação da propriedade"
        />
        <CardContent className="mt-4">
          {/* Grid principal com informações em cards */}
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Informações básicas */}
            <InfoField
              icon={<Building2 className="h-4 w-4" />}
              label="Nome da Propriedade"
              value={property.nome}
            />
            
            {/* Mostrar proprietário único se não houver múltiplos proprietários */}
            {owners.length === 0 && property.proprietario && (
              <InfoField
                icon={<User className="h-4 w-4" />}
                label="Proprietário"
                value={property.proprietario}
              />
            )}

            {renderTypeField()}

            {/* Localização */}
            {renderLocationField()}

            {/* Documentação */}
            <InfoField
              icon={<FileText className="h-4 w-4" />}
              label="Número da Matrícula"
              value={property.numero_matricula}
            />

            {property.numero_car && (
              <InfoField
                icon={<Hash className="h-4 w-4" />}
                label="Número CAR"
                value={property.numero_car}
              />
            )}

            {/* Ano de aquisição - apenas para propriedades próprias */}
            {property.tipo === "PROPRIO" && property.ano_aquisicao && (
              <InfoField
                icon={<CalendarIcon className="h-4 w-4" />}
                label="Ano de Aquisição"
                value={property.ano_aquisicao.toString()}
              />
            )}

            {/* Campos específicos de arrendamento */}
            {renderLeaseFields()}

            {/* Áreas */}
            <InfoField
              icon={<Ruler className="h-4 w-4" />}
              label="Área Total"
              value={formatArea(property.area_total)}
            />

            {renderCultivatedAreaField()}

            {/* Valores */}
            {property.valor_atual && (
              <InfoField
                icon={<DollarSign className="h-4 w-4" />}
                label="Valor Atual"
                value={formatCurrency(property.valor_atual)}
              />
            )}

            {property.avaliacao_banco && (
              <InfoField
                icon={<DollarSign className="h-4 w-4" />}
                label="Avaliação do Banco"
                value={formatCurrency(property.avaliacao_banco)}
              />
            )}

            {/* Ônus - ocupa toda a largura se presente */}
            {property.onus && (
              <InfoField
                icon={<FileText className="h-4 w-4" />}
                label="Ônus e Observações"
                value={property.onus}
                className="col-span-full"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Proprietários */}
      {owners.length > 0 && (
        <Card className="shadow-sm border-muted/80">
          <CardHeaderPrimary 
            icon={<Users className="h-4 w-4" />}
            title="Proprietários"
            description="Pessoas físicas e jurídicas proprietárias desta propriedade"
          />
          <CardContent className="mt-4">
            <div className="space-y-3">
              {owners.map((owner, index) => (
                <div key={owner.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{owner.nome}</p>
                    {owner.cpf_cnpj && (
                      <p className="text-sm text-muted-foreground">
                        {owner.tipo_pessoa === 'J' ? 'CNPJ' : 'CPF'}: {' '}
                        {owner.tipo_pessoa === 'J' 
                          ? formatCNPJ(owner.cpf_cnpj) 
                          : formatCPF(owner.cpf_cnpj)}
                      </p>
                    )}
                  </div>
                  {owner.percentual_participacao !== null && owner.percentual_participacao !== undefined && (
                    <Badge variant="secondary" className="ml-4">
                      {owner.percentual_participacao}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card do Mapa SICAR */}
      <PropertyMap property={property} />
    </div>
  );
}
