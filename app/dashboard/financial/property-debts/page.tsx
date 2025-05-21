import { Metadata } from "next";
import { getPropertyDebts } from "@/lib/actions/financial-actions";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { PropertyDebtListing } from "@/components/financial/property-debts/property-debt-listing";

export const metadata: Metadata = {
  title: "Dívidas de Imóveis | Financeiro | SR Consultoria",
  description: "Gerenciamento de dívidas relacionadas a imóveis e propriedades",
};

export default async function PropertyDebtsPage() {
  const session = await getSession();

  if (!session?.organization || !session?.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }

  const organization = {
    id: session.organizationId,
    nome: session.organization.nome,
  };

  const propertyDebts = await getPropertyDebts(organization.id);

  // Filtrar para garantir que somente dívidas com propriedade não nula sejam passadas
  const propertyDebtsWithValidProp = propertyDebts.map(debt => ({
    ...debt,
    propriedade: debt.propriedade || { id: '', nome: 'Propriedade não informada' }
  }));

  return (
    <>
      <PropertyDebtListing
        organization={organization}
        initialPropertyDebts={propertyDebtsWithValidProp}
      />
    </>
  );
}
