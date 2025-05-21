import { Metadata } from "next";
import { getReceivableContracts } from "@/lib/actions/financial-actions";
import { ReceivableListing } from "@/components/financial/receivables/receivable-listing";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Contratos Recebíveis | Financeiro | SR Consultoria",
  description: "Gerenciamento de contratos recebíveis e valores a receber",
};

export default async function ReceivablesPage() {
  const session = await getSession();
  const organizationId = session?.organization?.id;
  
  if (!organizationId) {
    throw new Error("ID da organização não encontrado");
  }
  
  const receivables = await getReceivableContracts(organizationId);
  
  const organization = {
    id: organizationId,
    nome: session?.organization?.name || "Organização"
  };

  return (
    <>
      <ReceivableListing
        organization={organization}
        initialReceivables={receivables}
      />
    </>
  );
}
