import { Metadata } from "next";
import { getCommodityInventories } from "@/lib/actions/financial-actions";
import { CommodityInventoryListing } from "@/components/financial/commodity-inventory/commodity-inventory-listing";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Estoques de Commodities | Financeiro | SR Consultoria",
  description: "Gerenciamento de estoques de commodities agrícolas",
};

export default async function CommodityStocksPage() {
  const session = await getSession();
  
  if (!session || !session.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }
  
  const organizationId = session.organizationId;
  const commodityInventories = await getCommodityInventories(organizationId);
  
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
    <div>
      <CommodityInventoryListing
        organization={organizationData}
        initialCommodityInventories={commodityInventories}
      />
    </div>
  );
}
