"use client";

import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Briefcase,
  Hash,
  CreditCard,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatCEP,
  formatCNPJ,
  formatPhone,
  formatCPF,
} from "@/lib/utils/formatters";
import { InfoField } from "../common/data-display/info-field";
import { CardHeaderPrimary } from "../common/data-display/card-header-primary";

type OrganizationDetailInfoProps = {
  organization: any;
};

export function OrganizationDetailInfo({
  organization,
}: OrganizationDetailInfoProps) {
  // Função para renderizar o tipo de organização (PF ou PJ)
  const renderTypeField = () => {
    const isPJ = !!organization.cnpj;
    
    return (
      <InfoField
        icon={isPJ ? <Briefcase className="h-4 w-4" /> : <User className="h-4 w-4" />}
        label="Tipo"
        copyable={false}
      >
        <Badge variant="outline" className="mt-0.5 font-medium">
          {isPJ ? "Pessoa Jurídica" : "Pessoa Física"}
        </Badge>
      </InfoField>
    );
  };

  // Função para renderizar o endereço completo
  const renderAddressField = () => {
    if (!organization.endereco) return null;

    const addressLine1 = [
      organization.endereco,
      organization.numero && `nº ${organization.numero}`,
      organization.complemento,
    ]
      .filter(Boolean)
      .join(", ");

    const addressLine2 = [
      organization.bairro,
      organization.cidade && `${organization.cidade}`,
      organization.estado && `${organization.estado}`,
    ]
      .filter(Boolean)
      .join(", ");

    const cep = organization.cep ? formatCEP(String(organization.cep)) : null;
    const fullAddress = [addressLine1, addressLine2, cep && `CEP ${cep}`].filter(Boolean).join(" • ");

    return (
      <InfoField
        icon={<MapPin className="h-4 w-4" />}
        label="Endereço"
        value={fullAddress}
        className="col-span-full"
      >
        <div className="space-y-1">
          <p className="font-medium text-foreground">{addressLine1}</p>
          {addressLine2 && <p className="text-muted-foreground">{addressLine2}</p>}
          {cep && <p className="text-sm text-muted-foreground">CEP {cep}</p>}
        </div>
      </InfoField>
    );
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary 
        icon={<Building2 className="h-4 w-4" />}
        title="Dados da Organização"
        description="Informações gerais e dados cadastrais da organização"
      />
      <CardContent className="mt-4">
        {/* Grid principal com informações em cards */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Informações básicas */}
          <InfoField
            icon={<Building2 className="h-4 w-4" />}
            label="Nome da Organização"
            value={organization.nome}
          />
          
          <InfoField
            icon={<Hash className="h-4 w-4" />}
            label="Identificador"
            value={organization.slug}
          />

          {renderTypeField()}

          {/* Informações de contato */}
          <InfoField
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={organization.email}
          />

          <InfoField
            icon={<Phone className="h-4 w-4" />}
            label="Telefone"
            value={organization.telefone ? formatPhone(String(organization.telefone)) : null}
          />

          <InfoField
            icon={<Globe className="h-4 w-4" />}
            label="Website"
            value={organization.website}
            link={true}
          />

          {/* Documentos */}
          {organization.cnpj && (
            <InfoField
              icon={<Briefcase className="h-4 w-4" />}
              label="CNPJ"
              value={formatCNPJ(String(organization.cnpj))}
            />
          )}

          {organization.cpf && (
            <InfoField
              icon={<CreditCard className="h-4 w-4" />}
              label="CPF"
              value={formatCPF ? formatCPF(String(organization.cpf)) : organization.cpf}
            />
          )}

          {organization.inscricao_estadual && (
            <InfoField
              icon={<FileText className="h-4 w-4" />}
              label="Inscrição Estadual"
              value={organization.inscricao_estadual}
            />
          )}

          {/* Endereço - ocupa toda a largura */}
          {renderAddressField()}
        </div>
      </CardContent>
    </Card>
  );
}
