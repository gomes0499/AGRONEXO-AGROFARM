import { Metadata } from "next";
import { getTradingDebts } from "@/lib/actions/financial-actions";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { TradingDebtListing } from "@/components/financial/trading-debts/trading-debt-listing";

export const metadata: Metadata = {
  title: "Dívidas Trading | Financeiro | SR Consultoria",
  description: "Gerenciamento de dívidas com empresas trading",
};

export default async function TradingDebtsPage() {
  const session = await getSession();

  if (!session?.organization || !session?.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }

  const organization = {
    id: session.organizationId,
    nome: session.organization.nome,
  };

  const tradingDebts = await getTradingDebts(organization.id);

  return (
    <>
      <TradingDebtListing
        initialTradingDebts={tradingDebts}
        organization={organization}
      />
    </>
  );
}
