import { Metadata } from "next";
import { getLiquidityFactors } from "@/lib/actions/financial-actions";
import { getOrganizationId } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { LiquidityFactorListing } from "@/components/financial/liquidity/liquidity-factor-listing";

export const metadata: Metadata = {
  title: "Fatores de Liquidez | Financeiro | SR Consultoria",
  description:
    "Gerenciamento de fatores de liquidez como caixa, banco e investimentos",
};

export default async function LiquidityFactorsPage() {
  const organizationId = await getOrganizationId();
  const liquidityFactors = await getLiquidityFactors(organizationId);

  // Criar objeto de organização adequado
  const organization = {
    id: organizationId,
    nome: "Organização" // Nome padrão, será usado internamente apenas
  };

  return (
    <>
      <LiquidityFactorListing
        initialLiquidityFactors={liquidityFactors}
        organization={organization}
      />
    </>
  );
}
