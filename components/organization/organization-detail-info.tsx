import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCEP, formatCNPJ, formatPhone } from "@/lib/utils/formatters";

type OrganizationDetailInfoProps = {
  organization: any;
};

export function OrganizationDetailInfo({ organization }: OrganizationDetailInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Organização</CardTitle>
        <CardDescription>
          Informações gerais sobre a organização
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-sm">Nome</h3>
            <p>
              {organization.nome || "Não informado"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Identificador</h3>
            <p>
              {organization.slug || "Não informado"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Email</h3>
            <p>
              {organization.email || "Não informado"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Telefone</h3>
            <p>
              {organization.telefone
                ? formatPhone(String(organization.telefone))
                : "Não informado"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Website</h3>
            <p>
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
          <div>
            <h3 className="font-medium text-sm">Tipo</h3>
            <p>
              {organization.cnpj ? "Pessoa Jurídica" : "Pessoa Física"}
            </p>
          </div>
          {organization.cnpj && (
            <div>
              <h3 className="font-medium text-sm">CNPJ</h3>
              <p>
                {formatCNPJ(String(organization.cnpj))}
              </p>
            </div>
          )}
          {organization.cpf && (
            <div>
              <h3 className="font-medium text-sm">CPF</h3>
              <p>
                {organization.cpf}
              </p>
            </div>
          )}
        </div>

        <div className="pt-4">
          <h3 className="font-medium text-sm mb-2">Endereço</h3>
          <p>
            {organization.endereco ? (
              <>
                {organization.endereco}
                {organization.numero && `, ${organization.numero}`}
                {organization.complemento && ` - ${organization.complemento}`}
                {organization.bairro && `, ${organization.bairro}`}
                <br />
                {organization.cidade && `${organization.cidade}`}
                {organization.estado && ` - ${organization.estado}`}
                {organization.cep && `, ${formatCEP(String(organization.cep))}`}
              </>
            ) : (
              "Endereço não informado"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}