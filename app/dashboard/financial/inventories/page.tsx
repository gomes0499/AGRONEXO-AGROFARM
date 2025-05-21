import { Metadata } from "next";
import { getInventories } from "@/lib/actions/financial-actions";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InventoryListing } from "@/components/financial/inventory/inventory-listing";

export const metadata: Metadata = {
  title: "Estoques | Financeiro | SR Consultoria",
  description: "Gerenciamento de estoques de insumos, materiais e recursos",
};

export default async function InventoriesPage() {
  const session = await getSession();
  
  if (!session || !session.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }
  
  const organizationId = session.organizationId;
  const inventories = await getInventories(organizationId);
  
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
      <InventoryListing
        initialInventories={inventories}
        organization={organizationData}
      />
    </>
  );
}
