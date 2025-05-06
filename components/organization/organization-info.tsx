import { CalendarClock, Globe, Mail, MapPin, Phone, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCEP, formatCNPJ, formatPhone } from "@/lib/utils/formatters";

type OrganizationInfoProps = {
  organization: any;
  isOwnerOrAdmin: boolean;
};

export function OrganizationInfo({
  organization,
  isOwnerOrAdmin,
}: OrganizationInfoProps) {
  if (!organization) return null;

  // Garantindo que os dados serão formatados, mesmo que sejam números
  const telefone = organization.telefone ? String(organization.telefone) : null;
  const cnpj = organization.cnpj ? String(organization.cnpj) : null;
  const cep = organization.cep ? String(organization.cep) : null;

  return (
    <Card>
      <CardHeader className="border-b pb-6">
        <CardTitle>Dados da Organização</CardTitle>
        <CardDescription>
          Informações gerais sobre a organização
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex space-x-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Nome</h3>
              <p className="text-base font-semibold">
                {organization.nome || "Não informado"}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Identificador</h3>
              <p className="text-base font-semibold">
                {organization.slug || "Não informado"}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
              <p className="text-base font-semibold">
                {organization.email || "Não informado"}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Telefone</h3>
              <p className="text-base font-semibold">
                {telefone ? formatPhone(telefone) : "Não informado"}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Website</h3>
              <p className="text-base font-semibold">
                {organization.website ? (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {organization.website}
                  </a>
                ) : (
                  "Não informado"
                )}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
              <span className="text-xs font-bold">ID</span>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Tipo</h3>
              <div className="flex items-center space-x-2">
                <p className="text-base font-semibold">
                  {cnpj ? "Pessoa Jurídica" : "Pessoa Física"}
                </p>
                {cnpj && (
                  <p className="text-muted-foreground text-sm">
                    (CNPJ: {formatCNPJ(cnpj)})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-3 md:col-span-2 mt-2">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium text-sm mb-1 text-muted-foreground">Endereço</h3>
              {organization.endereco ? (
                <p className="text-base font-semibold">
                  {organization.endereco}
                  {organization.numero && `, ${organization.numero}`}
                  {organization.complemento && ` - ${organization.complemento}`}
                  {organization.bairro && `, ${organization.bairro}`}
                  <br />
                  {organization.cidade && `${organization.cidade}`}
                  {organization.estado && ` - ${organization.estado}`}
                  {cep && `, ${formatCEP(cep)}`}
                </p>
              ) : (
                <p className="text-base">Endereço não informado</p>
              )}
            </div>
          </div>
        </div>

        {isOwnerOrAdmin && (
          <div className="flex justify-end pt-6 mt-6 border-t">
            <Button asChild>
              <Link href="/dashboard/organization/edit">
                Editar Organização
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
