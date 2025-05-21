import { Metadata } from "next";
import { getThirdPartyLoans } from "@/lib/actions/financial-actions";
import { getSession } from "@/lib/auth";
import { LoanListing } from "@/components/financial/loans/loan-listing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Empréstimos a Terceiros | Financeiro | SR Consultoria",
  description: "Gerenciamento de empréstimos concedidos a terceiros",
};

export default async function ThirdPartyLoansPage() {
  const session = await getSession();
  
  if (!session || !session.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }
  
  const organizationId = session.organizationId;
  const loans = await getThirdPartyLoans(organizationId);
  
  // Buscar informações da organização se não estiverem disponíveis no session
  let organization = session.organization;
  
  if (!organization || !organization.nome) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("organizacoes")
      .select("id, nome")
      .eq("id", organizationId)
      .single();
      
    organization = data;
  }
  
  // Garantir que temos pelo menos o ID e nome
  const organizationData = {
    id: organizationId,
    nome: organization?.nome || "Organização"
  };

  return (
    <>
      <LoanListing organization={organizationData} initialLoans={loans} />
    </>
  );
}
