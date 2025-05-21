import { Metadata } from "next";
import { getBankDebts } from "@/lib/actions/financial-actions";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { BankDebtListing } from "@/components/financial/bank-debts/bank-debt-listing";
import { NewBankDebtButton } from "@/components/financial/bank-debts/new-bank-debt-button";

export const metadata: Metadata = {
  title: "Dívidas Bancárias | Financeiro | SR Consultoria",
  description: "Gerenciamento de dívidas bancárias",
};

export default async function BankDebtsPage() {
  const session = await getSession();

  if (!session?.organization || !session?.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }

  const organization = {
    id: session.organizationId,
    nome: session.organization.nome,
  };

  const bankDebts = await getBankDebts(organization.id);

  return (
    <>
      <BankDebtListing
        organization={organization}
        initialBankDebts={bankDebts}
      />
    </>
  );
}
