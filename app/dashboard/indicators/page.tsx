import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { getOrganizationId } from "@/lib/auth";
import { fetchIndicatorsPageData } from "@/lib/actions/indicators/unified-indicators-actions";
import { IndicatorsPageClient } from "@/components/indicators/indicators-page-client";

export default async function IndicatorsPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();

  // Obter organização do usuário
  const organizationId = await getOrganizationId();

  // Fetch all indicators data with the unified action
  const indicatorsData = await fetchIndicatorsPageData(organizationId);

  return <IndicatorsPageClient initialData={indicatorsData} />;
}
