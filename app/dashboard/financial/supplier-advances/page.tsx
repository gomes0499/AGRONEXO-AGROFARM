import { Metadata } from "next";
import { getSupplierAdvances } from "@/lib/actions/financial-actions";
import { AdvanceListing } from "@/components/financial/advances/advance-listing";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Adiantamentos a Fornecedores | Financeiro | SR Consultoria",
  description: "Gerenciamento de adiantamentos realizados a fornecedores",
};

export default async function SupplierAdvancesPage() {
  const session = await getSession();
  const organizationId = session?.organization?.id;
  
  if (!organizationId) {
    throw new Error("ID da organização não encontrado");
  }
  
  const advances = await getSupplierAdvances(organizationId);
  
  const organization = {
    id: organizationId,
    nome: session?.organization?.name || "Organização"
  };

  return (
    <>
      <AdvanceListing
        organization={organization}
        initialAdvances={advances}
      />
    </>
  );
}
