import { Metadata } from "next";
import { getSuppliers } from "@/lib/actions/financial-actions";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SupplierListing } from "@/components/financial/suppliers/supplier-listing";

export const metadata: Metadata = {
  title: "Fornecedores | Financeiro | SR Consultoria",
  description: "Gerenciamento de fornecedores e pagamentos",
};

export default async function SuppliersPage() {
  const session = await getSession();
  const organizationId = session?.organization?.id;
  
  if (!organizationId) {
    throw new Error("ID da organização não encontrado");
  }
  
  const suppliers = await getSuppliers(organizationId);
  
  const organization = {
    id: organizationId,
    nome: session?.organization?.name || "Organização"
  };

  return (
    <>
      <SupplierListing
        organization={organization}
        initialSuppliers={suppliers}
      />
    </>
  );
}
