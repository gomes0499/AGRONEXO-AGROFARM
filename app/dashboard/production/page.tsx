import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { fetchProductionPageData } from "@/lib/actions/production/unified-production-actions";
import { ProductionPageClient } from "@/components/production/production-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Produção Agrícola | SR Consultoria",
  description: "Gestão de produção agrícola e pecuária",
};

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ projection?: string }>;
}) {
  await requireSuperAdmin();
  const organizationId = await getOrganizationId();

  const params = await searchParams;
  const projectionId = params.projection;

  // Fetch all production data with the unified action
  const productionData = await fetchProductionPageData(organizationId, {
    // Add filters if needed based on searchParams
  }, projectionId);

  return (
    <ProductionPageClient
      organizationId={organizationId}
      projectionId={projectionId}
      initialData={productionData}
    />
  );
}
