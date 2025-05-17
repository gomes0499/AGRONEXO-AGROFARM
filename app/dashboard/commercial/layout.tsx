import { SiteHeader } from "@/components/dashboard/site-header";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { DollarSign } from "lucide-react";
import { getPrices } from "@/lib/actions/commercial-actions";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";

export default async function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Buscar o usuário e a organização atual
  const user = await verifyUserPermission();
  const supabase = await createClient();

  // Determinar a organização do usuário
  let organizationId = null;

  // Verificar se existe organização nos metadados do usuário autenticado
  if (user.user_metadata?.organizacao?.id) {
    organizationId = user.user_metadata.organizacao.id;
  } else {
    // Buscar a primeira organização associada ao usuário
    const { data: associacao } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();

    if (associacao) {
      organizationId = associacao.organizacao_id;
    }
  }

  // Buscar os preços mais recentes para o Market Ticker
  let latestPrice = null;
  if (organizationId) {
    const pricesResponse = await getPrices(organizationId);
    latestPrice =
      Array.isArray(pricesResponse) && pricesResponse.length > 0
        ? pricesResponse[0]
        : null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Comercial" />

      <div className=" space-y-6">
        <div className="w-full">
          <div className="px-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
