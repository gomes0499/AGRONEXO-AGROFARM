import { Metadata } from "next";
import { getOrganizationId, getSession } from "@/lib/auth";
import { fetchFinancialPageData } from "@/lib/actions/financial/unified-financial-actions";
import { FinancialPageClient } from "@/components/financial/financial-page-client";

export const metadata: Metadata = {
  title: "Financeiro | SR Consultoria",
  description: "Gestão financeira e controle de dívidas e disponibilidades",
};

export default async function FinancialPage() {
  const session = await getSession();
  const organizationId = await getOrganizationId();

  if (!session?.organization || !session?.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }

  const organization = {
    id: session.organizationId,
    nome: session.organization.nome,
  };

  // Fetch all financial data with the unified action
  const financialData = await fetchFinancialPageData(organizationId);

  return (
    <FinancialPageClient
      organization={organization}
      organizationId={organizationId}
      initialData={financialData}
    />
  );
}
