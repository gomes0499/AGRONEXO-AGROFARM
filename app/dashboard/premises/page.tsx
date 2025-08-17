import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { fetchProductionPageData } from "@/lib/actions/production/unified-production-actions";
import { PremisesPageClient } from "@/components/premises/premises-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Premissas | SR Consultoria",
  description: "Gestão de premissas de preços e cotações",
};

export default async function PremisesPage({
  searchParams,
}: {
  searchParams: Promise<{ projection?: string }>;
}) {
  await requireSuperAdmin();
  const organizationId = await getOrganizationId();

  const params = await searchParams;
  const projectionId = params.projection;

  // Fetch production data to get prices and exchange rates
  const productionData = await fetchProductionPageData(organizationId, {}, projectionId);

  return (
    <PremisesPageClient
      organizationId={organizationId}
      projectionId={projectionId}
      initialData={{
        cultures: productionData.cultures,
        systems: productionData.systems,
        cycles: productionData.cycles,
        safras: productionData.safras,
        commodityPrices: productionData.commodityPrices,
        exchangeRates: productionData.exchangeRates,
      }}
    />
  );
}