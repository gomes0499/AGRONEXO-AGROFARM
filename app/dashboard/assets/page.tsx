import { getSession, getOrganizationId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AssetsPageContent } from "@/components/assets/assets-page-content";
import { getProperties, getImprovements } from "@/lib/actions/property-actions";
import { getEquipments, getInvestments, getAssetSales, getLandPlans } from "@/lib/actions/patrimonio-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssetsPage() {
  const session = await getSession();
  const organizationId = await getOrganizationId();

  if (!session?.organization || !session?.organizationId) {
    redirect("/auth/login");
  }

  // Fetch data for metrics with error handling
  const [
    properties,
    equipmentsResult,
    investmentsResult,
    improvements,
    assetSalesResult,
    landPlansResult,
  ] = await Promise.all([
    getProperties(organizationId).catch((err) => {
      console.error("Erro ao buscar propriedades:", err);
      return [];
    }),
    getEquipments(organizationId).catch((err) => {
      console.error("Erro ao buscar equipamentos:", err);
      return { data: [] };
    }),
    getInvestments(organizationId).catch((err) => {
      console.error("Erro ao buscar investimentos:", err);
      return { data: [] };
    }),
    getImprovements(organizationId).catch((err) => {
      console.error("Erro ao buscar benfeitorias:", err);
      return [];
    }),
    getAssetSales(organizationId).catch((err) => {
      console.error("Erro ao buscar vendas de ativos:", err);
      return { data: [] };
    }),
    getLandPlans(organizationId).catch((err) => {
      console.error("Erro ao buscar planos de aquisição:", err);
      return { data: [] };
    }),
  ]);

  // Extract data from results
  const equipments = 'data' in equipmentsResult ? equipmentsResult.data : [];
  const investments = 'data' in investmentsResult ? investmentsResult.data : [];
  const assetSales = 'data' in assetSalesResult ? assetSalesResult.data : [];
  const landPlans = 'data' in landPlansResult ? landPlansResult.data : [];

  return (
    <AssetsPageContent
      organizationId={organizationId}
      properties={properties}
      equipments={equipments}
      investments={investments}
      improvements={improvements}
      assetSales={assetSales}
      landPlans={landPlans}
    />
  );
}
